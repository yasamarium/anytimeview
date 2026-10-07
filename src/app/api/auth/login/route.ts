import { NextRequest, NextResponse } from 'next/server';
import { verifyUserPassword, createSession } from '@/lib/userDb';
import { USER_SESSION_COOKIE } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required' },
        { status: 400 }
      );
    }

    const user = await verifyUserPassword(username, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials. Please verify username and password.' },
        { status: 401 }
      );
    }

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
      message: `Welcome back, @${user.username}`,
    });

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
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
