import { NextRequest, NextResponse } from 'next/server';
import { createProjectBundle, sanitizeProjectId, loadProject } from '@/lib/vn/projectFs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const safeId = sanitizeProjectId(id);
    const bundleBuffer = await createProjectBundle(safeId);

    if (!bundleBuffer) {
      return NextResponse.json({ error: `Proyecto "${id}" no encontrado.` }, { status: 404 });
    }

    const story = loadProject(safeId);
    const safeTitle = (story?.title || safeId)
      .toLowerCase()
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_');

    return new NextResponse(bundleBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-leafvn',
        'Content-Disposition': `attachment; filename="${safeTitle}.leafvn"`,
        'Content-Length': bundleBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error al generar paquete .leafvn:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
