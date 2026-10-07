import { NextResponse } from 'next/server';
import { getAllItems } from '@/lib/db';

export async function GET() {
  try {
    const items = await getAllItems();
    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve cluster items' },
      { status: 500 }
    );
  }
}
