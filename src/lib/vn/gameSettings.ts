"use client";

export const VN_SETTINGS_KEYS = {
  TYPEWRITER_SPEED: 'leafvn_typewriter_speed',
  AUTO_ADVANCE_SPEED: 'leafvn_auto_advance_speed',
  GRAPHICS_QUALITY: 'leafvn_graphics_quality',
  LANGUAGE: 'leafvn_language',
} as const;

export interface VNGameSettings {
  typewriterSpeedMs: number;
  autoAdvanceSpeedMs: number;
  graphicsQuality: 'high' | 'performance';
  language: 'es' | 'en' | 'ja';
}

export function getGameSettings(): VNGameSettings {
  if (typeof window === 'undefined') {
    return {
      typewriterSpeedMs: 25,
      autoAdvanceSpeedMs: 2500,
      graphicsQuality: 'high',
      language: 'es',
    };
  }

  const rawTypewriter = parseInt(localStorage.getItem(VN_SETTINGS_KEYS.TYPEWRITER_SPEED) || '', 10);
  const rawAuto = parseInt(localStorage.getItem(VN_SETTINGS_KEYS.AUTO_ADVANCE_SPEED) || '', 10);
  const rawQuality = localStorage.getItem(VN_SETTINGS_KEYS.GRAPHICS_QUALITY);
  const rawLang = localStorage.getItem(VN_SETTINGS_KEYS.LANGUAGE);

  return {
    typewriterSpeedMs: Number.isFinite(rawTypewriter) && rawTypewriter >= 5 && rawTypewriter <= 100 ? rawTypewriter : 25,
    autoAdvanceSpeedMs: Number.isFinite(rawAuto) && rawAuto >= 500 && rawAuto <= 10000 ? rawAuto : 2500,
    graphicsQuality: rawQuality === 'performance' ? 'performance' : 'high',
    language: rawLang === 'en' || rawLang === 'ja' ? rawLang : 'es',
  };
}

export function notifyGameSettingsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vn_game_settings_changed'));
  }
}

export function saveGameSettings(patch: Partial<VNGameSettings>) {
  if (typeof window === 'undefined') return;
  if (patch.typewriterSpeedMs !== undefined) {
    localStorage.setItem(VN_SETTINGS_KEYS.TYPEWRITER_SPEED, String(patch.typewriterSpeedMs));
  }
  if (patch.autoAdvanceSpeedMs !== undefined) {
    localStorage.setItem(VN_SETTINGS_KEYS.AUTO_ADVANCE_SPEED, String(patch.autoAdvanceSpeedMs));
  }
  if (patch.graphicsQuality !== undefined) {
    localStorage.setItem(VN_SETTINGS_KEYS.GRAPHICS_QUALITY, patch.graphicsQuality);
  }
  if (patch.language !== undefined) {
    localStorage.setItem(VN_SETTINGS_KEYS.LANGUAGE, patch.language);
  }
  notifyGameSettingsChanged();
}
