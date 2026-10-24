import { VNHoverEffectDefinition } from './types';
import { noneButtonHover } from './NoneButtonHover';
import { flareButtonHover } from './FlareButtonHover';
import { trackingLinesButtonHover } from './TrackingLinesButtonHover';
import { tactileButtonHover } from './TactileButtonHover';
import { auraButtonHover } from './AuraButtonHover';
import { vectorTraceButtonHover } from './VectorTraceButtonHover';
import { shineButtonHover } from './ShineButtonHover';
import { boxButtonHover } from './BoxButtonHover';
import { underlineButtonHover } from './UnderlineButtonHover';

export const VN_HOVER_EFFECTS_REGISTRY: Record<string, VNHoverEffectDefinition> = {
  none: noneButtonHover,
  flare: flareButtonHover,
  tracking_lines: trackingLinesButtonHover,
  tactile: tactileButtonHover,
  aura: auraButtonHover,
  vector_trace: vectorTraceButtonHover,
  shine: shineButtonHover,
  box: boxButtonHover,
  underline: underlineButtonHover,
};

/**
 * Returns the CSS class corresponding to a given hover effect ID.
 * Safely falls back to empty string if the effect is unknown or removed.
 */
export function getButtonHoverEffectClass(effectId?: string): string {
  if (!effectId || effectId === 'none') return '';
  const def = VN_HOVER_EFFECTS_REGISTRY[effectId];
  return def ? def.className : '';
}

/**
 * Returns the container-level CSS class for whole-button animations.
 */
export function getButtonHoverContainerClass(effectId?: string): string {
  if (!effectId || effectId === 'none') return '';
  const def = VN_HOVER_EFFECTS_REGISTRY[effectId];
  return def?.containerClassName || `vn-btn-container-${effectId}`;
}

/**
 * Registers a new button hover effect dynamically at runtime or plugin loading.
 */
export function registerButtonHoverEffect(def: VNHoverEffectDefinition): void {
  VN_HOVER_EFFECTS_REGISTRY[def.id] = def;
}

/**
 * Unregisters a button hover effect by ID.
 */
export function unregisterButtonHoverEffect(id: string): void {
  delete VN_HOVER_EFFECTS_REGISTRY[id];
}

/**
 * Retrieves a hover effect definition by ID.
 */
export function getButtonHoverEffect(id?: string): VNHoverEffectDefinition | undefined {
  if (!id) return undefined;
  return VN_HOVER_EFFECTS_REGISTRY[id];
}

/**
 * Returns all registered hover effects as an array for pickers and inspectors.
 */
export function getAllButtonHoverEffects(): VNHoverEffectDefinition[] {
  return Object.values(VN_HOVER_EFFECTS_REGISTRY);
}
