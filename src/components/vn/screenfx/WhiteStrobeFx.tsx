'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const WhiteStrobeComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'lightning';
  const tint = params?.tint || (preset === 'welding' ? '#e0f2fe' : preset === 'paparazzi' ? '#ffffff' : '#f8fafc');
  const flashSpeed = params?.flashSpeed ?? (preset === 'strobe' ? 0.35 : preset === 'paparazzi' ? 1.6 : 2.2);
  const flashBrightness = (params?.flashBrightness ?? (intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.0 : 0.85)) * intensityMultiplier;

  let animName = 'fxLightningBolt';
  if (preset === 'paparazzi') animName = 'fxCameraFlash';
  else if (preset === 'strobe') animName = 'fxIndustrialStrobe';
  else if (preset === 'welding') animName = 'fxElectricArc';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 1. Main Blinding Flash Layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: tint,
          animation: `${animName} ${flashSpeed}s linear infinite`,
          opacity: Math.min(1, flashBrightness),
        }}
      />

      {/* 2. Retinal Afterglow Lens Bloom - Feathered radial center falloff */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${tint} 0%, transparent 75%)`,
          animation: `${animName} ${flashSpeed}s ease-out infinite`,
          mixBlendMode: 'screen',
          opacity: 0.6 * intensityMultiplier,
        }}
      />

      <style jsx global>{`
        /* Thunderstorm Lightning: Strike 1 -> Dip -> Double Main Flash -> Rumbling Falloff */
        @keyframes fxLightningBolt {
          0%, 68%, 100% {
            opacity: 0;
          }
          70% {
            opacity: 0.65;
          }
          72% {
            opacity: 0.15;
          }
          74% {
            opacity: 0.98;
          }
          78% {
            opacity: 0.85;
          }
          82% {
            opacity: 0.3;
          }
          86% {
            opacity: 0.6;
          }
          92% {
            opacity: 0.08;
          }
        }

        /* Camera Flash: Instant peak pop (0ms) -> Exponential retinal decay */
        @keyframes fxCameraFlash {
          0%, 82%, 100% {
            opacity: 0;
          }
          84% {
            opacity: 1;
          }
          86% {
            opacity: 0.55;
          }
          90% {
            opacity: 0.18;
          }
          96% {
            opacity: 0.02;
          }
        }

        /* Industrial / Rave Strobe: Sharp square rhythmic pulses */
        @keyframes fxIndustrialStrobe {
          0%, 48%, 100% {
            opacity: 0;
          }
          10%, 40% {
            opacity: 0.95;
          }
        }

        /* Electric Arc / Welding: High frequency rapid buzzing spikes */
        @keyframes fxElectricArc {
          0%, 100% { opacity: 0.05; }
          12% { opacity: 0.8; }
          18% { opacity: 0.2; }
          25% { opacity: 0.95; }
          32% { opacity: 0.4; }
          45% { opacity: 0.85; }
          60% { opacity: 0.1; }
          75% { opacity: 0.7; }
          88% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export const WhiteStrobeInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'lightning';
  const flashSpeed = params?.flashSpeed ?? 2.2;
  const flashBrightness = params?.flashBrightness ?? 0.85;
  const currentTint = params?.tint || '#ffffff';

  const presets = [
    {
      id: 'lightning',
      label: 'Thunderstorm',
      desc: 'Chaotic realistic multi-strike lightning with atmospheric decay',
      flashSpeed: 2.2,
      flashBrightness: 0.90,
      tint: '#f8fafc',
    },
    {
      id: 'paparazzi',
      label: 'Camera Flash',
      desc: 'Instant camera burst with exponential phosphor fadeout',
      flashSpeed: 1.6,
      flashBrightness: 0.95,
      tint: '#ffffff',
    },
    {
      id: 'strobe',
      label: 'Industrial Strobe',
      desc: 'Rhythmic strobe cadence for club, warning, or alarms',
      flashSpeed: 0.35,
      flashBrightness: 0.85,
      tint: '#ffffff',
    },
    {
      id: 'welding',
      label: 'High Voltage Arc',
      desc: 'Electric blue buzzing flash of sparking transformers',
      flashSpeed: 0.8,
      flashBrightness: 0.80,
      tint: '#e0f2fe',
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4" />
          <span>Optical Strobe & Lightning FX</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold uppercase">
          Dynamic Burst
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Strobe Modes:</span>
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
                    flashSpeed: p.flashSpeed,
                    flashBrightness: p.flashBrightness,
                    tint: p.tint,
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

      {/* Flash Interval Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Cadence Interval:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{flashSpeed.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0.15"
          max="4.0"
          step="0.05"
          value={flashSpeed}
          onChange={(e) => onChange({ flashSpeed: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Flash Peak Brightness Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Peak Brightness:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{Math.round(flashBrightness * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          value={flashBrightness}
          onChange={(e) => onChange({ flashBrightness: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Flash Tint Selector */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Light Temperature / Tint:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'Pure White', hex: '#ffffff', bg: 'bg-white text-black' },
            { label: 'Sky Blue', hex: '#e0f2fe', bg: 'bg-sky-200 text-sky-950' },
            { label: 'Tungsten Warm', hex: '#fef3c7', bg: 'bg-amber-100 text-amber-950' },
            { label: 'Lightning Violet', hex: '#f3e8ff', bg: 'bg-purple-200 text-purple-950' },
          ].map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange({ tint: c.hex, preset: 'custom' })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                currentTint === c.hex ? 'ring-2 ring-amber-400 scale-105' : 'opacity-80 hover:opacity-100'
              } ${c.bg}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const whiteStrobeFx: ScreenFxDefinition = {
  id: 'white_strobe',
  label: 'Strobe Flash',
  description: 'Optical flashes with exponential retinal decay curves, thunderstorm lightning, and paparazzi burst modes.',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'border-amber-400 bg-amber-950/80 text-amber-200',
  defaultSfx: '/assets/sfx/corrupt file.mp3',
  defaultParams: {
    preset: 'lightning',
    tint: '#f8fafc',
    flashSpeed: 2.2,
    flashBrightness: 0.85,
  },
  component: WhiteStrobeComponent,
  inspector: WhiteStrobeInspector,
};
