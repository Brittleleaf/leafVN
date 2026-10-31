'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// RAIN 3 SIMULATION TYPES & CONSTANTS
// ============================================================================

interface Drop3 {
  x: number; // 0 to 1 normalized
  y: number; // px from top
  speed: number;
  height: number;
  width: number;
  opacity: number;
}

interface Splash3 {
  x: number;
  y: number;
  scale: number;
  maxScale: number;
  opacity: number;
  speed: number;
}

// ============================================================================
// RAIN 3 COMPONENT (Grayscale Noir Storm + Subtle Lightning Tremor + Puddle Splashes)
// ============================================================================

export const Rain3Component: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Read configurable parameters
  const isGrayscale = params?.grayscale ?? false;
  const grayscaleAmount = typeof params?.grayscaleAmount === 'number' ? params.grayscaleAmount : isGrayscale ? 100 : 0;
  const lightningFlicker = params?.lightningFlicker ?? true;
  const splashesEnabled = params?.splashesEnabled ?? true;
  const dropDensity = typeof params?.dropDensity === 'number' ? params.dropDensity : 50;
  const fallSpeed = typeof params?.fallSpeed === 'number' ? params.fallSpeed : 1.0;

  const levelMult = intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0;
  const totalMult = levelMult * intensityMultiplier;

  // Subtle Distant Cloud Lightning Tremor Loop
  useEffect(() => {
    if (!lightningFlicker) {
      if (containerRef.current) containerRef.current.style.opacity = '1';
      return;
    }

    let isDestroyed = false;
    let timer: NodeJS.Timeout;

    const triggerThunderTremor = () => {
      if (isDestroyed || !containerRef.current) return;
      const el = containerRef.current;

      // Subtle atmospheric opacity tremor: 1.0 -> 0.88 -> 1.0 -> 0.92 -> 1.0
      el.style.opacity = '0.88';
      setTimeout(() => {
        if (isDestroyed || !el) return;
        el.style.opacity = '1.0';
        setTimeout(() => {
          if (isDestroyed || !el) return;
          el.style.opacity = '0.92';
          setTimeout(() => {
            if (isDestroyed || !el) return;
            el.style.opacity = '1.0';
          }, 40);
        }, 50);
      }, 50);

      // Schedule next subtle thunder flicker
      const nextDelay = (6 + Math.random() * 8) * 1000;
      timer = setTimeout(triggerThunderTremor, nextDelay);
    };

    const initialDelay = (1 + Math.random() * 3) * 1000;
    timer = setTimeout(triggerThunderTremor, initialDelay);

    return () => {
      isDestroyed = true;
      clearTimeout(timer);
    };
  }, [lightningFlicker]);

  // Rain Drops & Splashes Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const targetDropCount = Math.round(dropDensity * 1.5 * totalMult);
    const drops: Drop3[] = [];
    const splashes: Splash3[] = [];

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;

      drops.length = 0;
      for (let i = 0; i < targetDropCount; i++) {
        drops.push({
          x: Math.random(),
          y: Math.random() * height - height,
          speed: (14 + Math.random() * 8) * fallSpeed,
          height: 40 + Math.random() * 25,
          width: 1.2,
          opacity: 0.25 + Math.random() * 0.25,
        });
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.667, 2.5);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw & Update Splashes (Puddle ground rings)
      if (splashesEnabled) {
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.scale += sp.speed * dt;
          sp.opacity -= 0.045 * dt;

          if (sp.opacity <= 0 || sp.scale >= sp.maxScale) {
            splashes.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.scale * 10, sp.scale * 2.5, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${sp.opacity * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 2. Draw & Update Drops
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        drop.y += drop.speed * dt;

        const px = drop.x * width;
        const py = drop.y;

        // Ground splash boundary (bottom 0 to 80px)
        const groundY = height - 15 - (i % 6) * 12;

        if (py >= groundY) {
          if (splashesEnabled && splashes.length < 40 && Math.random() < 0.6) {
            splashes.push({
              x: px,
              y: groundY,
              scale: 0.1,
              maxScale: 0.7 + Math.random() * 0.4,
              opacity: 0.8,
              speed: 0.08 + Math.random() * 0.05,
            });
          }

          // Reset drop to above screen
          drop.y = -drop.height - Math.random() * 300;
          drop.x = Math.random();
          continue;
        }

        // Render Drop (1px line with rounded ends)
        if (py + drop.height > 0 && py < height) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + drop.height);
          ctx.strokeStyle = `rgba(255, 255, 255, ${drop.opacity})`;
          ctx.lineWidth = drop.width;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [dropDensity, fallSpeed, splashesEnabled, totalMult]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none transition-opacity duration-150"
    >
      {/* 1. Grayscale Desaturation Filter Layer */}
      {grayscaleAmount > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-[backdrop-filter] duration-700"
          style={{
            backdropFilter: `grayscale(${grayscaleAmount}%)`,
            WebkitBackdropFilter: `grayscale(${grayscaleAmount}%)`,
          }}
        />
      )}

      {/* 2. Drops & Splashes Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};

// ============================================================================
// RAIN 3 INSPECTOR (Editor Controls)
// ============================================================================

export const Rain3Inspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isGrayscale = params?.grayscale ?? false;
  const grayscaleAmount = typeof params?.grayscaleAmount === 'number' ? params.grayscaleAmount : isGrayscale ? 100 : 0;
  const lightningFlicker = params?.lightningFlicker ?? true;
  const splashesEnabled = params?.splashesEnabled ?? true;
  const dropDensity = typeof params?.dropDensity === 'number' ? params.dropDensity : 50;
  const fallSpeed = typeof params?.fallSpeed === 'number' ? params.fallSpeed : 1.0;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudioPreview = () => {
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio('/assets/sfx/rain.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
      playSfx?.('/assets/sfx/rain.mp3', true, 0.5);
    }
  };

  const PRESET_STYLES = [
    {
      label: 'Noir Storm',
      subtitle: '100% Grayscale + Tremor Flashes',
      patch: { grayscale: true, grayscaleAmount: 100, lightningFlicker: true, splashesEnabled: true, dropDensity: 60, fallSpeed: 1.1 },
    },
    {
      label: 'Vivid Downpour',
      subtitle: 'Full Color + Ground Splashes',
      patch: { grayscale: false, grayscaleAmount: 0, lightningFlicker: true, splashesEnabled: true, dropDensity: 70, fallSpeed: 1.0 },
    },
    {
      label: 'Misty Sepia / Muted',
      subtitle: '50% Desaturation + Calm Rain',
      patch: { grayscale: true, grayscaleAmount: 50, lightningFlicker: false, splashesEnabled: true, dropDensity: 40, fallSpeed: 0.8 },
    },
    {
      label: 'Clean Drops',
      subtitle: 'Minimalist Rain Without Tremor',
      patch: { grayscale: false, grayscaleAmount: 0, lightningFlicker: false, splashesEnabled: false, dropDensity: 35, fallSpeed: 0.9 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Rain 3 (Noir Grayscale & Splashes)</span>
        </span>
        <button
          type="button"
          onClick={toggleAudioPreview}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-slate-500/20 border-slate-400 text-slate-200'
              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          title="Toggle ambient rain audio"
        >
          <span>{isPlayingAudio ? '🔊 Rain SFX: ON' : '🔇 Rain SFX: OFF'}</span>
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Preset Profiles:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.patch)}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] hover:border-slate-400 hover:bg-slate-500/10 text-left transition-all cursor-pointer group"
            >
              <div className="text-[10px] font-bold text-[var(--text)] group-hover:text-slate-200 truncate">
                {preset.label}
              </div>
              <div className="text-[9px] font-mono text-[var(--muted2)] truncate">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CORE TOGGLES: GRAYSCALE NOIR BUTTON + LIGHTNING TREMOR + SPLASHES */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Visual Atmosphere & Effects:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* Grayscale Button (Styled like demo button with multi-tone borders) */}
          <button
            type="button"
            onClick={() => {
              const nextState = grayscaleAmount < 50;
              onChange({ grayscale: nextState, grayscaleAmount: nextState ? 100 : 0 });
            }}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
              grayscaleAmount > 0
                ? 'bg-slate-600/30 border-slate-300 text-white shadow-sm ring-1 ring-white/20'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>{grayscaleAmount > 0 ? 'GRAYSCALE' : 'COLOUR'}</span>
            <span className="text-[9px] font-mono">{grayscaleAmount}%</span>
          </button>

          {/* Lightning Tremor Toggle */}
          <button
            type="button"
            onClick={() => onChange({ lightningFlicker: !lightningFlicker })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
              lightningFlicker
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>⚡ TREMOR</span>
            <span className="text-[9px] font-mono">{lightningFlicker ? 'LIGHTNING' : 'MUTED'}</span>
          </button>

          {/* Splashes Toggle */}
          <button
            type="button"
            onClick={() => onChange({ splashesEnabled: !splashesEnabled })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
              splashesEnabled
                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>SPLASHES</span>
            <span className="text-[9px] font-mono">{splashesEnabled ? 'PUDDLES' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* SLIDER 1: GRAYSCALE INTENSITY */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Noir Grayscale Filter:</span>
            <span className="text-slate-200 font-mono font-bold">{grayscaleAmount}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0% - 100%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={grayscaleAmount}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onChange({ grayscaleAmount: val, grayscale: val > 0 });
          }}
          className="w-full accent-slate-300 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0% (Full Colour)</span>
          <span>50% (Muted)</span>
          <span>100% (Noir Grayscale)</span>
        </div>
      </div>

      {/* SLIDER 2: RAIN DENSITY (SLIDER FROM DEMO) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Raindrop Count (Slider):</span>
            <span className="text-slate-200 font-mono font-bold">{dropDensity}</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">15 - 120</span>
        </div>
        <input
          type="range"
          min={15}
          max={120}
          step={5}
          value={dropDensity}
          onChange={(e) => onChange({ dropDensity: parseInt(e.target.value, 10) })}
          className="w-full accent-slate-300 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 3: FALL SPEED */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Fall Speed:</span>
            <span className="text-slate-200 font-mono font-bold">{fallSpeed.toFixed(1)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.4× - 2.0×</span>
        </div>
        <input
          type="range"
          min={0.4}
          max={2.0}
          step={0.1}
          value={fallSpeed}
          onChange={(e) => onChange({ fallSpeed: parseFloat(e.target.value) })}
          className="w-full accent-slate-300 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const rain3Fx: ScreenFxDefinition = {
  id: 'rain_3',
  label: 'Rain 3',
  description: 'Atmospheric noir rain with grayscale filter transition, thunder tremor and puddle splash rings',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  defaultSfx: '/assets/sfx/rain.mp3',
  defaultParams: {
    grayscale: false,
    grayscaleAmount: 0,
    lightningFlicker: true,
    splashesEnabled: true,
    dropDensity: 50,
    fallSpeed: 1.0,
  },
  component: Rain3Component,
  inspector: Rain3Inspector,
};
