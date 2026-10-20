"use client";
import React from 'react';
import { playSfx } from '@/lib/audioSettings';
import { VNTransformHandleType } from '../types';

export interface RotationHandlesProps {
  invScaleX: number;
  invScaleY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startTransform: (e: React.PointerEvent, handle: VNTransformHandleType, el: HTMLElement) => void;
  onResetRotation: () => void;
}

const ROTATE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2322d3ee' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'/%3E%3Cpath d='M3 3v5h5'/%3E%3Cpath d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16'/%3E%3Cpath d='M16 16h5v5'/%3E%3C/svg%3E") 12 12, crosshair`;

const CORNER_ROTATION_ZONES = [
  { key: 'tl', className: 'top-0 left-0', tx: '-50%', ty: '-50%' },
  { key: 'tr', className: 'top-0 right-0', tx: '50%', ty: '-50%' },
  { key: 'bl', className: 'bottom-0 left-0', tx: '-50%', ty: '50%' },
  { key: 'br', className: 'bottom-0 right-0', tx: '50%', ty: '50%' },
];

/**
 * 2D Rotation Controls:
 * - 4 Concentric corner outer hit-zones
 * - Top arm with knob (double-click to reset 0° upright)
 */
export const RotationHandles: React.FC<RotationHandlesProps> = ({
  invScaleX,
  invScaleY,
  containerRef,
  startTransform,
  onResetRotation,
}) => {
  return (
    <>
      {/* 4 Concentric Corner Hit-Zones */}
      {CORNER_ROTATION_ZONES.map(({ key, className, tx, ty }) => (
        <div
          key={key}
          onPointerDown={(e) => containerRef.current && startTransform(e, 'rotate', containerRef.current)}
          style={{
            cursor: ROTATE_CURSOR,
            transform: `translate(${tx}, ${ty}) scale(${invScaleX}, ${invScaleY})`,
            transformOrigin: 'center center',
          }}
          className={`absolute ${className} w-11 h-11 pointer-events-auto rounded-full z-30 hover:bg-cyan-400/20 transition-colors touch-none`}
          title="Rotate 2D (Hold Shift for 15° snap)"
        />
      ))}

      {/* Top Rotation Arm with Knob */}
      <div
        style={{
          transform: `translate(-50%, 0) scale(${invScaleX}, ${invScaleY})`,
          transformOrigin: 'bottom center',
        }}
        className="absolute -top-7 left-1/2 flex flex-col items-center pointer-events-auto z-40 touch-none"
      >
        <div
          onPointerDown={(e) => containerRef.current && startTransform(e, 'rotate', containerRef.current)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onResetRotation();
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          }}
          style={{ cursor: ROTATE_CURSOR }}
          className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-black flex items-center justify-center hover:scale-125 transition-transform shadow-md"
          title="Rotate 2D (Hold Shift for 15° snap. Double-click to reset 0° upright)"
        >
          <div className="w-1 h-1 rounded-full bg-black" />
        </div>
        <div className="w-0.5 h-3 bg-cyan-400" />
      </div>
    </>
  );
};
