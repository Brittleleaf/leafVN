"use client";
import React from 'react';
import { playSfx } from '@/lib/audioSettings';
import { VNTransformHandleType } from '../types';
import { getRotatedCursor } from '../transformMath';

export interface CornerScaleHandlesProps {
  rotation: number;
  invScaleX: number;
  invScaleY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startTransform: (e: React.PointerEvent, handle: VNTransformHandleType, el: HTMLElement) => void;
  onResetScale: () => void;
}

interface CornerDef {
  handle: 'tl' | 'tr' | 'bl' | 'br';
  baseAngle: number;
  className: string;
  tx: string;
  ty: string;
}

const CORNERS: CornerDef[] = [
  { handle: 'tl', baseAngle: 315, className: 'top-0 left-0', tx: '-50%', ty: '-50%' },
  { handle: 'tr', baseAngle: 45, className: 'top-0 right-0', tx: '50%', ty: '-50%' },
  { handle: 'bl', baseAngle: 225, className: 'bottom-0 left-0', tx: '-50%', ty: '50%' },
  { handle: 'br', baseAngle: 135, className: 'bottom-0 right-0', tx: '50%', ty: '50%' },
];

/**
 * 4 Uniform Corner Scaling Handles with dynamic rotated cursors and 100% reset double-click.
 */
export const CornerScaleHandles: React.FC<CornerScaleHandlesProps> = ({
  rotation,
  invScaleX,
  invScaleY,
  containerRef,
  startTransform,
  onResetScale,
}) => {
  return (
    <>
      {CORNERS.map(({ handle, baseAngle, className, tx, ty }) => (
        <div
          key={handle}
          style={{
            transform: `translate(${tx}, ${ty}) scale(${invScaleX}, ${invScaleY})`,
            transformOrigin: 'center center',
            cursor: getRotatedCursor(baseAngle, rotation),
          }}
          onPointerDown={(e) => containerRef.current && startTransform(e, handle, containerRef.current)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onResetScale();
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          }}
          className={`absolute ${className} w-3.5 h-3.5 bg-white border-2 border-cyan-400 rounded-sm shadow-md hover:scale-125 transition-transform pointer-events-auto z-35 touch-none`}
          title="Scale proportionally (Double-click to reset 100% native size)"
        />
      ))}
    </>
  );
};
