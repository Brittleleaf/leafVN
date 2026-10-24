"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const CrossDissolveTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.9,
  className = '',
  style = {},
}) => {
  const opacity =
    progress !== undefined
      ? progress <= 0.5
        ? progress * 1.6
        : (1 - progress) * 1.6
      : undefined;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-neutral-900/60 backdrop-blur-[6px] pointer-events-none z-50 ${className}`}
      style={{
        opacity: opacity !== undefined ? Math.min(1, opacity) : isActive ? 1 : 0,
        transition:
          opacity === undefined
            ? `opacity ${(durationSec / 2).toFixed(2)}s ease-in-out`
            : undefined,
        ...style,
      }}
    />
  );
};

export const crossDissolveTransition: VNTransitionDefinition = {
  id: 'cross_dissolve',
  name: 'Cross Dissolve',
  description: 'Soft photographic blur and opacity blend melting one environment into another.',
  category: 'fade',
  icon: GUI_ICONS.general.film,
  tag: 'SMOOTH',
  defaultDurationSec: 0.9,
  renderOverlay: CrossDissolveTransitionOverlay,
};
