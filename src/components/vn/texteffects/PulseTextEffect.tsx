"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const PulseTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#ef4444',
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
      className={`inline-block select-none will-change-transform ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#ef4444',
        animation: 'vn-beacon-pulse 1.8s ease-in-out infinite',
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
  tag: 'PRO',
  defaultColor: '#ff2a2a',
  defaultSample: 'CRITICAL PRESSURE WARNING',
  description: 'Double-beat cardiac beacon surge with expanding luminous shockwave halo and rhythmic adrenaline strobe.',
  component: PulseTextEffectComponent,
};
