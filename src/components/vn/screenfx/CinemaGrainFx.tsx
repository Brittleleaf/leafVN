'use client';

import React, { useEffect, useRef } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const CinemaGrainComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const preset = params?.preset || 'classic35';
  const grainOpacity = (params?.grainOpacity ?? (intensity === 'light' ? 0.12 : intensity === 'heavy' ? 0.32 : 0.20)) * intensityMultiplier;
  const grainScale = params?.grainScale ?? (preset === 'gritty16' ? 2.2 : preset === 'noir' ? 1.8 : 1.3);
  const vignetteDepth = (params?.vignetteDepth ?? (preset === 'noir' ? 0.85 : 0.55)) * intensityMultiplier;
  const tintColor = params?.tintColor || (preset === 'noir' ? '#0f172a' : '#1e1b4b');
  const showSpecks = params?.filmSpecks ?? (preset === 'gritty16' || preset === 'noir');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = 0;
    const fpsInterval = 1000 / 24; // 24 FPS authentic cinematic shutter

    // Small offscreen buffer for grain generation to keep GPU/CPU footprint minimal
    const grainW = Math.max(64, Math.floor(window.innerWidth / (grainScale * 4)));
    const grainH = Math.max(64, Math.floor(window.innerHeight / (grainScale * 4)));

    const offCanvas = document.createElement('canvas');
    offCanvas.width = grainW;
    offCanvas.height = grainH;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    const imgData = offCtx.createImageData(grainW, grainH);
    const data = imgData.data;

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Film specks state
    interface Speck {
      x: number;
      y: number;
      len: number;
      angle: number;
      life: number;
    }
    const specks: Speck[] = [];

    const drawNoise = (time: number) => {
      animId = requestAnimationFrame(drawNoise);

      const elapsed = time - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = time - (elapsed % fpsInterval);

      // Procedural monochrome noise buffer
      for (let i = 0; i < data.length; i += 4) {
        const val = (Math.random() * 255) | 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
      offCtx.putImageData(imgData, 0, 0);

      // Render scaled grain to main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = Math.min(0.65, grainOpacity);
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Film scratches and specks
      if (showSpecks) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;

        // Occasionally spawn random scratch hair
        if (Math.random() < 0.25) {
          specks.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            len: 8 + Math.random() * 25,
            angle: Math.random() * Math.PI * 2,
            life: 1 + Math.floor(Math.random() * 3),
          });
        }

        for (let s = specks.length - 1; s >= 0; s--) {
          const sp = specks[s];
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(sp.x + Math.cos(sp.angle) * sp.len, sp.y + Math.sin(sp.angle) * sp.len);
          ctx.stroke();
          sp.life--;
          if (sp.life <= 0) specks.splice(s, 1);
        }
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(drawNoise);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [grainOpacity, grainScale, showSpecks]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 1. Cinematic Color Grade & Vignette - Feathered edges, no sharp borders */}
      <div
        className="absolute"
        style={{
          top: '-10%',
          left: '-10%',
          width: '120%',
          height: '120%',
          background: `radial-gradient(ellipse at center, transparent 40%, ${tintColor}77 75%, ${tintColor}ee 100%)`,
          opacity: Math.min(1, vignetteDepth),
        }}
      />

      {/* 2. Procedural 24 FPS Film Grain Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full mix-blend-overlay pointer-events-none"
      />

      {/* 3. Subtle Film Shutter Breathing */}
      <div
        className="absolute inset-0 bg-white/2 pointer-events-none"
        style={{
          animation: 'cinemaFlicker 0.12s steps(2) infinite',
          opacity: 0.35 * intensityMultiplier,
        }}
      />

      <style jsx global>{`
        @keyframes cinemaFlicker {
          0%, 100% { opacity: 0.01; }
          50% { opacity: 0.04; }
        }
      `}</style>
    </div>
  );
};

export const CinemaGrainInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'classic35';
  const grainOpacity = params?.grainOpacity ?? 0.20;
  const grainScale = params?.grainScale ?? 1.3;
  const vignetteDepth = params?.vignetteDepth ?? 0.55;
  const filmSpecks = params?.filmSpecks ?? false;

  const presets = [
    {
      id: 'classic35',
      label: '35mm Classic',
      desc: 'Balanced cinematic grain with elegant contrast',
      grainOpacity: 0.18,
      grainScale: 1.3,
      vignetteDepth: 0.50,
      filmSpecks: false,
      tintColor: '#1e1b4b',
    },
    {
      id: 'gritty16',
      label: '16mm Indie',
      desc: 'Raw textured grain with dust and analog wear',
      grainOpacity: 0.30,
      grainScale: 2.2,
      vignetteDepth: 0.65,
      filmSpecks: true,
      tintColor: '#2e1065',
    },
    {
      id: 'noir',
      label: '1940s Noir',
      desc: 'Dramatic deep black vignette with crisp silver grain',
      grainOpacity: 0.32,
      grainScale: 1.8,
      vignetteDepth: 0.85,
      filmSpecks: true,
      tintColor: '#090d16',
    },
    {
      id: 'subtle',
      label: 'Subtle Cinema',
      desc: 'Gentle organic texture to eliminate digital sterility',
      grainOpacity: 0.11,
      grainScale: 1.0,
      vignetteDepth: 0.35,
      filmSpecks: false,
      tintColor: '#1e293b',
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.film} className="w-4 h-4" />
          <span>Cinematic Film Grain & Texture</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold uppercase">
          24 FPS Analog
        </span>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Film Emulsion Presets:</span>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => {
            const isSel = currentPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  onChange({
                    preset: p.id,
                    grainOpacity: p.grainOpacity,
                    grainScale: p.grainScale,
                    vignetteDepth: p.vignetteDepth,
                    filmSpecks: p.filmSpecks,
                    tintColor: p.tintColor,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSel
                    ? 'border-purple-400 bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/50 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:border-purple-500/40 hover:text-[var(--text)]'
                }`}
              >
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9px] line-clamp-1 opacity-70 mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grain Density / Opacity Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Grain Density:</span>
          <span className="text-[11px] font-mono font-bold text-purple-400">{Math.round(grainOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="0.55"
          step="0.01"
          value={grainOpacity}
          onChange={(e) => onChange({ grainOpacity: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      {/* Vignette Depth Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Shadow Vignette Depth:</span>
          <span className="text-[11px] font-mono font-bold text-purple-400">{Math.round(vignetteDepth * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="0.95"
          step="0.05"
          value={vignetteDepth}
          onChange={(e) => onChange({ vignetteDepth: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>

      {/* Film Specks / Scratches Toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Analog Dust & Scratches:</span>
        <button
          type="button"
          onClick={() => onChange({ filmSpecks: !filmSpecks, preset: 'custom' })}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
            filmSpecks
              ? 'border-purple-400 bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {filmSpecks ? 'Active' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};

export const cinemaGrainFx: ScreenFxDefinition = {
  id: 'cinema_grain',
  label: 'Noir Grain / Interference',
  description: 'Suspenseful 24 FPS organic film grain, analog scratches, and cinematic feathered vignette.',
  icon: GUI_ICONS.general.film,
  badgeColor: 'border-purple-600 bg-purple-950/80 text-purple-200',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  defaultParams: {
    preset: 'classic35',
    grainOpacity: 0.20,
    grainScale: 1.3,
    vignetteDepth: 0.55,
    filmSpecks: false,
    tintColor: '#1e1b4b',
  },
  component: CinemaGrainComponent,
  inspector: CinemaGrainInspector,
};
