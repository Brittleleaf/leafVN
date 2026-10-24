'use client';

import React, { useEffect, useRef } from 'react';

export interface ScreenFxSvgDefsProps {
  activeFx?: {
    type?: string;
    fxType?: string;
    intensity?: 'light' | 'medium' | 'heavy';
    params?: Record<string, any>;
  } | null;
}

/**
 * Returns the CSS filter string to apply directly to scene assets (background image & character avatars)
 */
export function getSceneElementFxFilter(
  activeFx?: {
    type?: string;
    fxType?: string;
    intensity?: 'light' | 'medium' | 'heavy';
    params?: Record<string, any>;
  } | null
): string | undefined {
  if (!activeFx) return undefined;
  const fxType = activeFx.type || activeFx.fxType;
  if (fxType === 'liquid_distortion') {
    const hue = activeFx.params?.hueRotate;
    return hue ? `url(#liquid) hue-rotate(${hue}deg)` : 'url(#liquid)';
  }
  if (fxType === 'retro_pixelate') {
    const pSize =
      activeFx.params?.pixelSize ??
      (activeFx.intensity === 'light' ? 1 : activeFx.intensity === 'heavy' ? 4 : 2);
    return pSize === 0 ? 'url(#retro_pixelate_color)' : 'url(#retro_pixelate_tile)';
  }
  return undefined;
}

export const ScreenFxSvgDefs: React.FC<ScreenFxSvgDefsProps> = ({ activeFx }) => {
  const intensity = activeFx?.intensity || 'medium';
  const params = activeFx?.params || {};
  const fxType = activeFx?.type || activeFx?.fxType;
  const isLiquid = fxType === 'liquid_distortion';

  // Liquid Distortion params
  const effectiveMultiplier =
    params.intensityMultiplier ?? (intensity === 'light' ? 0.6 : intensity === 'heavy' ? 1.4 : 1.0);
  const baseScale = params.scale ?? (intensity === 'light' ? 16 : intensity === 'heavy' ? 52 : 30);
  const liquidScale = Math.max(1, Math.round(baseScale * effectiveMultiplier));
  const liquidDur = params.speed ?? (intensity === 'light' ? 8 : intensity === 'heavy' ? 4.5 : 6);

  // Retro Pixelate params
  const rawPixelSize =
    params.pixelSize !== undefined
      ? params.pixelSize
      : intensity === 'light'
      ? 1
      : intensity === 'heavy'
      ? 4
      : 2;
  const pixelSize = Math.max(0, Math.min(12, Math.round(rawPixelSize * (params.intensityMultiplier ?? 1.0))));
  const boxSize = 1 + pixelSize * 4;
  const morphRadius = pixelSize;
  const dilateRadius = pixelSize * 2;
  const stdDev = Math.max(0.1, pixelSize - 0.5);
  const colorSteps = Math.max(
    2,
    Math.min(20, params.colorSteps ?? (intensity === 'heavy' ? 3 : intensity === 'light' ? 8 : 5))
  );
  const tableValues = Array.from({ length: colorSteps + 1 }, (_, i) => (i / colorSteps).toFixed(3)).join(' ');

  // Direct 60fps animation driver for Liquid Turbulence to ensure continuous breathing across all browsers
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null);

  useEffect(() => {
    if (!isLiquid) return;
    let animId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = (elapsed % liquidDur) / liquidDur;
      // Sinusoidal oscillation: smooth breathing between 0.015 and 0.021 for X, 0.015 and 0.018 for Y
      const sinVal = 0.5 - 0.5 * Math.cos(progress * 2 * Math.PI);
      const freqX = (0.015 + 0.006 * sinVal).toFixed(4);
      const freqY = (0.015 + 0.003 * sinVal).toFixed(4);

      if (turbulenceRef.current) {
        turbulenceRef.current.setAttribute('baseFrequency', `${freqX} ${freqY}`);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isLiquid, liquidDur]);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        {/* Liquid Distortion Filter (Kept permanently in DOM without dynamic key to preserve Chromium bindings) */}
        <filter id="liquid" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            ref={turbulenceRef}
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

        {/* Retro Pixelate Tile Filter (With alpha clipping to prevent character sprite edge dilation) */}
        <filter
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
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>

        {/* Retro Pixelate Color Palette Reduction Only (when pixelSize is 0) */}
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
      </defs>
    </svg>
  );
};
