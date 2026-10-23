"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const ShakeTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#f59e0b',
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
        color: color || '#f59e0b',
        ...style,
      }}
    >
      {chars.map((ch, idx) => (
        <span
          key={idx}
          className="inline-block will-change-transform"
          style={{
            animation: 'vn-text-shake 0.38s infinite ease-in-out',
            animationDelay: `${(idx % 4) * 60}ms`,
            textShadow: color
              ? `0 0 12px ${color}80, 0 0 24px ${color}40`
              : '0 0 12px rgba(245, 158, 11, 0.8), 0 0 24px rgba(245, 158, 11, 0.4)',
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
};

export const shakeTextEffect: TextEffectDefinition = {
  id: 'shake',
  name: 'Seismic Tremor',
  category: 'dramatic',
  icon: GUI_ICONS.general.hazard,
  tag: 'PRO',
  defaultColor: '#f59e0b',
  defaultSample: 'IMPACT SHOCK DETECTED',
  description: 'Violent asynchronous seismic tremor vibrating through each character with explosive kinetic resonance.',
  component: ShakeTextEffectComponent,
};
