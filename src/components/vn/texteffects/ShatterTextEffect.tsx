"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

interface ShatterOffset {
  tx: number;
  ty: number;
  tz: number;
  rx: number;
  ry: number;
  rz: number;
}

export const ShatterTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#ef4444',
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const [shattered, setShattered] = useState(false);
  const chars = useMemo(() => [...(text || '')], [text]);

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  const offsets: ShatterOffset[] = useMemo(() => {
    return chars.map(() => ({
      tx: (Math.random() - 0.5) * 220,
      ty: (Math.random() - 0.5) * 160,
      tz: Math.random() * -300 - 50,
      rx: (Math.random() - 0.5) * 180,
      ry: (Math.random() - 0.5) * 180,
      rz: (Math.random() - 0.5) * 120,
    }));
  }, [chars, keySeed]);

  useEffect(() => {
    setShattered(false);
    // Trigger shatter burst after 1.6s
    const triggerTimer = setTimeout(() => {
      setShattered(true);
    }, 1600);

    // Auto-reform after 4.2s for continuous cinematic loop in auditions
    const reformTimer = setTimeout(() => {
      setShattered(false);
    }, 4200);

    return () => {
      clearTimeout(triggerTimer);
      clearTimeout(reformTimer);
    };
  }, [keySeed, text]);

  return (
    <span
      className={`inline-block select-none cursor-pointer group py-2 ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        fontFamily: fontStyle,
        color: color || '#ef4444',
        ...style,
      }}
      onClick={() => setShattered((prev) => !prev)}
      title="Click to trigger shatter / reform impact"
    >
      {chars.map((ch, idx) => {
        const off = offsets[idx] || { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0 };
        return (
          <span
            key={idx}
            className="inline-block will-change-transform"
            style={{
              transition: shattered
                ? 'transform 0.85s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.85s ease, filter 0.85s ease'
                : 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, filter 0.4s ease',
              transform: shattered
                ? `translate3d(${off.tx.toFixed(0)}px, ${off.ty.toFixed(
                    0
                  )}px, ${off.tz.toFixed(0)}px) rotateX(${off.rx.toFixed(
                    0
                  )}deg) rotateY(${off.ry.toFixed(0)}deg) rotateZ(${off.rz.toFixed(
                    0
                  )}deg)`
                : 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
              opacity: shattered ? 0 : 1,
              filter: shattered ? 'blur(6px)' : 'none',
              textShadow: shattered
                ? 'none'
                : color
                ? `0 0 16px ${color}90, 0 0 2px #fff`
                : '0 0 16px rgba(239, 68, 68, 0.8), 0 0 2px #fff',
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
  tag: 'PRO',
  defaultColor: '#ef4444',
  defaultSample: 'OUR PROMISE HAS BEEN OBLITERATED',
  description: 'Cataclysmic 3D glass fracture exploding characters across depth planes with auto-reforming magnetics.',
  component: ShatterTextEffectComponent,
};
