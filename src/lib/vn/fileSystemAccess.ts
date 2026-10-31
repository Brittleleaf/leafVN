/**
 * fileSystemAccess.ts
 * Integración nativa con File System Access API (estilo Photopea / VS Code Web).
 * Permite abrir, editar y reescribir directamente archivos .leafvn en la PC del usuario
 * con detección preventiva de archivo movido, renombrado o eliminado (Parche de Seguridad).
 */

import { VNStory } from '@/types/vn';
import { unpackBundleInBrowser, createStoryBundleBlob } from './bundleClient';
import { idbSaveWorkingCopy } from './idbStorage';

export interface NativeFileOpenResult {
  story: VNStory;
  handle: FileSystemFileHandle;
  fileName: string;
}

export interface FileHealthCheckResult {
  valid: boolean;
  error?: string;
  isMovedOrDeleted?: boolean;
  name: string;
}

/**
 * Comprueba si el navegador actual soporta la File System Access API (Chromium, Edge, Opera).
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

/**
 * Abre un archivo .leafvn de la PC del usuario, extrae la historia y retiene el handle.
 */
export async function openNativeLeafvnFile(): Promise<NativeFileOpenResult | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'Leaf VN Project (*.leafvn)',
          accept: {
            'application/x-leafvn': ['.leafvn'],
            'application/zip': ['.leafvn', '.zip'],
          },
        },
      ],
      multiple: false,
    });

    if (!handle) return null;

    const file = await handle.getFile();
    const story = await unpackBundleInBrowser(file);

    // Guardar inmediatamente en IndexedDB como working copy vinculada a este handle
    await idbSaveWorkingCopy(story, handle, file.name);

    return {
      story,
      handle,
      fileName: file.name,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return null; // El usuario canceló el diálogo
    }
    console.error('Error opening file via File System Access API:', err);
    throw err;
  }
}

/**
 * Parche de Seguridad: Verifica si el archivo .leafvn vinculado sigue existiendo
 * en la misma ubicación del disco o si fue movido o borrado en Windows.
 */
export async function verifyFileHandleHealth(
  handle: FileSystemFileHandle
): Promise<FileHealthCheckResult> {
  const fileName = handle?.name || 'project.leafvn';

  if (!handle) {
    return { valid: false, isMovedOrDeleted: true, error: 'No file handle provided', name: fileName };
  }

  try {
    // 1. Verificar si tenemos permisos
    const anyHandle = handle as any;
    let permission = typeof anyHandle.queryPermission === 'function'
      ? await anyHandle.queryPermission({ mode: 'readwrite' })
      : 'granted';
    if (permission !== 'granted' && typeof anyHandle.requestPermission === 'function') {
      permission = await anyHandle.requestPermission({ mode: 'readwrite' });
    }

    if (permission !== 'granted') {
      return {
        valid: false,
        error: 'Permission to access the file was denied.',
        name: fileName,
      };
    }

    // 2. Intentar leer los metadatos del archivo para confirmar que sigue ahí
    const file = await handle.getFile();
    if (!file) {
      return {
        valid: false,
        isMovedOrDeleted: true,
        error: `File "${fileName}" was moved or deleted from disk.`,
        name: fileName,
      };
    }

    return { valid: true, name: fileName };
  } catch (err: any) {
    const isMissing = err?.name === 'NotFoundError' || err?.message?.toLowerCase().includes('not found') || err?.message?.toLowerCase().includes('moved');
    return {
      valid: false,
      isMovedOrDeleted: isMissing,
      error: err?.message || 'File access error',
      name: fileName,
    };
  }
}

/**
 * Guarda directamente sobre el archivo físico existente (Ctrl+S estilo Photopea).
 * Si el archivo se movió o eliminó, retorna { success: false, isMovedOrDeleted: true }.
 */
export async function saveToExistingFileHandle(
  handle: FileSystemFileHandle,
  bundleBlob: Blob
): Promise<{ success: boolean; error?: string; isMovedOrDeleted?: boolean }> {
  try {
    // 1. Verificar permisos
    const anyHandle = handle as any;
    let permission = typeof anyHandle.queryPermission === 'function'
      ? await anyHandle.queryPermission({ mode: 'readwrite' })
      : 'granted';
    if (permission !== 'granted' && typeof anyHandle.requestPermission === 'function') {
      permission = await anyHandle.requestPermission({ mode: 'readwrite' });
    }
    if (permission !== 'granted') {
      return { success: false, error: 'Permission denied to write file.' };
    }

    // 2. Intentar escribir en el archivo en disco
    const writable = await handle.createWritable();
    await writable.write(bundleBlob);
    await writable.close();

    return { success: true };
  } catch (err: any) {
    const isMissing =
      err?.name === 'NotFoundError' ||
      err?.message?.toLowerCase().includes('not found') ||
      err?.message?.toLowerCase().includes('moved');

    return {
      success: false,
      isMovedOrDeleted: isMissing,
      error: isMissing
        ? `The file "${handle.name}" was moved, renamed, or deleted from its disk location.`
        : err?.message || 'Error writing to file',
    };
  }
}

/**
 * Diálogo "Guardar como..." (Save As) para elegir una nueva ubicación en el disco.
 */
export async function saveAsNativeLeafvnFile(
  story: VNStory,
  suggestedName?: string
): Promise<{ handle: FileSystemFileHandle; fileName: string; success: boolean } | null> {
  if (!isFileSystemAccessSupported()) {
    // Fallback: descarga directa con etiqueta <a>
    await fallbackDownloadLeafvn(story, suggestedName);
    return null;
  }

  try {
    const baseName = (suggestedName || story.title || story.id || 'project')
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_');
    const cleanName = baseName.endsWith('.leafvn') ? baseName : `${baseName}.leafvn`;

    const handle = await (window as any).showSaveFilePicker({
      suggestedName: cleanName,
      types: [
        {
          description: 'Leaf VN Project (*.leafvn)',
          accept: {
            'application/x-leafvn': ['.leafvn'],
          },
        },
      ],
    });

    if (!handle) return null;

    const bundleBlob = await createStoryBundleBlob(story);
    const writable = await handle.createWritable();
    await writable.write(bundleBlob);
    await writable.close();

    // Actualizar IndexedDB con el nuevo handle
    await idbSaveWorkingCopy(story, handle, handle.name);

    return { handle, fileName: handle.name, success: true };
  } catch (err: any) {
    if (err?.name === 'AbortError') return null;
    console.error('Error in saveAsNativeLeafvnFile:', err);
    throw err;
  }
}

/**
 * Fallback de descarga estándar para navegadores sin File System Access API
 */
export async function fallbackDownloadLeafvn(story: VNStory, fileName?: string): Promise<void> {
  const blob = await createStoryBundleBlob(story);
  const cleanTitle = (fileName || story.title || story.id || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const safeName = cleanTitle.endsWith('.leafvn') ? cleanTitle : `${cleanTitle}.leafvn`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 200);
}
