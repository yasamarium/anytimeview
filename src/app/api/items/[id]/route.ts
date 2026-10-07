import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY, USER_SESSION_COOKIE } from '@/lib/config';
import { deleteItemById, getItemById } from '@/lib/db';
import { getSessionUser, updateUserStats } from '@/lib/userDb';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found on cluster' }, { status: 404 });
    }

    // Check permissions
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME);
    const headerKey = req.headers.get('x-passkey');
    const isAdmin = adminCookie?.value === ADMIN_COOKIE_VALUE || headerKey === ADMIN_PASSKEY;

    let user = null;
    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    if (userToken) {
      user = await getSessionUser(userToken);
    }

    const isOwner = user && item.ownerUsername && item.ownerUsername === user.username;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to delete this file' },
        { status: 403 }
      );
    }

    const success = await deleteItemById(id);

    if (!success) {
      return NextResponse.json({ error: 'Deletion failed from storage cluster' }, { status: 500 });
    }

    // Decrement user storage stats if owned by a user
    if (item.ownerUsername && item.fileSize) {
      try {
        await updateUserStats(item.ownerUsername, -item.fileSize, -1);
      } catch (err) {
        console.warn('Failed to update stats on deletion:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted from distributed cluster successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Deletion failed' }, { status: 500 });
  }
}
