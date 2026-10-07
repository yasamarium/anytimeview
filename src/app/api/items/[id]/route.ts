import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY } from '@/lib/config';
import { deleteItemById } from '@/lib/db';

function isAuthorized(req: NextRequest): boolean {
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
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin passkey required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const success = await deleteItemById(id);

    if (!success) {
      return NextResponse.json({ error: 'Item not found or deletion failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted from distributed cluster successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion failed' }, { status: 500 });
  }
}
