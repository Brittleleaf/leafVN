"use client";
import React from 'react';
import { playSfx } from '@/lib/audioSettings';
import {
  VNTransformableTarget,
  VNTransformCapabilities,
  DEFAULT_TRANSFORM_CAPABILITIES,
} from './types';

import {
  copyTransformState,
  getTransformClipboard,
  subscribeTransformClipboard,
  VNTransformStateSnapshot,
} from './transformClipboard';

export interface VNTransformToolbarProps {
  target: VNTransformableTarget;
  onUpdate: (patch: Partial<VNTransformableTarget>) => void;
  onTransformEnd?: (finalTarget: VNTransformableTarget) => void;
  capabilities?: VNTransformCapabilities;
  is3DMode?: boolean;
  isCropMode?: boolean;
  onToggle3D?: () => void;
  onToggleCrop?: () => void;
  notify?: (msg: string) => void;
  onConfigure?: () => void;
  onDelete?: () => void;
  onEditText?: () => void;
}

export const VNTransformToolbar: React.FC<VNTransformToolbarProps> = ({
  target,
  onUpdate,
  onTransformEnd,
  capabilities = DEFAULT_TRANSFORM_CAPABILITIES,
  is3DMode = target.isPerspective3D ?? false,
  isCropMode = false,
  onToggle3D,
  onToggleCrop,
  notify,
  onConfigure,
  onDelete,
  onEditText,
}) => {
  const caps = { ...DEFAULT_TRANSFORM_CAPABILITIES, ...capabilities };

  const [clipboardState, setClipboardState] = React.useState<VNTransformStateSnapshot | null>(() => getTransformClipboard());
  const [justCopied, setJustCopied] = React.useState<boolean>(false);

  React.useEffect(() => {
    const unsubscribe = subscribeTransformClipboard((clip) => {
      setClipboardState(clip);
    });
    return unsubscribe;
  }, []);

  const scale = target.scale ?? 1;
  const rotation = target.rotation ?? 0;
  const rotateX = target.rotateX ?? 0;
  const rotateY = target.rotateY ?? 0;

  const handleCopyState = () => {
    const snap = copyTransformState(target);
    setClipboardState(snap);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1600);
    playSfx('/assets/sfx/click interface.mp3', false, 0.3);
    if (notify) {
      notify(`Transform copied: Scale ${Math.round(snap.scale * 100)}%, Rotation ${snap.rotation}°`);
    }
  };

  const handlePasteState = () => {
    if (!clipboardState) return;
    const patch: Partial<VNTransformableTarget> = {
      scale: clipboardState.scale,
      ...(clipboardState.scaleX !== undefined ? { scaleX: clipboardState.scaleX } : {}),
      ...(clipboardState.scaleY !== undefined ? { scaleY: clipboardState.scaleY } : {}),
      rotation: clipboardState.rotation,
      ...(clipboardState.rotateX !== undefined ? { rotateX: clipboardState.rotateX } : {}),
      ...(clipboardState.rotateY !== undefined ? { rotateY: clipboardState.rotateY } : {}),
      ...(clipboardState.isPerspective3D !== undefined ? { isPerspective3D: clipboardState.isPerspective3D } : {}),
      ...(clipboardState.flipX !== undefined ? { flipX: clipboardState.flipX } : {}),
      ...(clipboardState.flipY !== undefined ? { flipY: clipboardState.flipY } : {}),
      ...(clipboardState.widthPercent !== undefined ? { widthPercent: clipboardState.widthPercent } : {}),
    };
    onUpdate(patch);
    if (onTransformEnd) onTransformEnd({ ...target, ...patch });
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    if (notify) {
      notify(`Transform pasted: Scale ${Math.round(clipboardState.scale * 100)}%, Rotation ${clipboardState.rotation}°`);
    }
  };

  const handleToggleLock = () => {
    const next = !target.locked;
    onUpdate({ locked: next });
    if (onTransformEnd) onTransformEnd({ ...target, locked: next });
    playSfx(next ? '/assets/sfx/click intro.mp3' : '/assets/sfx/click interface.mp3', false, 0.2);
    if (notify) {
      notify(next ? 'Element locked' : 'Element unlocked');
    }
  };

  const handleFlipX = () => {
    const next = !target.flipX;
    onUpdate({ flipX: next });
    if (onTransformEnd) onTransformEnd({ ...target, flipX: next });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    if (notify) {
      notify(next ? 'Flipped Horizontally' : 'Restored Horizontal Orientation');
    }
  };

  const handleFlipY = () => {
    const next = !target.flipY;
    onUpdate({ flipY: next });
    if (onTransformEnd) onTransformEnd({ ...target, flipY: next });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    if (notify) {
      notify(next ? 'Flipped Vertically' : 'Restored Vertical Orientation');
    }
  };

  const handleRotate90 = () => {
    const next = (rotation + 90) % 360;
    onUpdate({ rotation: next });
    if (onTransformEnd) onTransformEnd({ ...target, rotation: next });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    if (notify) {
      notify(`Rotated to ${next}°`);
    }
  };

  const handleResetPivot = () => {
    onUpdate({ pivotX: 50, pivotY: 50 });
    if (onTransformEnd) onTransformEnd({ ...target, pivotX: 50, pivotY: 50 });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    if (notify) {
      notify('Pivot reset to center (50%, 50%)');
    }
  };

  const isPivotCustom =
    target.pivotX !== undefined &&
    target.pivotY !== undefined &&
    (Math.abs(target.pivotX - 50) > 0.5 || Math.abs(target.pivotY - 50) > 0.5);

  const handleToggle3D = () => {
    if (onToggle3D) {
      onToggle3D();
    } else {
      const next = !is3DMode;
      onUpdate({ isPerspective3D: next });
      if (onTransformEnd) onTransformEnd({ ...target, isPerspective3D: next });
    }
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  const handleToggleCrop = () => {
    if (onToggleCrop) {
      onToggleCrop();
    }
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  const handleResetScale = () => {
    onUpdate({ scale: 1, scaleX: 1, scaleY: 1 });
    if (onTransformEnd) onTransformEnd({ ...target, scale: 1, scaleX: 1, scaleY: 1 });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  const handleResetRotation = () => {
    onUpdate({ rotation: 0, rotateX: 0, rotateY: 0 });
    if (onTransformEnd) onTransformEnd({ ...target, rotation: 0, rotateX: 0, rotateY: 0 });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  const handleCenter = () => {
    onUpdate({ xPercent: 50, yPercent: 50 });
    if (onTransformEnd) onTransformEnd({ ...target, xPercent: 50, yPercent: 50 });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    if (notify) {
      notify('Element centered on canvas');
    }
  };

  const handleReset = () => {
    const patch = {
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      rotateX: 0,
      rotateY: 0,
      pivotX: caps.allowPivot ? 50 : (target.pivotX ?? 50),
      pivotY: caps.allowPivot ? 50 : (target.pivotY ?? 50),
      flipX: false,
      flipY: false,
      crop: undefined,
      isPerspective3D: false,
    };
    onUpdate(patch);
    if (onTransformEnd) onTransformEnd({ ...target, ...patch });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  // Clases dinámicas adaptadas a los tokens del tema
  const btnBaseClass =
    "w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-150 select-none";
  const btnInactiveClass =
    "bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border-hover)] shadow-sm";
  const btnActiveClass =
    "bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_14px_var(--accent-glow)] ring-1 ring-[var(--accent)]/50 font-bold";
  const tooltipClass =
    "pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--modal-bg,var(--well-bg))] border border-[var(--border2)] text-[10px] font-medium text-[var(--text)] whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 backdrop-blur-md";

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 bg-[var(--dropdown-bg,var(--panel))] backdrop-blur-2xl border border-[var(--border2)] rounded-2xl shadow-[0_16px_45px_rgba(0,0,0,0.65),0_0_24px_var(--accent-glow)] ring-1 ring-[var(--accent)]/30 select-none animate-in fade-in slide-in-from-left-3 duration-200 text-[var(--text)]">
      {/* Header Tag & Live Telemetry Adaptado al Tema */}
      <div className="flex flex-col items-center gap-0.5 pb-2 border-b border-[var(--border)] w-full">
        <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-[var(--accent)] bg-[var(--accent-surface)] px-2.5 py-0.5 rounded-full border border-[var(--accent-border)] shadow-sm">
          TRANSFORM
        </span>
        <div className="text-[9px] font-mono text-[var(--muted)] text-center leading-tight pt-1 flex flex-col items-center gap-0.5">
          <button
            type="button"
            onClick={handleResetScale}
            className="text-[var(--text)] hover:text-[var(--accent)] font-bold block hover:underline cursor-pointer transition-colors"
            title="Click to reset scale to 100%"
          >
            {(target.scaleX !== undefined && target.scaleX !== 1) || (target.scaleY !== undefined && target.scaleY !== 1)
              ? `${Math.round((target.scaleX ?? 1) * scale * 100)}% × ${Math.round((target.scaleY ?? 1) * scale * 100)}%`
              : `${Math.round(scale * 100)}%`}
          </button>
          {rotation !== 0 && caps.allowRotate && (
            <button
              type="button"
              onClick={handleResetRotation}
              className="block text-[var(--accent)] font-bold hover:underline cursor-pointer transition-colors"
              title="Click to reset rotation to 0°"
            >
              {rotation}°
            </button>
          )}
          {is3DMode && caps.allow3D && (
            <button
              type="button"
              onClick={() => {
                onUpdate({ rotateX: 0, rotateY: 0 });
                if (onTransformEnd) onTransformEnd({ ...target, rotateX: 0, rotateY: 0 });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="block text-[var(--accent)] text-[8px] font-bold hover:underline cursor-pointer transition-colors"
              title="Click to reset 3D rotation (0°, 0°)"
            >
              3D ({rotateX}°, {rotateY}°)
            </button>
          )}
        </div>
      </div>

      {/* 0. In-Place Text Editing (For Text Targets) */}
      {target.isText && onEditText && (
        <div className="relative group">
          <button
            type="button"
            onClick={onEditText}
            className={`${btnBaseClass} ${btnActiveClass}`}
            title="Edit element text (Enter)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <span className={tooltipClass}>
            Edit Text (Enter)
          </span>
        </div>
      )}

      {/* 0. Lock / Unlock Element */}
      {caps.allowLock && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleToggleLock}
            className={`${btnBaseClass} ${target.locked ? btnActiveClass : btnInactiveClass}`}
            title={target.locked ? 'Unlock Element' : 'Lock Element'}
          >
            {target.locked ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            )}
          </button>
          <span className={tooltipClass}>
            {target.locked ? 'Unlock Element' : 'Lock Element'}
          </span>
        </div>
      )}

      {/* 0b. Configure Properties */}
      {onConfigure && (
        <div className="relative group">
          <button
            type="button"
            onClick={onConfigure}
            className={`${btnBaseClass} ${btnInactiveClass}`}
            title="Configure Element Properties"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <span className={tooltipClass}>
            Configure Properties
          </span>
        </div>
      )}

      {/* 0c. Toggle Magnetic Snapping for this Element */}
      <div className="relative group">
        <button
          type="button"
          onClick={() => {
            const next = !target.disableSnap;
            onUpdate({ disableSnap: next });
            if (onTransformEnd) onTransformEnd({ ...target, disableSnap: next });
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
            if (notify) {
              notify(next ? 'Snap disabled for this element' : 'Snap enabled for this element');
            }
          }}
          className={`${btnBaseClass} ${!target.disableSnap ? btnActiveClass : btnInactiveClass}`}
          title={target.disableSnap ? 'Enable Snap' : 'Disable Snap'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="m6 15-3-3 6-6 3 3" />
            <path d="m15 6 3 3-6 6-3-3" />
            <path d="M9 3a4.24 4.24 0 0 0-6 6" />
            <path d="M15 9a4.24 4.24 0 0 0 6 6" />
          </svg>
        </button>
        <span className={tooltipClass}>
          {!target.disableSnap ? 'Magnetic Snap: ON' : 'Magnetic Snap: OFF'}
        </span>
      </div>

      {/* 1 & 2. Flip Controls */}
      {caps.allowFlip && (
        <>
          <div className="relative group">
            <button
              type="button"
              onClick={handleFlipX}
              className={`${btnBaseClass} ${target.flipX ? btnActiveClass : btnInactiveClass}`}
              title="Flip Horizontal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m3 7 5 5-5 5V7z" />
                <path d="m21 7-5 5 5 5V7z" />
                <path d="M12 4v16" />
              </svg>
            </button>
            <span className={tooltipClass}>
              Flip Horizontal
            </span>
          </div>

          <div className="relative group">
            <button
              type="button"
              onClick={handleFlipY}
              className={`${btnBaseClass} ${target.flipY ? btnActiveClass : btnInactiveClass}`}
              title="Flip Vertical"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m7 3 5 5 5-5H7z" />
                <path d="m7 21 5-5 5 5H7z" />
                <path d="M4 12h16" />
              </svg>
            </button>
            <span className={tooltipClass}>
              Flip Vertical
            </span>
          </div>
        </>
      )}

      {/* 2b. Rotate 90° Clockwise */}
      {caps.allowRotate && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleRotate90}
            className={`${btnBaseClass} ${btnInactiveClass}`}
            title="Rotate +90° Clockwise"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <span className={tooltipClass}>
            Rotate +90° CW
          </span>
        </div>
      )}

      {/* 2c. Reset Pivot to Center */}
      {caps.allowPivot && isPivotCustom && (
        <div className="relative group animate-in zoom-in-75 duration-150">
          <button
            type="button"
            onClick={handleResetPivot}
            className={`${btnBaseClass} ${btnActiveClass}`}
            title="Reset Pivot to Center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
            </svg>
          </button>
          <span className={tooltipClass}>
            Reset Pivot to Center
          </span>
        </div>
      )}

      {/* 3. 3D Perspective Mode */}
      {caps.allow3D && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleToggle3D}
            className={`${btnBaseClass} ${is3DMode ? btnActiveClass : btnInactiveClass}`}
            title="Toggle 3D Perspective Orbit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z" />
              <path d="M12 12v9" />
              <path d="m12 12 8-4.5" />
              <path d="M12 12 4 7.5" />
            </svg>
          </button>
          <span className={tooltipClass}>
            {is3DMode ? 'Disable 3D Orbit' : 'Enable 3D Orbit'}
          </span>
        </div>
      )}

      {/* 4. Crop Mode */}
      {caps.allowCrop && (
        <div className="relative group">
          <button
            type="button"
            onClick={handleToggleCrop}
            className={`${btnBaseClass} ${isCropMode ? btnActiveClass : btnInactiveClass}`}
            title="Toggle Crop Mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
          </button>
          <span className={tooltipClass}>
            {isCropMode ? 'Exit Crop Mode' : 'Crop Insets'}
          </span>
        </div>
      )}

      {/* 4b. Reset Crop */}
      {caps.allowCrop &&
        target.crop &&
        (target.crop.top > 0 ||
          target.crop.right > 0 ||
          target.crop.bottom > 0 ||
          target.crop.left > 0) && (
          <div className="relative group animate-in zoom-in-75 duration-150">
            <button
              type="button"
              onClick={() => {
                onUpdate({ crop: undefined });
                if (onTransformEnd) onTransformEnd({ ...target, crop: undefined });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`${btnBaseClass} ${btnActiveClass}`}
              title="Reset Crop"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m3 3 18 18" />
                <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                <path d="M18 22V8a2 2 0 0 0-2-2H2" />
              </svg>
            </button>
            <span className={tooltipClass}>
              Reset Crop (Uncrop 100%)
            </span>
          </div>
        )}

      <div className="w-6 h-[1px] bg-[var(--border)] my-0.5" />

      {/* Copy Transform State */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleCopyState}
          className={`${btnBaseClass} ${justCopied ? btnActiveClass : btnInactiveClass}`}
          title="Copy State (Scale & Rotation)"
        >
          {justCopied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[var(--accent)]">
              <path d="m5 12 5 5L20 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
        <span className={tooltipClass}>
          {justCopied ? 'State Copied!' : `Copy State (Scale: ${Math.round(scale * 100)}%, Rot: ${rotation}°)`}
        </span>
      </div>

      {/* Paste Transform State */}
      <div className="relative group">
        <button
          type="button"
          disabled={!clipboardState}
          onClick={handlePasteState}
          className={`${btnBaseClass} ${
            !clipboardState
              ? 'opacity-30 cursor-not-allowed bg-transparent border-transparent text-[var(--muted2)]'
              : btnInactiveClass
          }`}
          title={
            clipboardState
              ? `Paste State (Scale: ${Math.round(clipboardState.scale * 100)}%, Rot: ${clipboardState.rotation}°)`
              : 'Paste State (Empty Clipboard)'
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
          </svg>
        </button>
        <span className={tooltipClass}>
          {clipboardState
            ? `Paste State (Scale: ${Math.round(clipboardState.scale * 100)}%, Rot: ${clipboardState.rotation}°)`
            : 'Clipboard Empty'}
        </span>
      </div>

      <div className="w-6 h-[1px] bg-[var(--border)] my-0.5" />

      {/* 5. Center on Stage */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleCenter}
          className={`${btnBaseClass} ${btnInactiveClass}`}
          title="Center on Canvas"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <circle cx="12" cy="12" r="7" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
        </button>
        <span className={tooltipClass}>
          Center on Canvas (50%, 50%)
        </span>
      </div>

      {/* 6. Reset Transforms */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleReset}
          className={`${btnBaseClass} ${btnInactiveClass} hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10`}
          title="Reset All Transforms"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <span className={tooltipClass}>
          Reset All Transforms
        </span>
      </div>

      {/* 7. Universal Delete Button */}
      {onDelete && (
        <>
          <div className="w-6 h-[1px] bg-[var(--border)] my-0.5" />
          <div className="relative group">
            <button
              type="button"
              onClick={onDelete}
              className={`${btnBaseClass} bg-red-500/10 border-red-500/30 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]`}
              title="Delete Element from Canvas"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </button>
            <span className={tooltipClass}>
              Delete Element
            </span>
          </div>
        </>
      )}
    </div>
  );
};
