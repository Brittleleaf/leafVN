"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TextEffectProps, TextEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

interface ScreenMemoryEcho {
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
  const [mounted, setMounted] = useState(false);
  const [screenEchoes, setScreenEchoes] = useState<ScreenMemoryEcho[]>([]);
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
    if (!text) return 'MEMORIA';
    const trimmed = text.trim();
    if (trimmed.length <= 25) return trimmed;
    const words = trimmed.split(/\s+/);
    return words.slice(0, 3).join(' ');
  }, [text]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Full-screen mouse tracking & trailing echo generation across the entire viewport
  useEffect(() => {
    if (!mounted) return;

    let lastX = -1000;
    let lastY = -1000;
    let lastTime = 0;
    let spawnCount = 0;

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);

      // Throttle spawning: require 32px movement or 85ms interval to keep GPU buttery smooth
      if (dist < 32 && now - lastTime < 85) return;

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
      spawnCount++;

      const type: 'past' | 'future' = spawnCount % 2 === 0 ? 'past' : 'future';
      const jitterX = (Math.random() - 0.5) * 16;
      const jitterY = (Math.random() - 0.5) * 12;
      const driftX = (Math.random() - 0.5) * 36;
      const driftY = -12 - Math.random() * 20; // gentle ethereal float upwards
      const echoId = nextEchoId.current++;

      // Spawn new temporal echo behind the cursor anywhere on screen
      setScreenEchoes((prev) => {
        const newEcho: ScreenMemoryEcho = {
          id: echoId,
          x: e.clientX + jitterX,
          y: e.clientY + jitterY,
          scale: 0.95,
          type,
          opacity: type === 'past' ? 0.32 : 0.24,
          blur: type === 'past' ? 1.5 : 2.5,
          text: echoWord,
        };
        // Cap max active screen echoes to 10 for performance
        return [...prev.slice(-9), newEcho];
      });

      // Trigger drift, scale up and fade out to temporal mist
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
                    scale: 1.1,
                    opacity: 0,
                    blur: item.type === 'past' ? 7 : 10,
                  }
                : item
            )
          );
        }, 30);
        activeTimeouts.add(driftTimer);
      });
      activeRafs.add(driftRaf);

      // Remove after transition finishes
      const removeTimer = setTimeout(() => {
        activeTimeouts.delete(removeTimer);
        setScreenEchoes((prev) => prev.filter((item) => item.id !== echoId));
      }, 1600);
      activeTimeouts.add(removeTimer);
    };

    const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const activeRafs = new Set<number>();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      activeTimeouts.forEach((t) => clearTimeout(t));
      activeTimeouts.clear();
      activeRafs.forEach((r) => cancelAnimationFrame(r));
      activeRafs.clear();
    };
  }, [mounted, echoWord]);

  return (
    <>
      {/* 1. Global Viewport Echo Layer (renders directly in body to follow cursor across the whole screen) */}
      {mounted &&
        createPortal(
          <div
            className="vn-palimpsest-global-echo-layer pointer-events-none select-none"
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              overflow: 'hidden',
              pointerEvents: 'none',
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
                  fontSize: 'clamp(1.2rem, 3.2vw, 3rem)',
                  letterSpacing: '0.16em',
                  fontWeight: 300,
                  color: echo.type === 'past' ? pastColor : futureColor,
                  opacity: echo.opacity,
                  filter: `blur(${echo.blur}px)`,
                  whiteSpace: 'nowrap',
                  transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.5s ease-out, filter 1.5s ease-out',
                  willChange: 'transform, opacity, filter',
                  userSelect: 'none',
                  textShadow: echo.type === 'past' ? '0 0 12px rgba(200, 169, 110, 0.6)' : '0 0 12px rgba(122, 175, 200, 0.6)',
                }}
              >
                {echo.text}
              </span>
            ))}
          </div>,
          document.body
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
  icon: GUI_ICONS.state.backwardTime,
  tag: 'NEW',
  defaultColor: '#ede0c8',
  defaultSample: 'BEFORE ◆ AFTER',
  description: 'Full-screen temporal memory ghosts trailing the mouse pointer across the entire screen, with past amber & future cyan chromatic layers.',
  component: PalimpsestTextEffectComponent,
};
