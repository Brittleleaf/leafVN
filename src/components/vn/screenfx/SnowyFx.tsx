'use client';

import React, { useEffect, useRef } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// SNOWY PRESETS & DATA TYPES
// ============================================================================

export type SnowPreset = 'flurries' | 'winter' | 'blizzard' | 'magical' | 'custom';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  windFactor: number;
  swayFreq: number;
  swayAmp: number;
  swayPhase: number;
  opacity: number;
  layer: 'fg' | 'mg' | 'bg';
}

export const SNOW_PRESETS: Record<
  Exclude<SnowPreset, 'custom'>,
  {
    label: string;
    description: string;
    icon: string;
    params: {
      count: number;
      speed: number;
      wind: number;
      sway: number;
      minRadius: number;
      maxRadius: number;
      frostStrength: number;
      color: string;
    };
  }
> = {
  flurries: {
    label: 'Gentle Flurries',
    description: 'Light, peaceful falling snow with gentle drifting breeze.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      count: 75,
      speed: 0.8,
      wind: 0.8,
      sway: 1.2,
      minRadius: 0.8,
      maxRadius: 2.5,
      frostStrength: 0,
      color: '#ffffff',
    },
  },
  winter: {
    label: 'Winter Snowfall',
    description: 'Classic steady snowfall with multi-depth flakes and soft atmosphere.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      count: 160,
      speed: 1.2,
      wind: 1.4,
      sway: 1.6,
      minRadius: 1.0,
      maxRadius: 3.8,
      frostStrength: 0.3,
      color: '#ffffff',
    },
  },
  blizzard: {
    label: 'Blizzard / Storm',
    description: 'Heavy snowstorm with driving winds, rapid streaks, and icy perimeter frost.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      count: 320,
      speed: 2.4,
      wind: -3.5,
      sway: 0.8,
      minRadius: 1.2,
      maxRadius: 4.8,
      frostStrength: 0.75,
      color: '#e8f4fc',
    },
  },
  magical: {
    label: 'Magical Twilight',
    description: 'Slow-motion glowing snowflakes floating with dreamlike flutter.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      count: 110,
      speed: 0.6,
      wind: 0.4,
      sway: 2.4,
      minRadius: 1.2,
      maxRadius: 4.5,
      frostStrength: 0.2,
      color: '#d0f0ff',
    },
  },
};

// ============================================================================
// SNOWY COMPONENT (HTML5 Canvas Multi-Layer Snow Simulation)
// ============================================================================

export const SnowyComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read configurable parameters
  const levelMult = intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.5 : 1.0;
  const effectiveMultiplier = (params?.intensityMultiplier ?? 1.0) * levelMult * intensityMultiplier;

  const count = Math.max(10, Math.round((params?.count ?? 150) * effectiveMultiplier));
  const speedMult = Math.max(0.1, (params?.speed ?? 1.2) * (intensity === 'light' ? 0.8 : intensity === 'heavy' ? 1.3 : 1.0));
  const windVal = typeof params?.wind === 'number' ? params.wind : 1.2;
  const swayVal = typeof params?.sway === 'number' ? params.sway : 1.5;
  const minRadius = Math.max(0.3, params?.minRadius ?? 0.8);
  const maxRadius = Math.max(minRadius + 0.5, params?.maxRadius ?? 3.8);
  const frostStrength = Math.max(0, Math.min(1, params?.frostStrength ?? 0.25));
  const snowColor = params?.color || color || '#ffffff';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    // Helper to spawn or reset a snowflake
    const createFlake = (initialY = -1): Snowflake => {
      const randLayer = Math.random();
      let layer: 'fg' | 'mg' | 'bg' = 'mg';
      let r = minRadius + Math.random() * (maxRadius - minRadius);
      let op = 0.75;
      let sp = 1.0;

      if (randLayer < 0.25) {
        // Foreground (large, fast, prominent)
        layer = 'fg';
        r = Math.max(r, (minRadius + maxRadius) * 0.65);
        op = 0.85 + Math.random() * 0.15;
        sp = 1.3 + Math.random() * 0.5;
      } else if (randLayer < 0.7) {
        // Midground (standard)
        layer = 'mg';
        op = 0.6 + Math.random() * 0.25;
        sp = 0.9 + Math.random() * 0.3;
      } else {
        // Background (tiny, slow, soft depth)
        layer = 'bg';
        r = Math.min(r, (minRadius + maxRadius) * 0.45);
        op = 0.25 + Math.random() * 0.25;
        sp = 0.6 + Math.random() * 0.3;
      }

      return {
        x: Math.random() * (width || window.innerWidth),
        y: initialY >= 0 ? initialY : Math.random() * (height || window.innerHeight),
        radius: r,
        speed: sp,
        windFactor: 0.7 + Math.random() * 0.6,
        swayFreq: 1.0 + Math.random() * 1.8,
        swayAmp: (0.8 + Math.random() * 1.5) * swayVal,
        swayPhase: Math.random() * Math.PI * 2,
        opacity: op,
        layer,
      };
    };

    const flakes: Snowflake[] = [];
    for (let i = 0; i < count; i++) {
      flakes.push(createFlake(Math.random() * (height || window.innerHeight)));
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.667, 2.5);
      lastTime = time;
      const elapsedSeconds = time / 1000;

      ctx.clearRect(0, 0, width, height);

      // Parse snowColor hex or rgb to rgba
      const baseRgb = snowColor.startsWith('#')
        ? (() => {
            let c = snowColor.substring(1);
            if (c.length === 3) c = c.split('').map((x: string) => x + x).join('');
            const num = parseInt(c, 16);
            return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
          })()
        : '255, 255, 255';

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];

        // 1. Fluttering lateral sway + wind
        const lateralSway = Math.sin(elapsedSeconds * f.swayFreq + f.swayPhase) * f.swayAmp;
        f.x += (windVal * f.windFactor + lateralSway) * dt;

        // 2. Downward movement
        f.y += f.speed * speedMult * 1.6 * dt;

        // 3. Horizontal edge wrapping
        if (f.x > width + 25) {
          f.x = -25;
        } else if (f.x < -25) {
          f.x = width + 25;
        }

        // 4. Vertical reset to top
        if (f.y > height + 15) {
          f.y = -10;
          f.x = Math.random() * width;
        }

        // 5. Drawing the snowflake
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);

        if (f.layer === 'fg' && f.radius > 2.8) {
          // Soft radial glow for large foreground flakes
          const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 1.8);
          grad.addColorStop(0, `rgba(${baseRgb}, ${f.opacity})`);
          grad.addColorStop(0.6, `rgba(${baseRgb}, ${f.opacity * 0.7})`);
          grad.addColorStop(1, `rgba(${baseRgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius * 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${baseRgb}, ${f.opacity})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [count, speedMult, windVal, swayVal, minRadius, maxRadius, snowColor]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Optional Frosty Winter Border Vignette */}
      {frostStrength > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            opacity: frostStrength,
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(195, 230, 255, 0.08) 80%, rgba(220, 242, 255, 0.32) 100%)',
            boxShadow: 'inset 0 0 80px rgba(185, 225, 255, 0.25)',
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// SNOWY INSPECTOR
// ============================================================================

export const SnowyInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  playSfx,
}) => {
  const currentPreset = (params?.preset as SnowPreset) || 'winter';
  const currentMultiplier = params?.intensityMultiplier ?? 1.0;
  const count = params?.count ?? 160;
  const speed = params?.speed ?? 1.2;
  const wind = params?.wind ?? 1.4;
  const sway = params?.sway ?? 1.6;
  const minRadius = params?.minRadius ?? 1.0;
  const maxRadius = params?.maxRadius ?? 3.8;
  const frostStrength = params?.frostStrength ?? 0.3;
  const currentColor = params?.color || color || '#ffffff';

  const applyPreset = (presetKey: Exclude<SnowPreset, 'custom'>) => {
    const p = SNOW_PRESETS[presetKey];
    if (!p) return;
    onChange({
      preset: presetKey,
      ...p.params,
    });
    if (onColorChange) {
      onColorChange(p.params.color);
    }
    if (playSfx) {
      playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    }
  };

  const PRESET_COLORS = [
    { label: 'Pure White', hex: '#ffffff' },
    { label: 'Crystal Ice', hex: '#d0f0ff' },
    { label: 'Glacier Blue', hex: '#a5d8ff' },
    { label: 'Golden Sunset', hex: '#ffe8b3' },
    { label: 'Amethyst Night', hex: '#eed9ff' },
  ];

  return (
    <div className="space-y-4 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={15} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Snowy Simulation
            </h4>
            <p className="text-[10px] text-[var(--muted)]">
              Multi-layer falling snowflakes, realistic lateral wind sway & frost vignette
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 font-bold uppercase">
          Canvas 60FPS
        </span>
      </div>

      {/* 2. Presets Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
          Snowfall Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(SNOW_PRESETS) as Array<Exclude<SnowPreset, 'custom'>>).map((key) => {
            const p = SNOW_PRESETS[key];
            const isSelected = currentPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm shadow-sky-500/20'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--muted2)]'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <GuiIconRenderer icon={p.icon} size={12} className={isSelected ? 'text-sky-300' : 'text-[var(--muted)]'} />
                  <span className="text-[11px] font-bold truncate">{p.label}</span>
                </div>
                <span className="text-[9px] text-[var(--muted)] line-clamp-1 mt-0.5 leading-tight">
                  {p.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Intensity Multiplier & Flake Density */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Intensity:</span>
            <span className="font-mono text-sky-300 font-bold">{Math.round(currentMultiplier * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={currentMultiplier}
            onChange={(e) => onChange({ preset: 'custom', intensityMultiplier: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Particle Count:</span>
            <span className="font-mono text-sky-300 font-bold">{count}</span>
          </div>
          <input
            type="range"
            min={20}
            max={400}
            step={10}
            value={count}
            onChange={(e) => onChange({ preset: 'custom', count: parseInt(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 4. Wind & Fall Speed */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Fall Speed:</span>
            <span className="font-mono text-sky-300 font-bold">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3.5}
            step={0.1}
            value={speed}
            onChange={(e) => onChange({ preset: 'custom', speed: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Wind Direction:</span>
            <span className="font-mono text-sky-300 font-bold">
              {wind > 0 ? `+${wind.toFixed(1)} (Right)` : wind < 0 ? `${wind.toFixed(1)} (Left)` : '0.0 (Calm)'}
            </span>
          </div>
          <input
            type="range"
            min={-5.0}
            max={5.0}
            step={0.2}
            value={wind}
            onChange={(e) => onChange({ preset: 'custom', wind: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 5. Flake Size & Sway Turbulence */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Flutter Sway:</span>
            <span className="font-mono text-sky-300 font-bold">{sway.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={4.0}
            step={0.2}
            value={sway}
            onChange={(e) => onChange({ preset: 'custom', sway: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Max Flake Size:</span>
            <span className="font-mono text-sky-300 font-bold">{maxRadius.toFixed(1)}px</span>
          </div>
          <input
            type="range"
            min={2.0}
            max={6.0}
            step={0.2}
            value={maxRadius}
            onChange={(e) => onChange({ preset: 'custom', maxRadius: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 6. Frost Vignette & Color Palette */}
      <div className="space-y-2 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Frost Perimeter Vignette:</span>
            <span className="font-mono text-sky-300 font-bold">{Math.round(frostStrength * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={frostStrength}
            onChange={(e) => onChange({ preset: 'custom', frostStrength: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        {/* Snowflake Tint */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Snowflake Color Tint:</span>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
                style={{ backgroundColor: currentColor }}
              />
              <span className="font-mono text-sky-300 font-bold text-[10px]">{currentColor}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  onChange({ preset: 'custom', color: c.hex });
                  if (onColorChange) onColorChange(c.hex);
                }}
                className={`flex-1 py-1 px-1.5 rounded text-[9px] font-mono border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currentColor.toLowerCase() === c.hex.toLowerCase()
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} />
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SNOWY SCREEN FX REGISTRATION DEFINITION
// ============================================================================

export const snowyFx: ScreenFxDefinition = {
  id: 'snowy',
  label: 'Snowy',
  description: 'Atmospheric falling snow with multi-depth particles, fluttering wind drift, and optional frost vignette.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-sky-500 bg-sky-950/80 text-sky-200',
  defaultParams: {
    preset: 'winter',
    count: 160,
    speed: 1.2,
    wind: 1.4,
    sway: 1.6,
    minRadius: 1.0,
    maxRadius: 3.8,
    frostStrength: 0.3,
    color: '#ffffff',
    intensityMultiplier: 1.0,
  },
  component: SnowyComponent,
  inspector: SnowyInspector,
};
