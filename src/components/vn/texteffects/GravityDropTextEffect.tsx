"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const GravityDropTextEffectComponent: React.FC<TextEffectProps> = ({
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
  const maxDelay = 380;
  const len = Math.max(chars.length - 1, 1);

  return (
    <span
      key={keySeed}
      className={`inline-block select-none overflow-hidden py-2 ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#f97316',
        ...style,
      }}
    >
      {chars.map((ch, idx) => {
        const delay = ((idx / len) * maxDelay).toFixed(0);
        return (
          <span
            key={idx}
            className="inline-block will-change-transform"
            style={{
              animation: 'vn-gravity-drop 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              animationDelay: `${delay}ms`,
              opacity: 0,
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
};

export const gravityDropTextEffect: TextEffectDefinition = {
  id: 'gravity_drop',
  name: 'Gravity Drop Impact',
  category: 'dramatic',
  icon: GUI_ICONS.navigation.arrowDown,
  tag: 'NEW',
  defaultColor: '#f97316',
  defaultSample: 'SUDDEN COLLAPSE OF REALITY',
  description: 'Physical free-fall drop slamming onto the baseline with spring bounce settling.',
  component: GravityDropTextEffectComponent,
};
