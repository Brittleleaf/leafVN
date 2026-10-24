'use client';

import React from 'react';

export interface ScreenFxSvgDefsProps {
  activeFx?: {
    type?: string;
    fxType?: string;
    intensity?: 'light' | 'medium' | 'heavy';
    params?: Record<string, any>;
  } | null;
}

export const ScreenFxSvgDefs: React.FC<ScreenFxSvgDefsProps> = ({ activeFx }) => {
  const fxType = activeFx?.type || activeFx?.fxType;
  const intensity = activeFx?.intensity || 'medium';
  const params = activeFx?.params || {};

  // Liquid Distortion params
  const effectiveMultiplier = params.intensityMultiplier ?? (intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0);
  const baseScale = params.scale ?? (intensity === 'light' ? 16 : intensity === 'heavy' ? 52 : 30);
  const liquidScale = Math.max(1, Math.round(baseScale * effectiveMultiplier));
  const liquidDur = params.speed ?? (intensity === 'light' ? 8 : intensity === 'heavy' ? 4.5 : 6);

  // Retro Pixelate params
  const rawPixelSize = params.pixelSize !== undefined ? params.pixelSize : (intensity === 'light' ? 1 : intensity === 'heavy' ? 4 : 2);
  const pixelSize = Math.max(0, Math.min(12, Math.round(rawPixelSize * (params.intensityMultiplier ?? 1.0))));
  const boxSize = 1 + pixelSize * 4;
  const morphRadius = pixelSize;
  const dilateRadius = pixelSize * 2;
  const stdDev = Math.max(0.1, pixelSize - 0.5);
  const colorSteps = Math.max(2, Math.min(20, params.colorSteps ?? (intensity === 'heavy' ? 3 : intensity === 'light' ? 8 : 5)));
  const tableValues = Array.from({ length: colorSteps + 1 }, (_, i) => (i / colorSteps).toFixed(3)).join(' ');

  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '1px',
        height: '1px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -9999,
      }}
    >
      <defs>
        {/* Liquid Distortion Filters - Keyed for immediate DOM invalidation on param changes in Chrome */}
        <filter
          key={`liquid-${liquidScale}-${liquidDur}`}
          id="liquid"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015 0.015"
            numOctaves="3"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values="0.015 0.015;0.021 0.018;0.015 0.015"
              dur={`${liquidDur}s`}
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={liquidScale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter
          key={`liquid-dist-${liquidScale}-${liquidDur}`}
          id="liquid_distortion"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015 0.015"
            numOctaves="3"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values="0.015 0.015;0.021 0.018;0.015 0.015"
              dur={`${liquidDur}s`}
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={liquidScale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Retro Pixelate Tile Filter */}
        <filter
          key={`retro-tile-${boxSize}-${morphRadius}-${colorSteps}`}
          id="retro_pixelate_tile"
          colorInterpolationFilters="sRGB"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
          <feFlood x="0" y="0" width={boxSize} height={boxSize} />
          <feMorphology operator="erode" radius={morphRadius} x="0" y="0" width={boxSize} height={boxSize} />
          <feTile result="raster1" />
          <feMorphology operator="erode" radius={morphRadius} result="raster2" />
          <feComposite operator="in" in="SourceGraphic" in2="raster1" />
          <feGaussianBlur stdDeviation={stdDev} />
          <feComposite operator="in" in2="raster2" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={tableValues} />
            <feFuncG type="discrete" tableValues={tableValues} />
            <feFuncB type="discrete" tableValues={tableValues} />
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feMorphology operator="dilate" radius={dilateRadius} />
        </filter>

        {/* Generic tile alias */}
        <filter
          key={`retro-tile-alias-${boxSize}-${colorSteps}`}
          id="tile"
          colorInterpolationFilters="sRGB"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
          <feFlood x="0" y="0" width={boxSize} height={boxSize} />
          <feMorphology operator="erode" radius={morphRadius} x="0" y="0" width={boxSize} height={boxSize} />
          <feTile result="raster1" />
          <feMorphology operator="erode" radius={morphRadius} result="raster2" />
          <feComposite operator="in" in="SourceGraphic" in2="raster1" />
          <feGaussianBlur stdDeviation={stdDev} />
          <feComposite operator="in" in2="raster2" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={tableValues} />
            <feFuncG type="discrete" tableValues={tableValues} />
            <feFuncB type="discrete" tableValues={tableValues} />
            <feFuncA type="discrete" tableValues="0 1" />
          </feComponentTransfer>
          <feMorphology operator="dilate" radius={dilateRadius} />
        </filter>

        {/* Retro Pixelate Color Palette Reduction Only (when pixel size is 0) */}
        <filter
          key={`retro-color-${colorSteps}`}
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

        <filter
          key={`retro-color-alias-${colorSteps}`}
          id="color"
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
      </defs>
    </svg>
  );
};
