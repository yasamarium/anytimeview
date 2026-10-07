import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSKEY, ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passkey } = body;

    if (!passkey || passkey.trim() !== ADMIN_PASSKEY) {
      return NextResponse.json(
        { error: 'Invalid cluster passkey. Access denied.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      success: true,
      message: 'Node admin authenticated successfully.',
    });

    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: ADMIN_COOKIE_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
