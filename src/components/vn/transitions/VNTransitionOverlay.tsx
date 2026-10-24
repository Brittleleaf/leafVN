"use client";
import React from 'react';
import { getTransition } from './registry';
import { VNTransitionRenderProps } from './types';

export interface VNTransitionOverlayProps extends VNTransitionRenderProps {
  transitionId?: string;
}

export const VNTransitionOverlay: React.FC<VNTransitionOverlayProps> = ({
  transitionId,
  progress,
  isActive,
  durationSec,
  color,
  className = '',
  style = {},
}) => {
  if (!transitionId || transitionId === 'instant') return null;

  const def = getTransition(transitionId);
  const OverlayComponent = def.renderOverlay;

  return (
    <OverlayComponent
      progress={progress}
      isActive={isActive}
      durationSec={durationSec ?? def.defaultDurationSec}
      color={color}
      className={className}
      style={style}
    />
  );
};
