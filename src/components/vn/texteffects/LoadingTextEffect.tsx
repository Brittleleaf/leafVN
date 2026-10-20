"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const LoadingTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, Helvetica, Arial, sans-serif`
    : 'Helvetica, Arial, sans-serif';

  const displayText = text || 'LOADING';
  const chars = displayText.split('');

  // Fallback defaults or custom color adaptation
  const dimColor = color ? `${color}b3` : '#aaaaaa';
  const brightColor = color || '#cccccc';
  const shadowColor = color || '#666666';

  return (
    <span
      key={keySeed}
      className={`inline-block whitespace-pre-wrap select-none ${className}`}
      style={
        {
          fontFamily: fontStyle,
          color: brightColor,
          letterSpacing: '0.05em',
          '--loading-dim-color': dimColor,
          '--loading-bright-color': brightColor,
          '--loading-shadow-color': shadowColor,
          ...style,
        } as React.CSSProperties
      }
    >
      {chars.map((char, index) => (
        <span
          key={`${keySeed}-${index}`}
          className="inline-block relative text-center"
          style={{
            animation: 'vn-loading-letter 2s ease-in-out infinite',
            animationDelay: `${index * 0.15}s`,
            minWidth: char === ' ' ? '0.35em' : 'auto',
          }}
        >
          {/* Subtle under-glow blurred letter */}
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              filter: 'blur(3px)',
              animation: 'vn-loading-letter-glow 2s ease-in-out infinite',
              animationDelay: `${index * 0.15}s`,
              opacity: 0.7,
              color: brightColor,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>

          {/* Crisp foreground animated character */}
          <span
            style={{
              display: 'inline-block',
              animation: 'vn-loading-letter-color 2s ease-in-out infinite',
              animationDelay: `${index * 0.15}s`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  );
};

export const loadingTextEffect: TextEffectDefinition = {
  id: 'loading',
  name: 'Loading Wave',
  category: 'ambient',
  icon: GUI_ICONS.state.backwardTime,
  tag: 'NEW',
  defaultColor: '#cccccc',
  defaultSample: 'LOADING...',
  description: 'Cascading sequential wave where letters swell, illuminate, and dissolve into glowing shadows in a repeating cycle.',
  component: LoadingTextEffectComponent,
};
