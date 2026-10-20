"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const ShakeTextEffectComponent: React.FC<TextEffectProps> = ({
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
        color: color || '#f59e0b',
        animation: 'vn-text-shake 0.45s infinite ease-in-out',
        textShadow: '0 0 14px rgba(245, 158, 11, 0.7)',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const shakeTextEffect: TextEffectDefinition = {
  id: 'shake',
  name: 'Seismic Tremor',
  category: 'dramatic',
  icon: GUI_ICONS.general.hazard,
  defaultColor: '#f59e0b',
  defaultSample: 'IMPACT SHOCK DETECTED',
  description: 'Violent kinetic tremor and explosive displacement reverberating through the frame.',
  component: ShakeTextEffectComponent,
};
