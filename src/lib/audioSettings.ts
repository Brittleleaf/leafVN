/**
 * Audio settings stored in localStorage.
 * Keys:
 *   site_mute_all   = "true" | "false"
 *   site_mute_nav   = "true" | "false"
 *   site_volume     = "0".."100"  (integer string)
 */

export const AUDIO_KEYS = {
  MUTE_ALL: 'site_mute_all',
  MUTE_NAV: 'site_mute_nav',
  VOLUME: 'site_volume',
} as const;

export function getAudioSettings() {
  if (typeof window === 'undefined') return { muteAll: false, muteNav: false, volume: 60 };
  const rawVol = localStorage.getItem(AUDIO_KEYS.VOLUME);
  const parsedVol = rawVol ? parseInt(rawVol, 10) : 60;
  return {
    muteAll: localStorage.getItem(AUDIO_KEYS.MUTE_ALL) === 'true',
    muteNav: localStorage.getItem(AUDIO_KEYS.MUTE_NAV) === 'true',
    volume: Number.isFinite(parsedVol) ? Math.max(0, Math.min(100, parsedVol)) : 60,
  };
}

export const UI_SFX = {
  CLICK: '/assets/ui-sfx/Click.mp3',
  SELECT: '/assets/ui-sfx/Select.mp3',
  OPEN: '/assets/ui-sfx/Open.mp3',
  DELETE: '/assets/ui-sfx/Delete.mp3',
  ERROR: '/assets/ui-sfx/Error-sound-ui.mp3',
  NOTIFY: '/assets/ui-sfx/Notification.mp3',
  HOVER: '/assets/ui-sfx/UI hover.mp3',
} as const;

export type UiSoundType = 'click' | 'select' | 'open' | 'delete' | 'error' | 'notify' | 'hover';

/** Legacy UI sound mapping to professional UI sounds */
const LEGACY_UI_SOUND_MAP: Record<string, string> = {
  '/assets/sfx/click intro.mp3': UI_SFX.CLICK,
  '/assets/sfx/click interface.mp3': UI_SFX.SELECT,
  '/assets/sfx/corrupt file.mp3': UI_SFX.DELETE,
  '/assets/sfx/open folder.mp3': UI_SFX.OPEN,
  '/assets/sfx/error.mp3': UI_SFX.ERROR,
  '/assets/sfx/notification.mp3': UI_SFX.NOTIFY,
  '/assets/sfx/hover.mp3': UI_SFX.HOVER,
};

/** Play a sound respecting user audio settings.
 *  @param src     - path to the audio file
 *  @param isNav   - true if this is a navigation/UI click sound
 *  @param baseVol - base volume 0..1 (will be scaled by user setting)
 */
// Pool para reciclar instancias de efectos de sonido frecuentes (tecleo, clics) y evitar fugas de memoria
const sfxPool = new Map<string, HTMLAudioElement[]>();
const MAX_POOL_PER_SRC = 4;

export function playSfx(src: string, isNav = false, baseVol = 1): HTMLAudioElement | undefined {
  if (!src) return;
  const { muteAll, muteNav, volume } = getAudioSettings();
  if (muteAll) return;
  if (isNav && muteNav) return;

  try {
    const resolvedSrc = LEGACY_UI_SOUND_MAP[src] || src;
    const safeUrl = resolvedSrc.startsWith('http') || resolvedSrc.startsWith('/')
      ? encodeURI(decodeURI(resolvedSrc))
      : resolvedSrc;

    // Buscar una instancia inactiva en el pool
    const pool = sfxPool.get(safeUrl) || [];
    let audio = pool.find((a) => a.paused || a.ended);

    if (!audio) {
      audio = new Audio(safeUrl);
      if (pool.length < MAX_POOL_PER_SRC) {
        pool.push(audio);
        sfxPool.set(safeUrl, pool);
      }
    } else {
      audio.currentTime = 0;
    }

    audio.volume = Math.max(0, Math.min(1, baseVol * (volume / 100)));

    const handleRelease = () => {
      if (audio && !pool.includes(audio)) {
        audio.onended = null;
        audio.onerror = null;
        try {
          audio.removeAttribute('src');
          audio.load();
        } catch {}
      }
    };

    audio.onended = handleRelease;
    audio.onerror = handleRelease;

    audio.play().catch((err: unknown) => {
      const errorName = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
      if (errorName !== 'NotAllowedError' && errorName !== 'AbortError') {
        console.warn('Audio play blocked or unavailable:', err, resolvedSrc);
      }
      handleRelease();
    });

    return audio;
  } catch (err) {
    console.warn('Error inicializando Audio:', err, src);
  }
}

/**
 * Play a standard, professional UI sound effect
 */
export function playUiSound(type: UiSoundType, volume = 0.5) {
  const map: Record<UiSoundType, string> = {
    click: UI_SFX.CLICK,
    select: UI_SFX.SELECT,
    open: UI_SFX.OPEN,
    delete: UI_SFX.DELETE,
    error: UI_SFX.ERROR,
    notify: UI_SFX.NOTIFY,
    hover: UI_SFX.HOVER,
  };
  return playSfx(map[type] || UI_SFX.CLICK, true, volume);
}

// ---------------------------------------------------------------------------
// Singleton Audio Preview Manager (Auditions in Media Library, Inspectors, Modals)
// Ensures only one preview plays at any time, stopping any previous preview.
// ---------------------------------------------------------------------------
let activePreviewAudio: HTMLAudioElement | null = null;
let activePreviewUrl: string | null = null;
const previewListeners: Set<() => void> = new Set();

function notifyPreviewListeners() {
  previewListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore
    }
  });
}

export function subscribeAudioPreview(listener: () => void) {
  previewListeners.add(listener);
  return () => {
    previewListeners.delete(listener);
  };
}

export function stopAudioPreview() {
  if (activePreviewAudio) {
    try {
      activePreviewAudio.pause();
      activePreviewAudio.removeAttribute('src');
      activePreviewAudio.load();
    } catch {
      // ignore
    }
    activePreviewAudio = null;
    activePreviewUrl = null;
    notifyPreviewListeners();
  }
}

export function playAudioPreview(src: string, volume = 0.8): HTMLAudioElement | null {
  if (!src) return null;

  // Toggle stop if clicking the exact same audio while it is playing
  if (activePreviewAudio && activePreviewUrl === src && !activePreviewAudio.paused) {
    stopAudioPreview();
    return null;
  }

  // Always stop previous preview audio
  stopAudioPreview();

  const { muteAll, volume: userVol } = getAudioSettings();
  if (muteAll) return null;

  try {
    const resolvedSrc = LEGACY_UI_SOUND_MAP[src] || src;
    const safeUrl = resolvedSrc.startsWith('http') || resolvedSrc.startsWith('/') ? encodeURI(decodeURI(resolvedSrc)) : resolvedSrc;
    const audio = new Audio(safeUrl);
    audio.volume = Math.max(0, Math.min(1, volume * (userVol / 100)));

    activePreviewAudio = audio;
    activePreviewUrl = src;
    notifyPreviewListeners();

    audio.onended = () => {
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
        activePreviewUrl = null;
        notifyPreviewListeners();
      }
    };

    audio.onerror = () => {
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
        activePreviewUrl = null;
        notifyPreviewListeners();
      }
    };

    audio.play().catch((err: unknown) => {
      const errorName = err && typeof err === 'object' && 'name' in err ? (err as { name: string }).name : '';
      if (errorName !== 'NotAllowedError' && errorName !== 'AbortError') {
        console.warn('Audio preview play blocked or unavailable:', err, src);
      }
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
        activePreviewUrl = null;
        notifyPreviewListeners();
      }
    });

    return audio;
  } catch (err) {
    console.warn('Error starting audio preview:', err, src);
    return null;
  }
}

export function isAudioPreviewPlaying(src?: string): boolean {
  if (!activePreviewAudio || activePreviewAudio.paused) return false;
  if (src) return activePreviewUrl === src;
  return true;
}

export function getCurrentlyPlayingPreviewUrl(): string | null {
  return activePreviewUrl;
}

export const getActivePreviewUrl = getCurrentlyPlayingPreviewUrl;

/**
 * Detiene inmediatamente todas las reproducciones de audio activas (preview, pools, etc.)
 */
export function stopAllAudio(): void {
  stopAudioPreview();
  sfxPool.forEach((pool) => {
    pool.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    });
  });
}
