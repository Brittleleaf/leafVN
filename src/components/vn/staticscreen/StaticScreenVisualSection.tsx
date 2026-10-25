"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  VNScene,
  VNStaticScreenConfig,
  VNScreenFxType,
  VNCursorType,
  VNAssetItem,
  VNAssetType,
} from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playAudioPreview, stopAudioPreview, subscribeAudioPreview, getCurrentlyPlayingPreviewUrl } from '@/lib/audioSettings';
import { SCREEN_FX_REGISTRY, SCREEN_FX_CONFIGS, VNScreenFxOverlay, VNScreenFxPickerGrid } from '../VNScreenFxOverlay';
import { VN_CURSORS_CATALOG } from '../cursors';

interface StaticScreenVisualSectionProps {
  scene: VNScene;
  config: VNStaticScreenConfig;
  updateConfig: (patch: Partial<VNStaticScreenConfig>) => void;
  onUpdateScene: (patch: Partial<VNScene>) => void;
  setAssetPickerConfig: (cfg: {
    filterType: VNAssetType;
    title: string;
    initialFontSample?: string;
    previewBackgroundUrl?: string;
    onSelect: (asset: VNAssetItem) => void;
  } | null) => void;
}

export function StaticScreenVisualSection({
  scene,
  config,
  updateConfig,
  onUpdateScene,
  setAssetPickerConfig,
}: StaticScreenVisualSectionProps) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(getCurrentlyPlayingPreviewUrl());

  useEffect(() => {
    const unsub = subscribeAudioPreview(() => {
      setPlayingUrl(getCurrentlyPlayingPreviewUrl());
    });
    return () => {
      unsub();
      stopAudioPreview();
    };
  }, []);

  const activeFx = config.screenFx;

  const handleOpenFxGallery = () => {
    setAssetPickerConfig({
      filterType: 'fx',
      title: 'Select Screen FX from Gallery',
      previewBackgroundUrl: scene.backgroundUrl,
      onSelect: (asset) => {
        updateConfig({ screenFx: asset.url as VNScreenFxType });
        playSfx('/assets/sfx/success.mp3', false, 0.4);
      },
    });
  };

  const handleSelectFx = (fxKey: VNScreenFxType) => {
    updateConfig({ screenFx: fxKey });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  const handleClearFx = () => {
    updateConfig({ screenFx: undefined });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  return (
    <>
      {/* 1. MEDIA & BACKGROUND GALLERY SECTION */}
      <div className="space-y-3 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--btn-bg)] backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
            <span>Media & Visual Atmosphere</span>
          </span>
          <span className="text-[10px] text-[var(--muted)] font-mono">
            Gallery Integrated
          </span>
        </div>

        {/* Background Image: Visual Card with Live Thumbnail & Direct Gallery Trigger */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">
              Scene Background:
            </label>
            <button
              type="button"
              onClick={() => {
                setAssetPickerConfig({
                  filterType: 'background',
                  title: 'Pick Background from Gallery',
                  onSelect: (asset) => onUpdateScene({ backgroundUrl: asset.url }),
                });
              }}
              className="text-[10px] font-bold text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
              <span>Browse Gallery</span>
            </button>
          </div>

          <div
            onClick={() => {
              setAssetPickerConfig({
                filterType: 'background',
                title: 'Pick Background from Gallery',
                onSelect: (asset) => onUpdateScene({ backgroundUrl: asset.url }),
              });
            }}
            className="group relative w-full h-24 rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] bg-black/60 cursor-pointer transition-all shadow"
          >
            <img
              src={scene.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg'}
              alt="Scene Background"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end justify-between p-2.5">
              <span className="text-[11px] font-mono text-white/90 truncate max-w-[200px] drop-shadow">
                {scene.backgroundUrl ? scene.backgroundUrl.split('/').pop() : 'SCENARIO-TEMPLATE.jpg'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-[10px] font-bold border border-white/20 backdrop-blur-md shadow flex items-center gap-1 group-hover:border-[var(--accent)] transition-colors">
                <GuiIconRenderer icon={GUI_ICONS.general.background} className="w-3.5 h-3.5" />
                <span>Change Background</span>
              </span>
            </div>
          </div>
        </div>

        {/* Background Overlay Darkness Slider */}
        <div className="space-y-1.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1">
              <GuiIconRenderer icon={GUI_ICONS.general.screenFx} size={12} className="text-cyan-400" />
              <span>Background Dark Tint:</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {(() => {
                if (!config.bgOverlayColor) return 85;
                const match = config.bgOverlayColor.match(/rgba?\([^,]+,[^,]+,[^,]+,([^)]+)\)/);
                if (match) {
                  const parsed = parseFloat(match[1]);
                  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 85;
                }
                return 85;
              })()}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={(() => {
              if (!config.bgOverlayColor) return 0.85;
              const match = config.bgOverlayColor.match(/rgba?\([^,]+,[^,]+,[^,]+,([^)]+)\)/);
              if (match) {
                const parsed = parseFloat(match[1]);
                return Number.isFinite(parsed) ? parsed : 0.85;
              }
              return 0.85;
            })()}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              updateConfig({ bgOverlayColor: `rgba(5, 5, 12, ${val.toFixed(2)})` });
            }}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[var(--well-bg)] rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-mono text-[var(--muted2)]">
            <span>0% (Vivid / Clear)</span>
            <span>50% (Balanced)</span>
            <span>100% (Solid Dark)</span>
          </div>
        </div>

        {/* Entrance Impact SFX & Ambient BGM: Visual Audio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* SFX Card */}
          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-3.5 h-3.5" />
                <span>Entrance SFX</span>
              </span>
              {config.sfxUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (playingUrl === config.sfxUrl) {
                      stopAudioPreview();
                    }
                    updateConfig({ sfxUrl: undefined });
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1"
                  title="Remove SFX"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {config.sfxUrl ? (
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-mono text-[var(--text)] truncate max-w-[110px]" title={config.sfxUrl}>
                  {config.sfxUrl.split('/').pop()}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {(() => {
                    const isPlaying = Boolean(config.sfxUrl && playingUrl === config.sfxUrl);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaying) {
                            stopAudioPreview();
                          } else {
                            playAudioPreview(config.sfxUrl!, 0.7);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border ${
                          isPlaying
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                            : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-amber-400'
                        }`}
                        title={isPlaying ? 'Stop playback' : 'Audition Sound'}
                      >
                        <GuiIconRenderer icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.state.play} className="w-2.5 h-2.5" />
                        <span>{isPlaying ? 'Stop' : 'Play'}</span>
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      setAssetPickerConfig({
                        filterType: 'sfx',
                        title: 'Choose Entrance SFX from Gallery',
                        onSelect: (asset) => {
                          updateConfig({ sfxUrl: asset.url });
                          playAudioPreview(asset.url, 0.7);
                        },
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--accent)] text-[10px] font-bold cursor-pointer"
                  >
                    Gallery
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAssetPickerConfig({
                    filterType: 'sfx',
                    title: 'Choose Entrance SFX from Gallery',
                    onSelect: (asset) => {
                      updateConfig({ sfxUrl: asset.url });
                      playAudioPreview(asset.url, 0.7);
                    },
                  });
                }}
                className="w-full py-1.5 px-2 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] text-left flex items-center justify-between text-[11px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
              >
                <span>Select SFX...</span>
                <span className="text-[10px] text-[var(--accent)] font-bold">+ Gallery</span>
              </button>
            )}
          </div>

          {/* BGM Card */}
          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1">
                <GuiIconRenderer icon={GUI_ICONS.general.soundOn} className="w-3.5 h-3.5" />
                <span>Ambient BGM</span>
              </span>
              {config.bgmUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (playingUrl === config.bgmUrl) {
                      stopAudioPreview();
                    }
                    updateConfig({ bgmUrl: undefined });
                  }}
                  className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1"
                  title="Remove BGM"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {config.bgmUrl ? (
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-mono text-[var(--text)] truncate max-w-[110px]" title={config.bgmUrl}>
                  {config.bgmUrl.split('/').pop()}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {(() => {
                    const isPlaying = Boolean(config.bgmUrl && playingUrl === config.bgmUrl);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaying) {
                            stopAudioPreview();
                          } else {
                            playAudioPreview(config.bgmUrl!, 0.6);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 border ${
                          isPlaying
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                            : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-purple-400'
                        }`}
                        title={isPlaying ? 'Stop playback' : 'Audition BGM'}
                      >
                        <GuiIconRenderer icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.state.play} className="w-2.5 h-2.5" />
                        <span>{isPlaying ? 'Stop' : 'Play'}</span>
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      setAssetPickerConfig({
                        filterType: 'bgm',
                        title: 'Choose Ambient BGM from Gallery',
                        onSelect: (asset) => {
                          updateConfig({ bgmUrl: asset.url });
                          playAudioPreview(asset.url, 0.6);
                        },
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--accent)] text-[10px] font-bold cursor-pointer"
                  >
                    Gallery
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAssetPickerConfig({
                    filterType: 'bgm',
                    title: 'Choose Ambient BGM from Gallery',
                    onSelect: (asset) => updateConfig({ bgmUrl: asset.url }),
                  });
                }}
                className="w-full py-1.5 px-2 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] text-left flex items-center justify-between text-[11px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
              >
                <span>Select BGM...</span>
                <span className="text-[10px] text-[var(--accent)] font-bold">+ Gallery</span>
              </button>
            )}
          </div>
        </div>

        {/* Atmosphere Screen FX: 3 Top/Active Cards + 4th "View More" Gateway with Live Background Preview */}
        <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5 text-purple-400" />
              <span>Atmosphere Camera FX</span>
            </span>
            <div className="flex items-center gap-2">
              {activeFx && (
                <button
                  type="button"
                  onClick={handleClearFx}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer transition-colors flex items-center gap-1"
                  title="Remove active Screen FX"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                  <span>Clear FX</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenFxGallery}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={11} />
                <span>Open Gallery</span>
              </button>
            </div>
          </div>

          {/* 2x2 Grid of 3 Active/Popular Cards + 4th View More */}
          <VNScreenFxPickerGrid
            activeFx={activeFx}
            intensity={config.fxIntensity || 'heavy'}
            previewBackgroundUrl={scene.backgroundUrl}
            columns={2}
            accentColor="purple"
            onSelectFx={handleSelectFx}
            onOpenGallery={handleOpenFxGallery}
          />

          {/* Intensity controls if an FX is selected */}
          {activeFx && (
            <div className="pt-2 flex items-center justify-between border-t border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">
                FX Intensity:
              </span>
              <div className="flex items-center gap-1">
                {(['light', 'medium', 'heavy'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      updateConfig({ fxIntensity: lvl });
                      playSfx('/assets/sfx/click intro.mp3', false, 0.15);
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold transition-all cursor-pointer border ${
                      (config.fxIntensity || 'heavy') === lvl
                        ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                        : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC SCREEN FX INSPECTOR (Self-contained by effect definition, e.g. Retro Pixelate & Liquid Sliders) */}
          {(() => {
            if (!activeFx) return null;
            const fxDef = SCREEN_FX_REGISTRY[activeFx];
            const InspectorComp = fxDef?.inspector;
            if (!InspectorComp) return null;
            return (
              <div className="pt-2 border-t border-[var(--border)]">
                <InspectorComp
                  params={config.screenFxParams || {}}
                  onChange={(patch) => {
                    updateConfig({
                      screenFxParams: { ...(config.screenFxParams || {}), ...patch },
                    });
                  }}
                />
              </div>
            );
          })()}
        </div>
      </div>

      {/* CUSTOM SCREEN CURSOR LIBRARY */}
      <div className="space-y-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Screen Cursor</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setAssetPickerConfig({
                filterType: 'cursor',
                title: 'Select Engine Cursor from Gallery',
                onSelect: (asset) => updateConfig({ cursorType: asset.url as VNCursorType }),
              });
            }}
            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3 h-3 text-cyan-400" />
            <span>Gallery</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
          {VN_CURSORS_CATALOG.map((cur) => {
            const isSelected = (config.cursorType || 'default') === cur.id;
            return (
              <button
                key={cur.id}
                type="button"
                onClick={() => {
                  updateConfig({ cursorType: cur.id });
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-sm ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-white/20 text-gray-300 hover:text-white'
                }`}
                title={cur.description}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  {cur.renderPreview()}
                </div>
                <span className="text-[10px] font-bold truncate max-w-full text-center">
                  {cur.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
