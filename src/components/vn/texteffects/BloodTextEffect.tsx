"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const BloodTextEffectComponent: React.FC<TextEffectProps> = ({
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

  const chars = [...(text || '')];

  return (
    <span
      key={keySeed}
      className={`inline-block select-none tracking-wider ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#ef4444',
        ...style,
      }}
    >
      {chars.map((ch, idx) => {
        const isDripper = (idx * 3 + 1) % 4 === 0 && ch !== ' ';
        return (
          <span
            key={idx}
            className="inline-block relative will-change-transform"
            style={{
              animation: 'vn-blood-drip 3.2s infinite ease-in-out',
              animationDelay: `${(idx % 5) * 200}ms`,
              textShadow:
                '0 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(220, 38, 38, 0.8), 0 14px 22px rgba(136, 19, 19, 0.85)',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
            {/* Ominous viscous drip droplet */}
            {isDripper && (
              <span
                aria-hidden="true"
                className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-[3px] h-[7px] rounded-b-full bg-gradient-to-b from-red-600 to-red-950 pointer-events-none opacity-80 animate-pulse"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}
              />
            )}
          </span>
        );
      })}
    </span>
  );
};

export const bloodTextEffect: TextEffectDefinition = {
  id: 'blood',
  name: 'Horror Blood Drip',
  category: 'horror',
  icon: GUI_ICONS.general.screenFx,
  tag: 'HORROR',
  defaultColor: '#ef4444',
  defaultSample: 'THERE ARE NO SURVIVORS REMAINING',
  description: 'Viscous coagulated crimson typography with individual drooping droplet stalactites and melting tension.',
  component: BloodTextEffectComponent,
};
