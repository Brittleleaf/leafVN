"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const CurtainWipeTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#38bdf8',
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

  return (
    <span
      className={`relative inline-block select-none overflow-hidden px-2 py-1 ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#38bdf8',
        ...style,
      }}
    >
      <span
        className="relative z-10 block transition-opacity duration-500 ease-out"
        style={{
          opacity: active ? 1 : 0.2,
          textShadow: color
            ? `0 0 16px ${color}60`
            : '0 0 16px rgba(56, 189, 248, 0.4)',
        }}
      >
        {text}
      </span>

      {/* High-energy specular curtain wipe bar */}
      <span
        className="absolute inset-0 z-20 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)]"
        style={{
          backgroundColor: color || '#38bdf8',
          transformOrigin: 'right center',
          transform: active ? 'scaleX(0)' : 'scaleX(1)',
          boxShadow: `0 0 28px ${color || '#38bdf8'}, 0 0 8px #ffffff`,
        }}
      >
        {/* Leading edge light blade */}
        <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-white shadow-[0_0_12px_#fff]" />
      </span>
    </span>
  );
};

export const curtainWipeTextEffect: TextEffectDefinition = {
  id: 'curtain_wipe',
  name: 'Curtain Wipe Bar',
  category: 'cinematic',
  icon: GUI_ICONS.general.clapperboard,
  tag: 'PRO',
  defaultColor: '#38bdf8',
  defaultSample: 'EPISODE IV: THE SHADOW CIPHER',
  description: 'High-energy laser barrier curtain wipe revealing cinematic titles with leading-edge specular flare.',
  component: CurtainWipeTextEffectComponent,
};
