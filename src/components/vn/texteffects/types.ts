import React from 'react';

export type VNTextEffectCategory = 'dramatic' | 'horror' | 'cyberpunk' | 'ambient' | 'cinematic';

export interface TextEffectProps {
  text: string;
  color?: string;
  fontFamily?: string;
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  keySeed?: number | string;
  progress?: number; // 0 to 1 normalized progress for cinematic timeline synchronization
}

export interface TextEffectDefinition {
  id: string;
  name: string;
  category: VNTextEffectCategory;
  description: string;
  icon: string;
  tag?: string;
  defaultColor?: string;
  defaultSample?: string;
  component: React.FC<TextEffectProps>;
}
