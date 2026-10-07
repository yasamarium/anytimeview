import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY } from '@/lib/config';
import {
  getAllSystemUpdates,
  saveSystemUpdate,
  SystemUpdate,
  uploadToStorage,
  saveItem,
  ViewItem,
} from '@/lib/db';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAdminAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value === ADMIN_COOKIE_VALUE) return true;
  const headerKey = req.headers.get('x-passkey');
  if (headerKey === ADMIN_PASSKEY) return true;
  return false;
}

function detectFileType(fileName: string, mime: string): 'video' | 'image' | 'pdf' {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mkv', 'avi'].includes(ext))
    return 'video';
  return 'image';
}

export async function GET() {
  try {
    const updates = await getAllSystemUpdates();
    return NextResponse.json({ success: true, updates });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch system updates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin passkey required to publish system updates' },
      { status: 401 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let title = '';
    let content = '';
    let type: 'announcement' | 'feature' | 'maintenance' | 'media' = 'announcement';
    let targetNode: string | undefined = undefined;
    let tags: string[] = [];
    let attachedItem: ViewItem | undefined = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      title = (formData.get('title') as string) || '';
      content = (formData.get('content') as string) || '';
      type = ((formData.get('type') as string) || 'announcement') as any;
      targetNode = (formData.get('targetNode') as string) || undefined;
      const tagsRaw = (formData.get('tags') as string) || '';
      if (tagsRaw) {
        tags = tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      }

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileType = detectFileType(file.name, file.type);
        const uploaded = await uploadToStorage(buffer, file.name, file.type, {
          title: title || file.name,
          fileType,
          tags: ['system_update', ...tags],
          ownerUsername: 'System Admin',
          targetNode,
        });

        const itemId = `view_sys_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        attachedItem = {
          id: itemId,
          title: title || file.name,
          fileType,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || 'application/octet-stream',
          url: uploaded.url,
          cdnUrl: `/api/cdn/${itemId}`,
          assetId: uploaded.assetId,
          uploadedAt: new Date().toISOString(),
          clusterNodes: targetNode ? [targetNode] : ['Kolkata Node', 'Israel Gateway', 'US Central Core'],
          targetNode,
          tags: ['system_update', ...tags],
          ownerUsername: 'System Admin',
          isPublic: true,
        };

        await saveItem(attachedItem);
        type = 'media';
      }
    } else {
      const body = await req.json();
      title = body.title || '';
      content = body.content || '';
      type = body.type || 'announcement';
      targetNode = body.targetNode;
      tags = body.tags || [];
    }

    if (!title && !content && !attachedItem) {
      return NextResponse.json(
        { error: 'System update must contain a title, message, or file' },
        { status: 400 }
      );
    }

    const newUpdate: SystemUpdate = {
      id: `sysup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'System Broadcast',
      content: content.trim(),
      type,
      createdAt: new Date().toISOString(),
      item: attachedItem,
      targetNode,
      tags,
      author: 'System Admin',
    };

    const updatedList = await saveSystemUpdate(newUpdate);

    return NextResponse.json({
      success: true,
      update: newUpdate,
      totalUpdates: updatedList.length,
      message: 'System update broadcasted across Kolkata, Israel & US clusters.',
    });
  } catch (err: any) {
    console.error('System update broadcast error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to publish system update' },
      { status: 500 }
    );
  }
}
