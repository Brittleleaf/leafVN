import { VNFontDefinition, VNFontCategory } from './types';
import { barlowFont } from './BarlowFont';
import { specialEliteFont } from './SpecialEliteFont';
import { headstoneFont } from './HeadstoneFont';
import { interFont } from './InterFont';
import { cinzelFont } from './CinzelFont';
import { merriweatherFont } from './MerriweatherFont';
import { playfairDisplayFont } from './PlayfairDisplayFont';
import { courierPrimeFont } from './CourierPrimeFont';
import { pressStart2PFont } from './PressStart2PFont';
import { caveatFont } from './CaveatFont';
import { orbitronFont } from './OrbitronFont';
import { creepsterFont } from './CreepsterFont';

export const BUILTIN_FONTS: VNFontDefinition[] = [
  barlowFont,
  specialEliteFont,
  headstoneFont,
  interFont,
  cinzelFont,
  merriweatherFont,
  playfairDisplayFont,
  courierPrimeFont,
  pressStart2PFont,
  caveatFont,
  orbitronFont,
  creepsterFont,
];

/**
 * Mutable catalog of registered visual novel fonts.
 */
export const VN_FONT_CATALOG: VNFontDefinition[] = [...BUILTIN_FONTS];

const loadedGoogleFonts = new Set<string>();

/**
 * Loads a Google Font dynamically by injecting a `<link>` in the document head if not yet loaded
 */
export function ensureGoogleFontLoaded(fontIdOrName?: string): void {
  if (typeof window === 'undefined' || !fontIdOrName) return;

  const fontDef = VN_FONT_CATALOG.find(
    (f) =>
      f.id.toLowerCase() === fontIdOrName.toLowerCase() ||
      f.name.toLowerCase() === fontIdOrName.toLowerCase() ||
      f.fontFamily.toLowerCase().includes(fontIdOrName.toLowerCase())
  );

  if (!fontDef || !fontDef.googleUrl || loadedGoogleFonts.has(fontDef.id)) return;

  const existingLink = document.querySelector(`link[data-vn-font="${fontDef.id}"]`);
  if (existingLink) {
    loadedGoogleFonts.add(fontDef.id);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fontDef.googleUrl;
  link.setAttribute('data-vn-font', fontDef.id);
  document.head.appendChild(link);
  loadedGoogleFonts.add(fontDef.id);
}

/**
 * Resolves the CSS font-family string following the 3-level hierarchy:
 * Level 3 (Event override) > Level 2 (Character font) > Level 1 (Story/Global font) > Default
 */
export function resolveEffectiveFontFamily({
  eventFont,
  characterFont,
  storyFont,
  editorTheme,
}: {
  eventFont?: string;
  characterFont?: string;
  storyFont?: string;
  editorTheme?: string;
}): string {
  const chosen = eventFont || characterFont || storyFont;

  if (chosen) {
    const matched = VN_FONT_CATALOG.find(
      (f) =>
        f.id.toLowerCase() === chosen.toLowerCase() ||
        f.name.toLowerCase() === chosen.toLowerCase() ||
        f.fontFamily.toLowerCase() === chosen.toLowerCase()
    );
    if (matched) {
      ensureGoogleFontLoaded(matched.id);
      return matched.fontFamily;
    }
    // Return custom raw string if defined (safely quoted if containing spaces and not already structured)
    if (!chosen.includes('"') && !chosen.includes("'") && !chosen.startsWith('var(') && chosen.includes(' ')) {
      return `"${chosen}", sans-serif`;
    }
    return chosen;
  }

  // Fallback depending on theme
  if (editorTheme === 'rotp') {
    return 'var(--font-typewriter), "Special Elite", monospace';
  }

  return 'var(--font-barlow), Barlow, sans-serif';
}

/**
 * Register a new font plugin dynamically.
 */
export function registerFont(fontDef: VNFontDefinition): void {
  const idx = VN_FONT_CATALOG.findIndex((f) => f.id === fontDef.id);
  if (idx >= 0) {
    VN_FONT_CATALOG[idx] = fontDef;
  } else {
    VN_FONT_CATALOG.push(fontDef);
  }
}

/**
 * Unregister a font by ID.
 */
export function unregisterFont(fontId: string): void {
  const idx = VN_FONT_CATALOG.findIndex((f) => f.id === fontId);
  if (idx >= 0) {
    VN_FONT_CATALOG.splice(idx, 1);
  }
}

/**
 * Safely get a font definition by ID, returning undefined if missing.
 */
export function getFont(id?: string): VNFontDefinition | undefined {
  if (!id) return undefined;
  return VN_FONT_CATALOG.find((f) => f.id.toLowerCase() === id.toLowerCase());
}

/**
 * Return all registered fonts as an array.
 */
export function getAllFonts(): VNFontDefinition[] {
  return [...VN_FONT_CATALOG];
}

/**
 * Return registered fonts filtered by category.
 */
export function getFontsByCategory(category: VNFontCategory): VNFontDefinition[] {
  return VN_FONT_CATALOG.filter((f) => f.category === category);
}
