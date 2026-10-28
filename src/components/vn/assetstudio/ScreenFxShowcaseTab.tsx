"use client";
import React, { useState } from 'react';
import { VNAssetItem } from '@/types/vn';
import { SCREEN_FX_REGISTRY, VNScreenFxOverlay } from '../VNScreenFxOverlay';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { getProxiedImageUrl } from '@/lib/vn/mediaUtils';

interface ScreenFxShowcaseTabProps {
  searchQuery: string;
  previewBackgroundUrl?: string;
  onSelectAsset?: (asset: VNAssetItem) => void;
  onClose: () => void;
}

export function ScreenFxShowcaseTab({
  searchQuery,
  previewBackgroundUrl,
  onSelectAsset,
  onClose,
}: ScreenFxShowcaseTabProps) {
  const [fxIntensities, setFxIntensities] = useState<Record<string, 'light' | 'medium' | 'heavy'>>({});
  const [fxMultipliers, setFxMultipliers] = useState<Record<string, number>>({});
  const [fxHueRotates, setFxHueRotates] = useState<Record<string, number>>({});
  const [fxTintColors, setFxTintColors] = useState<Record<string, string>>({});
  const [fxPixelSizes, setFxPixelSizes] = useState<Record<string, number>>({});
  const [fxColorSteps, setFxColorSteps] = useState<Record<string, number>>({});

  const effectiveBg = previewBackgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';
  const isCustomSceneBg = Boolean(previewBackgroundUrl);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4 text-[var(--accent)]" />
            <span>Screen Atmosphere & Camera FX Engine</span>
          </h3>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            {isCustomSceneBg ? (
              <span>
                Real-time visual FX simulated live over current scene background (<code className="font-mono text-emerald-400">{effectiveBg.split('/').pop()}</code>).
              </span>
            ) : (
              <span>
                Real-time visual FX simulated live over the scenario template background (<code className="font-mono text-emerald-500">SCENARIO-TEMPLATE.jpg</code>).
              </span>
            )}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--text)] font-bold">
          {Object.keys(SCREEN_FX_REGISTRY).length} FX Presets
        </span>
      </div>

      {/* Grid of FX Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(SCREEN_FX_REGISTRY)
          .filter(
            (fx) =>
              !searchQuery.trim() ||
              fx.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              fx.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((fx) => {
            const currentIntensity = fxIntensities[fx.id] || 'medium';
            const currentMultiplier =
              fxMultipliers[fx.id] ?? (currentIntensity === 'light' ? 0.6 : currentIntensity === 'heavy' ? 1.4 : 1.0);
            const currentHue = fxHueRotates[fx.id] ?? 0;
            const currentTintColor = fxTintColors[fx.id] || (fx.id === 'liquid_distortion' ? '#06b6d4' : undefined);
            const currentPixelSize = fxPixelSizes[fx.id] ?? (currentIntensity === 'light' ? 1 : currentIntensity === 'heavy' ? 4 : 2);
            const currentColorSteps = fxColorSteps[fx.id] ?? (currentIntensity === 'heavy' ? 3 : currentIntensity === 'light' ? 8 : 5);

            const cardParams = {
              ...(fx.defaultParams || {}),
              intensityMultiplier: currentMultiplier,
              hueRotate: currentHue,
              tintColor: currentTintColor,
              tintEnabled: Boolean(currentTintColor || currentHue > 0),
              pixelSize: currentPixelSize,
              colorSteps: currentColorSteps,
            };

            return (
              <div
                key={fx.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-lg hover:border-[var(--accent)] transition-all flex flex-col group"
              >
                {/* 16:9 Live Preview Viewport over Scenario Template */}
                <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[var(--border)]">
                  {/* Card-isolated SVG filters for reliable real-time previewing */}
                  <svg
                    aria-hidden="true"
                    style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0.001, pointerEvents: 'none' }}
                  >
                    <defs>
                      {fx.id === 'liquid_distortion' && (
                        <filter key={`liquid-${currentMultiplier}-${currentHue}`} id={`liquid_card_${fx.id}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015" numOctaves="3" result="noise">
                            <animate attributeName="baseFrequency" values="0.015 0.015;0.021 0.018;0.015 0.015" dur="6s" repeatCount="indefinite" />
                          </feTurbulence>
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale={Math.max(1, Math.round(30 * currentMultiplier))} xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                      )}
                      {fx.id === 'retro_pixelate' && (
                        <>
                          <filter key={`retro-tile-${currentPixelSize}-${currentColorSteps}`} id={`retro_tile_card_${fx.id}`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
                            <feFlood x="0" y="0" width={1 + currentPixelSize * 4} height={1 + currentPixelSize * 4} />
                            <feMorphology operator="erode" radius={currentPixelSize} x="0" y="0" width={1 + currentPixelSize * 4} height={1 + currentPixelSize * 4} />
                            <feTile result="raster1" />
                            <feMorphology operator="erode" radius={currentPixelSize} result="raster2" />
                            <feComposite operator="in" in="SourceGraphic" in2="raster1" />
                            <feGaussianBlur stdDeviation={Math.max(0.1, currentPixelSize - 0.5)} />
                            <feComposite operator="in" in2="raster2" />
                            <feComponentTransfer>
                              <feFuncR type="discrete" tableValues={Array.from({ length: currentColorSteps + 1 }, (_, i) => (i / currentColorSteps).toFixed(3)).join(' ')} />
                              <feFuncG type="discrete" tableValues={Array.from({ length: currentColorSteps + 1 }, (_, i) => (i / currentColorSteps).toFixed(3)).join(' ')} />
                              <feFuncB type="discrete" tableValues={Array.from({ length: currentColorSteps + 1 }, (_, i) => (i / currentColorSteps).toFixed(3)).join(' ')} />
                              <feFuncA type="discrete" tableValues="0 1" />
                            </feComponentTransfer>
                            <feMorphology operator="dilate" radius={currentPixelSize * 2} />
                          </filter>
                          <filter key={`retro-color-${currentColorSteps}`} id={`retro_color_card_${fx.id}`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
                            <feComponentTransfer>
                              <feFuncR type="discrete" tableValues={Array.from({ length: currentColorSteps + 1 }, (_, i) => (i / currentColorSteps).toFixed(3)).join(' ')} />
                              <feFuncG type="discrete" tableValues={Array.from({ length: currentColorSteps + 1 }, (_, i) => (i / currentColorSteps).toFixed(3)).join(' ')} />
                              <feFuncB type="discrete" tableValues={Array.from({ length: currentColorSteps + 1 }, (_, i) => (i / currentColorSteps).toFixed(3)).join(' ')} />
                              <feFuncA type="discrete" tableValues="0 1" />
                            </feComponentTransfer>
                          </filter>
                        </>
                      )}
                    </defs>
                  </svg>

                  {effectiveBg && (
                    <img
                      src={getProxiedImageUrl(effectiveBg)}
                      crossOrigin="anonymous"
                      alt="preview"
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      style={{
                        imageRendering: fx.id === 'retro_pixelate' ? 'pixelated' : undefined,
                        filter:
                          fx.id === 'liquid_distortion'
                            ? (currentHue ? `url(#liquid_card_${fx.id}) hue-rotate(${currentHue}deg)` : `url(#liquid_card_${fx.id})`)
                            : fx.id === 'retro_pixelate'
                            ? (currentPixelSize === 0 ? `url(#retro_color_card_${fx.id})` : `url(#retro_tile_card_${fx.id})`)
                            : undefined,
                      }}
                    />
                  )}
                  {/* Live FX Overlay */}
                  <VNScreenFxOverlay
                    fxType={fx.id}
                    intensity={currentIntensity}
                    params={cardParams}
                    color={currentTintColor}
                    fadeInSeconds={0.2}
                    fadeOutSeconds={0.2}
                  />

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold bg-black/75 backdrop-blur-md border border-white/20 text-white shadow">
                    <GuiIconRenderer icon={fx.icon} className="w-3.5 h-3.5" />
                    <span className="uppercase">{fx.label}</span>
                  </div>

                  {/* Active Intensity indicator */}
                  <div className="absolute bottom-2 right-2 z-30 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span>{currentIntensity}</span>
                    <span className="text-[var(--muted2)]">|</span>
                    <span>{Math.round(currentMultiplier * 100)}%</span>
                  </div>
                </div>

                {/* Card Controls & Details */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                      <GuiIconRenderer icon={fx.icon} className="w-4 h-4 text-[var(--accent)]" />
                      <span>{fx.label}</span>
                    </h4>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-1">
                      {fx.description}
                    </p>
                  </div>

                  {/* Controls: Intensity Level Buttons + Smooth Slider */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase text-[var(--muted)]">Intensity:</span>
                        <div className="flex items-center gap-1">
                          {[
                            { lvl: 'light', mult: 0.6 },
                            { lvl: 'medium', mult: 1.0 },
                            { lvl: 'heavy', mult: 1.4 },
                          ].map(({ lvl, mult }) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => {
                                setFxIntensities((prev) => ({ ...prev, [fx.id]: lvl as any }));
                                setFxMultipliers((prev) => ({ ...prev, [fx.id]: mult }));
                                playSfx('/assets/sfx/click intro.mp3', false, 0.15);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                                currentIntensity === lvl
                                  ? 'bg-[var(--accent)] text-white shadow'
                                  : 'bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Smooth Intensity Slider */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="range"
                          min="0.2"
                          max="2.2"
                          step="0.05"
                          value={currentMultiplier}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFxMultipliers((prev) => ({ ...prev, [fx.id]: val }));
                            const lvl = val <= 0.7 ? 'light' : val >= 1.3 ? 'heavy' : 'medium';
                            setFxIntensities((prev) => ({ ...prev, [fx.id]: lvl }));
                          }}
                          className="flex-1 accent-[var(--accent)] cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded"
                        />
                        <span className="font-mono text-[10px] text-[var(--accent)] font-bold min-w-[2.5rem] text-right">
                          {Math.round(currentMultiplier * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Color Tint & Hue Spectrum Row (for Liquid Distortion & Tintable FX) */}
                    {(fx.id === 'liquid_distortion' || fx.id === 'vignette') && (
                      <div className="space-y-1.5 pt-1.5 border-t border-[var(--border)] text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase text-[var(--muted)] flex items-center gap-1">
                            <GuiIconRenderer icon={GUI_ICONS.general.palette} size={11} className="text-cyan-400" />
                            <span>Color Tint & Hue:</span>
                          </span>
                          <span className="font-mono text-cyan-300 font-bold">{currentHue}Â°</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTintColor || '#06b6d4'}
                            onChange={(e) => setFxTintColors((prev) => ({ ...prev, [fx.id]: e.target.value }))}
                            className="w-6 h-6 rounded border border-[var(--border)] bg-transparent cursor-pointer shrink-0"
                            title="Pick Tint Color"
                          />
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={currentHue}
                            onChange={(e) => setFxHueRotates((prev) => ({ ...prev, [fx.id]: parseInt(e.target.value, 10) }))}
                            className="flex-1 cursor-ew-resize h-2 rounded"
                            style={{
                              background:
                                'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                            }}
                            title="Shift Hue Spectrum"
                          />
                          {currentHue > 0 && (
                            <button
                              type="button"
                              onClick={() => setFxHueRotates((prev) => ({ ...prev, [fx.id]: 0 }))}
                              className="text-[9px] text-[var(--muted2)] hover:text-white px-1 font-mono"
                            >
                              0Â°
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Independent Sliders for Retro Pixelate */}
                    {fx.id === 'retro_pixelate' && (
                      <div className="space-y-2 pt-1.5 border-t border-[var(--border)] text-[10px]">
                        {/* Pixel Size Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase text-[var(--muted)] flex items-center gap-1">
                              <GuiIconRenderer icon={GUI_ICONS.asset.box} size={11} className="text-amber-400" />
                              <span>Pixel Grid Size:</span>
                            </span>
                            <span className="font-mono text-amber-300 font-bold">
                              {currentPixelSize === 0 ? 'Smooth (0)' : `${1 + currentPixelSize * 4}Ã—${1 + currentPixelSize * 4} px`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="11"
                            step="1"
                            value={currentPixelSize}
                            onChange={(e) =>
                              setFxPixelSizes((prev) => ({ ...prev, [fx.id]: parseInt(e.target.value, 10) }))
                            }
                            className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded"
                          />
                        </div>

                        {/* Color Reduction Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold uppercase text-[var(--muted)]">Reduced Palette:</span>
                            <span className="font-mono text-amber-300 font-bold">
                              {Math.pow(currentColorSteps + 1, 3)} Colors
                            </span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="15"
                            step="1"
                            value={currentColorSteps}
                            onChange={(e) =>
                              setFxColorSteps((prev) => ({ ...prev, [fx.id]: parseInt(e.target.value, 10) }))
                            }
                            className="w-full accent-amber-400 cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded"
                          />
                        </div>
                      </div>
                    )}

                    {fx.defaultSfx && (
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border)]">
                        <span className="text-[var(--muted)]">Associated Audio:</span>
                        <button
                          type="button"
                          onClick={() => playSfx(fx.defaultSfx!, false, 0.7)}
                          className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-950/30 text-amber-300 font-mono text-[10px] hover:bg-amber-900/50 cursor-pointer flex items-center gap-1"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-3 h-3" />
                          <span>Play Sound</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Selection Button */}
                  <div className="pt-2">
                    {onSelectAsset ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAsset({
                            id: `fx-${fx.id}`,
                            name: fx.label,
                            type: 'fx',
                            origin: 'system',
                            url: fx.id,
                            description: fx.description,
                            extra: {
                              intensity: currentIntensity,
                              params: cardParams,
                            },
                          });
                          onClose();
                          playSfx('/assets/sfx/success.mp3', false, 0.4);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] text-[#0F0503] font-black rounded-md text-xs uppercase tracking-wider cursor-pointer shadow hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5" />
                        <span>Select This FX</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted2)] font-mono">
                        <span>Preset Key:</span>
                        <code className="text-cyan-400 font-bold">{fx.id}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
