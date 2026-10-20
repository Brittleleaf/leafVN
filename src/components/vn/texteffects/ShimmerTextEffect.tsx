"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const ShimmerTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
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
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        fontFamily: fontStyle,
        backgroundImage:
          'linear-gradient(90deg, #f59e0b 0%, #fef08a 25%, #fbbf24 50%, #f59e0b 75%, #fef08a 100%)',
        backgroundSize: '200% auto',
        animation: 'vn-gold-shimmer 3s linear infinite',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const shimmerTextEffect: TextEffectDefinition = {
  id: 'shimmer',
  name: 'Golden Shimmer',
  category: 'cinematic',
  icon: GUI_ICONS.general.screenFx,
  defaultColor: '#fbbf24',
  defaultSample: 'THE DAWN OF A NEW EMPIRE',
  description: 'A sweeping band of specular light and reflective luster traveling across letterforms.',
  component: ShimmerTextEffectComponent,
};
