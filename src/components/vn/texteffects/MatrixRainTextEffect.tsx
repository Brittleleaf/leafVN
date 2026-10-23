"use client";
import React, { useEffect, useRef } from 'react';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

const MATRIX_CHARS = '0123456789ABCDEF$#@%&*+-/<>[]{}アイウエオカキクケコサシスセソタチツテト';

export const MatrixRainTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color = '#22c55e',
  className = '',
  style = {},
  keySeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const targetWord = (text || 'SIGNAL').toUpperCase();
    const fontSize = 16;
    const cols = Math.max(12, Math.floor(canvas.width / fontSize));

    // Array of drops per column (starting at negative offsets)
    const drops = new Array(cols).fill(0).map(() => -Math.floor(Math.random() * 20));
    
    // Setup target locked letters in the center row
    const locked: Array<{ char: string; row: number; done: boolean } | null> = new Array(cols).fill(null);
    const startCol = Math.max(0, Math.floor(cols / 2 - targetWord.length / 2));
    const targetRow = Math.floor(canvas.height / (fontSize * 2));

    for (let i = 0; i < targetWord.length; i++) {
      const c = startCol + i;
      if (c >= 0 && c < cols) {
        locked[c] = { char: targetWord[i], row: targetRow, done: false };
      }
    }

    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let frameCount = 0;

    const render = () => {
      frameCount++;
      // Render semi-transparent dark trail
      ctx.fillStyle = 'rgba(5, 7, 10, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let c = 0; c < cols; c++) {
        const x = c * fontSize;
        const target = locked[c];

        if (target && drops[c] >= target.row) {
          // Locked target character in bright highlight
          ctx.fillStyle = color || '#22c55e';
          ctx.shadowColor = color || '#22c55e';
          ctx.shadowBlur = 10;
          ctx.fillText(target.char, x, target.row * fontSize);
          ctx.shadowBlur = 0;
          target.done = true;
        } else {
          // Falling random matrix rain stream
          const ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          // Top character bright white, trail green
          ctx.fillStyle = frameCount % 2 === 0 ? '#dcfce7' : color || '#22c55e';
          ctx.shadowBlur = 4;
          ctx.shadowColor = color || '#22c55e';
          ctx.fillText(ch, x, drops[c] * fontSize);
          ctx.shadowBlur = 0;

          drops[c]++;
          if (drops[c] * fontSize > canvas.height && Math.random() > 0.96) {
            drops[c] = 0;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, color, keySeed]);

  return (
    <div
      key={keySeed}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-black/90 border border-emerald-950/60 shadow-inner ${className}`}
      style={{
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={360}
        height={110}
        className="w-full max-w-[360px] h-[110px] block"
      />
    </div>
  );
};

export const matrixRainTextEffect: TextEffectDefinition = {
  id: 'matrix_rain',
  name: 'Matrix Data Cascade',
  category: 'cyberpunk',
  icon: GUI_ICONS.general.fontFx,
  tag: 'NEW',
  defaultColor: '#22c55e',
  defaultSample: 'SYSTEM REBOOT OVERRIDE ACCEPTED',
  description: 'Digital rain of stream glyphs that cascades down and locks into target characters.',
  component: MatrixRainTextEffectComponent,
};
