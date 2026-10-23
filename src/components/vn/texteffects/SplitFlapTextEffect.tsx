"use client";
import React, { useEffect, useState } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

const FLAP_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?/[]#*+-:';

interface FlapCellState {
  displayChar: string;
  isFlipping: boolean;
}

export const SplitFlapTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const [cells, setCells] = useState<FlapCellState[]>(() =>
    [...(text || '')].map((ch) => ({ displayChar: ch, isFlipping: false }))
  );

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, monospace`
    : 'monospace';

  useEffect(() => {
    const chars = [...(text || '')];
    if (chars.length === 0) {
      setCells([]);
      return;
    }

    setCells(chars.map(() => ({ displayChar: ' ', isFlipping: true })));

    const intervals: NodeJS.Timeout[] = [];

    chars.forEach((targetChar, index) => {
      if (targetChar === ' ') {
        setCells((prev) => {
          const next = [...prev];
          next[index] = { displayChar: ' ', isFlipping: false };
          return next;
        });
        return;
      }

      let count = 0;
      const totalSteps = 8 + (index % 6) * 2;
      const stepDuration = 45 + Math.min(index * 4, 30);

      const interval = setInterval(() => {
        count++;
        if (count >= totalSteps) {
          clearInterval(interval);
          setCells((prev) => {
            const next = [...prev];
            next[index] = { displayChar: targetChar, isFlipping: false };
            return next;
          });
        } else {
          const randChar = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
          setCells((prev) => {
            const next = [...prev];
            next[index] = { displayChar: randChar, isFlipping: true };
            return next;
          });
        }
      }, stepDuration);

      intervals.push(interval);
    });

    return () => {
      intervals.forEach((t) => clearInterval(t));
    };
  }, [text, keySeed]);

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1 select-none font-mono ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#facc15',
        ...style,
      }}
    >
      {cells.map((cell, idx) => (
        <span
          key={idx}
          className={`relative inline-flex items-center justify-center min-w-[1.25em] h-[1.5em] px-1 rounded-sm bg-[#111116] border border-white/15 shadow-inner transition-transform duration-75 ${
            cell.isFlipping ? 'scale-95 border-amber-400/50 text-amber-300' : 'text-inherit'
          }`}
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {/* Center split seam representing mechanical split flap flap plates */}
          <span className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 pointer-events-none z-10" />
          <span className="relative z-0 leading-none">
            {cell.displayChar === ' ' ? '\u00A0' : cell.displayChar}
          </span>
        </span>
      ))}
    </span>
  );
};

export const splitFlapTextEffect: TextEffectDefinition = {
  id: 'split_flap',
  name: 'Split-Flap Board',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.fontFx,
  tag: 'NEW',
  defaultColor: '#facc15',
  defaultSample: 'FLIGHT 702 TO ARCADIA: BOARDING',
  description: 'Vintage mechanical airport departure split-flap cycling characters into locked alignment.',
  component: SplitFlapTextEffectComponent,
};
