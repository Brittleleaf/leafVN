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
  { name: 'Monochrome Noir', hex: '#000000', hue: 0 },
  { name: 'Pure White', hex: '#FFFFFF', hue: 0 },
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

export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
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
  accentContrast: string;
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
  text: string;
  iconColor: string;
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
  const luminance = getLuminance(r, g, b);

  // High-contrast text on accent elements (buttons, active tabs)
  // Contrast ratio WCAG: If luminance > 0.38, text MUST be solid dark; otherwise bright white.
  const accentContrast = luminance > 0.38 ? '#07040B' : '#FFFFFF';

  const isPureBlack = accentHex.toUpperCase() === '#000000' || hsl.l < 0.05;
  const isPureWhite = accentHex.toUpperCase() === '#FFFFFF' || hsl.l > 0.95;

  // ----------------------------------------------------
  // CASE 1: PURE BLACK (#000000) OR ULTRA DARK ACCENT
  // ----------------------------------------------------
  if (isPureBlack) {
    if (isLightMode) {
      // In light mode, pure black is ultra-crisp ink on paper
      return {
        accent: '#000000',
        accent2: '#27272A',
        accentContrast: '#FFFFFF',
        accentGlow: 'rgba(0, 0, 0, 0.20)',
        accentSurface: 'rgba(0, 0, 0, 0.08)',
        accentBorder: '#000000',
        border: 'rgba(0, 0, 0, 0.20)',
        border2: 'rgba(0, 0, 0, 0.40)',
        borderHover: 'rgba(0, 0, 0, 0.65)',
        panel: 'rgba(255, 255, 255, 0.70)',
        panel2: 'rgba(0, 0, 0, 0.06)',
        panelHover: 'rgba(255, 255, 255, 0.95)',
        btnBg: 'rgba(255, 255, 255, 0.85)',
        btnHoverBg: 'rgba(0, 0, 0, 0.06)',
        cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 245, 0.80) 100%)',
        modalBg: 'linear-gradient(180deg, #FFFFFF, #F8F8FA)',
        dropdownBg: 'rgba(255, 255, 255, 0.98)',
        wellFocusBg: '#FFFFFF',
        text: '#0F0503',
        iconColor: '#0F0503',
        muted: '#3F3F46',
        muted2: '#71717A',
        focus: '0 0 0 3px rgba(0, 0, 0, 0.25)',
        glowColor1: '#a1a1aa',
        glowColor2: '#71717a',
        glowColor3: '#52525b',
        vnActiveTabBg: 'rgba(0, 0, 0, 0.10)',
        vnActiveTabBorder: '#000000',
        vnAccentPrimary: '#000000',
        vnAccentGradient: 'linear-gradient(135deg, #000000 0%, #27272A 100%)',
        vnCardSolid: '#FFFFFF',
      };
    } else {
      // In dark mode, pure black on obsidian needs visible white/zinc borders so it never vanishes
      return {
        accent: '#18181B',
        accent2: '#27272A',
        accentContrast: '#FFFFFF',
        accentGlow: 'rgba(255, 255, 255, 0.15)',
        accentSurface: 'rgba(255, 255, 255, 0.10)',
        accentBorder: 'rgba(255, 255, 255, 0.60)',
        border: 'rgba(255, 255, 255, 0.20)',
        border2: 'rgba(255, 255, 255, 0.40)',
        borderHover: 'rgba(255, 255, 255, 0.65)',
        panel: 'rgba(255, 255, 255, 0.04)',
        panel2: 'rgba(255, 255, 255, 0.08)',
        panelHover: 'rgba(255, 255, 255, 0.14)',
        btnBg: 'rgba(255, 255, 255, 0.08)',
        btnHoverBg: 'rgba(255, 255, 255, 0.18)',
        cardBg: 'linear-gradient(135deg, rgba(24, 24, 27, 0.70) 0%, rgba(3, 2, 7, 0.85) 100%)',
        modalBg: 'linear-gradient(180deg, rgba(20, 20, 24, 0.98), rgba(3, 2, 7, 0.99))',
        dropdownBg: 'rgba(18, 18, 22, 0.98)',
        wellFocusBg: 'rgba(30, 30, 36, 0.85)',
        text: '#F7F6FE',
        iconColor: '#F7F6FE',
        muted: '#D4D4D8',
        muted2: '#A1A1AA',
        focus: '0 0 0 3px rgba(255, 255, 255, 0.30)',
        glowColor1: '#3f3f46',
        glowColor2: '#52525b',
        glowColor3: '#71717a',
        vnActiveTabBg: 'rgba(255, 255, 255, 0.12)',
        vnActiveTabBorder: 'rgba(255, 255, 255, 0.60)',
        vnAccentPrimary: '#18181B',
        vnAccentGradient: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
        vnCardSolid: '#18181B',
      };
    }
  }

  // ----------------------------------------------------
  // CASE 2: PURE WHITE (#FFFFFF) OR ULTRA LIGHT ACCENT
  // ----------------------------------------------------
  if (isPureWhite) {
    if (isLightMode) {
      // In light mode, white on white background needs distinct dark borders and contrast text
      return {
        accent: '#FFFFFF',
        accent2: '#E4E4E7',
        accentContrast: '#0F0503',
        accentGlow: 'rgba(0, 0, 0, 0.12)',
        accentSurface: 'rgba(0, 0, 0, 0.05)',
        accentBorder: 'rgba(0, 0, 0, 0.40)',
        border: 'rgba(0, 0, 0, 0.18)',
        border2: 'rgba(0, 0, 0, 0.35)',
        borderHover: 'rgba(0, 0, 0, 0.55)',
        panel: 'rgba(255, 255, 255, 0.75)',
        panel2: 'rgba(0, 0, 0, 0.04)',
        panelHover: '#FFFFFF',
        btnBg: 'rgba(255, 255, 255, 0.88)',
        btnHoverBg: '#FFFFFF',
        cardBg: 'linear-gradient(135deg, #FFFFFF 0%, #F5F2FF 100%)',
        modalBg: 'linear-gradient(180deg, #FFFFFF, #F8F8FA)',
        dropdownBg: 'rgba(255, 255, 255, 0.98)',
        wellFocusBg: '#FFFFFF',
        text: '#0F0503',
        iconColor: '#0F0503',
        muted: '#3F3F46',
        muted2: '#71717A',
        focus: '0 0 0 3px rgba(0, 0, 0, 0.20)',
        glowColor1: '#cbd5e1',
        glowColor2: '#e2e8f0',
        glowColor3: '#94a3b8',
        vnActiveTabBg: 'rgba(0, 0, 0, 0.08)',
        vnActiveTabBorder: 'rgba(0, 0, 0, 0.45)',
        vnAccentPrimary: '#FFFFFF',
        vnAccentGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E4E4E7 100%)',
        vnCardSolid: '#FFFFFF',
      };
    } else {
      // In dark mode, pure white shines like moonlight against obsidian
      return {
        accent: '#FFFFFF',
        accent2: '#E4E4E7',
        accentContrast: '#07040B',
        accentGlow: 'rgba(255, 255, 255, 0.35)',
        accentSurface: 'rgba(255, 255, 255, 0.18)',
        accentBorder: '#FFFFFF',
        border: 'rgba(255, 255, 255, 0.28)',
        border2: 'rgba(255, 255, 255, 0.50)',
        borderHover: 'rgba(255, 255, 255, 0.75)',
        panel: 'rgba(255, 255, 255, 0.05)',
        panel2: 'rgba(255, 255, 255, 0.09)',
        panelHover: 'rgba(255, 255, 255, 0.16)',
        btnBg: 'rgba(255, 255, 255, 0.12)',
        btnHoverBg: 'rgba(255, 255, 255, 0.24)',
        cardBg: 'linear-gradient(135deg, rgba(30, 30, 35, 0.60) 0%, rgba(3, 2, 7, 0.80) 100%)',
        modalBg: 'linear-gradient(180deg, rgba(25, 25, 30, 0.98), rgba(3, 2, 7, 0.99))',
        dropdownBg: 'rgba(20, 20, 25, 0.98)',
        wellFocusBg: 'rgba(35, 35, 42, 0.85)',
        text: '#F7F6FE',
        iconColor: '#F7F6FE',
        muted: '#E4E4E7',
        muted2: '#A1A1AA',
        focus: '0 0 0 3px rgba(255, 255, 255, 0.40)',
        glowColor1: '#71717a',
        glowColor2: '#d4d4d8',
        glowColor3: '#a1a1aa',
        vnActiveTabBg: 'rgba(255, 255, 255, 0.20)',
        vnActiveTabBorder: '#FFFFFF',
        vnAccentPrimary: '#FFFFFF',
        vnAccentGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E4E4E7 100%)',
        vnCardSolid: '#1E1E24',
      };
    }
  }

  // ----------------------------------------------------
  // CASE 3: ALL CHROMATIC HUES (0° - 360°)
  // ----------------------------------------------------
  const accent2Hex = hslToHex(hsl.h, Math.min(1, hsl.s * 1.05), Math.max(0.18, hsl.l - 0.12));
  const glow1Hex = hslToHex((hsl.h - 30 + 360) % 360, Math.max(0.7, hsl.s), 0.55);
  const glow2Hex = accentHex;
  const glow3Hex = hslToHex((hsl.h + 75) % 360, Math.max(0.75, hsl.s), 0.55);

  if (isLightMode) {
    // In light mode, muted texts MUST have low lightness (<= 0.25) so they contrast with light backgrounds!
    const mutedHex = hslToHex(hsl.h, Math.min(0.65, hsl.s), 0.22);
    const muted2Hex = hslToHex(hsl.h, Math.min(0.55, hsl.s), 0.38);

    return {
      accent: accentHex,
      accent2: accent2Hex,
      accentContrast: accentContrast,
      accentGlow: `rgba(${r}, ${g}, ${b}, 0.25)`,
      accentSurface: `rgba(${r}, ${g}, ${b}, 0.12)`,
      accentBorder: `rgba(${r}, ${g}, ${b}, 0.65)`,
      border: `rgba(${r}, ${g}, ${b}, 0.25)`,
      border2: `rgba(${r}, ${g}, ${b}, 0.45)`,
      borderHover: `rgba(${r}, ${g}, ${b}, 0.70)`,
      panel: 'rgba(255, 255, 255, 0.65)',
      panel2: `rgba(${r}, ${g}, ${b}, 0.10)`,
      panelHover: 'rgba(255, 255, 255, 0.85)',
      btnBg: 'rgba(255, 255, 255, 0.80)',
      btnHoverBg: 'rgba(255, 255, 255, 0.98)',
      cardBg: `linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(${Math.round(r * 0.15 + 215)}, ${Math.round(g * 0.15 + 215)}, ${Math.round(b * 0.15 + 215)}, 0.55) 100%)`,
      modalBg: `linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(${Math.round(r * 0.08 + 235)}, ${Math.round(g * 0.08 + 235)}, ${Math.round(b * 0.08 + 235)}, 0.98))`,
      dropdownBg: 'rgba(255, 255, 255, 0.97)',
      wellFocusBg: 'rgba(255, 255, 255, 0.95)',
      text: '#0F0503',
      iconColor: '#0F0503',
      muted: mutedHex,
      muted2: muted2Hex,
      focus: `0 0 0 3px rgba(${r}, ${g}, ${b}, 0.25)`,
      glowColor1: glow1Hex,
      glowColor2: glow2Hex,
      glowColor3: glow3Hex,
      vnActiveTabBg: `rgba(${r}, ${g}, ${b}, 0.15)`,
      vnActiveTabBorder: `rgba(${r}, ${g}, ${b}, 0.60)`,
      vnAccentPrimary: accentHex,
      vnAccentGradient: `linear-gradient(135deg, ${accentHex} 0%, ${accent2Hex} 100%)`,
      vnCardSolid: '#FFFFFF',
    };
  }

  // Dark mode
  const deepR = Math.round(r * 0.14 + 4);
  const deepG = Math.round(g * 0.14 + 4);
  const deepB = Math.round(b * 0.14 + 7);

  // In dark mode, muted texts MUST have high lightness (>= 0.75) for high-contrast readability against dark background
  const mutedHex = hslToHex(hsl.h, 0.40, 0.82);
  const muted2Hex = hslToHex(hsl.h, 0.55, 0.62);

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
    accentContrast: accentContrast,
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
    text: '#F7F6FE',
    iconColor: '#F7F6FE',
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

    // Inyectar con máxima especificidad (!important) para garantizar contraste WCAG perfecto
    const cssRules = `
:root,
[data-vn-theme],
[data-vn-engine="true"],
.vn-engine-root {
  --accent: ${palette.accent} !important;
  --accent2: ${palette.accent2} !important;
  --accent-contrast: ${palette.accentContrast} !important;
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
  --text: ${palette.text} !important;
  --icon-color: ${palette.iconColor} !important;
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

export interface VNBgPreferences {
  showDots: boolean;
  customImage: string | null;
  customOpacity: number;
}

const BG_SHOW_DOTS_KEY = 'vn_bg_show_dots';
const BG_CUSTOM_IMAGE_KEY = 'vn_bg_custom_image';
const BG_CUSTOM_OPACITY_KEY = 'vn_bg_custom_opacity';

export function getStoredBgPreferences(): VNBgPreferences {
  if (typeof window === 'undefined') {
    return { showDots: true, customImage: null, customOpacity: 0.35 };
  }
  try {
    const showDotsStored = localStorage.getItem(BG_SHOW_DOTS_KEY);
    const showDots = showDotsStored !== null ? showDotsStored === 'true' : true;
    const customImage = localStorage.getItem(BG_CUSTOM_IMAGE_KEY);
    const opacityStored = localStorage.getItem(BG_CUSTOM_OPACITY_KEY);
    const customOpacity = opacityStored !== null ? parseFloat(opacityStored) : 0.35;
    return {
      showDots,
      customImage: customImage || null,
      customOpacity: isNaN(customOpacity) ? 0.35 : customOpacity,
    };
  } catch {
    return { showDots: true, customImage: null, customOpacity: 0.35 };
  }
}

export function applyBgPreferences(prefs: Partial<VNBgPreferences>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredBgPreferences();
    const updated: VNBgPreferences = {
      showDots: prefs.showDots !== undefined ? prefs.showDots : current.showDots,
      customImage: prefs.customImage !== undefined ? prefs.customImage : current.customImage,
      customOpacity: prefs.customOpacity !== undefined ? prefs.customOpacity : current.customOpacity,
    };

    localStorage.setItem(BG_SHOW_DOTS_KEY, updated.showDots ? 'true' : 'false');
    if (updated.customImage) {
      localStorage.setItem(BG_CUSTOM_IMAGE_KEY, updated.customImage);
    } else {
      localStorage.removeItem(BG_CUSTOM_IMAGE_KEY);
    }
    localStorage.setItem(BG_CUSTOM_OPACITY_KEY, updated.customOpacity.toString());

    // Apply to DOM
    const root = document.documentElement;
    root.setAttribute('data-vn-no-dots', updated.showDots ? 'false' : 'true');

    if (updated.customImage) {
      root.style.setProperty('--custom-bg-image', `url("${updated.customImage}")`);
      root.style.setProperty('--custom-bg-opacity', updated.customOpacity.toString());
    } else {
      root.style.removeProperty('--custom-bg-image');
      root.style.setProperty('--custom-bg-opacity', '0');
    }
  } catch {
    // ignore
  }
}

export function initStoredThemeAndAccent(): { theme: VNEditorTheme; customAccent: string | null; bgPrefs: VNBgPreferences } {
  const theme = getStoredTheme();
  setStoredTheme(theme);
  const customAccent = getStoredCustomAccent();
  if (customAccent) {
    applyCustomAccent(customAccent);
  }
  const bgPrefs = getStoredBgPreferences();
  applyBgPreferences(bgPrefs);
  return { theme, customAccent, bgPrefs };
}
