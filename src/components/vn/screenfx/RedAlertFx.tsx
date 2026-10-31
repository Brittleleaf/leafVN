'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const RedAlertComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  const preset = params?.preset || 'lockdown';
  const alertColor = params?.alertColor || (preset === 'biohazard' ? '#ea580c' : '#dc2626');
  const pulseSpeed = params?.pulseSpeed ?? (preset === 'meltdown' ? 0.7 : preset === 'silent' ? 2.4 : 1.3);
  const beaconSpeed = params?.beaconSpeed ?? (preset === 'silent' ? 4.5 : preset === 'meltdown' ? 1.5 : 2.5);
  const showBeacon = params?.showBeacon ?? true;
  const alertOpacity = (params?.alertOpacity ?? (intensity === 'light' ? 0.55 : intensity === 'heavy' ? 0.95 : 0.8)) * intensityMultiplier;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* 
        1. Rotating Emergency Beacon Sweep (Volumetric Light Cone)
        Oversized (-30% bounds, 160% size) so rotating sweep NEVER shows corners.
      */}
      {showBeacon && (
        <div
          className="absolute"
          style={{
            top: '-30%',
            left: '-30%',
            width: '160%',
            height: '160%',
            animation: `beaconSweep ${beaconSpeed}s linear infinite`,
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${alertColor}00 40deg, ${alertColor}66 75deg, ${alertColor}dd 90deg, ${alertColor}44 105deg, transparent 150deg)`,
            mixBlendMode: 'screen',
            opacity: 0.65 * intensityMultiplier,
          }}
        />
      )}

      {/* 
        2. Rhythmic Ambient Hazard Pulse
      */}
      <div
        className="absolute inset-0"
        style={{
          animation: `hazardPulse ${pulseSpeed}s ease-in-out infinite`,
          backgroundColor: `${alertColor}44`,
          opacity: alertOpacity,
        }}
      />

      {/* 
        3. Deep Feathered Emergency Vignette
        Multi-stop organic falloff with NO sharp borders or box outlines.
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, ${alertColor}33 70%, ${alertColor}bb 92%, ${alertColor}ee 100%)`,
          opacity: Math.min(1, alertOpacity * 1.1),
        }}
      />

      {/* 4. High-Power Flash Reflection Peak */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${alertColor}55 0%, transparent 70%)`,
          animation: `strobeFlash ${pulseSpeed}s ease-in-out infinite`,
          mixBlendMode: 'screen',
          opacity: 0.8 * intensityMultiplier,
        }}
      />

      <style jsx global>{`
        @keyframes beaconSweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes hazardPulse {
          0%, 100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.85;
          }
        }

        @keyframes strobeFlash {
          0%, 100% {
            opacity: 0.1;
          }
          48%, 52% {
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
};

export const RedAlertInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const currentPreset = params?.preset || 'lockdown';
  const alertColor = params?.alertColor || '#dc2626';
  const pulseSpeed = params?.pulseSpeed ?? 1.3;
  const beaconSpeed = params?.beaconSpeed ?? 2.5;
  const showBeacon = params?.showBeacon ?? true;
  const alertOpacity = params?.alertOpacity ?? 0.8;

  const presets = [
    {
      id: 'lockdown',
      label: 'Facility Lockdown',
      desc: 'Revolving industrial emergency beacon with rhythmic strobe',
      alertColor: '#dc2626',
      pulseSpeed: 1.3,
      beaconSpeed: 2.5,
      showBeacon: true,
      alertOpacity: 0.80,
    },
    {
      id: 'meltdown',
      label: 'Core Meltdown',
      desc: 'Rapid catastrophic strobe with high-intensity warning',
      alertColor: '#ef4444',
      pulseSpeed: 0.65,
      beaconSpeed: 1.4,
      showBeacon: true,
      alertOpacity: 0.95,
    },
    {
      id: 'silent',
      label: 'Silent Breach',
      desc: 'Ominous slow-breathing crimson alert in dark facility',
      alertColor: '#991b1b',
      pulseSpeed: 2.6,
      beaconSpeed: 4.8,
      showBeacon: true,
      alertOpacity: 0.65,
    },
    {
      id: 'biohazard',
      label: 'Biohazard Amber',
      desc: 'Toxic orange-crimson contamination alert signal',
      alertColor: '#ea580c',
      pulseSpeed: 1.5,
      beaconSpeed: 3.0,
      showBeacon: true,
      alertOpacity: 0.85,
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.hazard} className="w-4 h-4" />
          <span>Emergency Siren & Red Alert</span>
        </label>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 font-bold uppercase">
          Revolving Beacon
        </span>
      </div>

      {/* Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Alert Protocols:</span>
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
                    alertColor: p.alertColor,
                    pulseSpeed: p.pulseSpeed,
                    beaconSpeed: p.beaconSpeed,
                    showBeacon: p.showBeacon,
                    alertOpacity: p.alertOpacity,
                  })
                }
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSel
                    ? 'border-red-400 bg-red-500/20 text-red-200 ring-1 ring-red-400/50 shadow-sm'
                    : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:border-red-500/40 hover:text-[var(--text)]'
                }`}
              >
                <div className="text-[11px] font-bold text-white">{p.label}</div>
                <div className="text-[9px] line-clamp-1 opacity-70 mt-0.5">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pulse Rhythm Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Pulse Rate:</span>
          <span className="text-[11px] font-mono font-bold text-red-400">{pulseSpeed.toFixed(2)}s</span>
        </div>
        <input
          type="range"
          min="0.4"
          max="3.5"
          step="0.1"
          value={pulseSpeed}
          onChange={(e) => onChange({ pulseSpeed: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-red-500"
        />
      </div>

      {/* Beacon Sweep Speed Slider */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Beacon Rotation Speed:</span>
          <span className="text-[11px] font-mono font-bold text-red-400">{beaconSpeed.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min="0.8"
          max="6.0"
          step="0.2"
          value={beaconSpeed}
          onChange={(e) => onChange({ beaconSpeed: parseFloat(e.target.value), preset: 'custom' })}
          className="w-full h-1.5 bg-[var(--well-bg)] rounded-lg appearance-none cursor-pointer accent-red-500"
        />
      </div>

      {/* Revolving Sweep Light Cone Toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Revolving Light Cone:</span>
        <button
          type="button"
          onClick={() => onChange({ showBeacon: !showBeacon, preset: 'custom' })}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
            showBeacon
              ? 'border-red-400 bg-red-500/20 text-red-300 ring-1 ring-red-400/40'
              : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {showBeacon ? 'Active' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};

export const redAlertFx: ScreenFxDefinition = {
  id: 'red_alert',
  label: 'Red Alert / Siren',
  description: 'Revolving emergency light beacon, crimson warning pulse, and feathered hazard vignette.',
  icon: GUI_ICONS.general.hazard,
  badgeColor: 'border-red-600 bg-red-950/80 text-red-200',
  defaultSfx: '/assets/sfx/ERROR RING.mp3',
  defaultParams: {
    preset: 'lockdown',
    alertColor: '#dc2626',
    pulseSpeed: 1.3,
    beaconSpeed: 2.5,
    showBeacon: true,
    alertOpacity: 0.8,
  },
  component: RedAlertComponent,
  inspector: RedAlertInspector,
};
