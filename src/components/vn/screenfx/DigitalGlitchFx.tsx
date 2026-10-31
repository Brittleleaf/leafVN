'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const DigitalGlitchComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'cyberpunk';
  const glitchSpeed = params?.glitchSpeed ?? (preset === 'corrupt' ? 0.18 : preset === 'subtle' ? 0.6 : 0.28);
  const rgbShift = (params?.rgbShift ?? (preset === 'corrupt' ? 6 : preset === 'subtle' ? 2 : 4)) * intensityMultiplier;
  const glitchOpacity = (params?.glitchOpacity ?? (intensity === 'light' ? 0.45 : intensity === 'heavy' ? 0.95 : 0.75)) * intensityMultiplier;
  const showScanlines = params?.showScanlines ?? true;
  const showSlices = params?.showSlices ?? true;

  const colorA = preset === 'matrix' ? '#10b981' : '#06b6d4'; // Cyan or Matrix Green
  const colorB = preset === 'matrix' ? '#059669' : '#ec4899'; // Pink or Dark Emerald

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 
        1. Chromatic Aberration RGB Shift Layers
        Oversized (-10% bounds, 120% size) so jitter translation NEVER exposes canvas borders.
      */}
      <div
        className="absolute"
        style={{
          top: '-10%',
          left: '-10%',
          width: '120%',
          height: '120%',
          animation: `fxGlitchChromatic ${glitchSpeed}s steps(3) infinite`,
          opacity: Math.min(1, glitchOpacity),
        }}
      >
        {/* Cyan Channel Shift */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            transform: `translateX(${-rgbShift}px)`,
            background: `radial-gradient(ellipse at center, ${colorA}15 0%, ${colorA}30 85%, ${colorA}66 100%)`,
          }}
        />

        {/* Magenta Channel Shift */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            transform: `translateX(${rgbShift}px)`,
            background: `radial-gradient(ellipse at center, ${colorB}15 0%, ${colorB}30 85%, ${colorB}66 100%)`,
          }}
        />
      </div>

      {/* 2. Cybernetic Raster Scanlines */}
      {showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              ${colorA}22 0px,
              ${colorA}22 2px,
              transparent 2px,
              transparent 5px
            )`,
            animation: 'fxScanlineDrift 1.5s linear infinite',
            opacity: Math.min(0.8, glitchOpacity * 0.7),
          }}
        />
      )}

      {/* 3. Horizontal Digital Slice Displacements */}
      {showSlices && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            animation: `fxGlitchSlices ${glitchSpeed * 1.5}s steps(2) infinite`,
            opacity: Math.min(0.9, glitchOpacity * 0.8),
          }}
        >
          <div
            className="absolute w-full bg-cyan-400/20 mix-blend-screen"
            style={{ top: '22%', height: '8px', transform: `translateX(${-rgbShift * 2}px)` }}
          />
          <div
            className="absolute w-full bg-pink-500/25 mix-blend-screen"
            style={{ top: '58%', height: '14px', transform: `translateX(${rgbShift * 1.8}px)` }}
          />
          <div
            className="absolute w-full bg-white/20 mix-blend-screen"
            style={{ top: '82%', height: '5px', transform: `translateX(${-rgbShift}px)` }}
          />
        </div>
      )}

      {/* 
        4. Feathered Edge Cyber Vignette
        Smooth feathered falloff replacing any hard border box outline.
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 65%, ${colorA}25 88%, ${colorA}70 100%)`,
          opacity: Math.min(1, glitchOpacity),
        }}
      />

      <style jsx global>{`
        @keyframes fxGlitchChromatic {
          0%, 100% {
            transform: translate(0px, 0px);
            opacity: 0.6;
          }
          20% {
            transform: translate(${-rgbShift * 0.5}px, ${rgbShift * 0.3}px);
            opacity: 0.95;
          }
          40% {
            transform: translate(${rgbShift * 0.7}px, ${-rgbShift * 0.4}px);
            opacity: 0.7;
          }
          65% {
            transform: translate(${-rgbShift * 0.8}px, ${-rgbShift * 0.3}px);
            opacity: 1;
          }
          85% {
            transform: translate(${rgbShift * 0.4}px, ${rgbShift * 0.6}px);
            opacity: 0.8;
          }
        }

        @keyframes fxScanlineDrift {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 30px;
          }
        }

        @keyframes fxGlitchSlices {
          0%, 65%, 100% {
            opacity: 0;
          }
          70%, 85% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export const DigitalGlitchInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'cyberpunk';
  const glitchSpeed = params?.glitchSpeed ?? 0.28;
  const rgbShift = params?.rgbShift ?? 4;
  const glitchOpacity = params?.glitchOpacity ?? 0.75;
  const showScanlines = params?.showScanlines ?? true;
  const showSlices = params?.showSlices ?? true;

  const presets = [
    {
      id: 'cyberpunk',
      label: 'Cyberpunk Neon',
      desc: 'Cyan and magenta chromatic aberration with cybernetic scanlines',
      glitchSpeed: 0.28,
      rgbShift: 4,
      glitchOpacity: 0.75,
      showScanlines: true,
      showSlices: true,
    },
    {
      id: 'corrupt',
      label: 'Data Corruption',
      desc: 'Aggressive channel tearing, horizontal slices, and buffer drops',
      glitchSpeed: 0.16,
      rgbShift: 8,
      glitchOpacity: 0.95,
      showScanlines: true,
      showSlices: true,
    },
    {
      id: 'subtle',
      label: 'Subtle Broadcast',
      desc: 'Gentle surveillance camera interference without heavy distraction',
      glitchSpeed: 0.55,
      rgbShift: 2,
      glitchOpacity: 0.45,
      showScanlines: true,
      showSlices: false,
    },
    {
      id: 'matrix',
      label: 'Terminal Matrix',
      desc: 'Emerald green phosphor mainframe data glitch',
      glitchSpeed: 0.32,
      rgbShift: 5,
      glitchOpacity: 0.80,
      showScanlines: true,
      showSlices: true,
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4" />
          <span>Digital Glitch & Chromatic Aberration</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
          RGB Split
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Glitch Modes:</span>
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
                    glitchSpeed: p.glitchSpeed,
                    rgbShift: p.rgbShift,
                    glitchOpacity: p.glitchOpacity,
                    showScanlines: p.showScanlines,
                    showSlices: p.showSlices,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSel
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:border-cyan-500/40 hover:text-[var(--text)]'
                }`}
              >
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9px] line-clamp-1 opacity-70 mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RGB Shift Distance Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Chromatic Split Distance:</span>
          <span className="text-[11px] font-mono font-bold text-cyan-400">{rgbShift}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          step="0.5"
          value={rgbShift}
          onChange={(e) => onChange({ rgbShift: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Glitch Frequency Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Jitter Frequency:</span>
          <span className="text-[11px] font-mono font-bold text-cyan-400">{glitchSpeed.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0.10"
          max="0.80"
          step="0.02"
          value={glitchSpeed}
          onChange={(e) => onChange({ glitchSpeed: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => onChange({ showScanlines: !showScanlines, preset: 'custom' })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            showScanlines
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showScanlines ? 'Scanlines Active' : 'Scanlines Off'}
        </button>

        <button
          type="button"
          onClick={() => onChange({ showSlices: !showSlices, preset: 'custom' })}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
            showSlices
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showSlices ? 'Displacement Slices' : 'Slices Off'}
        </button>
      </div>
    </div>
  );
};

export const digitalGlitchFx: ScreenFxDefinition = {
  id: 'digital_glitch',
  label: 'Digital Glitch / Static',
  description: 'Cybernetic chromatic aberration, horizontal displacement slices, and raster scanlines with zero edge clipping.',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'border-cyan-500 bg-cyan-950/80 text-cyan-200',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  defaultParams: {
    preset: 'cyberpunk',
    glitchSpeed: 0.28,
    rgbShift: 4,
    glitchOpacity: 0.75,
    showScanlines: true,
    showSlices: true,
  },
  component: DigitalGlitchComponent,
  inspector: DigitalGlitchInspector,
};
