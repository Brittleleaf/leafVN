"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

const FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?/[]#*+-:';

interface FlapCellState {
  displayChar: string;
  previousChar: string;
  isFlipping: boolean;
}

export const SplitFlapTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#facc15',
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const chars = useMemo(() => [...(text || '')], [text]);
  const [cells, setCells] = useState<FlapCellState[]>(() =>
    chars.map((ch) => ({ displayChar: ch, previousChar: ch, isFlipping: false }))
  );

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, monospace`
    : 'monospace';

  useEffect(() => {
    if (chars.length === 0) {
      setCells([]);
      return;
    }

    setCells(
      chars.map(() => ({ displayChar: ' ', previousChar: ' ', isFlipping: true }))
    );

    const intervals: NodeJS.Timeout[] = [];

    chars.forEach((targetChar, index) => {
      if (targetChar === ' ') {
        setCells((prev) => {
          const next = [...prev];
          next[index] = { displayChar: ' ', previousChar: ' ', isFlipping: false };
          return next;
        });
        return;
      }

      let count = 0;
      // Staggered settling per column (left to right like real Solari split flap boards)
      const totalSteps = 10 + index * 2;
      const stepInterval = 42;

      const timer = setInterval(() => {
        count++;
        if (count >= totalSteps) {
          clearInterval(timer);
          setCells((prev) => {
            const next = [...prev];
            const prevChar = next[index]?.displayChar || ' ';
            next[index] = {
              displayChar: targetChar,
              previousChar: prevChar,
              isFlipping: false,
            };
            return next;
          });
        } else {
          const randChar =
            FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
          setCells((prev) => {
            const next = [...prev];
            const prevChar = next[index]?.displayChar || ' ';
            next[index] = {
              displayChar: randChar,
              previousChar: prevChar,
              isFlipping: true,
            };
            return next;
          });
        }
      }, stepInterval);

      intervals.push(timer);
    });

    return () => {
      intervals.forEach((t) => clearInterval(t));
    };
  }, [chars, keySeed]);

  return (
    <span
      className={`inline-flex flex-wrap items-center justify-center gap-1 select-none font-mono text-xs sm:text-sm md:text-base ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#facc15',
        ...style,
      }}
    >
      {cells.map((cell, idx) => (
        <span
          key={idx}
          className={`relative inline-flex flex-col items-center justify-center min-w-[1.3em] h-[1.7em] rounded bg-gradient-to-b from-[#181920] to-[#0c0d12] border border-[#2b2d3a] shadow-lg overflow-hidden transition-transform duration-75 ${
            cell.isFlipping
              ? 'scale-[0.98] border-amber-500/60 text-amber-200'
              : 'border-white/15'
          }`}
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.65)',
          }}
        >
          {/* Top Half of Flap Plate */}
          <span
            className="w-full flex-1 flex items-end justify-center overflow-hidden border-b border-black/80 bg-gradient-to-b from-white/10 to-transparent pb-[0.02em] leading-none"
            style={{
              textShadow: '0 -1px 2px rgba(0,0,0,0.8)',
            }}
          >
            <span className="translate-y-[45%]">
              {cell.displayChar === ' ' ? '\u00A0' : cell.displayChar}
            </span>
          </span>

          {/* Center Seam / Mechanical Hinge Bar */}
          <span className="w-full h-[1.5px] bg-black shadow-[0_1px_1px_rgba(255,255,255,0.15)] z-10" />

          {/* Bottom Half of Flap Plate */}
          <span
            className="w-full flex-1 flex items-start justify-center overflow-hidden pt-[0.02em] leading-none bg-black/30"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            <span className="-translate-y-[45%]">
              {cell.displayChar === ' ' ? '\u00A0' : cell.displayChar}
            </span>
          </span>

          {/* Side Screws/Rivets */}
          <span className="absolute left-[1.5px] top-1/2 -translate-y-1/2 w-[2px] h-[3px] rounded-full bg-white/20 pointer-events-none" />
          <span className="absolute right-[1.5px] top-1/2 -translate-y-1/2 w-[2px] h-[3px] rounded-full bg-white/20 pointer-events-none" />
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
  tag: 'PRO',
  defaultColor: '#facc15',
  defaultSample: 'FLIGHT 702 TO ARCADIA: BOARDING',
  description: 'Precision mechanical airport departure Solari split-flap with dual-leaf plate physics and center hinge.',
  component: SplitFlapTextEffectComponent,
};
