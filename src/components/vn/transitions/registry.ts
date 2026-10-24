import { VNTransitionDefinition, VNTransitionId } from './types';
import { instantCutTransition } from './InstantCutTransition';
import { fadeBlackTransition } from './FadeBlackTransition';
import { fadeWhiteTransition } from './FadeWhiteTransition';
import { crossDissolveTransition } from './CrossDissolveTransition';
import { glitchTearTransition } from './GlitchTearTransition';
import { slideLeftTransition } from './SlideLeftTransition';
import { slideRightTransition } from './SlideRightTransition';
import { irisCircleTransition } from './IrisCircleTransition';
import { shutterWipeTransition } from './ShutterWipeTransition';
import { pixelateTransition } from './PixelateTransition';

export const VN_TRANSITIONS_REGISTRY: Record<string, VNTransitionDefinition> = {
  instant: instantCutTransition,
  fade: fadeBlackTransition,
  fade_black: fadeBlackTransition,
  fade_white: fadeWhiteTransition,
  dissolve: crossDissolveTransition,
  cross_dissolve: crossDissolveTransition,
  glitch: glitchTearTransition,
  slide_left: slideLeftTransition,
  slide_right: slideRightTransition,
  iris_circle: irisCircleTransition,
  shutter_wipe: shutterWipeTransition,
  pixelate: pixelateTransition,
};

/**
 * List of unique transition definitions for UI pickers and inspectors.
 */
export const VN_TRANSITIONS_CATALOG: VNTransitionDefinition[] = [
  fadeBlackTransition,
  crossDissolveTransition,
  fadeWhiteTransition,
  glitchTearTransition,
  slideLeftTransition,
  slideRightTransition,
  irisCircleTransition,
  shutterWipeTransition,
  pixelateTransition,
  instantCutTransition,
];

/**
 * Accessor for a transition definition by ID with fallback to instant.
 */
export function getTransition(id?: string): VNTransitionDefinition {
  if (!id) return instantCutTransition;
  return VN_TRANSITIONS_REGISTRY[id] || instantCutTransition;
}

/**
 * Registers a new custom or community transition at runtime.
 */
export function registerTransition(def: VNTransitionDefinition): void {
  VN_TRANSITIONS_REGISTRY[def.id] = def;
}

/**
 * Returns all transitions in the catalog.
 */
export function getAllTransitions(): VNTransitionDefinition[] {
  return VN_TRANSITIONS_CATALOG;
}
