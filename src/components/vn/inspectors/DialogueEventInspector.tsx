"use client";
import React, { useState, useEffect } from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playAudioPreview, stopAudioPreview, subscribeAudioPreview, getCurrentlyPlayingPreviewUrl } from '@/lib/audioSettings';
import { VN_FONT_CATALOG, ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import { VN_CURSORS_CATALOG } from '../cursors';
import { EventInspectorSubProps } from './types';
import { useVNMaker } from '../VNMakerContext';

export const DialogueEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  currentSpeaker,
  onUpdateCurrentLine,
  onPatchCurrentLine,
  onOpenCharacterPicker,
  onOpenAssetPicker,
}) => {
  let context: ReturnType<typeof useVNMaker> | null = null;
  try {
    context = useVNMaker();
  } catch {}

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

  const currentEffectiveScale = Math.round((currentLine.characterScale ?? currentSpeaker?.defaultScale ?? 1.0) * 100) / 100;
  const isFlipped = currentLine.characterFlipX ?? false;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase font-semibold block mb-1">
            Speaking Character:
          </label>
          <button
            onClick={onOpenCharacterPicker}
            className="w-full p-2 bg-[var(--well-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
            style={{ color: currentSpeaker?.color || '#ef4444' }}
          >
            <span>{currentSpeaker?.name || 'SYSTEM LOG'}</span>
            <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
              <GuiIconRenderer icon={GUI_ICONS.general.pencil} size={12} />
              <span>Change</span>
            </span>
          </button>
        </div>

        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase font-semibold block mb-1">
            Emotion / Expression:
          </label>
          <select
            value={currentLine.emotion || 'neutral'}
            onChange={(e) => onUpdateCurrentLine('emotion', e.target.value)}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
          >
            <option value="neutral">Neutral</option>
            {currentSpeaker?.expressions &&
              Object.keys(currentSpeaker.expressions)
                .filter((emKey) => emKey !== 'neutral')
                .map((emKey) => (
                  <option key={emKey} value={emKey}>
                    {emKey}
                  </option>
                ))}
          </select>
        </div>
      </div>

      {/* Character Staging & Quick Position Presets */}
      <div className="p-2.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Character Staging & Position:</span>
          </label>
          {currentLine.characterXPercent !== undefined && (
            <span className="text-[9px] font-mono text-[var(--accent)] font-bold">
              X:{currentLine.characterXPercent}% • Y:{currentLine.characterYPercent ?? 88}%
              {currentLine.characterScale && currentLine.characterScale !== 1 ? ` (${currentLine.characterScale}x)` : ''}
              {currentLine.characterRotation ? ` [${currentLine.characterRotation}°]` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Canonical Slot Presets (Docked directly to Dialogue Box) */}
          <div className="flex items-center gap-1 flex-1">
            {(() => {
              const isCustomPlaced =
                typeof currentLine.characterXPercent === 'number' &&
                Number.isFinite(currentLine.characterXPercent) &&
                typeof currentLine.characterYPercent === 'number' &&
                Number.isFinite(currentLine.characterYPercent);
              const activeSlot = currentLine.characterPosition || 'left';

              return [
                { pos: 'left' as const, label: '◧ Left' },
                { pos: 'center' as const, label: '◫ Center' },
                { pos: 'right' as const, label: '◨ Right' },
              ].map(({ pos, label }) => {
                const isSlotActive = !isCustomPlaced && activeSlot === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => {
                      onPatchCurrentLine({
                        characterPosition: pos,
                        characterXPercent: undefined,
                        characterYPercent: undefined,
                        characterRotation: 0,
                      });
                      playSfx('/assets/sfx/click interface.mp3', false, 0.2);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border text-center ${
                      isSlotActive
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--card-bg)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border2)]'
                    }`}
                    title={`Preset ${label}: Acoplar personaje al borde ${pos} del diálogo`}
                  >
                    {label}
                  </button>
                );
              });
            })()}
          </div>

          {/* Magnetic Snapping Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !currentLine.characterDisableSnap;
              onUpdateCurrentLine('characterDisableSnap', next);
              playSfx(next ? '/assets/sfx/click intro.mp3' : '/assets/sfx/click interface.mp3', false, 0.2);
            }}
            className={`px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
              currentLine.characterDisableSnap
                ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm'
                : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title={currentLine.characterDisableSnap ? 'Snap magnético desactivado (Mover libre)' : 'Snap magnético activo'}
          >
            <span>{currentLine.characterDisableSnap ? '🧲 Snap: OFF' : '🧲 Snap: ON'}</span>
          </button>

          {/* Lock Element toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !currentLine.characterLocked;
              onUpdateCurrentLine('characterLocked', next);
              playSfx(next ? '/assets/sfx/click intro.mp3' : '/assets/sfx/click interface.mp3', false, 0.2);
            }}
            className={`px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
              currentLine.characterLocked
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title={currentLine.characterLocked ? 'Desbloquear personaje' : 'Bloquear personaje para congelar su posición'}
          >
            <span>{currentLine.characterLocked ? '🔒 Locked' : '🔓 Lock'}</span>
          </button>

          {/* Reset custom staging button */}
          {currentLine.characterXPercent !== undefined && (
            <button
              type="button"
              onClick={() => {
                onPatchCurrentLine({
                  characterXPercent: undefined,
                  characterYPercent: undefined,
                  characterScale: undefined,
                  characterRotation: undefined,
                  characterFlipX: undefined,
                  characterLocked: undefined,
                });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] hover:bg-red-500/20 hover:text-red-300 text-[var(--muted)] text-xs font-bold cursor-pointer transition-colors"
              title="Restablecer a posición por defecto"
            >
              ↺ Reset
            </button>
          )}
        </div>

        {/* Scale & Orientation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs">
          {/* Scale Stepper & Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">
              Escala:
            </span>
            <div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-1.5 py-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  const newScale = Math.max(0.4, Math.round((currentEffectiveScale - 0.05) * 100) / 100);
                  onPatchCurrentLine({ characterScale: newScale });
                }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--well-bg)] text-[var(--text)] font-bold cursor-pointer"
                title="Reducir tamaño"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-[var(--accent)] min-w-[42px] text-center">
                {currentEffectiveScale}x
              </span>
              <button
                type="button"
                onClick={() => {
                  const newScale = Math.min(2.5, Math.round((currentEffectiveScale + 0.05) * 100) / 100);
                  onPatchCurrentLine({ characterScale: newScale });
                }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--well-bg)] text-[var(--text)] font-bold cursor-pointer"
                title="Aumentar tamaño"
              >
                +
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1">
              {[0.8, 1.0, 1.2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onPatchCurrentLine({ characterScale: s })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    currentEffectiveScale === s
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                      : 'bg-[var(--card-bg)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Flip Horizontal Manual Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextFlip = !isFlipped;
                onPatchCurrentLine({ characterFlipX: nextFlip });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                isFlipped
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                  : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              title={isFlipped ? 'Voltear horizontal activo (Espejo)' : 'Voltear horizontalmente (Espejo)'}
            >
              <span>🪞 Voltear</span>
            </button>

            {/* Button: Copiar escala a los demás diálogos */}
            {currentSpeaker && (
              <button
                type="button"
                onClick={() => {
                  if (context?.handleApplyScaleToAllDialogues) {
                    context.handleApplyScaleToAllDialogues(currentSpeaker.id, currentEffectiveScale);
                  }
                }}
                className="px-2.5 py-1 rounded-lg border border-[var(--accent)] bg-[var(--accent)] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title={`Aplica ${currentEffectiveScale}x a todos los diálogos de ${currentSpeaker.name} en la historia`}
              >
                <span>📋 Copiar escala a los demás diálogos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-[var(--muted)] uppercase font-semibold block mb-1">
          Dialogue Text:
        </label>
        <textarea
          rows={3}
          value={currentLine.text || ''}
          onChange={(e) => onUpdateCurrentLine('text', e.target.value)}
          placeholder="Enter dialogue text here..."
          className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2.5 text-xs text-[var(--text)] outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Dialogue Line Font Override */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center gap-1.5 min-w-0">
          <GuiIconRenderer icon={GUI_ICONS.general.texts} size={14} className="text-[var(--accent)]" />
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider truncate">
            Line Font Override:
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              onOpenAssetPicker(
                'font',
                (url) => {
                  if (url) {
                    ensureGoogleFontLoaded(url);
                    onUpdateCurrentLine('fontFamily', url);
                  }
                },
                currentLine.text || 'Dialogue sample line...'
              );
            }}
            className="px-2.5 py-1 bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 max-w-[180px]"
            title="Select font from Gallery"
          >
            <span className="truncate" style={{ fontFamily: currentLine.fontFamily || undefined }}>
              {VN_FONT_CATALOG.find((f) => f.id === currentLine.fontFamily)?.name || 'Default (Inherited)'}
            </span>
            <GuiIconRenderer icon={GUI_ICONS.general.texts} size={11} className="text-[var(--accent)]" />
          </button>
          {currentLine.fontFamily && (
            <button
              type="button"
              onClick={() => onUpdateCurrentLine('fontFamily', undefined)}
              className="p-1 rounded hover:bg-red-500/20 text-red-400 text-xs cursor-pointer transition-colors"
              title="Remove font override"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Dialogue Line Cursor Override */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg">
        <div className="flex items-center gap-1.5 min-w-0">
          <GuiIconRenderer icon={GUI_ICONS.action.target} size={14} className="text-[var(--accent)]" />
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider truncate">
            Line Cursor Override:
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <select
            value={currentLine.cursorType || ''}
            onChange={(e) => onUpdateCurrentLine('cursorType', e.target.value || undefined)}
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text)] outline-none"
          >
            <option value="">Default (Inherited)</option>
            {VN_CURSORS_CATALOG.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              onOpenAssetPicker('cursor', (selectedId) => {
                if (selectedId) {
                  onUpdateCurrentLine('cursorType', selectedId);
                }
              });
            }}
            className="px-2 py-1 bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1"
            title="Browse Cursor Gallery"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.target} size={12} className="text-[var(--accent)]" />
            <span>Gallery</span>
          </button>

          {currentLine.cursorType && (
            <>
              <select
                value={currentLine.cursorMode || 'dialogue_only'}
                onChange={(e) => onUpdateCurrentLine('cursorMode', e.target.value as any)}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--accent)] font-semibold outline-none"
                title="Cursor persistence mode"
              >
                <option value="dialogue_only">This line only</option>
                <option value="persistent">Keep persistent</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  onPatchCurrentLine({ cursorType: undefined, cursorMode: undefined });
                }}
                className="p-1 rounded hover:bg-red-500/20 text-red-400 text-xs cursor-pointer transition-colors"
                title="Remove cursor override"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sound Effect or Voice on this Dialogue */}
      <div className="p-3 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] uppercase font-bold flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3.5 h-3.5 text-rose-500" />
            <span>Sound Effect / Speaking Voice (SFX):</span>
          </label>
          {currentLine.sfx && (
            <div className="flex items-center gap-1.5">
              {(() => {
                const isPlaying = Boolean(currentLine.sfx && playingUrl === currentLine.sfx);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        stopAudioPreview();
                      } else {
                        playAudioPreview(currentLine.sfx!, 0.8);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm border ${
                      isPlaying
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)]'
                    }`}
                    title={isPlaying ? 'Stop sound playback' : 'Test assigned sound'}
                  >
                    <GuiIconRenderer icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.state.play} className="w-2.5 h-2.5" />
                    <span>{isPlaying ? 'Stop' : 'Test'}</span>
                  </button>
                );
              })()}
              <button
                type="button"
                onClick={() => {
                  if (playingUrl === currentLine.sfx) {
                    stopAudioPreview();
                  }
                  onUpdateCurrentLine('sfx', undefined);
                }}
                className="text-[var(--muted2)] hover:text-red-500 text-xs cursor-pointer px-1 transition-colors"
                title="Remove sound from this line"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentLine.sfx || ''}
            onChange={(e) => onUpdateCurrentLine('sfx', e.target.value || undefined)}
            placeholder="Audio path (e.g. /assets/sfx/... or choose from Gallery)"
            className="flex-1 bg-[var(--card-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] font-mono outline-none"
          />
          <button
            type="button"
            onClick={() =>
              onOpenAssetPicker('sfx', (url) => {
                onUpdateCurrentLine('sfx', url || undefined);
                if (url) playSfx(url, false, 0.8);
              })
            }
            className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
            title="Open Asset Gallery to select an SFX or Voice"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Gallery</span>
          </button>
        </div>

        {/* Presets rápidos */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
          <span className="text-[var(--muted2)] font-mono font-bold">Presets:</span>
          {[
            { label: 'Door', icon: GUI_ICONS.general.folder, url: '/assets/sfx/open folder.mp3' },
            { label: 'Error', icon: GUI_ICONS.action.alert, url: '/assets/sfx/corrupt file.mp3' },
            { label: 'Success', icon: GUI_ICONS.action.check, url: '/assets/sfx/success.mp3' },
            { label: 'Alarm', icon: GUI_ICONS.action.danger, url: '/assets/sfx/ERROR RING.mp3' },
            { label: 'Typing', icon: GUI_ICONS.general.texts, url: '/assets/sfx/typing.mp3' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onUpdateCurrentLine('sfx', preset.url);
                playSfx(preset.url, false, 0.7);
              }}
              className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                currentLine.sfx === preset.url
                  ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-200 font-bold'
                  : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border2)]'
              }`}
            >
              <GuiIconRenderer icon={preset.icon} size={11} />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
