"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const CurtainWipeTextEffectComponent: React.FC<TextEffectProps> = ({
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

  return (
    <span
      className={`relative inline-block select-none overflow-hidden ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#38bdf8',
        ...style,
      }}
    >
      <span className="relative z-10 px-1 py-0.5 block">{text}</span>
      {/* Sliding curtain wipe block */}
      <span
        className="absolute inset-0 z-20 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{
          backgroundColor: color || '#38bdf8',
          transformOrigin: 'right center',
          transform: active ? 'scaleX(0)' : 'scaleX(1)',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.5)',
        }}
      />
    </span>
  );
};

export const curtainWipeTextEffect: TextEffectDefinition = {
  id: 'curtain_wipe',
  name: 'Curtain Wipe Bar',
  category: 'cinematic',
  icon: GUI_ICONS.general.clapperboard,
  tag: 'NEW',
  defaultColor: '#38bdf8',
  defaultSample: 'EPISODE IV: THE SHADOW CIPHER',
  description: 'Clean cinematic geometric sweep revealing high-impact titles behind a sliding light barrier.',
  component: CurtainWipeTextEffectComponent,
};
