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
 */
export function calculateCinematicClipFx(
  clip: VNCinematicClip,
  currentTimeSec?: number
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

  const transitionType = (clip.transition || 'fade') as VNCinematicTransitionType;
  const transDuration = Math.max(0.08, Number.isFinite(clip.transitionDuration) ? clip.transitionDuration! : 0.5);

  // 1. CUT-POINT TRANSITION (at the beginning of the clip)
  if (transitionType !== 'cut' && elapsed >= 0 && elapsed < transDuration) {
    const p = Math.min(1, Math.max(0, elapsed / transDuration));

    switch (transitionType) {
      case 'fade':
      case 'dissolve':
        result.opacity *= p;
        break;

      case 'fade_black':
        result.opacity *= Math.min(1, p * 1.5);
        result.filter += ` brightness(${Math.min(1, p * 1.4)})`;
        break;

      case 'fade_white':
        result.opacity *= Math.min(1, p * 1.2);
        result.filter += ` brightness(${1 + (1 - p) * 2.5})`;
        break;

      case 'blink': {
        const blinkVal = Math.sin(p * Math.PI * 3);
        result.opacity *= blinkVal > 0 ? 1 : 0.2;
        break;
      }

      case 'slide_left':
        result.translateX = `${(1 - p) * 100}%`;
        result.opacity *= p;
        break;

      case 'slide_right':
        result.translateX = `${-(1 - p) * 100}%`;
        result.opacity *= p;
        break;

      case 'slide_up':
        result.translateY = `${(1 - p) * 100}%`;
        result.opacity *= p;
        break;

      case 'slide_down':
        result.translateY = `${-(1 - p) * 100}%`;
        result.opacity *= p;
        break;

      case 'flip':
        result.rotateYDeg += (1 - p) * 90;
        result.opacity *= Math.min(1, p * 2);
        break;

      case 'zoom_in':
        result.scaleMultiplier *= 0.5 + p * 0.5;
        result.opacity *= p;
        break;

      case 'zoom_out':
        result.scaleMultiplier *= 1.5 - p * 0.5;
        result.opacity *= p;
        break;

      case 'glitch':
        result.filter += ` hue-rotate(${(1 - p) * 180}deg) blur(${(1 - p) * 4}px)`;
        result.translateX = `${Math.sin(p * 20) * (1 - p) * 15}px`;
        result.opacity *= Math.min(1, p * 1.8);
        break;

      case 'circle_wipe':
        result.clipPath = `circle(${p * 100}% at 50% 50%)`;
        break;

      case 'door_open':
        result.clipPath = `inset(0% ${(1 - p) * 50}% 0% ${(1 - p) * 50}%)`;
        break;

      case 'pixelate':
        result.filter += ` blur(${Math.max(0, (1 - p) * 10)}px)`;
        result.opacity *= p;
        break;
    }
  }

  // 2. INDIVIDUAL FADE IN & IN-ANIMATION
  const fadeInSec = typeof clip.fadeInSec === 'number' && Number.isFinite(clip.fadeInSec) ? clip.fadeInSec : 0;
  if (fadeInSec > 0 && elapsed >= 0 && elapsed < fadeInSec) {
    const inP = Math.min(1, Math.max(0, elapsed / fadeInSec));
    result.opacity *= inP;

    const inAnim = clip.inAnimation || 'fade';
    if (inAnim === 'zoom_in') {
      result.scaleMultiplier *= 0.6 + inP * 0.4;
    } else if (inAnim === 'slide_left') {
      result.translateX = `${(1 - inP) * 50}%`;
    } else if (inAnim === 'slide_right') {
      result.translateX = `${-(1 - inP) * 50}%`;
    } else if (inAnim === 'slide_up') {
      result.translateY = `${(1 - inP) * 50}%`;
    } else if (inAnim === 'slide_down') {
      result.translateY = `${-(1 - inP) * 50}%`;
    } else if (inAnim === 'flip_in') {
      result.rotateYDeg += (1 - inP) * 90;
    }
  }

  // 3. INDIVIDUAL FADE OUT & OUT-ANIMATION
  const fadeOutSec = typeof clip.fadeOutSec === 'number' && Number.isFinite(clip.fadeOutSec) ? clip.fadeOutSec : 0;
  if (fadeOutSec > 0 && remaining >= 0 && remaining < fadeOutSec) {
    const outP = Math.min(1, Math.max(0, remaining / fadeOutSec)); // 1 down to 0
    result.opacity *= outP;

    const outAnim = clip.outAnimation || 'fade';
    if (outAnim === 'zoom_out') {
      result.scaleMultiplier *= 0.6 + outP * 0.4;
    } else if (outAnim === 'slide_left') {
      result.translateX = `${-(1 - outP) * 50}%`;
    } else if (outAnim === 'slide_right') {
      result.translateX = `${(1 - outP) * 50}%`;
    } else if (outAnim === 'slide_up') {
      result.translateY = `${-(1 - outP) * 50}%`;
    } else if (outAnim === 'slide_down') {
      result.translateY = `${(1 - outP) * 50}%`;
    } else if (outAnim === 'flip_out') {
      result.rotateYDeg += (1 - outP) * 90;
    }
  }

  return result;
}
