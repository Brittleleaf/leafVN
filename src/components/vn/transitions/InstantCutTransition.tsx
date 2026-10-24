"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const InstantCutTransitionOverlay: React.FC<VNTransitionRenderProps> = () => {
  return null;
};

export const instantCutTransition: VNTransitionDefinition = {
  id: 'instant',
  name: 'Instant Cut',
  description: 'Immediate zero-latency camera scene switch without transition delay.',
  category: 'motion',
  icon: GUI_ICONS.general.cut,
  defaultDurationSec: 0,
  renderOverlay: InstantCutTransitionOverlay,
};
