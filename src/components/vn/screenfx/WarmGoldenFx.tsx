'use client';

import React, { useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const WarmGoldenComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'sunset';
  const glowColor = params?.glowColor || (preset === 'revelation' ? '#fef08a' : preset === 'temple' ? '#d97706' : '#fbbf24');
  const glowIntensity = (params?.glowIntensity ?? (intensity === 'light' ? 0.55 : intensity === 'heavy' ? 0.95 : 0.75)) * intensityMultiplier;
  const showGodrays = params?.showGodrays ?? true;
  const showMotes = params?.showMotes ?? true;
  const shimmerSpeed = params?.shimmerSpeed ?? (preset === 'revelation' ? 2.5 : 4.0);

  // Floating golden dust motes
  const [motes] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      bottom: Math.random() * 100,
      size: 2 + Math.random() * 3.5,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 6,
      opacity: 0.35 + Math.random() * 0.55,
      driftX: -20 + Math.random() * 40,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 
        1. Volumetric Godrays / Angled Sunbeams
        Oversized (-25% bounds, 150% size) with feathered linear gradients.
      */}
      {showGodrays && (
        <div
          className="absolute"
          style={{
            top: '-25%',
            left: '-25%',
            width: '150%',
            height: '150%',
            background: `
              repeating-linear-gradient(
                125deg,
                ${glowColor}00 0px,
                ${glowColor}00 40px,
                ${glowColor}33 75px,
                ${glowColor}55 90px,
                ${glowColor}11 125px,
                ${glowColor}00 160px
              )
            `,
            mixBlendMode: 'screen',
            animation: `godrayShimmer ${shimmerSpeed}s ease-in-out infinite alternate`,
            opacity: Math.min(1, glowIntensity * 0.85),
          }}
        />
      )}

      {/* 
        2. Warm Atmospheric Golden Vignette & Center Bloom
        Multi-stop organic feathered radial glow.
      */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, ${glowColor}40 0%, ${glowColor}18 55%, transparent 75%, ${glowColor}30 100%)`,
          animation: `goldenAuraPulse ${shimmerSpeed * 0.8}s ease-in-out infinite alternate`,
          mixBlendMode: 'screen',
          opacity: Math.min(1, glowIntensity),
        }}
      />

      {/* 3. Floating Golden Dust Motes */}
      {showMotes &&
        motes.map((m) => (
          <div
            key={m.id}
            className="absolute rounded-full"
            style={{
              left: `${m.left}%`,
              bottom: `${m.bottom}%`,
              width: `${m.size}px`,
              height: `${m.size}px`,
              backgroundColor: glowColor,
              boxShadow: `0 0 ${m.size * 2}px ${glowColor}`,
              filter: 'blur(0.4px)',
              animation: `moteFloat ${m.duration}s ease-in-out infinite`,
              animationDelay: `${m.delay}s`,
              opacity: m.opacity * glowIntensity,
            }}
          />
        ))}

      <style jsx global>{`
        @keyframes godrayShimmer {
          0% {
            opacity: 0.35;
            transform: scale(1) rotate(0deg);
          }
          100% {
            opacity: 0.85;
            transform: scale(1.03) rotate(1.5deg);
          }
        }

        @keyframes goldenAuraPulse {
          0% {
            opacity: 0.55;
          }
          100% {
            opacity: 0.95;
          }
        }

        @keyframes moteFloat {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-80px) translateX(25px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const WarmGoldenInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'sunset';
  const glowColor = params?.glowColor || '#fbbf24';
  const glowIntensity = params?.glowIntensity ?? 0.75;
  const showGodrays = params?.showGodrays ?? true;
  const showMotes = params?.showMotes ?? true;
  const shimmerSpeed = params?.shimmerSpeed ?? 4.0;

  const presets = [
    {
      id: 'sunset',
      label: 'Golden Hour',
      desc: 'Nostalgic warm afternoon sunset with gentle sunbeam shimmer',
      glowColor: '#fbbf24',
      glowIntensity: 0.75,
      showGodrays: true,
      showMotes: true,
      shimmerSpeed: 4.0,
    },
    {
      id: 'revelation',
      label: 'Divine Epiphany',
      desc: 'Radiant celestial beams and floating luminous particles',
      glowColor: '#fef08a',
      glowIntensity: 0.92,
      showGodrays: true,
      showMotes: true,
      shimmerSpeed: 2.5,
    },
    {
      id: 'dream',
      label: 'Nostalgic Memory',
      desc: 'Dreamlike ethereal amber haze for flashbacks and sentimental moments',
      glowColor: '#f59e0b',
      glowIntensity: 0.65,
      showGodrays: false,
      showMotes: true,
      shimmerSpeed: 5.5,
    },
    {
      id: 'temple',
      label: 'Sacred Sanctuary',
      desc: 'Deep warm amber incense glow with subtle volumetric lighting',
      glowColor: '#d97706',
      glowIntensity: 0.85,
      showGodrays: true,
      showMotes: true,
      shimmerSpeed: 3.5,
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4" />
          <span>Volumetric Golden Aura & Sunbeams</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold uppercase">
          Atmospheric Bloom
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Luminous Atmosphere:</span>
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
                    glowColor: p.glowColor,
                    glowIntensity: p.glowIntensity,
                    showGodrays: p.showGodrays,
                    showMotes: p.showMotes,
                    shimmerSpeed: p.shimmerSpeed,
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

      {/* Glow Intensity Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Radiance Intensity:</span>
          <span className="text-[11px] font-mono font-bold text-amber-400">{Math.round(glowIntensity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.25"
          max="1.0"
          step="0.05"
          value={glowIntensity}
          onChange={(e) => onChange({ glowIntensity: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => onChange({ showGodrays: !showGodrays, preset: 'custom' })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            showGodrays
              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showGodrays ? 'Godrays Active' : 'Godrays Off'}
        </button>

        <button
          type="button"
          onClick={() => onChange({ showMotes: !showMotes, preset: 'custom' })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            showMotes
              ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showMotes ? 'Motes Active' : 'Motes Off'}
        </button>
      </div>
    </div>
  );
};

export const warmGoldenFx: ScreenFxDefinition = {
  id: 'warm_golden',
  label: 'Mystic Golden Glow',
  description: 'Volumetric sunbeams, floating golden dust motes, and warm nostalgic sunset aura with zero clipping.',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'border-amber-500 bg-amber-950/80 text-amber-100',
  defaultSfx: '/assets/sfx/success.mp3',
  defaultParams: {
    preset: 'sunset',
    glowColor: '#fbbf24',
    glowIntensity: 0.75,
    showGodrays: true,
    showMotes: true,
    shimmerSpeed: 4.0,
  },
  component: WarmGoldenComponent,
  inspector: WarmGoldenInspector,
};
