"use client";
import React from 'react';
import { playSfx } from '@/lib/audioSettings';
import { VNTransformHandleType } from '../types';

export interface PivotCrosshairProps {
  pivotX: number;
  pivotY: number;
  invScaleX: number;
  invScaleY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startTransform: (e: React.PointerEvent, handle: VNTransformHandleType, el: HTMLElement) => void;
  onResetPivot: () => void;
}

/**
 * CAD Anchor Crosshair with center tick marks and double-click center reset.
 */
export const PivotCrosshair: React.FC<PivotCrosshairProps> = ({
  pivotX,
  pivotY,
  invScaleX,
  invScaleY,
  containerRef,
  startTransform,
  onResetPivot,
}) => {
  return (
    <div
      onPointerDown={(e) => containerRef.current && startTransform(e, 'pivot', containerRef.current)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onResetPivot();
        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
      }}
      style={{
        left: `${pivotX}%`,
        top: `${pivotY}%`,
        transform: `translate(-50%, -50%) scale(${invScaleX}, ${invScaleY})`,
        transformOrigin: 'center center',
      }}
      className="absolute w-5 h-5 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center pointer-events-auto cursor-crosshair shadow-xl hover:scale-125 transition-transform z-45 touch-none"
      title="Drag to reposition Pivot / Anchor point. Double-click to reset to center (50%, 50%)."
    >
      <div className="absolute -top-1.5 w-0.5 h-1 bg-black" />
      <div className="absolute -bottom-1.5 w-0.5 h-1 bg-black" />
      <div className="absolute -left-1.5 h-0.5 w-1 bg-black" />
      <div className="absolute -right-1.5 h-0.5 w-1 bg-black" />
      <div className="w-1.5 h-1.5 rounded-full bg-black" />
    </div>
  );
};
