import { NextRequest, NextResponse } from 'next/server';
import { getAllItems } from '@/lib/db';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY, USER_SESSION_COOKIE } from '@/lib/config';
import { getSessionUser } from '@/lib/userDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const allItems = await getAllItems();

    // 1. Check if Admin
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME);
    const headerKey = req.headers.get('x-passkey');
    const isAdmin = adminCookie?.value === ADMIN_COOKIE_VALUE || headerKey === ADMIN_PASSKEY;

    if (isAdmin) {
      // Owner/Admin sees all cluster files
      return NextResponse.json({ success: true, items: allItems, scope: 'admin' });
    }

    // 2. Check if Authenticated User
    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    if (userToken) {
      const user = await getSessionUser(userToken);
      if (user) {
        // User sees ONLY their own uploaded files
        const userItems = allItems.filter(
          (item) =>
            item.ownerUsername &&
            item.ownerUsername.toLowerCase() === user.username.toLowerCase()
        );
        return NextResponse.json({
          success: true,
          items: userItems,
          scope: 'user',
          owner: user.username,
        });
      }
    }

    // 3. Unauthenticated Guest: Private security mode (strictly 0 files exposed)
    return NextResponse.json({
      success: true,
      items: [],
      scope: 'guest',
      message: 'Private CloudDrive: Sign in to access your personal storage vault.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve cluster items' },
      { status: 500 }
    );
  }
}
