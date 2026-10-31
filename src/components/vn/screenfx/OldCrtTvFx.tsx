'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const OldCrtTvComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'arcade';
  const scanlineOpacity = (params?.scanlineOpacity ?? (intensity === 'light' ? 0.25 : intensity === 'heavy' ? 0.65 : 0.42)) * intensityMultiplier;
  const curvatureDepth = (params?.curvatureDepth ?? (preset === 'tv80s' ? 0.85 : 0.65)) * intensityMultiplier;
  const showRollBar = params?.showRollBar ?? (preset === 'vhs' || preset === 'tv80s');
  const showRgbTriad = params?.showRgbTriad ?? true;
  const rollSpeed = params?.rollSpeed ?? (preset === 'vhs' ? 3.5 : 7.0);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 1. Fine High-Frequency Horizontal Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, ${Math.min(0.85, scanlineOpacity)}) 0px,
            rgba(0, 0, 0, ${Math.min(0.85, scanlineOpacity)}) 2px,
            transparent 2px,
            transparent 4px
          )`,
          animation: 'crtFlicker 0.1s steps(2) infinite',
          zIndex: 1,
        }}
      />

      {/* 2. RGB Phosphor Subpixel Grid (Triad Stripe) */}
      {showRgbTriad && (
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(
              90deg,
              rgba(255, 0, 0, 0.04) 0px,
              rgba(255, 0, 0, 0.04) 1px,
              rgba(0, 255, 0, 0.04) 1px,
              rgba(0, 255, 0, 0.04) 2px,
              rgba(0, 0, 255, 0.04) 2px,
              rgba(0, 0, 255, 0.04) 3px
            )`,
            backgroundSize: '3px 100%',
            mixBlendMode: 'screen',
            zIndex: 2,
          }}
        />
      )}

      {/* 3. Rolling V-Hold Synchronization Bar */}
      {showRollBar && (
        <div
          className="absolute w-full pointer-events-none"
          style={{
            height: '24%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%)',
            animation: `crtRollBar ${rollSpeed}s linear infinite`,
            zIndex: 3,
          }}
        />
      )}

      {/* 
        4. CRT Curved Tube Spherical Glass Vignette
        Feathered multi-stop gradient mimicking phosphor bulb edge falloff.
        NO hard square borders.
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse 75% 70% at 50% 50%,
              transparent 55%,
              rgba(10, 10, 15, ${0.45 * curvatureDepth}) 80%,
              rgba(5, 5, 10, ${0.92 * curvatureDepth}) 98%,
              #000000 100%
            )
          `,
          zIndex: 4,
        }}
      />

      {/* 5. Subtle Cathode Phosphor Bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(167, 243, 208, 0.03) 0%, transparent 70%)',
          mixBlendMode: 'screen',
          zIndex: 5,
        }}
      />

      <style jsx global>{`
        @keyframes crtFlicker {
          0% {
            opacity: 0.88;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes crtRollBar {
          0% {
            top: -25%;
          }
          100% {
            top: 125%;
          }
        }
      `}</style>
    </div>
  );
};

export const OldCrtTvInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'arcade';
  const scanlineOpacity = params?.scanlineOpacity ?? 0.42;
  const curvatureDepth = params?.curvatureDepth ?? 0.65;
  const showRollBar = params?.showRollBar ?? false;
  const showRgbTriad = params?.showRgbTriad ?? true;

  const presets = [
    {
      id: 'arcade',
      label: 'Arcade Cabinet',
      desc: 'Crisp scanlines with vibrant RGB triad phosphor glow',
      scanlineOpacity: 0.45,
      curvatureDepth: 0.65,
      showRollBar: false,
      showRgbTriad: true,
      rollSpeed: 7.0,
    },
    {
      id: 'tv80s',
      label: '1980s Living Room TV',
      desc: 'Warm curved tube distortion with gentle horizontal sync hum',
      scanlineOpacity: 0.55,
      curvatureDepth: 0.85,
      showRollBar: true,
      showRgbTriad: true,
      rollSpeed: 8.0,
    },
    {
      id: 'vhs',
      label: 'Damaged VHS Tape',
      desc: 'Heavy tracking roll-bar interference and high scanline contrast',
      scanlineOpacity: 0.68,
      curvatureDepth: 0.75,
      showRollBar: true,
      showRgbTriad: false,
      rollSpeed: 3.5,
    },
    {
      id: 'pvm',
      label: 'Sony PVM Monitor',
      desc: 'Ultra-clean razor-sharp professional studio scanline matrix',
      scanlineOpacity: 0.28,
      curvatureDepth: 0.40,
      showRollBar: false,
      showRgbTriad: true,
      rollSpeed: 10.0,
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-4 h-4" />
          <span>Cathode Ray Tube (CRT TV)</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold uppercase">
          Raster Monitor
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Monitor Types:</span>
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
                    scanlineOpacity: p.scanlineOpacity,
                    curvatureDepth: p.curvatureDepth,
                    showRollBar: p.showRollBar,
                    showRgbTriad: p.showRgbTriad,
                    rollSpeed: p.rollSpeed,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSel
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:border-amber-500/40 hover:text-[var(--text)]'
                }`}
              >
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9px] line-clamp-1 opacity-70 mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scanline Opacity Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Scanline Density:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{Math.round(scanlineOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.10"
          max="0.85"
          step="0.05"
          value={scanlineOpacity}
          onChange={(e) => onChange({ scanlineOpacity: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Tube Glass Curvature Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Tube Glass Curvature Vignette:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{Math.round(curvatureDepth * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.20"
          max="1.0"
          step="0.05"
          value={curvatureDepth}
          onChange={(e) => onChange({ curvatureDepth: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => onChange({ showRollBar: !showRollBar, preset: 'custom' })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            showRollBar
              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showRollBar ? 'V-Hold Roll Active' : 'V-Hold Roll Off'}
        </button>

        <button
          type="button"
          onClick={() => onChange({ showRgbTriad: !showRgbTriad, preset: 'custom' })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            showRgbTriad
              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showRgbTriad ? 'RGB Triads Active' : 'RGB Triads Off'}
        </button>
      </div>
    </div>
  );
};

export const oldCrtTvFx: ScreenFxDefinition = {
  id: 'crt_tv',
  label: 'Old CRT TV screen',
  description: 'Vintage cathode ray tube raster with RGB triads, rolling V-hold bar, and curved glass vignette.',
  icon: GUI_ICONS.general.clapperboard,
  badgeColor: 'border-amber-600 bg-amber-950/80 text-amber-200',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  defaultParams: {
    preset: 'arcade',
    scanlineOpacity: 0.42,
    curvatureDepth: 0.65,
    showRollBar: false,
    showRgbTriad: true,
  },
  component: OldCrtTvComponent,
  inspector: OldCrtTvInspector,
};
