"use client";
import React, { useState, useEffect } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const TypewriterTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
  progress,
}) => {
  const [displayedLength, setDisplayedLength] = useState<number>(0);

  // If progress is provided (cinematic timeline scrubbing/playback), compute displayed length directly
  const hasTimelineProgress = progress !== undefined;
  const activeLength = hasTimelineProgress
    ? Math.max(0, Math.min(text.length, Math.round(progress * text.length)))
    : displayedLength;

  useEffect(() => {
    if (hasTimelineProgress) return;
    setDisplayedLength(0);
    if (!text) return;

    let current = 0;
    const interval = setInterval(() => {
      current++;
      setDisplayedLength(current);
      if (current >= text.length) {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [text, keySeed, hasTimelineProgress]);

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, monospace`
    : 'monospace';

  const displayedText = text.slice(0, activeLength);

  return (
    <span
      key={keySeed}
      className={`inline-block font-mono tracking-wider ${className}`}
      style={{
        fontFamily: fontStyle,
        color: color || '#38bdf8',
        textShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
        ...style,
      }}
    >
      {displayedText}
      <span className="animate-pulse ml-0.5 text-cyan-400 font-bold">_</span>
    </span>
  );
};

export const typewriterTextEffect: TextEffectDefinition = {
  id: 'typewriter',
  name: 'Vintage Typewriter',
  category: 'ambient',
  icon: GUI_ICONS.general.texts,
  defaultColor: '#38bdf8',
  defaultSample: 'RECORDING ENTRY INTO LOG...',
  description: 'Tactile character-by-character reveal with blinking terminal command cursor.',
  component: TypewriterTextEffectComponent,
};
