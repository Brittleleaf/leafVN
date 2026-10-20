import { NextRequest, NextResponse } from 'next/server';
import {
  listProjectAssets,
  saveProjectAsset,
  saveProjectExternalAsset,
  deleteProjectAsset,
  renameProjectAsset,
} from '@/lib/vn/projectFs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assets = listProjectAssets(id);
    return NextResponse.json({ success: true, projectId: id, assets });
  } catch (error: any) {
    console.error('Error al listar assets del proyecto:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentType = req.headers.get('content-type') || '';

    // Indexación de URLs externas (sin almacenar el archivo físico)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { name, url, assetType, category, description } = body;

      if (!url || !url.trim()) {
        return NextResponse.json({ error: 'Se requiere una URL válida para indexar el recurso.' }, { status: 400 });
      }

      const asset = saveProjectExternalAsset(id, {
        name: name || 'Web Asset',
        url: url.trim(),
        assetType: assetType || 'background',
        category: category || 'Web Links',
        description: description || '',
      });

      return NextResponse.json({
        success: true,
        asset,
        projectId: id,
      });
    }

    // Subida física de archivo desde PC
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const assetType = (formData.get('assetType') as string) || 'sfx';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = saveProjectAsset(id, assetType, buffer, file.name);

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
      filePath: result.filePath,
      size: result.size,
      projectId: id,
    });
  } catch (error: any) {
    console.error('Error al subir asset al proyecto:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { oldFilePath, newName } = body;

    if (!oldFilePath || !newName) {
      return NextResponse.json(
        { error: 'Se requiere "oldFilePath" y "newName" para renombrar.' },
        { status: 400 }
      );
    }

    const renamed = renameProjectAsset(id, oldFilePath, newName);

    return NextResponse.json({
      success: true,
      message: 'Asset renombrado correctamente.',
      newRelativePath: renamed.newRelativePath,
      newUrl: renamed.newUrl,
      newFileName: renamed.newFileName,
    });
  } catch (error: any) {
    console.error('Error al renombrar asset:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    let filePath = searchParams.get('filePath');

    if (!filePath) {
      try {
        const body = await req.json();
        filePath = body.filePath;
      } catch (_) {}
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Se requiere "filePath" para eliminar.' }, { status: 400 });
    }

    const deleted = deleteProjectAsset(id, filePath);
    if (!deleted) {
      return NextResponse.json({ error: 'Archivo no encontrado en disco.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Asset eliminado del disco.' });
  } catch (error: any) {
    console.error('Error al eliminar asset:', error);
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 });
  }
}
