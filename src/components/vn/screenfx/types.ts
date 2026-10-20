import React from 'react';
import { VNScreenFxType } from '@/types/vn';

export interface ScreenFxInspectorProps {
  params: Record<string, any>;
  onChange: (patch: Record<string, any>) => void;
  color?: string;
  onColorChange?: (color: string) => void;
  playSfx?: (url: string, isLoop?: boolean, volume?: number) => void;
  notify?: (msg: string) => void;
}

export interface ScreenFxProps {
  intensityMultiplier: number;
  intensity?: 'light' | 'medium' | 'heavy';
  color?: string;
  animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
  params?: Record<string, any>;
  flashlightMode?: 'normal' | 'broken';
  flashlightRadius?: number;
  flashlightShutdown?: boolean;
  flashlightHitsRequired?: number;
  onFlashlightReactivated?: () => void;
  customWords?: string[];
}

export interface ScreenFxDefinition {
  id: VNScreenFxType;
  label: string;
  description: string;
  icon: string;
  badgeColor: string;
  defaultSfx?: string;
  defaultParams?: Record<string, any>;
  component: React.FC<ScreenFxProps>;
  inspector?: React.FC<ScreenFxInspectorProps>;
}

export interface VNScreenFxOverlayProps {
  fxType?: VNScreenFxType;
  intensity?: 'light' | 'medium' | 'heavy';
  color?: string;
  animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
  params?: Record<string, any>;
  flashlightMode?: 'normal' | 'broken';
  flashlightRadius?: number;
  flashlightShutdown?: boolean;
  flashlightHitsRequired?: number;
  onFlashlightReactivated?: () => void;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
  isFadingOut?: boolean;
  customWords?: string[];
}
