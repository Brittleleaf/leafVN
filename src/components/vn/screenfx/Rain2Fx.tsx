'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// RAIN 2 SIMULATION TYPES & CONSTANTS
// ============================================================================

interface HeavyDrop2 {
  r: number;
  l: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  offset: number;
  opacity: number;
}

// ============================================================================
// RAIN 2 COMPONENT (Driving Wind Rain + Lightning + Purple Atmosphere)
// ============================================================================

export const Rain2Component: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flashOverlayRef = useRef<HTMLDivElement | null>(null);

  // Read configurable parameters
  const fallSpeed = typeof params?.fallSpeed === 'number' ? params.fallSpeed : 0.7;
  const windSpeed = typeof params?.windSpeed === 'number' ? params.windSpeed : 5.0; // wind drift
  const rainWeight = typeof params?.rainWeight === 'number' ? params.rainWeight : 0.11;
  const lengthScale = typeof params?.lengthScale === 'number' ? params.lengthScale : 1.0;
  const lightningEnabled = params?.lightningEnabled ?? true;
  const lightningInterval = typeof params?.lightningInterval === 'number' ? params.lightningInterval : 9; // seconds
  const purpleEdition = params?.purpleEdition ?? true;
  const purpleIntensity = typeof params?.purpleIntensity === 'number' ? params.purpleIntensity : 0.45;

  const levelMult = intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0;
  const totalMult = levelMult * intensityMultiplier;

  // Lightning Flash State Loop
  useEffect(() => {
    if (!lightningEnabled) {
      if (flashOverlayRef.current) flashOverlayRef.current.style.opacity = '0';
      return;
    }

    let isDestroyed = false;
    let timer: NodeJS.Timeout;

    const triggerDoubleFlash = () => {
      if (isDestroyed || !flashOverlayRef.current) return;
      const el = flashOverlayRef.current;

      // First flash
      el.style.opacity = '0.9';
      setTimeout(() => {
        if (isDestroyed || !el) return;
        el.style.opacity = '0.2';
        setTimeout(() => {
          if (isDestroyed || !el) return;
          // Secondary thunder crack flash
          el.style.opacity = '1.0';
          setTimeout(() => {
            if (isDestroyed || !el) return;
            el.style.opacity = '0';
          }, 80);
        }, 60);
      }, 70);

      // Schedule next lightning
      const nextDelay = (lightningInterval * 0.7 + Math.random() * lightningInterval * 0.6) * 1000;
      timer = setTimeout(triggerDoubleFlash, nextDelay);
    };

    const initialDelay = (2 + Math.random() * 4) * 1000;
    timer = setTimeout(triggerDoubleFlash, initialDelay);

    return () => {
      isDestroyed = true;
      clearTimeout(timer);
    };
  }, [lightningEnabled, lightningInterval]);

  // Rain Drops Animation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const randomFrom = (min: number, max: number) => Math.random() * (max - min) + min;

    let drops: HeavyDrop2[] = [];

    const resetDrop = (drop: HeavyDrop2, w: number, h: number) => {
      drop.r = randomFrom(0.8, 1.6);
      drop.l = drop.r * 220 * lengthScale;
      drop.x = randomFrom(w * -0.3, w * 1.15);
      drop.y = randomFrom(h * -0.3, -50);
      drop.dx = randomFrom(windSpeed - 2.5, windSpeed + 2.5);
      drop.dy = drop.r * (95 * fallSpeed);
      drop.offset = drop.l * (drop.dx / Math.max(1, drop.dy));
      drop.opacity = drop.r * randomFrom(0.25, 0.65);
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;

      const targetDropCount = Math.round(width * rainWeight * totalMult);
      drops = [];
      for (let i = 0; i < targetDropCount; i++) {
        const d: HeavyDrop2 = { r: 1, l: 100, x: 0, y: 0, dx: 0, dy: 0, offset: 0, opacity: 0.5 };
        resetDrop(d, width, height);
        // Distribute across screen initially
        d.y = randomFrom(0, height);
        drops.push(d);
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

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];

        drop.x += drop.dx * dt;
        drop.y += drop.dy * dt;

        if (drop.y > height + 50 || drop.x > width + 100 || drop.x < -150) {
          resetDrop(drop, width, height);
          continue;
        }

        // Draw slanted rain streak with fading gradient
        ctx.save();
        const startX = drop.x;
        const startY = drop.y;
        const endX = drop.x + drop.offset;
        const endY = drop.y + drop.l;

        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.7, `rgba(235, 245, 255, ${drop.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${drop.opacity})`);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + drop.r, startY);
        ctx.lineTo(endX + drop.r, endY);
        ctx.lineTo(endX, endY);
        ctx.closePath();

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [fallSpeed, windSpeed, rainWeight, lengthScale, totalMult]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Purple Edition Atmospheric Bottom Gradient Glow */}
      {purpleEdition && purpleIntensity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `radial-gradient(180vmin at 40% 135%, hsva(280, 100%, 60%, 1) 10%, hsva(260, 100%, 30%, 0) 85%)`,
            opacity: purpleIntensity,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 2. Driving Wind Rain Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 3. Lightning Flash Strobe Overlay */}
      <div
        ref={flashOverlayRef}
        className="absolute inset-0 pointer-events-none bg-white opacity-0 transition-opacity duration-75 mix-blend-screen"
      />
    </div>
  );
};

// ============================================================================
// RAIN 2 INSPECTOR (Editor Controls)
// ============================================================================

export const Rain2Inspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fallSpeed = typeof params?.fallSpeed === 'number' ? params.fallSpeed : 0.7;
  const windSpeed = typeof params?.windSpeed === 'number' ? params.windSpeed : 5.0;
  const rainWeight = typeof params?.rainWeight === 'number' ? params.rainWeight : 0.11;
  const lengthScale = typeof params?.lengthScale === 'number' ? params.lengthScale : 1.0;
  const lightningEnabled = params?.lightningEnabled ?? true;
  const lightningInterval = typeof params?.lightningInterval === 'number' ? params.lightningInterval : 9;
  const purpleEdition = params?.purpleEdition ?? true;
  const purpleIntensity = typeof params?.purpleIntensity === 'number' ? params.purpleIntensity : 0.45;

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

  const triggerInstantLightning = () => {
    // Quick user feedback and sfx
    playSfx?.('/assets/sfx/ERROR RING.mp3', false, 0.2);
    // Temporary toggle to force trigger
    onChange({ lightningEnabled: true });
  };

  const PRESET_STYLES = [
    {
      label: 'Purple Tempest',
      subtitle: 'Purple Glow + Lightning Flashes',
      patch: { fallSpeed: 0.8, windSpeed: 6.0, rainWeight: 0.13, lengthScale: 1.1, lightningEnabled: true, purpleEdition: true, purpleIntensity: 0.5 },
    },
    {
      label: 'Heavy Gale',
      subtitle: 'Driving Wind Rain & Storm',
      patch: { fallSpeed: 1.2, windSpeed: 9.0, rainWeight: 0.16, lengthScale: 1.3, lightningEnabled: true, purpleEdition: false, purpleIntensity: 0 },
    },
    {
      label: 'Calm Rain',
      subtitle: 'Vertical Gentle Downpour',
      patch: { fallSpeed: 0.5, windSpeed: 1.0, rainWeight: 0.08, lengthScale: 0.8, lightningEnabled: false, purpleEdition: false, purpleIntensity: 0 },
    },
    {
      label: 'Purple Edition Only',
      subtitle: 'Atmospheric Violet Rain Glow',
      patch: { fallSpeed: 0.65, windSpeed: 4.0, rainWeight: 0.10, lengthScale: 1.0, lightningEnabled: false, purpleEdition: true, purpleIntensity: 0.65 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Rain 2 (Driving Wind Rain & Lightning)</span>
        </span>
        <button
          type="button"
          onClick={toggleAudioPreview}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300'
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
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] hover:border-fuchsia-400 hover:bg-fuchsia-500/10 text-left transition-all cursor-pointer group"
            >
              <div className="text-[10px] font-bold text-[var(--text)] group-hover:text-fuchsia-300 truncate">
                {preset.label}
              </div>
              <div className="text-[9px] font-mono text-[var(--muted2)] truncate">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* TOGGLES: LIGHTNING & PURPLE EDITION */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Atmosphere & Lightning Systems:
        </span>
        <div className="grid grid-cols-2 gap-2">
          {/* Lightning Toggle */}
          <button
            type="button"
            onClick={() => onChange({ lightningEnabled: !lightningEnabled })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
              lightningEnabled
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>⚡ LIGHTNING</span>
            <span className="text-[9px] font-mono">{lightningEnabled ? 'ACTIVE FLASH' : 'OFF'}</span>
          </button>

          {/* Purple Edition Toggle */}
          <button
            type="button"
            onClick={() => onChange({ purpleEdition: !purpleEdition })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
              purpleEdition
                ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>🔮 PURPLE EDITION</span>
            <span className="text-[9px] font-mono">{purpleEdition ? 'BOTTOM GLOW' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* SLIDER 1: WIND DRIFT & SLANT */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Wind Speed (Slant):</span>
            <span className="text-fuchsia-300 font-mono font-bold">{windSpeed.toFixed(1)}</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">-12.0 to +12.0</span>
        </div>
        <input
          type="range"
          min={-12.0}
          max={12.0}
          step={0.5}
          value={windSpeed}
          onChange={(e) => onChange({ windSpeed: parseFloat(e.target.value) })}
          className="w-full accent-fuchsia-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>-12 (Hard Left)</span>
          <span>0 (Vertical)</span>
          <span>+12 (Hard Right)</span>
        </div>
      </div>

      {/* SLIDER 2: FALL SPEED */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Fall Velocity:</span>
            <span className="text-fuchsia-300 font-mono font-bold">{fallSpeed.toFixed(2)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.3× - 2.0×</span>
        </div>
        <input
          type="range"
          min={0.3}
          max={2.0}
          step={0.05}
          value={fallSpeed}
          onChange={(e) => onChange({ fallSpeed: parseFloat(e.target.value) })}
          className="w-full accent-fuchsia-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 3: STREAK LENGTH */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Rain Streak Length:</span>
            <span className="text-fuchsia-300 font-mono font-bold">{lengthScale.toFixed(2)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.4× - 2.0×</span>
        </div>
        <input
          type="range"
          min={0.4}
          max={2.0}
          step={0.1}
          value={lengthScale}
          onChange={(e) => onChange({ lengthScale: parseFloat(e.target.value) })}
          className="w-full accent-fuchsia-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 4: LIGHTNING FREQUENCY (If Enabled) */}
      {lightningEnabled && (
        <div className="space-y-1.5 pt-1.5 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
              <span>Lightning Interval:</span>
              <span className="text-amber-300 font-mono font-bold">~{lightningInterval}s</span>
            </span>
            <button
              type="button"
              onClick={triggerInstantLightning}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 cursor-pointer"
            >
              ⚡ Flash Now
            </button>
          </div>
          <input
            type="range"
            min={4}
            max={20}
            step={1}
            value={lightningInterval}
            onChange={(e) => onChange({ lightningInterval: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      )}

      {/* SLIDER 5: PURPLE INTENSITY (If Enabled) */}
      {purpleEdition && (
        <div className="space-y-1.5 pt-1.5 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
              <span>Purple Glow Opacity:</span>
              <span className="text-fuchsia-300 font-mono font-bold">{Math.round(purpleIntensity * 100)}%</span>
            </span>
            <span className="font-mono text-[9px] text-[var(--muted2)]">10% - 100%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={purpleIntensity}
            onChange={(e) => onChange({ purpleIntensity: parseFloat(e.target.value) })}
            className="w-full accent-fuchsia-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const rain2Fx: ScreenFxDefinition = {
  id: 'rain_2',
  label: 'Rain 2',
  description: 'Heavy driving wind-blown rain with thunder lightning flashes and purple atmospheric night glow',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30',
  defaultSfx: '/assets/sfx/rain.mp3',
  defaultParams: {
    fallSpeed: 0.7,
    windSpeed: 5.0,
    rainWeight: 0.11,
    lengthScale: 1.0,
    lightningEnabled: true,
    lightningInterval: 9,
    purpleEdition: true,
    purpleIntensity: 0.45,
  },
  component: Rain2Component,
  inspector: Rain2Inspector,
};
