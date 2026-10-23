"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const NeonTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#D17BF8',
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
      className={`inline-block select-none tracking-wider ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#D17BF8',
        ...style,
      }}
    >
      {chars.map((ch, idx) => {
        // Certain letters have independent cathode brownout / misfires
        const isMalfunctioningLetter = (idx * 4 + 2) % 7 === 0;
        return (
          <span
            key={idx}
            className="inline-block will-change-transform"
            style={{
              animation: isMalfunctioningLetter
                ? 'vn-neon-flicker 2.1s infinite'
                : 'vn-neon-flicker 4.8s infinite',
              animationDelay: `${(idx % 4) * 180}ms`,
              textShadow:
                '0 0 5px #ffffff, 0 0 10px currentColor, 0 0 22px currentColor, 0 0 45px currentColor',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
};

export const neonTextEffect: TextEffectDefinition = {
  id: 'neon',
  name: 'Neon Malfunction',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.lightBulb,
  tag: 'PRO',
  defaultColor: '#D17BF8',
  defaultSample: 'NEO-SHINJUKU DISTRICT 09',
  description: 'High-voltage gas neon cathode tube with authentic independent letter brownouts, hum and surge.',
  component: NeonTextEffectComponent,
};
