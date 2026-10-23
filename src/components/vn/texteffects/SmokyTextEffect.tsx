"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const SmokyTextEffectComponent: React.FC<TextEffectProps> = ({
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
  const chars = (text || '').split('');

  return (
    <span
      key={keySeed}
      className={`inline-block whitespace-pre-wrap select-none py-2 ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#f5f5f5',
        ...style,
      }}
    >
      <style>{`
        @keyframes vn-smoky {
          0%, 20% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) skewX(0deg) scale(1);
            text-shadow: 0 0 0 currentColor;
          }
          65% {
            text-shadow: 0 0 35px currentColor;
          }
          100% {
            transform: translate3d(6rem, -3rem, 0) rotate(-25deg) skewX(45deg) scale(1.4);
            text-shadow: 0 0 20px currentColor;
            opacity: 0;
          }
        }

        @keyframes vn-smoky-mirror {
          0%, 20% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(0deg) skewX(0deg) scale(1);
            text-shadow: 0 0 0 currentColor;
          }
          65% {
            text-shadow: 0 0 35px currentColor;
          }
          100% {
            transform: translate3d(7rem, -3rem, 0) rotate(-25deg) skewX(-45deg) scale(1.5);
            text-shadow: 0 0 20px currentColor;
            opacity: 0;
          }
        }
      `}</style>
      {chars.map((char, index) => {
        const isEven = index % 2 === 0;
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              color: 'transparent',
              textShadow: `0 0 0 ${color || 'whitesmoke'}`,
              animationName: isEven ? 'vn-smoky-mirror' : 'vn-smoky',
              animationDuration: '5.5s',
              animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animationDelay: `${(0.2 + index * 0.06).toFixed(2)}s`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
};

export const smokyTextEffect: TextEffectDefinition = {
  id: 'smoky',
  name: 'Smoky Dissolve',
  category: 'horror',
  icon: GUI_ICONS.general.screenFx,
  tag: 'PRO',
  defaultColor: '#f5f5f5',
  defaultSample: 'SIGNAL LOST IN THE FOG',
  description: 'Letters dissipate, rotate and evaporate into the air like curling white smoke, continuously reforming in mists.',
  component: SmokyTextEffectComponent,
};
