import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY, USER_SESSION_COOKIE } from '@/lib/config';
import { uploadToStorage, saveItem, ViewItem } from '@/lib/db';
import { getSessionUser, updateUserStats } from '@/lib/userDb';
import path from 'path';

export const runtime = 'nodejs';
// Allow larger media uploads
export const maxDuration = 60;

function detectFileType(fileName: string, mime: string): 'video' | 'image' | 'pdf' {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');

  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }

  if (
    mime.startsWith('video/') ||
    ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv', 'avi'].includes(ext)
  ) {
    return 'video';
  }

  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext)
  ) {
    return 'image';
  }

  return 'image';
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check authorization (either Admin or Logged-in User)
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME);
    const headerKey = req.headers.get('x-passkey');
    const isAdmin = adminCookie?.value === ADMIN_COOKIE_VALUE || headerKey === ADMIN_PASSKEY;

    let user = null;
    const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;
    if (userToken) {
      user = await getSessionUser(userToken);
    }

    if (!isAdmin && !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to your CloudDrive account to upload.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const tagsRaw = (formData.get('tags') as string) || '';
    const targetNode = (formData.get('targetNode') as string) || '';
    const isPublic = formData.get('isPublic') !== 'false';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = detectFileType(file.name, file.type);
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const ownerUsername = user ? user.username : 'admin';
    const ownerId = user ? user.id : 'admin';

    // 2. Determine cluster nodes based on user's node selection
    const isSpecificNode = targetNode && targetNode !== 'Global Geo-Replicated';
    const clusterNodes = isSpecificNode
      ? [targetNode]
      : ['Kolkata Node', 'Israel Gateway', 'US Central Core'];

    // 3. Upload to storage cluster release with embedded metadata
    const finalTitle = title.trim() || file.name;
    const uploaded = await uploadToStorage(buffer, file.name, file.type, {
      title: finalTitle,
      fileType,
      tags,
      ownerUsername,
      ownerId,
      targetNode: isSpecificNode ? targetNode : undefined,
    });

    const itemId = `view_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 4. Build metadata record with direct CDN URL on our domain
    const newItem: ViewItem = {
      id: itemId,
      title: finalTitle,
      fileType,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
      url: uploaded.url,
      cdnUrl: `/api/cdn/${itemId}`,
      assetId: uploaded.assetId,
      uploadedAt: new Date().toISOString(),
      clusterNodes,
      targetNode: isSpecificNode ? targetNode : 'Global Geo-Replicated',
      tags,
      ownerUsername,
      ownerId,
      isPublic,
    };

    // 5. Save to distributed metadata repository
    await saveItem(newItem);

    // 6. If uploaded from Admin Panel, auto-broadcast to System Updates!
    if (isAdmin && !user) {
      try {
        const { saveSystemUpdate } = await import('@/lib/db');
        await saveSystemUpdate({
          id: `sysup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: finalTitle,
          content: `New administrative release synchronized across ${clusterNodes.join(', ')}.`,
          type: 'media',
          createdAt: new Date().toISOString(),
          item: newItem,
          targetNode: isSpecificNode ? targetNode : 'Global Geo-Replicated',
          tags: ['admin_release', ...tags],
          author: 'System Admin',
        });
      } catch (err) {
        console.warn('System update auto-publish non-critical error:', err);
      }
    }

    // 5. Update user storage stats if authenticated user
    if (user) {
      try {
        await updateUserStats(user.username, file.size, 1);
      } catch (err) {
        console.warn('Failed to increment user stats:', err);
      }
    }

    return NextResponse.json({
      success: true,
      item: newItem,
      message: 'File successfully synchronized across Kolkata, Israel, and US storage clusters.',
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process storage cluster upload' },
      { status: 500 }
    );
  }
}
