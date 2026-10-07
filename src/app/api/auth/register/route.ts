import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession } from '@/lib/userDb';
import { USER_SESSION_COOKIE } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, name } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Register user in distributed anytimeview-users repository
    const user = await createUser({
      username,
      email,
      password,
      name,
    });

    // Create session token
    const token = await createSession(user);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        storageUsed: user.storageUsed,
        filesCount: user.filesCount,
        createdAt: user.createdAt,
      },
      message: 'CloudDrive account created successfully',
    });

    // Set 30-day session cookie
    res.cookies.set({
      name: USER_SESSION_COOKIE,
      value: token,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create CloudDrive account' },
      { status: 400 }
    );
  }
}
