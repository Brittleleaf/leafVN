"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const FadeInTextEffectComponent: React.FC<TextEffectProps> = ({
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

  return (
    <span
      key={keySeed}
      className={`inline-block ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#e5e7eb',
        animation: 'vn-text-fade-in 1.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const fadeInTextEffect: TextEffectDefinition = {
  id: 'fade_in',
  name: 'Theatrical Fade',
  category: 'cinematic',
  icon: GUI_ICONS.general.film,
  defaultColor: '#e5e7eb',
  defaultSample: 'CHAPTER I: PROLOGUE',
  description: 'Silky smooth theatrical opacity ascent with subtle depth blur clearing.',
  component: FadeInTextEffectComponent,
};
