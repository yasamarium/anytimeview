import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
      return NextResponse.json(
        { error: 'Media asset not found in distributed cluster' },
        { status: 404 }
      );
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1';
    const rangeHeader = req.headers.get('range');

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'AnytimeView-CDN-Engine/1.0',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const upstreamRes = await fetch(item.url, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.json(
        { error: `Upstream storage fetch failed with status ${upstreamRes.status}` },
        { status: upstreamRes.status }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Content-Type',
      item.contentType || upstreamRes.headers.get('content-type') || 'application/octet-stream'
    );
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Custom cluster edge header
    responseHeaders.set('X-CDN-Cluster-Nodes', 'Kolkata, Israel, US');
    responseHeaders.set('X-Served-By', 'AnytimeView-Edge-CDN');

    const dispositionType = isDownload ? 'attachment' : 'inline';
    responseHeaders.set(
      'Content-Disposition',
      `${dispositionType}; filename="${encodeURIComponent(item.fileName)}"`
    );

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('CDN stream error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal error streaming from cluster' },
      { status: 500 }
    );
  }
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getItemById(id);

    if (!item) {
      return new Response(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', item.contentType || 'application/octet-stream');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', item.fileSize.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-CDN-Cluster-Nodes', 'Kolkata, Israel, US');

    return new Response(null, {
      status: 200,
      headers,
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
