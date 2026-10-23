"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const Flip3DTextEffectComponent: React.FC<TextEffectProps> = ({
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
  const maxDelay = 420;
  const len = Math.max(chars.length - 1, 1);

  return (
    <span
      className={`inline-block select-none ${className}`}
      style={{
        perspective: '600px',
        fontFamily: fontStyle,
        color: color || '#f59e0b',
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
              transformOrigin: '50% 100%',
              transition:
                'opacity 0.45s ease, transform 0.55s cubic-bezier(0.2, 0.9, 0.3, 1.25)',
              transitionDelay: `${delay}ms`,
              opacity: active ? 1 : 0,
              transform: active
                ? 'rotateX(0deg) translateY(0)'
                : 'rotateX(90deg) translateY(8px)',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
};

export const flip3DTextEffect: TextEffectDefinition = {
  id: 'flip_3d',
  name: '3D Flip Reveal',
  category: 'cinematic',
  icon: GUI_ICONS.general.clapperboard,
  tag: 'NEW',
  defaultColor: '#f59e0b',
  defaultSample: 'ACT II: THE RECKONING',
  description: 'Perspective 3D characters unfolding upwards with spring bounce kinematics.',
  component: Flip3DTextEffectComponent,
};
