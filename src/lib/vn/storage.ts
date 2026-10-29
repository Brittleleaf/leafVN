import { VNStory, VNSaveSlot, VNGameState } from '@/types/vn';
import { SAMPLE_STORY } from './sampleStory';

const STORAGE_KEYS = {
  CURRENT_STORY: 'vn_current_story',
  STORIES_LIST: 'vn_custom_stories',
  SAVE_SLOTS: 'vn_save_slots',
};

/**
 * Sanitiza y normaliza cualquier objeto de historia para asegurar que todos los campos
 * requeridos (characters, variables, scenarios, textBoxConfig, chapters) existan siempre como arrays válidos.
 */
interface RawStoryData {
  id?: string;
  version?: string;
  title?: string;
  author?: string;
  description?: string;
  coverImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  defaultFontFamily?: string;
  editorTheme?: any;
  textBoxConfig?: Record<string, unknown>;
  variables?: VNStory['variables'];
  characters?: VNStory['characters'];
  scenarios?: Array<Record<string, unknown>>;
  customAssets?: VNStory['customAssets'];
  chapters?: Array<Record<string, unknown>>;
}

export function sanitizeStory(raw: unknown): VNStory {
  const storyObj = (raw && typeof raw === 'object' ? raw : {}) as RawStoryData;
  if (!raw || typeof raw !== 'object') return SAMPLE_STORY;

  const chapters = Array.isArray(storyObj.chapters) && storyObj.chapters.length > 0
    ? (storyObj.chapters as Array<Record<string, any>>).map((ch, idx: number) => {
        const rawScenes = Array.isArray(ch.scenes) && ch.scenes.length > 0
          ? ch.scenes
          : [
              {
                id: `scene-${idx + 1}-1`,
                name: 'Scene 1',
                backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
                sceneType: 'standard',
                timeline: [
                  {
                    id: `ev-${Date.now()}-0`,
                    type: 'dialogue',
                    text: '...',
                  },
                ],
                hotspots: [],
              },
            ];

        const scenes = rawScenes.map((s: Record<string, any>, sIdx: number) => ({
          ...s,
          id: s.id || `scene-${idx + 1}-${sIdx + 1}`,
          name: s.name || `Scene ${sIdx + 1}`,
          backgroundUrl: s.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          sceneType: s.sceneType || 'standard',
          timeline: Array.isArray(s.timeline) && s.timeline.length > 0
            ? s.timeline
            : [
                {
                  id: `ev-${Date.now()}-${sIdx}`,
                  type: 'dialogue',
                  text: '...',
                },
              ],
          hotspots: Array.isArray(s.hotspots) ? s.hotspots : [],
        }));

        return {
          id: ch.id || `chap-${idx + 1}`,
          number: typeof ch.number === 'number' ? ch.number : idx + 1,
          title: ch.title || `Capítulo ${idx + 1}`,
          summary: ch.summary || '',
          startSceneId: ch.startSceneId && scenes.some((s: { id: string }) => s.id === ch.startSceneId)
            ? ch.startSceneId
            : scenes[0]?.id || '',
          loadingScreen: ch.loadingScreen || { enabled: false, title: ch.title || '' },
          scenes,
        };
      })
    : SAMPLE_STORY.chapters;

  return {
    id: typeof storyObj.id === 'string' && storyObj.id ? storyObj.id : SAMPLE_STORY.id,
    version: storyObj.version || '1.0.0',
    title: storyObj.title || SAMPLE_STORY.title,
    author: storyObj.author || SAMPLE_STORY.author,
    description: storyObj.description || '',
    coverImageUrl: storyObj.coverImageUrl || SAMPLE_STORY.coverImageUrl,
    createdAt: storyObj.createdAt || new Date().toISOString(),
    updatedAt: storyObj.updatedAt || new Date().toISOString(),
    defaultFontFamily: storyObj.defaultFontFamily || undefined,
    editorTheme: storyObj.editorTheme || undefined,
    textBoxConfig: {
      ...SAMPLE_STORY.textBoxConfig,
      ...(storyObj.textBoxConfig || {}),
    },
    variables: Array.isArray(storyObj.variables) ? storyObj.variables : SAMPLE_STORY.variables || [],
    characters: Array.isArray(storyObj.characters) ? storyObj.characters : SAMPLE_STORY.characters || [],
    scenarios: Array.isArray(storyObj.scenarios)
      ? (storyObj.scenarios as Array<Record<string, any>>).map((s, sIdx: number) => ({
          ...s,
          id: s.id || `scenario-${sIdx + 1}`,
          name: s.name || `Scenario ${sIdx + 1}`,
          backgroundUrl: s.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          sceneType: s.sceneType || 'standard',
          timeline: Array.isArray(s.timeline) && s.timeline.length > 0
            ? s.timeline
            : [
                {
                  id: `ev-sc-${Date.now()}-${sIdx}`,
                  type: 'dialogue',
                  text: '...',
                },
              ],
          hotspots: Array.isArray(s.hotspots) ? s.hotspots : [],
        }))
      : [],
    customAssets: Array.isArray(storyObj.customAssets) ? storyObj.customAssets : [],
    chapters,
  };
}

// Obtenemos la historia activa (por defecto la de muestra o la guardada por el usuario con sanitización completa)
export function getActiveStory(): VNStory {
  if (typeof window === 'undefined') return SAMPLE_STORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_STORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Si contiene el ID de la demo antigua con datos de prueba, purgar de localStorage
      if (parsed?.id === 'story-rebirth-painter-01') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_STORY);
        return SAMPLE_STORY;
      }
      if (parsed?.id) {
        return sanitizeStory(parsed);
      }
    }
  } catch (err) {
    console.error('Error loading active story from localStorage:', err);
  }
  return SAMPLE_STORY;
}

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingStoryToSave: VNStory | null = null;

function executeDirectSave(story: VNStory): void {
  try {
    story.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.CURRENT_STORY, JSON.stringify(story));
    if (story?.id) {
      localStorage.setItem('vn_active_project_id', story.id);
    }
  } catch (err: unknown) {
    const errorObj = err as { name?: string; code?: number };
    console.error('Error saving active story:', err);
    if (errorObj?.name === 'QuotaExceededError' || errorObj?.code === 22) {
      console.warn('Storage Quota reached in browser localStorage');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vn:storage_quota_warning', {
            detail: {
              message:
                'Storage warning: Local images have reached the browser storage limit. Export your project with [Export JSON] to ensure your backup.',
            },
          })
        );
      }
    }
  }
}

// Flush pending story save to localStorage immediately
export function flushPendingStorySave(): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  if (pendingStoryToSave) {
    executeDirectSave(pendingStoryToSave);
    pendingStoryToSave = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushPendingStorySave();
  });
}

// Guardamos la historia activa en localStorage con debouncing para evitar bloquear el hilo principal al escribir
export function saveActiveStory(story: VNStory, immediate: boolean = false): void {
  if (typeof window === 'undefined') return;
  pendingStoryToSave = story;

  if (immediate) {
    flushPendingStorySave();
    return;
  }

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(() => {
    flushPendingStorySave();
  }, 400);
}

// Restablecer a la historia oficial de muestra
export function resetToSampleStory(): VNStory {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_STORY);
  }
  return SAMPLE_STORY;
}

// Exportar historia a archivo JSON descargable (Usa Blob y createObjectURL para soportar cualquier tamaño)
export function exportStoryToJson(story: VNStory): void {
  if (typeof window === 'undefined') return;
  try {
    const jsonText = JSON.stringify(story, null, 2);
    const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    const safeTitle = (story.title || 'visual_novel_story')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    downloadAnchor.setAttribute('download', `${safeTitle || 'story'}.vn.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }, 150);
  } catch (err) {
    console.error('Error exporting story to JSON:', err);
  }
}

// Importar historia desde archivo JSON con sanitización y tolerancia a fallos
export async function importStoryFromJson(file: File): Promise<VNStory> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid file for import.'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain a valid JSON object.');
        }
        if (!parsed.chapters && !parsed.scenarios && !parsed.title) {
          throw new Error('File does not match valid Visual Novel story format.');
        }
        const cleanStory = sanitizeStory(parsed);
        resolve(cleanStory);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsText(file);
  });
}

// GESTIÓN DE RANURAS DE GUARDADO (SAVESTATES)
export function getSaveSlots(storyId?: string): VNSaveSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVE_SLOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validSlots = parsed.filter(
          (s): s is VNSaveSlot => Boolean(s && typeof s === 'object' && typeof s.slotNumber === 'number' && Number.isFinite(s.slotNumber))
        );
        if (storyId) {
          return validSlots.filter((s) => !s.storyId || s.storyId === storyId);
        }
        return validSlots;
      }
    }
  } catch (err) {
    console.error('Error loading save slots:', err);
  }
  return [];
}

export function saveGameStateToSlot(slotNumber: number, story: VNStory, state: VNGameState, previewBg?: string): VNSaveSlot[] {
  if (typeof window === 'undefined') return [];
  const safeSlotNumber = Number.isFinite(slotNumber) ? Math.floor(slotNumber) : 1;
  let allSlots: VNSaveSlot[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVE_SLOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allSlots = parsed.filter(
          (s): s is VNSaveSlot => Boolean(s && typeof s === 'object' && typeof s.slotNumber === 'number' && Number.isFinite(s.slotNumber))
        );
      }
    }
  } catch (err) {
    console.error('Error reading save slots for saving:', err);
  }

  const chapters = Array.isArray(story?.chapters) ? story.chapters : [];
  const currentChapter = chapters.find((c) => c && c.id === state?.currentChapterId) || chapters[0];
  let currentScene = currentChapter?.scenes?.find((s) => s && s.id === state?.currentSceneId);
  if (!currentScene) {
    currentScene = (story?.scenarios || []).find((s) => s && s.id === state?.currentSceneId);
  }

  const newSlot: VNSaveSlot = {
    id: `slot-${safeSlotNumber}-${Date.now()}`,
    storyId: story?.id,
    slotNumber: safeSlotNumber,
    savedAt: new Date().toLocaleString(),
    storyTitle: story?.title || 'Visual Novel',
    chapterTitle: currentChapter?.title || 'Unknown Chapter',
    sceneName: currentScene?.name || 'Unknown Scene',
    previewBg: previewBg || currentScene?.backgroundUrl,
    gameState: state,
  };

  const updatedAll = allSlots.filter(
    (s) => !(s && s.slotNumber === safeSlotNumber && (!s.storyId || s.storyId === story?.id))
  );
  updatedAll.push(newSlot);
  updatedAll.sort((a, b) => a.slotNumber - b.slotNumber);

  try {
    localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(updatedAll));
  } catch (err: unknown) {
    const errorObj = err as { name?: string; code?: number };
    if (errorObj?.name === 'QuotaExceededError' || errorObj?.code === 22) {
      if (newSlot.previewBg && newSlot.previewBg.startsWith('data:')) {
        newSlot.previewBg = undefined;
      }
      if (newSlot.gameState?.customSceneBg && newSlot.gameState.customSceneBg.startsWith('data:')) {
        newSlot.gameState.customSceneBg = null;
      }
      try {
        localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(updatedAll));
        return story?.id ? updatedAll.filter((s) => !s.storyId || s.storyId === story.id) : updatedAll;
      } catch {}
      console.warn('Storage Quota exceeded while saving game slot');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vn:storage_quota_warning', {
            detail: {
              message: 'Storage warning: Insufficient browser space to save game progress.',
            },
          })
        );
      }
    }
  }

  return story?.id ? updatedAll.filter((s) => !s.storyId || s.storyId === story.id) : updatedAll;
}

export function deleteSaveSlot(slotNumber: number, storyId?: string): VNSaveSlot[] {
  if (typeof window === 'undefined') return [];
  const safeSlotNumber = Number.isFinite(slotNumber) ? Math.floor(slotNumber) : 1;
  let allSlots: VNSaveSlot[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVE_SLOTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allSlots = parsed.filter(
          (s): s is VNSaveSlot => Boolean(s && typeof s === 'object' && typeof s.slotNumber === 'number' && Number.isFinite(s.slotNumber))
        );
      }
    }
  } catch (err) {
    console.error('Error reading save slots for deletion:', err);
  }

  const remaining = allSlots.filter((s) => {
    if (!s) return false;
    if (storyId) {
      return !(s.slotNumber === safeSlotNumber && (!s.storyId || s.storyId === storyId));
    }
    return s.slotNumber !== safeSlotNumber;
  });

  try {
    localStorage.setItem(STORAGE_KEYS.SAVE_SLOTS, JSON.stringify(remaining));
  } catch (err) {
    console.error('Error deleting slot:', err);
  }

  return storyId ? remaining.filter((s) => !s.storyId || s.storyId === storyId) : remaining;
}

