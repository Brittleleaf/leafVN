import { TextEffectDefinition } from './types';
import { palimpsestTextEffect } from './PalimpsestTextEffect';
import { smokyTextEffect } from './SmokyTextEffect';
import { cleanGlitchTextEffect } from './CleanGlitchTextEffect';
import { scrambleTextEffect } from './ScrambleTextEffect';
import { glitchTextEffect } from './GlitchTextEffect';
import { neonTextEffect } from './NeonTextEffect';
import { bloodTextEffect } from './BloodTextEffect';
import { pulseTextEffect } from './PulseTextEffect';
import { shakeTextEffect } from './ShakeTextEffect';
import { shimmerTextEffect } from './ShimmerTextEffect';
import { fadeInTextEffect } from './FadeInTextEffect';
import { typewriterTextEffect } from './TypewriterTextEffect';
import { loadingTextEffect } from './LoadingTextEffect';
import { splitFlapTextEffect } from './SplitFlapTextEffect';
import { blurFocusTextEffect } from './BlurFocusTextEffect';
import { flip3DTextEffect } from './Flip3DTextEffect';
import { waveTextEffect } from './WaveTextEffect';
import { liquidWobbleTextEffect } from './LiquidWobbleTextEffect';
import { shatterTextEffect } from './ShatterTextEffect';
import { matrixRainTextEffect } from './MatrixRainTextEffect';
import { gravityDropTextEffect } from './GravityDropTextEffect';
import { curtainWipeTextEffect } from './CurtainWipeTextEffect';

export const TEXT_EFFECTS_REGISTRY: Record<string, TextEffectDefinition> = {
  loading: loadingTextEffect,
  palimpsest: palimpsestTextEffect,
  smoky: smokyTextEffect,
  clean_glitch: cleanGlitchTextEffect,
  scramble: scrambleTextEffect,
  glitch: glitchTextEffect,
  neon: neonTextEffect,
  blood: bloodTextEffect,
  pulse: pulseTextEffect,
  shake: shakeTextEffect,
  shimmer: shimmerTextEffect,
  fade_in: fadeInTextEffect,
  typewriter: typewriterTextEffect,
  split_flap: splitFlapTextEffect,
  blur_focus: blurFocusTextEffect,
  flip_3d: flip3DTextEffect,
  wave: waveTextEffect,
  liquid_wobble: liquidWobbleTextEffect,
  shatter: shatterTextEffect,
  matrix_rain: matrixRainTextEffect,
  gravity_drop: gravityDropTextEffect,
  curtain_wipe: curtainWipeTextEffect,
};

/**
 * Returns all currently registered text effects as an array (including dynamic plugins).
 */
export function getAllTextEffects(): TextEffectDefinition[] {
  return Object.values(TEXT_EFFECTS_REGISTRY);
}

/**
 * Safe accessor for a text effect by ID.
 */
export function getTextEffect(id?: string): TextEffectDefinition | undefined {
  if (!id) return undefined;
  return TEXT_EFFECTS_REGISTRY[id];
}

/**
 * Registers a new text effect plugin dynamically at runtime.
 */
export function registerTextEffect(def: TextEffectDefinition): void {
  TEXT_EFFECTS_REGISTRY[def.id] = def;
}

/**
 * Unregisters a text effect by ID.
 */
export function unregisterTextEffect(id: string): void {
  delete TEXT_EFFECTS_REGISTRY[id];
}

/**
 * Preset catalog list for inspectors and dropdowns.
 */
export const VN_TEXT_EFFECTS_CATALOG: TextEffectDefinition[] = [
  loadingTextEffect,
  palimpsestTextEffect,
  smokyTextEffect,
  cleanGlitchTextEffect,
  scrambleTextEffect,
  glitchTextEffect,
  neonTextEffect,
  bloodTextEffect,
  pulseTextEffect,
  shakeTextEffect,
  shimmerTextEffect,
  fadeInTextEffect,
  typewriterTextEffect,
  splitFlapTextEffect,
  blurFocusTextEffect,
  flip3DTextEffect,
  waveTextEffect,
  liquidWobbleTextEffect,
  shatterTextEffect,
  matrixRainTextEffect,
  gravityDropTextEffect,
  curtainWipeTextEffect,
];
