"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const PulseTextEffectComponent: React.FC<TextEffectProps> = ({
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
      className={`inline-block animate-pulse ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#ef4444',
        filter: 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.8))',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const pulseTextEffect: TextEffectDefinition = {
  id: 'pulse',
  name: 'Red Alert Pulse',
  category: 'dramatic',
  icon: GUI_ICONS.general.hazard,
  defaultColor: '#ff2a2a',
  defaultSample: 'CRITICAL PRESSURE WARNING',
  description: 'Urgent rhythmic luminescence swelling and throbbing like an emergency beacon.',
  component: PulseTextEffectComponent,
};
