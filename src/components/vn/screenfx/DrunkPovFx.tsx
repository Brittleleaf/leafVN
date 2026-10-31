'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// DRUNK POV PRESETS & TYPES
// ============================================================================

export type DrunkPreset = 'tipsy' | 'wasted' | 'vertigo' | 'blackout' | 'custom';

export const DRUNK_PRESETS: Record<
  Exclude<DrunkPreset, 'custom'>,
  {
    label: string;
    description: string;
    icon: string;
    params: {
      doubleVision: number;
      swaySpeed: number;
      swayAmount: number;
      blurAmount: number;
      chromaticAberration: number;
      vignetteStrength: number;
      mouseReactivity: boolean;
      mouseTiltStrength: number;
      hiccup: 'none' | 'occasional' | 'frequent';
    };
  }
> = {
  tipsy: {
    label: 'Tipsy / Buzzed',
    description: 'Mild swaying motion, gentle eye defocus, and subtle double vision.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      doubleVision: 10,
      swaySpeed: 0.8,
      swayAmount: 5,
      blurAmount: 1.5,
      chromaticAberration: 35,
      vignetteStrength: 0.35,
      mouseReactivity: true,
      mouseTiltStrength: 0.6,
      hiccup: 'none',
    },
  },
  wasted: {
    label: 'Heavy Drunk / Wasted',
    description: 'Pronounced 3D tilt, sluggish double vision, and chromatic splitting.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      doubleVision: 24,
      swaySpeed: 1.1,
      swayAmount: 12,
      blurAmount: 3.5,
      chromaticAberration: 75,
      vignetteStrength: 0.6,
      mouseReactivity: true,
      mouseTiltStrength: 1.0,
      hiccup: 'occasional',
    },
  },
  vertigo: {
    label: 'Vertigo / Spinning Room',
    description: 'Rapid room spinning, high-frequency pendulum roll, and disorienting eye shear.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      doubleVision: 32,
      swaySpeed: 1.9,
      swayAmount: 20,
      blurAmount: 5.0,
      chromaticAberration: 90,
      vignetteStrength: 0.7,
      mouseReactivity: true,
      mouseTiltStrength: 1.4,
      hiccup: 'occasional',
    },
  },
  blackout: {
    label: 'Blackout / Passing Out',
    description: 'Heavy tunnel darkness closing in, sluggish defocus waves, and extreme diplopia.',
    icon: GUI_ICONS.action.eye,
    params: {
      doubleVision: 38,
      swaySpeed: 0.6,
      swayAmount: 16,
      blurAmount: 7.0,
      chromaticAberration: 100,
      vignetteStrength: 0.9,
      mouseReactivity: false,
      mouseTiltStrength: 0.4,
      hiccup: 'frequent',
    },
  },
};

// ============================================================================
// DRUNK POV COMPONENT (Full 3D Perspective Vertigo & Diplopia Ghosting)
// ============================================================================

export const DrunkPovComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Read configurable parameters with intelligent fallbacks
  const levelMult = intensity === 'light' ? 0.65 : intensity === 'heavy' ? 1.4 : 1.0;
  const effectiveMultiplier = (params?.intensityMultiplier ?? 1.0) * levelMult * intensityMultiplier;

  const doubleVision = Math.max(0, (params?.doubleVision ?? 22) * effectiveMultiplier);
  const swaySpeed = Math.max(0.1, (params?.swaySpeed ?? 1.0));
  const swayAmount = Math.max(0, (params?.swayAmount ?? 10) * effectiveMultiplier);
  const blurAmount = Math.max(0, (params?.blurAmount ?? 3.0) * effectiveMultiplier);
  const chromaticAberration = Math.max(0, Math.min(100, params?.chromaticAberration ?? 60));
  const vignetteStrength = Math.max(0, Math.min(1, (params?.vignetteStrength ?? 0.55)));
  const mouseReactivity = params?.mouseReactivity ?? true;
  const mouseTiltStrength = params?.mouseTiltStrength ?? 1.0;
  const hiccupMode = params?.hiccup ?? 'none';

  // Mouse tilt tracking with physics lerp
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const hiccupRef = useRef({ offset: 0, lastTime: 0 });

  // 1. Mouse movement tracking
  useEffect(() => {
    if (!mouseReactivity) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xNorm = (e.clientX / innerWidth) * 2 - 1; // -1 to +1
      const yNorm = (e.clientY / innerHeight) * 2 - 1; // -1 to +1

      const rawTargetX = xNorm * 18 * mouseTiltStrength;
      const rawTargetY = yNorm * 14 * mouseTiltStrength;
      mousePosRef.current.targetX = Math.max(-24, Math.min(24, rawTargetX));
      mousePosRef.current.targetY = Math.max(-18, Math.min(18, rawTargetY));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseReactivity, mouseTiltStrength]);

  // 2. 60fps RequestAnimationFrame Loop driving 3D camera sway, double vision diplopia, and hiccups
  const ghost1Ref = useRef<HTMLDivElement | null>(null);
  const ghost2Ref = useRef<HTMLDivElement | null>(null);
  const vignetteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animId = 0;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const t = elapsed * swaySpeed;

      // Mouse Lerp damping (0.05 smoothing factor)
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;

      // Hiccup generator (sudden twitch)
      if (hiccupMode !== 'none') {
        const interval = hiccupMode === 'frequent' ? 4.5 : 8.5;
        if (elapsed - hiccupRef.current.lastTime > interval) {
          hiccupRef.current.lastTime = elapsed;
          hiccupRef.current.offset = -12; // jolt up
        }
      }
      // Decay hiccup offset back to 0
      hiccupRef.current.offset *= 0.88;

      // Primary sinusoidal roll & sway
      const swayRoll = Math.sin(t * 1.2) * (swayAmount * 0.4); // rotation Z
      const swayPitch = Math.cos(t * 0.9) * (swayAmount * 0.3) + mousePosRef.current.y; // rotation X
      const swayYaw = Math.sin(t * 0.8) * (swayAmount * 0.35) + mousePosRef.current.x; // rotation Y
      const skewXVal = Math.sin(t * 1.1) * (swayAmount * 0.25) + mousePosRef.current.x * 0.2;
      const skewYVal = Math.cos(t * 1.3) * (swayAmount * 0.25) + mousePosRef.current.y * 0.2;

      // Diplopia Separation Vectors (eyes drifting apart)
      const eyeSeparation = (Math.sin(t * 1.5) * 0.5 + 0.5) * doubleVision;
      const ghost1X = Math.cos(t * 0.7) * eyeSeparation;
      const ghost1Y = Math.sin(t * 0.9) * (eyeSeparation * 0.6) + hiccupRef.current.offset;

      const ghost2X = -Math.cos(t * 0.7 + 0.5) * (eyeSeparation * 0.8);
      const ghost2Y = -Math.sin(t * 0.9 + 0.5) * (eyeSeparation * 0.5) + hiccupRef.current.offset * 0.5;

      // Breathing blur pulse (struggling to focus)
      const currentBlur = blurAmount * (0.65 + 0.35 * Math.sin(t * 1.7));

      // Apply to Ghost 1 (Magenta/Warm Channel Split)
      if (ghost1Ref.current) {
        ghost1Ref.current.style.transform = `
          translate3d(${ghost1X.toFixed(1)}px, ${ghost1Y.toFixed(1)}px, 0px)
          perspective(900px)
          rotateX(${(swayPitch * 1.15).toFixed(2)}deg)
          rotateY(${(swayYaw * 1.1).toFixed(2)}deg)
          rotateZ(${(swayRoll + 0.6).toFixed(2)}deg)
          skewX(${skewXVal.toFixed(2)}deg)
          skewY(${skewYVal.toFixed(2)}deg)
          scale(1.30)
        `;
        ghost1Ref.current.style.backdropFilter = `blur(${currentBlur.toFixed(1)}px)`;
      }

      // Apply to Ghost 2 (Cyan/Cool Channel Split)
      if (ghost2Ref.current) {
        ghost2Ref.current.style.transform = `
          translate3d(${ghost2X.toFixed(1)}px, ${ghost2Y.toFixed(1)}px, 0px)
          perspective(900px)
          rotateX(${(swayPitch * 0.85).toFixed(2)}deg)
          rotateY(${(swayYaw * 0.9).toFixed(2)}deg)
          rotateZ(${(swayRoll - 0.6).toFixed(2)}deg)
          skewX(${(-skewXVal * 0.8).toFixed(2)}deg)
          skewY(${(-skewYVal * 0.8).toFixed(2)}deg)
          scale(1.30)
        `;
        ghost2Ref.current.style.backdropFilter = `blur(${(currentBlur * 0.85).toFixed(1)}px)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [swaySpeed, swayAmount, doubleVision, blurAmount, hiccupMode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-30"
      style={{
        perspective: '900px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Ghost Diplopia Layer 1: Red/Magenta Optical Chromatic Split (Oversized with feathered mask to eliminate sharp edges) */}
      <div
        ref={ghost1Ref}
        className="pointer-events-none will-change-transform"
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-30%',
          width: '160%',
          height: '160%',
          opacity: Math.min(0.48, (0.35 * (chromaticAberration / 100) + 0.1)),
          mixBlendMode: 'screen',
          backgroundColor: `rgba(255, 60, 110, ${(0.08 * (chromaticAberration / 100)).toFixed(2)})`,
          maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 95%)',
        }}
      />

      {/* Ghost Diplopia Layer 2: Cyan/Blue Optical Chromatic Split (Oversized with feathered mask to eliminate sharp edges) */}
      <div
        ref={ghost2Ref}
        className="pointer-events-none will-change-transform"
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-30%',
          width: '160%',
          height: '160%',
          opacity: Math.min(0.48, (0.35 * (chromaticAberration / 100) + 0.1)),
          mixBlendMode: 'screen',
          backgroundColor: `rgba(50, 200, 255, ${(0.08 * (chromaticAberration / 100)).toFixed(2)})`,
          maskImage: 'radial-gradient(ellipse at center, black 65%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 65%, transparent 95%)',
        }}
      />

      {/* Optical Blur & Refraction Glaze across entire scene */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '130%',
          height: '130%',
          backdropFilter: blurAmount > 0.5 ? `blur(${(blurAmount * 0.4).toFixed(1)}px)` : undefined,
        }}
      />

      {/* Drunk Tunnel Vision & Heavy Inebriation Vignette */}
      {vignetteStrength > 0 && (
        <div
          ref={vignetteRef}
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            opacity: vignetteStrength,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(20, 10, 15, 0.45) 75%, rgba(10, 2, 8, 0.95) 100%)`,
          }}
        />
      )}

    </div>
  );
};

// ============================================================================
// DRUNK POV INSPECTOR
// ============================================================================

export const DrunkPovInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const currentMultiplier = params?.intensityMultiplier ?? 1.0;
  const doubleVision = params?.doubleVision ?? 22;
  const swaySpeed = params?.swaySpeed ?? 1.0;
  const swayAmount = params?.swayAmount ?? 10;
  const blurAmount = params?.blurAmount ?? 3.0;
  const chromaticAberration = params?.chromaticAberration ?? 60;
  const vignetteStrength = params?.vignetteStrength ?? 0.55;
  const mouseReactivity = params?.mouseReactivity ?? true;
  const mouseTiltStrength = params?.mouseTiltStrength ?? 1.0;
  const hiccupMode = params?.hiccup ?? 'none';
  const currentPreset = (params?.preset as DrunkPreset) || 'wasted';

  const applyPreset = (presetKey: Exclude<DrunkPreset, 'custom'>) => {
    const preset = DRUNK_PRESETS[presetKey];
    if (!preset) return;
    onChange({
      preset: presetKey,
      ...preset.params,
    });
    if (playSfx) {
      playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    }
  };

  return (
    <div className="space-y-4 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--text)]">
      {/* 1. Header & Live Badge */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={15} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider">
              Drunk POV & Vertigo Simulation
            </h4>
            <p className="text-[10px] text-[var(--muted)]">
              Double vision diplopia, 3D tilt, sluggish blur & drunk thoughts
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-950/80 border border-pink-500/40 text-pink-300 font-bold uppercase">
          3D Perspective
        </span>
      </div>

      {/* 2. Presets Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
          Intoxication Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(DRUNK_PRESETS) as Array<Exclude<DrunkPreset, 'custom'>>).map((key) => {
            const p = DRUNK_PRESETS[key];
            const isSelected = currentPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-sm shadow-pink-500/20'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--muted2)]'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <GuiIconRenderer icon={p.icon} size={12} className={isSelected ? 'text-pink-300' : 'text-[var(--muted)]'} />
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

      {/* 3. Intensity Multiplier */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Overall Intoxication Intensity:</span>
          <span className="font-mono text-pink-300 font-bold">{Math.round(currentMultiplier * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.05}
            value={currentMultiplier}
            onChange={(e) => onChange({ preset: 'custom', intensityMultiplier: parseFloat(e.target.value) })}
            className="flex-1 accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
          <button
            type="button"
            onClick={() => onChange({ intensityMultiplier: 1.0 })}
            className="text-[9px] font-mono text-[var(--muted2)] hover:text-white px-1.5 py-0.5 rounded border border-[var(--border)] cursor-pointer"
          >
            100%
          </button>
        </div>
      </div>

      {/* 4. Diplopia Double Vision & Chromatic Split */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Double Vision Offset:</span>
            <span className="font-mono text-pink-300 font-bold">{doubleVision}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={doubleVision}
            onChange={(e) => onChange({ preset: 'custom', doubleVision: parseInt(e.target.value) })}
            className="w-full accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Chromatic Split:</span>
            <span className="font-mono text-pink-300 font-bold">{chromaticAberration}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={chromaticAberration}
            onChange={(e) => onChange({ preset: 'custom', chromaticAberration: parseInt(e.target.value) })}
            className="w-full accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 5. Swaying Speed & Tilt Amplitude */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Sway Speed:</span>
            <span className="font-mono text-pink-300 font-bold">{swaySpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={2.5}
            step={0.1}
            value={swaySpeed}
            onChange={(e) => onChange({ preset: 'custom', swaySpeed: parseFloat(e.target.value) })}
            className="w-full accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Vertigo Tilt:</span>
            <span className="font-mono text-pink-300 font-bold">{swayAmount}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={swayAmount}
            onChange={(e) => onChange({ preset: 'custom', swayAmount: parseInt(e.target.value) })}
            className="w-full accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 6. Vision Blur & Vignette Darkness */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Vision Defocus Blur:</span>
            <span className="font-mono text-pink-300 font-bold">{blurAmount.toFixed(1)}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={blurAmount}
            onChange={(e) => onChange({ preset: 'custom', blurAmount: parseFloat(e.target.value) })}
            className="w-full accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Tunnel Vignette:</span>
            <span className="font-mono text-pink-300 font-bold">{Math.round(vignetteStrength * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vignetteStrength}
            onChange={(e) => onChange({ preset: 'custom', vignetteStrength: parseFloat(e.target.value) })}
            className="w-full accent-pink-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 7. Interactive Options & Toggles */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        {/* Mouse Reactivity */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold block text-[var(--text)]">Mouse Disorientation Tilt</span>
            <span className="text-[9px] text-[var(--muted)]">Camera tilts in 3D following cursor motion</span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ mouseReactivity: !mouseReactivity })}
            className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              mouseReactivity
                ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {mouseReactivity ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Hiccups */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold block text-[var(--text)]">Occasional Hiccup Jolt</span>
            <span className="text-[9px] text-[var(--muted)]">Periodic micro-tremor camera twitch</span>
          </div>
          <div className="flex items-center gap-1">
            {(['none', 'occasional', 'frequent'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ hiccup: mode })}
                className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold border transition-all cursor-pointer ${
                  hiccupMode === mode
                    ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 8. Technical Architecture Note */}
      <div className="p-2.5 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] text-[9px] text-[var(--muted)] leading-relaxed">
        <span className="font-bold text-pink-400">Scene Scope:</span> This effect uses{' '}
        <span className="text-white font-mono">backdrop-filter</span> & 3D CSS perspective transforms, smoothly
        distorting <span className="text-pink-300 font-bold">ALL</span> scene elements beneath it (backgrounds, character
        sprites, dialogue boxes, and choice buttons) without clipping.
      </div>
    </div>
  );
};

// ============================================================================
// DRUNK POV FX REGISTRATION DEFINITION
// ============================================================================

export const drunkPovFx: ScreenFxDefinition = {
  id: 'drunk_pov',
  label: 'Drunk POV',
  description: 'First-person inebriation with 3D perspective vertigo tilt, diplopia double-vision ghosting, and sluggish blur.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-pink-500 bg-pink-950/80 text-pink-200',
  defaultParams: {
    preset: 'wasted',
    doubleVision: 22,
    swaySpeed: 1.0,
    swayAmount: 10,
    blurAmount: 3.0,
    chromaticAberration: 60,
    vignetteStrength: 0.55,
    mouseReactivity: true,
    mouseTiltStrength: 1.0,
    hiccup: 'none',
    intensityMultiplier: 1.0,
  },
  component: DrunkPovComponent,
  inspector: DrunkPovInspector,
};
