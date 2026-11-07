'use client';

import React, { useEffect, useRef } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// SNOWY 2 PRESETS & DATA TYPES (Ethereal Bokeh Radial Gradient Snow)
// ============================================================================

export type Snowy2Preset = 'bokeh_dream' | 'twilight_midnight' | 'gentle_crystals' | 'dense_blizzard' | 'custom';

interface BokehFlake {
  x: number;
  y: number;
  t: number; // phase angle
  sz: number; // radius size
  sp: number; // fall speed
  oscFreq: number;
  alphaMult: number;
}

export const SNOWY2_PRESETS: Record<
  Exclude<Snowy2Preset, 'custom'>,
  {
    label: string;
    description: string;
    icon: string;
    params: {
      num: number;
      scale: number;
      speed: number;
      sway: number;
      minSpeed: number;
      nightTint: number;
      color: string;
    };
  }
> = {
  bokeh_dream: {
    label: 'Bokeh Dream',
    description: '450 soft glowing radial gradient light orbs with floating harmonic drift.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      num: 450,
      scale: 1.4,
      speed: 1.0,
      sway: 1.0,
      minSpeed: 0.8,
      nightTint: 0.25,
      color: '#ffffff',
    },
  },
  twilight_midnight: {
    label: 'Twilight Midnight',
    description: 'Deep indigo atmospheric night wash with luminous falling bokeh spheres.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      num: 550,
      scale: 1.3,
      speed: 1.1,
      sway: 1.2,
      minSpeed: 1.0,
      nightTint: 0.55,
      color: '#e8f4fc',
    },
  },
  gentle_crystals: {
    label: 'Gentle Crystals',
    description: 'Low-density ethereal crystalline dust floating slowly in zero gravity.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      num: 240,
      scale: 1.1,
      speed: 0.6,
      sway: 1.5,
      minSpeed: 0.5,
      nightTint: 0.1,
      color: '#d6f0ff',
    },
  },
  dense_blizzard: {
    label: 'Dense Bokeh Storm',
    description: 'High-density 750 luminous particles with rapid quadratic falling physics.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      num: 750,
      scale: 1.5,
      speed: 1.8,
      sway: 0.8,
      minSpeed: 1.2,
      nightTint: 0.35,
      color: '#ffffff',
    },
  },
};

// ============================================================================
// SNOWY 2 COMPONENT
// ============================================================================

export const Snowy2Component: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read configurable parameters
  const levelMult = intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0;
  const effectiveMultiplier = (params?.intensityMultiplier ?? 1.0) * levelMult * intensityMultiplier;

  const rawNum = params?.num ?? 500;
  const num = Math.max(50, Math.min(1000, Math.round(rawNum * effectiveMultiplier)));
  const scale = Math.max(0.4, (params?.scale ?? 1.3));
  const speedMult = Math.max(0.1, (params?.speed ?? 1.0) * (intensity === 'light' ? 0.8 : intensity === 'heavy' ? 1.3 : 1.0));
  const swayMult = Math.max(0, (params?.sway ?? 1.0));
  const minSpeed = Math.max(0.2, (params?.minSpeed ?? 1.0));
  const nightTint = Math.max(0, Math.min(0.9, params?.nightTint ?? 0.25));
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

    // Parse base RGB for gradients
    const baseRgb = snowColor.startsWith('#')
      ? (() => {
          let c = snowColor.substring(1);
          if (c.length === 3) c = c.split('').map((x: string) => x + x).join('');
          const n = parseInt(c, 16);
          return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
        })()
      : '255, 255, 255';

    // Helper to generate a bokeh snowflake matching the author's mathematical formula
    const createFlake = (initialY = -1): BokehFlake => {
      // Long-tail inverse distribution formula:
      // snow.sz = (100 / (10 + (Math.random() * 100))) * sc
      const sz = (100 / (10 + Math.random() * 100)) * scale;

      // Quadratic fall velocity based on particle radius:
      // snow.sp = (Math.pow(snow.sz * .8, 2) * .15) * sp
      let sp = Math.pow(sz * 0.8, 2) * 0.15 * speedMult;
      if (sp < minSpeed) sp = minSpeed;

      return {
        x: Math.random() * (width || window.innerWidth),
        y: initialY >= 0 ? initialY : Math.random() * ((height || window.innerHeight) + 50),
        t: Math.random() * Math.PI * 2,
        sz,
        sp,
        oscFreq: 0.04 + Math.random() * 0.03,
        alphaMult: 0.75 + Math.random() * 0.25,
      };
    };

    const arr: BokehFlake[] = [];
    for (let i = 0; i < num; ++i) {
      arr.push(createFlake());
    }

    let lastTime = performance.now();
    const mv = 25;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.667, 2.5);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Night sky atmospheric background tint (hsla(242, 95%, 3%, opacity))
      if (nightTint > 0) {
        ctx.fillStyle = `hsla(242, 95%, 3%, ${nightTint})`;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < arr.length; ++i) {
        const f = arr[i];

        f.t += f.oscFreq * dt;
        if (f.t >= Math.PI * 2) f.t = 0;

        f.y += f.sp * dt;
        // Lateral harmonic wave drift: Math.sin(f.t * tsc) * (f.sz * .3)
        f.x += Math.sin(f.t) * (f.sz * 0.35) * swayMult * dt;

        // Vertical wrap
        if (f.y > height + 50) {
          f.y = -10 - Math.random() * mv;
          f.x = Math.random() * width;
        }

        // Horizontal wrap
        if (f.x > width + mv) {
          f.x = -mv;
        } else if (f.x < -mv) {
          f.x = width + mv;
        }

        // Draw soft glowing radial gradient bokeh orb
        const rad = Math.max(1, f.sz);
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
        g.addColorStop(0, `rgba(${baseRgb}, ${f.alphaMult})`);
        g.addColorStop(0.4, `rgba(${baseRgb}, ${f.alphaMult * 0.6})`);
        g.addColorStop(1, `rgba(${baseRgb}, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [num, scale, speedMult, swayMult, minSpeed, nightTint, snowColor]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};

// ============================================================================
// SNOWY 2 INSPECTOR
// ============================================================================

export const Snowy2Inspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  playSfx,
}) => {
  const currentPreset = (params?.preset as Snowy2Preset) || 'bokeh_dream';
  const currentMultiplier = params?.intensityMultiplier ?? 1.0;
  const num = params?.num ?? 500;
  const scale = params?.scale ?? 1.3;
  const speed = params?.speed ?? 1.0;
  const sway = params?.sway ?? 1.0;
  const nightTint = params?.nightTint ?? 0.25;
  const currentColor = params?.color || color || '#ffffff';

  const applyPreset = (presetKey: Exclude<Snowy2Preset, 'custom'>) => {
    const p = SNOWY2_PRESETS[presetKey];
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
    { label: 'Pure Bokeh', hex: '#ffffff' },
    { label: 'Cyan Frost', hex: '#d6f0ff' },
    { label: 'Twilight Rose', hex: '#fed7e2' },
    { label: 'Golden Stardust', hex: '#fef08a' },
    { label: 'Moonlight Mint', hex: '#ccfbf1' },
  ];

  return (
    <div className="space-y-4 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={15} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Snowy 2: Ethereal Bokeh Snow
            </h4>
            <p className="text-[10px] text-[var(--muted)]">
              Radial gradient diffused bokeh flakes, quadratic mass physics & harmonic drift
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-bold uppercase">
          Bokeh Particles
        </span>
      </div>

      {/* 2. Presets Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
          Bokeh Snowfall Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(SNOWY2_PRESETS) as Array<Exclude<Snowy2Preset, 'custom'>>).map((key) => {
            const p = SNOWY2_PRESETS[key];
            const isSelected = currentPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-500/20'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--muted2)]'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <GuiIconRenderer icon={p.icon} size={12} className={isSelected ? 'text-indigo-300' : 'text-[var(--muted)]'} />
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

      {/* 3. Intensity Multiplier & Particle Density */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Intensity:</span>
            <span className="font-mono text-indigo-300 font-bold">{Math.round(currentMultiplier * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={currentMultiplier}
            onChange={(e) => onChange({ preset: 'custom', intensityMultiplier: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Particle Count:</span>
            <span className="font-mono text-indigo-300 font-bold">{num}</span>
          </div>
          <input
            type="range"
            min={100}
            max={900}
            step={25}
            value={num}
            onChange={(e) => onChange({ preset: 'custom', num: parseInt(e.target.value) })}
            className="w-full accent-indigo-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 4. Scale (Bokeh Size) & Speed */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Bokeh Orb Scale:</span>
            <span className="font-mono text-indigo-300 font-bold">{scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.8}
            step={0.1}
            value={scale}
            onChange={(e) => onChange({ preset: 'custom', scale: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Fall Speed:</span>
            <span className="font-mono text-indigo-300 font-bold">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3.0}
            step={0.1}
            value={speed}
            onChange={(e) => onChange({ preset: 'custom', speed: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 5. Sway & Night Sky Atmospheric Wash */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Harmonic Sway:</span>
            <span className="font-mono text-indigo-300 font-bold">{sway.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={3.0}
            step={0.1}
            value={sway}
            onChange={(e) => onChange({ preset: 'custom', sway: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Twilight Indigo Wash:</span>
            <span className="font-mono text-indigo-300 font-bold">{Math.round(nightTint * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.8}
            step={0.05}
            value={nightTint}
            onChange={(e) => onChange({ preset: 'custom', nightTint: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 6. Color Presets */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Bokeh Core Tint:</span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
            <span className="font-mono text-indigo-300 font-bold text-[10px]">{currentColor}</span>
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
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-sm'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
              }`}
            >
              <span className="w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: c.hex }} />
              <span className="truncate">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SNOWY 2 SCREEN FX REGISTRATION DEFINITION
// ============================================================================

export const snowy2Fx: ScreenFxDefinition = {
  id: 'snowy_2',
  label: 'Snowy 2',
  description: 'Ethereal bokeh snowflakes with diffused radial gradient glow, quadratic mass physics, and harmonic wave drift.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-indigo-500 bg-indigo-950/80 text-indigo-200',
  defaultParams: {
    preset: 'bokeh_dream',
    num: 500,
    scale: 1.3,
    speed: 1.0,
    sway: 1.0,
    minSpeed: 1.0,
    nightTint: 0.25,
    color: '#ffffff',
    intensityMultiplier: 1.0,
  },
  component: Snowy2Component,
  inspector: Snowy2Inspector,
};
