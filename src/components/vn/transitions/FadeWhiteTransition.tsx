"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const FadeWhiteTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.6,
  className = '',
  style = {},
}) => {
  const opacity =
    progress !== undefined
      ? progress <= 0.4
        ? progress / 0.4
        : Math.max(0, 1 - (progress - 0.4) / 0.6)
      : undefined;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-white pointer-events-none z-50 ${className}`}
      style={{
        opacity: opacity !== undefined ? opacity : isActive ? 1 : 0,
        boxShadow: 'inset 0 0 100px rgba(255,255,255,0.9)',
        transition:
          opacity === undefined
            ? `opacity ${(durationSec / 2).toFixed(2)}s cubic-bezier(0.16, 1, 0.3, 1)`
            : undefined,
        ...style,
      }}
    />
  );
};

export const fadeWhiteTransition: VNTransitionDefinition = {
  id: 'fade_white',
  name: 'White Flash Glow',
  description: 'Blinding white overexposure flash ideal for explosions, revelations, or flashbacks.',
  category: 'fade',
  icon: GUI_ICONS.general.screenFx,
  tag: 'DRAMATIC',
  defaultDurationSec: 0.6,
  renderOverlay: FadeWhiteTransitionOverlay,
};
