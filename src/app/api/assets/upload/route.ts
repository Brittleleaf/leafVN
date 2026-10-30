import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawProjectName = (formData.get('projectName') as string) || 'default-project';
    const rawAssetType = (formData.get('assetType') as string) || 'other';

    if (!file) {
      return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
    }

    // 1. Sanitizar el tipo de recurso y validar contra lista blanca
    const safeAssetType = rawAssetType.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '') || 'other';
    const ALLOWED_ASSET_TYPES = new Set(['sfx', 'bgm', 'voice', 'backgrounds', 'characters', 'icons', 'other']);
    const assetType = ALLOWED_ASSET_TYPES.has(safeAssetType) ? safeAssetType : 'other';

    // 2. Sanitizar el nombre del proyecto para crear su subcarpeta única
    const sanitizedProject = rawProjectName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'project-assets';

    // 3. Subcarpeta de destino dentro de public/assets/projects/[projectName]/[assetType]
    const targetDir = path.join(process.cwd(), 'public', 'assets', 'projects', sanitizedProject, assetType);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 3. Sanitizar el nombre del archivo preservando su extensión
    const originalName = file.name || 'asset';
    const ext = path.extname(originalName) || '';
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');
    const safeFileName = `${Date.now()}_${baseName}${ext}`;

    const filePath = path.join(targetDir, safeFileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Guardar archivo en disco
    fs.writeFileSync(filePath, buffer);

    // 5. URL accesible públicamente para el motor de juego
    const publicUrl = `/assets/projects/${sanitizedProject}/${assetType}/${safeFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: safeFileName,
      originalName: file.name,
      projectName: sanitizedProject,
      assetType,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing file.' },
      { status: 500 }
    );
  }
}
