'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// BLINK EYES SIMULATION TYPES & CONSTANTS
// ============================================================================

export type BlinkMode = 'tired' | 'struggling' | 'waking_up' | 'passing_out' | 'normal';

interface BlinkState {
  // 0 = wide open, 1 = completely closed shut
  closure: number;
  // Current vision blur in px
  blur: number;
  // Current brightness multiplier (0 to 1)
  brightness: number;
}

// ============================================================================
// BLINK EYES COMPONENT (POV Cinematic Eyelids & Vision Blur)
// ============================================================================

export const BlinkEyesComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  // Read configurable parameters
  const mode: BlinkMode = (params?.mode as BlinkMode) || 'tired';
  const speedMult = typeof params?.speed === 'number' ? params.speed : 1.0;
  const maxBlur = typeof params?.maxBlur === 'number' ? params.maxBlur : 10;
  const edgeFeather = typeof params?.edgeFeather === 'number' ? params.edgeFeather : 45;
  const vignetteStrength = typeof params?.vignetteStrength === 'number' ? params.vignetteStrength : 0.45;
  const manualBlinkTrigger = params?._triggerBlink;

  const levelMult = intensity === 'light' ? 0.7 : intensity === 'heavy' ? 1.3 : 1.0;
  const effectiveSpeed = speedMult * levelMult * intensityMultiplier;

  const [blinkState, setBlinkState] = useState<BlinkState>({
    closure: 0,
    blur: 0,
    brightness: 1,
  });

  const manualTriggerRef = useRef(0);

  useEffect(() => {
    if (manualBlinkTrigger) {
      manualTriggerRef.current = performance.now();
    }
  }, [manualBlinkTrigger]);

  useEffect(() => {
    let animId = 0;
    let startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      let closure = 0;
      let blur = 0;
      let brightness = 1.0;

      // Handle manual forced blink if triggered
      const timeSinceManual = (now - manualTriggerRef.current) / 1000;
      if (manualTriggerRef.current > 0 && timeSinceManual < 2.0) {
        // Smooth 1.8s manual heavy tired blink curve
        const progress = timeSinceManual / 1.8;
        if (progress < 0.35) {
          // Slow closing
          const t = progress / 0.35;
          closure = Math.sin((t * Math.PI) / 2);
        } else if (progress < 0.65) {
          // Linger shut
          closure = 1.0;
        } else {
          // Slow struggling reopen
          const t = (progress - 0.65) / 0.35;
          closure = 1.0 - Math.sin((t * Math.PI) / 2);
        }
        blur = closure * maxBlur;
        brightness = 1.0 - closure * 0.7;
      } else {
        // Mode-specific procedural timing curve
        switch (mode) {
          case 'tired': {
            // Cycle length ~5.5 seconds: long open with heavy droop -> slow shut -> linger -> slow recovery
            const cycleDuration = 5.5 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.45) {
              // Eyes open, subtle drowsy eye-weight flutter (0 to 0.15 closure)
              closure = 0.08 + Math.sin(p * Math.PI * 4) * 0.06;
              blur = 0;
              brightness = 1.0;
            } else if (p < 0.65) {
              // Slow heavy droop closing (takes ~1.1s)
              const t = (p - 0.45) / 0.2;
              closure = 0.14 + (1.0 - 0.14) * (t * t); // ease-in heavy gravity
              blur = t * maxBlur;
              brightness = 1.0 - t * 0.8;
            } else if (p < 0.78) {
              // Linger shut in sleepy darkness (takes ~0.7s)
              closure = 1.0;
              blur = maxBlur;
              brightness = 0.1;
            } else {
              // Struggle to reopen: eyes open slowly, blur lingers then refocuses
              const t = (p - 0.78) / 0.22;
              closure = 1.0 - Math.sqrt(t); // sluggish opening
              // Refocus delay: blur stays higher for a moment
              blur = Math.max(0, (1.0 - t * 0.85) * maxBlur);
              brightness = 0.3 + t * 0.7;
            }
            break;
          }

          case 'struggling': {
            // Double-flutter blink: droop -> blink -> quick flutter blink -> open
            const cycleDuration = 4.2 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.4) {
              closure = 0.05 + Math.sin(p * Math.PI * 6) * 0.05;
              blur = 0;
            } else if (p < 0.55) {
              // First blink
              const t = (p - 0.4) / 0.15;
              closure = Math.sin(t * Math.PI);
              blur = closure * maxBlur;
            } else if (p < 0.65) {
              // Brief half-open gap
              closure = 0.25;
              blur = maxBlur * 0.3;
            } else if (p < 0.8) {
              // Second sharper blink
              const t = (p - 0.65) / 0.15;
              closure = Math.sin(t * Math.PI);
              blur = closure * maxBlur * 0.8;
            } else {
              // Reopening
              const t = (p - 0.8) / 0.2;
              closure = (1.0 - t) * 0.25;
              blur = Math.max(0, (1.0 - t) * maxBlur * 0.4);
            }
            brightness = 1.0 - closure * 0.65;
            break;
          }

          case 'waking_up': {
            // Starts in complete blackness, blinks open twice, struggles to focus
            const cycleDuration = 6.5 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.25) {
              // Blackness
              closure = 1.0;
              blur = maxBlur * 1.3;
              brightness = 0.05;
            } else if (p < 0.45) {
              // First peek (sluggish slit of light)
              const t = (p - 0.25) / 0.2;
              closure = 1.0 - Math.sin(t * Math.PI) * 0.45; // opens to ~0.55
              blur = maxBlur * 1.2;
              brightness = 0.4;
            } else if (p < 0.55) {
              // Shut again
              closure = 1.0;
              blur = maxBlur;
              brightness = 0.1;
            } else if (p < 0.85) {
              // Full struggle open
              const t = (p - 0.55) / 0.3;
              closure = 1.0 - t;
              blur = (1.0 - t * 0.7) * maxBlur;
              brightness = 0.3 + t * 0.7;
            } else {
              // Fully open and focused
              closure = 0;
              blur = 0;
              brightness = 1.0;
            }
            break;
          }

          case 'passing_out': {
            // Blinks get progressively slower and heavier, fading out
            const cycleDuration = 8.0 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.3) {
              const t = p / 0.3;
              closure = Math.sin(t * Math.PI) * 0.6;
              blur = t * maxBlur * 0.5;
              brightness = 1.0 - t * 0.2;
            } else if (p < 0.65) {
              const t = (p - 0.3) / 0.35;
              closure = 0.2 + (1.0 - 0.2) * (t * t);
              blur = (0.5 + t * 0.5) * maxBlur;
              brightness = 0.8 - t * 0.6;
            } else {
              // Complete blackout
              closure = 1.0;
              blur = maxBlur * 1.2;
              brightness = 0.0;
            }
            break;
          }

          case 'normal':
          default: {
            // Natural relaxed blink: quick, soft, every 3.8s
            const cycleDuration = 3.8 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.88) {
              closure = 0;
              blur = 0;
            } else {
              const t = (p - 0.88) / 0.12;
              closure = Math.sin(t * Math.PI);
              blur = closure * (maxBlur * 0.4);
            }
            brightness = 1.0 - closure * 0.5;
            break;
          }
        }
      }

      setBlinkState({
        closure: Math.max(0, Math.min(1, closure)),
        blur: Math.max(0, blur),
        brightness: Math.max(0, Math.min(1, brightness)),
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, effectiveSpeed, maxBlur, manualBlinkTrigger]);

  // Convert closure (0 to 1) to eyelid positions
  // Upper eyelid moves from -52% down to 0% (meeting at center)
  // Lower eyelid moves from 52% up to 0% (meeting at center)
  const upperYPercent = -54 + blinkState.closure * 54;
  const lowerYPercent = 54 - blinkState.closure * 54;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Vision Focus Blur & Exposure Layer (Backdrop Filter) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: `blur(${blinkState.blur.toFixed(1)}px) brightness(${blinkState.brightness.toFixed(2)})`,
          WebkitBackdropFilter: `blur(${blinkState.blur.toFixed(1)}px) brightness(${blinkState.brightness.toFixed(2)})`,
        }}
      />

      {/* 2. Drowsy Tunnel Vision Vignette */}
      {vignetteStrength > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.95) 100%)',
            opacity: vignetteStrength + blinkState.closure * 0.35,
          }}
        />
      )}

      {/* 3. Upper Eyelid (Curved downwards with deep diffuse feathering) */}
      <div
        className="absolute left-[-15%] right-[-15%] top-0 h-[56%] bg-black pointer-events-none will-change-transform"
        style={{
          transform: `translateY(${upperYPercent}%)`,
          borderBottomLeftRadius: '50% 90px',
          borderBottomRightRadius: '50% 90px',
          boxShadow: `0 ${edgeFeather}px ${edgeFeather * 1.8}px ${edgeFeather * 0.8}px rgba(0, 0, 0, 0.98), 0 ${edgeFeather * 2}px ${edgeFeather * 3}px rgba(0, 0, 0, 0.75)`,
        }}
      />

      {/* 4. Lower Eyelid (Curved upwards with deep diffuse feathering) */}
      <div
        className="absolute left-[-15%] right-[-15%] bottom-0 h-[56%] bg-black pointer-events-none will-change-transform"
        style={{
          transform: `translateY(${lowerYPercent}%)`,
          borderTopLeftRadius: '50% 90px',
          borderTopRightRadius: '50% 90px',
          boxShadow: `0 -${edgeFeather}px ${edgeFeather * 1.8}px ${edgeFeather * 0.8}px rgba(0, 0, 0, 0.98), 0 -${edgeFeather * 2}px ${edgeFeather * 3}px rgba(0, 0, 0, 0.75)`,
        }}
      />

      {/* 5. Complete Darkness Veil when fully closed (eliminates any sub-pixel gap) */}
      {blinkState.closure >= 0.92 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            opacity: Math.min(1, (blinkState.closure - 0.92) / 0.08),
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// BLINK EYES INSPECTOR (Editor Controls)
// ============================================================================

export const BlinkEyesInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const currentMode: BlinkMode = (params?.mode as BlinkMode) || 'tired';
  const speed = typeof params?.speed === 'number' ? params.speed : 1.0;
  const maxBlur = typeof params?.maxBlur === 'number' ? params.maxBlur : 10;
  const edgeFeather = typeof params?.edgeFeather === 'number' ? params.edgeFeather : 45;
  const vignetteStrength = typeof params?.vignetteStrength === 'number' ? params.vignetteStrength : 0.45;

  const handleTriggerManualBlink = () => {
    playSfx?.('/assets/sfx/click intro.mp3', false, 0.25);
    onChange({ _triggerBlink: Date.now() });
  };

  const PRESET_STYLES: { label: string; mode: BlinkMode; subtitle: string; patch: Partial<Record<string, any>> }[] = [
    {
      label: 'Drowsy / Tired',
      mode: 'tired',
      subtitle: 'Slow Heavy Droop & Refocus Delay',
      patch: { mode: 'tired', speed: 1.0, maxBlur: 10, edgeFeather: 45, vignetteStrength: 0.5 },
    },
    {
      label: 'Waking Up',
      mode: 'waking_up',
      subtitle: 'From Blackout to Blurry Sight',
      patch: { mode: 'waking_up', speed: 1.1, maxBlur: 14, edgeFeather: 50, vignetteStrength: 0.6 },
    },
    {
      label: 'Struggling Awake',
      mode: 'struggling',
      subtitle: 'Double Flutter Blinks Against Sleep',
      patch: { mode: 'struggling', speed: 1.2, maxBlur: 8, edgeFeather: 40, vignetteStrength: 0.4 },
    },
    {
      label: 'Passing Out',
      mode: 'passing_out',
      subtitle: 'Sluggish Fade Into Darkness',
      patch: { mode: 'passing_out', speed: 0.9, maxBlur: 16, edgeFeather: 60, vignetteStrength: 0.75 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Blink Eyes (POV Tired Eyelids)</span>
        </span>
        <button
          type="button"
          onClick={handleTriggerManualBlink}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border border-amber-400/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm"
          title="Trigger an immediate heavy eye blink"
        >
          <span>👁️ Blink Now</span>
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          POV Consciousness Profiles:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.patch)}
              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer group ${
                currentMode === preset.mode
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <div className="text-[10px] font-bold group-hover:text-amber-300 truncate">
                {preset.label}
              </div>
              <div className="text-[9px] font-mono text-[var(--muted2)] truncate">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER 1: BLINK CADENCE & SPEED */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Blink Cadence & Rhythm:</span>
            <span className="text-amber-300 font-mono font-bold">{speed.toFixed(1)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.5× (Sluggish) - 2.5×</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.5}
          step={0.1}
          value={speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0.5× (Deep Sleepy)</span>
          <span>1.0× (Standard Drowsy)</span>
          <span>2.5× (Fast)</span>
        </div>
      </div>

      {/* SLIDER 2: VISION FOCUS BLUR */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Vision Blur When Closing:</span>
            <span className="text-amber-300 font-mono font-bold">{maxBlur}px</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0 - 18px</span>
        </div>
        <input
          type="range"
          min={0}
          max={18}
          step={1}
          value={maxBlur}
          onChange={(e) => onChange({ maxBlur: parseInt(e.target.value, 10) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0px (Crisp Eyes)</span>
          <span>10px (Heavy Fog)</span>
          <span>18px (Disoriented)</span>
        </div>
      </div>

      {/* SLIDER 3: EYELID EDGE FEATHERING (SOFTNESS) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Eyelid Edge Diffusion (Softness):</span>
            <span className="text-amber-300 font-mono font-bold">{edgeFeather}px</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">15 - 75px</span>
        </div>
        <input
          type="range"
          min={15}
          max={75}
          step={5}
          value={edgeFeather}
          onChange={(e) => onChange({ edgeFeather: parseInt(e.target.value, 10) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>15px (Sharper)</span>
          <span>45px (Organic Soft)</span>
          <span>75px (Deeply Diffuse)</span>
        </div>
      </div>

      {/* SLIDER 4: PERIPHERAL TUNNEL VISION VIGNETTE */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Peripheral Drowsiness Vignette:</span>
            <span className="text-amber-300 font-mono font-bold">{Math.round(vignetteStrength * 100)}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0% - 100%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1.0}
          step={0.05}
          value={vignetteStrength}
          onChange={(e) => onChange({ vignetteStrength: parseFloat(e.target.value) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const blinkEyesFx: ScreenFxDefinition = {
  id: 'blink_eyes',
  label: 'Blink Eyes',
  description: 'First-person POV eyelids with organic soft feathering, drowsy blinking rhythm and dynamic vision blur',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  defaultSfx: '',
  defaultParams: {
    mode: 'tired',
    speed: 1.0,
    maxBlur: 10,
    edgeFeather: 45,
    vignetteStrength: 0.45,
  },
  component: BlinkEyesComponent,
  inspector: BlinkEyesInspector,
};
