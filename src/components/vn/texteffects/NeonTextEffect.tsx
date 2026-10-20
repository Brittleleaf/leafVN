"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const NeonTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  return (
    <span
      key={keySeed}
      className={`inline-block ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#D17BF8',
        animation: 'vn-neon-flicker 2.8s infinite',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const neonTextEffect: TextEffectDefinition = {
  id: 'neon',
  name: 'Neon Malfunction',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.lightBulb,
  defaultColor: '#D17BF8',
  defaultSample: 'NEO-SHINJUKU DISTRICT 09',
  description: 'High-voltage gas neon tube hum with intermittent flicker and power failure.',
  component: NeonTextEffectComponent,
};
