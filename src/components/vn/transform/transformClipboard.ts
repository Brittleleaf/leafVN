import { VNTransformableTarget } from './types';

export interface VNTransformStateSnapshot {
  scale: number;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
  rotateX?: number;
  rotateY?: number;
  flipX?: boolean;
  flipY?: boolean;
  isPerspective3D?: boolean;
  widthPercent?: number;
  label?: string;
  timestamp: number;
}

type ClipboardListener = (clip: VNTransformStateSnapshot | null) => void;
const listeners = new Set<ClipboardListener>();

let inMemoryClipboard: VNTransformStateSnapshot | null = null;

// Initialize from sessionStorage if in browser
if (typeof window !== 'undefined') {
  try {
    const saved = window.sessionStorage?.getItem('vn_transform_state_clip');
    if (saved) {
      inMemoryClipboard = JSON.parse(saved);
    }
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Copies the scale, rotation, flips, 3D orbits and sizing from a transformable target.
 */
export function copyTransformState(target: VNTransformableTarget): VNTransformStateSnapshot {
  const snapshot: VNTransformStateSnapshot = {
    scale: target.scale ?? 1,
    scaleX: target.scaleX,
    scaleY: target.scaleY,
    rotation: target.rotation ?? 0,
    rotateX: target.rotateX,
    rotateY: target.rotateY,
    flipX: target.flipX,
    flipY: target.flipY,
    isPerspective3D: target.isPerspective3D,
    widthPercent: target.widthPercent,
    label: target.text || target.id,
    timestamp: Date.now(),
  };

  inMemoryClipboard = snapshot;

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage?.setItem('vn_transform_state_clip', JSON.stringify(snapshot));
    } catch (e) {}
  }

  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (e) {}
  });

  return snapshot;
}

/**
 * Returns the currently active transform state in the clipboard, or null if none.
 */
export function getTransformClipboard(): VNTransformStateSnapshot | null {
  return inMemoryClipboard;
}

/**
 * Checks if a transform state is currently copied.
 */
export function hasTransformClipboard(): boolean {
  return inMemoryClipboard !== null;
}

/**
 * Subscribes a callback to clipboard changes so toolbars can re-render reactively.
 */
export function subscribeTransformClipboard(listener: ClipboardListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
