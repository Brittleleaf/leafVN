/**
 * idbStorage.ts
 * Motor de almacenamiento IndexedDB local para Leaf VN estilo Photopea / Figma.
 * Mantiene un respaldo local en caliente (Working Copy) y Snapshots periódicos
 * para garantizar CERO pérdida de datos aunque se cierre la pestaña o se apague el equipo.
 */

import { VNStory } from '@/types/vn';

const DB_NAME = 'leafvn_engine_db';
const DB_VERSION = 1;

export interface IDBWorkingCopy {
  projectId: string;
  title: string;
  story: VNStory;
  updatedAt: number;
  fileName?: string;
  fileHandle?: FileSystemFileHandle;
}

export interface IDBSnapshot {
  id: string;
  projectId: string;
  title: string;
  story: VNStory;
  timestamp: number;
  reason: 'auto' | 'manual' | 'pre_save';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store para copia de trabajo actual (Working Copy)
      if (!db.objectStoreNames.contains('working_copies')) {
        db.createObjectStore('working_copies', { keyPath: 'projectId' });
      }

      // 2. Store para snapshots históricos de recuperación
      if (!db.objectStoreNames.contains('snapshots')) {
        const snapStore = db.createObjectStore('snapshots', { keyPath: 'id' });
        snapStore.createIndex('by_projectId', 'projectId', { unique: false });
        snapStore.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda o actualiza la copia de trabajo en IndexedDB en caliente.
 * Guarda también el FileSystemFileHandle si el usuario está trabajando sobre un archivo .leafvn de su PC.
 */
export async function idbSaveWorkingCopy(
  story: VNStory,
  fileHandle?: FileSystemFileHandle,
  fileName?: string
): Promise<void> {
  if (!story || !story.id) return;

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('working_copies', 'readwrite');
      const store = tx.objectStore('working_copies');

      // Intentar preservar el handle previo si no se provee uno nuevo
      const getReq = store.get(story.id);
      getReq.onsuccess = () => {
        const existing = getReq.result as IDBWorkingCopy | undefined;

        const payload: IDBWorkingCopy = {
          projectId: story.id,
          title: story.title || story.id,
          story,
          updatedAt: Date.now(),
          fileName: fileName || existing?.fileName,
          fileHandle: fileHandle !== undefined ? fileHandle : existing?.fileHandle,
        };

        const putReq = store.put(payload);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => {
        const payload: IDBWorkingCopy = {
          projectId: story.id,
          title: story.title || story.id,
          story,
          updatedAt: Date.now(),
          fileName,
          fileHandle,
        };
        const putReq = store.put(payload);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
    });
  } catch (err) {
    console.warn('[idbStorage] Could not write to IndexedDB:', err);
  }
}

/**
 * Obtiene la copia de trabajo activa de un proyecto desde IndexedDB.
 */
export async function idbGetWorkingCopy(projectId: string): Promise<IDBWorkingCopy | null> {
  if (!projectId) return null;

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('working_copies', 'readonly');
      const store = tx.objectStore('working_copies');
      const req = store.get(projectId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[idbStorage] Could not read from IndexedDB:', err);
    return null;
  }
}

/**
 * Elimina la copia de trabajo de IndexedDB.
 */
export async function idbDeleteWorkingCopy(projectId: string): Promise<void> {
  if (!projectId) return;

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('working_copies', 'readwrite');
      const store = tx.objectStore('working_copies');
      const req = store.delete(projectId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[idbStorage] Could not delete from IndexedDB:', err);
  }
}

/**
 * Guarda un snapshot periódico histórico (máximo 5 por proyecto para no saturar).
 */
export async function idbSaveSnapshot(
  story: VNStory,
  reason: 'auto' | 'manual' | 'pre_save' = 'auto'
): Promise<void> {
  if (!story || !story.id) return;

  try {
    const db = await openDatabase();
    const snapId = `snap_${story.id}_${Date.now()}`;

    const snap: IDBSnapshot = {
      id: snapId,
      projectId: story.id,
      title: story.title || story.id,
      story,
      timestamp: Date.now(),
      reason,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      const putReq = store.put(snap);

      putReq.onsuccess = () => {
        // Mantener solo los últimos 5 snapshots de este proyecto
        const idx = store.index('by_projectId');
        const getAllReq = idx.getAll(story.id);

        getAllReq.onsuccess = () => {
          const list = (getAllReq.result as IDBSnapshot[]) || [];
          if (list.length > 5) {
            list.sort((a, b) => a.timestamp - b.timestamp);
            const toDelete = list.slice(0, list.length - 5);
            for (const item of toDelete) {
              store.delete(item.id);
            }
          }
          resolve();
        };

        getAllReq.onerror = () => resolve();
      };

      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('[idbStorage] Could not save snapshot to IndexedDB:', err);
  }
}

/**
 * Obtiene la lista de snapshots de recuperación disponibles para un proyecto.
 */
export async function idbGetSnapshots(projectId: string): Promise<IDBSnapshot[]> {
  if (!projectId) return [];

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const idx = store.index('by_projectId');
      const req = idx.getAll(projectId);

      req.onsuccess = () => {
        const list = (req.result as IDBSnapshot[]) || [];
        list.sort((a, b) => b.timestamp - a.timestamp); // Más reciente primero
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[idbStorage] Could not read snapshots:', err);
    return [];
  }
}
