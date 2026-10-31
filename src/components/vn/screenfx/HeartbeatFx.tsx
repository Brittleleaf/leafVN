'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const HeartbeatComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'elevated';
  const bpm = params?.bpm ?? (preset === 'dread' ? 58 : preset === 'panic' ? 148 : preset === 'arrhythmia' ? 95 : 100);
  const cycleDuration = 60 / Math.max(40, bpm);
  const vignetteDepth = (params?.vignetteDepth ?? (intensity === 'light' ? 0.6 : intensity === 'heavy' ? 0.95 : 0.8)) * intensityMultiplier;
  const enableDefocus = params?.enableDefocus ?? true;
  const bloodColor = params?.bloodColor || '#881337'; // Rose 900 crimson

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 
        Oversized Blood Vignette with Double Systolic Pulse (Lub-Dub):
        -20% margin, 140% bounds prevent any sharp edge clipping during pulsation scale.
      */}
      <div
        className="absolute"
        style={{
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '140%',
          animation: `cardiacLubDub ${cycleDuration}s cubic-bezier(0.22, 1, 0.36, 1) infinite`,
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(159, 18, 57, 0.45) 70%, ${bloodColor} 100%)`,
          opacity: Math.min(1, vignetteDepth),
        }}
      />

      {/* Systolic Flash Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, rgba(244, 63, 94, 0.12) 0%, rgba(190, 18, 60, 0.35) 80%, rgba(76, 5, 25, 0.8) 100%)`,
          animation: `cardiacFlash ${cycleDuration}s cubic-bezier(0.22, 1, 0.36, 1) infinite`,
          opacity: 0.7 * intensityMultiplier,
        }}
      />

      {/* Pupil Dilation Defocus Blur Shroud */}
      {enableDefocus && (
        <div
          className="absolute inset-0 backdrop-blur-[1.5px]"
          style={{
            maskImage: 'radial-gradient(ellipse at center, transparent 45%, black 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 45%, black 85%)',
            animation: `cardiacBlur ${cycleDuration}s ease-in-out infinite`,
          }}
        />
      )}

      <style jsx global>{`
        @keyframes cardiacLubDub {
          0% {
            transform: scale(1);
            opacity: 0.35;
          }
          /* First Beat: Lub */
          12% {
            transform: scale(1.045);
            opacity: 0.95;
          }
          22% {
            transform: scale(1.01);
            opacity: 0.45;
          }
          /* Second Beat: Dub (Sharper & Stronger) */
          34% {
            transform: scale(1.06);
            opacity: 1;
          }
          50% {
            transform: scale(1.005);
            opacity: 0.4;
          }
          /* Diastolic Rest */
          100% {
            transform: scale(1);
            opacity: 0.35;
          }
        }

        @keyframes cardiacFlash {
          0%, 55%, 100% {
            opacity: 0;
          }
          12% {
            opacity: 0.55;
          }
          34% {
            opacity: 0.85;
          }
        }

        @keyframes cardiacBlur {
          0%, 50%, 100% {
            opacity: 0.2;
          }
          12%, 34% {
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};

export const HeartbeatInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'elevated';
  const bpm = params?.bpm ?? 100;
  const vignetteDepth = params?.vignetteDepth ?? 0.8;
  const enableDefocus = params?.enableDefocus ?? true;

  const presets = [
    {
      id: 'dread',
      label: 'Resting Dread',
      desc: '58 BPM: Slow deep physiological pulsation in darkness',
      bpm: 58,
      vignetteDepth: 0.85,
      enableDefocus: true,
      bloodColor: '#881337',
    },
    {
      id: 'elevated',
      label: 'Elevated Pulse',
      desc: '100 BPM: Rising tension and confrontation anxiety',
      bpm: 100,
      vignetteDepth: 0.80,
      enableDefocus: true,
      bloodColor: '#9f1239',
    },
    {
      id: 'panic',
      label: 'Panic Surge',
      desc: '150 BPM: Extreme adrenaline spike and survival dread',
      bpm: 150,
      vignetteDepth: 0.95,
      enableDefocus: true,
      bloodColor: '#be123c',
    },
    {
      id: 'subtle',
      label: 'Subtle Pulse',
      desc: '72 BPM: Mild subconscious tension without deep darkness',
      bpm: 72,
      vignetteDepth: 0.50,
      enableDefocus: false,
      bloodColor: '#701a75',
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.heart} className="w-4 h-4" />
          <span>Cardiovascular Heartbeat FX</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold uppercase">
          {bpm} BPM
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Cardiac States:</span>
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
                    bpm: p.bpm,
                    vignetteDepth: p.vignetteDepth,
                    enableDefocus: p.enableDefocus,
                    bloodColor: p.bloodColor,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSel
                    ? 'border-rose-400 bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/50 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:border-rose-500/40 hover:text-[var(--text)]'
                }`}
              >
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9px] line-clamp-1 opacity-70 mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BPM Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Heart Rate:</span>
          <span className="text-[11px] font-mono font-bold text-rose-400">{bpm} BPM</span>
        </div>
        <input
          type="range"
          min="45"
          max="180"
          step="1"
          value={bpm}
          onChange={(e) => onChange({ bpm: parseInt(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
      </div>

      {/* Vignette Depth Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Peripheral Tunnel Constriction:</span>
          <span className="text-[11px] font-mono font-bold text-rose-400">{Math.round(vignetteDepth * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.25"
          max="1.0"
          step="0.05"
          value={vignetteDepth}
          onChange={(e) => onChange({ vignetteDepth: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
      </div>

      {/* Dilation Defocus Blur Toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Pupil Dilation Defocus:</span>
        <button
          type="button"
          onClick={() => onChange({ enableDefocus: !enableDefocus, preset: 'custom' })}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
            enableDefocus
              ? 'border-rose-400 bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {enableDefocus ? 'Active' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};

export const heartbeatFx: ScreenFxDefinition = {
  id: 'heartbeat',
  label: 'Tension Heartbeat',
  description: 'Physiological lub-dub double cardiac pulse with peripheral tunnel constriction and systolic defocus.',
  icon: GUI_ICONS.general.heart,
  badgeColor: 'border-rose-600 bg-rose-950/80 text-rose-200',
  defaultSfx: '',
  defaultParams: {
    preset: 'elevated',
    bpm: 100,
    vignetteDepth: 0.8,
    enableDefocus: true,
  },
  component: HeartbeatComponent,
  inspector: HeartbeatInspector,
};
