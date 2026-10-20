"use client";
import React from 'react';
import { playSfx } from '@/lib/audioSettings';
import { VNTransformHandleType } from '../types';

export interface Orbit3DHandleProps {
  rotateX: number;
  rotateY: number;
  rotation: number;
  invScaleX: number;
  invScaleY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startTransform: (e: React.PointerEvent, handle: VNTransformHandleType, el: HTMLElement) => void;
  onReset3D: () => void;
}

/**
 * 3D Perspective Orbit Ring (Camera-Billboarded so it never flattens into an unclickable sliver in perspective).
 */
export const Orbit3DHandle: React.FC<Orbit3DHandleProps> = ({
  rotateX,
  rotateY,
  rotation,
  invScaleX,
  invScaleY,
  containerRef,
  startTransform,
  onReset3D,
}) => {
  return (
    <div
      style={{
        transform: `translate(-50%, -50%) rotateY(-${rotateY}deg) rotateX(-${rotateX}deg) rotate(-${rotation}deg) scale(${invScaleX}, ${invScaleY})`,
        transformOrigin: 'center center',
      }}
      onPointerDown={(e) => containerRef.current && startTransform(e, 'rotate3d', containerRef.current)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onReset3D();
        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
      }}
      className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full border-2 border-dashed border-purple-400/80 bg-purple-500/15 pointer-events-auto cursor-crosshair flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.5)] z-40 touch-none"
      title="Drag to orbit in 3D (Pitch / Yaw). Double-click to reset flat 0°."
    >
      <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
      <span className="absolute -bottom-4 text-[8px] font-mono text-purple-300 font-bold whitespace-nowrap bg-black/85 px-1 rounded border border-purple-400/40">
        3D ORBIT
      </span>
    </div>
  );
};
