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
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

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
    "w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-150 select-none";
  const btnInactiveClass =
    "bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border-hover)] shadow-sm";
  const btnActiveClass =
    "bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--accent)] shadow-[0_0_14px_var(--accent-glow)] ring-1 ring-[var(--accent)]/50 font-bold";
  const tooltipClass =
    "pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--modal-bg,var(--well-bg))] border border-[var(--border2)] text-[10px] font-medium text-[var(--text)] whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 backdrop-blur-md";

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 bg-[var(--dropdown-bg,var(--panel))] backdrop-blur-2xl border border-[var(--border2)] rounded-lg shadow-[0_16px_45px_rgba(0,0,0,0.65),0_0_24px_var(--accent-glow)] ring-1 ring-[var(--accent)]/30 select-none animate-in fade-in slide-in-from-left-3 duration-200 text-[var(--text)] shrink-0">
      {/* Header Tag & Live Telemetry Adaptado al Tema */}
      <div className="flex flex-col items-center gap-0.5 pb-2 border-b border-[var(--border)] w-full shrink-0">
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
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={onEditText}
            className={`${btnBaseClass} ${btnActiveClass}`}
            title="Edit element text (Enter)"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.texts} className="w-4 h-4" />
          </button>
          <span className={tooltipClass}>
            Edit Text (Enter)
          </span>
        </div>
      )}

      {/* 0. Lock / Unlock Element */}
      {caps.allowLock && (
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={handleToggleLock}
            className={`${btnBaseClass} ${target.locked ? btnActiveClass : btnInactiveClass}`}
            title={target.locked ? 'Unlock Element' : 'Lock Element'}
          >
            <GuiIconRenderer
              icon={target.locked ? GUI_ICONS.security.lockClosed : GUI_ICONS.security.lockOpen}
              className="w-4 h-4"
            />
          </button>
          <span className={tooltipClass}>
            {target.locked ? 'Unlock Element' : 'Lock Element'}
          </span>
        </div>
      )}

      {/* 0b. Configure Properties */}
      {onConfigure && (
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={onConfigure}
            className={`${btnBaseClass} ${btnInactiveClass}`}
            title="Configure Element Properties"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-4 h-4" />
          </button>
          <span className={tooltipClass}>
            Configure Properties
          </span>
        </div>
      )}

      {/* 0c. Toggle Magnetic Snapping for this Element */}
      <div className="relative group shrink-0">
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
          <GuiIconRenderer icon={GUI_ICONS.general.snap} className="w-4 h-4" />
        </button>
        <span className={tooltipClass}>
          {!target.disableSnap ? 'Magnetic Snap: ON' : 'Magnetic Snap: OFF'}
        </span>
      </div>

      {/* 1 & 2. Flip Controls */}
      {caps.allowFlip && (
        <>
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={handleFlipX}
              className={`${btnBaseClass} ${target.flipX ? btnActiveClass : btnInactiveClass}`}
              title="Flip Horizontal"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.reflectHorizontal} className="w-4 h-4" />
            </button>
            <span className={tooltipClass}>
              Flip Horizontal
            </span>
          </div>

          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={handleFlipY}
              className={`${btnBaseClass} ${target.flipY ? btnActiveClass : btnInactiveClass}`}
              title="Flip Vertical"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.reflectVertical} className="w-4 h-4" />
            </button>
            <span className={tooltipClass}>
              Flip Vertical
            </span>
          </div>
        </>
      )}

      {/* 2b. Rotate 90° Clockwise */}
      {caps.allowRotate && (
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={handleRotate90}
            className={`${btnBaseClass} ${btnInactiveClass}`}
            title="Rotate +90° Clockwise"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-4 h-4" />
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
            <GuiIconRenderer icon={GUI_ICONS.general.positionMarker} className="w-4 h-4" />
          </button>
          <span className={tooltipClass}>
            Reset Pivot to Center
          </span>
        </div>
      )}

      {/* 3. 3D Perspective Mode */}
      {caps.allow3D && (
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={handleToggle3D}
            className={`${btnBaseClass} ${is3DMode ? btnActiveClass : btnInactiveClass}`}
            title="Toggle 3D Perspective Orbit"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.transform} className="w-4 h-4" />
          </button>
          <span className={tooltipClass}>
            {is3DMode ? 'Disable 3D Orbit' : 'Enable 3D Orbit'}
          </span>
        </div>
      )}

      {/* 4. Crop Mode */}
      {caps.allowCrop && (
        <div className="relative group shrink-0">
          <button
            type="button"
            onClick={handleToggleCrop}
            className={`${btnBaseClass} ${isCropMode ? btnActiveClass : btnInactiveClass}`}
            title="Toggle Crop Mode"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cut} className="w-4 h-4" />
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
              <GuiIconRenderer icon={GUI_ICONS.general.reset} className="w-4 h-4" />
            </button>
            <span className={tooltipClass}>
              Reset Crop (Uncrop 100%)
            </span>
          </div>
        )}

      <div className="w-6 h-[1px] bg-[var(--border)] my-0.5 shrink-0" />

      {/* Copy Transform State */}
      <div className="relative group shrink-0">
        <button
          type="button"
          onClick={handleCopyState}
          className={`${btnBaseClass} ${justCopied ? btnActiveClass : btnInactiveClass}`}
          title="Copy State (Scale & Rotation)"
        >
          <GuiIconRenderer
            icon={justCopied ? GUI_ICONS.general.check : GUI_ICONS.general.files}
            className={`w-4 h-4 ${justCopied ? 'text-[var(--accent)]' : ''}`}
          />
        </button>
        <span className={tooltipClass}>
          {justCopied ? 'State Copied!' : `Copy State (Scale: ${Math.round(scale * 100)}%, Rot: ${rotation}°)`}
        </span>
      </div>

      {/* Paste Transform State */}
      <div className="relative group shrink-0">
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
          <GuiIconRenderer icon={GUI_ICONS.general.load} className="w-4 h-4" />
        </button>
        <span className={tooltipClass}>
          {clipboardState
            ? `Paste State (Scale: ${Math.round(clipboardState.scale * 100)}%, Rot: ${clipboardState.rotation}°)`
            : 'Clipboard Empty'}
        </span>
      </div>

      <div className="w-6 h-[1px] bg-[var(--border)] my-0.5 shrink-0" />

      {/* 5. Center on Stage */}
      <div className="relative group shrink-0">
        <button
          type="button"
          onClick={handleCenter}
          className={`${btnBaseClass} ${btnInactiveClass}`}
          title="Center on Canvas"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.circle} className="w-4 h-4" />
        </button>
        <span className={tooltipClass}>
          Center on Canvas (50%, 50%)
        </span>
      </div>

      {/* 6. Reset Transforms */}
      <div className="relative group shrink-0">
        <button
          type="button"
          onClick={handleReset}
          className={`${btnBaseClass} ${btnInactiveClass} hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10`}
          title="Reset All Transforms"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.reset} className="w-4 h-4" />
        </button>
        <span className={tooltipClass}>
          Reset All Transforms
        </span>
      </div>

      {/* 7. Universal Delete Button */}
      {onDelete && (
        <>
          <div className="w-6 h-[1px] bg-[var(--border)] my-0.5 shrink-0" />
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={onDelete}
              className={`${btnBaseClass} bg-red-500/10 border-red-500/30 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]`}
              title="Delete Element from Canvas"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-4 h-4" />
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
