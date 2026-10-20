"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const CleanGlitchTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, monospace`
    : 'monospace';

  return (
    <span
      key={keySeed}
      className={`relative inline-block select-none ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#ffffff',
        animation: 'vn-clean-glitch 1s linear infinite',
        letterSpacing: '-0.03em',
        ...style,
      }}
    >
      {/* Top half slice */}
      <span
        aria-hidden="true"
        className="absolute inset-0 select-none pointer-events-none"
        style={{
          color: color || '#ffffff',
          clipPath: 'polygon(0 0, 100% 0, 100% 48%, 0 48%)',
          animation: 'vn-clean-glitch-top 0.8s linear infinite',
          textShadow: '-1px 0 rgba(0, 240, 255, 0.7)',
        }}
      >
        {text}
      </span>

      {/* Main Base Text */}
      <span className="relative z-10">{text}</span>

      {/* Bottom half slice */}
      <span
        aria-hidden="true"
        className="absolute inset-0 select-none pointer-events-none"
        style={{
          color: color || '#ffffff',
          clipPath: 'polygon(0 52%, 100% 52%, 100% 100%, 0 100%)',
          animation: 'vn-clean-glitch-bottom 0.8s linear infinite',
          textShadow: '1px 0 rgba(255, 0, 85, 0.7)',
        }}
      >
        {text}
      </span>
    </span>
  );
};

export const cleanGlitchTextEffect: TextEffectDefinition = {
  id: 'clean_glitch',
  name: 'Clean Glitch',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.cut,
  tag: 'NEW',
  defaultColor: '#ffffff',
  defaultSample: 'SYSTEM INTEGRITY COMPROMISED',
  description: 'Minimalist polygon-sliced horizontal displacement with high-speed skew twitches.',
  component: CleanGlitchTextEffectComponent,
};
