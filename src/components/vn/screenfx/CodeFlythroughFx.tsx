'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const DEFAULT_FLYTHROUGH_CODE_WORDS = [
  'function()',
  'Debug.Print()',
  'for(i=0;i<length;i++)',
  'var i',
  'ASCII',
  'Math.random()',
  'abs()',
  'block',
  'bool',
  'hasDedicatedThread()',
  'setup.exe',
  'var me = new Person()',
  'terminate()',
  'abort()',
  'acos()',
  'asin()',
  'ceil()',
  'floor()',
  'isalpha()',
  'remove()',
  'toupper()',
  'modf()',
  '<html></html>',
  '$.ajax({})',
  'int64',
  '$query',
  'AI',
  'crypt()',
  '===',
  '!==',
  'empty()',
  'operators',
  'threading()',
  'session_start',
  '$_GET["param"]',
  '$_POST["password"]',
  'hypertext',
  'color: black;',
  'font-family: Consolas',
  'array_push()',
  'array.push',
  'array_map()',
  'array_diff()',
  'base64_decode',
  'bcmod',
  'bcpow',
  'CachingIterator::count',
  'new Date()',
  'session_encode',
  'shuffle()',
  'sin',
  'sizeOf',
  'socket_bind',
  'socket_accept',
  'socket_sendto',
  'DateTime::setDate',
  '0',
  '1',
  '101010',
  '010101',
];

interface Particle3D {
  x: number;
  y: number;
  z: number;
  speed: number;
  word: string;
  quadX: number;
  quadY: number;
}

export const CodeFlythroughComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  color = '#10b981',
  customWords,
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeColor = params?.color || color || '#10b981';

  const words = useMemo(() => {
    if (params?.words && Array.isArray(params.words) && params.words.length > 0) {
      return params.words;
    }
    if (params?.customWords && Array.isArray(params.customWords) && params.customWords.length > 0) {
      return params.customWords;
    }
    if (customWords && customWords.length > 0) {
      return customWords;
    }
    return DEFAULT_FLYTHROUGH_CODE_WORDS;
  }, [params?.words, params?.customWords, customWords]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Particle count based on intensity
    const particleCount = Math.round(
      (intensity === 'light' ? 35 : intensity === 'heavy' ? 120 : 65) * intensityMultiplier
    );

    const baseSpeed =
      (intensity === 'light' ? 3.0 : intensity === 'heavy' ? 6.5 : 4.5) * intensityMultiplier;

    // Helper to initialize or respawn a single 3D particle
    const createParticle = (initialZ?: number): Particle3D => {
      const quadX = Math.random() > 0.5 ? 1 : -1;
      const quadY = Math.random() > 0.5 ? 1 : -1;
      return {
        x: (Math.random() - 0.5) * (width * 0.9),
        y: (Math.random() - 0.5) * (height * 0.9),
        z: typeof initialZ === 'number' ? initialZ : 1000 + Math.random() * 200,
        speed: baseSpeed * (0.85 + Math.random() * 0.35),
        word: (words && words.length > 0 ? words[Math.floor(Math.random() * words.length)] : null) || '0101',
        quadX,
        quadY,
      };
    };

    // Stagger particles across depth on initial load
    const particles: Particle3D[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(Math.random() * 1000));
    }

    const fov = 320;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Sort particles by depth for correct 3D perspective layering
      particles.sort((a, b) => b.z - a.z);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Advance toward camera
        p.z -= p.speed;

        // Accelerate outward slightly as it approaches camera (matching perspective flythrough)
        const progress = Math.max(0, (1000 - p.z) / 1000);
        p.x += p.quadX * progress * 0.65;
        p.y += p.quadY * progress * 0.45;

        // Respawn when it passes camera
        if (p.z <= 25) {
          particles[i] = createParticle(1000);
          continue;
        }

        const scale = fov / Math.max(20, p.z);
        const screenX = centerX + p.x * scale;
        const screenY = centerY + p.y * scale;

        // Skip if outside screen bounds
        if (screenX < -150 || screenX > width + 150 || screenY < -80 || screenY > height + 80) {
          particles[i] = createParticle(1000);
          continue;
        }

        // Opacity curve: fade in from distance, full glow in mid-flight, rapid fade out as it flies past
        let alpha = 0;
        if (p.z > 700) {
          alpha = ((1000 - p.z) / 300) * 0.75;
        } else if (p.z > 120) {
          alpha = 0.85;
        } else {
          alpha = Math.max(0, (p.z - 25) / 95) * 0.85;
        }

        const fontSize = Math.max(8, Math.min(52, Math.round(13 * scale)));

        ctx.save();
        ctx.font = `bold ${fontSize}px Consolas, Menlo, Monaco, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1, Math.max(0, alpha * intensityMultiplier));

        // Glow effect
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = Math.min(16, fontSize * 0.4);
        ctx.fillStyle = activeColor;

        ctx.fillText(p.word, screenX, screenY);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [words, intensity, intensityMultiplier, activeColor]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          filter: 'contrast(1.15)',
        }}
      />
    </div>
  );
};

export const CodeFlythroughInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  playSfx,
  notify,
}) => {
  const words: string[] =
    params.words || params.customWords || DEFAULT_FLYTHROUGH_CODE_WORDS;
  const currentColor = params.color || color || '#10b981';

  const presets = [
    {
      label: 'Código & Sintaxis',
      words: [
        'function()',
        'Debug.Print()',
        'for(i=0;i<len;i++)',
        'var i',
        'ASCII',
        'Math.random()',
        'abs()',
        'bool',
        'thread()',
        'return false',
        'import sys',
        '<div>',
        'null',
        '0x7FFD',
        'stack.overflow',
        'SIGSEGV',
        'ptr->val',
        'catch(e)',
      ],
    },
    {
      label: '01 Matriz Binaria',
      words: [
        '01010011',
        '11001010',
        '00101101',
        '10110001',
        '01101111',
        '11110000',
        '00001111',
        '01010101',
        '10101010',
        '00110011',
        '11001100',
        'ACCESS',
        'KERNEL',
        'DECRYPTING...',
      ],
    },
    {
      label: 'Alerta Cyberpunk',
      words: [
        'WARNING',
        'BREACH DETECTED',
        'CRITICAL ERROR',
        'SYSTEM OVERLOAD',
        'SECURITY FAULT',
        'FIREWALL BYPASS',
        'LOCKDOWN',
        'UNAUTHORIZED',
        '0x000000F4',
        'TERMINATE',
        'INTRUSION',
        'ISOLATING NODE',
      ],
    },
    {
      label: 'Susurros / Terror',
      words: [
        'HELP ME',
        'LOOK BEHIND',
        'DONT TURN AROUND',
        'I SEE YOU',
        'IT BURNS',
        'FORGIVE ME',
        'CAN YOU HEAR IT?',
        'WAKE UP',
        'NOT REAL',
        'RUN',
        'TOO LATE',
        'REMEMBER ME',
        'LIES',
      ],
    },
  ];

  const colorPresets = [
    { label: 'Matrix', hex: '#10b981', bg: 'bg-emerald-950 text-emerald-300 border-emerald-600' },
    { label: 'Cyan Net', hex: '#06b6d4', bg: 'bg-cyan-950 text-cyan-300 border-cyan-600' },
    { label: 'Terminal Amber', hex: '#f59e0b', bg: 'bg-amber-950 text-amber-300 border-amber-600' },
    { label: 'Neon Rose', hex: '#f43f5e', bg: 'bg-rose-950 text-rose-300 border-rose-600' },
    { label: 'White Phosphor', hex: '#ffffff', bg: 'bg-neutral-800 text-white border-neutral-400' },
  ];

  return (
    <div className="space-y-3 pt-3 border-t border-[var(--border)] bg-[var(--well-bg)] p-3 rounded-xl border">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
          <span>Cyber Code 3D Words & Presets</span>
        </label>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--card-bg)] border border-[var(--border)] text-emerald-600 dark:text-emerald-300">
          {words.length} palabras
        </span>
      </div>

      {/* Quick Presets */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">
          Cargar Vocabulario Predeterminado:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                onChange({ words: p.words, customWords: p.words });
                playSfx?.('/assets/sfx/click intro.mp3', false, 0.2);
                notify?.(`Preset cargado: ${p.label}`);
              }}
              className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] hover:border-emerald-500 hover:text-emerald-500 text-[10px] font-bold text-left truncate transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Words Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">
            Palabras personalizadas (separadas por comas o líneas):
          </span>
          {(params.words || params.customWords) && (
            <button
              type="button"
              onClick={() => onChange({ words: undefined, customWords: undefined })}
              className="text-[9px] text-[var(--muted2)] hover:text-red-400 cursor-pointer"
            >
              Restaurar defecto
            </button>
          )}
        </div>
        <textarea
          rows={3}
          value={words.join(', ')}
          onChange={(e) => {
            const raw = e.target.value;
            const parsed = raw
              .split(/[,\n]/)
              .map((w) => w.trim())
              .filter((w) => w.length > 0);
            onChange({
              words: parsed.length > 0 ? parsed : undefined,
              customWords: parsed.length > 0 ? parsed : undefined,
            });
          }}
          placeholder="Enter words separated by commas..."
          className="w-full bg-[var(--card-bg)] border border-[var(--border)] focus:border-emerald-500 rounded-lg p-2 text-xs text-[var(--text)] font-mono resize-y outline-none"
        />
      </div>

      {/* Color Picker & Matrix Presets */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Color de Texto:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                onChange({ color: e.target.value });
                onColorChange?.(e.target.value);
              }}
              className="w-6 h-6 rounded border border-[var(--border)] bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                onChange({ color: e.target.value });
                onColorChange?.(e.target.value);
              }}
              className="w-20 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {colorPresets.map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => {
                onChange({ color: p.hex });
                onColorChange?.(p.hex);
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                currentColor.toLowerCase() === p.hex.toLowerCase()
                  ? 'ring-1 ring-emerald-400 scale-105 shadow-sm'
                  : 'opacity-70 hover:opacity-100'
              } ${p.bg}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const codeFlythroughFx: ScreenFxDefinition = {
  id: 'code_flythrough',
  label: 'Cyber Code Flythrough 3D',
  description: 'Customizable stream of code syntax, binary, or narrative words flying toward the screen in 3D perspective.',
  icon: GUI_ICONS.general.files,
  badgeColor: 'border-emerald-500 bg-emerald-950/80 text-emerald-300',
  defaultSfx: '/assets/sfx/BGM/bg-tvnoise.mp3',
  defaultParams: {
    words: DEFAULT_FLYTHROUGH_CODE_WORDS,
    color: '#10b981',
  },
  component: CodeFlythroughComponent,
  inspector: CodeFlythroughInspector,
};
