import { NextRequest, NextResponse } from 'next/server';
import { loadProject, saveProject, deleteProject } from '@/lib/vn/projectFs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = loadProject(id);
    if (!story) {
      return NextResponse.json({ error: `Proyecto "${id}" no encontrado.` }, { status: 404 });
    }
    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    console.error('Error al cargar proyecto:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const story = body.story || body;

    if (!story || !story.id) {
      return NextResponse.json({ error: 'Datos de historia inválidos' }, { status: 400 });
    }

    const saved = saveProject(id, story);
    if (!saved) {
      return NextResponse.json({ error: 'Error al escribir el proyecto en disco.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Proyecto "${id}" guardado en disco exitosamente.` });
  } catch (error: any) {
    console.error('Error al guardar proyecto:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteProject(id);
    if (!deleted) {
      return NextResponse.json({ error: `No se pudo eliminar el proyecto "${id}".` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Proyecto "${id}" eliminado.` });
  } catch (error: any) {
    console.error('Error al eliminar proyecto:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
