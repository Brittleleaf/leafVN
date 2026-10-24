"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VNStory, VNAssetItem, VNAssetType } from '@/types/vn';
import { SYSTEM_ASSETS } from '@/lib/vn/systemAssets';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { useProjectAssets } from '@/lib/vn/useProjectAssets';

// Modular Sub-components
import { FontShowcaseTab } from './assetstudio/FontShowcaseTab';
import { ScreenFxShowcaseTab } from './assetstudio/ScreenFxShowcaseTab';
import { TextEffectShowcaseTab } from './assetstudio/TextEffectShowcaseTab';
import { CursorShowcaseTab } from './assetstudio/CursorShowcaseTab';
import { TransitionShowcaseTab } from './assetstudio/TransitionShowcaseTab';
import { AssetUploadModal } from './assetstudio/AssetUploadModal';
import { AssetRenameModal } from './assetstudio/AssetRenameModal';

interface AssetStudioModalProps {
  story: VNStory;
  onUpdateStory?: (updatedStory: VNStory) => void;
  onUpdateStoryCustomAssets?: (updatedAssets: VNAssetItem[]) => void;
  onClose: () => void;
  onSelectAsset?: (asset: VNAssetItem) => void;
  filterType?: VNAssetType;
  initialFilterType?: VNAssetType;
  initialFontSample?: string;
  previewBackgroundUrl?: string;
  notify?: (msg: string) => void;
}

export default function AssetStudioModal({
  story,
  onUpdateStory,
  onUpdateStoryCustomAssets,
  onClose,
  onSelectAsset,
  filterType,
  initialFilterType: propInitialFilterType,
  initialFontSample,
  previewBackgroundUrl,
  notify = () => {},
}: AssetStudioModalProps) {
  const initialFilterType = propInitialFilterType || filterType;
  const { allAssets, projectAssets, isLoading: isLoadingAssets, projectId, fetchProjectAssets } = useProjectAssets(
    story,
    onUpdateStoryCustomAssets
  );
  const projectName = story?.title || projectId;

  const [activeTypeTab, setActiveTypeTab] = useState<VNAssetType | 'all'>(
    initialFilterType || 'all'
  );
  const [activeOriginFilter, setActiveOriginFilter] = useState<'all' | 'system' | 'local' | 'web'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Font Sample state
  const [customFontSample, setCustomFontSample] = useState<string>(
    initialFontSample?.trim() ? initialFontSample.trim() : 'The quick brown fox jumps over the lazy dog. 0123456789'
  );

  useEffect(() => {
    if (initialFontSample?.trim()) {
      setCustomFontSample(initialFontSample.trim());
    }
  }, [initialFontSample]);

  // Live audio playback
  const [playingAssetId, setPlayingAssetId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Upload modal state
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);

  // Rename modal state
  const [renamingAsset, setRenamingAsset] = useState<VNAssetItem | null>(null);

  // Full-size image preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handlePlayAudio = (asset: VNAssetItem) => {
    if (playingAssetId === asset.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setPlayingAssetId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    try {
      const audio = new Audio(asset.url);
      audio.volume = 0.8;
      audioPlayerRef.current = audio;
      setPlayingAssetId(asset.id);

      audio.onended = () => {
        setPlayingAssetId(null);
        audioPlayerRef.current = null;
      };

      audio.onerror = () => {
        setPlayingAssetId(null);
        audioPlayerRef.current = null;
        notify('Could not play audio file.');
      };

      audio.play().catch(() => {
        setPlayingAssetId(null);
      });
    } catch (err) {
      setPlayingAssetId(null);
    }
  };

  // Delete user asset physically from disk or unindex external link
  const handleDeleteUserAsset = async (asset: VNAssetItem) => {
    if (asset.isProtected || asset.origin === 'system') {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('This asset belongs to the system and is protected from deletion.');
      return;
    }

    const isWeb = asset.url.startsWith('http://') || asset.url.startsWith('https://');
    const confirmMsg = isWeb
      ? `Remove indexed web link "${asset.name}" from project gallery?\n(External file won't be deleted).`
      : `Delete "${asset.name}" permanently from the project folder?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    try {
      const filePath = asset.filePath || (isWeb ? asset.url : asset.url.replace(`/projects/${projectId}/assets/`, ''));
      const res = await fetch(
        `/api/projects/${projectId}/assets?filePath=${encodeURIComponent(filePath)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Could not delete file');
      }

      await fetchProjectAssets(true);
      playSfx('/assets/sfx/flip page.mp3', false, 0.3);
      notify(isWeb ? `Web link "${asset.name}" removed from gallery.` : `File "${asset.name}" removed from project folder.`);
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error deleting asset: ${err?.message || err}`);
    }
  };

  // Open rename modal
  const handleStartRename = (asset: VNAssetItem) => {
    if (asset.isProtected || asset.origin === 'system') return;
    setRenamingAsset(asset);
  };

  // Filtered Assets logic
  const filteredAssets = allAssets.filter((asset) => {
    if (initialFilterType && asset.type !== initialFilterType) return false;
    if (activeTypeTab !== 'all' && asset.type !== activeTypeTab) return false;

    if (activeOriginFilter === 'system' && asset.origin !== 'system') return false;
    if (activeOriginFilter === 'local' && (asset.origin === 'system' || asset.url.startsWith('http://') || asset.url.startsWith('https://'))) return false;
    if (activeOriginFilter === 'web' && (!asset.url.startsWith('http://') && !asset.url.startsWith('https://'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(q);
      const matchCat = asset.category?.toLowerCase().includes(q);
      const matchDesc = asset.description?.toLowerCase().includes(q);
      const matchTags = asset.tags?.some((t) => t.toLowerCase().includes(q));
      return matchName || matchCat || matchDesc || matchTags;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="w-full max-w-6xl max-h-[88vh] sm:max-h-[85vh] vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
        
        {/* 1. GALLERY HEADER */}
        <div className="p-4 vn-glass-header border-b flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center text-[var(--accent)]">
              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-widest text-[var(--text)] uppercase">
                  {onSelectAsset ? 'Select Media Asset' : 'Engine Asset Gallery'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[var(--btn-bg)] text-[var(--accent)] border border-[var(--border)] font-bold">
                  {filteredAssets.length} available
                </span>
                {isLoadingAssets && (
                  <span className="text-[10px] text-yellow-400 animate-pulse font-mono">
                    Syncing disk...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Project Folder: <code className="text-emerald-500 font-mono">public/projects/{projectId}/assets/</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSelectAsset && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 font-mono">
                <GuiIconRenderer icon={GUI_ICONS.general.info} className="w-3.5 h-3.5 text-amber-500" />
                <span>Selection Mode ({initialFilterType || 'General'})</span>
              </div>
            )}

            {/* Upload / Add Asset button */}
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow flex items-center gap-1.5 cursor-pointer ${
                showUploadForm
                  ? 'bg-emerald-700 text-white border border-emerald-400'
                  : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-emerald-600 dark:text-emerald-300'
              }`}
              title="Add a web link or upload a file from PC"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-emerald-500" />
              <span>{showUploadForm ? 'Close Upload' : 'Upload / Add Asset'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] px-2 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] rounded-xl border border-[var(--border)] cursor-pointer flex items-center justify-center transition-colors"
              title="Close gallery"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. UPLOAD MODAL */}
        <AssetUploadModal
          isOpen={showUploadForm}
          onClose={() => setShowUploadForm(false)}
          projectId={projectId}
          projectName={projectName}
          initialFilterType={initialFilterType}
          onSuccess={() => fetchProjectAssets(true)}
          notify={notify}
        />

        {/* 3. RENAME MODAL */}
        <AssetRenameModal
          asset={renamingAsset}
          projectId={projectId}
          onClose={() => setRenamingAsset(null)}
          onSuccess={() => fetchProjectAssets(true)}
          notify={notify}
        />

        {/* 4. TOOLBAR: SEARCH AND FILTERS */}
        <div className="p-3 bg-[var(--well-bg)] border-b border-[var(--border)] backdrop-blur-md space-y-2 shrink-0">
          <div className="flex flex-col sm:row items-center justify-between gap-2">
            
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by name, category, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-xs text-[var(--muted2)] hover:text-[var(--text)] cursor-pointer"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Origin Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold">Source:</span>
              <button
                type="button"
                onClick={() => setActiveOriginFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeOriginFilter === 'all'
                    ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                }`}
              >
                All ({allAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveOriginFilter('system')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeOriginFilter === 'system'
                    ? 'bg-sky-500/25 border-sky-500 text-sky-800 dark:text-sky-200 shadow-sm'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-sky-600 dark:text-sky-400 hover:bg-[var(--btn-hover-bg)]'
                }`}
                title="Engine system assets (protected)"
              >
                <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-3 h-3 text-sky-400" />
                <span>System ({SYSTEM_ASSETS.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOriginFilter('local')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeOriginFilter === 'local'
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-emerald-600 dark:text-emerald-400 hover:bg-[var(--btn-hover-bg)]'
                }`}
                title="Physical files stored in project assets folder"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3 h-3 text-emerald-400" />
                <span>Local ({projectAssets.filter(a => !a.url.startsWith('http://') && !a.url.startsWith('https://')).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOriginFilter('web')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeOriginFilter === 'web'
                    ? 'bg-cyan-500/25 border-cyan-500 text-cyan-800 dark:text-cyan-200 shadow-sm'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-cyan-600 dark:text-cyan-400 hover:bg-[var(--btn-hover-bg)]'
                }`}
                title="Indexed external web links"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.link} size={11} className="text-cyan-400" />
                <span>Web Links ({projectAssets.filter(a => a.url.startsWith('http://') || a.url.startsWith('https://')).length})</span>
              </button>
            </div>
          </div>

          {/* Type Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {(initialFilterType
              ? [
                  initialFilterType === 'sfx'
                    ? { id: 'sfx', label: 'SFX (Sound Effects Only)', icon: GUI_ICONS.media.volume }
                    : initialFilterType === 'bgm'
                    ? { id: 'bgm', label: 'BGM (Music & Ambient Loops)', icon: GUI_ICONS.media.volume }
                    : initialFilterType === 'voice'
                    ? { id: 'voice', label: 'Voices', icon: GUI_ICONS.general.profile }
                    : initialFilterType === 'background'
                    ? { id: 'background', label: 'Scene Backgrounds', icon: GUI_ICONS.general.image }
                    : initialFilterType === 'character'
                    ? { id: 'character', label: 'Character Sprites', icon: GUI_ICONS.general.profile }
                    : initialFilterType === 'font'
                    ? { id: 'font', label: 'Typography & Fonts', icon: GUI_ICONS.general.texts }
                    : initialFilterType === 'fx'
                    ? { id: 'fx', label: 'Screen FX (Camera & Atmosphere)', icon: GUI_ICONS.action.sparkles }
                    : initialFilterType === 'text_effect'
                    ? { id: 'text_effect', label: 'Text Effects (Typography Animations)', icon: GUI_ICONS.general.texts }
                    : initialFilterType === 'cursor'
                    ? { id: 'cursor', label: 'In-Game Cursors (Pointers)', icon: GUI_ICONS.action.target }
                    : initialFilterType === 'transition'
                    ? { id: 'transition', label: 'Scene Transitions', icon: GUI_ICONS.state.play }
                    : { id: 'icon', label: 'GUI Icons', icon: GUI_ICONS.asset.box },
                ]
              : [
                  { id: 'all', label: 'All', icon: undefined },
                  { id: 'sfx', label: 'SFX', icon: GUI_ICONS.media.volume },
                  { id: 'bgm', label: 'BGM', icon: GUI_ICONS.media.volume },
                  { id: 'voice', label: 'Voices', icon: GUI_ICONS.general.profile },
                  { id: 'background', label: 'Backgrounds', icon: GUI_ICONS.general.image },
                  { id: 'character', label: 'Characters', icon: GUI_ICONS.general.profile },
                  { id: 'icon', label: 'Icons', icon: GUI_ICONS.asset.box },
                  { id: 'font', label: 'Fonts', icon: GUI_ICONS.general.texts },
                  { id: 'fx', label: 'Screen FX', icon: GUI_ICONS.action.sparkles },
                  { id: 'text_effect', label: 'Text Effects', icon: GUI_ICONS.general.texts },
                  { id: 'cursor', label: 'Cursors', icon: GUI_ICONS.action.target },
                  { id: 'transition', label: 'Transitions', icon: GUI_ICONS.state.play },
                ]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTypeTab(tab.id as any)}
                className={`px-3 py-1 rounded-xl font-medium text-[11px] whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeTypeTab === tab.id
                    ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] font-bold shadow-sm ring-1 ring-[var(--accent)]/40'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                }`}
              >
                {tab.icon && <GuiIconRenderer icon={tab.icon} size={11} className="shrink-0" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTypeTab === 'font' ? (
            <FontShowcaseTab
              story={story}
              searchQuery={searchQuery}
              customFontSample={customFontSample}
              setCustomFontSample={setCustomFontSample}
              onSelectAsset={onSelectAsset}
              onUpdateStory={onUpdateStory}
              onClose={onClose}
              notify={notify}
            />
          ) : activeTypeTab === 'fx' ? (
            <ScreenFxShowcaseTab
              searchQuery={searchQuery}
              previewBackgroundUrl={previewBackgroundUrl}
              onSelectAsset={onSelectAsset}
              onClose={onClose}
            />
          ) : activeTypeTab === 'text_effect' ? (
            <TextEffectShowcaseTab
              searchQuery={searchQuery}
              customFontSample={customFontSample}
              setCustomFontSample={setCustomFontSample}
              onSelectAsset={onSelectAsset}
              onClose={onClose}
            />
          ) : activeTypeTab === 'cursor' ? (
            <CursorShowcaseTab
              searchQuery={searchQuery}
              onSelectAsset={onSelectAsset}
              onClose={onClose}
            />
          ) : activeTypeTab === 'transition' ? (
            <TransitionShowcaseTab
              searchQuery={searchQuery}
              previewBackgroundUrl={previewBackgroundUrl}
              onSelectAsset={onSelectAsset}
              onClose={onClose}
            />
          ) : filteredAssets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-12 h-12 text-[var(--muted2)]" />
              <div className="text-[var(--muted)] font-bold text-sm">No assets found matching these filters</div>
              <p className="text-xs text-[var(--muted2)] max-w-md">
                Try another search query or click <strong className="text-emerald-500">Upload / Add Asset</strong> to add files to the project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => {
                const isPlaying = playingAssetId === asset.id;
                const isSystem = asset.origin === 'system' || asset.isProtected;
                const isWeb = asset.url.startsWith('http://') || asset.url.startsWith('https://');
                const isAudio = asset.type === 'sfx' || asset.type === 'bgm' || asset.type === 'voice';
                const isImage = asset.type === 'background' || asset.type === 'character' || asset.type === 'icon';

                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      if (onSelectAsset && !renamingAsset) {
                        onSelectAsset(asset);
                        onClose();
                        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                      }
                    }}
                    className={`rounded-2xl border p-3 flex flex-col justify-between gap-2.5 transition-all bg-[var(--card-bg)] backdrop-blur-md ${
                      onSelectAsset ? 'cursor-pointer hover:border-[var(--accent)] hover:ring-1 hover:ring-[var(--accent)]/50' : ''
                    } ${
                      isSystem
                        ? 'border-[var(--border)] hover:border-sky-500/80 shadow-sm'
                        : isWeb
                        ? 'border-[var(--border)] hover:border-cyan-500/80 shadow-sm'
                        : 'border-[var(--border)] hover:border-emerald-500/80 shadow-sm'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-bold text-xs text-[var(--text)] line-clamp-1" title={asset.name}>
                          {asset.name}
                        </span>

                        {isSystem ? (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-tighter bg-sky-500/20 border border-sky-500/40 text-sky-700 dark:text-sky-300 shrink-0 flex items-center gap-1"
                            title="Engine base asset (protected from deletion)"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-2.5 h-2.5 text-sky-500" />
                            <span>SYSTEM</span>
                          </span>
                        ) : isWeb ? (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-tighter bg-cyan-500/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 shrink-0 flex items-center gap-1"
                            title={`Indexed Web URL: ${asset.url}`}
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.link} size={9} className="text-cyan-400" />
                            <span>WEB LINK</span>
                          </span>
                        ) : (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-tighter bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shrink-0 flex items-center gap-1"
                            title={`File in: public/projects/${projectId}/assets/${asset.filePath || ''}`}
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-2.5 h-2.5 text-emerald-500" />
                            <span>PROJECT</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted2)]">
                        <span className="uppercase font-mono font-bold text-[var(--muted2)]">[{asset.type}]</span>
                        {asset.category && <span className="truncate text-[var(--muted)]">&bull; {asset.category}</span>}
                      </div>
                    </div>

                    {/* Central Preview */}
                    <div className="h-28 rounded-xl overflow-hidden bg-[var(--well-bg)] border border-[var(--border)] flex items-center justify-center relative group">
                      {isAudio && (
                        <div className="flex flex-col items-center justify-center gap-2 p-2 w-full text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAudio(asset);
                            }}
                            className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-transform shadow-lg cursor-pointer ${
                              isPlaying
                                ? 'bg-amber-500 text-black scale-110 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse'
                                : 'bg-[var(--btn-bg)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-white border border-[var(--border)] hover:scale-105'
                            }`}
                            title={isPlaying ? 'Pause audio' : 'Play audio'}
                          >
                            {isPlaying ? (
                              <GuiIconRenderer icon={GUI_ICONS.state.pause} className="w-4 h-4" />
                            ) : (
                              <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-4 h-4" />
                            )}
                          </button>
                          <span className="text-[10px] text-[var(--muted)] font-mono">
                            {isPlaying ? 'Playing...' : 'Click to preview'}
                          </span>
                        </div>
                      )}

                      {isImage && (
                        <div
                          onClick={(e) => {
                            if (!onSelectAsset) {
                              e.stopPropagation();
                              setPreviewImageUrl(asset.url);
                            }
                          }}
                          className="w-full h-full relative cursor-pointer"
                          title={onSelectAsset ? 'Click to select' : 'Click for full screen preview'}
                        >
                          {asset.type === 'icon' ? (
                            <div className="w-full h-full flex items-center justify-center p-4">
                              <GuiIconRenderer icon={asset.url} className="w-12 h-12 object-contain text-[var(--text)] transition-transform group-hover:scale-110" />
                            </div>
                          ) : (
                            <img
                              src={asset.url}
                              alt={asset.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-1 backdrop-blur-[2px]">
                            <GuiIconRenderer icon={GUI_ICONS.action.search} className="w-3.5 h-3.5" />
                            <span>{onSelectAsset ? 'Select' : 'Zoom'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-1">
                      {onSelectAsset ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAsset(asset);
                            onClose();
                            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                          }}
                          className="flex-1 py-1 px-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-xl text-[11px] uppercase tracking-wider cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5" />
                          <span>Select</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(asset.url);
                            notify('Path copied to clipboard');
                            playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                          }}
                          className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1.5 cursor-pointer bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] px-2.5 py-1 rounded-xl border border-[var(--border)] transition-colors shadow-sm"
                          title="Copy asset path"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3 text-[var(--accent)]" />
                          <span>Copy Path</span>
                        </button>
                      )}

                      {/* Management Tools (Rename & Delete) for project assets */}
                      {isSystem ? (
                        <span
                          className="text-[var(--muted2)] text-[10px] flex items-center gap-1 cursor-not-allowed select-none px-1"
                          title="This asset is part of the engine core and cannot be edited or deleted."
                        >
                          <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-3.5 h-3.5 text-[var(--muted2)]" />
                          <span className="hidden sm:inline">Protected</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {/* Rename Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(asset);
                            }}
                            className="text-amber-500 hover:text-amber-400 text-xs hover:bg-amber-500/15 p-1 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-amber-500/30"
                            title="Rename this file on disk"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUserAsset(asset);
                            }}
                            className="text-red-500 hover:text-red-400 text-xs hover:bg-red-500/15 p-1 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-red-500/30"
                            title="Delete this file from the project folder"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. IMAGE PREVIEW ZOOM MODAL */}
        {previewImageUrl && (
          <div
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImageUrl(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
              <img
                src={previewImageUrl}
                alt="Zoom"
                className="max-w-full max-h-[85vh] object-contain rounded-lg border border-gray-700 shadow-2xl"
              />
              <span className="text-xs text-gray-400 mt-2 font-mono">
                Click anywhere to close
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
