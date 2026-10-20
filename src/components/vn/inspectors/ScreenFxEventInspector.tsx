"use client";
import React, { useState, useEffect } from 'react';
import { VNEvent, VNScreenFxType } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playAudioPreview, stopAudioPreview, subscribeAudioPreview, getCurrentlyPlayingPreviewUrl } from '@/lib/audioSettings';
import { SCREEN_FX_CONFIGS, SCREEN_FX_REGISTRY, VNScreenFxOverlay, VNScreenFxPickerGrid } from '../VNScreenFxOverlay';
import { EventInspectorSubProps } from './types';

export const ScreenFxEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  selectedLineIndex,
  story,
  currentScene,
  timelineFxStatus,
  onUpdateCurrentLine,
  onPatchCurrentLine,
  onUpdateCurrentScene,
  onSelectLineIndex,
  onOpenAssetPicker,
  notify,
}) => {
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

  const activeFx = (currentLine.fxType || 'red_alert') as VNScreenFxType;

  const handleSelectFx = (fxKey: VNScreenFxType) => {
    const cfg = SCREEN_FX_CONFIGS[fxKey];
    const patch: Partial<VNEvent> = {
      fxType: fxKey,
      text: undefined,
    };
    
    // If current loop audio is empty or matches an auto-assigned preset from any FX, update it to the new effect's default
    const isAutoAssignedSfx =
      !currentLine.fxLoopAudioUrl ||
      Object.values(SCREEN_FX_CONFIGS).some((c) => c.defaultSfx === currentLine.fxLoopAudioUrl);

    if (cfg?.defaultSfx && isAutoAssignedSfx) {
      patch.fxLoopAudioUrl = cfg.defaultSfx;
    }

    if (currentLine.fxPairId && currentScene?.timeline) {
      const updatedTimeline = currentScene.timeline.map((ev) => {
        if (ev.id === currentLine.id) {
          return { ...ev, ...patch };
        }
        if (ev.fxPairId === currentLine.fxPairId && ev.type === 'fx_end') {
          return { ...ev, fxType: fxKey, text: undefined };
        }
        return ev;
      });
      onUpdateCurrentScene('timeline', updatedTimeline);
    } else {
      onPatchCurrentLine(patch);
    }

    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    notify?.(`Screen FX changed to: ${cfg.label}`);
  };

  const handleOpenGallery = () => {
    onOpenAssetPicker(
      'fx',
      (fxKey) => {
        if (!fxKey) return;
        handleSelectFx(fxKey as VNScreenFxType);
      },
      undefined,
      currentScene?.backgroundUrl
    );
  };

  return (
    <>
      {/* CASE: SHAKE */}
      {currentLine.type === 'shake' && (
        <div className="space-y-2">
          <label className="text-[10px] text-amber-600 dark:text-amber-400 uppercase block font-bold">
            Screen Shake Intensity:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'medium', 'heavy'] as const).map((intensity) => (
              <button
                key={intensity}
                type="button"
                onClick={() => onUpdateCurrentLine('shakeIntensity', intensity)}
                className={`py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer border ${
                  (currentLine.shakeIntensity || 'medium') === intensity
                    ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {intensity === 'light' ? 'Light' : intensity === 'medium' ? 'Medium' : 'Heavy'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CASE: FLASH */}
      {currentLine.type === 'flash' && (
        <div className="space-y-2">
          <label className="text-[10px] text-rose-600 dark:text-rose-400 uppercase block font-bold">
            Screen Flash Color:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['red', 'white', 'black'] as const).map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onUpdateCurrentLine('flashColor', col)}
                className={`py-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer border flex items-center justify-center gap-1.5 ${
                  (currentLine.flashColor || 'red') === col
                    ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                <GuiIconRenderer
                  icon={col === 'red' ? GUI_ICONS.action.danger : col === 'white' ? GUI_ICONS.action.sparkles : GUI_ICONS.general.circle}
                  size={12}
                />
                <span>{col === 'red' ? 'Red (Alert)' : col === 'white' ? 'White (Impact)' : 'Black (Fade)'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CASE: SCREEN EFFECT START (FX START) */}
      {currentLine.type === 'fx_start' && (
        <div className="space-y-4 bg-[var(--card-bg)] border border-rose-500/30 rounded-xl p-3.5 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.action.danger} size={18} className="text-rose-500" />
              <div>
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-300 uppercase tracking-wider">
                  Screen FX (Loop Start)
                </h4>
                <p className="text-[10px] text-[var(--muted2)]">
                  Will remain active in loop until reaching the corresponding End node.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] text-rose-600 dark:text-rose-300">
              ID: {currentLine.fxPairId ? currentLine.fxPairId.slice(-6) : 'N/A'}
            </span>
          </div>

          {/* Selector de Tipo de Efecto (3 Top/Active Cards + 4th "View More" Gateway) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold block">
                Select Visual Screen Effect:
              </label>
              <button
                type="button"
                onClick={handleOpenGallery}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={12} />
                <span>Open FX Gallery</span>
              </button>
            </div>

            <VNScreenFxPickerGrid
              activeFx={activeFx}
              intensity={currentLine.fxIntensity || 'medium'}
              previewBackgroundUrl={currentScene?.backgroundUrl}
              columns={4}
              accentColor="rose"
              onSelectFx={handleSelectFx}
              onOpenGallery={handleOpenGallery}
            />
          </div>

          {/* Transición Fade In e Intensidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                Fade In:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={currentLine.fxFadeInSeconds ?? 1.0}
                  onChange={(e) => onUpdateCurrentLine('fxFadeInSeconds', parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[var(--well-bg)] border border-[var(--border)] focus:border-rose-500 rounded-lg px-2 py-1 text-xs text-rose-600 dark:text-rose-300 font-mono"
                />
                <span className="text-xs text-[var(--muted2)] font-mono">seconds</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                {[0, 0.5, 1.0, 2.0, 3.0].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onUpdateCurrentLine('fxFadeInSeconds', sec)}
                    className={`px-1.5 py-0.5 rounded-lg border text-[9px] cursor-pointer ${
                      (currentLine.fxFadeInSeconds ?? 1.0) === sec
                        ? 'border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-200 font-bold'
                        : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {sec === 0 ? '0s (Inst)' : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                Visual Intensity:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['light', 'medium', 'heavy'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onUpdateCurrentLine('fxIntensity', lvl)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                      (currentLine.fxIntensity || 'medium') === lvl
                        ? 'border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-200'
                        : 'border-[var(--border)] bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {lvl === 'light' ? 'Light' : lvl === 'medium' ? 'Medium' : 'Heavy'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC SCREEN FX INSPECTOR (Self-contained by effect definition) */}
          {(() => {
            const fxDef = SCREEN_FX_REGISTRY[currentLine.fxType || 'red_alert'];
            const InspectorComp = fxDef?.inspector;
            if (!InspectorComp) return null;
            return (
              <InspectorComp
                params={currentLine.fxParams || {}}
                onChange={(patch) => {
                  const updated = { ...(currentLine.fxParams || {}), ...patch };
                  onPatchCurrentLine({
                    fxParams: updated,
                    ...(patch.customWords ? { fxCustomWords: patch.customWords } : {}),
                    ...(patch.color ? { fxColor: patch.color } : {}),
                    ...(patch.animation ? { fxAnimation: patch.animation } : {}),
                    ...(patch.mode ? { flashlightMode: patch.mode } : {}),
                    ...(patch.radius ? { flashlightRadius: patch.radius } : {}),
                    ...(patch.shutdown !== undefined ? { flashlightShutdown: patch.shutdown } : {}),
                    ...(patch.hitsRequired ? { flashlightHitsRequired: patch.hitsRequired } : {}),
                  });
                }}
                color={currentLine.fxColor}
                onColorChange={(c) => onUpdateCurrentLine('fxColor', c)}
                playSfx={playSfx}
                notify={notify}
              />
            );
          })()}

          {/* SFX / Loop Audio */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>SFX / Continuous Loop Sound (Optional):</span>
              </label>
              {currentLine.fxLoopAudioUrl && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const isPlaying = Boolean(currentLine.fxLoopAudioUrl && playingUrl === currentLine.fxLoopAudioUrl);
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaying) {
                            stopAudioPreview();
                          } else {
                            playAudioPreview(currentLine.fxLoopAudioUrl!, 0.7);
                          }
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                          isPlaying
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold animate-pulse'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                        title={isPlaying ? 'Stop loop audio preview' : 'Test loop sound effect'}
                      >
                        <GuiIconRenderer icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.state.play} className="w-2.5 h-2.5" />
                        <span>{isPlaying ? 'Stop' : 'Test'}</span>
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      if (playingUrl === currentLine.fxLoopAudioUrl) {
                        stopAudioPreview();
                      }
                      onUpdateCurrentLine('fxLoopAudioUrl', '');
                    }}
                    className="text-[var(--muted2)] hover:text-red-500 text-xs cursor-pointer"
                    title="Remove loop sound"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentLine.fxLoopAudioUrl || ''}
                onChange={(e) => onUpdateCurrentLine('fxLoopAudioUrl', e.target.value)}
                placeholder="Loop audio path (e.g. /assets/sfx/...) or choose from Gallery"
                className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-emerald-500 rounded-lg p-2 text-xs text-[var(--text)] font-mono outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  onOpenAssetPicker('sfx', (url) => {
                    onUpdateCurrentLine('fxLoopAudioUrl', url || '');
                    if (url) playSfx(url, false, 0.7);
                  })
                }
                className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border2)] text-[var(--text)] rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow flex items-center gap-1.5 shrink-0"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Gallery</span>
              </button>
            </div>

            {/* Presets rápidos de SFX en loop */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-[var(--muted2)] font-mono font-bold">Presets:</span>
              {[
                { label: 'Alarm Siren', icon: GUI_ICONS.action.danger, url: '/assets/sfx/ERROR RING.mp3' },
                { label: 'Static / Noise', icon: GUI_ICONS.general.folder, url: '/assets/sfx/bg-tvnoise.mp3' },
                { label: 'Short Circuit', icon: GUI_ICONS.action.alert, url: '/assets/sfx/corrupt file.mp3' },
                { label: 'Revelation', icon: GUI_ICONS.action.sparkles, url: '/assets/sfx/success.mp3' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onUpdateCurrentLine('fxLoopAudioUrl', preset.url);
                    playSfx(preset.url, false, 0.7);
                  }}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                    currentLine.fxLoopAudioUrl === preset.url
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-200 font-bold'
                      : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <GuiIconRenderer icon={preset.icon} size={11} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Range Management Tools */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const startIdx = selectedLineIndex;
                  const newDialogue: VNEvent = {
                    id: 'ev-' + Date.now(),
                    type: 'dialogue',
                    characterId: story.characters[0]?.id || '',
                    text: 'New dialogue under screen effect...',
                  };
                  const updated = [...(currentScene?.timeline || [])];
                  updated.splice(startIdx + 1, 0, newDialogue);
                  onUpdateCurrentScene('timeline', updated);
                  onSelectLineIndex(startIdx + 1);
                  notify('Dialogue added inside screen effect');
                }}
                className="px-2.5 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border2)] text-[var(--text)] rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.add} size={12} />
                <span>Add dialogue inside here</span>
              </button>

              {/* Saltar al fin */}
              {(() => {
                const pair = timelineFxStatus.pairsMap.get(currentLine.fxPairId || '');
                if (!pair) return null;
                return (
                  <button
                    type="button"
                    onClick={() => onSelectLineIndex(pair.endIdx)}
                    className="px-2.5 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.search} size={12} />
                    <span>Jump to End (#{pair.endIdx + 1})</span>
                  </button>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Delete both Start and End for this Screen Effect?')) {
                  const pId = currentLine.fxPairId;
                  const filtered = (currentScene?.timeline || []).filter(
                    (e) => (pId ? e.fxPairId !== pId : true) && e.id !== currentLine.id
                  );
                  onUpdateCurrentScene('timeline', filtered);
                  onSelectLineIndex(Math.max(0, Math.min(selectedLineIndex, filtered.length - 1)));
                  notify('Screen Effect range deleted');
                }
              }}
              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3" />
              <span>Delete Start and End</span>
            </button>
          </div>
        </div>
      )}

      {/* CASE: SCREEN EFFECT END (FX END) */}
      {currentLine.type === 'fx_end' && (
        <div className="space-y-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-3.5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.media.stop} size={16} className="text-[var(--accent)]" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  Screen FX End (Loop Closure)
                </h4>
                <p className="text-[10px] text-[var(--muted)]">
                  Visual loop and ambient audio stop here with fade out.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)]">
              ID: {currentLine.fxPairId ? currentLine.fxPairId.slice(-6) : 'N/A'}
            </span>
          </div>

          {/* Transición Fade Out */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
              Fade Out:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={currentLine.fxFadeOutSeconds ?? 1.0}
                onChange={(e) => onUpdateCurrentLine('fxFadeOutSeconds', parseFloat(e.target.value) || 0)}
                className="w-16 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2 py-1 text-xs text-[var(--text)] font-mono outline-none"
              />
              <span className="text-xs text-[var(--muted)] font-mono">seconds</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap text-[10px]">
              {[0, 0.5, 1.0, 2.0, 3.0].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateCurrentLine('fxFadeOutSeconds', sec)}
                  className={`px-1.5 py-0.5 rounded-lg border text-[9px] cursor-pointer transition-colors ${
                    (currentLine.fxFadeOutSeconds ?? 1.0) === sec
                      ? 'border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--accent)] font-bold'
                      : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {sec === 0 ? '0s (Inst)' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation and Deletion Tools */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap text-xs">
            {(() => {
              const pair = timelineFxStatus.pairsMap.get(currentLine.fxPairId || '');
              if (!pair) return (
                <span className="text-[10px] text-amber-500 flex items-center gap-1">
                  <GuiIconRenderer icon={GUI_ICONS.action.alert} size={12} />
                  <span>No linked start node</span>
                </span>
              );
              return (
                <button
                  type="button"
                  onClick={() => onSelectLineIndex(pair.startIdx)}
                  className="px-2.5 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.search} size={12} />
                  <span>Jump to Start (#{pair.startIdx + 1})</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => {
                if (confirm('Delete both Start and End for this Screen Effect?')) {
                  const pId = currentLine.fxPairId;
                  const filtered = (currentScene?.timeline || []).filter(
                    (e) => (pId ? e.fxPairId !== pId : true) && e.id !== currentLine.id
                  );
                  onUpdateCurrentScene('timeline', filtered);
                  onSelectLineIndex(Math.max(0, Math.min(selectedLineIndex, filtered.length - 1)));
                  notify('Screen Effect range deleted');
                }
              }}
              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3" />
              <span>Delete Start and End</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
