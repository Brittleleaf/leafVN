"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const FadeBlackTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.8,
  className = '',
  style = {},
}) => {
  // If scrubbed by timeline, calculate symmetric opacity peak at 50%
  const opacity =
    progress !== undefined
      ? progress <= 0.5
        ? progress * 2
        : (1 - progress) * 2
      : undefined;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-black pointer-events-none z-50 ${className}`}
      style={{
        opacity: opacity !== undefined ? opacity : isActive ? 1 : 0,
        transition:
          opacity === undefined
            ? `opacity ${(durationSec / 2).toFixed(2)}s cubic-bezier(0.4, 0, 0.2, 1)`
            : undefined,
        ...style,
      }}
    />
  );
};

export const fadeBlackTransition: VNTransitionDefinition = {
  id: 'fade_black',
  name: 'Fade to Black',
  description: 'Classic theatrical fade dip to deep cinematic black between scenes.',
  category: 'fade',
  icon: GUI_ICONS.general.film,
  tag: 'CLASSIC',
  defaultDurationSec: 0.8,
  renderOverlay: FadeBlackTransitionOverlay,
};
