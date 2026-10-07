import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY } from '@/lib/config';
import { deleteSystemUpdate } from '@/lib/db';

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
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin passkey required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await deleteSystemUpdate(id);

    if (!success) {
      return NextResponse.json({ error: 'System update not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'System update removed successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion failed' }, { status: 500 });
  }
}
