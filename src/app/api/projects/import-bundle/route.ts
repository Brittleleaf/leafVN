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
      return NextResponse.json({ error: 'No se recibió ningún archivo .leafvn válido.' }, { status: 400 });
    }

    const story = await unpackProjectBundle(buffer);

    return NextResponse.json({
      success: true,
      message: `Proyecto "${story.title}" importado con éxito con todos sus assets.`,
      story,
    });
  } catch (error: any) {
    console.error('Error al importar paquete .leafvn:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al desempaquetar el proyecto .leafvn' },
      { status: 500 }
    );
  }
}
