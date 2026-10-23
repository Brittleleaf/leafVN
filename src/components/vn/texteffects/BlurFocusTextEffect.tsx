"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const BlurFocusTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const [active, setActive] = useState(false);

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  useEffect(() => {
    setActive(false);
    const raf = requestAnimationFrame(() => {
      setActive(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [text, keySeed]);

  const chars = [...(text || '')];
  const maxDelay = 450;
  const len = Math.max(chars.length - 1, 1);

  return (
    <span
      className={`inline-block select-none ${className}`}
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
            className="inline-block transition-all duration-700 ease-out will-change-transform"
            style={{
              transitionDelay: `${delay}ms`,
              opacity: active ? 1 : 0,
              filter: active ? 'blur(0px)' : 'blur(14px)',
              transform: active ? 'scale(1)' : 'scale(1.12)',
              textShadow: active
                ? color
                  ? `0 0 16px ${color}50`
                  : '0 0 16px rgba(143, 214, 232, 0.4)'
                : 'none',
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
  tag: 'NEW',
  defaultColor: '#8fd6e8',
  defaultSample: 'A DISTANT RECOLLECTION OF LIGHT',
  description: 'Dreamlike optical defocus resolving into crisp pin-sharp clarity with staggered chromatic calm.',
  component: BlurFocusTextEffectComponent,
};
