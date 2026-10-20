"use client";
import React from 'react';
import { playSfx } from '@/lib/audioSettings';
import { VNTransformHandleType } from '../types';
import { getRotatedCursor } from '../transformMath';

export interface CardinalScaleHandlesProps {
  rotation: number;
  invScaleX: number;
  invScaleY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startTransform: (e: React.PointerEvent, handle: VNTransformHandleType, el: HTMLElement) => void;
  onResetScaleX: () => void;
  onResetScaleY: () => void;
}

interface CardinalDef {
  handle: 't' | 'b' | 'l' | 'r';
  baseAngle: number;
  className: string;
  sizeClass: string;
  tx: string;
  ty: string;
  title: string;
  axis: 'x' | 'y';
}

const CARDINALS: CardinalDef[] = [
  { handle: 't', baseAngle: 0, className: 'top-0 left-1/2', sizeClass: 'w-5 h-2', tx: '-50%', ty: '-50%', title: 'Scale Height (Double-click to reset)', axis: 'y' },
  { handle: 'b', baseAngle: 180, className: 'bottom-0 left-1/2', sizeClass: 'w-5 h-2', tx: '-50%', ty: '50%', title: 'Scale Height (Double-click to reset)', axis: 'y' },
  { handle: 'l', baseAngle: 270, className: 'top-1/2 left-0', sizeClass: 'w-2 h-5', tx: '-50%', ty: '-50%', title: 'Scale Width (Double-click to reset)', axis: 'x' },
  { handle: 'r', baseAngle: 90, className: 'top-1/2 right-0', sizeClass: 'w-2 h-5', tx: '50%', ty: '-50%', title: 'Scale Width (Double-click to reset)', axis: 'x' },
];

/**
 * 4 Cardinal Edge Handles for independent width & height scaling.
 */
export const CardinalScaleHandles: React.FC<CardinalScaleHandlesProps> = ({
  rotation,
  invScaleX,
  invScaleY,
  containerRef,
  startTransform,
  onResetScaleX,
  onResetScaleY,
}) => {
  return (
    <>
      {CARDINALS.map(({ handle, baseAngle, className, sizeClass, tx, ty, title, axis }) => (
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
            if (axis === 'x') onResetScaleX();
            else onResetScaleY();
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          }}
          className={`absolute ${className} ${sizeClass} bg-white border-2 border-cyan-400 rounded-sm shadow-md hover:scale-125 transition-transform pointer-events-auto z-35 touch-none`}
          title={title}
        />
      ))}
    </>
  );
};
