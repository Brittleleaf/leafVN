export interface VNFontDefinition {
  id: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  fontFamily: string;
  googleFontFamily?: string;
  googleUrl?: string;
  description: string;
  previewSample: string;
  isBuiltIn?: boolean;
}

export const VN_FONT_CATALOG: VNFontDefinition[] = [
  {
    id: 'barlow',
    name: 'Barlow',
    category: 'sans-serif',
    fontFamily: 'var(--font-barlow), Barlow, sans-serif',
    googleFontFamily: 'Barlow',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&display=swap',
    description: 'Clean, technical, and low-contrast grotesque sans-serif. Modern and highly legible.',
    previewSample: 'El rápido murciélago hindú comía feliz cardillo y kiwi. 1234567890',
    isBuiltIn: true,
  },
  {
    id: 'special-elite',
    name: 'Special Elite',
    category: 'monospace',
    fontFamily: 'var(--font-typewriter), "Special Elite", monospace',
    googleFontFamily: 'Special Elite',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
    description: 'Vintage mimicked Remington typewriter font. The official ROTP horror style.',
    previewSample: 'INFORME CLASIFICADO: El sujeto no responde al estímulo lumínico.',
    isBuiltIn: true,
  },
  {
    id: 'headstone',
    name: 'Headstone Title',
    category: 'display',
    fontFamily: 'var(--font-title), serif',
    description: 'Official custom title font for Rebirth of the Painter. Chiseled monument look.',
    previewSample: 'REBIRTH OF THE PAINTER // CHAPTER ARCHIVE',
    isBuiltIn: true,
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans-serif',
    fontFamily: 'Inter, -apple-system, sans-serif',
    googleFontFamily: 'Inter',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap',
    description: 'Carefully crafted for computer screens. Highly readable at small and large sizes.',
    previewSample: 'Los registros del sistema indican una discrepancia en la frecuencia cardíaca.',
  },
  {
    id: 'cinzel',
    name: 'Cinzel',
    category: 'serif',
    fontFamily: 'Cinzel, Georgia, serif',
    googleFontFamily: 'Cinzel',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',
    description: 'Classical Roman proportions. Gives scenes a formal, mythological, or dramatic weight.',
    previewSample: 'EL DESTINO DE QUIENES SE ATREVIERON A MIRAR MÁS ALLÁ DEL VELO.',
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    category: 'serif',
    fontFamily: 'Merriweather, Georgia, serif',
    googleFontFamily: 'Merriweather',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap',
    description: 'Designed to be pleasant to read on screens. Classic novel and literary immersion.',
    previewSample: 'La lluvia golpeaba suavemente contra los cristales de la vieja biblioteca.',
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    category: 'serif',
    fontFamily: '"Playfair Display", Didot, serif',
    googleFontFamily: 'Playfair Display',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap',
    description: 'High-contrast transitional serif with dramatic style. Great for elegance or dark mystery.',
    previewSample: '«No hay secretos que el tiempo no termine por desenterrar.»',
  },
  {
    id: 'courier-prime',
    name: 'Courier Prime',
    category: 'monospace',
    fontFamily: '"Courier Prime", Courier, monospace',
    googleFontFamily: 'Courier Prime',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap',
    description: 'Courier rewritten specifically for modern screenwriters and film dialogue scripts.',
    previewSample: 'INT. SUBTERRÁNEO - NOCHE // REGISTRO TERMINAL #04',
  },
  {
    id: 'press-start-2p',
    name: 'Press Start 2P',
    category: 'display',
    fontFamily: '"Press Start 2P", monospace',
    googleFontFamily: 'Press Start 2P',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
    description: 'Authentic 1980s arcade and 8-bit retro video game font based on early bitmap characters.',
    previewSample: 'PRESS ANY KEY TO CONTINUE... 100 PTS',
  },
  {
    id: 'caveat',
    name: 'Caveat',
    category: 'handwriting',
    fontFamily: 'Caveat, cursive',
    googleFontFamily: 'Caveat',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap',
    description: 'Handwritten brush script. Ideal for personal diary entries, secret notes, and letters.',
    previewSample: 'Si estás leyendo esto, significa que ya no pude regresar a tiempo...',
  },
  {
    id: 'orbitron',
    name: 'Orbitron',
    category: 'display',
    fontFamily: 'Orbitron, sans-serif',
    googleFontFamily: 'Orbitron',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap',
    description: 'Futuristic geometric sans-serif for sci-fi, HUD monitors, and telemetry displays.',
    previewSample: 'SYSTEM REBOOT INITIATED: 45.89% COMPLETE',
  },
  {
    id: 'creepster',
    name: 'Creepster',
    category: 'display',
    fontFamily: 'Creepster, cursive',
    googleFontFamily: 'Creepster',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Creepster&display=swap',
    description: 'Oozing, bloody monster-movie horror display font for frightening encounters.',
    previewSample: 'NO DEBERÍAS HABER ABIERTO ESA PUERTA...',
  },
];

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

