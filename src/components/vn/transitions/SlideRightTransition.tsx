"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const SlideRightTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  progress,
  isActive,
  durationSec = 0.7,
  className = '',
  style = {},
}) => {
  const translateX =
    progress !== undefined
      ? (-1 + progress * 2) * 100
      : undefined;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-[#07070b] pointer-events-none z-50 ${className}`}
      style={{
        transform:
          translateX !== undefined
            ? `translateX(${translateX}%)`
            : isActive
            ? 'translateX(0%)'
            : 'translateX(-100%)',
        boxShadow: '15px 0 35px rgba(0,0,0,0.85)',
        transition:
          translateX === undefined
            ? `transform ${durationSec}s cubic-bezier(0.7, 0, 0.3, 1)`
            : undefined,
        ...style,
      }}
    />
  );
};

export const slideRightTransition: VNTransitionDefinition = {
  id: 'slide_right',
  name: 'Pan Slide Right',
  description: 'Camera travels horizontally across scenes with solid wipe barrier moving to the right.',
  category: 'motion',
  icon: GUI_ICONS.navigation.arrowLeft,
  tag: 'MOTION',
  defaultDurationSec: 0.7,
  renderOverlay: SlideRightTransitionOverlay,
};
