'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// BLINK EYES SIMULATION TYPES & CONSTANTS
// ============================================================================

export type BlinkMode = 'waking_up' | 'tired' | 'struggling' | 'passing_out' | 'normal';

interface BlinkState {
  // 0 = wide open (100% visible), 1 = completely closed shut (pitch black)
  closure: number;
  // Current vision blur in px
  blur: number;
  // Current brightness multiplier (0 to 1)
  brightness: number;
}

// ============================================================================
// BLINK EYES COMPONENT (POV Cinematic Eyelids & Dynamic Vision Blur)
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
  const edgeFeather = typeof params?.edgeFeather === 'number' ? params.edgeFeather : 35;
  const vignetteStrength = typeof params?.vignetteStrength === 'number' ? params.vignetteStrength : 0.15;
  // For one-shot narrative modes (waking_up, passing_out), default repeat is false
  const repeat = params?.repeat !== undefined ? params.repeat : (mode !== 'waking_up' && mode !== 'passing_out');
  const triggerKey = params?._triggerKey || 0;
  const manualBlinkTrigger = params?._triggerBlink;

  const levelMult = intensity === 'light' ? 0.7 : intensity === 'heavy' ? 1.3 : 1.0;
  const effectiveSpeed = Math.max(0.2, speedMult * levelMult * intensityMultiplier);

  const [blinkState, setBlinkState] = useState<BlinkState>(() => {
    // Initial state: waking_up starts fully closed; others start open
    if (mode === 'waking_up') {
      return { closure: 1.0, blur: maxBlur, brightness: 0.1 };
    }
    return { closure: 0, blur: 0, brightness: 1.0 };
  });

  const manualTriggerRef = useRef(0);

  useEffect(() => {
    if (manualBlinkTrigger) {
      manualTriggerRef.current = performance.now();
    }
  }, [manualBlinkTrigger]);

  useEffect(() => {
    let animId = 0;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      let closure = 0;
      let blur = 0;
      let brightness = 1.0;

      // 1. Check if user triggered a manual on-demand blink
      const timeSinceManual = (now - manualTriggerRef.current) / 1000;
      if (manualTriggerRef.current > 0 && timeSinceManual < 2.0) {
        const progress = timeSinceManual / 1.8;
        if (progress < 0.35) {
          // Slow heavy droop closing
          const t = progress / 0.35;
          closure = Math.sin((t * Math.PI) / 2);
        } else if (progress < 0.65) {
          // Linger shut in sleepy darkness
          closure = 1.0;
        } else {
          // Slow struggling reopen
          const t = (progress - 0.65) / 0.35;
          closure = 1.0 - Math.sin((t * Math.PI) / 2);
        }
        blur = closure * maxBlur;
        brightness = 1.0 - closure * 0.75;
      } else {
        // 2. Mode-specific procedural animation curves
        switch (mode) {
          case 'waking_up': {
            // Narrative Waking Up: Starts pitch black -> opens tiny slit -> blinks shut -> slowly opens fully -> focuses blur -> STAYS OPEN!
            const totalDuration = 4.8 / effectiveSpeed;
            const t = repeat ? elapsed % (totalDuration + 3.0) : Math.min(elapsed, totalDuration);

            if (t < 0.6 / effectiveSpeed) {
              // Darkness before opening eyes
              closure = 1.0;
              blur = maxBlur;
              brightness = 0.05;
            } else if (t < 1.6 / effectiveSpeed) {
              // First peek: opens a sleepy horizontal slit (to ~0.45), heavy blur
              const p = (t - 0.6 / effectiveSpeed) / (1.0 / effectiveSpeed);
              closure = 1.0 - Math.sin(p * Math.PI) * 0.55;
              blur = maxBlur * 1.1;
              brightness = 0.3 + (1.0 - closure) * 0.4;
            } else if (t < 2.2 / effectiveSpeed) {
              // Slips back shut for a moment
              closure = 1.0;
              blur = maxBlur;
              brightness = 0.1;
            } else if (t < 3.6 / effectiveSpeed) {
              // Final slow, deliberate opening to 100% wide open
              const p = (t - 2.2 / effectiveSpeed) / (1.4 / effectiveSpeed);
              closure = 1.0 - Math.sin((p * Math.PI) / 2); // reaches 0 (fully open)
              blur = maxBlur * (1.0 - p * 0.4); // blur stays high while opening
              brightness = 0.3 + p * 0.7;
            } else if (t < totalDuration) {
              // Eyes are now 100% wide open, but vision takes ~1.2s to refocus from blur to crystal clear!
              closure = 0; // completely open!
              const p = (t - 3.6 / effectiveSpeed) / (1.2 / effectiveSpeed);
              blur = Math.max(0, (1.0 - p) * (maxBlur * 0.6));
              brightness = 1.0;
            } else {
              // FINISHED: Stays 100% completely open, crisp and focused indefinitely!
              closure = 0;
              blur = 0;
              brightness = 1.0;
            }
            break;
          }

          case 'passing_out': {
            // Narrative Passing Out: Starts open -> blinks get heavier -> blinks linger -> seals shut -> STAYS BLACK!
            const totalDuration = 5.2 / effectiveSpeed;
            const t = repeat ? elapsed % (totalDuration + 3.0) : Math.min(elapsed, totalDuration);

            if (t < 1.4 / effectiveSpeed) {
              // Initial tired droop flutter
              const p = t / (1.4 / effectiveSpeed);
              closure = Math.sin(p * Math.PI) * 0.35;
              blur = p * maxBlur * 0.3;
              brightness = 1.0 - p * 0.15;
            } else if (t < 2.6 / effectiveSpeed) {
              // Heavier sluggish half-close
              const p = (t - 1.4 / effectiveSpeed) / (1.2 / effectiveSpeed);
              closure = 0.2 + Math.sin(p * Math.PI) * 0.6;
              blur = (0.3 + p * 0.4) * maxBlur;
              brightness = 0.85 - p * 0.3;
            } else if (t < 4.2 / effectiveSpeed) {
              // Lids sink and seal shut
              const p = (t - 2.6 / effectiveSpeed) / (1.6 / effectiveSpeed);
              closure = 0.3 + 0.7 * (p * p);
              blur = (0.7 + p * 0.3) * maxBlur;
              brightness = Math.max(0, 0.55 - p * 0.55);
            } else {
              // Blackout: Stays completely shut in pitch blackness!
              closure = 1.0;
              blur = maxBlur;
              brightness = 0.0;
            }
            break;
          }

          case 'tired': {
            // Drowsy / Cansancio: MOST of the time (~70%) eyes are FULLY OPEN so scene is visible, then a slow heavy droop blink
            const cycleDuration = 5.8 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.68) {
              // Eyes are 100% completely open, zero occlusion!
              closure = 0;
              blur = 0;
              brightness = 1.0;
            } else if (p < 0.80) {
              // Slow heavy droop closing (takes ~0.7s)
              const t = (p - 0.68) / 0.12;
              closure = t * t; // ease-in heavy gravity
              blur = t * maxBlur;
              brightness = 1.0 - t * 0.75;
            } else if (p < 0.88) {
              // Linger shut in tired darkness (~0.45s)
              closure = 1.0;
              blur = maxBlur;
              brightness = 0.15;
            } else if (p < 0.96) {
              // Heavy sluggish reopen (takes ~0.5s)
              const t = (p - 0.88) / 0.08;
              closure = 1.0 - Math.sin((t * Math.PI) / 2);
              blur = Math.max(0, (1.0 - t * 0.5) * maxBlur); // blur lingers
              brightness = 0.3 + t * 0.7;
            } else {
              // Final refocus back to crispness
              closure = 0;
              const t = (p - 0.96) / 0.04;
              blur = Math.max(0, (1.0 - t) * (maxBlur * 0.4));
              brightness = 1.0;
            }
            break;
          }

          case 'struggling': {
            // Double-flutter blink against sleep
            const cycleDuration = 4.5 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.65) {
              closure = 0; // wide open
              blur = 0;
              brightness = 1.0;
            } else if (p < 0.78) {
              // First quick blink
              const t = (p - 0.65) / 0.13;
              closure = Math.sin(t * Math.PI);
              blur = closure * maxBlur * 0.8;
              brightness = 1.0 - closure * 0.6;
            } else if (p < 0.84) {
              // Brief half-open struggle
              closure = 0.2;
              blur = maxBlur * 0.2;
              brightness = 0.85;
            } else if (p < 0.95) {
              // Second flutter blink
              const t = (p - 0.84) / 0.11;
              closure = Math.sin(t * Math.PI);
              blur = closure * maxBlur * 0.6;
              brightness = 1.0 - closure * 0.5;
            } else {
              closure = 0;
              blur = 0;
              brightness = 1.0;
            }
            break;
          }

          case 'normal':
          default: {
            // Natural clean blink every 3.8s: 92% of time completely open
            const cycleDuration = 3.8 / effectiveSpeed;
            const cycleTime = elapsed % cycleDuration;
            const p = cycleTime / cycleDuration;

            if (p < 0.92) {
              closure = 0; // 100% open
              blur = 0;
              brightness = 1.0;
            } else {
              const t = (p - 0.92) / 0.08;
              closure = Math.sin(t * Math.PI);
              blur = closure * (maxBlur * 0.3);
              brightness = 1.0 - closure * 0.4;
            }
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
  }, [mode, effectiveSpeed, maxBlur, manualBlinkTrigger, repeat, triggerKey]);

  // When closure === 0: Upper eyelid retracts completely to -115%, Lower eyelid retracts to 115%
  // When closure === 1: Upper eyelid descends to 0%, Lower eyelid ascends to 0% (overlapping by 14% to seal completely)
  const upperYPercent = -115 + blinkState.closure * 115;
  const lowerYPercent = 115 - blinkState.closure * 115;

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

      {/* 2. Soft Drowsy Vignette (Only appears at the outer corners, scales down to 0 when eyes are wide open) */}
      {vignetteStrength > 0 && blinkState.closure > 0.02 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 65%, rgba(0, 0, 0, 0.85) 100%)',
            opacity: vignetteStrength * blinkState.closure,
          }}
        />
      )}

      {/* 3. Upper Eyelid (Curved downwards with deep diffuse gradient feathering) */}
      <div
        className="absolute left-[-20%] right-[-20%] top-0 h-[58%] pointer-events-none will-change-transform"
        style={{
          transform: `translateY(${upperYPercent}%)`,
          borderBottomLeftRadius: '50% 120px',
          borderBottomRightRadius: '50% 120px',
          background: 'linear-gradient(to bottom, #000000 65%, rgba(0, 0, 0, 0.95) 80%, rgba(0, 0, 0, 0.75) 90%, transparent 100%)',
          boxShadow: `0 ${edgeFeather}px ${edgeFeather * 1.5}px ${edgeFeather * 0.4}px rgba(0, 0, 0, 0.95)`,
        }}
      />

      {/* 4. Lower Eyelid (Curved upwards with deep diffuse gradient feathering) */}
      <div
        className="absolute left-[-20%] right-[-20%] bottom-0 h-[58%] pointer-events-none will-change-transform"
        style={{
          transform: `translateY(${lowerYPercent}%)`,
          borderTopLeftRadius: '50% 120px',
          borderTopRightRadius: '50% 120px',
          background: 'linear-gradient(to top, #000000 65%, rgba(0, 0, 0, 0.95) 80%, rgba(0, 0, 0, 0.75) 90%, transparent 100%)',
          boxShadow: `0 -${edgeFeather}px ${edgeFeather * 1.5}px ${edgeFeather * 0.4}px rgba(0, 0, 0, 0.95)`,
        }}
      />

      {/* 5. Complete Blackout Veil when eyelids meet (100% pitch black closure) */}
      {blinkState.closure >= 0.95 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{
            opacity: Math.min(1, (blinkState.closure - 0.95) / 0.05),
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
  const edgeFeather = typeof params?.edgeFeather === 'number' ? params.edgeFeather : 35;
  const vignetteStrength = typeof params?.vignetteStrength === 'number' ? params.vignetteStrength : 0.15;
  const repeat = params?.repeat !== undefined ? params.repeat : (currentMode !== 'waking_up' && currentMode !== 'passing_out');

  const handleTriggerManualBlink = () => {
    playSfx?.('/assets/sfx/click intro.mp3', false, 0.25);
    onChange({ _triggerBlink: Date.now() });
  };

  const handleRestartSequence = () => {
    playSfx?.('/assets/sfx/click intro.mp3', false, 0.25);
    onChange({ _triggerKey: Date.now() });
  };

  const PRESET_STYLES: { label: string; mode: BlinkMode; subtitle: string; patch: Partial<Record<string, any>> }[] = [
    {
      label: 'Waking Up',
      mode: 'waking_up',
      subtitle: 'Opens Once & Refocuses Scene',
      patch: { mode: 'waking_up', speed: 1.0, maxBlur: 12, edgeFeather: 40, vignetteStrength: 0.15, repeat: false },
    },
    {
      label: 'Drowsy / Tired',
      mode: 'tired',
      subtitle: 'Open View with Heavy Droop Blinks',
      patch: { mode: 'tired', speed: 1.0, maxBlur: 9, edgeFeather: 35, vignetteStrength: 0.15, repeat: true },
    },
    {
      label: 'Struggling Awake',
      mode: 'struggling',
      subtitle: 'Double Flutter Blinks Against Sleep',
      patch: { mode: 'struggling', speed: 1.1, maxBlur: 8, edgeFeather: 30, vignetteStrength: 0.1, repeat: true },
    },
    {
      label: 'Passing Out',
      mode: 'passing_out',
      subtitle: 'Sluggish Fade Into Total Blackout',
      patch: { mode: 'passing_out', speed: 0.9, maxBlur: 14, edgeFeather: 45, vignetteStrength: 0.35, repeat: false },
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRestartSequence}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] transition-all cursor-pointer"
            title="Restart the sequence from the beginning"
          >
            <span>🔄 Replay</span>
          </button>
          <button
            type="button"
            onClick={handleTriggerManualBlink}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-amber-400/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer shadow-sm"
            title="Trigger an immediate heavy eye blink"
          >
            <span>👁️ Blink Now</span>
          </button>
        </div>
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
              onClick={() => {
                onChange({ ...preset.patch, _triggerKey: Date.now() });
              }}
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

      {/* CORE TOGGLES: REPEAT LOOP VS ONE-SHOT TRANSITION */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-semibold uppercase">
            Playback Behavior:
          </span>
          <button
            type="button"
            onClick={() => onChange({ repeat: !repeat, _triggerKey: Date.now() })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border flex items-center gap-1.5 ${
              repeat
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>{repeat ? '🔁 REPEAT (Continuous Loop)' : '⏹️ ONE-SHOT (Transition Once)'}</span>
          </button>
        </div>
        <div className="text-[9px] font-mono text-[var(--muted2)]">
          {currentMode === 'waking_up' && !repeat
            ? '✓ Waking Up opens eyes once, focuses, and remains completely open.'
            : currentMode === 'passing_out' && !repeat
            ? '✓ Passing Out fades to black and stays shut in darkness.'
            : '✓ Loops rhythmically for continuous in-scene fatigue.'}
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
      </div>

      {/* SLIDER 2: VISION FOCUS BLUR */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Vision Blur When Closing / Focusing:</span>
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
          <span>0px (Crisp)</span>
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
          <span className="font-mono text-[9px] text-[var(--muted2)]">15 - 60px</span>
        </div>
        <input
          type="range"
          min={15}
          max={60}
          step={5}
          value={edgeFeather}
          onChange={(e) => onChange({ edgeFeather: parseInt(e.target.value, 10) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 4: PERIPHERAL TUNNEL VISION VIGNETTE */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Peripheral Tunnel Vignette:</span>
            <span className="text-amber-300 font-mono font-bold">{Math.round(vignetteStrength * 100)}%</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0% (Clean) - 80%</span>
        </div>
        <input
          type="range"
          min={0}
          max={0.8}
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
    edgeFeather: 35,
    vignetteStrength: 0.15,
    repeat: true,
  },
  component: BlinkEyesComponent,
  inspector: BlinkEyesInspector,
};
