"use client";
import React, { useState, useRef, useEffect } from 'react';
import { playSfx } from '@/lib/audioSettings';
import {
  VNTransformableTarget,
  VNTransformCapabilities,
  DEFAULT_TRANSFORM_CAPABILITIES,
} from './types';
import { useUniversalTransform } from './useUniversalTransform';
import { StageSnapLines } from './handles/StageSnapLines';
import { SelectionOutline } from './handles/SelectionOutline';
import { TransformHudChip } from './handles/TransformHudChip';
import { CornerScaleHandles } from './handles/CornerScaleHandles';
import { CardinalScaleHandles } from './handles/CardinalScaleHandles';
import { RotationHandles } from './handles/RotationHandles';
import { PivotCrosshair } from './handles/PivotCrosshair';
import { Orbit3DHandle } from './handles/Orbit3DHandle';
import { CropGuillotine } from './handles/CropGuillotine';
import { InlineTextEditor } from './handles/InlineTextEditor';

export interface VNUniversalTransformGizmoProps {
  target: VNTransformableTarget | null;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (patch: Partial<VNTransformableTarget>) => void;
  onTransformEnd?: (finalTarget: VNTransformableTarget) => void;
  onCommitText?: (newText: string) => void;
  capabilities?: VNTransformCapabilities;
  isEditor?: boolean;
  snapTargets?: import('./types').VNSnapTarget[];
  disableSnapping?: boolean;
}

/**
 * Universal On-Canvas Transform Gizmo for any Visual Novel Engine Entity:
 * - Character sprites on stage
 * - Visual and video overlays
 * - Subtitles and text title cards
 * - UI buttons, logos and screen menus
 */
export const VNUniversalTransformGizmo: React.FC<VNUniversalTransformGizmoProps> = ({
  target,
  stageRef,
  onUpdate,
  onTransformEnd,
  onCommitText,
  capabilities = DEFAULT_TRANSFORM_CAPABILITIES,
  isEditor = true,
  snapTargets,
  disableSnapping,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [tempText, setTempText] = useState<string>('');
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const lastBodyPointerDownRef = useRef<number>(0);

  const caps = { ...DEFAULT_TRANSFORM_CAPABILITIES, ...capabilities };

  const {
    startTransform,
    activeHandle,
    snapGuideX,
    snapGuideY,
    snapGuideXPercent,
    snapGuideYPercent,
    isCropMode,
    is3DMode,
    hudInfo,
    toggleCropMode,
  } = useUniversalTransform({
    target,
    stageRef,
    onUpdate,
    onTransformEnd,
    capabilities: caps,
    isEditor,
    snapTargets,
    disableSnapping,
  });

  // Track rendered dimensions to dynamically adapt handle density on small elements (< 70px)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setIsCompact(width < 70 || height < 70);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Synchronize text state
  useEffect(() => {
    if (target?.text !== undefined) {
      setTempText(target.text);
    }
  }, [target?.text]);

  if (!isEditor || !target) return null;

  const isMoving = activeHandle === 'move';
  const isLocked = Boolean(target.locked);

  const scale = target.scale ?? 1;
  const scaleX = (target.scaleX ?? 1) * (target.flipX ? -1 : 1);
  const scaleY = (target.scaleY ?? 1) * (target.flipY ? -1 : 1);
  const rotation = target.rotation ?? 0;
  const rotateX = target.rotateX ?? 0;
  const rotateY = target.rotateY ?? 0;
  const pivotX = target.pivotX ?? 50;
  const pivotY = target.pivotY ?? 50;

  // Counter-scale for handles so they remain constant size on screen regardless of target scale
  const invScaleX = 1 / Math.max(0.05, Math.abs(scale * scaleX));
  const invScaleY = 1 / Math.max(0.05, Math.abs(scale * scaleY));

  // Determine if HUD should flip to bottom to avoid canvas ceiling clipping
  const isNearTop = (target.yPercent ?? 50) < 18;

  const handleTextCommit = () => {
    setIsEditingText(false);
    if (onCommitText) {
      onCommitText(tempText);
    } else {
      onUpdate({ text: tempText });
    }
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  const crop = target.crop || { top: 0, right: 0, bottom: 0, left: 0 };

  return (
    <>
      {/* 1. Full-Canvas Magnetic Center Alignment Guides (Cyan Lasers via Portal) */}
      <StageSnapLines
        stageRef={stageRef}
        snapGuideX={snapGuideX}
        snapGuideY={snapGuideY}
        snapGuideXPercent={snapGuideXPercent}
        snapGuideYPercent={snapGuideYPercent}
      />

      {/* 2. Universal Bounding Container */}
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute inset-0 pointer-events-none select-none z-40 touch-none"
      >
        <div
          className={`relative w-full h-full rounded transition-all ${
            isLocked
              ? 'bg-amber-500/5'
              : isCropMode
              ? 'bg-amber-500/10'
              : isMoving
              ? 'bg-cyan-500/5'
              : is3DMode
              ? 'shadow-[0_0_20px_rgba(168,85,247,0.35)]'
              : 'shadow-[0_0_15px_rgba(34,211,238,0.25)]'
          }`}
        >
          {/* SVG Non-Scaling Crisp Selection Outline */}
          <SelectionOutline
            isCropMode={isCropMode}
            isMoving={isMoving}
            is3DMode={is3DMode}
            isLocked={isLocked}
          />

          {/* Quick Unlock Badge (Visible only when element is locked) */}
          {isLocked && (
            <div className="absolute top-2 left-2 pointer-events-auto z-50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate({ locked: false });
                  if (onTransformEnd) onTransformEnd({ ...target, locked: false });
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                className="px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 text-[9px] font-mono font-bold flex items-center gap-1 shadow-xl hover:bg-amber-900 transition-colors cursor-pointer"
                title="Element is locked to prevent accidental edits. Click to unlock."
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-amber-400">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>LOCKED</span>
              </button>
            </div>
          )}

          {/* Draggable Body to Pan / Move or Enter Crop / Text Editing (Disabled when locked) */}
          {!isLocked && (
            <div
              onPointerDown={(e) => {
                const now = Date.now();
                if (now - lastBodyPointerDownRef.current < 350) {
                  e.stopPropagation();
                  if (target.isText) {
                    setIsEditingText(true);
                  } else if (caps.allowCrop) {
                    toggleCropMode();
                    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  }
                  lastBodyPointerDownRef.current = 0;
                  return;
                }
                lastBodyPointerDownRef.current = now;
                startTransform(e, 'move', containerRef.current!);
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-0 cursor-move pointer-events-auto touch-none"
              title="Drag to move (Hold Shift for axis lock). Double-click to edit/crop. Use Arrow keys to nudge."
            />
          )}

          {/* Floating Camera-Billboarded Telemetry HUD Chip */}
          <TransformHudChip
            hudInfo={hudInfo}
            rotateX={rotateX}
            rotateY={rotateY}
            rotation={rotation}
            invScaleX={invScaleX}
            invScaleY={invScaleY}
            isNearTop={isNearTop}
          />

          {/* Inline Text Editor */}
          {isEditingText && target.isText && !isLocked && (
            <InlineTextEditor
              target={target}
              tempText={tempText}
              setTempText={setTempText}
              onCommit={handleTextCommit}
              onCancel={() => {
                setIsEditingText(false);
                setTempText(target.text || '');
              }}
            />
          )}

          {/* Crop Mode Guillotine Controls */}
          {caps.allowCrop && isCropMode && !isLocked && (
            <CropGuillotine
              crop={crop}
              containerRef={containerRef}
              startTransform={startTransform}
            />
          )}

          {/* Canvas Handles (Hidden during movement or when locked to prevent accidental manipulation) */}
          {!isMoving && !isLocked && (
            <>
              {/* 2D Rotation Controls */}
              {caps.allowRotate && !isCropMode && (
                <RotationHandles
                  invScaleX={invScaleX}
                  invScaleY={invScaleY}
                  containerRef={containerRef}
                  startTransform={startTransform}
                  onResetRotation={() => onUpdate({ rotation: 0 })}
                />
              )}

              {/* 3D Perspective Orbit Ring */}
              {caps.allow3D && is3DMode && !isCropMode && (
                <Orbit3DHandle
                  rotateX={rotateX}
                  rotateY={rotateY}
                  rotation={rotation}
                  invScaleX={invScaleX}
                  invScaleY={invScaleY}
                  containerRef={containerRef}
                  startTransform={startTransform}
                  onReset3D={() => onUpdate({ rotateX: 0, rotateY: 0 })}
                />
              )}

              {/* Draggable CAD Pivot / Anchor Crosshair */}
              {caps.allowPivot && !isCropMode && (
                <PivotCrosshair
                  pivotX={pivotX}
                  pivotY={pivotY}
                  invScaleX={invScaleX}
                  invScaleY={invScaleY}
                  containerRef={containerRef}
                  startTransform={startTransform}
                  onResetPivot={() => onUpdate({ pivotX: 50, pivotY: 50 })}
                />
              )}

              {/* Uniform Corner Scale Handles */}
              {!isCropMode && (
                <CornerScaleHandles
                  rotation={rotation}
                  invScaleX={invScaleX}
                  invScaleY={invScaleY}
                  containerRef={containerRef}
                  startTransform={startTransform}
                  onResetScale={() => onUpdate({ scale: 1, scaleX: 1, scaleY: 1 })}
                />
              )}

              {/* Cardinal Edge Scale Handles */}
              {caps.allowNonUniformScale && !isCropMode && !isCompact && (
                <CardinalScaleHandles
                  rotation={rotation}
                  invScaleX={invScaleX}
                  invScaleY={invScaleY}
                  containerRef={containerRef}
                  startTransform={startTransform}
                  onResetScaleX={() => onUpdate({ scaleX: 1 })}
                  onResetScaleY={() => onUpdate({ scaleY: 1 })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
