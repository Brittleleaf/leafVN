import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { VNStory } from '@/types/vn';
import type { VNProjectSummary } from '@/lib/vn/projectFs';
import { sanitizeStory } from '@/lib/vn/storage';

/**
 * Guarda un proyecto completo en Firestore bajo la colección privada del usuario.
 */
export async function saveProjectToCloud(userId: string, story: VNStory): Promise<void> {
  if (!userId || !story?.id) {
    throw new Error('UserId y Story ID son requeridos para guardar en la nube.');
  }

  const projectRef = doc(db, 'users', userId, 'projects', story.id);
  const sanitized = sanitizeStory(story);

  // Extraer metadata para búsquedas y resúmenes rápidos
  const summary: VNProjectSummary = {
    id: sanitized.id,
    title: sanitized.title || 'Untitled Project',
    author: sanitized.author || 'Author',
    description: sanitized.description || '',
    version: sanitized.version || '1.0.0',
    coverImageUrl: sanitized.chapters[0]?.scenes[0]?.backgroundUrl || sanitized.coverImageUrl,
    updatedAt: new Date().toISOString(),
    createdAt: sanitized.createdAt || new Date().toISOString(),
    chapterCount: sanitized.chapters.length,
    characterCount: sanitized.characters.length,
    scenarioCount: sanitized.scenarios?.length || 1,
    assetCount: sanitized.customAssets?.length || 0,
  };

  await setDoc(
    projectRef,
    {
      story: sanitized,
      summary,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Obtiene la lista de resúmenes de proyectos del usuario guardados en Firestore.
 */
export async function getCloudProjects(userId: string): Promise<VNProjectSummary[]> {
  if (!userId) return [];

  const projectsCol = collection(db, 'users', userId, 'projects');
  const q = query(projectsCol, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  const list: VNProjectSummary[] = [];
  snapshot.forEach((d) => {
    const data = d.data();
    if (data.summary) {
      list.push(data.summary as VNProjectSummary);
    } else if (data.story) {
      const s = data.story as VNStory;
      list.push({
        id: s.id,
        title: s.title,
        author: s.author,
        description: s.description,
        version: s.version || '1.0.0',
        coverImageUrl: s.chapters[0]?.scenes[0]?.backgroundUrl,
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
        chapterCount: s.chapters.length,
        characterCount: s.characters.length,
        scenarioCount: s.scenarios?.length || 1,
        assetCount: s.customAssets?.length || 0,
      });
    }
  });

  return list;
}

/**
 * Carga la historia completa desde Firestore.
 */
export async function loadProjectFromCloud(userId: string, projectId: string): Promise<VNStory | null> {
  if (!userId || !projectId) return null;

  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  const snap = await getDoc(projectRef);

  if (snap.exists()) {
    const data = snap.data();
    if (data.story) {
      return sanitizeStory(data.story);
    }
  }
  return null;
}

/**
 * Elimina un proyecto de la nube de Firestore.
 */
export async function deleteProjectFromCloud(userId: string, projectId: string): Promise<void> {
  if (!userId || !projectId) return;
  const projectRef = doc(db, 'users', userId, 'projects', projectId);
  await deleteDoc(projectRef);
}

// =========================================================================
// GOOGLE DRIVE INTEGRATION
// Permite guardar proyectos directo al Google Drive personal del usuario
// =========================================================================

/**
 * Busca o crea una carpeta en Google Drive llamada "Leaf VN Projects"
 */
async function getOrCreateDriveFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent("name = 'Leaf VN Projects' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Crear la carpeta si no existe
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Leaf VN Projects',
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw new Error('No se pudo crear la carpeta en Google Drive');
  }

  const folder = await createRes.json();
  return folder.id;
}

/**
 * Guarda o actualiza un archivo de proyecto (.json / .leafvn) en Google Drive.
 */
export async function saveProjectToGoogleDrive(
  accessToken: string,
  story: VNStory
): Promise<{ fileId: string; webViewLink?: string }> {
  const folderId = await getOrCreateDriveFolder(accessToken);
  const fileName = `${story.title.replace(/[/\\?%*:|"<>]/g, '-') || 'story'}.leafvn.json`;

  // Buscar si ya existe el archivo en la carpeta
  const q = encodeURIComponent(`name = '${fileName}' and '${folderId}' in parents and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let existingFileId: string | null = null;
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      existingFileId = data.files[0].id;
    }
  }

  const fileContent = JSON.stringify(sanitizeStory(story), null, 2);

  if (existingFileId) {
    // Actualizar contenido del archivo existente (PATCH multipart/simple upload)
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!updateRes.ok) {
      throw new Error('Error al actualizar el archivo en Google Drive');
    }
    const result = await updateRes.json();
    return { fileId: existingFileId, webViewLink: result.webViewLink };
  } else {
    // Crear nuevo archivo en Google Drive (Multipart upload)
    const boundary = '-------LeafVNUploadBoundary' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId],
      description: `Leaf VN Visual Novel Project: ${story.title}`,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!createRes.ok) {
      throw new Error('Error al subir el archivo a Google Drive');
    }

    const created = await createRes.json();
    return { fileId: created.id, webViewLink: created.webViewLink };
  }
}
