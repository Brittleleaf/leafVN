import React from 'react';

export type VNTransitionId =
  | 'instant'
  | 'fade_black'
  | 'fade_white'
  | 'cross_dissolve'
  | 'glitch'
  | 'slide_left'
  | 'slide_right'
  | 'iris_circle'
  | 'shutter_wipe'
  | 'pixelate'
  | (string & {});

export interface VNTransitionRenderProps {
  progress?: number; // 0 to 1 normalized progress for scrubbers / timelines
  isActive: boolean;
  durationSec?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface VNTransitionDefinition {
  id: VNTransitionId;
  name: string;
  description: string;
  category: 'fade' | 'wipe' | 'glitch' | 'motion' | 'artistic';
  icon: string;
  tag?: string;
  defaultDurationSec: number;
  renderOverlay: React.FC<VNTransitionRenderProps>;
}
