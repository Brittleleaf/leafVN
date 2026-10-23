"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const LiquidWobbleTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#c084fc',
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
      className={`relative inline-block select-none ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#c084fc',
        ...style,
      }}
    >
      {/* Background Chromatic Delirium Echo */}
      <span
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-40 blur-[2px] select-none text-emerald-400"
      >
        {chars.map((ch, idx) => (
          <span
            key={`echo-${idx}`}
            className="inline-block will-change-transform"
            style={{
              animation: 'vn-liquid-wobble 2.8s ease-in-out infinite',
              animationDelay: `${idx * 50 + 120}ms`,
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>

      {/* Primary Liquid Wobble Stream */}
      <span className="relative z-10 block">
        {chars.map((ch, idx) => (
          <span
            key={idx}
            className="inline-block will-change-transform"
            style={{
              animation: 'vn-liquid-wobble 2.6s ease-in-out infinite',
              animationDelay: `${idx * 45}ms`,
              textShadow: color
                ? `0 0 14px ${color}70, 0 4px 12px rgba(0,0,0,0.8)`
                : '0 0 14px rgba(192, 132, 252, 0.6)',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    </span>
  );
};

export const liquidWobbleTextEffect: TextEffectDefinition = {
  id: 'liquid_wobble',
  name: 'Liquid Delirium',
  category: 'horror',
  icon: GUI_ICONS.mood.dead,
  tag: 'PRO',
  defaultColor: '#c084fc',
  defaultSample: 'THE WALLS ARE MELTING BEFORE MY EYES',
  description: 'Viscous dual-layer psychedelic warp with toxic chromatic echo simulating delirium and hallucination.',
  component: LiquidWobbleTextEffectComponent,
};
