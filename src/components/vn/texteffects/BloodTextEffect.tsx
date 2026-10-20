"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const BloodTextEffectComponent: React.FC<TextEffectProps> = ({
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
        color: color || '#ef4444',
        animation: 'vn-blood-drip 3s infinite ease-in-out',
        textShadow:
          '0 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(239, 68, 68, 0.7), 0 12px 20px rgba(185, 28, 28, 0.6)',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const bloodTextEffect: TextEffectDefinition = {
  id: 'blood',
  name: 'Horror Blood Drip',
  category: 'horror',
  icon: GUI_ICONS.general.screenFx,
  tag: 'HORROR',
  defaultColor: '#ef4444',
  defaultSample: 'THERE ARE NO SURVIVORS',
  description: 'Viscous crimson shadow condensation dripping downwards with ominous melting tension.',
  component: BloodTextEffectComponent,
};
