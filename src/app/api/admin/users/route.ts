import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY } from '@/lib/config';
import { getAllUsers } from '@/lib/userDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value === ADMIN_COOKIE_VALUE) return true;
  const headerKey = req.headers.get('x-passkey');
  if (headerKey === ADMIN_PASSKEY) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin passkey required' }, { status: 401 });
  }

  try {
    const users = await getAllUsers();
    // Sanitize password hashes out of admin response for safety
    const sanitized = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      storageUsed: u.storageUsed || 0,
      filesCount: u.filesCount || 0,
    }));

    return NextResponse.json({ success: true, users: sanitized });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve cluster users' },
      { status: 500 }
    );
  }
}
