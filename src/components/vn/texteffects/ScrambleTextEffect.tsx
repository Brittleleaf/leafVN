"use client";
import React, { useEffect, useRef } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';

export const ScrambleTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const frameRequestRef = useRef<number | null>(null);
  const oldTextRef = useRef<string>('');

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, monospace`
    : 'monospace';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    oldTextRef.current = '';
    const oldText = '';
    const newText = text || '';
    const length = Math.max(oldText.length, newText.length);
    
    interface QueueItem {
      from: string;
      to: string;
      start: number;
      end: number;
      char?: string;
    }

    const queue: QueueItem[] = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 30);
      const end = start + Math.floor(Math.random() * 30);
      queue.push({ from, to, start, end });
    }

    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
    }

    let frame = 0;

    const randomChar = () => {
      return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    };

    const dudColor = color ? color : '#9ca3af';

    let isMounted = true;

    const update = () => {
      if (!isMounted || !containerRef.current) return;
      let output = '';
      let complete = 0;

      for (let i = 0, n = queue.length; i < n; i++) {
        let { from, to, start, end, char } = queue[i];
        if (frame >= end) {
          complete++;
          output += to === ' ' ? '&nbsp;' : to;
        } else if (frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = randomChar();
            queue[i].char = char;
          }
          const displayChar = char === ' ' ? '&nbsp;' : char;
          output += `<span style="opacity: 0.45; color: ${dudColor};">${displayChar}</span>`;
        } else {
          output += from === ' ' ? '&nbsp;' : from;
        }
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = output;
      }

      if (complete === queue.length) {
        oldTextRef.current = newText;
      } else if (isMounted) {
        frame++;
        frameRequestRef.current = requestAnimationFrame(update);
      }
    };

    update();

    return () => {
      isMounted = false;
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = null;
      }
    };
  }, [text, keySeed, color]);

  return (
    <span
      key={keySeed}
      ref={containerRef}
      className={`inline-block font-mono tracking-wider select-none ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#FAFAFA',
        textShadow: color ? `0 0 12px ${color}40` : '0 0 12px rgba(250, 250, 250, 0.2)',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

export const scrambleTextEffect: TextEffectDefinition = {
  id: 'scramble',
  name: 'Cipher Scramble',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.fontFx,
  tag: 'NEW',
  defaultColor: '#38bdf8',
  defaultSample: 'REALITY IS A SIMULATION',
  description: 'Cryptographic symbol scramble resolving into clean decrypted plaintext.',
  component: ScrambleTextEffectComponent,
};
