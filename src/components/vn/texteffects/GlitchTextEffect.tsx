"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const GlitchTextEffectComponent: React.FC<TextEffectProps> = ({
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
        color: color || '#00ffff',
        animation: 'vn-text-glitch 1.2s infinite linear',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const glitchTextEffect: TextEffectDefinition = {
  id: 'glitch',
  name: 'Cyberpunk Glitch',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.screenFx,
  tag: 'POPULAR',
  defaultColor: '#00ffff',
  defaultSample: 'NEURAL LINK DECOMPILING',
  description: 'RGB chromatic displacement with digital horizontal shudder and scanline interference.',
  component: GlitchTextEffectComponent,
};
