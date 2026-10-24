import { VNTextBoxSkinDefinition, VNTextBoxSkinId } from './types';
import { classifiedTextboxSkin } from './ClassifiedTextbox';
import { cyberpunkTextboxSkin } from './CyberpunkTextbox';
import { neonGlowTextboxSkin } from './NeonGlowTextbox';
import { minimalTextboxSkin } from './MinimalTextbox';
import { parchmentTextboxSkin } from './ParchmentTextbox';
import { nvlFullscreenTextboxSkin } from './NVLFullscreenTextbox';

export const VN_TEXTBOX_SKINS_REGISTRY: Record<string, VNTextBoxSkinDefinition> = {
  classified: classifiedTextboxSkin,
  cyberpunk: cyberpunkTextboxSkin,
  neon: neonGlowTextboxSkin,
  minimal: minimalTextboxSkin,
  parchment: parchmentTextboxSkin,
  nvl: nvlFullscreenTextboxSkin,
};

export const VN_TEXTBOX_SKINS_CATALOG: VNTextBoxSkinDefinition[] = [
  classifiedTextboxSkin,
  cyberpunkTextboxSkin,
  neonGlowTextboxSkin,
  minimalTextboxSkin,
  parchmentTextboxSkin,
  nvlFullscreenTextboxSkin,
];

/**
 * Accessor for textbox skin definition by ID with fallback to classified.
 */
export function getTextBoxSkin(id?: string): VNTextBoxSkinDefinition {
  if (!id) return classifiedTextboxSkin;
  return VN_TEXTBOX_SKINS_REGISTRY[id] || classifiedTextboxSkin;
}

/**
 * Returns all registered textbox skins.
 */
export function getAllTextBoxSkins(): VNTextBoxSkinDefinition[] {
  return VN_TEXTBOX_SKINS_CATALOG;
}

/**
 * Registers a new custom or community textbox skin at runtime.
 */
export function registerTextBoxSkin(def: VNTextBoxSkinDefinition): void {
  VN_TEXTBOX_SKINS_REGISTRY[def.id] = def;
}
