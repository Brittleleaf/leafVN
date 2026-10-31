'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// RAINDROPS SIMULATION TYPES & CONSTANTS
// ============================================================================

interface StaticDrop {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
  r: number; // radius px
  alpha: number;
  highlightAlpha: number;
  aspect: number;
}

interface TrailBead {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

interface DrippingDrop {
  x: number; // 0 to 1 normalized
  y: number; // px from top
  vy: number; // speed px/frame
  r: number; // radius px
  seed: number;
  trail: TrailBead[];
  wobbleFreq: number;
}

interface SplashRipple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

export const RAIN_OVERLAY_COLORS = [
  { label: 'None', hex: 'none' },
  { label: 'Blue', hex: '#3498db' },
  { label: 'Purple', hex: '#9b59b6' },
  { label: 'Red', hex: '#e74c3c' },
  { label: 'Orange', hex: '#f39c12' },
  { label: 'Green', hex: '#2ecc71' },
  { label: 'Turquoise', hex: '#1abc9c' },
  { label: 'Pink', hex: '#e91e63' },
];

// ============================================================================
// RAINY SCREEN FX COMPONENT (Visual Layer)
// ============================================================================

export const RainyScreenComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read configurable parameters (with defaults based on user snippet)
  const blur = typeof params?.blur === 'number' ? params.blur : 5;
  const brightness = typeof params?.brightness === 'number' ? params.brightness : 75;
  const rainIntensity = typeof params?.rain === 'number' ? params.rain : 70;
  const overlayColor = params?.overlayColor || color || 'none';
  const overlayOpacity = typeof params?.overlayOpacity === 'number' ? params.overlayOpacity : 0;
  const trailRate = typeof params?.trailRate === 'number' ? params.trailRate : 1.0;

  // Multiplier for intensity levels
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

    // Base droplet counts
    const staticCount = Math.round(90 * totalMult);
    const drippingCount = Math.max(3, Math.round(8 * totalMult));

    // Generate static drops (condensation beads on window)
    const staticDrops: StaticDrop[] = [];
    for (let i = 0; i < staticCount; i++) {
      staticDrops.push({
        x: Math.random(),
        y: Math.random(),
        r: 1.2 + Math.random() * 3.8,
        alpha: 0.35 + Math.random() * 0.45,
        highlightAlpha: 0.65 + Math.random() * 0.35,
        aspect: 0.88 + Math.random() * 0.24,
      });
    }

    // Generate dripping raindrops
    const drippingDrops: DrippingDrop[] = [];
    for (let i = 0; i < drippingCount; i++) {
      drippingDrops.push({
        x: 0.05 + Math.random() * 0.9,
        y: Math.random() * -600,
        vy: 1.0 + Math.random() * 2.2,
        r: 2.8 + Math.random() * 3.2,
        seed: Math.random() * 100,
        trail: [],
        wobbleFreq: 0.04 + Math.random() * 0.06,
      });
    }

    // Splashes on glass
    const splashes: SplashRipple[] = [];
    let splashCooldown = 0;

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

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.667, 2.5);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Static Droplets
      for (let i = 0; i < staticDrops.length; i++) {
        const drop = staticDrops[i];
        const px = drop.x * width;
        const py = drop.y * height;
        const r = drop.r;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(px, py, r, r * drop.aspect, 0, 0, Math.PI * 2);

        // Body glow/glass refraction
        const grad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r);
        grad.addColorStop(0, `rgba(255, 255, 255, ${drop.alpha * 0.6})`);
        grad.addColorStop(0.6, `rgba(200, 230, 255, ${drop.alpha * 0.35})`);
        grad.addColorStop(0.9, `rgba(40, 60, 90, ${drop.alpha * 0.25})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Top-left specular glint
        ctx.beginPath();
        ctx.arc(px - r * 0.35, py - r * 0.35, Math.max(0.6, r * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${drop.highlightAlpha})`;
        ctx.fill();

        ctx.restore();
      }

      // 2. Spawn occasional exterior rain ripples
      splashCooldown -= dt;
      if (splashCooldown <= 0 && splashes.length < 12) {
        splashes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 2,
          maxR: 12 + Math.random() * 16,
          alpha: 0.45,
        });
        splashCooldown = 15 + Math.random() * 30;
      }

      // 3. Draw & update splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.r += 0.8 * dt;
        sp.alpha -= 0.02 * dt;
        if (sp.alpha <= 0 || sp.r >= sp.maxR) {
          splashes.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${sp.alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Draw & update Dripping Droplets with Trails
      for (let i = 0; i < drippingDrops.length; i++) {
        const drop = drippingDrops[i];

        // Move downwards with organic meandering wobble
        drop.y += drop.vy * trailRate * dt;
        const wobble = Math.sin(drop.y * drop.wobbleFreq + drop.seed) * 2.2;
        const px = drop.x * width + wobble;
        const py = drop.y;

        // Leave tiny trail beads behind
        if (drop.y > 0 && drop.y < height && Math.random() < 0.22 * trailRate) {
          drop.trail.push({
            x: px + (Math.random() - 0.5) * 1.5,
            y: py - drop.r * 1.2,
            r: Math.max(0.8, drop.r * 0.35 + (Math.random() - 0.5)),
            alpha: 0.6,
          });
          if (drop.trail.length > 25) {
            drop.trail.shift();
          }
        }

        // Draw trail beads
        for (let j = drop.trail.length - 1; j >= 0; j--) {
          const bead = drop.trail[j];
          bead.alpha -= 0.003 * dt;
          if (bead.alpha <= 0) {
            drop.trail.splice(j, 1);
            continue;
          }
          ctx.save();
          ctx.beginPath();
          ctx.arc(bead.x, bead.y, bead.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${bead.alpha * 0.75})`;
          ctx.fill();
          ctx.restore();
        }

        // Only draw main head if within viewable canvas
        if (py >= -20 && py <= height + 40) {
          ctx.save();

          // Teardrop / elongated head
          ctx.beginPath();
          ctx.ellipse(px, py, drop.r * 0.85, drop.r * 1.35, 0, 0, Math.PI * 2);
          const dropGrad = ctx.createRadialGradient(
            px - drop.r * 0.2,
            py - drop.r * 0.3,
            0,
            px,
            py,
            drop.r * 1.4
          );
          dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
          dropGrad.addColorStop(0.5, 'rgba(180, 220, 255, 0.45)');
          dropGrad.addColorStop(0.85, 'rgba(60, 90, 130, 0.3)');
          dropGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
          ctx.fillStyle = dropGrad;
          ctx.fill();

          // Bright specular gleam
          ctx.beginPath();
          ctx.arc(px - drop.r * 0.3, py - drop.r * 0.45, Math.max(0.8, drop.r * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fill();

          ctx.restore();
        }

        // Respawn when falling off the bottom
        if (py > height + 60) {
          drop.y = -20 - Math.random() * 200;
          drop.x = 0.05 + Math.random() * 0.9;
          drop.vy = 1.0 + Math.random() * 2.5;
          drop.seed = Math.random() * 100;
          drop.trail = [];
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [totalMult, trailRate]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Backdrop Glass Blur & Brightness (Condensation on Scene) */}
      <div
        className="absolute inset-0 pointer-events-none transition-[backdrop-filter] duration-300"
        style={{
          backdropFilter: `blur(${blur}px) brightness(${brightness / 100})`,
          WebkitBackdropFilter: `blur(${blur}px) brightness(${brightness / 100})`,
        }}
      />

      {/* 2. Color Hue Overlay (#color-overlay style) */}
      {overlayColor && overlayColor !== 'none' && overlayOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* 3. Perimeter Window Condensation Mist */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 65%, rgba(180, 215, 250, 0.12) 100%)',
        }}
      />

      {/* 4. Raindrops Canvas Layer (#bg-canvas style) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          mixBlendMode: 'screen',
          opacity: Math.max(0.2, rainIntensity / 100),
        }}
      />
    </div>
  );
};

// ============================================================================
// RAINY SCREEN FX INSPECTOR (Editor Controls)
// ============================================================================

export const RainyScreenInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  playSfx,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const blur = typeof params?.blur === 'number' ? params.blur : 5;
  const brightness = typeof params?.brightness === 'number' ? params.brightness : 75;
  const rain = typeof params?.rain === 'number' ? params.rain : 70;
  const overlayColor = params?.overlayColor || color || 'none';
  const overlayOpacity = typeof params?.overlayOpacity === 'number' ? params.overlayOpacity : 0;
  const trailRate = typeof params?.trailRate === 'number' ? params.trailRate : 1.0;

  // Cleanup audio preview on unmount
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
      if (audioRef.current) {
        audioRef.current.pause();
      }
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

  // Quick Style Presets
  const PRESET_STYLES = [
    {
      label: 'Gentle Drizzle',
      subtitle: 'Soft Rain & Light Mist',
      patch: { blur: 3, brightness: 85, rain: 45, overlayColor: '#3498db', overlayOpacity: 15, trailRate: 0.8 },
    },
    {
      label: 'Heavy Downpour',
      subtitle: 'Stormy Glass & Dense Rain',
      patch: { blur: 7, brightness: 60, rain: 90, overlayColor: '#1abc9c', overlayOpacity: 25, trailRate: 1.6 },
    },
    {
      label: 'Moody Night',
      subtitle: 'Dark Violet Rain Veil',
      patch: { blur: 5, brightness: 40, rain: 75, overlayColor: '#9b59b6', overlayOpacity: 30, trailRate: 1.0 },
    },
    {
      label: 'Clear Window',
      subtitle: 'Minimal Blur & Droplets',
      patch: { blur: 1, brightness: 95, rain: 50, overlayColor: 'none', overlayOpacity: 0, trailRate: 1.0 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Rainy Screen (Window & Droplets)</span>
        </span>
        <button
          type="button"
          onClick={toggleAudioPreview}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          title="Toggle ambient rain sound preview"
        >
          <span>{isPlayingAudio ? '🔊 Rain SFX: ON' : '🔇 Rain SFX: OFF'}</span>
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Atmospheric Presets:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(preset.patch);
                if (preset.patch.overlayColor && onColorChange) {
                  onColorChange(preset.patch.overlayColor);
                }
              }}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] hover:border-sky-400 hover:bg-sky-500/10 text-left transition-all cursor-pointer group"
            >
              <div className="text-[10px] font-bold text-[var(--text)] group-hover:text-sky-300 truncate">
                {preset.label}
              </div>
              <div className="text-[9px] font-mono text-[var(--muted2)] truncate">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER 1: BLUR (CONDENSATION) */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Glass Blur (Condensation):</span>
            <span className="text-sky-300 font-mono font-bold">{blur}px</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0 - 20px</span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={blur}
          onChange={(e) => onChange({ blur: parseInt(e.target.value, 10) })}
          className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0px (Crisp)</span>
          <span>5px (Standard)</span>
          <span>20px (Deep Fog)</span>
        </div>
      </div>

      {/* SLIDER 2: BRIGHTNESS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Atmospheric Brightness:</span>
            <span className="text-sky-300 font-mono font-bold">{brightness}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">20% - 120%</span>
        </div>
        <input
          type="range"
          min={20}
          max={120}
          step={5}
          value={brightness}
          onChange={(e) => onChange({ brightness: parseInt(e.target.value, 10) })}
          className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>20% (Stormy Dark)</span>
          <span>75% (Rain Mood)</span>
          <span>120% (Daylight)</span>
        </div>
      </div>

      {/* SLIDER 3: RAIN INTENSITY */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Rain Droplet Density:</span>
            <span className="text-sky-300 font-mono font-bold">{rain}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">20% - 100%</span>
        </div>
        <input
          type="range"
          min={20}
          max={100}
          step={5}
          value={rain}
          onChange={(e) => onChange({ rain: parseInt(e.target.value, 10) })}
          className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 4: DROPLET SPEED / FLOW */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Droplet Flow Speed:</span>
            <span className="text-sky-300 font-mono font-bold">{trailRate.toFixed(1)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.4× - 2.5×</span>
        </div>
        <input
          type="range"
          min={0.4}
          max={2.5}
          step={0.1}
          value={trailRate}
          onChange={(e) => onChange({ trailRate: parseFloat(e.target.value) })}
          className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* HUE & COLOR OVERLAY */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Atmosphere Color Tint:</span>
          <span className="font-mono text-[9px] text-sky-300">
            {overlayColor === 'none' ? 'None' : overlayColor}
          </span>
        </div>

        {/* Color buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {RAIN_OVERLAY_COLORS.map((c) => {
            const isSelected = overlayColor === c.hex;
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  const newColor = c.hex;
                  const newOpacity = newColor === 'none' ? 0 : overlayOpacity === 0 ? 25 : overlayOpacity;
                  onChange({ overlayColor: newColor, overlayOpacity: newOpacity });
                  onColorChange?.(newColor);
                }}
                className={`w-6 h-6 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                  isSelected ? 'border-white scale-110 shadow-md ring-2 ring-sky-400/50' : 'border-white/20 hover:scale-105'
                }`}
                style={{
                  background:
                    c.hex === 'none'
                      ? 'linear-gradient(135deg, #333 45%, #fff 45%, #fff 55%, #333 55%)'
                      : c.hex,
                }}
                title={c.label}
              />
            );
          })}
        </div>

        {/* Color Opacity Slider */}
        {overlayColor !== 'none' && (
          <div className="space-y-1 pt-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--muted)] font-semibold uppercase">Color Intensity:</span>
              <span className="font-mono text-[9px] text-sky-300">{overlayOpacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={overlayOpacity}
              onChange={(e) => onChange({ overlayOpacity: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const rainyScreenFx: ScreenFxDefinition = {
  id: 'rainy_screen',
  label: 'Rainy Screen',
  description: 'Atmospheric rain on glass window with droplets, condensation blur and color wash',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
  defaultSfx: '/assets/sfx/rain.mp3',
  defaultParams: {
    blur: 5,
    brightness: 75,
    rain: 70,
    overlayColor: 'none',
    overlayOpacity: 0,
    trailRate: 1.0,
  },
  component: RainyScreenComponent,
  inspector: RainyScreenInspector,
};
