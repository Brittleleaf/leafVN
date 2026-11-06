"use client";
import { VNCinematicTransitionType } from '@/types/vn';

let audioCtx: AudioContext | null = null;
let sfxEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isTransitionSfxEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('leaf_vn_transition_sfx');
    if (saved !== null) {
      return saved === 'true';
    }
  }
  return sfxEnabled;
}

export function setTransitionSfxEnabled(enabled: boolean): void {
  sfxEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('leaf_vn_transition_sfx', enabled ? 'true' : 'false');
  }
}

/**
 * Plays a real-time procedural transition sound effect using the Web Audio API.
 * Requires 0 audio assets, loads with 0ms latency, and works 100% offline.
 */
export function playTransitionSfx(
  transitionType: VNCinematicTransitionType,
  gainMultiplier = 0.35
): void {
  if (!isTransitionSfxEnabled()) return;
  if (transitionType === 'cut') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, gainMultiplier)), now);
  masterGain.connect(ctx.destination);

  switch (transitionType) {
    // 1. SWOOSH / WHOOSH for slides and camera pushes
    case 'slide_left':
    case 'slide_right':
    case 'slide_up':
    case 'slide_down':
    case 'zoom_in':
    case 'zoom_out':
    case 'door_open':
    case 'circle_wipe': {
      const bufferSize = Math.floor(ctx.sampleRate * 0.4);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(2.5, now);
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.38);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.4);
      break;
    }

    // 2. CYBER GLITCH / DIGITAL ABERRATION
    case 'glitch':
    case 'pixelate': {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.setValueAtTime(120, now + 0.05);
      osc.frequency.setValueAtTime(950, now + 0.1);
      osc.frequency.setValueAtTime(220, now + 0.15);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.setValueAtTime(0.02, now + 0.06);
      gain.gain.setValueAtTime(0.32, now + 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.24);
      break;
    }

    // 3. FLASH WHITE / HIGH IMPACT
    case 'fade_white': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.35);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }

    // 4. CAMERA BLINK / SHUTTER SNAP
    case 'blink': {
      const snap = (startTime: number) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, startTime);
        osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.04);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.05);
      };

      snap(now);
      snap(now + 0.08);
      break;
    }

    // 5. 3D FLIP / CARD FLUTTER
    case 'flip': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.28);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.32);
      break;
    }

    // 6. FADE BLACK / DEEP CINEMATIC DIP
    case 'fade_black':
    case 'dissolve':
    case 'fade': {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.48);
      break;
    }
  }
}
