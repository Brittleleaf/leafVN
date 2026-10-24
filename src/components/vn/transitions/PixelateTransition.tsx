"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const PixelateTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.75,
  className = '',
  style = {},
}) => {
  const pixelBlur =
    progress !== undefined
      ? progress <= 0.5
        ? progress * 24
        : (1 - progress) * 24
      : isActive
      ? 16
      : 0;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-50 bg-black/40 ${className}`}
      style={{
        backdropFilter: `blur(${pixelBlur}px) contrast(180%)`,
        opacity: isActive ? 1 : 0,
        transition:
          progress === undefined
            ? `opacity ${(durationSec / 2).toFixed(2)}s ease, backdrop-filter ${(
                durationSec / 2
              ).toFixed(2)}s ease`
            : undefined,
        ...style,
      }}
    >
      {/* Mosaic grid overlay */}
      <div
        className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)]"
        style={{
          backgroundSize: '12px 12px',
        }}
      />
    </div>
  );
};

export const pixelateTransition: VNTransitionDefinition = {
  id: 'pixelate',
  name: 'Pixel Mosaic Dissolve',
  description: 'Retro arcade digital mosaic fragmentation dissolving the screen into pixel blocks.',
  category: 'artistic',
  icon: GUI_ICONS.general.screenFx,
  tag: 'RETRO',
  defaultDurationSec: 0.75,
  renderOverlay: PixelateTransitionOverlay,
};
