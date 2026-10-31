'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// SPEED (WARP SPEED) SIMULATION TYPES & CONSTANTS
// ============================================================================

interface Star3D {
  x: number;
  y: number;
  z: number;
  pz: number; // previous Z for hyperdrive motion streak
  o: number;  // star opacity
}

export const SPEED_STAR_COLORS = [
  { label: 'Ice Cyan', hex: '#D1FFFF' },
  { label: 'Starlight White', hex: '#FFFFFF' },
  { label: 'Solar Amber', hex: '#FCD34D' },
  { label: 'Neon Magenta', hex: '#F472B6' },
  { label: 'Cosmic Emerald', hex: '#34D399' },
  { label: 'Deep Violet', hex: '#A78BFA' },
];

// ============================================================================
// SPEED COMPONENT (3D Starfield & Warp Hyperdrive)
// ============================================================================

export const SpeedComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read configurable parameters
  const isWarp = params?.warp ?? true; // Warp mode on by default
  const speedMult = typeof params?.speed === 'number' ? params.speed : 1.5;
  const starCountParam = typeof params?.starCount === 'number' ? params.starCount : 1200;
  const streakLength = typeof params?.streakLength === 'number' ? params.streakLength : 1.2;
  const spaceVeilOpacity = typeof params?.veilOpacity === 'number' ? params.veilOpacity : 0.45;
  const starColor = params?.starColor || color || '#D1FFFF';

  const levelMult = intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0;
  const totalMult = levelMult * intensityMultiplier;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;

    const numStars = Math.round(starCountParam * totalMult);
    const stars: Star3D[] = [];

    const initStar = (s: Star3D, w: number, h: number) => {
      s.x = (Math.random() - 0.5) * w * 2;
      s.y = (Math.random() - 0.5) * h * 2;
      s.z = Math.random() * w + 1;
      s.pz = s.z;
      s.o = 0.2 + Math.random() * 0.8;
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      centerX = width / 2;
      centerY = height / 2;

      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        const s: Star3D = { x: 0, y: 0, z: 0, pz: 0, o: 1 };
        initStar(s, width, height);
        stars.push(s);
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

      const focalLength = width * 1.5;
      const step = 8.0 * speedMult * (isWarp ? 2.5 : 1.0) * dt;

      ctx.save();

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        star.pz = star.z;
        star.z -= step;

        if (star.z <= 0) {
          initStar(star, width, height);
          star.z = width;
          star.pz = star.z;
          continue;
        }

        const k = focalLength / star.z;
        const px = star.x * k + centerX;
        const py = star.y * k + centerY;

        // Skip if out of viewport
        if (px < -50 || px > width + 50 || py < -50 || py > height + 50) {
          initStar(star, width, height);
          continue;
        }

        const size = Math.max(0.6, (1 - star.z / width) * 3.5);

        if (isWarp) {
          // WARP SPEED MODE: Stretched light hyperdrive streaks
          const pk = focalLength / Math.max(1, star.pz + (star.pz - star.z) * (streakLength - 1));
          const prevX = star.x * pk + centerX;
          const prevY = star.y * pk + centerY;

          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(px, py);
          ctx.strokeStyle = starColor;
          ctx.globalAlpha = star.o * Math.min(1.0, (1 - star.z / width) * 1.2);
          ctx.lineWidth = size * 0.9;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          // NORMAL STAR CRUISE MODE: Expanding star points
          ctx.beginPath();
          ctx.arc(px, py, size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = starColor;
          ctx.globalAlpha = star.o * Math.min(1.0, (1 - star.z / width) * 1.4);
          ctx.fill();
        }
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [isWarp, speedMult, starCountParam, streakLength, starColor, totalMult]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Deep Space Atmospheric Backdrop Veil */}
      {spaceVeilOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 10, 24, 0.4) 0%, rgba(0, 4, 12, 0.9) 100%)',
            opacity: spaceVeilOpacity,
          }}
        />
      )}

      {/* 2. 3D Warp Speed Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

// ============================================================================
// SPEED INSPECTOR (Editor Controls)
// ============================================================================

export const SpeedInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  playSfx,
}) => {
  const isWarp = params?.warp ?? true;
  const speed = typeof params?.speed === 'number' ? params.speed : 1.5;
  const starCount = typeof params?.starCount === 'number' ? params.starCount : 1200;
  const streakLength = typeof params?.streakLength === 'number' ? params.streakLength : 1.2;
  const veilOpacity = typeof params?.veilOpacity === 'number' ? params.veilOpacity : 0.45;
  const starColor = params?.starColor || color || '#D1FFFF';

  const toggleWarp = () => {
    const nextWarp = !isWarp;
    playSfx?.('/assets/sfx/click intro.mp3', false, 0.3);
    onChange({ warp: nextWarp });
  };

  const PRESET_STYLES = [
    {
      label: 'Warp Speed',
      subtitle: 'Full Hyperdrive Light Trails',
      patch: { warp: true, speed: 1.8, starCount: 1400, streakLength: 1.4, starColor: '#D1FFFF', veilOpacity: 0.5 },
    },
    {
      label: 'Star Cruise',
      subtitle: 'Gentle 3D Space Drifting',
      patch: { warp: false, speed: 0.8, starCount: 1000, streakLength: 1.0, starColor: '#FFFFFF', veilOpacity: 0.3 },
    },
    {
      label: 'Ludicrous Speed',
      subtitle: 'Maximum Velocity Hyperspace',
      patch: { warp: true, speed: 3.2, starCount: 1800, streakLength: 2.2, starColor: '#F472B6', veilOpacity: 0.7 },
    },
    {
      label: 'Deep Void',
      subtitle: 'Subtle Distant Starfield',
      patch: { warp: false, speed: 0.4, starCount: 600, streakLength: 1.0, starColor: '#D1FFFF', veilOpacity: 0.2 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Speed (3D Warp Hyperdrive)</span>
        </span>
        <button
          type="button"
          onClick={toggleWarp}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border transition-all cursor-pointer shadow-sm ${
            isWarp
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/40'
              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          title="Toggle between Hyperdrive Warp Streaks and Star Cruise"
        >
          <span>🚀 {isWarp ? 'WARP SPEED: ON' : 'CRUISE: ON'}</span>
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Flight Profiles:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(preset.patch);
                if (preset.patch.starColor && onColorChange) {
                  onColorChange(preset.patch.starColor);
                }
              }}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] hover:border-cyan-400 hover:bg-cyan-500/10 text-left transition-all cursor-pointer group"
            >
              <div className="text-[10px] font-bold text-[var(--text)] group-hover:text-cyan-300 truncate">
                {preset.label}
              </div>
              <div className="text-[9px] font-mono text-[var(--muted2)] truncate">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER 1: FLIGHT VELOCITY / SPEED */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Flight Velocity:</span>
            <span className="text-cyan-300 font-mono font-bold">{speed.toFixed(1)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.2× - 4.0×</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={4.0}
          step={0.1}
          value={speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0.2× (Drift)</span>
          <span>1.5× (Standard)</span>
          <span>4.0× (Hyperspace)</span>
        </div>
      </div>

      {/* SLIDER 2: STREAK LENGTH (IN WARP MODE) */}
      {isWarp && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
              <span>Warp Trail Length:</span>
              <span className="text-cyan-300 font-mono font-bold">{streakLength.toFixed(1)}×</span>
            </span>
            <span className="font-mono text-[9px] text-[var(--muted2)]">0.5× - 3.0×</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={streakLength}
            onChange={(e) => onChange({ streakLength: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      )}

      {/* SLIDER 3: STAR DENSITY / COUNT */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Starfield Density:</span>
            <span className="text-cyan-300 font-mono font-bold">{starCount}</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">400 - 2000</span>
        </div>
        <input
          type="range"
          min={400}
          max={2000}
          step={100}
          value={starCount}
          onChange={(e) => onChange({ starCount: parseInt(e.target.value, 10) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 4: DEEP SPACE VEIL OPACITY */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Deep Space Darkness Veil:</span>
            <span className="text-cyan-300 font-mono font-bold">{Math.round(veilOpacity * 100)}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0% - 90%</span>
        </div>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.05}
          value={veilOpacity}
          onChange={(e) => onChange({ veilOpacity: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* STAR COLOR PALETTE */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Star Color & Glow:</span>
          <span className="font-mono text-[9px] text-cyan-300">{starColor}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {SPEED_STAR_COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                onChange({ starColor: c.hex });
                onColorChange?.(c.hex);
              }}
              className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                starColor === c.hex ? 'border-white scale-110 shadow-md ring-2 ring-cyan-400/50' : 'border-white/20 hover:scale-105'
              }`}
              style={{ background: c.hex }}
              title={c.label}
            />
          ))}

          <input
            type="color"
            value={starColor.startsWith('#') ? starColor : '#D1FFFF'}
            onChange={(e) => {
              onChange({ starColor: e.target.value });
              onColorChange?.(e.target.value);
            }}
            className="w-6 h-6 rounded border border-[var(--border)] bg-transparent cursor-pointer shrink-0"
            title="Custom Star Color"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const speedFx: ScreenFxDefinition = {
  id: 'speed',
  label: 'Speed',
  description: 'High-speed 3D starfield with hyperdrive warp trails and customizable flight velocity',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  defaultSfx: '/assets/sfx/click intro.mp3',
  defaultParams: {
    warp: true,
    speed: 1.5,
    starCount: 1200,
    streakLength: 1.2,
    veilOpacity: 0.45,
    starColor: '#D1FFFF',
  },
  component: SpeedComponent,
  inspector: SpeedInspector,
};
