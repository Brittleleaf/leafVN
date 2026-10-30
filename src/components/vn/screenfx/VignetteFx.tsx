'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// Convert hex color to rgba helper
function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const VignetteComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  color = '#000000',
  animation = 'none',
  params,
}) => {
  const activeColor = params?.color || color || '#000000';
  const activeAnimation = params?.animation || animation || 'none';
  const activeIntensity = params?.intensity || intensity || 'medium';

  // Configuración de sombra interior según intensidad
  const shadowMap: Record<string, { blur: number; spread: number; opacity: number }> = {
    light: { blur: Math.round(130 * intensityMultiplier), spread: 8, opacity: 0.75 },
    medium: { blur: Math.round(200 * intensityMultiplier), spread: 15, opacity: 0.9 },
    heavy: { blur: Math.round(320 * intensityMultiplier), spread: 40, opacity: 0.98 },
  };
  const shadowConfig = shadowMap[String(activeIntensity)] || shadowMap.medium;

  // Estilos de animación según el sub-efecto elegido
  let animationStyle: React.CSSProperties = {};
  if (activeAnimation === 'flicker') {
    animationStyle = { animation: 'vignetteFlicker 0.22s ease-in-out infinite' };
  } else if (activeAnimation === 'heartbeat') {
    animationStyle = { animation: 'vignetteHeartbeat 1.25s cubic-bezier(0.25, 1, 0.5, 1) infinite' };
  } else if (activeAnimation === 'breathe') {
    animationStyle = { animation: 'vignetteBreathe 3s ease-in-out infinite' };
  }

  const edgeColor = hexToRgba(activeColor, shadowConfig.opacity);
  const deepEdgeColor = hexToRgba(activeColor, Math.min(1, shadowConfig.opacity * 1.15));

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      <style jsx global>{`
        @keyframes vignetteFlicker {
          0%, 100% { opacity: 0.82; }
          25% { opacity: 0.6; }
          50% { opacity: 0.98; }
          75% { opacity: 0.7; }
        }

        @keyframes vignetteHeartbeat {
          0% {
            opacity: 0.5;
            transform: scale(1);
          }
          14% {
            opacity: 0.95;
            transform: scale(1.04);
          }
          28% {
            opacity: 0.65;
            transform: scale(1.01);
          }
          42% {
            opacity: 1;
            transform: scale(1.06);
          }
          65%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
        }

        @keyframes vignetteBreathe {
          0%, 100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 0.98;
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* Capa de Viñeta interactiva con Box Shadow y Gradiente Radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0px 0px ${shadowConfig.blur}px ${shadowConfig.spread}px ${edgeColor}`,
          background: `radial-gradient(ellipse at center, transparent 35%, ${hexToRgba(activeColor, 0.4 * shadowConfig.opacity)} 70%, ${deepEdgeColor} 100%)`,
          ...animationStyle,
        }}
      />
    </div>
  );
};

export const VignetteInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
}) => {
  const currentColor = params?.color || color || '#000000';
  const currentAnimation = params?.animation || 'none';

  return (
    <div className="space-y-3 pt-3 border-t border-[var(--border)] bg-[var(--well-bg)] p-3 rounded-xl border">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5" />
          <span>Vignette Color & Dynamic Animation</span>
        </label>
      </div>

      {/* Color Picker & Presets */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Shadow Color:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ color: val });
                onColorChange?.(val);
              }}
              className="w-6 h-6 rounded border border-[var(--border)] bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ color: val });
                onColorChange?.(val);
              }}
              className="w-20 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-1.5 py-0.5 text-[11px] text-amber-600 dark:text-amber-300 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {[
            { label: 'Black', hex: '#000000', bg: 'bg-black text-white' },
            { label: 'Blood', hex: '#881337', bg: 'bg-rose-900 text-rose-100' },
            { label: 'Abyss', hex: '#172554', bg: 'bg-blue-950 text-blue-100' },
            { label: 'Void', hex: '#3b0764', bg: 'bg-purple-950 text-purple-100' },
            { label: 'Toxic', hex: '#022c22', bg: 'bg-emerald-950 text-emerald-100' },
            { label: 'White', hex: '#f8fafc', bg: 'bg-slate-200 text-black' },
            { label: 'Amber', hex: '#451a03', bg: 'bg-amber-950 text-amber-100' },
          ].map((p) => (
            <button
              key={p.hex}
              type="button"
              onClick={() => {
                onChange({ color: p.hex });
                onColorChange?.(p.hex);
              }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                currentColor.toLowerCase() === p.hex.toLowerCase()
                  ? 'border-amber-400 ring-1 ring-amber-400 scale-105'
                  : 'border-[var(--border)] hover:border-[var(--border2)]'
              } ${p.bg}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Effect Animation */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Behavior / Sub-Effect:</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'none', label: 'Static', icon: GUI_ICONS.action.pause },
            { id: 'flicker', label: 'Flicker', icon: GUI_ICONS.general.screenFx },
            { id: 'heartbeat', label: 'Heartbeat', icon: GUI_ICONS.general.heart },
            { id: 'breathe', label: 'Breathe', icon: GUI_ICONS.action.lookAt },
          ].map((anim) => {
            const isSelected = currentAnimation === anim.id;
            return (
              <button
                key={anim.id}
                type="button"
                onClick={() => onChange({ animation: anim.id })}
                className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200 ring-1 ring-amber-500 font-bold'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                }`}
              >
                <div className="flex items-center justify-center py-0.5">
                  <GuiIconRenderer icon={anim.icon} className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] mt-0.5">{anim.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const vignetteFx: ScreenFxDefinition = {
  id: 'vignette',
  label: 'Vignette (Customizable)',
  description: 'Adjustable vignette shadow with custom colors (dark, blood red, void purple, white) and animation modes (static, heartbeat, flicker, breathe).',
  icon: GUI_ICONS.general.circle,
  badgeColor: 'border-zinc-500 bg-zinc-950/80 text-zinc-300',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  defaultParams: {
    color: '#000000',
    animation: 'none',
  },
  component: VignetteComponent,
  inspector: VignetteInspector,
};
