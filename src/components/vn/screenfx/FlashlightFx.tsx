'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

// Helper sound player
const playSound = (url: string, vol = 0.4) => {
  try {
    const a = new Audio(url);
    a.volume = vol;
    a.play().catch(() => {});
  } catch {}
};

export const FlashlightComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  color = '#fffbe8',
  flashlightMode = 'normal',
  flashlightRadius,
  flashlightShutdown = false,
  flashlightHitsRequired = 3,
  onFlashlightReactivated,
  params,
}) => {
  const effectiveMode = params?.mode || flashlightMode || 'normal';
  const effectiveShutdown = params?.shutdown !== undefined ? params.shutdown : flashlightShutdown;
  const effectiveHitsRequired = params?.hitsRequired || flashlightHitsRequired || 3;
  const effectiveColor = params?.color || color || '#fffbe8';

  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 400, y: 250 });
  const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 800, h: 500 });
  const [isBrokenFlickering, setIsBrokenFlickering] = useState(false);
  const [hits, setHits] = useState(0);
  const [isTurnedOff, setIsTurnedOff] = useState(effectiveShutdown);
  const [sparkFlash, setSparkFlash] = useState(false);

  // Sync shutdown prop
  useEffect(() => {
    setIsTurnedOff(effectiveShutdown);
    if (effectiveShutdown) {
      setHits(0);
    }
  }, [effectiveShutdown]);

  // Radius calculation
  const baseRadius = params?.radius || flashlightRadius || (intensity === 'light' ? 110 : intensity === 'heavy' ? 240 : 170);
  const radius = Math.round(baseRadius * intensityMultiplier);

  // Measure container and listen to mouse movements
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ w: rect.width || 800, h: rect.height || 500 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setCoords({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Broken Flashlight: random procedural flicker
  useEffect(() => {
    if (effectiveMode !== 'broken' || isTurnedOff) return;

    let isMounted = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const addTimeout = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (isMounted) fn();
      }, ms);
      timeouts.push(t);
      return t;
    };

    const scheduleNextFlicker = () => {
      if (!isMounted) return;
      const delay = Math.random() * 4000 + 2500; // 2.5s to 6.5s
      addTimeout(() => {
        setIsBrokenFlickering(true);
        playSound('/assets/sfx/click interface.mp3', 0.25);
        
        addTimeout(() => {
          setIsBrokenFlickering(false);
          // 40% chance of a double stutter
          if (Math.random() < 0.4) {
            addTimeout(() => {
              setIsBrokenFlickering(true);
              addTimeout(() => setIsBrokenFlickering(false), 80);
            }, 120);
          }
          scheduleNextFlicker();
        }, Math.random() * 120 + 60);
      }, delay);
    };

    scheduleNextFlicker();
    return () => {
      isMounted = false;
      timeouts.forEach(clearTimeout);
    };
  }, [effectiveMode, isTurnedOff]);

  // Handle hit / click to restore shutdown flashlight
  const handleHitFlashlight = useCallback(() => {
    if (!isTurnedOff) return;
    const nextHits = hits + 1;
    setHits(nextHits);

    if (nextHits < effectiveHitsRequired) {
      // Sparks & filament flicker
      playSound('/assets/sfx/click interface.mp3', 0.5);
      setSparkFlash(true);
      setTimeout(() => setSparkFlash(false), 90);
    } else {
      // Final hit: Success!
      playSound('/assets/sfx/click intro.mp3', 0.8);
      setSparkFlash(true);
      setTimeout(() => {
        setSparkFlash(false);
        setIsTurnedOff(false);
        onFlashlightReactivated?.();
      }, 150);
    }
  }, [hits, isTurnedOff, effectiveHitsRequired, onFlashlightReactivated]);

  // Keyboard shortcut 'F' to hit flashlight
  useEffect(() => {
    if (!isTurnedOff) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = document.activeElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleHitFlashlight();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTurnedOff, handleHitFlashlight]);

  const cx = coords.x;
  const cy = coords.y;
  const bottomX = dimensions.w / 2;
  const bottomY = dimensions.h;

  // Opacity calculations
  const isDark = isTurnedOff && !sparkFlash;
  const lightOpacity = isDark ? 0 : isBrokenFlickering ? 0.25 : 1;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden select-none ${
        isTurnedOff ? 'pointer-events-auto cursor-pointer z-40' : 'pointer-events-none z-35'
      }`}
      onClick={isTurnedOff ? handleHitFlashlight : undefined}
    >
      <style jsx global>{`
        @keyframes flashlightJitter {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes hitShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-4px, 3px); }
          40% { transform: translate(4px, -3px); }
          60% { transform: translate(-2px, 2px); }
          80% { transform: translate(2px, -1px); }
        }
      `}</style>

      {/* 1. Light Cone Beam (from bottom player position to cursor spotlight) */}
      {!isDark && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: lightOpacity * 0.55 }}
        >
          <defs>
            <linearGradient id="flashlightBeamGrad" x1={bottomX} y1={bottomY} x2={cx} y2={cy} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="60%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            d={`M ${cx - radius * 0.85} ${cy} Q ${bottomX} ${(cy + bottomY) / 2} ${bottomX - 40} ${bottomY} L ${bottomX + 40} ${bottomY} Q ${bottomX} ${(cy + bottomY) / 2} ${cx + radius * 0.85} ${cy} Z`}
            fill="url(#flashlightBeamGrad)"
          />
        </svg>
      )}

      {/* 2. Darkness shroud with radial transparent spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-150"
        style={{
          background: isDark
            ? 'rgba(0, 0, 0, 0.98)'
            : `radial-gradient(circle at ${cx}px ${cy}px, transparent 0px, transparent ${Math.round(
                radius * 0.5
              )}px, rgba(0, 0, 0, ${0.75 * (1 / lightOpacity)}) ${Math.round(
                radius * 0.85
              )}px, rgba(0, 0, 0, 0.96) ${Math.round(radius * 1.35)}px, rgba(0, 0, 0, 0.99) ${Math.round(
                radius * 2.1
              )}px)`,
        }}
      />

      {/* 3. Incandescent center glow halo */}
      {!isDark && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${cx - radius * 0.6}px`,
            top: `${cy - radius * 0.6}px`,
            width: `${radius * 1.2}px`,
            height: `${radius * 1.2}px`,
            background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0.15) 45%, transparent 75%)`,
            opacity: lightOpacity * 0.35,
            mixBlendMode: 'screen',
            animation: 'flashlightJitter 4s ease-in-out infinite',
          }}
        />
      )}

      {/* 4. Interactive SHUTDOWN Modal (3 Clicks / Hits to Restart) */}
      {isTurnedOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto p-4 z-50">
          <div
            className={`flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.95)] max-w-sm backdrop-blur-md transition-all ${
              sparkFlash ? 'animate-[hitShake_0.2s_ease-in-out] border-amber-500' : ''
            }`}
          >
            <div className="relative mb-3 flex items-center justify-center">
              <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
              {sparkFlash && (
                <div className="absolute -top-1 -right-2 animate-ping text-amber-400">
                  <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-6 h-6" />
                </div>
              )}
            </div>

            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-300 mb-1">
              Flashlight Off!
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Flashlight failed. Hit it to turn it back on.
            </p>

            {/* Hit progress dots */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: flashlightHitsRequired }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    idx < hits
                      ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-110'
                      : 'bg-zinc-900 border-zinc-700'
                  }`}
                />
              ))}
            </div>

            {/* Hit action button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleHitFlashlight();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.general.hazard} className="w-3.5 h-3.5" />
                <span>Golpear Linterna</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] text-amber-100">
                {hits} / {effectiveHitsRequired}
              </span>
            </button>

            <span className="text-[10px] text-gray-500 mt-2 font-mono">
              [ Presiona la tecla <b>F</b> o haz <b>Clic</b> ]
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const FlashlightInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
  color,
  onColorChange,
  notify,
}) => {
  const currentMode = params.mode || 'normal';
  const currentRadius = params.radius || 170;
  const currentColor = params.color || color || '#fffbe8';
  const isShutdown = !!params.shutdown;
  const hitsRequired = params.hitsRequired || 3;

  return (
    <div className="space-y-3 pt-3 border-t border-[var(--border)] bg-[var(--well-bg)] p-3 rounded-xl border">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5" />
          <span>Interactive Flashlight (Settings)</span>
        </label>
      </div>

      {/* Mode: Normal vs Broken */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Flashlight State:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onChange({ mode: 'normal' });
              notify?.('Flashlight mode: Normal');
            }}
            className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2 ${
              currentMode === 'normal'
                ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200 ring-1 ring-amber-500 font-bold'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs">Normal</div>
              <div className="text-[9px] text-[var(--muted2)]">Steady continuous beam</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({ mode: 'broken' });
              notify?.('Flashlight mode: Broken (Flickering)');
            }}
            className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2 ${
              currentMode === 'broken'
                ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200 ring-1 ring-amber-500 font-bold'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs">Broken</div>
              <div className="text-[9px] text-[var(--muted2)]">Random flickering</div>
            </div>
          </button>
        </div>
      </div>

      {/* Beam Radius / Size */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">Beam Radius / Size:</span>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Narrow (110px)', radius: 110 },
            { label: 'Medium (170px)', radius: 170 },
            { label: 'Wide (240px)', radius: 240 },
          ].map((sz) => {
            const isSelected = currentRadius === sz.radius;
            return (
              <button
                key={sz.radius}
                type="button"
                onClick={() => onChange({ radius: sz.radius })}
                className={`py-1.5 px-2 rounded-lg border text-center text-[10px] font-bold cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-200'
                    : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {sz.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Beam Tint / Color */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Beam Tint / Color:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                onChange({ color: e.target.value });
                onColorChange?.(e.target.value);
              }}
              className="w-5 h-5 rounded border border-[var(--border)] bg-transparent cursor-pointer p-0"
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                onChange({ color: e.target.value });
                onColorChange?.(e.target.value);
              }}
              className="w-20 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-1.5 py-0.5 text-[11px] text-amber-600 dark:text-amber-300 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {[
            { label: 'Warm', hex: '#fffbe8', bg: 'bg-amber-100 text-black' },
            { label: 'White', hex: '#ffffff', bg: 'bg-white text-black' },
            { label: 'Forensic UV', hex: '#c084fc', bg: 'bg-purple-900 text-purple-200' },
            { label: 'Alarm Red', hex: '#fda4af', bg: 'bg-red-900 text-red-200' },
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

      {/* Shutdown Mechanic */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isShutdown}
            onChange={(e) => onChange({ shutdown: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-[var(--border)] bg-[var(--well-bg)] text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-300 uppercase block">
              Enable Interactive Blackout (Shutdown)
            </span>
            <span className="text-[10px] text-[var(--muted2)] block leading-tight">
              The flashlight fails upon entering this event, plunging the screen into darkness and locking dialogue until the player taps it back on.
            </span>
          </div>
        </label>

        {isShutdown && (
          <div className="pl-6 space-y-1.5 pt-1">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">
              Hits required to turn back on:
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => onChange({ hitsRequired: cnt })}
                  className={`py-1 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    hitsRequired === cnt
                      ? 'border-amber-400 bg-amber-500/20 text-amber-700 dark:text-amber-200 ring-1 ring-amber-400 font-extrabold'
                      : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {cnt === 3 ? '3 hits (Recommended)' : `${cnt} ${cnt === 1 ? 'hit' : 'hits'}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const flashlightFx: ScreenFxDefinition = {
  id: 'flashlight',
  label: 'Flashlight (Interactive)',
  description: 'Interactive mouse-following flashlight beam with broken flicker mode and 3-hit interactive shutdown mechanic.',
  icon: GUI_ICONS.general.lightBulb,
  badgeColor: 'border-yellow-500 bg-yellow-950/80 text-yellow-200',
  defaultSfx: '/assets/sfx/click intro.mp3',
  defaultParams: {
    mode: 'normal',
    radius: 170,
    color: '#fffbe8',
    shutdown: false,
    hitsRequired: 3,
  },
  component: FlashlightComponent,
  inspector: FlashlightInspector,
};
