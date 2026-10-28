"use client";
import React, { useState } from 'react';
import { SCREEN_FX_REGISTRY, VNScreenFxOverlay } from '../../screenfx';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicScreenFxTabProps {
  searchQuery: string;
  panelWidth: number;
  previewBackgroundUrl?: string;
  onAddFxClip: (fxType: string) => void;
}

export const CinematicScreenFxTab: React.FC<CinematicScreenFxTabProps> = ({
  searchQuery,
  panelWidth,
  previewBackgroundUrl,
  onAddFxClip,
}) => {
  const [fxIntensities, setFxIntensities] = useState<Record<string, 'light' | 'medium' | 'heavy'>>({});
  const effectiveBg = previewBackgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Screen Atmosphere & Visual FX</span>
          </span>
          <p className="text-[10px] text-[var(--muted2)] mt-0.5">
            {previewBackgroundUrl
              ? 'Real-time FX simulation over current scenario background. Drag or click Add to Media.'
              : 'Real-time FX simulation over scenario template. Drag or click Add to Media.'}
          </p>
        </div>
        <span className="text-[9px] text-[var(--accent)] font-mono px-2 py-0.5 rounded bg-[var(--well-bg)] border border-[var(--border)] font-bold">
          {Object.keys(SCREEN_FX_REGISTRY).length} Presets
        </span>
      </div>

      <div className={`grid gap-3 ${panelWidth >= 480 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {Object.values(SCREEN_FX_REGISTRY)
          .filter((fx) =>
            searchQuery
              ? fx.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fx.description.toLowerCase().includes(searchQuery.toLowerCase())
              : true
          )
          .map((fx) => {
            const currentIntensity = fxIntensities[fx.id] || 'medium';
            return (
              <div
                key={fx.id}
                draggable
                onDragStart={(e) => {
                  const payload = {
                    type: 'screen_fx',
                    fxType: fx.id,
                    label: fx.label,
                    section: 'media',
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(payload));
                }}
                className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden flex flex-col justify-between hover:border-[var(--accent)] transition-all group shadow-lg cursor-grab active:cursor-grabbing backdrop-blur-sm"
              >
                {/* 16:9 Live Preview Viewport over Scenario Template */}
                <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[var(--border)]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${effectiveBg})` }}
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
                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-[var(--text)] group-hover:text-[var(--accent)] flex items-center gap-1.5 truncate">
                        <GuiIconRenderer icon={fx.icon} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span className="truncate">{fx.label}</span>
                      </h4>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--border)] uppercase shrink-0 font-bold">
                        FX
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] leading-relaxed mt-1 line-clamp-2">
                      {fx.description}
                    </p>
                  </div>

                  {/* Controls: Intensity Selector & Audio Preview */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-[var(--muted)] text-[9px]">Intensity:</span>
                      <div className="flex items-center gap-1">
                        {(['light', 'medium', 'heavy'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFxIntensities((prev) => ({ ...prev, [fx.id]: lvl }));
                              playSfx('/assets/sfx/click intro.mp3', false, 0.15);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold transition-all cursor-pointer ${
                              currentIntensity === lvl
                                ? 'bg-[var(--accent)] text-white shadow'
                                : 'bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {fx.defaultSfx && (
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border)]">
                        <span className="text-[var(--muted)] text-[9px] font-bold">Audio:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSfx(fx.defaultSfx!, false, 0.7);
                          }}
                          className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 font-mono text-[9px] hover:bg-amber-500/20 cursor-pointer flex items-center gap-1 font-bold"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-2.5 h-2.5" />
                          <span>Play Sound</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Button: Add to Media */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => {
                        onAddFxClip(fx.id);
                        playUiSound('open', 0.35);
                      }}
                      className="w-full py-1.5 rounded-md bg-[var(--accent)] hover:opacity-90 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                      <span>Add to Media</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
