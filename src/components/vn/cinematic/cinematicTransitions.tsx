"use client";
import React from 'react';
import { VNCinematicClip, VNCinematicTransitionType, VNCinematicAnimationType } from '@/types/vn';

/**
 * CapCut Transition Bowtie SVG Icon
 */
export const TransitionBowtieIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 4l8 8-8 8V4zm16 0v16l-8-8 8-8z" />
  </svg>
);

export interface CinematicTransitionDef {
  id: VNCinematicTransitionType;
  name: string;
  category: 'Basic' | 'Slides' | '3D & Zoom' | 'Creative';
  description: string;
}

export const CINEMATIC_TRANSITIONS_CATALOG: CinematicTransitionDef[] = [
  // Basic
  { id: 'cut', name: 'Direct Cut', category: 'Basic', description: 'Instant cut with zero transition' },
  { id: 'dissolve', name: 'Dissolve / Fade', category: 'Basic', description: 'Classic smooth crossfade blend' },
  { id: 'fade_black', name: 'Fade to Black', category: 'Basic', description: 'Cinematic dip to darkness between shots' },
  { id: 'fade_white', name: 'Flash White', category: 'Basic', description: 'Impact flash to white into the new scene' },
  { id: 'blink', name: 'Blink / Eyes', category: 'Basic', description: 'Double blink dip as opening or closing eyes' },

  // Slides
  { id: 'slide_left', name: 'Slide Left', category: 'Slides', description: 'Smooth push sliding in from the right' },
  { id: 'slide_right', name: 'Slide Right', category: 'Slides', description: 'Smooth push sliding in from the left' },
  { id: 'slide_up', name: 'Slide Up', category: 'Slides', description: 'Vertical slide from bottom to top' },
  { id: 'slide_down', name: 'Slide Down', category: 'Slides', description: 'Vertical drop slide from top to bottom' },

  // 3D & Zoom
  { id: 'flip', name: 'Flip (3D Card)', category: '3D & Zoom', description: '3D perspective card flip' },
  { id: 'zoom_in', name: 'Punch Zoom In', category: '3D & Zoom', description: 'Dynamic camera punch zoom' },
  { id: 'zoom_out', name: 'Pullback Zoom', category: '3D & Zoom', description: 'Dramatic camera pull-back zoom' },

  // Creative
  { id: 'glitch', name: 'Glitch Tear', category: 'Creative', description: 'Digital chromatic aberration glitch tear' },
  { id: 'circle_wipe', name: 'Iris Circle', category: 'Creative', description: 'Expanding circular aperture wipe' },
  { id: 'door_open', name: 'Door Open', category: 'Creative', description: 'Split curtain opening outward from center' },
  { id: 'pixelate', name: 'Pixelate Dissolve', category: 'Creative', description: 'Retro digital mosaic dissolve' },
];

export interface CinematicAnimationDef {
  id: VNCinematicAnimationType;
  name: string;
  description: string;
}

export const IN_ANIMATIONS_CATALOG: CinematicAnimationDef[] = [
  { id: 'none', name: 'None', description: 'No entrance animation' },
  { id: 'fade', name: 'Fade In', description: 'Smooth opacity fade in' },
  { id: 'zoom_in', name: 'Zoom In', description: 'Scale up from small to normal size' },
  { id: 'slide_left', name: 'Slide Left', description: 'Fly in from right side' },
  { id: 'slide_right', name: 'Slide Right', description: 'Fly in from left side' },
  { id: 'slide_up', name: 'Slide Up', description: 'Rise up from below' },
  { id: 'slide_down', name: 'Slide Down', description: 'Drop down from above' },
  { id: 'flip_in', name: '3D Flip In', description: 'Flip open in 3D perspective' },
];

export const OUT_ANIMATIONS_CATALOG: CinematicAnimationDef[] = [
  { id: 'none', name: 'None', description: 'No exit animation' },
  { id: 'fade', name: 'Fade Out', description: 'Smooth opacity fade out' },
  { id: 'zoom_out', name: 'Zoom Out', description: 'Scale away while disappearing' },
  { id: 'slide_left', name: 'Slide Left', description: 'Fly away towards left' },
  { id: 'slide_right', name: 'Slide Right', description: 'Fly away towards right' },
  { id: 'slide_up', name: 'Slide Up', description: 'Fly away upward' },
  { id: 'slide_down', name: 'Slide Down', description: 'Drop away downward' },
  { id: 'flip_out', name: '3D Flip Out', description: 'Flip closed in 3D perspective' },
];

/**
 * Real-time transition & animation formulas with easing curves
 */

// Easing functions for organic, cinematic feel
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
export const easeInOutCubic = (t: number): number => {
  const p = Math.max(0, Math.min(1, t));
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};
export const easeOutBack = (t: number): number => {
  const p = Math.max(0, Math.min(1, t));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
export const smoothstep = (t: number): number => {
  const p = Math.max(0, Math.min(1, t));
  return p * p * (3 - 2 * p);
};

export interface CinematicRenderTransform {
  opacity: number;
  translateX: string;
  translateY: string;
  scaleMultiplier: number;
  rotateYDeg: number;
  rotateXDeg: number;
  filter: string;
  clipPath?: string;
}

/**
 * Calculates real-time animation, transitions, fade-in, and fade-out for a cinematic clip.
 * Incorporates organic cubic and smoothstep easing for broadcast-quality smoothness.
 */
export function calculateCinematicClipFx(
  clip: VNCinematicClip,
  currentTimeSec?: number,
  incomingClip?: VNCinematicClip
): CinematicRenderTransform {
  const baseOpacity = Number.isFinite(clip.opacity) ? Math.max(0, Math.min(1, clip.opacity!)) : 1;

  const result: CinematicRenderTransform = {
    opacity: baseOpacity,
    translateX: '0%',
    translateY: '0%',
    scaleMultiplier: 1,
    rotateYDeg: 0,
    rotateXDeg: 0,
    filter: '',
    clipPath: undefined,
  };

  if (currentTimeSec === undefined || !Number.isFinite(currentTimeSec)) {
    return result;
  }

  const startSec = Number.isFinite(clip.startSec) ? clip.startSec : 0;
  const endSec = Number.isFinite(clip.endSec) ? clip.endSec : startSec + 1;
  const elapsed = currentTimeSec - startSec;
  const remaining = endSec - currentTimeSec;

  // 0. DUAL-BUFFER OUTGOING HOLD & PUSH (when this clip has ended, but incoming clip is transitioning in)
  if (incomingClip && currentTimeSec >= endSec) {
    const holdElapsed = currentTimeSec - endSec;
    const incomingTrans = (incomingClip.transition || 'fade') as VNCinematicTransitionType;
    const incomingDuration = Math.max(0.08, Number.isFinite(incomingClip.transitionDuration) ? incomingClip.transitionDuration! : 0.5);

    if (holdElapsed >= 0 && holdElapsed < incomingDuration && incomingTrans !== 'cut') {
      const rawP = Math.min(1, Math.max(0, holdElapsed / incomingDuration));
      const cubicP = easeOutCubic(rawP);
      const smoothP = smoothstep(rawP);

      switch (incomingTrans) {
        case 'slide_left':
          // Camera push: outgoing scene sweeps left as new scene sweeps in from right
          result.translateX = `${-cubicP * 100}%`;
          result.opacity *= Math.max(0, 1 - smoothP * 0.6);
          break;

        case 'slide_right':
          result.translateX = `${cubicP * 100}%`;
          result.opacity *= Math.max(0, 1 - smoothP * 0.6);
          break;

        case 'slide_up':
          result.translateY = `${-cubicP * 100}%`;
          result.opacity *= Math.max(0, 1 - smoothP * 0.6);
          break;

        case 'slide_down':
          result.translateY = `${cubicP * 100}%`;
          result.opacity *= Math.max(0, 1 - smoothP * 0.6);
          break;

        case 'zoom_in':
          // Outgoing scene zooms past camera like an optical warp into incoming scene
          result.scaleMultiplier *= 1 + cubicP * 0.7;
          result.opacity *= Math.max(0, 1 - smoothP);
          break;

        case 'zoom_out':
          result.scaleMultiplier *= Math.max(0.01, 1 - cubicP * 0.5);
          result.opacity *= Math.max(0, 1 - smoothP);
          break;

        case 'flip':
          // 3D card flip: outgoing card flips from 0 to -90 deg
          result.rotateYDeg -= easeInOutCubic(rawP) * 90;
          result.opacity *= Math.max(0, 1 - rawP * 2);
          break;

        case 'fade':
        case 'dissolve':
          result.opacity *= (1 - smoothP);
          break;

        case 'fade_black':
          result.opacity *= Math.max(0, 1 - smoothP * 2);
          result.filter += ` brightness(${Math.max(0, 1 - smoothP * 2.5)})`;
          break;

        case 'fade_white':
          result.filter += ` brightness(${1 + smoothP * 3})`;
          result.opacity *= Math.max(0, 1 - smoothP);
          break;

        case 'glitch':
          result.filter += ` hue-rotate(${rawP * 180}deg) blur(${rawP * 4}px)`;
          result.translateX = `${Math.sin(rawP * 30) * rawP * 14}px`;
          result.opacity *= Math.max(0, 1 - smoothP);
          break;

        default:
          result.opacity *= (1 - smoothP);
          break;
      }

      return result;
    }
  }

  const transitionType = (clip.transition || 'fade') as VNCinematicTransitionType;
  const transDuration = Math.max(0.08, Number.isFinite(clip.transitionDuration) ? clip.transitionDuration! : 0.5);

  // 1. CUT-POINT TRANSITION (at the beginning of the clip)
  if (transitionType !== 'cut' && elapsed >= 0 && elapsed < transDuration) {
    const rawP = Math.min(1, Math.max(0, elapsed / transDuration));
    const smoothP = smoothstep(rawP);
    const cubicP = easeOutCubic(rawP);

    switch (transitionType) {
      case 'fade':
      case 'dissolve':
        result.opacity *= smoothP;
        break;

      case 'fade_black':
        // Dips into black then fades in smoothly
        result.opacity *= Math.min(1, smoothP * 1.4);
        result.filter += ` brightness(${Math.min(1, smoothP * 1.5)})`;
        break;

      case 'fade_white':
        // High-key flash to white that dissolves away
        result.opacity *= Math.min(1, smoothP * 1.3);
        result.filter += ` brightness(${1 + (1 - smoothP) * 3})`;
        break;

      case 'blink': {
        // Human eye double-blink dip
        const blinkVal = Math.sin(rawP * Math.PI * 3);
        result.opacity *= blinkVal > 0.1 ? smoothstep(blinkVal) : 0.1;
        break;
      }

      case 'slide_left':
        result.translateX = `${(1 - cubicP) * 100}%`;
        result.opacity *= smoothstep(rawP * 1.5);
        break;

      case 'slide_right':
        result.translateX = `${-(1 - cubicP) * 100}%`;
        result.opacity *= smoothstep(rawP * 1.5);
        break;

      case 'slide_up':
        result.translateY = `${(1 - cubicP) * 100}%`;
        result.opacity *= smoothstep(rawP * 1.5);
        break;

      case 'slide_down':
        result.translateY = `${-(1 - cubicP) * 100}%`;
        result.opacity *= smoothstep(rawP * 1.5);
        break;

      case 'flip': {
        const flipP = easeInOutCubic(rawP);
        result.rotateYDeg += (1 - flipP) * 90;
        result.opacity *= Math.min(1, flipP * 2);
        break;
      }

      case 'zoom_in':
        // Punch Zoom In with organic easeOut
        result.scaleMultiplier *= 0.5 + cubicP * 0.5;
        result.opacity *= smoothP;
        break;

      case 'zoom_out':
        result.scaleMultiplier *= 1.6 - cubicP * 0.6;
        result.opacity *= smoothP;
        break;

      case 'glitch': {
        const decay = 1 - rawP;
        const jitter = Math.sin(rawP * 40) * decay * 18;
        result.filter += ` hue-rotate(${decay * 240}deg) saturate(${1 + decay * 2}) blur(${decay * 3}px)`;
        result.translateX = `${jitter}px`;
        result.opacity *= Math.min(1, rawP * 2);
        break;
      }

      case 'circle_wipe':
        result.clipPath = `circle(${smoothP * 100}% at 50% 50%)`;
        break;

      case 'door_open': {
        const splitPct = (1 - smoothP) * 50;
        result.clipPath = `inset(0% ${splitPct}% 0% ${splitPct}%)`;
        break;
      }

      case 'pixelate':
        result.filter += ` blur(${Math.max(0, (1 - smoothP) * 12)}px)`;
        result.opacity *= smoothP;
        break;
    }
  }

  // 2. INDIVIDUAL FADE IN & IN-ANIMATION
  const fadeInSec = typeof clip.fadeInSec === 'number' && Number.isFinite(clip.fadeInSec) ? clip.fadeInSec : 0;
  if (fadeInSec > 0 && elapsed >= 0 && elapsed < fadeInSec) {
    const rawInP = Math.min(1, Math.max(0, elapsed / fadeInSec));
    const smoothInP = smoothstep(rawInP);
    const cubicInP = easeOutCubic(rawInP);

    result.opacity *= smoothInP;

    const inAnim = clip.inAnimation || 'fade';
    if (inAnim === 'zoom_in') {
      result.scaleMultiplier *= 0.6 + cubicInP * 0.4;
    } else if (inAnim === 'slide_left') {
      result.translateX = `${(1 - cubicInP) * 50}%`;
    } else if (inAnim === 'slide_right') {
      result.translateX = `${-(1 - cubicInP) * 50}%`;
    } else if (inAnim === 'slide_up') {
      result.translateY = `${(1 - cubicInP) * 50}%`;
    } else if (inAnim === 'slide_down') {
      result.translateY = `${-(1 - cubicInP) * 50}%`;
    } else if (inAnim === 'flip_in') {
      result.rotateYDeg += (1 - easeInOutCubic(rawInP)) * 90;
    }
  }

  // 3. INDIVIDUAL FADE OUT & OUT-ANIMATION
  const fadeOutSec = typeof clip.fadeOutSec === 'number' && Number.isFinite(clip.fadeOutSec) ? clip.fadeOutSec : 0;
  if (fadeOutSec > 0 && remaining >= 0 && remaining < fadeOutSec) {
    const rawOutP = Math.min(1, Math.max(0, remaining / fadeOutSec)); // 1 down to 0
    const smoothOutP = smoothstep(rawOutP);
    const cubicOutP = easeOutCubic(rawOutP);

    result.opacity *= smoothOutP;

    const outAnim = clip.outAnimation || 'fade';
    if (outAnim === 'zoom_out') {
      result.scaleMultiplier *= 0.6 + cubicOutP * 0.4;
    } else if (outAnim === 'slide_left') {
      result.translateX = `${-(1 - cubicOutP) * 50}%`;
    } else if (outAnim === 'slide_right') {
      result.translateX = `${(1 - cubicOutP) * 50}%`;
    } else if (outAnim === 'slide_up') {
      result.translateY = `${-(1 - cubicOutP) * 50}%`;
    } else if (outAnim === 'slide_down') {
      result.translateY = `${(1 - cubicOutP) * 50}%`;
    } else if (outAnim === 'flip_out') {
      result.rotateYDeg += (1 - easeInOutCubic(rawOutP)) * 90;
    }
  }

  return result;
}

/**
 * CapCut-Style Live Animated Thumbnail Preview for Transitions
 * Renders an animated miniature preview demonstrating the exact visual transition on hover or continuous loop.
 */
export const TransitionThumbnailPreview: React.FC<{
  transitionType: VNCinematicTransitionType;
  isHovered?: boolean;
  className?: string;
}> = ({ transitionType, isHovered = false, className = '' }) => {
  return (
    <div
      className={`relative w-full aspect-[16/10] rounded-md overflow-hidden select-none bg-[#0c0d12] border border-white/10 shadow-inner group-hover:border-cyan-400/80 transition-colors ${className}`}
      style={{ perspective: '700px' }}
    >
      {/* SCENE A (Base: Golden Windmill Countryside - Makoto Shinkai Style) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#38bdf8] via-[#fed7aa] to-[#d97706] flex flex-col justify-between overflow-hidden">
        {/* Soft Sun Glow in upper corner */}
        <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-amber-100/40 blur-md pointer-events-none" />

        {/* Fluffy Anime Clouds */}
        <div className="relative px-2 pt-1.5 flex justify-between items-center opacity-85 pointer-events-none">
          <div className="flex items-center -space-x-1">
            <div className="w-4 h-2 bg-white/90 rounded-full blur-[0.5px]" />
            <div className="w-5 h-3 bg-white/95 rounded-full shadow-xs" />
            <div className="w-3 h-1.5 bg-white/80 rounded-full" />
          </div>
          <div className="flex items-center -space-x-1 opacity-70">
            <div className="w-4 h-2.5 bg-white/90 rounded-full" />
            <div className="w-2.5 h-1.5 bg-white/80 rounded-full" />
          </div>
        </div>

        {/* Distant Hills Layer */}
        <div className="absolute bottom-5 inset-x-0 h-4 bg-amber-700/50 rounded-t-[100%] pointer-events-none" />

        {/* Iconic Windmill Graphic (CapCut Inspired) */}
        <div className="relative z-10 mx-auto flex flex-col items-center mt-auto mb-1">
          {/* Rotating lattice windmill sails */}
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center animate-[spin_10s_linear_infinite]">
              {/* Blade 1 & 2 */}
              <div className="w-7 h-0.5 bg-stone-900 shadow-xs relative flex justify-between items-center">
                <div className="w-2.5 h-1 bg-amber-100/90 border border-stone-800 -mt-0.5" />
                <div className="w-2.5 h-1 bg-amber-100/90 border border-stone-800 -mb-0.5" />
              </div>
              {/* Blade 3 & 4 */}
              <div className="w-0.5 h-7 bg-stone-900 shadow-xs absolute flex flex-col justify-between items-center">
                <div className="w-1 h-2.5 bg-amber-100/90 border border-stone-800 -ml-0.5" />
                <div className="w-1 h-2.5 bg-amber-100/90 border border-stone-800 -mr-0.5" />
              </div>
            </div>
            {/* Center rotor hub */}
            <div className="w-2 h-2 rounded-full bg-amber-950 border border-amber-400/80 shadow-md z-10" />
          </div>

          {/* Windmill stone tower body */}
          <div className="relative w-4 h-5 -mt-1 bg-gradient-to-b from-stone-100 to-stone-300 border-x border-stone-500 rounded-t-xs flex flex-col items-center justify-between p-0.5 shadow-md">
            {/* Red roof cap */}
            <div className="absolute -top-1 inset-x-0 h-1 bg-amber-800 rounded-t-xs" />
            <div className="w-1.5 h-1.5 bg-amber-950 rounded-xs mt-1 border border-stone-700" />
            <div className="w-2 h-2.5 bg-stone-800 rounded-t-xs mt-auto border-t border-stone-900" />
          </div>
        </div>

        {/* Foreground Layer: Golden Wheat Field */}
        <div className="relative z-10 w-full h-4 bg-gradient-to-t from-amber-900 via-amber-700 to-amber-600 border-t border-amber-400/50 flex items-center justify-around px-1">
          <div className="w-1 h-1.5 bg-amber-300/80 rounded-t-full" />
          <div className="w-0.5 h-2 bg-amber-200/90 rounded-t-full" />
          <div className="w-1 h-1.5 bg-amber-300/80 rounded-t-full" />
        </div>
      </div>

      {/* SCENE B (Incoming: Cyberpunk Starry Twilight Metropolis) */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#3b0764] to-[#0284c7] flex flex-col justify-between p-1.5 overflow-hidden transition-all duration-700 ease-out"
        style={{
          transformOrigin: 'center center',
          ...(getTransitionPreviewStyle(transitionType, isHovered)),
        }}
      >
        {/* Celestial Sky: Glowing Moon & Starfield */}
        <div className="flex justify-between items-center relative z-10">
          <div className="relative">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-100 shadow-[0_0_10px_#22d3ee] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#3b0764] -mr-1 -mt-0.5" />
            </div>
          </div>
          <div className="flex gap-1.5 opacity-80">
            <div className="w-1 h-1 bg-cyan-300 rounded-full animate-ping" />
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
            <div className="w-1 h-1 bg-pink-300 rounded-full" />
          </div>
        </div>

        {/* Cyberpunk Skyscraper Skyline */}
        <div className="relative z-10 flex items-end justify-center gap-1 mt-auto">
          {/* Tower 1 */}
          <div className="w-3 h-8 bg-slate-900/95 border-t border-x border-cyan-400/60 flex flex-col justify-around py-0.5 items-center shadow-lg">
            <div className="w-1.5 h-0.5 bg-cyan-400/80 rounded-xs" />
            <div className="w-1.5 h-0.5 bg-cyan-400/80 rounded-xs" />
            <div className="w-1.5 h-0.5 bg-cyan-400/80 rounded-xs" />
          </div>
          {/* Tower 2 (Tall Center) */}
          <div className="w-4 h-12 bg-purple-950/95 border-t-2 border-x border-pink-400/80 flex flex-col justify-around py-1 items-center shadow-xl relative">
            {/* Blinking Red Beacon Light on top */}
            <div className="absolute -top-1 w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_red]" />
            <div className="w-2 h-0.5 bg-pink-300/80 rounded-xs" />
            <div className="w-2 h-0.5 bg-cyan-300/80 rounded-xs" />
            <div className="w-2 h-0.5 bg-pink-300/80 rounded-xs" />
          </div>
          {/* Tower 3 */}
          <div className="w-3.5 h-10 bg-indigo-950/95 border-t border-x border-cyan-400/70 flex flex-col justify-around py-0.5 items-center shadow-lg">
            <div className="w-2 h-0.5 bg-cyan-300/90 rounded-xs" />
            <div className="w-2 h-0.5 bg-cyan-300/90 rounded-xs" />
          </div>
          {/* Tower 4 */}
          <div className="w-2.5 h-6 bg-slate-900/90 border-t border-pink-400/60" />
        </div>

        {/* Water Canal Horizon Reflection */}
        <div className="relative z-10 w-full h-2.5 bg-gradient-to-r from-cyan-900/80 via-purple-900/90 to-pink-900/80 border-t border-cyan-400/40 blur-[0.3px]" />
      </div>

      {/* Glossy Specular Glass Reflection Sheen */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] z-20" />

      {/* Bowtie Overlay Badge on Hover */}
      <div
        className={`absolute bottom-1.5 right-1.5 z-30 px-1.5 py-0.5 rounded bg-black/85 backdrop-blur-md border border-cyan-400/50 text-cyan-300 transition-all duration-200 flex items-center gap-1 shadow-lg ${
          isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-95'
        }`}
      >
        <TransitionBowtieIcon className="w-2.5 h-2.5 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
        <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-cyan-200">Play</span>
      </div>
    </div>
  );
};

function getTransitionPreviewStyle(
  type: VNCinematicTransitionType,
  active: boolean
): React.CSSProperties {
  if (!active) {
    // Idle state: show partially or hidden so user knows a transition happens
    return {
      opacity: 0,
      pointerEvents: 'none',
    };
  }

  // Active / Hovered state styles
  switch (type) {
    case 'cut':
      return { opacity: 1 };

    case 'dissolve':
    case 'fade':
      return { opacity: 1, transition: 'opacity 0.7s ease-in-out' };

    case 'fade_black':
      return {
        opacity: 1,
        animation: 'capcutFadeBlack 1.4s ease-in-out infinite',
      };

    case 'fade_white':
      return {
        opacity: 1,
        animation: 'capcutFadeWhite 1.4s ease-out infinite',
      };

    case 'blink':
      return {
        opacity: 1,
        animation: 'capcutBlink 1.4s ease-in-out infinite',
      };

    case 'slide_left':
      return {
        opacity: 1,
        transform: 'translateX(0%)',
        animation: 'capcutSlideLeft 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      };

    case 'slide_right':
      return {
        opacity: 1,
        transform: 'translateX(0%)',
        animation: 'capcutSlideRight 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      };

    case 'slide_up':
      return {
        opacity: 1,
        transform: 'translateY(0%)',
        animation: 'capcutSlideUp 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      };

    case 'slide_down':
      return {
        opacity: 1,
        transform: 'translateY(0%)',
        animation: 'capcutSlideDown 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      };

    case 'flip':
      return {
        opacity: 1,
        animation: 'capcutFlip 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      };

    case 'zoom_in':
      return {
        opacity: 1,
        animation: 'capcutZoomIn 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      };

    case 'zoom_out':
      return {
        opacity: 1,
        animation: 'capcutZoomOut 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      };

    case 'glitch':
      return {
        opacity: 1,
        animation: 'capcutGlitch 1.2s steps(2, start) infinite',
      };

    case 'circle_wipe':
      return {
        opacity: 1,
        animation: 'capcutCircleWipe 1.4s ease-out infinite',
      };

    case 'door_open':
      return {
        opacity: 1,
        animation: 'capcutDoorOpen 1.4s ease-out infinite',
      };

    case 'pixelate':
      return {
        opacity: 1,
        animation: 'capcutPixelate 1.4s ease-in-out infinite',
      };

    default:
      return { opacity: 1 };
  }
}
