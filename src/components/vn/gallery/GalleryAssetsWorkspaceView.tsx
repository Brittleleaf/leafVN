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
    <div className="flex-1 w-full h-full flex flex-col bg-transparent select-none overflow-hidden relative z-10">
      {/* HEADER / TOOLBAR */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playSfx('/assets/sfx/click intro.mp3', false, 0.25);
              setCurrentWorkspace('hub');
            }}
            className="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-xs font-bold text-[var(--accent)] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            title="Return to Master Hub"
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
              <h2 className="text-xs font-bold tracking-wide uppercase text-[var(--text)]">
                Gallery & Asset Studio
              </h2>
              <span className="text-[10px] text-[var(--muted)] font-mono">
                Character rosters, multimedia assets and in-game gallery simulation
              </span>
            </div>
          </div>
        </div>

        {/* WORKSPACE SEGMENTED SUB-TABS */}
        <div className="flex items-center gap-1 bg-[var(--well-bg)] border border-[var(--border)] p-0.5 rounded-lg shadow-inner">
          <button
            onClick={() => {
              setActiveTab('characters');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'characters' ? 'bg-[var(--btn-bg)] border border-[var(--border2)] text-[var(--text)] font-semibold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5" />
            <span>Characters & Expressions</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('assets');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'assets' ? 'bg-[var(--btn-bg)] border border-[var(--border2)] text-[var(--text)] font-semibold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5" />
            <span>Multimedia Library (BGM / SFX / BG)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('extras_preview');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'extras_preview'
                ? 'bg-[var(--btn-bg)] border border-[var(--border2)] text-[var(--text)] font-semibold shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
            <span>Preview In-Game Gallery</span>
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
              isWorkspaceView={true}
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
              isWorkspaceView={true}
            />
          </div>
        )}

        {activeTab === 'extras_preview' && (
          <div className="w-full h-full p-4 overflow-hidden flex flex-col bg-transparent">
            <div className="w-full h-full rounded-lg border border-[var(--border)] bg-[var(--panel)] backdrop-blur-md p-4 shadow-xl relative overflow-hidden flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3 shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-4 h-4 text-amber-400" />
                    <span>Live Gallery Viewer (In-Game Menu Simulation)</span>
                  </h3>
                  <p className="text-[10px] text-[var(--muted)]">
                    Real-time player preview for cinematics, unlockable scenarios, and character dossiers.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 rounded-md font-bold">
                  Interactive Preview
                </span>
              </div>

              <div className="flex-1 relative overflow-hidden rounded-md border border-[var(--border)] bg-[var(--well-bg)] p-3">
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
