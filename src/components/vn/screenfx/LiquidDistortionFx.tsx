'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const LiquidDistortionComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  color,
  params,
}) => {
  // Intensity / scale calculation with smooth slider precedence
  const effectiveMultiplier = params?.intensityMultiplier ?? intensityMultiplier;
  const baseScale = params?.scale ?? (intensity === 'light' ? 16 : intensity === 'heavy' ? 52 : 30);
  const scale = Math.max(1, Math.round(baseScale * effectiveMultiplier));
  const durSec = params?.speed ?? (intensity === 'light' ? 8 : intensity === 'heavy' ? 4.5 : 6);
  const showCaustics = params?.caustics ?? true;

  // Color fusion & Hue shift controls
  const activeColor = params?.tintColor || params?.color || color;
  const hueRotateDeg = params?.hueRotate ?? 0;
  const isTintEnabled = Boolean(params?.tintEnabled ?? Boolean(activeColor || hueRotateDeg > 0));
  const tintOpacity = params?.tintOpacity ?? 0.35;
  const tintBlendMode = (params?.tintBlendMode as any) || 'color';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      <style jsx global>{`
        @keyframes liquidCausticsBreathe {
          0%, 100% {
            opacity: 0.12;
            transform: scale(1) translate(0, 0);
          }
          50% {
            opacity: 0.28;
            transform: scale(1.05) translate(-1%, 1%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-distortion-layer {
            filter: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* SVG Turbulence & Displacement Filter Definition */}
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        className="absolute w-0 h-0 pointer-events-none"
        style={{ position: 'absolute' }}
      >
        <defs>
          <filter id="liquid" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.015"
              numOctaves="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.015 0.015;0.021 0.018;0.015 0.015"
                dur={`${durSec}s`}
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Alias id for specificity */}
          <filter id="liquid_distortion" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.015"
              numOctaves="3"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.015 0.015;0.021 0.018;0.015 0.015"
                dur={`${durSec}s`}
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Backdrop Refraction Glass Layer */}
      <div
        className="absolute inset-0 pointer-events-none liquid-distortion-layer"
        style={{
          backdropFilter: 'url(#liquid)',
          WebkitBackdropFilter: 'url(#liquid)',
          filter: hueRotateDeg ? `hue-rotate(${hueRotateDeg}deg)` : undefined,
        }}
      />

      {/* Color Tint / Hue Fusion Overlay */}
      {isTintEnabled && activeColor && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: activeColor,
            mixBlendMode: tintBlendMode,
            opacity: tintOpacity,
            filter: hueRotateDeg ? `hue-rotate(${hueRotateDeg}deg)` : undefined,
          }}
        />
      )}

      {/* Underwater Caustics & Liquid Sheen Layer */}
      {showCaustics && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay transition-colors duration-300"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${activeColor || 'rgba(34, 211, 238, 0.28)'} 0%, rgba(6, 182, 212, 0.08) 45%, transparent 75%)`,
            animation: `liquidCausticsBreathe ${durSec}s ease-in-out infinite`,
            filter: hueRotateDeg ? `hue-rotate(${hueRotateDeg}deg)` : undefined,
          }}
        />
      )}
    </div>
  );
};

export const LiquidDistortionInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
}) => {
  const currentScale = params?.scale ?? 30;
  const currentSpeed = params?.speed ?? 6;
  const currentCaustics = params?.caustics ?? true;
  const currentMultiplier = params?.intensityMultiplier ?? 1.0;
  const currentHue = params?.hueRotate ?? 0;
  const currentTintColor = params?.tintColor || color || '#06b6d4';
  const isTintEnabled = params?.tintEnabled ?? Boolean(params?.tintColor || params?.hueRotate);
  const currentTintOpacity = params?.tintOpacity ?? 0.35;
  const currentBlendMode = params?.tintBlendMode || 'color';

  const PRESET_COLORS = [
    { label: 'Cyan Lagoon', hex: '#06b6d4' },
    { label: 'Deep Ocean', hex: '#0284c7' },
    { label: 'Toxic Emerald', hex: '#10b981' },
    { label: 'Blood Current', hex: '#ef4444' },
    { label: 'Alien Amethyst', hex: '#a855f7' },
    { label: 'Solar Amber', hex: '#f59e0b' },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={14} />
          <span>Liquid Distortion & Color Fusion</span>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)]">
          SVG Refraction
        </span>
      </div>

      {/* 1. CONTINUOUS INTENSITY SLIDER & PRESETS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Intensity Multiplier:</span>
          <span className="font-mono text-cyan-300 font-bold">{Math.round(currentMultiplier * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={currentMultiplier}
            onChange={(e) => onChange({ intensityMultiplier: parseFloat(e.target.value) })}
            className="flex-1 accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
          <button
            type="button"
            onClick={() => onChange({ intensityMultiplier: 1.0 })}
            className="text-[9px] font-mono text-[var(--muted2)] hover:text-white px-1.5 py-0.5 rounded border border-[var(--border)] cursor-pointer"
            title="Reset multiplier to 100%"
          >
            Reset
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {[
            { label: 'Light', scale: 16, mult: 0.6 },
            { label: 'Medium', scale: 30, mult: 1.0 },
            { label: 'Heavy', scale: 52, mult: 1.4 },
          ].map((lvl) => (
            <button
              key={lvl.label}
              type="button"
              onClick={() => onChange({ scale: lvl.scale, intensityMultiplier: lvl.mult })}
              className={`flex-1 py-1 rounded text-[10px] font-mono uppercase font-bold border transition-all cursor-pointer ${
                currentScale === lvl.scale && Math.abs(currentMultiplier - lvl.mult) < 0.15
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {lvl.label} ({lvl.scale}px)
            </button>
          ))}
        </div>
      </div>

      {/* 2. REFRACTION SCALE PIXELS SLIDER */}
      <div className="space-y-1 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Refraction Displacement (Scale):</span>
          <span className="font-mono text-cyan-300 font-bold">{currentScale}px</span>
        </div>
        <input
          type="range"
          min={5}
          max={80}
          step={1}
          value={currentScale}
          onChange={(e) => onChange({ scale: parseInt(e.target.value, 10) })}
          className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* 3. COLOR FUSION & HUE ROTATION */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.palette} size={12} className="text-cyan-400" />
            <span>Color Tint & Hue Fusion</span>
          </label>
          <button
            type="button"
            onClick={() => onChange({ tintEnabled: !isTintEnabled })}
            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
              isTintEnabled
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {isTintEnabled ? 'Tint Active' : 'Off'}
          </button>
        </div>

        {isTintEnabled && (
          <div className="space-y-2.5 p-2.5 rounded-xl bg-[var(--well-bg)] border border-[var(--border)]">
            {/* Color Swatches & Picker */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[var(--muted)] uppercase block font-medium">
                Tint Color Palette:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <input
                  type="color"
                  value={currentTintColor}
                  onChange={(e) => {
                    const c = e.target.value;
                    onChange({ tintColor: c });
                    onColorChange?.(c);
                  }}
                  className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer shrink-0"
                  title="Custom Color Picker"
                />
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => {
                      onChange({ tintColor: p.hex });
                      onColorChange?.(p.hex);
                    }}
                    style={{ backgroundColor: p.hex }}
                    className={`w-6 h-6 rounded-lg border transition-transform cursor-pointer ${
                      currentTintColor.toLowerCase() === p.hex.toLowerCase()
                        ? 'border-white scale-110 shadow-md ring-2 ring-cyan-400/50'
                        : 'border-black/40 hover:scale-105'
                    }`}
                    title={p.label}
                  />
                ))}
              </div>
            </div>

            {/* Hue Shift Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--muted)] font-semibold uppercase">Hue Spectrum Shift:</span>
                <span className="font-mono text-cyan-300 font-bold">{currentHue}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={currentHue}
                onChange={(e) => onChange({ hueRotate: parseInt(e.target.value, 10) })}
                className="w-full cursor-ew-resize h-2 rounded-lg"
                style={{
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                }}
              />
            </div>

            {/* Tint Opacity & Blend Mode */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)] text-[10px]">
              <div>
                <span className="text-[var(--muted)] uppercase block mb-1">Blend Opacity:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={currentTintOpacity}
                    onChange={(e) => onChange({ tintOpacity: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-ew-resize h-1.5 bg-[var(--card-bg)] rounded"
                  />
                  <span className="font-mono text-cyan-300 font-bold min-w-[2rem] text-right">
                    {Math.round(currentTintOpacity * 100)}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[var(--muted)] uppercase block mb-1">Blend Mode:</span>
                <select
                  value={currentBlendMode}
                  onChange={(e) => onChange({ tintBlendMode: e.target.value })}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded px-1.5 py-1 text-[10px] text-[var(--text)] outline-none"
                >
                  <option value="color">Color</option>
                  <option value="hue">Hue</option>
                  <option value="overlay">Overlay</option>
                  <option value="soft-light">Soft Light</option>
                  <option value="screen">Screen</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SPEED & WATER SHEEN */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[10px]">
        <div>
          <span className="text-[var(--muted)] uppercase block mb-1 font-semibold">Breathing Speed:</span>
          <select
            value={currentSpeed}
            onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-1.5 text-xs text-[var(--text)] outline-none font-mono"
          >
            <option value="3.5">Fast (3.5s)</option>
            <option value="6">Normal (6.0s)</option>
            <option value="10">Slow (10.0s)</option>
          </select>
        </div>

        <div>
          <span className="text-[var(--muted)] uppercase block mb-1 font-semibold">Water Sheen:</span>
          <button
            type="button"
            onClick={() => onChange({ caustics: !currentCaustics })}
            className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
              currentCaustics
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {currentCaustics ? 'Caustics ON' : 'Caustics OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const liquidDistortionFx: ScreenFxDefinition = {
  id: 'liquid_distortion',
  label: 'Liquid Distortion',
  description: 'Living fluid refraction surface with breathing Perlin noise displacement, hue tint fusion, and ripple physics.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-cyan-500 bg-cyan-950/80 text-cyan-200',
  defaultParams: {
    scale: 30,
    speed: 6,
    caustics: true,
    intensityMultiplier: 1.0,
    tintEnabled: false,
    tintColor: '#06b6d4',
    hueRotate: 0,
    tintOpacity: 0.35,
    tintBlendMode: 'color',
  },
  component: LiquidDistortionComponent,
  inspector: LiquidDistortionInspector,
};
