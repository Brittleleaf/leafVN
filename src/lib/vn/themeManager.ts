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
    name: 'Obsidian Glass (Dark)',
    description: 'Deep #07070a void with chromatic Indigo (#6366f1), Violet (#a78bfa) and Cyan (#22d3ee) ambient glow mesh.',
    badge: 'DARK SAAS',
    previewBg: '#07070a',
    previewCard: 'rgba(20, 21, 29, 0.78)',
    previewBorder: '#6366f1',
    previewAccent: '#a78bfa',
    previewText: '#f4f4f6',
    fontName: 'Barlow / Inter',
  },
  {
    id: 'default_light',
    name: 'Crystal Glass (Light)',
    description: 'Luminous #f8f9fc white with clean frosted glass, pastel chromatic glows, and high-contrast typography.',
    badge: 'LIGHT SAAS',
    previewBg: '#f8f9fc',
    previewCard: 'rgba(255, 255, 255, 0.94)',
    previewBorder: '#6366f1',
    previewAccent: '#6366f1',
    previewText: '#0f1117',
    fontName: 'Barlow / Inter',
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
