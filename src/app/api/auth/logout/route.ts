import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/config';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true, message: 'Logged out' });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });
  return res;
}
