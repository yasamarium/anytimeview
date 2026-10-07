import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/userDb';
import { USER_SESSION_COOKIE } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(USER_SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await getSessionUser(token);

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        storageUsed: user.storageUsed || 0,
        filesCount: user.filesCount || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Session verification error:', err);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
