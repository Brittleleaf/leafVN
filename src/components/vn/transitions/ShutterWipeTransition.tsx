"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const ShutterWipeTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.8,
  className = '',
  style = {},
}) => {
  const bars = 6;
  const barHeightPercent =
    progress !== undefined
      ? progress <= 0.5
        ? progress * 2 * 100
        : (1 - progress) * 2 * 100
      : isActive
      ? 100
      : 0;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-50 flex flex-col ${className}`}
      style={{ ...style }}
    >
      {Array.from({ length: bars }).map((_, idx) => (
        <div key={idx} className="flex-1 relative overflow-hidden bg-black/90">
          <div
            className="absolute inset-0 bg-[#060609]"
            style={{
              transform: `scaleY(${barHeightPercent / 100})`,
              transformOrigin: idx % 2 === 0 ? 'top center' : 'bottom center',
              transition:
                progress === undefined
                  ? `transform ${(durationSec / 2).toFixed(2)}s ease-in-out ${idx * 0.04}s`
                  : undefined,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export const shutterWipeTransition: VNTransitionDefinition = {
  id: 'shutter_wipe',
  name: 'Shutter Venetian Wipe',
  description: 'Interlocking horizontal mechanical blinds closing symmetrically over the viewport.',
  category: 'wipe',
  icon: GUI_ICONS.general.clapperboard,
  tag: 'WIPE',
  defaultDurationSec: 0.8,
  renderOverlay: ShutterWipeTransitionOverlay,
};
