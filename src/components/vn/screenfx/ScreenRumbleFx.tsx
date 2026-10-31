'use client';

import React, { useEffect, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const ScreenRumbleComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'earthquake';
  const magnitude = (params?.magnitude ?? (intensity === 'light' ? 3 : intensity === 'heavy' ? 12 : 6)) * intensityMultiplier;
  const speed = params?.speed ?? (preset === 'micro' ? 0.08 : preset === 'collapse' ? 0.12 : 0.20);
  const rotationDeg = (params?.rotationDeg ?? (preset === 'micro' ? 0.15 : preset === 'collapse' ? 1.2 : 0.6)) * intensityMultiplier;
  const showDust = params?.showDust ?? (preset === 'collapse' || preset === 'earthquake');
  const vignetteIntensity = (params?.vignetteIntensity ?? 0.5) * intensityMultiplier;

  // Dust particles simulation
  const [dustParticles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1.5 + Math.random() * 3.5,
      delay: Math.random() * 3,
      duration: 1.2 + Math.random() * 1.8,
      opacity: 0.25 + Math.random() * 0.55,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 
        Oversized Container (-15% margins, 130% dimensions):
        Guarantees that intense seismic shakes (up to 20px translation and 2deg tilt) 
        NEVER expose the boundary edges of the canvas.
      */}
      <div
        className="absolute"
        style={{
          top: '-15%',
          left: '-15%',
          width: '130%',
          height: '130%',
          animation: `seismicRumble ${Math.max(0.06, speed)}s linear infinite`,
        }}
      >
        {/* Organic amber seismic tension vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 45%, rgba(180, 83, 9, 0.2) 80%, rgba(69, 26, 3, 0.6) 100%)',
            opacity: Math.min(1, vignetteIntensity),
          }}
        />

        {/* Falling seismic dust motes / rubble flakes */}
        {showDust &&
          dustParticles.map((d) => (
            <div
              key={d.id}
              className="absolute rounded-full bg-amber-100/70"
              style={{
                left: `${d.left}%`,
                top: '-5%',
                width: `${d.size}px`,
                height: `${d.size * 1.3}px`,
                opacity: d.opacity,
                filter: 'blur(0.6px)',
                animation: `dustFall ${d.duration}s linear infinite`,
                animationDelay: `${d.delay}s`,
              }}
            />
          ))}
      </div>

      <style jsx global>{`
        @keyframes seismicRumble {
          0%, 100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          15% {
            transform: translate(${-magnitude * 0.9}px, ${magnitude * 0.6}px) rotate(${-rotationDeg}deg);
          }
          30% {
            transform: translate(${magnitude}px, ${-magnitude * 0.7}px) rotate(${rotationDeg * 0.8}deg);
          }
          45% {
            transform: translate(${-magnitude * 0.7}px, ${-magnitude}px) rotate(${-rotationDeg * 0.5}deg);
          }
          60% {
            transform: translate(${magnitude * 0.8}px, ${magnitude * 0.7}px) rotate(${rotationDeg}deg);
          }
          75% {
            transform: translate(${-magnitude * 0.6}px, ${magnitude * 0.4}px) rotate(${-rotationDeg * 0.7}deg);
          }
          90% {
            transform: translate(${magnitude * 0.5}px, ${-magnitude * 0.6}px) rotate(${rotationDeg * 0.4}deg);
          }
        }

        @keyframes dustFall {
          0% {
            transform: translateY(0vh) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          85% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(115vh) translateX(25px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const ScreenRumbleInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'earthquake';
  const magnitude = params?.magnitude ?? 6;
  const speed = params?.speed ?? 0.20;
  const rotationDeg = params?.rotationDeg ?? 0.6;
  const showDust = params?.showDust ?? true;
  const vignetteIntensity = params?.vignetteIntensity ?? 0.5;

  const presets = [
    {
      id: 'micro',
      label: 'Micro Tremor',
      desc: 'High-frequency fine jitter (engine / distant rumbling)',
      magnitude: 3,
      speed: 0.08,
      rotationDeg: 0.2,
      showDust: false,
      vignetteIntensity: 0.35,
    },
    {
      id: 'earthquake',
      label: 'Earthquake',
      desc: 'Violent tectonic shock with moderate lateral heave',
      magnitude: 7,
      speed: 0.18,
      rotationDeg: 0.7,
      showDust: true,
      vignetteIntensity: 0.55,
    },
    {
      id: 'collapse',
      label: 'Seismic Collapse',
      desc: 'Catastrophic ground tremor with heavy debris flakes',
      magnitude: 14,
      speed: 0.12,
      rotationDeg: 1.4,
      showDust: true,
      vignetteIntensity: 0.80,
    },
    {
      id: 'hum',
      label: 'Low Hum Vibration',
      desc: 'Deep rhythmic pulse for suspense or dread',
      magnitude: 2.5,
      speed: 0.28,
      rotationDeg: 0.1,
      showDust: false,
      vignetteIntensity: 0.40,
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.hazard} className="w-4 h-4" />
          <span>Seismic Screen Rumble</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold uppercase">
          Tectonic Motion
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Seismic Presets:</span>
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
                    magnitude: p.magnitude,
                    speed: p.speed,
                    rotationDeg: p.rotationDeg,
                    showDust: p.showDust,
                    vignetteIntensity: p.vignetteIntensity,
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

      {/* Magnitude Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Shake Magnitude:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{magnitude}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={magnitude}
          onChange={(e) => onChange({ magnitude: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Vibration Frequency Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Vibration Speed:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{speed.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0.05"
          max="0.40"
          step="0.01"
          value={speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Falling Rubble Dust Toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Falling Dust & Debris:</span>
        <button
          type="button"
          onClick={() => onChange({ showDust: !showDust, preset: 'custom' })}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
            showDust
              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showDust ? 'Active' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};

export const screenRumbleFx: ScreenFxDefinition = {
  id: 'screen_rumble',
  label: 'Continuous Screen Rumble',
  description: 'Sustained seismic shake, camera tremor, and falling debris motes with zero edge clipping.',
  icon: GUI_ICONS.general.hazard,
  badgeColor: 'border-yellow-600 bg-yellow-950/80 text-yellow-200',
  defaultSfx: '/assets/sfx/corrupt file.mp3',
  defaultParams: {
    preset: 'earthquake',
    magnitude: 6,
    speed: 0.20,
    rotationDeg: 0.6,
    showDust: true,
    vignetteIntensity: 0.5,
  },
  component: ScreenRumbleComponent,
  inspector: ScreenRumbleInspector,
};
