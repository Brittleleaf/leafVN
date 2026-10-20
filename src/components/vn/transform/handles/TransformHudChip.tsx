"use client";
import React from 'react';
import { VNTransformHudInfo } from '../types';

export interface TransformHudChipProps {
  hudInfo: VNTransformHudInfo | null;
  rotateX: number;
  rotateY: number;
  rotation: number;
  invScaleX: number;
  invScaleY: number;
  isNearTop: boolean;
}

/**
 * Camera-Billboarded Live Telemetry HUD Chip.
 * Always renders horizontal and upright regardless of 2D rotation or 3D perspective pitch/yaw.
 */
export const TransformHudChip: React.FC<TransformHudChipProps> = ({
  hudInfo,
  rotateX,
  rotateY,
  rotation,
  invScaleX,
  invScaleY,
  isNearTop,
}) => {
  if (!hudInfo) return null;

  return (
    <div
      style={{
        transform: `translate(-50%, 0) rotateY(-${rotateY}deg) rotateX(-${rotateX}deg) rotate(-${rotation}deg) scale(${invScaleX}, ${invScaleY})`,
        transformOrigin: isNearTop ? 'top center' : 'bottom center',
      }}
      className={`absolute left-1/2 pointer-events-none z-50 flex items-center justify-center animate-in zoom-in-95 duration-100 ${
        isNearTop ? '-bottom-12' : '-top-12'
      }`}
    >
      <div
        className={`px-3 py-1 rounded-full backdrop-blur-xl font-mono text-[10px] font-bold tracking-wider shadow-2xl flex items-center gap-1.5 whitespace-nowrap border ${
          hudInfo.color === 'amber'
            ? 'bg-amber-950/95 border-amber-400/80 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
            : hudInfo.color === 'purple'
            ? 'bg-purple-950/95 border-purple-400/80 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
            : 'bg-cyan-950/95 border-cyan-400/80 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
        }`}
      >
        <span className="opacity-70 text-[9px] uppercase">{hudInfo.label}:</span>
        <span>{hudInfo.value}</span>
      </div>
    </div>
  );
};
