"use client";
import { VNCursorDefinition } from './types';
import { defaultCursorDef } from './DefaultCursor';
import { palimpsestDotCursorDef } from './PalimpsestDotCursor';
import { cyberReticleCursorDef } from './CyberReticleCursor';
import { fantasyGauntletCursorDef } from './FantasyGauntletCursor';
import { quillPenCursorDef } from './QuillPenCursor';
import { magicWandCursorDef } from './MagicWandCursor';
import { detectiveLensCursorDef } from './DetectiveLensCursor';

export const VN_CURSORS_CATALOG: VNCursorDefinition[] = [
  defaultCursorDef,
  palimpsestDotCursorDef,
  cyberReticleCursorDef,
  fantasyGauntletCursorDef,
  quillPenCursorDef,
  magicWandCursorDef,
  detectiveLensCursorDef,
];

export const VN_CURSORS_MAP: Record<string, VNCursorDefinition> = VN_CURSORS_CATALOG.reduce(
  (acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  },
  {} as Record<string, VNCursorDefinition>
);

/**
 * Register a new custom cursor plugin dynamically.
 */
export function registerCursor(def: VNCursorDefinition): void {
  VN_CURSORS_MAP[def.id] = def;
  const idx = VN_CURSORS_CATALOG.findIndex((c) => c.id === def.id);
  if (idx >= 0) {
    VN_CURSORS_CATALOG[idx] = def;
  } else {
    VN_CURSORS_CATALOG.push(def);
  }
}

/**
 * Unregister a cursor by ID.
 */
export function unregisterCursor(id: string): void {
  delete VN_CURSORS_MAP[id];
  const idx = VN_CURSORS_CATALOG.findIndex((c) => c.id === id);
  if (idx >= 0) {
    VN_CURSORS_CATALOG.splice(idx, 1);
  }
}

/**
 * Safely retrieve a cursor definition by ID, falling back to default or undefined.
 */
export function getCursor(id?: string): VNCursorDefinition | undefined {
  if (!id) return VN_CURSORS_MAP['default'];
  return VN_CURSORS_MAP[id] || VN_CURSORS_MAP['default'];
}

/**
 * Return all registered cursors as an array.
 */
export function getAllCursors(): VNCursorDefinition[] {
  return Object.values(VN_CURSORS_MAP);
}
