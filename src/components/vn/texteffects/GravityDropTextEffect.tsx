"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const GravityDropTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#f97316',
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  const chars = [...(text || '')];
  const maxDelay = 360;
  const len = Math.max(chars.length - 1, 1);

  return (
    <span
      key={keySeed}
      className={`inline-block select-none overflow-visible pt-4 pb-2 ${className}`}
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
            className="inline-block relative will-change-transform"
            style={{
              animation: 'vn-gravity-drop 0.85s cubic-bezier(0.25, 1, 0.5, 1) forwards',
              animationDelay: `${delay}ms`,
              opacity: 0,
              transformOrigin: '50% 100%',
              textShadow: color
                ? `0 2px 8px ${color}50, 0 8px 16px rgba(0,0,0,0.5)`
                : '0 2px 8px rgba(249, 115, 22, 0.4)',
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
  tag: 'PRO',
  defaultColor: '#f97316',
  defaultSample: 'SUDDEN COLLAPSE OF REALITY',
  description: 'Physical free-fall drop slamming onto the baseline with authentic Squash & Stretch elastic settling.',
  component: GravityDropTextEffectComponent,
};
