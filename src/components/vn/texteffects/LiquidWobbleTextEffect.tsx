"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const LiquidWobbleTextEffectComponent: React.FC<TextEffectProps> = ({
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

  const chars = [...(text || '')];

  return (
    <span
      key={keySeed}
      className={`inline-block select-none ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#a855f7',
        textShadow: color
          ? `0 0 12px ${color}60`
          : '0 0 12px rgba(168, 85, 247, 0.4)',
        ...style,
      }}
    >
      {chars.map((ch, idx) => (
        <span
          key={idx}
          className="inline-block will-change-transform"
          style={{
            animation: 'vn-liquid-wobble 2.6s ease-in-out infinite',
            animationDelay: `${idx * 45}ms`,
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
};

export const liquidWobbleTextEffect: TextEffectDefinition = {
  id: 'liquid_wobble',
  name: 'Liquid Delirium',
  category: 'horror',
  icon: GUI_ICONS.mood.dead,
  tag: 'NEW',
  defaultColor: '#c084fc',
  defaultSample: 'THE WALLS ARE MELTING BEFORE MY EYES',
  description: 'Gelatinous hypnotic skew and warp simulating delirium, intoxication, or psychic corruption.',
  component: LiquidWobbleTextEffectComponent,
};
