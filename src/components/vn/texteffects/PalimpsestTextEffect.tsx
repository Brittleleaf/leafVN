"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

interface StageMemoryEcho {
  id: number;
  x: number;
  y: number;
  scale: number;
  type: 'past' | 'future';
  opacity: number;
  blur: number;
  text: string;
}

export const PalimpsestTextEffectComponent: React.FC<TextEffectProps> = ({
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
}) => {
  const [hostEl, setHostEl] = useState<HTMLElement | null>(null);
  const [screenEchoes, setScreenEchoes] = useState<StageMemoryEcho[]>([]);
  const nextEchoId = useRef(0);
  const textContainerRef = useRef<HTMLSpanElement>(null);

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, "Cormorant Garamond", Georgia, serif`
    : '"Cormorant Garamond", Georgia, "Times New Roman", serif';

  const inkColor = color || '#ede0c8';
  const pastColor = '#c8a96e';
  const futureColor = '#7aafc8';

  // Extract clean keyword/phrase for trailing cursor echoes if text is long
  const echoWord = useMemo(() => {
    if (!text) return 'MEMORY';
    const trimmed = text.trim();
    if (trimmed.length <= 25) return trimmed;
    const words = trimmed.split(/\s+/);
    return words.slice(0, 3).join(' ');
  }, [text]);

  // Find the containing stage or preview window
  useEffect(() => {
    const el = textContainerRef.current;
    if (!el) return;

    const stage = (el.closest('[data-text-stage="true"]') ||
      el.closest('[data-stage="true"]') ||
      el.closest('.palimpsest-stage') ||
      el.parentElement) as HTMLElement | null;

    setHostEl(stage);
  }, []);

  // Stage-constrained pointer tracking: echoes only spawn and live INSIDE hostEl
  useEffect(() => {
    if (!hostEl) return;

    let lastX = -1000;
    let lastY = -1000;
    let lastTime = 0;
    let spawnCount = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = hostEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Strictly ignore events outside host stage boundaries
      if (
        mouseX < 0 ||
        mouseX > rect.width ||
        mouseY < 0 ||
        mouseY > rect.height
      ) {
        return;
      }

      const now = performance.now();
      const dx = mouseX - lastX;
      const dy = mouseY - lastY;
      const dist = Math.hypot(dx, dy);

      // Throttle spawning: require 24px movement or 90ms interval
      if (dist < 24 && now - lastTime < 90) return;

      lastX = mouseX;
      lastY = mouseY;
      lastTime = now;
      spawnCount++;

      const type: 'past' | 'future' = spawnCount % 2 === 0 ? 'past' : 'future';
      const jitterX = (Math.random() - 0.5) * 14;
      const jitterY = (Math.random() - 0.5) * 10;
      const driftX = (Math.random() - 0.5) * 24;
      const driftY = -8 - Math.random() * 16;
      const echoId = nextEchoId.current++;

      setScreenEchoes((prev) => {
        const newEcho: StageMemoryEcho = {
          id: echoId,
          x: mouseX + jitterX,
          y: mouseY + jitterY,
          scale: 0.92,
          type,
          opacity: type === 'past' ? 0.38 : 0.3,
          blur: type === 'past' ? 1.5 : 2.5,
          text: echoWord,
        };
        // Cap active echoes to 6 within stage for performance
        return [...prev.slice(-5), newEcho];
      });

      const driftRaf = requestAnimationFrame(() => {
        activeRafs.delete(driftRaf);
        const driftTimer = setTimeout(() => {
          activeTimeouts.delete(driftTimer);
          setScreenEchoes((prev) =>
            prev.map((item) =>
              item.id === echoId
                ? {
                    ...item,
                    x: item.x + driftX,
                    y: item.y + driftY,
                    scale: 1.08,
                    opacity: 0,
                    blur: item.type === 'past' ? 6 : 9,
                  }
                : item
            )
          );
        }, 30);
        activeTimeouts.add(driftTimer);
      });
      activeRafs.add(driftRaf);

      const removeTimer = setTimeout(() => {
        activeTimeouts.delete(removeTimer);
        setScreenEchoes((prev) => prev.filter((item) => item.id !== echoId));
      }, 1400);
      activeTimeouts.add(removeTimer);
    };

    const onPointerLeave = () => {
      lastX = -1000;
      lastY = -1000;
    };

    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const activeRafs = new Set<number>();

    hostEl.addEventListener('pointermove', onPointerMove, { passive: true });
    hostEl.addEventListener('pointerleave', onPointerLeave);

    return () => {
      hostEl.removeEventListener('pointermove', onPointerMove);
      hostEl.removeEventListener('pointerleave', onPointerLeave);
      activeTimeouts.forEach((t) => clearTimeout(t));
      activeTimeouts.clear();
      activeRafs.forEach((r) => cancelAnimationFrame(r));
      activeRafs.clear();
    };
  }, [hostEl, echoWord]);

  return (
    <>
      {/* 1. Stage-Constrained Echo Layer (contained strictly within the preview stage) */}
      {hostEl &&
        createPortal(
          <div
            className="vn-palimpsest-stage-echo-layer pointer-events-none select-none"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          >
            {screenEchoes.map((echo) => (
              <span
                key={echo.id}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: `translate3d(${echo.x}px, ${echo.y}px, 0) translate(-50%, -50%) scale(${echo.scale})`,
                  fontFamily: fontStyle,
                  fontSize: 'clamp(0.85rem, 1.8vw, 1.5rem)',
                  letterSpacing: '0.14em',
                  fontWeight: 300,
                  color: echo.type === 'past' ? pastColor : futureColor,
                  opacity: echo.opacity,
                  filter: `blur(${echo.blur}px)`,
                  whiteSpace: 'nowrap',
                  transition:
                    'transform 1.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.3s ease-out, filter 1.3s ease-out',
                  willChange: 'transform, opacity, filter',
                  userSelect: 'none',
                  textShadow:
                    echo.type === 'past'
                      ? '0 0 10px rgba(200, 169, 110, 0.6)'
                      : '0 0 10px rgba(122, 175, 200, 0.6)',
                }}
              >
                {echo.text}
              </span>
            ))}
          </div>,
          hostEl
        )}

      {/* 2. Anchor Word in Text Box with Layered Chromatic Past/Future Shadows */}
      <span
        ref={textContainerRef}
        key={keySeed}
        className={`relative inline-block select-none cursor-default ${className}`}
        style={{
          fontFamily: fontStyle,
          color: inkColor,
          letterSpacing: '0.14em',
          fontWeight: 300,
          animation: 'vn-palimpsest-breathe 8s ease-in-out infinite alternate',
          ...style,
        }}
      >
        {/* Ghostly "Past" Chromatic Shadow (Amber Gold shifted top-left) */}
        <span
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            color: pastColor,
            filter: 'blur(3px)',
            animation: 'vn-palimpsest-past 6s ease-in-out infinite alternate',
            transformOrigin: 'center center',
            zIndex: 0,
          }}
        >
          {text}
        </span>

        {/* Ghostly "Future" Chromatic Shadow (Ice Blue shifted bottom-right) */}
        <span
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            color: futureColor,
            filter: 'blur(4.5px)',
            animation: 'vn-palimpsest-future 7s ease-in-out infinite alternate',
            transformOrigin: 'center center',
            zIndex: 0,
          }}
        >
          {text}
        </span>

        {/* Foreground Main Inscription */}
        <span className="relative z-10">{text}</span>
      </span>
    </>
  );
};

export const palimpsestTextEffect: TextEffectDefinition = {
  id: 'palimpsest',
  name: 'Palimpsest Temporal Echo',
  category: 'cinematic',
  icon: GUI_ICONS.general.screenFx,
  tag: 'NEW',
  defaultColor: '#ede0c8',
  defaultSample: 'TIME IS A PALIMPSEST',
  description: 'Stage-constrained temporal memory ghosts trailing the pointer with past amber and future cyan chromatic layers.',
  component: PalimpsestTextEffectComponent,
};
