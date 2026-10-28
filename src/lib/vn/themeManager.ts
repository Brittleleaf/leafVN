export type VNEditorTheme = 'default_dark' | 'default_light' | 'rotp';

export interface VNThemeDefinition {
  id: VNEditorTheme;
  name: string;
  description: string;
  badge: string;
  previewBg: string;
  previewCard: string;
  previewBorder: string;
  previewAccent: string;
  previewText: string;
  fontName: string;
  isHorror?: boolean;
}

export const VN_THEMES: VNThemeDefinition[] = [
  {
    id: 'default_dark',
    name: 'Modern Dark',
    description: 'Obsidian & Deep Violet (#030207). Ambient acrylic glass, luminous accents and crisp icons.',
    badge: 'DARK',
    previewBg: '#030207',
    previewCard: 'rgba(46, 18, 86, 0.45)',
    previewBorder: '#B15BE4',
    previewAccent: '#D17BF8',
    previewText: '#F7F6FE',
    fontName: 'Barlow',
  },
  {
    id: 'default_light',
    name: 'Modern Light',
    description: 'Soft Lilac & Lavender frosted glass (#F5F2FF & #DDD7FF). Crystal acrylic clarity and deep contrast.',
    badge: 'LIGHT',
    previewBg: '#F5F2FF',
    previewCard: 'rgba(255, 255, 255, 0.72)',
    previewBorder: '#DDD7FF',
    previewAccent: '#6851DF',
    previewText: '#0F0503',
    fontName: 'Barlow',
  },
  {
    id: 'rotp',
    name: 'ROTP Theme',
    description: 'The iconic Rebirth of the Painter horror theme. Deep crimson borders, typewriter font, and VHS mood.',
    badge: 'ROTP',
    previewBg: '#07070a',
    previewCard: '#15070a',
    previewBorder: '#991b1b',
    previewAccent: '#dc2626',
    previewText: '#e5e7eb',
    fontName: 'Special Elite',
    isHorror: true,
  },
];

export interface AccentPreset {
  name: string;
  hex: string;
  hue: number;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Neon Violet', hex: '#D17BF8', hue: 281 },
  { name: 'Cyan Electric', hex: '#00E5FF', hue: 186 },
  { name: 'Emerald Mint', hex: '#10B981', hue: 160 },
  { name: 'Golden Amber', hex: '#F59E0B', hue: 38 },
  { name: 'Rose Pink', hex: '#F43F5E', hue: 350 },
  { name: 'Sky Azure', hex: '#38BDF8', hue: 199 },
  { name: 'Crimson Red', hex: '#EF4444', hue: 0 },
  { name: 'Toxic Lime', hex: '#84CC16', hue: 84 },
];

const THEME_STORAGE_KEY = 'vn_editor_theme';
const CUSTOM_ACCENT_KEY = 'vn_custom_accent_hex';

// ==========================================
// COLOR MATH & CONVERSION UTILITIES
// ==========================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => {
    const h = clamp(c).toString(16).toUpperCase();
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100) / 100,
    l: Math.round(l * 100) / 100,
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;
  const hue = ((h % 360) + 360) % 360;
  const hNorm = hue / 360;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function hueToHex(hue: number, saturation = 0.88, lightness = 0.65): string {
  return hslToHex(hue, saturation, lightness);
}

export function hexToHue(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 280;
  return rgbToHsl(rgb.r, rgb.g, rgb.b).h;
}

// ==========================================
// HARMONIC ACCENT & PALETTE DERIVATION
// ==========================================

export interface DerivedThemeVariables {
  accent: string;
  accent2: string;
  accentGlow: string;
  accentSurface: string;
  accentBorder: string;
  border: string;
  border2: string;
  borderHover: string;
  btnHoverBg: string;
  focus: string;
  panelHover: string;
  glowColor1: string;
  glowColor2: string;
  glowColor3: string;
  vnActiveTabBg: string;
  vnActiveTabBorder: string;
  vnAccentGradient: string;
}

export function derivePaletteFromAccent(accentHex: string): DerivedThemeVariables | null {
  const rgb = hexToRgb(accentHex);
  if (!rgb) return null;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const { r, g, b } = rgb;

  // Secondary accent: slightly deeper or shifted lightness for depth
  const accent2Hex = hslToHex(hsl.h, Math.min(1, hsl.s * 1.05), Math.max(0.2, hsl.l - 0.12));

  // Harmonic glow circles:
  // Glow 1: Analogous -30°
  const glow1Hex = hslToHex((hsl.h - 30 + 360) % 360, Math.max(0.65, hsl.s), Math.max(0.4, hsl.l - 0.05));
  // Glow 2: Primary Accent
  const glow2Hex = accentHex;
  // Glow 3: Harmonic shift +75° (complementary/split vibe)
  const glow3Hex = hslToHex((hsl.h + 75) % 360, Math.max(0.7, hsl.s), Math.min(0.75, hsl.l + 0.05));

  return {
    accent: accentHex,
    accent2: accent2Hex,
    accentGlow: `rgba(${r}, ${g}, ${b}, 0.45)`,
    accentSurface: `rgba(${r}, ${g}, ${b}, 0.18)`,
    accentBorder: `rgba(${r}, ${g}, ${b}, 0.50)`,
    border: `rgba(${r}, ${g}, ${b}, 0.25)`,
    border2: `rgba(${r}, ${g}, ${b}, 0.40)`,
    borderHover: `rgba(${r}, ${g}, ${b}, 0.65)`,
    btnHoverBg: `rgba(${r}, ${g}, ${b}, 0.25)`,
    focus: `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.35)`,
    panelHover: `rgba(${r}, ${g}, ${b}, 0.15)`,
    glowColor1: glow1Hex,
    glowColor2: glow2Hex,
    glowColor3: glow3Hex,
    vnActiveTabBg: `rgba(${r}, ${g}, ${b}, 0.20)`,
    vnActiveTabBorder: `rgba(${r}, ${g}, ${b}, 0.50)`,
    vnAccentGradient: `linear-gradient(135deg, ${accentHex} 0%, ${accent2Hex} 100%)`,
  };
}

// ==========================================
// THEME & ACCENT DOM INJECTION
// ==========================================

const CUSTOM_STYLE_VARS = [
  '--accent',
  '--accent2',
  '--accent-glow',
  '--accent-surface',
  '--accent-border',
  '--border',
  '--border2',
  '--border-hover',
  '--btn-hover-bg',
  '--focus',
  '--panel-hover',
  '--glow-color-1',
  '--glow-color-2',
  '--glow-color-3',
  '--vn-active-tab-bg',
  '--vn-active-tab-border',
  '--vn-accent-primary',
  '--vn-accent-gradient',
  '--vn-border-active',
];

export function applyCustomAccent(accentHex: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    const root = document.documentElement;

    if (!accentHex) {
      localStorage.removeItem(CUSTOM_ACCENT_KEY);
      for (const varName of CUSTOM_STYLE_VARS) {
        root.style.removeProperty(varName);
      }
      return;
    }

    const palette = derivePaletteFromAccent(accentHex);
    if (!palette) return;

    localStorage.setItem(CUSTOM_ACCENT_KEY, accentHex);

    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent2', palette.accent2);
    root.style.setProperty('--accent-glow', palette.accentGlow);
    root.style.setProperty('--accent-surface', palette.accentSurface);
    root.style.setProperty('--accent-border', palette.accentBorder);
    root.style.setProperty('--border', palette.border);
    root.style.setProperty('--border2', palette.border2);
    root.style.setProperty('--border-hover', palette.borderHover);
    root.style.setProperty('--btn-hover-bg', palette.btnHoverBg);
    root.style.setProperty('--focus', palette.focus);
    root.style.setProperty('--panel-hover', palette.panelHover);
    root.style.setProperty('--glow-color-1', palette.glowColor1);
    root.style.setProperty('--glow-color-2', palette.glowColor2);
    root.style.setProperty('--glow-color-3', palette.glowColor3);
    root.style.setProperty('--vn-active-tab-bg', palette.vnActiveTabBg);
    root.style.setProperty('--vn-active-tab-border', palette.vnActiveTabBorder);
    root.style.setProperty('--vn-accent-primary', palette.accent);
    root.style.setProperty('--vn-accent-gradient', palette.vnAccentGradient);
    root.style.setProperty('--vn-border-active', palette.accent);
  } catch {
    // ignore
  }
}

export function getStoredCustomAccent(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CUSTOM_ACCENT_KEY);
  } catch {
    return null;
  }
}

export function getStoredTheme(): VNEditorTheme {
  if (typeof window === 'undefined') return 'default_dark';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as VNEditorTheme | null;
    if (stored && (stored === 'default_dark' || stored === 'default_light' || stored === 'rotp')) {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'default_dark';
}

export function setStoredTheme(theme: VNEditorTheme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-vn-theme', theme);
  } catch {
    // ignore
  }
}

export function initStoredThemeAndAccent(): { theme: VNEditorTheme; customAccent: string | null } {
  const theme = getStoredTheme();
  setStoredTheme(theme);
  const customAccent = getStoredCustomAccent();
  if (customAccent) {
    applyCustomAccent(customAccent);
  }
  return { theme, customAccent };
}
