import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY } from '@/lib/config';
import { deleteUser, getUserByUsername } from '@/lib/userDb';

export const runtime = 'nodejs';

function isAdminAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value === ADMIN_COOKIE_VALUE) return true;
  const headerKey = req.headers.get('x-passkey');
  if (headerKey === ADMIN_PASSKEY) return true;
  return false;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin passkey required' }, { status: 401 });
  }

  try {
    const { username } = await params;
    const existing = await getUserByUsername(username);

    if (!existing) {
      return NextResponse.json({ error: 'User not found in cluster' }, { status: 404 });
    }

    const success = await deleteUser(username);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete user record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User account @${username} purged from user cluster`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion error' }, { status: 500 });
  }
}
