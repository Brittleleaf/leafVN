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
    description: 'Obsidian & Deep Violet (#030207). Ambient acrylic glass, luminous #D17BF8 accents and #F7F6FE icons.',
    badge: 'GLASS',
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
    description: 'Soft Lilac & Lavender frosted glass (#F5F2FF & #DDD7FF). Crystal acrylic clarity, royal #6851DF accents and #0F0503 icons.',
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
    badge: 'ORIGINAL',
    previewBg: '#07070a',
    previewCard: '#15070a',
    previewBorder: '#991b1b',
    previewAccent: '#dc2626',
    previewText: '#e5e7eb',
    fontName: 'Special Elite',
    isHorror: true,
  },
];

const THEME_STORAGE_KEY = 'vn_editor_theme';

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
