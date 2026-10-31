'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// ============================================================================
// WEBGL SHADER SOURCES
// ============================================================================

const VERTEX_SHADER_SRC = `
precision mediump float;
attribute vec2 aPosition;
varying vec2 vTextureCoord;

void main() {
  vTextureCoord = (aPosition + 1.0) * 0.5;
  // Flip Y for texture alignment
  vTextureCoord.y = 1.0 - vTextureCoord.y;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;

#define PI2 6.28318530718
#define PI 3.14159265359
#define S(a,b,n) smoothstep(a,b,n)

varying vec2 vTextureCoord;

uniform float uTime;
uniform vec2 uReso;
uniform vec2 uMouse;
uniform float uDist;
uniform float uBlurSize;
uniform float uZoom;
uniform float uSpeed;
uniform vec3 uTintColor;
uniform float uTintOpacity;
uniform sampler2D uTexture;
uniform float uHasCustomTexture;

// Pseudo-random noise
float N12(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

// Procedural multi-scale Raindrop layer (The Art of Code rain algorithm)
vec3 Layer(vec2 uv0, float t) {
  vec2 asp = vec2(2.0, 1.0);
  vec2 uv1 = uv0 * 3.0 * asp * uZoom;
  uv1.y += t * 0.25;

  vec2 gv = fract(uv1) - 0.5;
  vec2 id = floor(uv1);

  float n = N12(id);
  t += n * PI2;

  float w = uv0.y * 10.0;
  float x = (n - 0.5) * 0.8;
  x += (0.4 - abs(x)) * sin(3.0 * w) * pow(sin(w), 6.0) * 0.45;
  float y = -sin(t + sin(t + sin(t) * 0.5)) * (0.5 - 0.06);
  y -= (gv.x - x) * (gv.x - x); // parabolic gravity trail

  vec2 dropPos = (gv - vec2(x, y)) / asp;
  float drop = S(0.035, 0.02, length(dropPos));

  vec2 trailPos = (gv - vec2(x, t * 0.25)) / asp;
  trailPos.y = (fract(trailPos.y * 8.0) - 0.5) / 8.0;
  float trail = S(0.02, 0.012, length(trailPos));

  float fogTrail = S(-0.05, 0.05, dropPos.y);
  fogTrail *= S(0.5, y, gv.y);
  trail *= fogTrail;
  fogTrail *= S(0.035, 0.015, abs(dropPos.x));

  vec2 off = drop * dropPos + trail * trailPos;
  return vec3(off, fogTrail);
}

void main() {
  float dist = uDist;
  float blurSize = uBlurSize;
  float t = mod(uTime * 0.03 * uSpeed, 7200.0);

  vec2 uv = vTextureCoord;

  // Multi-pass rain layers at different depth planes
  vec3 drops = Layer(uv, t);
  drops += Layer(uv * 1.25 + vec2(7.54, 3.21), t);
  drops += Layer(uv * 1.38 + vec2(1.54, 8.92), t);
  drops += Layer(uv * 1.57 - vec2(7.54, 4.38), t);

  // Fog condensation is cleared where drops wash down (drops.z)
  float fogAmount = clamp(1.0 - drops.z * 1.2, 0.0, 1.0);
  float blur = blurSize * 5.0 * fogAmount;

  // Refraction displacement
  vec2 displacedUv = uv + drops.xy * (dist * 0.015);
  displacedUv = clamp(displacedUv, 0.001, 0.999);

  // 16-sample Bokeh Blur distribution
  vec4 col = vec4(0.0);
  float blurStep = blur * 0.0006;
  float a = N12(uv) * PI2;

  for (int n = 0; n < 16; n++) {
    vec2 off = vec2(sin(a), cos(a)) * blurStep;
    float d = fract(sin((float(n) + 1.0) * 546.0) * 5424.0);
    off *= sqrt(d);
    vec2 sampleUv = clamp(displacedUv + off, 0.001, 0.999);
    col += texture2D(uTexture, sampleUv);
    a += 0.3927; // PI2 / 16
  }
  col /= 16.0;

  // Droplet specular highlight ring
  float dropletMask = length(drops.xy);
  float specular = smoothstep(0.005, 0.025, dropletMask) * 0.22;
  col.rgb += vec3(specular);

  // Apply Atmospheric Color Tint
  if (uTintOpacity > 0.0) {
    col.rgb = mix(col.rgb, uTintColor, uTintOpacity);
  }

  // Alpha transparency for transparent overlay mode
  float alpha = uHasCustomTexture > 0.5 ? 1.0 : clamp(fogAmount * 0.35 + dropletMask * 8.0, 0.0, 0.95);

  gl_FragColor = vec4(col.rgb, alpha);
}
`;

// Default texture: offscreen canvas moody rain-gradient
function createDefaultRainTexture(gl: WebGLRenderingContext): WebGLTexture | null {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  // Rich moody cityscape rainy window gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#151025');
  grad.addColorStop(0.3, '#1c1b3d');
  grad.addColorStop(0.65, '#221932');
  grad.addColorStop(1, '#0b0816');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft bokeh street lights through blurred glass
  const lights = [
    { x: 120, y: 340, r: 45, col: 'rgba(255, 170, 70, 0.35)' },
    { x: 280, y: 390, r: 60, col: 'rgba(255, 90, 80, 0.3)' },
    { x: 410, y: 310, r: 50, col: 'rgba(100, 200, 255, 0.35)' },
    { x: 220, y: 220, r: 35, col: 'rgba(240, 240, 200, 0.25)' },
    { x: 340, y: 160, r: 30, col: 'rgba(180, 120, 255, 0.2)' },
  ];
  lights.forEach((l) => {
    const lg = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    lg.addColorStop(0, l.col);
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// ============================================================================
// RAINY SCREEN 2 COMPONENT (WebGL Shader Surface)
// ============================================================================

export const RainyScreen2Component: React.FC<ScreenFxProps> = ({
  intensity = 'medium',
  intensityMultiplier = 1.0,
  params,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  // Read configurable shader parameters
  const dist = typeof params?.dist === 'number' ? params.dist : 5.0; // Refraction
  const blurSize = typeof params?.blurSize === 'number' ? params.blurSize : 5.0; // Fog Blur
  const zoom = typeof params?.zoom === 'number' ? params.zoom : 1.0;
  const speed = typeof params?.speed === 'number' ? params.speed : 1.0;
  const customTextureUrl = params?.textureUrl || params?.previewBackgroundUrl;
  const tintColorHex = params?.tintColor || color || '#1abc9c';
  const tintOpacity = typeof params?.tintOpacity === 'number' ? params.tintOpacity : 0.0;

  // Parse tint hex to RGB vec3
  const parseHex = (hex: string): [number, number, number] => {
    const clean = hex.replace('#', '');
    if (clean.length === 6) {
      return [
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255,
      ];
    }
    return [0.1, 0.73, 0.61]; // Teal fallback
  };

  const levelMult = intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0;
  const effectiveSpeed = speed * levelMult * intensityMultiplier;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) return;

    // Compile Shader Helper
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('Shader compile err:', gl.getShaderInfoLog(s));
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
      console.warn('Program link err:', gl.getProgramInfoLog(program));
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

    // Uniform Locations
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uResoLoc = gl.getUniformLocation(program, 'uReso');
    const uMouseLoc = gl.getUniformLocation(program, 'uMouse');
    const uDistLoc = gl.getUniformLocation(program, 'uDist');
    const uBlurLoc = gl.getUniformLocation(program, 'uBlurSize');
    const uZoomLoc = gl.getUniformLocation(program, 'uZoom');
    const uSpeedLoc = gl.getUniformLocation(program, 'uSpeed');
    const uTintColLoc = gl.getUniformLocation(program, 'uTintColor');
    const uTintOpLoc = gl.getUniformLocation(program, 'uTintOpacity');
    const uTexLoc = gl.getUniformLocation(program, 'uTexture');
    const uHasTexLoc = gl.getUniformLocation(program, 'uHasCustomTexture');

    // Create & bind texture
    let currentTexture = createDefaultRainTexture(gl);
    let hasCustomTex = 0.0;

    if (customTextureUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!gl || gl.isContextLost()) return;
        const customTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, customTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        currentTexture = customTex;
        hasCustomTex = 1.0;
      };
      img.src = customTextureUrl;
    }

    let animId = 0;
    let width = 0;
    let height = 0;
    let startTime = performance.now();

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, Math.floor(rect.width * dpr));
      height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    const [tr, tg, tb] = parseHex(tintColorHex);

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      gl.useProgram(program);

      // Upload uniforms
      gl.uniform1f(uTimeLoc, elapsed * 60.0);
      gl.uniform2f(uResoLoc, width, height);
      gl.uniform2f(uMouseLoc, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uDistLoc, dist);
      gl.uniform1f(uBlurLoc, blurSize);
      gl.uniform1f(uZoomLoc, zoom);
      gl.uniform1f(uSpeedLoc, effectiveSpeed);
      gl.uniform3f(uTintColLoc, tr, tg, tb);
      gl.uniform1f(uTintOpLoc, tintOpacity);
      gl.uniform1f(uHasTexLoc, hasCustomTex);

      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.uniform1i(uTexLoc, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Mouse Tracking for Interactive Condensation
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      if (currentTexture) gl.deleteTexture(currentTexture);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, [dist, blurSize, zoom, effectiveSpeed, customTextureUrl, tintColorHex, tintOpacity]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};

// ============================================================================
// RAINY SCREEN 2 INSPECTOR (Editor Controls)
// ============================================================================

export const RainyScreen2Inspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  playSfx,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dist = typeof params?.dist === 'number' ? params.dist : 5.0;
  const blurSize = typeof params?.blurSize === 'number' ? params.blurSize : 5.0;
  const zoom = typeof params?.zoom === 'number' ? params.zoom : 1.0;
  const speed = typeof params?.speed === 'number' ? params.speed : 1.0;
  const tintColor = params?.tintColor || color || '#1abc9c';
  const tintOpacity = typeof params?.tintOpacity === 'number' ? params.tintOpacity : 0.0;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudioPreview = () => {
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio('/assets/sfx/rain.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
      playSfx?.('/assets/sfx/rain.mp3', true, 0.5);
    }
  };

  const PRESET_STYLES = [
    {
      label: 'Steamy Window',
      subtitle: 'Dense Fog & Heavy Refraction',
      patch: { dist: 6.0, blurSize: 6.0, speed: 1.0, zoom: 1.0, tintColor: '#1abc9c', tintOpacity: 0.1 },
    },
    {
      label: 'Storm Distortion',
      subtitle: 'Rapid Slanted Droplet Flow',
      patch: { dist: 12.0, blurSize: 4.0, speed: 1.8, zoom: 1.25, tintColor: '#3498db', tintOpacity: 0.2 },
    },
    {
      label: 'Gentle Mist',
      subtitle: 'Soft Bokeh & Light Condensation',
      patch: { dist: 3.5, blurSize: 2.5, speed: 0.65, zoom: 0.9, tintColor: '#9b59b6', tintOpacity: 0.15 },
    },
    {
      label: 'Pure Glass',
      subtitle: 'High-Def Optical Water Trails',
      patch: { dist: 8.0, blurSize: 0.5, speed: 1.0, zoom: 1.0, tintColor: '#1abc9c', tintOpacity: 0.0 },
    },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={14} />
          <span>Rainy Screen 2 (WebGL Refraction Shader)</span>
        </span>
        <button
          type="button"
          onClick={toggleAudioPreview}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-teal-500/20 border-teal-400 text-teal-300'
              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          title="Toggle ambient rain audio"
        >
          <span>{isPlayingAudio ? '🔊 Rain SFX: ON' : '🔇 Rain SFX: OFF'}</span>
        </button>
      </div>

      {/* Preset Profiles */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Preset Profiles:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(preset.patch);
                if (preset.patch.tintColor && onColorChange) {
                  onColorChange(preset.patch.tintColor);
                }
              }}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] hover:border-teal-400 hover:bg-teal-500/10 text-left transition-all cursor-pointer group"
            >
              <div className="text-[10px] font-bold text-[var(--text)] group-hover:text-teal-300 truncate">
                {preset.label}
              </div>
              <div className="text-[9px] font-mono text-[var(--muted2)] truncate">
                {preset.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER 1: REFRACTION / DISTORTION (dist) */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Water Refraction Power:</span>
            <span className="text-teal-300 font-mono font-bold">{dist.toFixed(1)}</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">1.0 - 20.0</span>
        </div>
        <input
          type="range"
          min={1.0}
          max={20.0}
          step={0.5}
          value={dist}
          onChange={(e) => onChange({ dist: parseFloat(e.target.value) })}
          className="w-full accent-teal-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>1.0 (Subtle)</span>
          <span>5.0 (Realistic Glass)</span>
          <span>20.0 (Extreme Prism)</span>
        </div>
      </div>

      {/* SLIDER 2: FOG CONDENSATION BLUR (blurSize) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Steam Fog Blur:</span>
            <span className="text-teal-300 font-mono font-bold">{blurSize.toFixed(1)}</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.0 - 12.0</span>
        </div>
        <input
          type="range"
          min={0.0}
          max={12.0}
          step={0.5}
          value={blurSize}
          onChange={(e) => onChange({ blurSize: parseFloat(e.target.value) })}
          className="w-full accent-teal-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0.0 (Clear Glass)</span>
          <span>5.0 (Misty Window)</span>
          <span>12.0 (Heavy Steam)</span>
        </div>
      </div>

      {/* SLIDER 3: DROPLET FLOW SPEED (speed) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Flow Speed:</span>
            <span className="text-teal-300 font-mono font-bold">{speed.toFixed(1)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.2× - 2.5×</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={2.5}
          step={0.1}
          value={speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
          className="w-full accent-teal-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* SLIDER 4: DROPLET ZOOM / SCALE (zoom) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Raindrop Scale / Zoom:</span>
            <span className="text-teal-300 font-mono font-bold">{zoom.toFixed(2)}×</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">0.6× - 1.8×</span>
        </div>
        <input
          type="range"
          min={0.6}
          max={1.8}
          step={0.05}
          value={zoom}
          onChange={(e) => onChange({ zoom: parseFloat(e.target.value) })}
          className="w-full accent-teal-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
      </div>

      {/* ATMOSPHERIC COLOR TINT */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase">Shader Color Wash:</span>
          <span className="font-mono text-[9px] text-teal-300">{tintColor}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={tintColor}
            onChange={(e) => {
              onChange({ tintColor: e.target.value, tintOpacity: tintOpacity === 0 ? 0.2 : tintOpacity });
              onColorChange?.(e.target.value);
            }}
            className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer shrink-0"
            title="Pick Shader Tint"
          />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[9px] text-[var(--muted)]">
              <span>Tint Intensity:</span>
              <span className="font-mono text-teal-300 font-bold">{Math.round(tintOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.7}
              step={0.05}
              value={tintOpacity}
              onChange={(e) => onChange({ tintOpacity: parseFloat(e.target.value) })}
              className="w-full accent-teal-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DEFINITION EXPORT
// ============================================================================

export const rainyScreen2Fx: ScreenFxDefinition = {
  id: 'rainy_screen_2',
  label: 'Rainy Screen 2',
  description: 'Photorealistic WebGL raindrop refraction shader with condensation steam blur and wiping trails',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-400/30',
  defaultSfx: '/assets/sfx/rain.mp3',
  defaultParams: {
    dist: 5.0,
    blurSize: 5.0,
    zoom: 1.0,
    speed: 1.0,
    tintColor: '#1abc9c',
    tintOpacity: 0.0,
  },
  component: RainyScreen2Component,
  inspector: RainyScreen2Inspector,
};
