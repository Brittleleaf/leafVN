'use client';

import React, { useId } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// GTAV SIREN PRESETS & TYPES
// ============================================================================

export type GtavSirenPreset = 'patrol' | 'pursuit' | 'heavy_chase' | 'ambient' | 'custom';
export type SirenStrobeMode = 'smooth_pulse' | 'wigwag';

export const GTAV_SIREN_PRESETS: Record<
  Exclude<GtavSirenPreset, 'custom'>,
  {
    label: string;
    description: string;
    icon: string;
    params: {
      speed: number;
      lightIntensity: number;
      strobeMode: SirenStrobeMode;
      blurAmount: number;
      whitePop: boolean;
    };
  }
> = {
  patrol: {
    label: 'Routine Patrol',
    description: 'Slow, steady alternating red and blue beacon sweep.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      speed: 0.8,
      lightIntensity: 0.65,
      strobeMode: 'smooth_pulse',
      blurAmount: 90,
      whitePop: false,
    },
  },
  pursuit: {
    label: 'Active Pursuit',
    description: 'Fast alternating police siren flash with white LED strobe pop.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      speed: 1.6,
      lightIntensity: 0.85,
      strobeMode: 'smooth_pulse',
      blurAmount: 85,
      whitePop: true,
    },
  },
  heavy_chase: {
    label: 'High-Speed Chase',
    description: 'Intense high-speed emergency wig-wag strobe with rapid flashes.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      speed: 2.5,
      lightIntensity: 1.0,
      strobeMode: 'wigwag',
      blurAmount: 80,
      whitePop: true,
    },
  },
  ambient: {
    label: 'Subtle Ambience',
    description: 'Soft red and blue emergency vehicle light reflections across the scene.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      speed: 1.0,
      lightIntensity: 0.45,
      strobeMode: 'smooth_pulse',
      blurAmount: 110,
      whitePop: false,
    },
  },
};

// ============================================================================
// GTAV SIREN COMPONENT
// ============================================================================

export const GtavSirenComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  const rawId = useId();
  const animKey = `gtav_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Read configurable parameters
  const levelMult = intensity === 'light' ? 0.65 : intensity === 'heavy' ? 1.4 : 1.0;
  const effectiveMultiplier = (params?.intensityMultiplier ?? 1.0) * levelMult * intensityMultiplier;

  const speed = Math.max(0.3, (params?.speed ?? 1.4));
  const lightIntensity = Math.max(0.1, Math.min(1.5, (params?.lightIntensity ?? 0.85) * effectiveMultiplier));
  const strobeMode: SirenStrobeMode = params?.strobeMode || 'smooth_pulse';
  const blurAmount = Math.max(30, Math.min(160, params?.blurAmount ?? 85));
  const whitePop = params?.whitePop ?? true;

  // Animation cycle duration in seconds (base: 3.2s / speed)
  const cycleDuration = Math.max(0.5, 3.2 / speed);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25">
      {/* Dynamic Keyframes for smooth or aggressive police strobe sweeps */}
      <style>{`
        @keyframes ${animKey}_pulseRed {
          0%, 100% {
            opacity: 0;
            transform: scale(1.15) translateX(-20%) rotate(-5deg);
          }
          18%, 32% {
            opacity: ${lightIntensity};
            transform: scale(1.15) translateX(-10%) rotate(-3deg);
          }
          50% {
            opacity: 0;
            transform: scale(1.15) translateX(0%) rotate(0deg);
          }
        }

        @keyframes ${animKey}_pulseBlue {
          0%, 100% {
            opacity: 0;
            transform: scale(1.15) translateX(20%) rotate(5deg);
          }
          40%, 54% {
            opacity: ${lightIntensity};
            transform: scale(1.15) translateX(10%) rotate(3deg);
          }
          72% {
            opacity: 0;
            transform: scale(1.15) translateX(0%) rotate(0deg);
          }
        }

        @keyframes ${animKey}_wigwagRed {
          0%, 2%, 12%, 14% {
            opacity: ${lightIntensity * 1.15};
            transform: scale(1.2) translateX(-12%) rotate(-4deg);
          }
          1%, 13% {
            opacity: 0.1;
          }
          15%, 50%, 100% {
            opacity: 0;
            transform: scale(1.2) translateX(-18%) rotate(-6deg);
          }
        }

        @keyframes ${animKey}_wigwagBlue {
          0%, 50% {
            opacity: 0;
            transform: scale(1.2) translateX(18%) rotate(6deg);
          }
          52%, 54%, 64%, 66% {
            opacity: ${lightIntensity * 1.15};
            transform: scale(1.2) translateX(12%) rotate(4deg);
          }
          53%, 65% {
            opacity: 0.1;
          }
          68%, 100% {
            opacity: 0;
            transform: scale(1.2) translateX(18%) rotate(6deg);
          }
        }

        @keyframes ${animKey}_whitePop {
          0%, 24%, 28%, 68%, 72%, 100% {
            opacity: 0;
          }
          26%, 70% {
            opacity: ${lightIntensity * 0.4};
          }
        }
      `}</style>

      {/* Red Siren Strobe Sweep (Oversized with blur to cover screen completely) */}
      <div
        className="pointer-events-none will-change-transform"
        style={{
          position: 'absolute',
          top: '-25%',
          left: '-25%',
          width: '150%',
          height: '150%',
          background: `radial-gradient(circle at 30% 50%, rgba(240, 35, 75, 0.95) 0%, rgba(200, 20, 50, 0.6) 35%, transparent 70%)`,
          filter: `blur(${blurAmount}px)`,
          animation: `${strobeMode === 'wigwag' ? `${animKey}_wigwagRed` : `${animKey}_pulseRed`} ${cycleDuration.toFixed(
            2
          )}s ease-in-out infinite`,
        }}
      />

      {/* Blue Siren Strobe Sweep (Oversized with blur to cover screen completely) */}
      <div
        className="pointer-events-none will-change-transform"
        style={{
          position: 'absolute',
          top: '-25%',
          left: '-25%',
          width: '150%',
          height: '150%',
          background: `radial-gradient(circle at 70% 50%, rgba(35, 115, 255, 0.95) 0%, rgba(20, 80, 220, 0.6) 35%, transparent 70%)`,
          filter: `blur(${blurAmount}px)`,
          animation: `${strobeMode === 'wigwag' ? `${animKey}_wigwagBlue` : `${animKey}_pulseBlue`} ${cycleDuration.toFixed(
            2
          )}s ease-in-out infinite`,
        }}
      />

      {/* Optional High-Intensity White LED Police Strobe Pop */}
      {whitePop && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            animation: `${animKey}_whitePop ${cycleDuration.toFixed(2)}s ease-out infinite`,
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// GTAV SIREN INSPECTOR
// ============================================================================

export const GtavSirenInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const currentPreset = (params?.preset as GtavSirenPreset) || 'pursuit';
  const currentMultiplier = params?.intensityMultiplier ?? 1.0;
  const speed = params?.speed ?? 1.4;
  const lightIntensity = params?.lightIntensity ?? 0.85;
  const strobeMode: SirenStrobeMode = params?.strobeMode || 'smooth_pulse';
  const blurAmount = params?.blurAmount ?? 85;
  const whitePop = params?.whitePop ?? true;

  const applyPreset = (presetKey: Exclude<GtavSirenPreset, 'custom'>) => {
    const p = GTAV_SIREN_PRESETS[presetKey];
    if (!p) return;
    onChange({
      preset: presetKey,
      ...p.params,
    });
    if (playSfx) {
      playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    }
  };

  return (
    <div className="space-y-4 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
            <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={15} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
              GTA V Police Siren
            </h4>
            <p className="text-[10px] text-[var(--muted)]">
              Alternating red/blue pursuit beacons with diffused glow and LED strobe pops
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 font-bold uppercase">
          Siren Strobe
        </span>
      </div>

      {/* 2. Presets Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
          Pursuit Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(GTAV_SIREN_PRESETS) as Array<Exclude<GtavSirenPreset, 'custom'>>).map((key) => {
            const p = GTAV_SIREN_PRESETS[key];
            const isSelected = currentPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-500/20 border-red-400 text-red-200 shadow-sm shadow-red-500/20'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--muted2)]'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <GuiIconRenderer icon={p.icon} size={12} className={isSelected ? 'text-red-300' : 'text-[var(--muted)]'} />
                  <span className="text-[11px] font-bold truncate">{p.label}</span>
                </div>
                <span className="text-[9px] text-[var(--muted)] line-clamp-1 mt-0.5 leading-tight">
                  {p.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Siren Speed & Light Intensity */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Flash Speed:</span>
            <span className="font-mono text-red-300 font-bold">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={3.0}
            step={0.1}
            value={speed}
            onChange={(e) => onChange({ preset: 'custom', speed: parseFloat(e.target.value) })}
            className="w-full accent-red-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Light Intensity:</span>
            <span className="font-mono text-red-300 font-bold">{Math.round(lightIntensity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.05}
            value={lightIntensity}
            onChange={(e) => onChange({ preset: 'custom', lightIntensity: parseFloat(e.target.value) })}
            className="w-full accent-red-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 4. Strobe Rhythm & Diffusion Blur */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-[var(--muted)] uppercase block">Strobe Rhythm:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange({ preset: 'custom', strobeMode: 'smooth_pulse' })}
              className={`flex-1 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                strobeMode === 'smooth_pulse'
                  ? 'bg-red-500/20 border-red-400 text-red-300'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
              }`}
            >
              Smooth Sweep
            </button>
            <button
              type="button"
              onClick={() => onChange({ preset: 'custom', strobeMode: 'wigwag' })}
              className={`flex-1 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                strobeMode === 'wigwag'
                  ? 'bg-red-500/20 border-red-400 text-red-300'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
              }`}
            >
              Wig-Wag
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Glow Blur:</span>
            <span className="font-mono text-red-300 font-bold">{blurAmount}px</span>
          </div>
          <input
            type="range"
            min={40}
            max={140}
            step={5}
            value={blurAmount}
            onChange={(e) => onChange({ preset: 'custom', blurAmount: parseInt(e.target.value) })}
            className="w-full accent-red-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 5. Toggles: White LED Pop */}
      <div className="pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold block text-[var(--text)]">White LED Strobe Pop</span>
            <span className="text-[9px] text-[var(--muted)]">High-intensity flash pops between red/blue cycles</span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ whitePop: !whitePop })}
            className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              whitePop
                ? 'bg-red-500/20 border-red-400 text-red-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {whitePop ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GTAV SIREN SCREEN FX REGISTRATION DEFINITION
// ============================================================================

export const gtavSirenFx: ScreenFxDefinition = {
  id: 'gtav_siren',
  label: 'GTAV Siren',
  description: 'Police chase sirens with alternating red/blue beacon sweeps, diffused glow, and strobe pops.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-red-500 bg-red-950/80 text-red-200',
  defaultParams: {
    preset: 'pursuit',
    speed: 1.4,
    lightIntensity: 0.85,
    strobeMode: 'smooth_pulse',
    blurAmount: 85,
    whitePop: true,
    intensityMultiplier: 1.0,
  },
  component: GtavSirenComponent,
  inspector: GtavSirenInspector,
};
