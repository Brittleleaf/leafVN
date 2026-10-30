import fs from 'fs';
import path from 'path';
import { VNStory, VNChapter, VNScene, VNCharacter, VNAssetItem, VNAssetType } from '@/types/vn';
import { SAMPLE_STORY } from './sampleStory';

export interface VNProjectSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  version: string;
  coverImageUrl?: string;
  updatedAt: string;
  createdAt: string;
  chapterCount: number;
  characterCount: number;
  scenarioCount: number;
  assetCount: number;
}

export function getProjectsRootDir(): string {
  const dir = path.join(process.cwd(), 'public', 'projects');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // En entornos de solo lectura como Vercel lambdas, no lanzar excepción fatal
    console.warn('Advertencia: No se pudo crear el directorio de proyectos (posible entorno de solo lectura):', err);
  }
  return dir;
}

export function sanitizeProjectId(rawId: string): string {
  if (!rawId || typeof rawId !== 'string') return 'project-default';
  return (
    rawId
      .toLowerCase()
      .trim()
      .replace(/[\/\\]/g, '-')
      .replace(/\0/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'project-default'
  );
}

export function getProjectPath(projectId: string): string {
  const safeId = sanitizeProjectId(projectId);
  const root = getProjectsRootDir();
  const resolved = path.resolve(root, safeId);
  if (!resolved.startsWith(path.resolve(root))) {
    return path.join(root, 'project-default');
  }
  return resolved;
}

/**
 * Lista todos los proyectos disponibles en public/projects/
 * Si no existe ninguno o el entorno es de solo lectura, proporciona el proyecto de muestra base.
 */
export function listProjects(): VNProjectSummary[] {
  try {
    const root = getProjectsRootDir();
    if (!fs.existsSync(root)) {
      return [];
    }
    const entries = fs.readdirSync(root, { withFileTypes: true });
    const projectDirs = entries.filter((e) => e.isDirectory());

    if (projectDirs.length === 0) {
      return [];
    }

  const summaries: VNProjectSummary[] = [];

  for (const dir of projectDirs) {
    const projDir = path.join(root, dir.name);
    const metaFile = path.join(projDir, 'project.json');

    if (!fs.existsSync(metaFile)) continue;

    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      const chaptersDir = path.join(projDir, 'chapters');
      const charactersDir = path.join(projDir, 'characters');
      const scenariosDir = path.join(projDir, 'scenarios');
      const assetsDir = path.join(projDir, 'assets');

      const chapterCount = fs.existsSync(chaptersDir)
        ? fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.json')).length
        : 0;
      const characterCount = fs.existsSync(charactersDir)
        ? fs.readdirSync(charactersDir).filter((f) => f.endsWith('.json')).length
        : 0;
      const scenarioCount = fs.existsSync(scenariosDir)
        ? fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.json')).length
        : 0;

      let assetCount = 0;
      if (fs.existsSync(assetsDir)) {
        const countFiles = (folder: string) => {
          const items = fs.readdirSync(folder, { withFileTypes: true });
          for (const item of items) {
            const p = path.join(folder, item.name);
            if (item.isDirectory()) countFiles(p);
            else if (item.isFile()) assetCount++;
          }
        };
        countFiles(assetsDir);
      }

      summaries.push({
        id: dir.name,
        title: meta.title || dir.name,
        author: meta.author || 'Desconocido',
        description: meta.description || '',
        version: meta.version || '1.0.0',
        coverImageUrl: meta.coverImageUrl,
        updatedAt: meta.updatedAt || new Date().toISOString(),
        createdAt: meta.createdAt || new Date().toISOString(),
        chapterCount,
        characterCount,
        scenarioCount,
        assetCount,
      });
    } catch (err) {
      console.error(`Error al leer proyecto ${dir.name}:`, err);
    }
  }

  return summaries;
  } catch (outerErr) {
    console.warn('Error en listProjects, retornando plantilla de muestra:', outerErr);
    return [getSampleProjectSummary()];
  }
}

export function getSampleProjectSummary(): VNProjectSummary {
  return {
    id: SAMPLE_STORY.id || 'el-renacer-del-pintor',
    title: SAMPLE_STORY.title || 'The Rebirth of the Painter',
    author: SAMPLE_STORY.author || 'Justin',
    description: SAMPLE_STORY.description || 'Main story project.',
    version: SAMPLE_STORY.version || '1.0.0',
    coverImageUrl: SAMPLE_STORY.coverImageUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
    updatedAt: SAMPLE_STORY.updatedAt || new Date().toISOString(),
    createdAt: SAMPLE_STORY.createdAt || new Date().toISOString(),
    chapterCount: SAMPLE_STORY.chapters.length,
    characterCount: SAMPLE_STORY.characters.length,
    scenarioCount: SAMPLE_STORY.scenarios?.length || 1,
    assetCount: 0,
  };
}

/**
 * Carga un proyecto completo ensamblando project.json, characters/, chapters/, scenarios/ y assets/
 */
export function loadProject(projectId: string): VNStory | null {
  const projDir = getProjectPath(projectId);
  const metaFile = path.join(projDir, 'project.json');

  if (!fs.existsSync(metaFile)) {
    if (projectId === 'el-renacer-del-pintor' || projectId === SAMPLE_STORY.id) {
      return SAMPLE_STORY;
    }
    return null;
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));

    // 1. Cargar personajes de characters/
    const charactersDir = path.join(projDir, 'characters');
    const characters: VNCharacter[] = [];
    if (fs.existsSync(charactersDir)) {
      const charFiles = fs.readdirSync(charactersDir).filter((f) => f.endsWith('.json'));
      for (const f of charFiles) {
        try {
          const charData = JSON.parse(fs.readFileSync(path.join(charactersDir, f), 'utf-8'));
          characters.push(charData);
        } catch (e) {
          console.error(`Error al leer personaje ${f}:`, e);
        }
      }
    }

    // 2. Cargar escenarios de scenarios/
    const scenariosDir = path.join(projDir, 'scenarios');
    const scenariosMap: Record<string, VNScene & { chapterId?: string }> = {};
    if (fs.existsSync(scenariosDir)) {
      const sceneFiles = fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.json'));
      for (const f of sceneFiles) {
        try {
          const sceneData = JSON.parse(fs.readFileSync(path.join(scenariosDir, f), 'utf-8'));
          scenariosMap[sceneData.id] = sceneData;
        } catch (e) {
          console.error(`Error al leer escenario ${f}:`, e);
        }
      }
    }

    // 3. Cargar capítulos de chapters/
    const chaptersDir = path.join(projDir, 'chapters');
    const chapters: VNChapter[] = [];
    if (fs.existsSync(chaptersDir)) {
      const chapFiles = fs.readdirSync(chaptersDir).filter((f) => f.endsWith('.json'));
      for (const f of chapFiles) {
        try {
          const chapData = JSON.parse(fs.readFileSync(path.join(chaptersDir, f), 'utf-8'));
          const sceneIds: string[] = chapData.sceneIds || [];
          const scenes: VNScene[] = [];

          // Agregar escenas exactamente según el orden definido en sceneIds
          for (const sId of sceneIds) {
            if (scenariosMap[sId]) {
              const { chapterId: _, ...cleanScene } = scenariosMap[sId];
              scenes.push(cleanScene);
            }
          }

          // Fallback de compatibilidad solo para capítulos antiguos sin sceneIds definido
          if (scenes.length === 0 && !chapData.sceneIds) {
            for (const [sId, sData] of Object.entries(scenariosMap)) {
              if (sData.chapterId === chapData.id) {
                const { chapterId: _, ...cleanScene } = sData;
                scenes.push(cleanScene);
              }
            }
          }

          chapters.push({
            id: chapData.id,
            number: chapData.number ?? chapters.length + 1,
            title: chapData.title || `Capítulo ${chapData.number || chapters.length + 1}`,
            summary: chapData.summary || '',
            loadingScreen: chapData.loadingScreen || {
              enabled: false,
              title: chapData.title || '',
            },
            startSceneId: chapData.startSceneId || scenes[0]?.id || '',
            scenes,
          });
        } catch (e) {
          console.error(`Error al leer capítulo ${f}:`, e);
        }
      }
    }

    // Ordenar capítulos por número
    chapters.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

    // Todos los escenarios encontrados en scenarios/ pertenecen a la biblioteca global del proyecto
    const allScenarios: VNScene[] = Object.values(scenariosMap).map(({ chapterId: _, ...s }) => s);

    // Si algún capítulo tiene escenas que no estaban en scenariosMap, incluirlas también
    for (const ch of chapters) {
      for (const sc of ch.scenes) {
        if (!allScenarios.some((s) => s.id === sc.id)) {
          allScenarios.push(sc);
        }
      }
    }

    // 4. Cargar assets del proyecto
    const customAssets = listProjectAssets(projectId);

    const story: VNStory = {
      id: sanitizeProjectId(projectId),
      version: meta.version || '1.0.0',
      title: meta.title || projectId,
      author: meta.author || 'Autor Anónimo',
      description: meta.description || '',
      coverImageUrl: meta.coverImageUrl,
      createdAt: meta.createdAt || new Date().toISOString(),
      updatedAt: meta.updatedAt || new Date().toISOString(),
      textBoxConfig: meta.textBoxConfig || {
        theme: 'classified',
        opacity: 0.9,
        borderColor: '#b91c1c',
        fontSize: 'base',
        typewriterSpeedMs: 25,
        showAvatar: true,
        soundBlipEnabled: true,
        position: 'bottom',
      },
      variables: meta.variables || [],
      characters: characters.length > 0 ? characters : meta.characters || [],
      chapters: chapters.length > 0 ? chapters : meta.chapters || [],
      scenarios: allScenarios,
      customAssets,
    };

    return story;
  } catch (err) {
    console.error(`Error al cargar el proyecto ${projectId}:`, err);
    return null;
  }
}

/**
 * Guarda el proyecto completo descomponiendo en project.json, characters/, chapters/, scenarios/
 */
export function saveProject(projectId: string, story: VNStory): boolean {
  const safeId = sanitizeProjectId(projectId);
  const projDir = getProjectPath(safeId);

  try {
    const charactersDir = path.join(projDir, 'characters');
    const chaptersDir = path.join(projDir, 'chapters');
    const scenariosDir = path.join(projDir, 'scenarios');
    const assetsDir = path.join(projDir, 'assets');

    // Crear carpetas estructurales
    [projDir, charactersDir, chaptersDir, scenariosDir, assetsDir].forEach((d) => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });

    // Subcarpetas de assets por tipo
    ['sfx', 'bgm', 'voice', 'backgrounds', 'characters', 'icons', 'other'].forEach((sub) => {
      const subDir = path.join(assetsDir, sub);
      if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    });

    const now = new Date().toISOString();

    // 1. Guardar project.json (metadatos globales)
    const projectMetadata = {
      id: safeId,
      version: story.version || '1.0.0',
      title: story.title || safeId,
      author: story.author || 'Creador',
      description: story.description || '',
      coverImageUrl: story.coverImageUrl,
      createdAt: story.createdAt || now,
      updatedAt: now,
      textBoxConfig: story.textBoxConfig,
      variables: story.variables || [],
    };
    fs.writeFileSync(path.join(projDir, 'project.json'), JSON.stringify(projectMetadata, null, 2), 'utf-8');

    // 2. Guardar characters/
    const existingCharFiles = fs.readdirSync(charactersDir);
    const validCharFileNames = new Set<string>();

    for (const char of story.characters || []) {
      const fileName = `${sanitizeProjectId(char.id)}.json`;
      validCharFileNames.add(fileName);
      fs.writeFileSync(path.join(charactersDir, fileName), JSON.stringify(char, null, 2), 'utf-8');
    }

    // Limpiar personajes eliminados
    for (const file of existingCharFiles) {
      if (file.endsWith('.json') && !validCharFileNames.has(file)) {
        try {
          fs.unlinkSync(path.join(charactersDir, file));
        } catch (_) {}
      }
    }

    // 3. Guardar chapters/ y scenarios/
    const existingChapFiles = fs.readdirSync(chaptersDir);
    const validChapFileNames = new Set<string>();

    const existingSceneFiles = fs.readdirSync(scenariosDir);
    const validSceneFileNames = new Set<string>();

    // Catálogo unificado de escenarios: biblioteca global + cualquier escena de capítulo
    const allScenariosToSave = new Map<string, VNScene>();

    for (const sc of story.scenarios || []) {
      if (sc && sc.id) {
        allScenariosToSave.set(sc.id, sc);
      }
    }

    for (const chapter of story.chapters || []) {
      for (const scene of chapter.scenes || []) {
        if (scene && scene.id) {
          // Si ya existe en story.scenarios, preservamos/actualizamos
          allScenariosToSave.set(scene.id, scene);
        }
      }
    }

    // Guardar todos los escenarios de la biblioteca en scenarios/
    for (const [sId, scene] of allScenariosToSave.entries()) {
      const sceneFileName = `${sanitizeProjectId(sId)}.json`;
      validSceneFileNames.add(sceneFileName);
      fs.writeFileSync(path.join(scenariosDir, sceneFileName), JSON.stringify(scene, null, 2), 'utf-8');
    }

    // Guardar capítulos con sus listas de IDs de escenas activas
    for (const chapter of story.chapters || []) {
      const chapFileName = `${sanitizeProjectId(chapter.id)}.json`;
      validChapFileNames.add(chapFileName);

      const sceneIds: string[] = (chapter.scenes || []).map((s) => s.id);

      const chapterPayload = {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        summary: chapter.summary || '',
        loadingScreen: chapter.loadingScreen,
        startSceneId: chapter.startSceneId || sceneIds[0] || '',
        sceneIds,
      };
      fs.writeFileSync(path.join(chaptersDir, chapFileName), JSON.stringify(chapterPayload, null, 2), 'utf-8');
    }

    // Limpiar capítulos eliminados
    for (const file of existingChapFiles) {
      if (file.endsWith('.json') && !validChapFileNames.has(file)) {
        try {
          fs.unlinkSync(path.join(chaptersDir, file));
        } catch (_) {}
      }
    }

    // Limpiar escenarios eliminados (SOLO si no existen en story.scenarios ni en ningún capítulo)
    for (const file of existingSceneFiles) {
      if (file.endsWith('.json') && !validSceneFileNames.has(file)) {
        try {
          fs.unlinkSync(path.join(scenariosDir, file));
        } catch (_) {}
      }
    }

    return true;
  } catch (err) {
    console.error(`Error al guardar proyecto ${projectId}:`, err);
    return false;
  }
}

/**
 * Elimina un proyecto entero de public/projects/
 */
export function deleteProject(projectId: string): boolean {
  const projDir = getProjectPath(projectId);
  if (!fs.existsSync(projDir)) return false;
  try {
    fs.rmSync(projDir, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error(`Error al eliminar proyecto ${projectId}:`, err);
    return false;
  }
}

/**
 * Determina el tipo de asset según su subcarpeta o extensión
 */
function inferAssetType(subfolder: string, fileName: string): VNAssetType {
  const sub = subfolder.toLowerCase();
  if (sub.includes('sfx')) return 'sfx';
  if (sub.includes('bgm') || sub.includes('music')) return 'bgm';
  if (sub.includes('voice')) return 'voice';
  if (sub.includes('background') || sub.includes('bg')) return 'background';
  if (sub.includes('character') || sub.includes('char') || sub.includes('avatar')) return 'character';
  if (sub.includes('icon')) return 'icon';

  const ext = path.extname(fileName).toLowerCase();
  if (['.mp3', '.ogg', '.wav', '.m4a', '.flac'].includes(ext)) {
    return 'sfx';
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
    return 'background';
  }
  return 'sfx';
}

/**
 * Lista todos los archivos físicos dentro de public/projects/[projectId]/assets/
 * y los assets indexados mediante enlace web en external_assets.json
 */
export function listProjectAssets(projectId: string): VNAssetItem[] {
  const safeId = sanitizeProjectId(projectId);
  const projDir = getProjectPath(safeId);
  const assetsDir = path.join(projDir, 'assets');
  const items: VNAssetItem[] = [];

  // 1. Archivos físicos en disco
  if (fs.existsSync(assetsDir)) {
    const scanFolder = (currentDir: string, relativeSubfolder: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const nextRel = relativeSubfolder ? `${relativeSubfolder}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          scanFolder(fullPath, nextRel);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const nameWithoutExt = path.basename(entry.name, ext).replace(/[-_]/g, ' ');
          const assetType = inferAssetType(relativeSubfolder, entry.name);

          const stat = fs.statSync(fullPath);

          items.push({
            id: `asset-${safeId}-${nextRel.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: nameWithoutExt,
            type: assetType,
            origin: 'user',
            url: `/projects/${safeId}/assets/${nextRel}`,
            category: relativeSubfolder || 'General',
            projectName: safeId,
            filePath: nextRel,
            isProtected: false,
            createdAt: stat.birthtime.toISOString(),
          });
        }
      }
    };

    scanFolder(assetsDir, '');
  }

  // 2. Assets indexados mediante enlace externo (URLs web)
  const extFile = path.join(projDir, 'external_assets.json');
  if (fs.existsSync(extFile)) {
    try {
      const extRaw = fs.readFileSync(extFile, 'utf-8');
      const extItems = JSON.parse(extRaw);
      if (Array.isArray(extItems)) {
        items.push(...extItems);
      }
    } catch (e) {
      console.error('Error al leer external_assets.json:', e);
    }
  }

  return items;
}

/**
 * Guarda o indexa un asset mediante enlace / URL externo sin descargar el archivo a disco
 */
export function saveProjectExternalAsset(
  projectId: string,
  asset: { name: string; url: string; assetType: VNAssetType; category?: string; description?: string }
): VNAssetItem {
  const safeId = sanitizeProjectId(projectId);
  const projDir = getProjectPath(safeId);
  if (!fs.existsSync(projDir)) {
    fs.mkdirSync(projDir, { recursive: true });
  }

  const extFile = path.join(projDir, 'external_assets.json');
  let existing: VNAssetItem[] = [];
  if (fs.existsSync(extFile)) {
    try {
      existing = JSON.parse(fs.readFileSync(extFile, 'utf-8'));
    } catch (_) {
      existing = [];
    }
  }

  let cleanUrl = asset.url.trim();
  if (
    !cleanUrl.startsWith('http://') &&
    !cleanUrl.startsWith('https://') &&
    !cleanUrl.startsWith('/') &&
    !cleanUrl.startsWith('data:')
  ) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let finalName = asset.name?.trim() || '';
  if (!finalName) {
    try {
      const u = new URL(cleanUrl);
      const segs = u.pathname.split('/').filter(Boolean);
      const last = segs[segs.length - 1];
      if (last) {
        finalName = decodeURIComponent(last).replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
    } catch (_) {}
  }
  if (!finalName) {
    finalName = `Indexed ${asset.assetType || 'Asset'} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }

  const newItem: VNAssetItem = {
    id: `asset-ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: finalName,
    type: asset.assetType,
    origin: 'user',
    url: cleanUrl,
    category: asset.category?.trim() || 'Web Links',
    description: asset.description?.trim() || cleanUrl,
    projectName: safeId,
    filePath: cleanUrl,
    isProtected: false,
    createdAt: new Date().toISOString(),
  };

  // Reemplazar si la misma URL ya existía o anteponer al inicio
  existing = existing.filter((item) => item.url !== cleanUrl);
  existing.unshift(newItem);

  fs.writeFileSync(extFile, JSON.stringify(existing, null, 2), 'utf-8');
  return newItem;
}

/**
 * Guarda un archivo de asset directamente en public/projects/[projectId]/assets/[assetType]/
 */
export function saveProjectAsset(
  projectId: string,
  assetType: string,
  buffer: Buffer,
  originalFileName: string
): { url: string; fileName: string; filePath: string; size: number } {
  const safeId = sanitizeProjectId(projectId);
  const subfolder =
    assetType === 'background' || assetType === 'backgrounds'
      ? 'backgrounds'
      : assetType === 'character' || assetType === 'characters'
      ? 'characters'
      : assetType === 'icon' || assetType === 'icons'
      ? 'icons'
      : ['sfx', 'bgm', 'voice'].includes(assetType)
      ? assetType
      : 'other';

  const targetDir = path.join(getProjectPath(safeId), 'assets', subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = path.extname(originalFileName) || '';
  const baseName = path
    .basename(originalFileName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  const safeFileName = `${Date.now()}_${baseName}${ext}`;

  const destPath = path.join(targetDir, safeFileName);
  fs.writeFileSync(destPath, buffer);

  const relativePath = `${subfolder}/${safeFileName}`;
  const publicUrl = `/projects/${safeId}/assets/${relativePath}`;

  return {
    url: publicUrl,
    fileName: safeFileName,
    filePath: relativePath,
    size: buffer.length,
  };
}

/**
 * Elimina un asset de disco o un enlace indexado en external_assets.json
 */
export function deleteProjectAsset(projectId: string, relativePathOrUrl: string): boolean {
  const safeId = sanitizeProjectId(projectId);
  const projDir = getProjectPath(safeId);

  // 1. Verificar si es un asset externo indexado
  const extFile = path.join(projDir, 'external_assets.json');
  if (fs.existsSync(extFile)) {
    try {
      const existing: VNAssetItem[] = JSON.parse(fs.readFileSync(extFile, 'utf-8'));
      const isExt = existing.some(
        (item) => item.url === relativePathOrUrl || item.id === relativePathOrUrl || item.filePath === relativePathOrUrl
      );
      if (isExt) {
        const filtered = existing.filter(
          (item) => item.url !== relativePathOrUrl && item.id !== relativePathOrUrl && item.filePath !== relativePathOrUrl
        );
        fs.writeFileSync(extFile, JSON.stringify(filtered, null, 2), 'utf-8');
        return true;
      }
    } catch (_) {}
  }

  // 2. Si no es externo, eliminar el archivo físico en assets/
  const assetsDir = path.resolve(projDir, 'assets');
  const targetFile = path.resolve(assetsDir, relativePathOrUrl);

  // Protección estricta contra Path Traversal
  if (!targetFile.startsWith(assetsDir)) {
    throw new Error('Acceso no permitido: la ruta está fuera de la carpeta de assets.');
  }

  if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
    return true;
  }
  return false;
}

/**
 * Renombra un asset de disco o un asset indexado por enlace
 */
export function renameProjectAsset(
  projectId: string,
  oldRelativePathOrUrl: string,
  newName: string
): { newRelativePath: string; newUrl: string; newFileName: string } {
  const safeId = sanitizeProjectId(projectId);
  const projDir = getProjectPath(safeId);

  // 1. Si es un asset externo indexado
  const extFile = path.join(projDir, 'external_assets.json');
  if (fs.existsSync(extFile)) {
    try {
      const existing: VNAssetItem[] = JSON.parse(fs.readFileSync(extFile, 'utf-8'));
      const item = existing.find(
        (a) => a.url === oldRelativePathOrUrl || a.id === oldRelativePathOrUrl || a.filePath === oldRelativePathOrUrl
      );
      if (item) {
        item.name = newName.trim();
        fs.writeFileSync(extFile, JSON.stringify(existing, null, 2), 'utf-8');
        return {
          newRelativePath: item.url,
          newUrl: item.url,
          newFileName: newName.trim(),
        };
      }
    } catch (_) {}
  }

  // 2. Archivo físico en disco
  const assetsDir = path.resolve(projDir, 'assets');
  const targetFile = path.resolve(assetsDir, oldRelativePathOrUrl);

  if (!targetFile.startsWith(assetsDir)) {
    throw new Error('Acceso no permitido: la ruta está fuera de la carpeta de assets.');
  }

  if (!fs.existsSync(targetFile)) {
    throw new Error('El archivo original no existe en disco.');
  }

  const ext = path.extname(targetFile);
  const cleanNewName = newName
    .replace(/\.[^/.]+$/, '') // Remover extensión si el usuario la escribió
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');

  const newFileName = `${cleanNewName}${ext}`;
  const targetDir = path.dirname(targetFile);
  const newFilePath = path.join(targetDir, newFileName);

  fs.renameSync(targetFile, newFilePath);

  const subDir = path.relative(assetsDir, targetDir).replace(/\\/g, '/');
  const newRelativePath = subDir ? `${subDir}/${newFileName}` : newFileName;
  const newUrl = `/projects/${safeId}/assets/${newRelativePath}`;

  return {
    newRelativePath,
    newUrl,
    newFileName,
  };
}
