'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const LiquidDistortionComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  // Configurable displacement scale & duration from params or intensity
  const baseScale = params?.scale ?? (intensity === 'light' ? 16 : intensity === 'heavy' ? 52 : 30);
  const scale = Math.round(baseScale * intensityMultiplier);
  const durSec = params?.speed ?? (intensity === 'light' ? 8 : intensity === 'heavy' ? 4.5 : 6);
  const showCaustics = params?.caustics ?? true;

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
        }}
      />

      {/* Underwater Caustics & Liquid Sheen Layer */}
      {showCaustics && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(34, 211, 238, 0.25) 0%, rgba(6, 182, 212, 0.1) 45%, transparent 75%)',
            animation: `liquidCausticsBreathe ${durSec}s ease-in-out infinite`,
          }}
        />
      )}
    </div>
  );
};

export const LiquidDistortionInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentScale = params?.scale ?? 30;
  const currentSpeed = params?.speed ?? 6;
  const currentCaustics = params?.caustics ?? true;

  return (
    <div className="space-y-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={12} />
          <span>Liquid Distortion Parameters</span>
        </span>
        <span className="text-[9px] font-mono text-[var(--muted2)]">SVG Refraction</span>
      </div>

      {/* Displacement Scale Slider */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[var(--muted)] font-semibold uppercase">Refraction Scale:</span>
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

      {/* Wave Duration / Cycle Speed */}
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[var(--muted)] font-semibold uppercase">Breathing Cycle:</span>
          <span className="font-mono text-cyan-300 font-bold">{currentSpeed}s</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Fast (3.5s)', val: 3.5 },
            { label: 'Normal (6s)', val: 6 },
            { label: 'Slow (10s)', val: 10 },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onChange({ speed: s.val })}
              className={`py-1 rounded text-[10px] font-mono uppercase font-bold transition-all border ${
                currentSpeed === s.val
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {s.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Caustics Reflection Toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-[10px]">
        <span className="text-[var(--muted)] font-semibold uppercase">Water Surface Sheen:</span>
        <button
          type="button"
          onClick={() => onChange({ caustics: !currentCaustics })}
          className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border transition-colors ${
            currentCaustics
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
          }`}
        >
          {currentCaustics ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};

export const liquidDistortionFx: ScreenFxDefinition = {
  id: 'liquid_distortion',
  label: 'Liquid Distortion',
  description: 'Living fluid refraction surface with breathing Perlin noise displacement and underwater ripple physics.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-cyan-500 bg-cyan-950/80 text-cyan-200',
  defaultParams: { scale: 30, speed: 6, caustics: true },
  component: LiquidDistortionComponent,
  inspector: LiquidDistortionInspector,
};
