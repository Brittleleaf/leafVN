"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

const MATRIX_GLYPHS = '0123456789ABCDEF$#@%&*+-/<>[]{}アイウエオカキクケコサシスセソタチツテト';

interface MatrixStreamColumn {
  leadGlyph: string;
  isLocked: boolean;
  intensity: number;
}

export const MatrixRainTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#22c55e',
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const chars = useMemo(() => [...(text || 'SIGNAL')], [text]);
  const [columns, setColumns] = useState<MatrixStreamColumn[]>(() =>
    chars.map(() => ({ leadGlyph: '0', isLocked: false, intensity: 1 }))
  );

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, monospace`
    : 'monospace';

  useEffect(() => {
    if (chars.length === 0) {
      setColumns([]);
      return;
    }

    setColumns(
      chars.map(() => ({ leadGlyph: '0', isLocked: false, intensity: 1 }))
    );

    const intervals: NodeJS.Timeout[] = [];

    chars.forEach((targetChar, index) => {
      if (targetChar === ' ') {
        setColumns((prev) => {
          const next = [...prev];
          next[index] = { leadGlyph: ' ', isLocked: true, intensity: 1 };
          return next;
        });
        return;
      }

      let ticks = 0;
      // Staggered stream duration per letter
      const maxTicks = 12 + index * 3;
      const stepDuration = 38;

      const timer = setInterval(() => {
        ticks++;
        if (ticks >= maxTicks) {
          clearInterval(timer);
          setColumns((prev) => {
            const next = [...prev];
            next[index] = {
              leadGlyph: targetChar,
              isLocked: true,
              intensity: 1,
            };
            return next;
          });
        } else {
          const randGlyph =
            MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
          setColumns((prev) => {
            const next = [...prev];
            next[index] = {
              leadGlyph: randGlyph,
              isLocked: false,
              intensity: ticks % 2 === 0 ? 1.5 : 0.8,
            };
            return next;
          });
        }
      }, stepDuration);

      intervals.push(timer);
    });

    return () => {
      intervals.forEach((t) => clearInterval(t));
    };
  }, [chars, keySeed]);

  return (
    <span
      className={`relative inline-flex items-center flex-wrap select-none font-mono tracking-widest ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#22c55e',
        ...style,
      }}
    >
      {/* Background CRT scanline texture */}
      <span
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.8)_2px,rgba(0,0,0,0.8)_4px)]"
      />

      {columns.map((col, idx) => (
        <span
          key={idx}
          className="inline-block relative px-[1px] transition-all duration-75"
          style={{
            color: col.isLocked ? color || '#22c55e' : '#e0ffe5',
            textShadow: col.isLocked
              ? `0 0 8px ${color || '#22c55e'}, 0 0 16px ${color || '#22c55e'}80`
              : '0 0 12px #ffffff, 0 0 20px #22c55e',
            filter: `brightness(${col.intensity})`,
          }}
        >
          {col.leadGlyph === ' ' ? '\u00A0' : col.leadGlyph}
          {/* Subtle phosphor trail droplet behind cycling glyphs */}
          {!col.isLocked && (
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 -top-3 text-[0.7em] opacity-40 select-none text-emerald-400 pointer-events-none"
            >
              {MATRIX_GLYPHS[(idx * 7) % MATRIX_GLYPHS.length]}
            </span>
          )}
        </span>
      ))}
    </span>
  );
};

export const matrixRainTextEffect: TextEffectDefinition = {
  id: 'matrix_rain',
  name: 'Matrix Data Cascade',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.fontFx,
  tag: 'PRO',
  defaultColor: '#22c55e',
  defaultSample: 'SYSTEM OVERRIDE CIPHER ACCEPTED',
  description: 'Digital rain cascade of streaming hex & katakana glyphs locking sequentially into green phosphor glow.',
  component: MatrixRainTextEffectComponent,
};
