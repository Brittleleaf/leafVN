'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// HIGH AF PRESETS & TYPES (Drunk Vertigo 3D + WebGL Lissajous Julia Set Fractal)
// ============================================================================

export type HighAfPreset = 'chill_buzz' | 'psychedelic_trip' | 'high_af' | 'astral_realm' | 'custom';
export type FractalBlendMode = 'screen' | 'overlay' | 'color' | 'soft-light';

export const HIGH_AF_PRESETS: Record<
  Exclude<HighAfPreset, 'custom'>,
  {
    label: string;
    description: string;
    icon: string;
    params: {
      fractalOpacity: number;
      blendMode: FractalBlendMode;
      morphSpeed: number;
      colorSpeed: number;
      fractalZoom: number;
      swaySpeed: number;
      swayAmount: number;
      doubleVision: number;
      blurAmount: number;
      chromaticAberration: number;
      vignetteStrength: number;
      mouseReactivity: boolean;
    };
  }
> = {
  chill_buzz: {
    label: 'Chill Buzz',
    description: 'Gentle floaty sway, subtle translucent rainbow fractal aura, and soft defocus.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      fractalOpacity: 0.35,
      blendMode: 'screen',
      morphSpeed: 0.6,
      colorSpeed: 0.8,
      fractalZoom: 1.1,
      swaySpeed: 0.7,
      swayAmount: 6,
      doubleVision: 12,
      blurAmount: 1.8,
      chromaticAberration: 40,
      vignetteStrength: 0.35,
      mouseReactivity: true,
    },
  },
  psychedelic_trip: {
    label: 'Psychedelic Trip',
    description: 'Vivid Lissajous Julia fractal aura, breathing 3D room tilt, and chromatic double vision.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      fractalOpacity: 0.65,
      blendMode: 'screen',
      morphSpeed: 1.0,
      colorSpeed: 1.2,
      fractalZoom: 0.9,
      swaySpeed: 1.1,
      swayAmount: 12,
      doubleVision: 22,
      blurAmount: 3.2,
      chromaticAberration: 75,
      vignetteStrength: 0.55,
      mouseReactivity: true,
    },
  },
  high_af: {
    label: 'High AF (Full Immersion)',
    description: 'Deep 3D vertigo tilt, intense kaleidoscope Julia set, and heavy diplopia.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      fractalOpacity: 0.85,
      blendMode: 'screen',
      morphSpeed: 1.4,
      colorSpeed: 1.6,
      fractalZoom: 0.8,
      swaySpeed: 1.5,
      swayAmount: 18,
      doubleVision: 32,
      blurAmount: 4.8,
      chromaticAberration: 90,
      vignetteStrength: 0.7,
      mouseReactivity: true,
    },
  },
  astral_realm: {
    label: 'Astral Realm / Ego Dissolution',
    description: 'Overwhelming reality-shifting fractal overlay, rich contrast burn, and deep tunnel darkness.',
    icon: GUI_ICONS.action.sparkles,
    params: {
      fractalOpacity: 0.95,
      blendMode: 'overlay',
      morphSpeed: 0.8,
      colorSpeed: 2.2,
      fractalZoom: 0.65,
      swaySpeed: 1.8,
      swayAmount: 22,
      doubleVision: 38,
      blurAmount: 6.0,
      chromaticAberration: 100,
      vignetteStrength: 0.85,
      mouseReactivity: true,
    },
  },
};

// ============================================================================
// WEBGL SHADER SOURCES (Lissajous Julia Set Fractal with HSV Color Cycling)
// ============================================================================

const VERTEX_SHADER_SRC = `
precision mediump float;
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;
varying vec2 vUv;

uniform vec2 iResolution;
uniform float iGlobalTime;
uniform float uFractalOpacity;
uniform float uZoom;
uniform float uMorphSpeed;
uniform float uColorSpeed;
uniform float uSaturation;

#define PI 3.14159265359

const float a = 5.0;
const float b = 4.0;
const float w = PI / 2.0;

// Converts HSV to RGB vec3
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Lissajous curve parametric driving coordinates
vec2 lissajous(float t) {
  float x = sin(a * t + w);
  float y = sin(b * t);
  return vec2(x, y);
}

void main(void) {
  float aspect = iResolution.x / iResolution.y;
  float xmin = -1.8 * uZoom * aspect;
  float ymin = -1.8 * uZoom;
  float xmax = 1.8 * uZoom * aspect;
  float ymax = 1.8 * uZoom;

  float xDelta = (xmax - xmin) / iResolution.x;
  float yDelta = (ymax - ymin) / iResolution.y;

  int iteration = 0;
  const int max_iteration = 75;

  float t = (iGlobalTime * 0.1 * uMorphSpeed) + 219.17;
  vec2 l = lissajous(t);

  float x = xmin + gl_FragCoord.x * xDelta;
  float y = ymin + gl_FragCoord.y * yDelta;

  for (int i = 0; i < max_iteration; i++) {
    float xtemp = x * x - y * y + l.x;
    y = 2.0 * x * y + l.y;
    x = xtemp;
    iteration = i;
    if (x * x + y * y > 16.0) break;
  }

  float log_zn;
  float nu;
  float sm = float(iteration);
  float s = 0.0;
  float v = 0.0;

  if (iteration < max_iteration) {
    log_zn = log(x * x + y * y) / 2.0;
    nu = log(log_zn / log(2.0)) / log(2.0);
    sm = float(iteration) + 1.0 - nu;
    s = uSaturation;
    v = 0.75;
  }

  // Smooth rainbow color cycling
  float c = sm / float(max_iteration) * 45.0 + (iGlobalTime * 0.12 * uColorSpeed);
  vec3 hsv = hsv2rgb(vec3(c, s, v));

  // Output color with alpha proportional to fractal energy and configurable opacity
  float alpha = v * uFractalOpacity;
  gl_FragColor = vec4(hsv * alpha, alpha);
}
`;

// ============================================================================
// HIGH AF COMPONENT (Drunk Vertigo 3D + WebGL Julia Set Fractal)
// ============================================================================

export const HighAfComponent: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghost1Ref = useRef<HTMLDivElement | null>(null);
  const ghost2Ref = useRef<HTMLDivElement | null>(null);

  // Multiplier for level
  const levelMult = intensity === 'light' ? 0.65 : intensity === 'heavy' ? 1.4 : 1.0;
  const effectiveMultiplier = (params?.intensityMultiplier ?? 1.0) * levelMult * intensityMultiplier;

  // Shader params
  const fractalOpacity = Math.max(0, Math.min(1.0, (params?.fractalOpacity ?? 0.65) * effectiveMultiplier));
  const blendMode: FractalBlendMode = params?.blendMode || 'screen';
  const morphSpeed = Math.max(0.1, params?.morphSpeed ?? 1.0);
  const colorSpeed = Math.max(0.1, params?.colorSpeed ?? 1.2);
  const fractalZoom = Math.max(0.3, params?.fractalZoom ?? 0.9);

  // Drunk POV physics params
  const doubleVision = Math.max(0, (params?.doubleVision ?? 22) * effectiveMultiplier);
  const swaySpeed = Math.max(0.1, (params?.swaySpeed ?? 1.1));
  const swayAmount = Math.max(0, (params?.swayAmount ?? 12) * effectiveMultiplier);
  const blurAmount = Math.max(0, (params?.blurAmount ?? 3.2) * effectiveMultiplier);
  const chromaticAberration = Math.max(0, Math.min(100, params?.chromaticAberration ?? 75));
  const vignetteStrength = Math.max(0, Math.min(1, params?.vignetteStrength ?? 0.55));
  const mouseReactivity = params?.mouseReactivity ?? true;

  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // 1. Mouse Tracking for 3D Disorientation
  useEffect(() => {
    if (!mouseReactivity) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xNorm = (e.clientX / innerWidth) * 2 - 1;
      const yNorm = (e.clientY / innerHeight) * 2 - 1;

      const rawTargetX = xNorm * 18;
      const rawTargetY = yNorm * 14;
      mousePosRef.current.targetX = Math.max(-24, Math.min(24, rawTargetX));
      mousePosRef.current.targetY = Math.max(-18, Math.min(18, rawTargetY));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseReactivity]);

  // 2. WebGL Fractal Shader Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('High AF Shader error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('High AF Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry covering [-1, -1] to [1, 1]
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uResoLoc = gl.getUniformLocation(program, 'iResolution');
    const uTimeLoc = gl.getUniformLocation(program, 'iGlobalTime');
    const uOpacityLoc = gl.getUniformLocation(program, 'uFractalOpacity');
    const uZoomLoc = gl.getUniformLocation(program, 'uZoom');
    const uMorphLoc = gl.getUniformLocation(program, 'uMorphSpeed');
    const uColorLoc = gl.getUniformLocation(program, 'uColorSpeed');
    const uSatLoc = gl.getUniformLocation(program, 'uSaturation');

    let animId = 0;
    const startTime = performance.now();

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      gl.useProgram(program);
      gl.uniform2f(uResoLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform1f(uOpacityLoc, fractalOpacity);
      gl.uniform1f(uZoomLoc, fractalZoom);
      gl.uniform1f(uMorphLoc, morphSpeed);
      gl.uniform1f(uColorLoc, colorSpeed);
      gl.uniform1f(uSatLoc, 1.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (vert) gl.deleteShader(vert);
      if (frag) gl.deleteShader(frag);
      if (program) gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [fractalOpacity, fractalZoom, morphSpeed, colorSpeed]);

  // 4. 60fps 3D Vertigo Sway & Diplopia Loop
  useEffect(() => {
    let animId = 0;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const t = elapsed * swaySpeed;

      // Mouse lerp damping
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;

      // Breathing 3D perspective rotation
      const swayRoll = Math.sin(t * 1.2) * (swayAmount * 0.4);
      const swayPitch = Math.cos(t * 0.9) * (swayAmount * 0.3) + mousePosRef.current.y;
      const swayYaw = Math.sin(t * 0.8) * (swayAmount * 0.35) + mousePosRef.current.x;
      const skewXVal = Math.sin(t * 1.1) * (swayAmount * 0.25) + mousePosRef.current.x * 0.2;
      const skewYVal = Math.cos(t * 1.3) * (swayAmount * 0.25) + mousePosRef.current.y * 0.2;

      // Diplopia vectors
      const eyeSeparation = (Math.sin(t * 1.5) * 0.5 + 0.5) * doubleVision;
      const ghost1X = Math.cos(t * 0.7) * eyeSeparation;
      const ghost1Y = Math.sin(t * 0.9) * (eyeSeparation * 0.6);
      const ghost2X = -Math.cos(t * 0.7 + 0.5) * (eyeSeparation * 0.8);
      const ghost2Y = -Math.sin(t * 0.9 + 0.5) * (eyeSeparation * 0.5);

      const currentBlur = blurAmount * (0.65 + 0.35 * Math.sin(t * 1.7));

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
  }, [swaySpeed, swayAmount, doubleVision, blurAmount]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-30"
      style={{
        perspective: '900px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 1. WebGL Lissajous Julia Set Fractal Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
        style={{
          mixBlendMode: blendMode,
          opacity: fractalOpacity,
        }}
      />

      {/* 2. Ghost Diplopia Layer 1: Red/Magenta Optical Chromatic Split (Oversized with feathered mask) */}
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

      {/* 3. Ghost Diplopia Layer 2: Cyan/Blue Optical Chromatic Split (Oversized with feathered mask) */}
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

      {/* 4. Optical Blur Glaze */}
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

      {/* 5. Psychedelic Vignette */}
      {vignetteStrength > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            opacity: vignetteStrength,
            background: `radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(30, 10, 45, 0.4) 75%, rgba(12, 3, 20, 0.9) 100%)`,
          }}
        />
      )}

    </div>
  );
};

// ============================================================================
// HIGH AF INSPECTOR
// ============================================================================

export const HighAfInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  playSfx,
}) => {
  const currentPreset = (params?.preset as HighAfPreset) || 'psychedelic_trip';
  const currentMultiplier = params?.intensityMultiplier ?? 1.0;
  const fractalOpacity = params?.fractalOpacity ?? 0.65;
  const blendMode: FractalBlendMode = params?.blendMode || 'screen';
  const morphSpeed = params?.morphSpeed ?? 1.0;
  const colorSpeed = params?.colorSpeed ?? 1.2;
  const fractalZoom = params?.fractalZoom ?? 0.9;
  const doubleVision = params?.doubleVision ?? 22;
  const swaySpeed = params?.swaySpeed ?? 1.1;
  const swayAmount = params?.swayAmount ?? 12;
  const blurAmount = params?.blurAmount ?? 3.2;
  const chromaticAberration = params?.chromaticAberration ?? 75;
  const vignetteStrength = params?.vignetteStrength ?? 0.55;
  const mouseReactivity = params?.mouseReactivity ?? true;

  const applyPreset = (presetKey: Exclude<HighAfPreset, 'custom'>) => {
    const p = HIGH_AF_PRESETS[presetKey];
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
          <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={15} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              High AF: Psychedelic Julia Fractal & Vertigo
            </h4>
            <p className="text-[10px] text-[var(--muted)]">
              WebGL Lissajous Julia fractal shader combined with 3D inebriation sway & diplopia
            </p>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold uppercase">
          WebGL + 3D POV
        </span>
      </div>

      {/* 2. Presets Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
          Psychedelic Trip Presets
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(HIGH_AF_PRESETS) as Array<Exclude<HighAfPreset, 'custom'>>).map((key) => {
            const p = HIGH_AF_PRESETS[key];
            const isSelected = currentPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-sm shadow-purple-500/20'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--muted2)]'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <GuiIconRenderer icon={p.icon} size={12} className={isSelected ? 'text-purple-300' : 'text-[var(--muted)]'} />
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

      {/* 3. Fractal Intensity & Blend Mode */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Fractal Opacity:</span>
            <span className="font-mono text-purple-300 font-bold">{Math.round(fractalOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={fractalOpacity}
            onChange={(e) => onChange({ preset: 'custom', fractalOpacity: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-[var(--muted)] uppercase block">Blend Mode:</span>
          <div className="grid grid-cols-2 gap-1">
            {(['screen', 'overlay', 'color', 'soft-light'] as FractalBlendMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ preset: 'custom', blendMode: mode })}
                className={`py-1 px-1 rounded text-[9px] font-mono uppercase font-bold border transition-colors cursor-pointer text-center ${
                  blendMode === mode
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Fractal Morph Speed & Color Cycle */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Lissajous Morph:</span>
            <span className="font-mono text-purple-300 font-bold">{morphSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3.0}
            step={0.1}
            value={morphSpeed}
            onChange={(e) => onChange({ preset: 'custom', morphSpeed: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Rainbow Cycle:</span>
            <span className="font-mono text-purple-300 font-bold">{colorSpeed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={3.5}
            step={0.1}
            value={colorSpeed}
            onChange={(e) => onChange({ preset: 'custom', colorSpeed: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 5. 3D Tilt Sway & Double Vision */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Vertigo Sway:</span>
            <span className="font-mono text-purple-300 font-bold">{swayAmount}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={swayAmount}
            onChange={(e) => onChange({ preset: 'custom', swayAmount: parseInt(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Double Vision:</span>
            <span className="font-mono text-purple-300 font-bold">{doubleVision}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={doubleVision}
            onChange={(e) => onChange({ preset: 'custom', doubleVision: parseInt(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 6. Vision Blur & Vignette */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[var(--border)]">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Defocus Blur:</span>
            <span className="font-mono text-purple-300 font-bold">{blurAmount.toFixed(1)}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={blurAmount}
            onChange={(e) => onChange({ preset: 'custom', blurAmount: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-semibold uppercase">Tunnel Vignette:</span>
            <span className="font-mono text-purple-300 font-bold">{Math.round(vignetteStrength * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vignetteStrength}
            onChange={(e) => onChange({ preset: 'custom', vignetteStrength: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
        </div>
      </div>

      {/* 7. Toggles: Mouse Reactivity & High Thoughts */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold block text-[var(--text)]">Mouse Disorientation</span>
            <span className="text-[9px] text-[var(--muted)]">3D camera leans and tilts following cursor</span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ mouseReactivity: !mouseReactivity })}
            className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
              mouseReactivity
                ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {mouseReactivity ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HIGH AF SCREEN FX REGISTRATION DEFINITION
// ============================================================================

export const highAfFx: ScreenFxDefinition = {
  id: 'high_af',
  label: 'High AF',
  description: 'Psychedelic immersion combining WebGL Lissajous Julia set fractal shader, 3D vertigo room tilt, and double vision.',
  icon: GUI_ICONS.action.sparkles,
  badgeColor: 'border-purple-500 bg-purple-950/80 text-purple-200',
  defaultParams: {
    preset: 'psychedelic_trip',
    fractalOpacity: 0.65,
    blendMode: 'screen',
    morphSpeed: 1.0,
    colorSpeed: 1.2,
    fractalZoom: 0.9,
    swaySpeed: 1.1,
    swayAmount: 12,
    doubleVision: 22,
    blurAmount: 3.2,
    chromaticAberration: 75,
    vignetteStrength: 0.55,
    mouseReactivity: true,
    intensityMultiplier: 1.0,
  },
  component: HighAfComponent,
  inspector: HighAfInspector,
};
