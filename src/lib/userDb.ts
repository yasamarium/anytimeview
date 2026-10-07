import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getClusterToken, getClusterOwner } from './db';

const USERS_REPO = 'anytimeview-users';

export interface CloudUser {
  id: string;
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl: string;
  createdAt: string;
  storageUsed: number; // bytes
  filesCount: number;
}

export interface UserSession {
  token: string;
  userId: string;
  username: string;
  createdAt: string;
  expiresAt: string;
}

function getHeaders() {
  const token = getClusterToken();
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AnytimeView-CloudUserEngine/1.0',
  };
}

async function fetchFromUsersRepo(filePath: string): Promise<any | null> {
  const owner = getClusterOwner();
  const url = `https://api.github.com/repos/${owner}/${USERS_REPO}/contents/${filePath}`;

  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      cache: 'no-store',
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`User repo fetch failed ${res.status}:`, url);
      return null;
    }

    const data = await res.json();
    if (!data.content) return null;

    const raw = Buffer.from(data.content, 'base64').toString('utf8');
    return { data: JSON.parse(raw), sha: data.sha };
  } catch (err) {
    console.error('fetchFromUsersRepo error:', err);
    return null;
  }
}

async function saveToUsersRepo(
  filePath: string,
  contentObj: any,
  commitMessage: string,
  sha?: string
): Promise<boolean> {
  const owner = getClusterOwner();
  const url = `https://api.github.com/repos/${owner}/${USERS_REPO}/contents/${filePath}`;

  const base64Content = Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      content: base64Content,
      ...(sha ? { sha } : {}),
    }),
  });

  return res.ok;
}

async function deleteFromUsersRepo(filePath: string, commitMessage: string): Promise<boolean> {
  const owner = getClusterOwner();
  const existing = await fetchFromUsersRepo(filePath);
  if (!existing || !existing.sha) return true;

  const url = `https://api.github.com/repos/${owner}/${USERS_REPO}/contents/${filePath}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: commitMessage,
      sha: existing.sha,
    }),
  });

  return res.ok;
}

// ----------------- USER OPERATIONS -----------------

export async function getUserByUsername(username: string): Promise<CloudUser | null> {
  const clean = username.trim().toLowerCase();
  const res = await fetchFromUsersRepo(`users/${clean}.json`);
  return res ? res.data : null;
}

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  name?: string;
}): Promise<CloudUser> {
  const cleanUsername = data.username.trim().toLowerCase();

  // Validate username
  if (!/^[a-zA-Z0-9_-]{3,24}$/.test(cleanUsername)) {
    throw new Error('Username must be 3-24 characters and only contain letters, numbers, and dashes.');
  }

  const existing = await getUserByUsername(cleanUsername);
  if (existing) {
    throw new Error('This username is already registered. Please choose another or sign in.');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user: CloudUser = {
    id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    username: cleanUsername,
    email: data.email.trim().toLowerCase(),
    name: data.name?.trim() || cleanUsername,
    passwordHash,
    avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
    createdAt: new Date().toISOString(),
    storageUsed: 0,
    filesCount: 0,
  };

  const success = await saveToUsersRepo(
    `users/${cleanUsername}.json`,
    user,
    `Register CloudDrive user: @${cleanUsername}`
  );

  if (!success) {
    throw new Error('Failed to register user into cluster. Please try again.');
  }

  return user;
}

export async function verifyUserPassword(
  usernameOrEmail: string,
  plainPassword: string
): Promise<CloudUser | null> {
  const clean = usernameOrEmail.trim().toLowerCase();
  let user = await getUserByUsername(clean);

  // If not found by username, try searching by email
  if (!user && clean.includes('@')) {
    // In production, an email index can be kept; for simplicity query users
    user = await getUserByUsername(clean.split('@')[0]);
  }

  if (!user) return null;

  const valid = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!valid) return null;

  return user;
}

export async function updateUserStats(
  username: string,
  deltaBytes: number,
  deltaCount: number
): Promise<void> {
  const clean = username.trim().toLowerCase();
  const existing = await fetchFromUsersRepo(`users/${clean}.json`);
  if (!existing || !existing.data) return;

  const user: CloudUser = existing.data;
  user.storageUsed = Math.max(0, (user.storageUsed || 0) + deltaBytes);
  user.filesCount = Math.max(0, (user.filesCount || 0) + deltaCount);

  await saveToUsersRepo(
    `users/${clean}.json`,
    user,
    `Update storage stats for @${clean}`,
    existing.sha
  );
}

// ----------------- SESSION OPERATIONS -----------------

export async function createSession(user: CloudUser): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const session: UserSession = {
    token,
    userId: user.id,
    username: user.username,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  await saveToUsersRepo(
    `sessions/${token}.json`,
    session,
    `Create auth session for @${user.username}`
  );

  return token;
}

export async function getSessionUser(token: string): Promise<CloudUser | null> {
  if (!token) return null;
  const res = await fetchFromUsersRepo(`sessions/${token}.json`);
  if (!res || !res.data) return null;

  const session: UserSession = res.data;
  if (new Date(session.expiresAt) < new Date()) {
    // Expired
    await deleteSession(token);
    return null;
  }

  return await getUserByUsername(session.username);
}

export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  await deleteFromUsersRepo(`sessions/${token}.json`, 'Revoke session');
}

export async function getAllUsers(): Promise<CloudUser[]> {
  const owner = getClusterOwner();
  const url = `https://api.github.com/repos/${owner}/${USERS_REPO}/contents/users`;
  try {
    const res = await fetch(url, { headers: getHeaders(), cache: 'no-store' });
    if (!res.ok) return [];
    const files = await res.json();
    if (!Array.isArray(files)) return [];

    const users: CloudUser[] = [];
    for (const f of files) {
      if (f.name.endsWith('.json')) {
        const u = await getUserByUsername(f.name.replace('.json', ''));
        if (u) users.push(u);
      }
    }
    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('getAllUsers error:', err);
    return [];
  }
}

export async function deleteUser(username: string): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  return await deleteFromUsersRepo(`users/${clean}.json`, `Purge user account @${clean}`);
}
