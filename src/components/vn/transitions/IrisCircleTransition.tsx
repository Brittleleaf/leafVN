"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const IrisCircleTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.85,
  className = '',
  style = {},
}) => {
  // If progress is provided (0 to 1):
  // 0 -> radius 100% (open)
  // 0.5 -> radius 0% (closed circle)
  // 1 -> radius 100% (open)
  const radiusPercent =
    progress !== undefined
      ? progress <= 0.5
        ? (1 - progress * 2) * 100
        : (progress - 0.5) * 2 * 100
      : undefined;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-black pointer-events-none z-50 ${className}`}
      style={{
        clipPath:
          radiusPercent !== undefined
            ? `circle(${radiusPercent.toFixed(1)}% at 50% 50%)`
            : isActive
            ? 'circle(0% at 50% 50%)'
            : 'circle(120% at 50% 50%)',
        transition:
          radiusPercent === undefined
            ? `clip-path ${durationSec}s cubic-bezier(0.65, 0, 0.35, 1)`
            : undefined,
        ...style,
      }}
    />
  );
};

export const irisCircleTransition: VNTransitionDefinition = {
  id: 'iris_circle',
  name: 'Iris Spotlight Wipe',
  description: 'Classic anime and theatrical circular aperture closing to a focal point and reopening.',
  category: 'artistic',
  icon: GUI_ICONS.general.circle,
  tag: 'ANIME',
  defaultDurationSec: 0.85,
  renderOverlay: IrisCircleTransitionOverlay,
};
