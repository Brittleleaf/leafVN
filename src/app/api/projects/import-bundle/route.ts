import { NextRequest, NextResponse } from 'next/server';
import { unpackProjectBundle } from '@/lib/vn/projectFs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo .leafvn' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const story = await unpackProjectBundle(buffer);

    return NextResponse.json({
      success: true,
      message: `Proyecto "${story.title}" importado con éxito con todos sus assets.`,
      story,
    });
  } catch (error: any) {
    console.error('Error al importar paquete .leafvn:', error);
    return NextResponse.json({ error: error?.message || 'Error al importar paquete' }, { status: 500 });
  }
}
