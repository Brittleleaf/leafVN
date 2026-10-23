"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const BlurFocusTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#8fd6e8',
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const [active, setActive] = useState(true);

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  useEffect(() => {
    setActive(false);
    const timer = setTimeout(() => {
      setActive(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [text, keySeed]);

  const chars = [...(text || '')];
  const maxDelay = 460;
  const len = Math.max(chars.length - 1, 1);

  return (
    <span
      className={`inline-block select-none tracking-wide ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#8fd6e8',
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
              transition:
                'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), filter 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), text-shadow 0.75s ease',
              transitionDelay: `${delay}ms`,
              opacity: active ? 1 : 0,
              filter: active ? 'blur(0px)' : 'blur(16px)',
              transform: active ? 'scale(1) translateZ(0)' : 'scale(1.15) translateZ(0)',
              textShadow: active
                ? color
                  ? `0 0 14px ${color}60`
                  : '0 0 14px rgba(143, 214, 232, 0.5)'
                : '-4px 0 8px rgba(239, 68, 68, 0.8), 4px 0 8px rgba(56, 189, 248, 0.8), 0 0 24px rgba(255, 255, 255, 0.6)',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
};

export const blurFocusTextEffect: TextEffectDefinition = {
  id: 'blur_focus',
  name: 'Blur Focus Pull',
  category: 'cinematic',
  icon: GUI_ICONS.general.screenFx,
  tag: 'PRO',
  defaultColor: '#8fd6e8',
  defaultSample: 'A DISTANT RECOLLECTION OF LIGHT',
  description: 'Anamorphic lens optical focus pull with chromatic RGB dispersion converging into pin-sharp typography.',
  component: BlurFocusTextEffectComponent,
};
