"use client";
import React from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const ShimmerTextEffectComponent: React.FC<TextEffectProps> = ({
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

  const baseColor = color || '#fbbf24';

  return (
    <span
      key={keySeed}
      className={`inline-block bg-clip-text text-transparent select-none font-bold tracking-wider ${className}`}
      style={{
        fontFamily: fontStyle,
        backgroundImage: `linear-gradient(100deg, ${baseColor} 20%, #ffffff 48%, ${baseColor} 70%)`,
        backgroundSize: '220% 100%',
        animation: 'vn-gold-shimmer 2.8s linear infinite',
        filter: `drop-shadow(0 0 10px ${baseColor}40)`,
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const shimmerTextEffect: TextEffectDefinition = {
  id: 'shimmer',
  name: 'Luminous Shimmer',
  category: 'cinematic',
  icon: GUI_ICONS.general.screenFx,
  tag: 'PRO',
  defaultColor: '#fbbf24',
  defaultSample: 'THE DAWN OF A NEW EMPIRE',
  description: 'Sweeping band of specular gleam and reflective brilliance adapting dynamically to custom palette hues.',
  component: ShimmerTextEffectComponent,
};
