'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// RAIN 1 SIMULATION TYPES & CONSTANTS
// ============================================================================

interface RainDrop1 {
  x: number; // 0 to 1 normalized
  y: number; // px from top
  speed: number;
  length: number;
  opacity: number;
  row: 'front' | 'back';
}

interface Splat1 {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  maxRadius: number;
  opacity: number;
  row: 'front' | 'back';
}

// ============================================================================
// RAIN 1 COMPONENT
// ============================================================================

export const Rain1Component: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Read configurable parameters (matching user toggles & CSS defaults)
  const splatEnabled = params?.splatEnabled ?? true;
  const backRowEnabled = params?.backRowEnabled ?? true;
  const singleMode = params?.singleMode ?? false;
  const speedMultiplier = typeof params?.speed === 'number' ? params.speed : 1.0;
  const windAngle = typeof params?.windAngle === 'number' ? params.windAngle : 0; // degrees -25 to 25
  const rainOpacity = typeof params?.opacity === 'number' ? params.opacity : 0.8;

  // Multiplier for intensity levels
  const levelMult = intensity === 'light' ? 0.5 : intensity === 'heavy' ? 1.5 : 1.0;
  const totalMult = levelMult * intensityMultiplier;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    // Number of drops based on settings
    const baseCount = singleMode ? 1 : Math.round(45 * totalMult);

    const drops: RainDrop1[] = [];

    // Front row drops
    for (let i = 0; i < baseCount; i++) {
      drops.push({
        x: singleMode ? 0.5 : Math.random(),
        y: Math.random() * -800,
        speed: 12 + Math.random() * 6,
        length: 50 + Math.random() * 30,
        opacity: 0.25 + Math.random() * 0.2,
        row: 'front',
      });
    }

    // Back row drops (if enabled and not single mode)
    if (backRowEnabled && !singleMode) {
      const backCount = Math.round(baseCount * 0.85);
      for (let i = 0; i < backCount; i++) {
        drops.push({
          x: Math.random(),
          y: Math.random() * -800,
          speed: 8 + Math.random() * 5,
          length: 35 + Math.random() * 20,
          opacity: 0.12 + Math.random() * 0.12,
          row: 'back',
        });
      }
    }

    const splats: Splat1[] = [];

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

    const radWind = (windAngle * Math.PI) / 180;
    const windDx = Math.sin(radWind);
    const windDy = Math.cos(radWind);

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.667, 2.5);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Draw & update Splats
      if (splatEnabled) {
        for (let i = splats.length - 1; i >= 0; i--) {
          const s = splats[i];
          s.radiusX += 1.2 * dt;
          s.radiusY += 0.8 * dt;
          s.opacity -= 0.05 * dt;

          if (s.opacity <= 0 || s.radiusX >= s.maxRadius) {
            splats.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          // Half ellipse pointing upwards (dotted top)
          ctx.ellipse(s.x, s.y, s.radiusX, s.radiusY, 0, Math.PI, Math.PI * 2);
          ctx.setLineDash([2, 2]); // dotted splat matching CSS border-top: 2px dotted
          ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity * (s.row === 'back' ? 0.4 : 0.8) * rainOpacity})`;
          ctx.lineWidth = s.row === 'back' ? 1 : 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw & update Falling Drops (Stems)
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const step = drop.speed * speedMultiplier * dt;

        drop.y += step * windDy;
        drop.x += (step * windDx) / Math.max(1, width);

        const px = drop.x * width;
        const py = drop.y;

        const groundY = drop.row === 'back' ? height - 50 : height - 15;

        // Check ground impact
        if (py >= groundY) {
          if (splatEnabled && px >= -20 && px <= width + 20) {
            splats.push({
              x: px,
              y: groundY,
              radiusX: 2,
              radiusY: 1,
              maxRadius: drop.row === 'back' ? 8 : 12,
              opacity: 0.9,
              row: drop.row,
            });
          }

          // Reset drop to top
          drop.y = -drop.length - Math.random() * 200;
          drop.x = singleMode ? 0.5 : Math.random();
          continue;
        }

        // Draw Stem (line with gradient fading at top)
        if (py + drop.length > 0 && py < height) {
          const startX = px - drop.length * windDx;
          const startY = py - drop.length * windDy;

          ctx.save();
          const grad = ctx.createLinearGradient(startX, startY, px, py);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(
            1,
            `rgba(255, 255, 255, ${drop.opacity * (drop.row === 'back' ? 0.5 : 1.0) * rainOpacity})`
          );

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(px, py);
          ctx.strokeStyle = grad;
          ctx.lineWidth = drop.row === 'back' ? 0.8 : 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [totalMult, splatEnabled, backRowEnabled, singleMode, speedMultiplier, windAngle, rainOpacity]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
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
// RAIN 1 INSPECTOR (Editor Controls)
// ============================================================================

export const Rain1Inspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const splatEnabled = params?.splatEnabled ?? true;
  const backRowEnabled = params?.backRowEnabled ?? true;
  const singleMode = params?.singleMode ?? false;
  const speed = typeof params?.speed === 'number' ? params.speed : 1.0;
  const windAngle = typeof params?.windAngle === 'number' ? params.windAngle : 0;
  const opacity = typeof params?.opacity === 'number' ? params.opacity : 0.8;

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
      label: 'Standard Rain',
      subtitle: 'Dual Row + Splats',
      patch: { splatEnabled: true, backRowEnabled: true, singleMode: false, speed: 1.0, windAngle: 0, opacity: 0.8 },
    },
    {
      label: 'Windy Storm',
      subtitle: 'Fast Slanted Downpour',
      patch: { splatEnabled: true, backRowEnabled: true, singleMode: false, speed: 1.5, windAngle: 12, opacity: 0.95 },
    },
    {
      label: 'Front Only',
      subtitle: 'Flat 2D Falling Drops',
      patch: { splatEnabled: true, backRowEnabled: false, singleMode: false, speed: 0.9, windAngle: 0, opacity: 0.75 },
    },
    {
      label: 'Single Drop',
      subtitle: 'Minimalist Single Rain',
      patch: { splatEnabled: true, backRowEnabled: false, singleMode: true, speed: 0.8, windAngle: 0, opacity: 1.0 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Rain 1 (Falling Stems & Splats)</span>
        </span>
        <button
          type="button"
          onClick={toggleAudioPreview}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
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

      {/* CORE TOGGLES (Matching demo buttons: SPLAT, BACK ROW, SINGLE) */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Layer & Physics Toggles:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* Splat Toggle */}
          <button
            type="button"
            onClick={() => onChange({ splatEnabled: !splatEnabled })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
              splatEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>SPLAT</span>
            <span className="text-[9px] font-mono">{splatEnabled ? 'ENABLED' : 'MUTED'}</span>
          </button>

          {/* Back Row Toggle */}
          <button
            type="button"
            onClick={() => onChange({ backRowEnabled: !backRowEnabled })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
              backRowEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>BACK ROW</span>
            <span className="text-[9px] font-mono">{backRowEnabled ? '3D DEPTH' : 'OFF'}</span>
          </button>

          {/* Single Mode Toggle */}
          <button
            type="button"
            onClick={() => onChange({ singleMode: !singleMode })}
            className={`py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 ${
              singleMode
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>SINGLE</span>
            <span className="text-[9px] font-mono">{singleMode ? 'SOLO DROP' : 'ALL DROPS'}</span>
          </button>
        </div>
      </div>

      {/* SLIDER 1: SPEED */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Fall Speed:</span>
            <span className="text-cyan-300 font-mono font-bold">{speed.toFixed(1)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.4× - 2.5×</span>
        </div>
        <input
          type="range"
          min={0.4}
          max={2.5}
          step={0.1}
          value={speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 2: WIND TILT */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Wind Angle (Slant):</span>
            <span className="text-cyan-300 font-mono font-bold">{windAngle}°</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">-25° to +25°</span>
        </div>
        <input
          type="range"
          min={-25}
          max={25}
          step={1}
          value={windAngle}
          onChange={(e) => onChange({ windAngle: parseInt(e.target.value, 10) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>-25° (Left)</span>
          <span>0° (Vertical)</span>
          <span>+25° (Right)</span>
        </div>
      </div>

      {/* SLIDER 3: OPACITY */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Rain Brightness / Opacity:</span>
            <span className="text-cyan-300 font-mono font-bold">{Math.round(opacity * 100)}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">20% - 100%</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={1.0}
          step={0.05}
          value={opacity}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const rain1Fx: ScreenFxDefinition = {
  id: 'rain_1',
  label: 'Rain 1',
  description: 'Classic vertical rain stems with ground splats and dual-row 3D depth',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
  defaultSfx: '/assets/sfx/rain.mp3',
  defaultParams: {
    splatEnabled: true,
    backRowEnabled: true,
    singleMode: false,
    speed: 1.0,
    windAngle: 0,
    opacity: 0.8,
  },
  component: Rain1Component,
  inspector: Rain1Inspector,
};
