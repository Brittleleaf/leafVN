"use client";
import React, { useState, useEffect } from 'react';
import { VNScene, VNStory } from '@/types/vn';
import { playSfx, playAudioPreview, stopAudioPreview, subscribeAudioPreview, getCurrentlyPlayingPreviewUrl } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import AssetStudioModal from './AssetStudioModal';

interface SceneAudioModalProps {
  scene: VNScene;
  story?: VNStory;
  onUpdateScene: (patch: Partial<VNScene>) => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export const ENTRY_SFX_PRESETS = [
  { name: 'Door Open (Interaction)', url: '/assets/sfx/Interactions/open door.mp3' },
  { name: 'Close Door after Entry (Interaction)', url: '/assets/sfx/Interactions/close door after entry.mp3' },
  { name: 'Drawer / Cabinet Open (Interaction)', url: '/assets/sfx/Interactions/drawer open.mp3' },
  { name: 'Item Select / Pick Up', url: '/assets/sfx/Item select.mp3' },
  { name: 'Open Folder / Dossier', url: '/assets/sfx/open folder.mp3' },
  { name: 'Cinematic Scene Intro', url: '/assets/sfx/start after click intro.mp3' },
  { name: 'Corrupt File / Electrical Fault', url: '/assets/sfx/corrupt file.mp3' },
  { name: 'Scenario Alarm / Danger', url: '/assets/sfx/ERROR RING.mp3' },
  { name: 'Page Flip / Dossier Sheet', url: '/assets/sfx/flip page.mp3' },
  { name: 'Radio Tuning / Retro Intro', url: '/assets/sfx/back to intro.mp3' },
  { name: 'Success Chime / Revelation', url: '/assets/sfx/success.mp3' },
  { name: 'Fast Typing / Input Terminal', url: '/assets/sfx/typing.mp3' },
];

export const BGM_AMBIENT_PRESETS = [
  { name: 'White Noise / Analog Static (Loop)', url: '/assets/sfx/BGM/bg-tvnoise.mp3' },
  { name: 'Dead Zone (Atmospheric Drone)', url: '/assets/sfx/BGM/Dead zone.mp3' },
  { name: 'Static Dead (Deep Glitch Buzz)', url: '/assets/sfx/BGM/Static Dead.mp3' },
  { name: 'Siren Head Death Sound (Warning)', url: '/assets/sfx/BGM/Siren head death sound.mp3' },
  { name: 'Residual Radio Frequency', url: '/assets/sfx/back to intro.mp3' },
];

export default function SceneAudioModal({
  scene,
  story,
  onUpdateScene,
  onClose,
  notify = () => {},
}: SceneAudioModalProps) {
  const [entrySfx, setEntrySfx] = useState<string>(scene.entrySfxUrl || '');
  const [bgm, setBgm] = useState<string>(scene.bgmUrl || '');
  const [ambientSfx, setAmbientSfx] = useState<string>(scene.ambientSfxUrl || '');
  const [galleryPicker, setGalleryPicker] = useState<'sfx' | 'bgm' | null>(null);
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

  const handleSave = () => {
    stopAudioPreview();
    onUpdateScene({
      entrySfxUrl: entrySfx.trim() || undefined,
      bgmUrl: bgm.trim() || undefined,
      ambientSfxUrl: ambientSfx.trim() || undefined,
    });
    playSfx('/assets/sfx/success.mp3', false, 0.5);
    notify('Scenario audio updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans">
      <div className="max-w-xl w-full max-h-[88vh] sm:max-h-[85vh] vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
        
        {/* CABECERA */}
        <div className="p-4 sm:p-5 border-b vn-glass-header shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <GuiIconRenderer icon={GUI_ICONS.media.volume} size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <span>Scenario Audio Settings</span>
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Scenario: <b className="text-[var(--text)]">"{scene.name}"</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer text-sm transition-colors shrink-0"
            title="Close modal (Esc)"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          
          {/* 1. SFX DE ENTRADA AL ESCENARIO */}
          <div className="p-4 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-2.5 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.general.folder} size={14} className="text-emerald-500" />
                <span>Entry Sound Effect (Entry SFX):</span>
              </label>
              {entrySfx && (() => {
                const isPlaying = playingUrl === entrySfx;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        stopAudioPreview();
                      } else {
                        playAudioPreview(entrySfx, 0.7);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors text-xs border ${
                      isPlaying
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm animate-pulse'
                        : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)]'
                    }`}
                    title={isPlaying ? 'Stop audio preview' : 'Test sound effect'}
                  >
                    <GuiIconRenderer icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.media.play} size={10} />
                    <span>{isPlaying ? 'Stop' : 'Test'}</span>
                  </button>
                );
              })()}
            </div>

            <p className="text-[11px] text-[var(--muted)]">
              Sound played immediately when entering or transitioning to this scenario (e.g. door opening, alarm, or footsteps).
            </p>

            <div className="space-y-1">
              <label className="text-[9px] text-[var(--muted2)] uppercase block font-bold">Path or Asset Gallery:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={entrySfx}
                  onChange={(e) => setEntrySfx(e.target.value)}
                  placeholder="/assets/sfx/... or choose from gallery"
                  className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2 text-xs text-[var(--text)] font-mono outline-none"
                />
                {story && (
                  <button
                    type="button"
                    onClick={() => setGalleryPicker('sfx')}
                    className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={14} />
                    <span>SFX Gallery</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. MÚSICA O SONIDO DE FONDO EN LOOP (BGM / AMBIENTE) */}
          <div className="p-4 bg-[var(--panel)] border border-[var(--border)] rounded-lg space-y-2.5 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.media.volume} size={14} className="text-sky-500" />
                <span>Background Ambient Music or Sound (Loop):</span>
              </label>
              {bgm && (() => {
                const isPlaying = playingUrl === bgm;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        stopAudioPreview();
                      } else {
                        playAudioPreview(bgm, 0.5);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors text-xs border ${
                      isPlaying
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm animate-pulse'
                        : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)]'
                    }`}
                    title={isPlaying ? 'Stop background audio preview' : 'Test background audio'}
                  >
                    <GuiIconRenderer icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.media.play} size={10} />
                    <span>{isPlaying ? 'Stop' : 'Test'}</span>
                  </button>
                );
              })()}
            </div>

            <p className="text-[11px] text-[var(--muted)]">
              Ambient audio or continuous background music establishing the mood of this location.
            </p>

            <div className="space-y-1">
              <label className="text-[9px] text-[var(--muted2)] uppercase block font-bold">Path or Asset Gallery:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bgm}
                  onChange={(e) => setBgm(e.target.value)}
                  placeholder="/assets/sfx/... or choose from gallery"
                  className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2 text-xs text-[var(--text)] font-mono outline-none"
                />
                {story && (
                  <button
                    type="button"
                    onClick={() => setGalleryPicker('bgm')}
                    className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={14} />
                    <span>BGM Gallery</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* PIE CON ACCIONES */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] shrink-0 flex items-center justify-end gap-2 bg-[var(--well-bg)]/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-md text-xs uppercase cursor-pointer transition-all shadow flex items-center gap-1.5"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.check} size={14} />
            <span>Save Scenario Audio</span>
          </button>
        </div>

      </div>

      {galleryPicker && story && (
        <AssetStudioModal
          story={story}
          filterType={galleryPicker}
          onSelectAsset={(asset) => {
            if (galleryPicker === 'sfx') {
              setEntrySfx(asset.url);
              if (asset.url) playSfx(asset.url, false, 0.7);
            }
            if (galleryPicker === 'bgm') {
              setBgm(asset.url);
              if (asset.url) playSfx(asset.url, false, 0.5);
            }
            setGalleryPicker(null);
            notify(`Audio selected: ${asset.name}`);
          }}
          onClose={() => setGalleryPicker(null)}
          notify={notify}
        />
      )}
    </div>
  );
}
