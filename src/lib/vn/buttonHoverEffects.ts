/**
 * Modular registry for choice & static screen button hover text effects.
 * Decouples hover CSS animations from the engine core.
 */

export interface VNHoverEffectDefinition {
  id: string;
  label: string;
  className: string;
  description?: string;
}

export const VN_HOVER_EFFECTS_REGISTRY: Record<string, VNHoverEffectDefinition> = {
  none: {
    id: 'none',
    label: 'None',
    className: '',
    description: 'No text animation on hover',
  },
  underline: {
    id: 'underline',
    label: 'Underline Expand',
    className: 'vn-btn-effect-underline',
    description: 'Subtle expanding bottom border with opacity transition',
  },
  box: {
    id: 'box',
    label: 'Box Border Enclose',
    className: 'vn-btn-effect-box',
    description: 'Four-sided enclosing line frame animation on hover',
  },
  shine: {
    id: 'shine',
    label: 'Mask Sweep Shine',
    className: 'vn-btn-effect-shine',
    description: 'Infinite diagonal gradient sweep mask',
  },
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
 * Registers a new button hover effect at runtime or plugin loading.
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
 * Returns all registered hover effects as an array.
 */
export function getAllButtonHoverEffects(): VNHoverEffectDefinition[] {
  return Object.values(VN_HOVER_EFFECTS_REGISTRY);
}
