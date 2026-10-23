"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const Flip3DTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#f59e0b',
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
  const maxDelay = 420;
  const len = Math.max(chars.length - 1, 1);

  return (
    <span
      className={`inline-block select-none ${className}`}
      style={{
        perspective: '800px',
        transformStyle: 'preserve-3d',
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
            className="inline-block relative will-change-transform"
            style={{
              transformOrigin: '50% 100%',
              transition:
                'opacity 0.45s ease, transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.5s ease',
              transitionDelay: `${delay}ms`,
              opacity: active ? 1 : 0,
              transform: active
                ? 'rotateX(0deg) translateY(0) translateZ(0)'
                : 'rotateX(90deg) translateY(12px) translateZ(-20px)',
              filter: active ? 'brightness(1)' : 'brightness(1.5)',
              textShadow: active
                ? color
                  ? `0 2px 8px ${color}40, 0 8px 16px rgba(0,0,0,0.5)`
                  : '0 2px 8px rgba(245, 158, 11, 0.4)'
                : 'none',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
            {/* Ground shadow projection */}
            <span
              className="absolute left-0 right-0 -bottom-1 h-[2px] bg-black/60 rounded-full blur-[2px] pointer-events-none transition-all duration-500"
              style={{
                opacity: active ? 0.7 : 0,
                transform: active ? 'scaleX(1)' : 'scaleX(0.2)',
                transitionDelay: `${delay}ms`,
              }}
            />
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
  tag: 'PRO',
  defaultColor: '#f59e0b',
  defaultSample: 'ACT II: THE RECKONING',
  description: 'Physical 3D card folding upward with elastic overshoot, perspective lighting and dynamic ground shadow.',
  component: Flip3DTextEffectComponent,
};
