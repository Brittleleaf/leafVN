import { NextRequest, NextResponse } from 'next/server';
import { unpackProjectBundle } from '@/lib/vn/projectFs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let buffer: Buffer | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
    } else {
      // Recepción binaria directa
      const arrayBuffer = await req.arrayBuffer();
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        buffer = Buffer.from(arrayBuffer);
      }
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'No valid .leafvn bundle file received.' }, { status: 400 });
    }

    const story = await unpackProjectBundle(buffer);

    return NextResponse.json({
      success: true,
      message: `Project "${story.title}" imported successfully with all assets.`,
      story,
    });
  } catch (error: any) {
    console.error('Error importing .leafvn bundle:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error unpacking .leafvn bundle' },
      { status: 500 }
    );
  }
}
