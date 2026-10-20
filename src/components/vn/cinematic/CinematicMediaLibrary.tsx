"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { VNStory, VNAssetType, VNAssetItem } from '@/types/vn';
import {
  playUiSound,
  subscribeAudioPreview,
  getActivePreviewUrl,
} from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { useProjectAssets } from '@/lib/vn/useProjectAssets';
import { SCREEN_FX_REGISTRY } from '../screenfx';
import {
  MediaTabType,
  MediaCatalogItem,
  CinematicCharactersTab,
  CinematicScreenFxTab,
  CinematicMediaTab,
  CinematicTitlesTab,
  CinematicAudioTab,
} from './medialibrary';

interface CinematicMediaLibraryProps {
  story: VNStory;
  onAddMediaClip: (asset: {
    url: string;
    name?: string;
    type: 'image' | 'video';
    section?: 'media' | 'background';
  }) => void;
  onAddTextClip: (preset?: {
    text: string;
    style?: string;
    effect?: string;
    speaker?: string;
    avatarUrl?: string;
    speakerColor?: string;
    speakerBadge?: string;
  }) => void;
  onAddAudioClip: (asset: { url: string; name?: string; isBgm?: boolean }) => void;
  onAddFxClip: (fxType: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenAssetStudio?: (filterType?: VNAssetType) => void;
  previewBackgroundUrl?: string;
}

export const CinematicMediaLibrary: React.FC<CinematicMediaLibraryProps> = ({
  story,
  onAddMediaClip,
  onAddTextClip,
  onAddAudioClip,
  onAddFxClip,
  isCollapsed = false,
  onToggleCollapse,
  onOpenAssetStudio,
  previewBackgroundUrl,
}) => {
  // Shared project assets from the central catalog
  const { allAssets } = useProjectAssets(story);

  const [activeTab, setActiveTab] = useState<MediaTabType>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAudioPreview(() => {
      setCurrentPreviewUrl(getActivePreviewUrl());
    });
  }, []);

  const characters = story.characters || [];

  // Resizable width (defaults to comfortable 460px, can be dragged from 340px to 720px)
  const [panelWidth, setPanelWidth] = useState<number>(460);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(460);

  // Drag border resize listener
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(340, Math.min(720, startWidthRef.current + deltaX));
      setPanelWidth(newWidth);
    };

    const handlePointerUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (isResizingRef.current) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        isResizingRef.current = false;
      }
    };
  }, []);

  const handleStartResize = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Build unified visual media items
  const mediaItems: MediaCatalogItem[] = useMemo(() => {
    const items: MediaCatalogItem[] = [];

    allAssets.forEach((asset) => {
      if (asset.type === 'background') {
        items.push({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          tag: 'Background',
          origin: asset.origin,
          category: asset.category,
        });
      } else if (asset.type === 'character') {
        items.push({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          tag: 'Character',
          origin: asset.origin,
          category: asset.category,
        });
      } else if (asset.type === 'icon') {
        items.push({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          tag: 'Icon',
          origin: asset.origin,
          category: asset.category,
        });
      }
    });

    (story.scenarios || []).forEach((sc) => {
      if (sc.backgroundUrl && !items.some((m) => m.url === sc.backgroundUrl)) {
        items.push({
          id: `sc-${sc.id}`,
          url: sc.backgroundUrl,
          name: sc.name || 'Scenario',
          tag: 'Scenario',
          origin: 'project',
          category: 'Story Scenario',
        });
      }
    });

    characters.forEach((ch) => {
      if (ch.avatarUrl && !items.some((m) => m.url === ch.avatarUrl)) {
        items.push({
          id: `ch-${ch.id}`,
          url: ch.avatarUrl,
          name: ch.name || 'Character',
          tag: 'Character',
          origin: 'project',
          category: 'Character Avatar',
        });
      }
      if (ch.expressions) {
        Object.entries(ch.expressions).forEach(([emoKey, emoUrl]) => {
          if (emoUrl && typeof emoUrl === 'string' && !items.some((m) => m.url === emoUrl)) {
            items.push({
              id: `ch-${ch.id}-${emoKey}`,
              url: emoUrl,
              name: `${ch.name} (${emoKey})`,
              tag: 'Character',
              origin: 'project',
              category: 'Expression',
            });
          }
        });
      }
    });

    return items;
  }, [allAssets, story.scenarios, characters]);

  // Unified Audio Catalog (BGM, SFX, Voices from Central Asset Library)
  const audioAssets: VNAssetItem[] = useMemo(() => {
    return allAssets.filter(
      (a) => a.type === 'sfx' || a.type === 'bgm' || a.type === 'voice'
    );
  }, [allAssets]);

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col items-center py-3 gap-4 shrink-0 select-none z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          title="Expand Media Library"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-5 h-5 text-cyan-400" />
        </button>
        <span className="text-[10px] font-mono text-[var(--muted)] [writing-mode:vertical-lr] tracking-widest uppercase">
          Library
        </span>
      </div>
    );
  }

  return (
    <div
      style={{ width: `${panelWidth}px` }}
      className="relative border-r border-[var(--border)] bg-[var(--surface)] flex flex-col h-full select-none shrink-0 text-xs overflow-hidden z-20 shadow-2xl"
    >
      {/* DRAG-TO-RESIZE RIGHT HANDLE */}
      <div
        onPointerDown={handleStartResize}
        className="absolute top-0 right-0 bottom-0 w-2.5 -mr-1 cursor-col-resize hover:bg-[var(--accent)]/50 active:bg-[var(--accent)] transition-colors z-30 group"
        title="Drag to resize library width"
      >
        <div className="h-full w-0.5 bg-transparent group-hover:bg-[var(--accent)] mx-auto" />
      </div>

      {/* HEADER: TITLE, SEARCH, ASSET STUDIO LINK & WIDTH PRESETS */}
      <div className="p-3 border-b border-[var(--border)] bg-[var(--well-bg)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-4 h-4 text-cyan-400" />
            <span className="font-extrabold tracking-wider text-[var(--text)] text-xs uppercase">
              Cinematic Library
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Direct access to full Asset Studio modal */}
            {onOpenAssetStudio && (
              <button
                type="button"
                onClick={() =>
                  onOpenAssetStudio(
                    activeTab === 'audio'
                      ? 'sfx'
                      : activeTab === 'media'
                      ? 'background'
                      : undefined
                  )
                }
                className="px-2 py-0.5 rounded-lg bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-cyan-400 hover:text-cyan-300 border border-[var(--border)] text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Open full Asset Studio to upload or manage project files"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3 h-3 text-cyan-400" />
                <span>Asset Studio</span>
              </button>
            )}

            <span className="text-[9px] text-[var(--muted)] font-mono hidden sm:inline font-bold">W:</span>
            {[360, 480, 620].map((w) => (
              <button
                key={w}
                onClick={() => setPanelWidth(w)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  panelWidth === w
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)]'
                }`}
                title={`Set width to ${w}px`}
              >
                {w}
              </button>
            ))}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer ml-1 flex items-center justify-center border border-transparent hover:border-[var(--border)]"
                title="Collapse Library"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3 h-3 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search characters, media, audio, FX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2.5 py-1.5 pl-8 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] text-[var(--text)] placeholder-[var(--muted2)] text-xs focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--well-focus-bg)] transition-all font-medium"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
            <GuiIconRenderer icon={GUI_ICONS.action.search} className="w-3.5 h-3.5 text-[var(--muted)]" />
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* TABS (5 SECTIONS) */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-[var(--well-bg)] rounded-xl border border-[var(--border)] text-[10px] font-bold">
          {[
            { id: 'characters', label: 'Characters', icon: GUI_ICONS.general.masks, count: characters.length },
            { id: 'fx', label: 'Screen FX', icon: GUI_ICONS.general.screenFx, count: Object.keys(SCREEN_FX_REGISTRY).length },
            { id: 'media', label: 'Media', icon: GUI_ICONS.general.background, count: mediaItems.length },
            { id: 'text', label: 'Titles', icon: GUI_ICONS.general.conversation, count: 6 },
            { id: 'audio', label: 'Audio', icon: GUI_ICONS.general.sound, count: audioAssets.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as MediaTabType);
                playUiSound('click', 0.15);
              }}
              className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-sm font-black'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
              }`}
            >
              <GuiIconRenderer icon={tab.icon} className="w-3.5 h-3.5" />
              <span className="truncate max-w-full text-[9px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODULAR TAB BODIES */}
      {activeTab === 'characters' && (
        <CinematicCharactersTab
          characters={characters}
          onAddMediaClip={onAddMediaClip}
          onAddTextClip={onAddTextClip}
        />
      )}

      {activeTab === 'fx' && (
        <CinematicScreenFxTab
          searchQuery={searchQuery}
          panelWidth={panelWidth}
          previewBackgroundUrl={previewBackgroundUrl}
          onAddFxClip={onAddFxClip}
        />
      )}

      {activeTab === 'media' && (
        <CinematicMediaTab
          mediaItems={mediaItems}
          searchQuery={searchQuery}
          onAddMediaClip={onAddMediaClip}
          onOpenAssetStudio={onOpenAssetStudio}
        />
      )}

      {activeTab === 'text' && (
        <CinematicTitlesTab
          onAddTextClip={onAddTextClip}
        />
      )}

      {activeTab === 'audio' && (
        <CinematicAudioTab
          audioAssets={audioAssets}
          searchQuery={searchQuery}
          currentPreviewUrl={currentPreviewUrl}
          onAddAudioClip={onAddAudioClip}
          onOpenAssetStudio={onOpenAssetStudio}
        />
      )}
    </div>
  );
};
