"use client";
import React, { useState } from 'react';
import { useVNMaker } from '../VNMakerContext';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import CharacterStudioModal from '../CharacterStudioModal';
import AssetStudioModal from '../AssetStudioModal';
import { StaticScreenGalleryWidget } from '../staticscreen/widgets/StaticScreenGalleryWidget';

export default function GalleryAssetsWorkspaceView() {
  const {
    story,
    setStory,
    setCurrentWorkspace,
    handleUpdateStoryCustomAssets,
    notify,
  } = useVNMaker();

  const [activeTab, setActiveTab] = useState<'characters' | 'assets' | 'extras_preview'>('characters');

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0b0e17] select-none overflow-hidden">
      {/* HEADER / TOOLBAR */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playSfx('/assets/sfx/click intro.mp3', false, 0.25);
              setCurrentWorkspace('hub');
            }}
            className="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-xs font-bold text-[var(--accent)] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            title="Volver a la pantalla principal del proyecto"
          >
            <GuiIconRenderer icon={GUI_ICONS.navigation.arrowLeft} className="w-3.5 h-3.5" />
            <span>Hub</span>
          </button>

          <div className="h-4 w-[1px] bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wide uppercase text-white">
                Gallery & Asset Studio
              </h2>
              <span className="text-[10px] text-[var(--muted)] font-mono">
                Personajes, biblioteca de medios y galería de extras
              </span>
            </div>
          </div>
        </div>

        {/* WORKSPACE SEGMENTED SUB-TABS */}
        <div className="flex items-center gap-1 bg-[#131620] border border-[#282d3e] p-0.5 rounded-lg shadow-inner">
          <button
            onClick={() => {
              setActiveTab('characters');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-[#232838] border border-[#3e4660] text-white font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5" />
            <span>Personajes & Expresiones</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('assets');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-[#232838] border border-[#3e4660] text-white font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5" />
            <span>Biblioteca Multimedia (BGM / SFX / BG)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('extras_preview');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'extras_preview'
                ? 'bg-amber-950/70 border border-amber-500/80 text-amber-200 font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
            <span>Previsualizar Galería del Juego</span>
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'characters' && (
          <div className="w-full h-full relative">
            <CharacterStudioModal
              story={story}
              onUpdateStory={(updated) => setStory(updated)}
              onClose={() => setCurrentWorkspace('hub')}
              notify={notify}
            />
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="w-full h-full relative">
            <AssetStudioModal
              story={story}
              onUpdateStory={(updated) => setStory(updated)}
              onUpdateStoryCustomAssets={handleUpdateStoryCustomAssets}
              onClose={() => setCurrentWorkspace('hub')}
              notify={notify}
            />
          </div>
        )}

        {activeTab === 'extras_preview' && (
          <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center bg-black/80">
            <div className="w-full max-w-5xl h-[620px] rounded-3xl border border-amber-500/30 bg-[#12100d] p-6 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-amber-900/40 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-4 h-4 text-amber-400" />
                    <span>Visor de Galería en Vivo (Simulación del Menú de Juego)</span>
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Así es como se visualizan las cinemáticas, escenarios y fichas de personajes para el jugador final.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full">
                  Modo Interactivo
                </span>
              </div>

              <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4">
                <StaticScreenGalleryWidget
                  story={story}
                  isInteractive={true}
                  initialTab="cinematics"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
