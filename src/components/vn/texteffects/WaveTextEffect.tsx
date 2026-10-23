"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const WaveTextEffectComponent: React.FC<TextEffectProps> = ({
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
        color: color || '#38bdf8',
        ...style,
      }}
    >
      {chars.map((ch, idx) => (
        <span
          key={idx}
          className="inline-block will-change-transform"
          style={{
            animation: 'vn-kinetic-wave 1.8s ease-in-out infinite',
            animationDelay: `${idx * 65}ms`,
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
};

export const waveTextEffect: TextEffectDefinition = {
  id: 'wave',
  name: 'Kinetic Wave',
  category: 'ambient',
  icon: GUI_ICONS.general.screenFx,
  tag: 'NEW',
  defaultColor: '#38bdf8',
  defaultSample: 'WHISPERS ACROSS THE OBSIDIAN OCEAN',
  description: 'Continuous harmonic vertical oscillation rolling rhythmically through characters.',
  component: WaveTextEffectComponent,
};
