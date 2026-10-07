import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, ADMIN_PASSKEY } from '@/lib/config';
import { uploadToStorage, saveItem, ViewItem } from '@/lib/db';
import path from 'path';

export const runtime = 'nodejs';
// Allow larger media uploads
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value === ADMIN_COOKIE_VALUE) return true;
  const headerKey = req.headers.get('x-passkey');
  if (headerKey === ADMIN_PASSKEY) return true;
  return false;
}

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

  // Default to image if unknown media or fallback
  return 'image';
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin passkey required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const tagsRaw = (formData.get('tags') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = detectFileType(file.name, file.type);
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    // 1. Upload to storage cluster release with embedded metadata
    const finalTitle = title.trim() || file.name;
    const uploaded = await uploadToStorage(buffer, file.name, file.type, {
      title: finalTitle,
      fileType,
      tags,
    });

    // 2. Build metadata record
    const newItem: ViewItem = {
      id: `view_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      title: title.trim() || file.name,
      fileType,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
      url: uploaded.url,
      assetId: uploaded.assetId,
      uploadedAt: new Date().toISOString(),
      clusterNodes: ['Kolkata Node', 'Israel Gateway', 'US Central Core'],
      tags,
    };

    // 3. Save to database repository
    await saveItem(newItem);

    return NextResponse.json({
      success: true,
      item: newItem,
      message: 'Asset successfully synchronized across Kolkata, Israel, and US clusters.',
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process cluster upload' },
      { status: 500 }
    );
  }
}
