'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps, ScreenFxInspectorProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const RetroPixelateComponent: React.FC<ScreenFxProps> = ({
  intensityMultiplier,
  intensity = 'medium',
  params,
}) => {
  // Independent Slider 1: Pixel Size (0 to 11)
  const defaultSize = intensity === 'light' ? 1 : intensity === 'heavy' ? 4 : 2;
  const rawSize = params?.pixelSize !== undefined ? params.pixelSize : defaultSize;
  const pixelSize = Math.max(0, Math.min(12, Math.round(rawSize * (params?.intensityMultiplier ?? intensityMultiplier))));
  const boxSize = 1 + pixelSize * 4;
  const stdDev = Math.max(0.1, pixelSize - 0.5);

  // Independent Slider 2: Color Palette Reduction Steps (2 to 16)
  const colorSteps = Math.max(2, Math.min(20, params?.colorSteps ?? (intensity === 'heavy' ? 3 : intensity === 'light' ? 8 : 5)));
  const tableValues = Array.from({ length: colorSteps + 1 }, (_, i) => (i / colorSteps).toFixed(3)).join(' ');

  // Optional Retro CRT scanline grid or CRT phosphor overlay
  const scanlines = params?.scanlines ?? true;
  const scanlineOpacity = params?.scanlineOpacity ?? 0.22;

  // Filter ID to target
  const activeFilterId = pixelSize === 0 ? 'retro_pixelate_color' : 'retro_pixelate_tile';

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* SVG Tile and Color Palette Filters */}
      <svg
        aria-hidden="true"
        width="0"
        height="0"
        className="absolute w-0 h-0 pointer-events-none"
        style={{ position: 'absolute' }}
      >
        <defs>
          <filter
            id="retro_pixelate_tile"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <feFlood x="0" y="0" width={boxSize} height={boxSize} />
            <feMorphology operator="erode" radius={pixelSize} x="0" y="0" width={boxSize} height={boxSize} />
            <feTile result="raster1" />
            <feMorphology operator="erode" radius={pixelSize} result="raster2" />
            <feComposite operator="in" in="SourceGraphic" in2="raster1" />
            <feGaussianBlur stdDeviation={stdDev} />
            <feComposite operator="in" in2="raster2" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues={tableValues} />
              <feFuncG type="discrete" tableValues={tableValues} />
              <feFuncB type="discrete" tableValues={tableValues} />
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
            <feMorphology operator="dilate" radius={pixelSize * 2} />
          </filter>

          <filter
            id="retro_pixelate_color"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues={tableValues} />
              <feFuncG type="discrete" tableValues={tableValues} />
              <feFuncB type="discrete" tableValues={tableValues} />
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
          </filter>

          {/* Alias IDs for generic calls */}
          <filter
            id="tile"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <feFlood x="0" y="0" width={boxSize} height={boxSize} />
            <feMorphology operator="erode" radius={pixelSize} x="0" y="0" width={boxSize} height={boxSize} />
            <feTile result="raster1" />
            <feMorphology operator="erode" radius={pixelSize} result="raster2" />
            <feComposite operator="in" in="SourceGraphic" in2="raster1" />
            <feGaussianBlur stdDeviation={stdDev} />
            <feComposite operator="in" in2="raster2" />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues={tableValues} />
              <feFuncG type="discrete" tableValues={tableValues} />
              <feFuncB type="discrete" tableValues={tableValues} />
              <feFuncA type="discrete" tableValues="0 1" />
            </feComponentTransfer>
            <feMorphology operator="dilate" radius={pixelSize * 2} />
          </filter>
        </defs>
      </svg>

      {/* Optional Pixel Grid / Scanline Phosphor Overlay */}
      {scanlines && pixelSize > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(0, 0, 0, ${scanlineOpacity}) 0px, rgba(0, 0, 0, ${scanlineOpacity}) 1px, transparent 1px, transparent ${Math.max(2, boxSize)}px)`,
            opacity: Math.min(1, scanlineOpacity * 2),
          }}
        />
      )}
    </div>
  );
};

export const RetroPixelateInspector: React.FC<ScreenFxInspectorProps> = ({
  params,
  onChange,
}) => {
  const pixelSize = params?.pixelSize ?? 2;
  const colorSteps = params?.colorSteps ?? 5;
  const boxPixels = 1 + pixelSize * 4;
  const totalColors = Math.pow(colorSteps + 1, 3);
  const scanlines = params?.scanlines ?? true;
  const scanlineOpacity = params?.scanlineOpacity ?? 0.22;

  // Preset Palettes
  const PRESET_STYLES = [
    { label: '8-Bit Arcade', size: 2, steps: 4, name: '125 Colors' },
    { label: 'Retro 16-Bit', size: 1, steps: 7, name: '512 Colors' },
    { label: 'Chunky Mosaic', size: 4, steps: 3, name: '64 Colors' },
    { label: 'Posterize Only', size: 0, steps: 5, name: 'Smooth Pixel' },
  ];

  return (
    <div className="space-y-3.5 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.asset.box} size={14} />
          <span>SVG Pixelation & Reduced Colors</span>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)]">
          {totalColors} Colors
        </span>
      </div>

      {/* Quick Style Presets */}
      <div className="space-y-1">
        <span className="text-[10px] text-[var(--muted)] font-semibold uppercase block">
          Preset Profiles:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {PRESET_STYLES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ pixelSize: preset.size, colorSteps: preset.steps })}
              className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                pixelSize === preset.size && colorSteps === preset.steps
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <div className="text-[10px] font-bold truncate">{preset.label}</div>
              <div className="text-[9px] font-mono text-[var(--muted2)]">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDER 1: PIXEL BLOCK SIZE */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Pixel Grid Size:</span>
            <span className="text-amber-300 font-mono font-bold">{pixelSize === 0 ? 'Smooth (0)' : `${boxPixels}×${boxPixels} px`}</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">Level {pixelSize}</span>
        </div>
        <input
          type="range"
          min={0}
          max={11}
          step={1}
          value={pixelSize}
          onChange={(e) => onChange({ pixelSize: parseInt(e.target.value, 10) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>0 (Smooth)</span>
          <span>5 (21px)</span>
          <span>11 (45px)</span>
        </div>
      </div>

      {/* SLIDER 2: COLOR PALETTE REDUCTION */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)] font-semibold uppercase flex items-center gap-1">
            <span>Color Palette Reduction:</span>
            <span className="text-amber-300 font-mono font-bold">{totalColors} Colors</span>
          </span>
          <span className="font-mono text-[9px] text-[var(--muted2)]">{colorSteps} Steps/Channel</span>
        </div>
        <input
          type="range"
          min={2}
          max={15}
          step={1}
          value={colorSteps}
          onChange={(e) => onChange({ colorSteps: parseInt(e.target.value, 10) })}
          className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
          <span>2 (27 Colors)</span>
          <span>5 (216 Colors)</span>
          <span>15 (4,096 Colors)</span>
        </div>
      </div>

      {/* SCANLINE / PHOSPHOR GRID OVERLAY */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)] text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)] font-semibold uppercase">Scanline Pixel Grid:</span>
          <button
            type="button"
            onClick={() => onChange({ scanlines: !scanlines })}
            className={`px-2.5 py-0.5 rounded font-mono uppercase font-bold border transition-colors cursor-pointer ${
              scanlines
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)]'
            }`}
          >
            {scanlines ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {scanlines && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)] text-[9px] uppercase">Grid Opacity:</span>
            <input
              type="range"
              min={0.05}
              max={0.5}
              step={0.02}
              value={scanlineOpacity}
              onChange={(e) => onChange({ scanlineOpacity: parseFloat(e.target.value) })}
              className="flex-1 accent-amber-400 cursor-ew-resize h-1 bg-[var(--well-bg)] rounded"
            />
            <span className="font-mono text-amber-300 font-bold min-w-[2rem] text-right">
              {Math.round(scanlineOpacity * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const retroPixelateFx: ScreenFxDefinition = {
  id: 'retro_pixelate',
  label: 'Retro Pixelate & Palette',
  description: 'Authentic mosaic pixel rasterization with SVG morphology tiling, scanlines, and indexed color palette reduction.',
  icon: GUI_ICONS.asset.box,
  badgeColor: 'border-amber-500 bg-amber-950/80 text-amber-200',
  defaultParams: {
    pixelSize: 2,
    colorSteps: 5,
    scanlines: true,
    scanlineOpacity: 0.22,
  },
  component: RetroPixelateComponent,
  inspector: RetroPixelateInspector,
};
