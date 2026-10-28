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
    description: 'Obsidian & Deep Glass (#030207). Ambient acrylic glass, luminous accents and crisp icons.',
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
const DYNAMIC_STYLE_ID = 'vn-dynamic-theme-vars';

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
// HARMONIC ACCENT & TOTAL PALETTE DERIVATION
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
  panel: string;
  panel2: string;
  panelHover: string;
  btnBg: string;
  btnHoverBg: string;
  cardBg: string;
  modalBg: string;
  dropdownBg: string;
  wellFocusBg: string;
  muted: string;
  muted2: string;
  focus: string;
  glowColor1: string;
  glowColor2: string;
  glowColor3: string;
  vnActiveTabBg: string;
  vnActiveTabBorder: string;
  vnAccentPrimary: string;
  vnAccentGradient: string;
  vnCardSolid: string;
}

export function derivePaletteFromAccent(accentHex: string, isLightMode = false): DerivedThemeVariables | null {
  const rgb = hexToRgb(accentHex);
  if (!rgb) return null;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const { r, g, b } = rgb;

  // Secondary accent: deeper and slightly higher saturation for contrast
  const accent2Hex = hslToHex(hsl.h, Math.min(1, hsl.s * 1.05), Math.max(0.2, hsl.l - 0.12));

  // Harmonic glow circles:
  // Glow 1: Analogous -30°
  const glow1Hex = hslToHex((hsl.h - 30 + 360) % 360, Math.max(0.7, hsl.s), 0.55);
  // Glow 2: Primary Accent
  const glow2Hex = accentHex;
  // Glow 3: Harmonic shift +75° (complementary/split vibe)
  const glow3Hex = hslToHex((hsl.h + 75) % 360, Math.max(0.75, hsl.s), 0.55);

  if (isLightMode) {
    // Light mode palette derivation
    const mutedHex = hslToHex(hsl.h, 0.55, 0.20);
    const muted2Hex = hslToHex(hsl.h, 0.45, 0.38);
    const panelBg = 'rgba(255, 255, 255, 0.65)';
    const panel2Bg = `rgba(${r}, ${g}, ${b}, 0.12)`;
    const btnBg = 'rgba(255, 255, 255, 0.75)';
    const cardBg = `linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(${Math.round(r * 0.15 + 215)}, ${Math.round(g * 0.15 + 215)}, ${Math.round(b * 0.15 + 215)}, 0.55) 100%)`;
    const modalBg = `linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(${Math.round(r * 0.1 + 225)}, ${Math.round(g * 0.1 + 225)}, ${Math.round(b * 0.1 + 225)}, 0.98))`;
    const dropdownBg = 'rgba(255, 255, 255, 0.97)';
    const wellFocusBg = 'rgba(255, 255, 255, 0.92)';

    return {
      accent: accentHex,
      accent2: accent2Hex,
      accentGlow: `rgba(${r}, ${g}, ${b}, 0.30)`,
      accentSurface: `rgba(${r}, ${g}, ${b}, 0.12)`,
      accentBorder: `rgba(${r}, ${g}, ${b}, 0.40)`,
      border: `rgba(${r}, ${g}, ${b}, 0.18)`,
      border2: `rgba(${r}, ${g}, ${b}, 0.30)`,
      borderHover: `rgba(${r}, ${g}, ${b}, 0.45)`,
      panel: panelBg,
      panel2: panel2Bg,
      panelHover: 'rgba(255, 255, 255, 0.85)',
      btnBg: btnBg,
      btnHoverBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: cardBg,
      modalBg: modalBg,
      dropdownBg: dropdownBg,
      wellFocusBg: wellFocusBg,
      muted: mutedHex,
      muted2: muted2Hex,
      focus: `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.25)`,
      glowColor1: glow1Hex,
      glowColor2: glow2Hex,
      glowColor3: glow3Hex,
      vnActiveTabBg: `rgba(${r}, ${g}, ${b}, 0.15)`,
      vnActiveTabBorder: `rgba(${r}, ${g}, ${b}, 0.45)`,
      vnAccentPrimary: accentHex,
      vnAccentGradient: `linear-gradient(135deg, ${accentHex} 0%, ${accent2Hex} 100%)`,
      vnCardSolid: '#ffffff',
    };
  }

  // Dark mode palette derivation
  // Deep surface tints aligned with the selected accent hue (never stuck in purple!)
  const deepR = Math.round(r * 0.14 + 4);
  const deepG = Math.round(g * 0.14 + 4);
  const deepB = Math.round(b * 0.14 + 7);

  // Muted and secondary texts derived from chosen hue:
  // e.g. for Cyan: luminous ice cyan #A5F3FC and #22D3EE
  // e.g. for Green: luminous mint #A7F3D0 and #34D399
  // e.g. for Amber: luminous gold #FDE68A and #F59E0B
  const mutedHex = hslToHex(hsl.h, 0.45, 0.82);
  const muted2Hex = hslToHex(hsl.h, 0.60, 0.62);

  const panelBg = `rgba(${deepR}, ${deepG}, ${deepB}, 0.25)`;
  const panel2Bg = `rgba(${deepR}, ${deepG}, ${deepB}, 0.45)`;
  const btnBg = `rgba(${deepR}, ${deepG}, ${deepB}, 0.55)`;
  const cardBg = `linear-gradient(135deg, rgba(${deepR}, ${deepG}, ${deepB}, 0.55) 0%, rgba(1, 1, 3, 0.75) 100%)`;
  const modalBg = `linear-gradient(180deg, rgba(${Math.round(deepR * 0.8 + 2)}, ${Math.round(deepG * 0.8 + 2)}, ${Math.round(deepB * 0.8 + 4)}, 0.96), rgba(1, 1, 3, 0.98))`;
  const dropdownBg = `rgba(${Math.round(deepR * 0.4 + 6)}, ${Math.round(deepG * 0.4 + 6)}, ${Math.round(deepB * 0.4 + 8)}, 0.96)`;
  const wellFocusBg = `rgba(${deepR}, ${deepG}, ${deepB}, 0.85)`;
  const vnCardSolid = `rgb(${deepR}, ${deepG}, ${deepB})`;

  return {
    accent: accentHex,
    accent2: accent2Hex,
    accentGlow: `rgba(${r}, ${g}, ${b}, 0.45)`,
    accentSurface: `rgba(${r}, ${g}, ${b}, 0.18)`,
    accentBorder: `rgba(${r}, ${g}, ${b}, 0.50)`,
    border: `rgba(${r}, ${g}, ${b}, 0.25)`,
    border2: `rgba(${r}, ${g}, ${b}, 0.40)`,
    borderHover: `rgba(${r}, ${g}, ${b}, 0.65)`,
    panel: panelBg,
    panel2: panel2Bg,
    panelHover: `rgba(${r}, ${g}, ${b}, 0.15)`,
    btnBg: btnBg,
    btnHoverBg: `rgba(${r}, ${g}, ${b}, 0.25)`,
    cardBg: cardBg,
    modalBg: modalBg,
    dropdownBg: dropdownBg,
    wellFocusBg: wellFocusBg,
    muted: mutedHex,
    muted2: muted2Hex,
    focus: `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.35)`,
    glowColor1: glow1Hex,
    glowColor2: glow2Hex,
    glowColor3: glow3Hex,
    vnActiveTabBg: `rgba(${r}, ${g}, ${b}, 0.20)`,
    vnActiveTabBorder: `rgba(${r}, ${g}, ${b}, 0.50)`,
    vnAccentPrimary: accentHex,
    vnAccentGradient: `linear-gradient(135deg, ${accentHex} 0%, ${accent2Hex} 100%)`,
    vnCardSolid: vnCardSolid,
  };
}

// ==========================================
// THEME & ACCENT DOM INJECTION
// ==========================================

export function applyCustomAccent(accentHex: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    const existingStyle = document.getElementById(DYNAMIC_STYLE_ID);

    if (!accentHex) {
      localStorage.removeItem(CUSTOM_ACCENT_KEY);
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    const currentTheme = getStoredTheme();
    const isLightMode = currentTheme === 'default_light';
    const palette = derivePaletteFromAccent(accentHex, isLightMode);
    if (!palette) return;

    localStorage.setItem(CUSTOM_ACCENT_KEY, accentHex);

    // Inyectar hoja de estilo con máxima especificidad (!important) para garantizar
    // que absolutamente todos los elementos del motor adopten el nuevo matiz y
    // eliminen por completo cualquier color morado residual.
    const cssRules = `
:root,
[data-vn-theme],
[data-vn-engine="true"],
.vn-engine-root {
  --accent: ${palette.accent} !important;
  --accent2: ${palette.accent2} !important;
  --accent-glow: ${palette.accentGlow} !important;
  --accent-surface: ${palette.accentSurface} !important;
  --accent-border: ${palette.accentBorder} !important;
  --border: ${palette.border} !important;
  --border2: ${palette.border2} !important;
  --border-hover: ${palette.borderHover} !important;
  --panel: ${palette.panel} !important;
  --panel2: ${palette.panel2} !important;
  --panel-hover: ${palette.panelHover} !important;
  --btn-bg: ${palette.btnBg} !important;
  --btn-hover-bg: ${palette.btnHoverBg} !important;
  --card-bg: ${palette.cardBg} !important;
  --modal-bg: ${palette.modalBg} !important;
  --dropdown-bg: ${palette.dropdownBg} !important;
  --well-focus-bg: ${palette.wellFocusBg} !important;
  --muted: ${palette.muted} !important;
  --muted2: ${palette.muted2} !important;
  --focus: ${palette.focus} !important;
  --glow-color-1: ${palette.glowColor1} !important;
  --glow-color-2: ${palette.glowColor2} !important;
  --glow-color-3: ${palette.glowColor3} !important;
  --vn-active-tab-bg: ${palette.vnActiveTabBg} !important;
  --vn-active-tab-border: ${palette.vnActiveTabBorder} !important;
  --vn-accent-primary: ${palette.accent} !important;
  --vn-accent-gradient: ${palette.vnAccentGradient} !important;
  --vn-border-active: ${palette.accent} !important;
  --vn-card-solid: ${palette.vnCardSolid} !important;
}
`;

    let styleEl = existingStyle as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = DYNAMIC_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssRules;
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
    // Si hay un acento personalizado activo, reaplicarlo para ajustar paleta de luz u oscuridad
    const customAccent = getStoredCustomAccent();
    if (customAccent) {
      applyCustomAccent(customAccent);
    }
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
