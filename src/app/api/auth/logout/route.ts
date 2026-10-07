import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, USER_SESSION_COOKIE } from '@/lib/config';
import { deleteSession } from '@/lib/userDb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
  if (userToken) {
    try {
      await deleteSession(userToken);
    } catch (err) {
      console.warn('Session revocation non-critical error:', err);
    }
  }

  const res = NextResponse.json({ success: true, message: 'Signed out successfully' });

  // Clear admin cookie
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });

  // Clear user session cookie
  res.cookies.set({
    name: USER_SESSION_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
  });

  return res;
}
