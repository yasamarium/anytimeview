import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE } from '@/lib/config';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  const isAuthenticated = cookie?.value === ADMIN_COOKIE_VALUE;

  return NextResponse.json({ authenticated: isAuthenticated });
}
