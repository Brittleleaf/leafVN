"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

interface ShatterOffset {
  tx: number;
  ty: number;
  tr: number;
}

export const ShatterTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const [isShattered, setIsShattered] = useState(false);

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  const chars = useMemo(() => [...(text || '')], [text]);

  const offsets: ShatterOffset[] = useMemo(() => {
    return chars.map(() => ({
      tx: (Math.random() - 0.5) * 160,
      ty: (Math.random() - 0.5) * 120,
      tr: (Math.random() - 0.5) * 90,
    }));
  }, [chars, keySeed]);

  useEffect(() => {
    setIsShattered(false);
    // Auto-trigger shatter burst after 1.8s for dramatic demonstration, or user hover
    const timer = setTimeout(() => {
      setIsShattered(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [keySeed, text]);

  return (
    <span
      className={`inline-block select-none cursor-pointer group ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#ef4444',
        ...style,
      }}
      onClick={() => setIsShattered((prev) => !prev)}
      title="Click or hover to shatter / restore"
    >
      {chars.map((ch, idx) => {
        const offset = offsets[idx] || { tx: 0, ty: 0, tr: 0 };
        return (
          <span
            key={idx}
            className="inline-block will-change-transform transition-all duration-700 ease-out"
            style={{
              transform: isShattered
                ? `translate(${offset.tx.toFixed(0)}px, ${offset.ty.toFixed(
                    0
                  )}px) rotate(${offset.tr.toFixed(0)}deg)`
                : 'translate(0px, 0px) rotate(0deg)',
              opacity: isShattered ? 0 : 1,
              filter: isShattered ? 'blur(4px)' : 'none',
              textShadow: isShattered
                ? 'none'
                : color
                ? `0 0 10px ${color}80`
                : '0 0 10px rgba(239, 68, 68, 0.5)',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        );
      })}
    </span>
  );
};

export const shatterTextEffect: TextEffectDefinition = {
  id: 'shatter',
  name: 'Impact Shatter',
  category: 'dramatic',
  icon: GUI_ICONS.general.skullDeath,
  tag: 'NEW',
  defaultColor: '#ef4444',
  defaultSample: 'OUR PROMISE HAS BEEN OBLITERATED',
  description: 'Catastrophic fracture exploding characters across scattered trajectories and dissipating into smoke.',
  component: ShatterTextEffectComponent,
};
