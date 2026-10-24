"use client";
import React, { useState } from 'react';
import { VNAssetItem } from '@/types/vn';
import { SCREEN_FX_REGISTRY, VNScreenFxOverlay } from '../VNScreenFxOverlay';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

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
  const effectiveBg = previewBackgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';
  const isCustomSceneBg = Boolean(previewBackgroundUrl);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[var(--well-bg)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(SCREEN_FX_REGISTRY)
          .filter((fx) => !searchQuery.trim() || fx.label.toLowerCase().includes(searchQuery.toLowerCase()) || fx.description.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((fx) => {
            const currentIntensity = fxIntensities[fx.id] || 'medium';
            return (
              <div
                key={fx.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-lg hover:border-[var(--accent)] transition-all flex flex-col group"
              >
                {/* 16:9 Live Preview Viewport over Scenario Template */}
                <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[var(--border)]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${effectiveBg})`,
                      filter: fx.id === 'liquid_distortion' ? 'url(#liquid)' : undefined,
                    }}
                  />
                  {/* Live FX Overlay */}
                  <VNScreenFxOverlay
                    fxType={fx.id}
                    intensity={currentIntensity}
                    fadeInSeconds={0.2}
                    fadeOutSeconds={0.2}
                  />

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold bg-black/75 backdrop-blur-md border border-white/20 text-white shadow">
                    <GuiIconRenderer icon={fx.icon} className="w-3.5 h-3.5" />
                    <span className="uppercase">{fx.label}</span>
                  </div>

                  {/* Active Intensity indicator */}
                  <div className="absolute bottom-2 right-2 z-30 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                    {currentIntensity}
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

                  {/* Controls: Intensity Selector & Audio Preview */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-[var(--muted)]">Test Intensity:</span>
                      <div className="flex items-center gap-1">
                        {(['light', 'medium', 'heavy'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setFxIntensities((prev) => ({ ...prev, [fx.id]: lvl }));
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
                          });
                          onClose();
                          playSfx('/assets/sfx/success.mp3', false, 0.4);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] text-[#0F0503] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
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
