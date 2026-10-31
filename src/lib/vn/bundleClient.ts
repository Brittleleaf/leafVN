import JSZip from 'jszip';
import { VNStory, VNCharacter, VNScene, VNChapter, VNAssetItem, VNAssetType } from '@/types/vn';
import { sanitizeStory } from './storage';

function inferAssetType(subfolder: string, fileName: string): VNAssetType {
  const sub = subfolder.toLowerCase();
  if (sub.includes('sfx')) return 'sfx';
  if (sub.includes('bgm') || sub.includes('music')) return 'bgm';
  if (sub.includes('voice')) return 'voice';
  if (sub.includes('background') || sub.includes('bg')) return 'background';
  if (sub.includes('character') || sub.includes('char') || sub.includes('avatar')) return 'character';
  if (sub.includes('icon')) return 'icon';

  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (['mp3', 'ogg', 'wav', 'm4a', 'flac'].includes(ext)) {
    return 'sfx';
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return 'background';
  }
  return 'sfx';
}

/**
 * Desempaqueta y reconstruye una historia completa VNStory directamente en el navegador
 * a partir de un archivo binario .leafvn (ZIP estándar).
 * Esto permite una carga instantánea y resiliente incluso si el servidor local está ocupado o desconectado.
 */
export async function unpackBundleInBrowser(fileOrBuffer: File | Blob | ArrayBuffer): Promise<VNStory> {
  const zip = await JSZip.loadAsync(fileOrBuffer);

  // 1. Si existe story.json consolidado, usarlo directamente
  const storyFile = zip.file('story.json');
  if (storyFile) {
    try {
      const text = await storyFile.async('text');
      const parsed = JSON.parse(text);
      if (parsed && (parsed.chapters || parsed.scenarios || parsed.title)) {
        return sanitizeStory(parsed);
      }
    } catch (e) {
      console.warn('Advertencia leyendo story.json del paquete:', e);
    }
  }

  // 2. Leer metadatos principales desde project.json
  let meta: any = {};
  const projectFile = zip.file('project.json');
  if (projectFile) {
    try {
      meta = JSON.parse(await projectFile.async('text'));
    } catch (e) {
      console.warn('Advertencia leyendo project.json del paquete:', e);
    }
  }

  const projectId = meta.id || 'project-imported';

  // 3. Personajes desde characters/
  const characters: VNCharacter[] = [];
  const charFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith('characters/') && f.endsWith('.json') && !zip.files[f].dir
  );
  for (const cf of charFiles) {
    try {
      const c = JSON.parse(await zip.file(cf)!.async('text'));
      characters.push(c);
    } catch (_) {}
  }

  // 4. Escenarios desde scenarios/
  const scenariosMap: Record<string, VNScene & { chapterId?: string }> = {};
  const sceneFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith('scenarios/') && f.endsWith('.json') && !zip.files[f].dir
  );
  for (const sf of sceneFiles) {
    try {
      const s = JSON.parse(await zip.file(sf)!.async('text'));
      scenariosMap[s.id] = s;
    } catch (_) {}
  }

  // 5. Capítulos desde chapters/
  const chapters: VNChapter[] = [];
  const chapFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith('chapters/') && f.endsWith('.json') && !zip.files[f].dir
  );
  for (const cf of chapFiles) {
    try {
      const chapData = JSON.parse(await zip.file(cf)!.async('text'));
      const sceneIds: string[] = chapData.sceneIds || [];
      const scenes: VNScene[] = [];
      for (const sId of sceneIds) {
        if (scenariosMap[sId]) {
          const { chapterId: _, ...cleanScene } = scenariosMap[sId];
          scenes.push(cleanScene);
        }
      }
      if (scenes.length === 0 && !chapData.sceneIds) {
        for (const [_, sData] of Object.entries(scenariosMap)) {
          if (sData.chapterId === chapData.id) {
            const { chapterId: _, ...cleanScene } = sData;
            scenes.push(cleanScene);
          }
        }
      }
      chapters.push({
        id: chapData.id,
        number: chapData.number ?? chapters.length + 1,
        title: chapData.title || `Chapter ${chapData.number || chapters.length + 1}`,
        summary: chapData.summary || '',
        loadingScreen: chapData.loadingScreen || { enabled: false, title: chapData.title || '' },
        introScreen: chapData.introScreen,
        endScreen: chapData.endScreen,
        startSceneId: chapData.startSceneId || scenes[0]?.id || '',
        scenes,
      });
    } catch (_) {}
  }

  chapters.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  const allScenarios: VNScene[] = Object.values(scenariosMap).map(({ chapterId: _, ...s }) => s);
  for (const ch of chapters) {
    for (const sc of ch.scenes) {
      if (!allScenarios.some((s) => s.id === sc.id)) {
        allScenarios.push(sc);
      }
    }
  }

  // 6. Indexar archivos de assets presentes en el paquete
  const customAssets: VNAssetItem[] = [];
  const assetFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith('assets/') && !zip.files[f].dir
  );
  for (const af of assetFiles) {
    const fileName = af.split('/').pop() || af;
    const subfolder = af.substring(0, af.lastIndexOf('/'));
    const assetType = inferAssetType(subfolder, fileName);

    customAssets.push({
      id: `asset-${projectId}-${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      name: fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      type: assetType,
      origin: 'user',
      url: `/projects/${projectId}/${af}`,
      category: assetType === 'sfx' || assetType === 'bgm' || assetType === 'voice' ? 'sfx' : 'other',
      projectName: projectId,
      filePath: af.replace(/^assets\//, ''),
      isProtected: false,
    });
  }

  const rawStory: VNStory = {
    id: projectId,
    version: meta.version || '1.0.0',
    title: meta.title || projectId,
    author: meta.author || 'Anonymous Author',
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

  return sanitizeStory(rawStory);
}

/**
 * Empaqueta una historia en un Blob binario comprimido .leafvn directamente en el navegador.
 * Intenta primero la API del servidor si está disponible; de lo contrario genera el paquete con JSZip en cliente.
 */
export async function createStoryBundleBlob(story: VNStory): Promise<Blob> {
  // 1. Intentar obtener el bundle consolidado desde la API local si el servidor responde
  try {
    const res = await fetch(`/api/projects/${story.id}/bundle`);
    if (res.ok) {
      return await res.blob();
    }
  } catch (_) {}

  // 2. Empaquetado puro en el navegador usando JSZip
  const zip = new JSZip();

  const projectMetadata = {
    id: story.id,
    title: story.title,
    author: story.author,
    description: story.description,
    version: story.version || '1.0.0',
    coverImageUrl: story.coverImageUrl,
    createdAt: story.createdAt,
    updatedAt: new Date().toISOString(),
    textBoxConfig: story.textBoxConfig,
    variables: story.variables || [],
  };

  zip.file('project.json', JSON.stringify(projectMetadata, null, 2), { compression: 'DEFLATE' });
  zip.file('story.json', JSON.stringify(sanitizeStory(story), null, 2), { compression: 'DEFLATE' });

  // Capítulos individuales
  if (Array.isArray(story.chapters)) {
    const chapFolder = zip.folder('chapters');
    for (const ch of story.chapters) {
      chapFolder?.file(`${ch.id}.json`, JSON.stringify(ch, null, 2), { compression: 'DEFLATE' });
    }
  }

  // Escenarios individuales
  if (Array.isArray(story.scenarios)) {
    const scFolder = zip.folder('scenarios');
    for (const sc of story.scenarios) {
      scFolder?.file(`${sc.id}.json`, JSON.stringify(sc, null, 2), { compression: 'DEFLATE' });
    }
  }

  // Personajes individuales
  if (Array.isArray(story.characters)) {
    const charFolder = zip.folder('characters');
    for (const c of story.characters) {
      charFolder?.file(`${c.id}.json`, JSON.stringify(c, null, 2), { compression: 'DEFLATE' });
    }
  }

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/x-leafvn',
    compression: 'DEFLATE',
  });
}
