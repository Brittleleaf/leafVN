"use client";
import React, { useState, useEffect } from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playAudioPreview, stopAudioPreview, subscribeAudioPreview, getCurrentlyPlayingPreviewUrl } from '@/lib/audioSettings';
import { EventInspectorSubProps } from './types';

export const AudioEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  onUpdateCurrentLine,
  onOpenAssetPicker,
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

  const isBgmPlaying = Boolean(currentLine.audioUrl && playingUrl === currentLine.audioUrl);
  const isSfxPlaying = Boolean(currentLine.audioUrl && playingUrl === currentLine.audioUrl);

  return (
    <>
      {/* CASE: BACKGROUND MUSIC (BGM) */}
      {currentLine.type === 'bgm' && (
        <div className="space-y-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.media.volume} size={14} className="text-indigo-500" />
              <span>Ambient Background Music (BGM Loop)</span>
            </span>
            {currentLine.audioUrl && (
              <button
                type="button"
                onClick={() => playAudioPreview(currentLine.audioUrl!, currentLine.audioVolume ?? 0.5)}
                className={`text-[10px] px-2 py-0.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1 ${
                  isBgmPlaying
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm font-bold animate-pulse'
                    : 'text-[var(--text)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)]'
                }`}
                title={isBgmPlaying ? 'Stop playback' : 'Test audio preview'}
              >
                <GuiIconRenderer icon={isBgmPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.media.play} size={10} />
                <span>{isBgmPlaying ? 'Stop' : 'Test Audio'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">BGM Audio Track:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentLine.audioUrl || ''}
                  onChange={(e) => onUpdateCurrentLine('audioUrl', e.target.value)}
                  placeholder="/assets/sfx/bg-tvnoise.mp3"
                  className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() => onOpenAssetPicker('bgm', (url) => onUpdateCurrentLine('audioUrl', url))}
                  className="px-2.5 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border2)] text-[var(--text)] rounded-lg text-xs font-bold uppercase flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-sm"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={14} />
                  <span>Gallery</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                Volume ({Math.round((currentLine.audioVolume ?? 0.5) * 100)}%):
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={currentLine.audioVolume ?? 0.5}
                onChange={(e) => onUpdateCurrentLine('audioVolume', Number(e.target.value))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* CASE: SFX (SOUND EFFECT) */}
      {currentLine.type === 'sfx' && (
        <div className="space-y-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.media.volume} size={14} />
              <span>One-shot Sound Effect (SFX)</span>
            </span>
            {currentLine.audioUrl && (
              <button
                type="button"
                onClick={() => playAudioPreview(currentLine.audioUrl!, currentLine.audioVolume ?? 0.8)}
                className={`text-[10px] px-2 py-0.5 rounded-lg border cursor-pointer transition-colors flex items-center gap-1 ${
                  isSfxPlaying
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm font-bold animate-pulse'
                    : 'text-[var(--text)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)]'
                }`}
                title={isSfxPlaying ? 'Stop playback' : 'Test sound effect'}
              >
                <GuiIconRenderer icon={isSfxPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.media.play} size={10} />
                <span>{isSfxPlaying ? 'Stop' : 'Test SFX'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">SFX Sound:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentLine.audioUrl || ''}
                  onChange={(e) => onUpdateCurrentLine('audioUrl', e.target.value)}
                  placeholder="/assets/sfx/... or choose from gallery"
                  className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    onOpenAssetPicker('sfx', (url) => {
                      onUpdateCurrentLine('audioUrl', url);
                      if (url) playAudioPreview(url, 0.8);
                    })
                  }
                  className="px-2.5 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border2)] text-[var(--text)] rounded-lg text-xs font-bold uppercase flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-sm"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={14} />
                  <span>Gallery</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                Volume ({Math.round((currentLine.audioVolume ?? 0.8) * 100)}%):
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={currentLine.audioVolume ?? 0.8}
                onChange={(e) => onUpdateCurrentLine('audioVolume', Number(e.target.value))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
