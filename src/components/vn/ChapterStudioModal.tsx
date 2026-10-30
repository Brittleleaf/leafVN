"use client";
import React, { useState, useMemo } from 'react';
import {
  VNStory,
  VNChapter,
  VNScene,
  VNLoadingScreenConfig,
  VNChapterScreenConfig,
  VNStaticScreenConfig,
  VNScreenFxType,
} from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { fileToBase64 } from '@/lib/vn/engineUtils';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import AssetStudioModal from './AssetStudioModal';
import StaticScreenView, {
  DEFAULT_CHAPTER_INTRO_CONFIG,
  DEFAULT_CHAPTER_END_CONFIG,
} from './StaticScreenView';

interface ChapterStudioModalProps {
  story: VNStory;
  currentChapterId: string;
  onSelectChapter: (chapterId: string) => void;
  onUpdateStory: (updatedStory: VNStory) => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export const LORE_TIP_PRESETS = [
  'Every alternate ending reveals a piece of the lost file.',
  'Decisions made in high-security chambers cannot be reversed.',
  'Quantum paint reacts to unauthorized frequencies.',
  'Contingency protocols activate if declassification exceeds the time limit.',
  'Not all characters reveal their true motives upon the first encounter.',
  'Checking every corner of the scene can unlock hidden paths.',
];

export const STATIC_FX_PRESETS: { id: VNScreenFxType; name: string }[] = [
  { id: 'none', name: 'None (Standard)' },
  { id: 'cinema_grain', name: 'Cinema Grain' },
  { id: 'vignette', name: 'Vignette' },
  { id: 'cctv_monitor', name: 'CCTV Monitor' },
  { id: 'crt_scanline', name: 'CRT Scanline' },
  { id: 'glitch', name: 'Digital Glitch' },
  { id: 'matrix', name: 'Binary Matrix' },
  { id: 'horror_static', name: 'Horror Static' },
];

export const STATIC_ANIMATION_PRESETS = [
  { id: 'glitch', name: 'Glitch' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'glow', name: 'Glow' },
  { id: 'fade_in', name: 'Fade In' },
  { id: 'typewriter', name: 'Typewriter' },
  { id: 'shimmer', name: 'Shimmer' },
  { id: 'neon', name: 'Neon' },
  { id: 'blood', name: 'Blood Drip' },
  { id: 'none', name: 'Static (None)' },
];

export default function ChapterStudioModal({
  story,
  currentChapterId,
  onSelectChapter,
  onUpdateStory,
  onClose,
  notify = () => {},
}: ChapterStudioModalProps) {
  const [selectedChId, setSelectedChId] = useState<string>(
    currentChapterId || story.chapters[0]?.id || ''
  );
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'identity' | 'intro_screen' | 'loading' | 'end_screen' | 'scenes' | 'atmosphere'
  >('identity');
  
  // State for live full-screen previews
  const [showLiveLoadingPreview, setShowLiveLoadingPreview] = useState<boolean>(false);
  const [showLiveIntroPreview, setShowLiveIntroPreview] = useState<boolean>(false);
  const [showLiveEndPreview, setShowLiveEndPreview] = useState<boolean>(false);

  // Asset picker state
  const [showAssetPickerFor, setShowAssetPickerFor] = useState<'loading_bg' | 'intro_bg' | 'end_bg' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const selectedChapter = story.chapters.find((c) => c.id === selectedChId) || story.chapters[0];

  // Helper to update current chapter
  const handleUpdateCurrentChapter = (patch: Partial<VNChapter>) => {
    if (!selectedChapter) return;
    const updatedChapters = story.chapters.map((c) =>
      c.id === selectedChapter.id ? { ...c, ...patch } : c
    );
    onUpdateStory({ ...story, chapters: updatedChapters });
  };

  // Helper to update loading screen configuration
  const handleUpdateLoadingConfig = (patch: Partial<VNLoadingScreenConfig>) => {
    if (!selectedChapter) return;
    const currentLoading = selectedChapter.loadingScreen || {
      enabled: false,
      title: selectedChapter.title,
      durationMs: 2500,
    };
    handleUpdateCurrentChapter({
      loadingScreen: { ...currentLoading, ...patch },
    });
  };

  // Helper to update episode start (intro) screen configuration
  const handleUpdateIntroConfig = (patch: Partial<VNChapterScreenConfig>) => {
    if (!selectedChapter) return;
    const currentIntro: VNChapterScreenConfig = selectedChapter.introScreen || {
      enabled: false,
      staticConfig: {
        ...DEFAULT_CHAPTER_INTRO_CONFIG,
        title: selectedChapter.title ? `EPISODE: ${selectedChapter.title.toUpperCase()}` : `EPISODE #${selectedChapter.number}`,
        subtitle: selectedChapter.summary || 'Prepare to enter the scenario.',
      },
    };
    handleUpdateCurrentChapter({
      introScreen: { ...currentIntro, ...patch },
    });
  };

  const handleUpdateIntroStaticConfig = (patch: Partial<VNStaticScreenConfig>) => {
    if (!selectedChapter) return;
    const currentIntro: VNChapterScreenConfig = selectedChapter.introScreen || {
      enabled: true,
      staticConfig: {
        ...DEFAULT_CHAPTER_INTRO_CONFIG,
        title: selectedChapter.title ? `EPISODE: ${selectedChapter.title.toUpperCase()}` : `EPISODE #${selectedChapter.number}`,
        subtitle: selectedChapter.summary || 'Prepare to enter the scenario.',
      },
    };
    const currentStatic = currentIntro.staticConfig || DEFAULT_CHAPTER_INTRO_CONFIG;
    handleUpdateIntroConfig({
      staticConfig: { ...currentStatic, ...patch },
    });
  };

  // Helper to update episode end screen configuration
  const handleUpdateEndConfig = (patch: Partial<VNChapterScreenConfig>) => {
    if (!selectedChapter) return;
    const currentEnd: VNChapterScreenConfig = selectedChapter.endScreen || {
      enabled: false,
      staticConfig: {
        ...DEFAULT_CHAPTER_END_CONFIG,
        title: `END OF EPISODE #${selectedChapter.number}`,
        subtitle: 'Episode completed successfully.',
      },
    };
    handleUpdateCurrentChapter({
      endScreen: { ...currentEnd, ...patch },
    });
  };

  const handleUpdateEndStaticConfig = (patch: Partial<VNStaticScreenConfig>) => {
    if (!selectedChapter) return;
    const currentEnd: VNChapterScreenConfig = selectedChapter.endScreen || {
      enabled: true,
      staticConfig: {
        ...DEFAULT_CHAPTER_END_CONFIG,
        title: `END OF EPISODE #${selectedChapter.number}`,
        subtitle: 'Episode completed successfully.',
      },
    };
    const currentStatic = currentEnd.staticConfig || DEFAULT_CHAPTER_END_CONFIG;
    handleUpdateEndConfig({
      staticConfig: { ...currentStatic, ...patch },
    });
  };

  // Collect all static scenes in the story to offer as linkable targets
  const allStaticScenes = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    (story.scenarios || []).forEach((sc) => {
      if (sc.sceneType === 'event' && sc.eventSubtype === 'static') {
        list.push({ id: sc.id, name: sc.name || sc.id });
      }
    });
    story.chapters.forEach((ch) => {
      ch.scenes.forEach((sc) => {
        if (sc.sceneType === 'event' && sc.eventSubtype === 'static' && !list.some((item) => item.id === sc.id)) {
          list.push({ id: sc.id, name: `${sc.name || sc.id} (Ch. ${ch.number})` });
        }
      });
    });
    return list;
  }, [story.scenarios, story.chapters]);

  // Synthetic scenes for live preview
  const previewIntroScene = useMemo<VNScene>(() => {
    const intro = selectedChapter?.introScreen;
    if (intro?.sceneId) {
      const found =
        (story.scenarios || []).find((s) => s.id === intro.sceneId) ||
        selectedChapter?.scenes.find((s) => s.id === intro.sceneId);
      if (found) return found;
    }
    const cfg = intro?.staticConfig || {
      ...DEFAULT_CHAPTER_INTRO_CONFIG,
      title: selectedChapter?.title ? `EPISODE: ${selectedChapter.title.toUpperCase()}` : `EPISODE #${selectedChapter?.number || 1}`,
      subtitle: selectedChapter?.summary || 'Prepare to enter the scenario.',
    };
    return {
      id: 'preview-intro',
      name: cfg.title || 'Episode Intro',
      backgroundUrl: intro?.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      sceneType: 'event',
      eventSubtype: 'static',
      staticScreenConfig: cfg,
      timeline: [],
    };
  }, [selectedChapter, story.scenarios]);

  const previewEndScene = useMemo<VNScene>(() => {
    const end = selectedChapter?.endScreen;
    if (end?.sceneId) {
      const found =
        (story.scenarios || []).find((s) => s.id === end.sceneId) ||
        selectedChapter?.scenes.find((s) => s.id === end.sceneId);
      if (found) return found;
    }
    const cfg = end?.staticConfig || {
      ...DEFAULT_CHAPTER_END_CONFIG,
      title: `END OF EPISODE #${selectedChapter?.number || 1}`,
      subtitle: 'Episode completed successfully.',
    };
    return {
      id: 'preview-end',
      name: cfg.title || 'Episode End',
      backgroundUrl: end?.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      sceneType: 'event',
      eventSubtype: 'static',
      staticScreenConfig: cfg,
      timeline: [],
    };
  }, [selectedChapter, story.scenarios]);

  // Create new chapter
  const handleCreateChapter = () => {
    const newNumber = story.chapters.length + 1;
    const newId = `chapter-${Date.now()}`;
    const initialSceneId = `scene-${Date.now()}-1`;

    const newChapter: VNChapter = {
      id: newId,
      number: newNumber,
      title: `Chapter #${newNumber}`,
      summary: '',
      startSceneId: initialSceneId,
      loadingScreen: {
        enabled: false,
        title: `Chapter #${newNumber}`,
        subtitle: '',
        loreTip: '',
        bgImageUrl: '',
        durationMs: 2000,
      },
      introScreen: {
        enabled: false,
        staticConfig: {
          ...DEFAULT_CHAPTER_INTRO_CONFIG,
          title: `EPISODE ${newNumber}`,
          subtitle: 'The journey begins.',
        },
      },
      endScreen: {
        enabled: false,
        staticConfig: {
          ...DEFAULT_CHAPTER_END_CONFIG,
          title: `END OF EPISODE ${newNumber}`,
          subtitle: 'Episode completed.',
        },
      },
      scenes: [
        {
          id: initialSceneId,
          name: 'Scene 1',
          backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          timeline: [
            {
              id: `ev-${Date.now()}`,
              type: 'dialogue',
              characterId: story.characters[0]?.id,
              text: '',
            },
          ],
        },
      ],
    };

    const updatedChapters = [...story.chapters, newChapter];
    const existingScenarios = story.scenarios || [];
    const updatedScenarios = [...existingScenarios, ...newChapter.scenes];
    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    setSelectedChId(newId);
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify(`Chapter #${newNumber} created successfully`);
  };

  // Duplicate chapter
  const handleDuplicateChapter = (chToClone: VNChapter) => {
    const newNumber = story.chapters.length + 1;
    const newChId = `chapter-${Date.now()}`;

    // 1. Map old scene IDs to new unique scene IDs
    const sceneIdMap = new Map<string, string>();
    chToClone.scenes.forEach((sc, scIdx) => {
      sceneIdMap.set(sc.id, `scene-${Date.now()}-${scIdx}`);
    });

    // 2. Clone scenes and remap internal references
    const clonedScenes: VNScene[] = chToClone.scenes.map((sc, scIdx) => {
      const newScId = sceneIdMap.get(sc.id) || `scene-${Date.now()}-${scIdx}`;
      return {
        ...sc,
        id: newScId,
        name: `${sc.name} (Copy)`,
        timeline: (sc.timeline || []).map((ev, evIdx) => {
          const modEv = { ...ev, id: `ev-${Date.now()}-${evIdx}` };
          if (modEv.type === 'choice' && modEv.options) {
            modEv.options = modEv.options.map((opt) => ({
              ...opt,
              targetSceneId: opt.targetSceneId && sceneIdMap.has(opt.targetSceneId)
                ? sceneIdMap.get(opt.targetSceneId)
                : opt.targetSceneId,
            }));
          }
          return modEv;
        }),
        hotspots: sc.hotspots?.map((hs, hsIdx) => ({
          ...hs,
          id: `hs-${Date.now()}-${hsIdx}`,
          targetSceneId: hs.targetSceneId && sceneIdMap.has(hs.targetSceneId)
            ? sceneIdMap.get(hs.targetSceneId)
            : hs.targetSceneId,
        })),
      };
    });

    const clonedChapter: VNChapter = {
      ...chToClone,
      id: newChId,
      number: newNumber,
      title: `${chToClone.title} (Copy)`,
      startSceneId: (chToClone.startSceneId && sceneIdMap.get(chToClone.startSceneId)) || clonedScenes[0]?.id || '',
      scenes: clonedScenes,
      loadingScreen: { ...chToClone.loadingScreen },
      introScreen: chToClone.introScreen ? { ...chToClone.introScreen } : undefined,
      endScreen: chToClone.endScreen ? { ...chToClone.endScreen } : undefined,
    };

    const updatedChapters = [...story.chapters, clonedChapter];
    const existingScenarios = story.scenarios || [];
    const updatedScenarios = [...existingScenarios, ...clonedScenes];
    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    setSelectedChId(newChId);
    playSfx('/assets/sfx/start after click intro.mp3', false, 0.3);
    notify(`Chapter "${chToClone.title}" duplicated with ${clonedScenes.length} scenes`);
  };

  // Delete chapter
  const handleDeleteChapter = (chId: string) => {
    if (story.chapters.length <= 1) {
      notify('You cannot delete the only chapter in the story');
      return;
    }

    const deletedChapter = story.chapters.find((c) => c.id === chId);
    const deletedSceneIds = new Set(deletedChapter?.scenes.map((s) => s.id) || []);
    const updatedScenarios = (story.scenarios || []).filter((s) => !deletedSceneIds.has(s.id));

    const updatedChapters = story.chapters
      .filter((c) => c.id !== chId)
      .map((c, idx) => ({ ...c, number: idx + 1 }));

    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    const nextChapterId = updatedChapters[0]?.id || '';
    if (selectedChId === chId) {
      setSelectedChId(nextChapterId);
    }
    if (currentChapterId === chId || selectedChId === chId) {
      onSelectChapter(nextChapterId);
    }
    setDeleteConfirmId(null);
    playSfx('/assets/sfx/corrupt file.mp3', false, 0.3);
    notify('Chapter deleted from project');
  };

  // Move chapter up or down
  const handleMoveChapter = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= story.chapters.length) return;

    const newChapters = [...story.chapters];
    const [moved] = newChapters.splice(index, 1);
    newChapters.splice(targetIndex, 0, moved);

    // Reasignar números secuenciales
    const renumbered = newChapters.map((c, idx) => ({ ...c, number: idx + 1 }));
    onUpdateStory({ ...story, chapters: renumbered });
    playSfx('/assets/sfx/flip page.mp3', false, 0.3);
  };

  // Filtrado de capítulos
  const filteredChapters = story.chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.summary && c.summary.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Cálculos estadísticos
  const totalScenesAcrossStory = story.chapters.reduce((acc, c) => acc + c.scenes.length, 0);
  const totalEventsInCurrentChapter = selectedChapter?.scenes.reduce(
    (acc, s) => acc + (s.timeline?.length || 0),
    0
  ) || 0;
  const totalHotspotsInCurrentChapter = selectedChapter?.scenes.reduce(
    (acc, s) => acc + (s.hotspots?.length || 0),
    0
  ) || 0;

  // Upload custom background for loading screen
  const handleUploadLoadingBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      handleUpdateLoadingConfig({ bgImageUrl: b64 });
      notify('Loading screen background updated');
    } catch (err) {
      notify('Error processing image');
    }
  };

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-3 md:p-6 flex items-center justify-center animate-fade-in font-sans">
      <div className="max-w-6xl w-full max-h-[88vh] sm:max-h-[85vh] h-full vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
        
        {/* 1. MAIN HEADER */}
        <div className="h-14 border-b vn-glass-header px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-6 h-6 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm md:text-base font-bold text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
                <span>CHAPTER STUDIO & MANAGER</span>
                <span className="text-xs bg-[var(--accent-surface)] border border-[var(--border2)] text-[var(--accent)] px-2 py-0.5 rounded font-mono font-bold">
                  {story.chapters.length} Chapters
                </span>
                <span className="text-xs text-[var(--muted2)] font-mono hidden sm:inline">
                  • {totalScenesAcrossStory} Scenes in story
                </span>
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Organize episodic structure, cinematic loading screens, and starting scenes for your story.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateChapter}
              className="px-3 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-md text-xs uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <span>+</span>
              <span>New Chapter</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. TWO-COLUMN LAYOUT */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: CHAPTER LIST & REORDERING */}
          <div className="w-80 md:w-96 border-r border-[var(--border)] bg-[var(--well-bg)] flex flex-col shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--header-bg)] shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chapters..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)]"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Chapter Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredChapters.map((ch, idx) => {
                const isSelected = ch.id === selectedChapter?.id;
                const totalScenes = ch.scenes?.length || 0;
                const totalLines = ch.scenes?.reduce((a, s) => a + (s.timeline?.length || 0), 0) || 0;
                const hasLoading = ch.loadingScreen?.enabled;

                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      setSelectedChId(ch.id);
                      playSfx('/assets/sfx/click intro.mp3', false, 0.1);
                    }}
                    className={`p-3 rounded-md border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[var(--accent-surface)] border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/40'
                        : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border2)] hover:bg-[var(--btn-hover-bg)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[var(--btn-bg)] border border-[var(--border)] rounded text-[11px] font-bold text-[var(--accent)] font-mono">
                          #{ch.number}
                        </span>
                        <h4 className="text-xs font-bold text-[var(--text)] truncate max-w-[170px]" title={ch.title}>
                          {ch.title}
                        </h4>
                      </div>

                      {/* Quick Actions: Up, Down, Duplicate, Delete */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveChapter(idx, 'up');
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-[10px] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] disabled:opacity-20 cursor-pointer"
                          title="Move up in narrative order"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={idx === story.chapters.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveChapter(idx, 'down');
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-[10px] bg-gray-900 hover:bg-gray-800 text-gray-300 disabled:opacity-20 cursor-pointer"
                          title="Move down in narrative order"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateChapter(ch);
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-[10px] bg-gray-900 hover:bg-red-950 text-gray-300 hover:text-white cursor-pointer"
                          title="Duplicate chapter and all its scenes"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={story.chapters.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(ch.id);
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded text-[10px] bg-gray-900 hover:bg-red-900 text-red-400 hover:text-white disabled:opacity-20 cursor-pointer"
                          title="Delete this chapter"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {ch.summary && (
                      <p className="text-[10px] text-gray-400 line-clamp-1 italic mb-2">
                        {ch.summary}
                      </p>
                    )}

                    {/* Metadata and Badges */}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-gray-800">
                        <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3 h-3 text-gray-400" />
                        <span>{totalScenes} scenes</span>
                      </span>

                      <span className="flex items-center gap-1.5 bg-[var(--well-bg)] px-2 py-0.5 rounded border border-[var(--border)]">
                        <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3 text-[var(--muted)]" />
                        <span>{totalLines} lines</span>
                      </span>

                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                          ch.introScreen?.enabled
                            ? 'bg-sky-950/40 border-sky-800/80 text-sky-400'
                            : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted2)]'
                        }`}
                        title="Episode Start Screen (Intro)"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.start} className="w-2.5 h-2.5" />
                        <span>Intro</span>
                      </span>

                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                          hasLoading
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                            : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted2)]'
                        }`}
                        title="Cinematic Loading Screen"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-2.5 h-2.5" />
                        <span>Load</span>
                      </span>

                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                          ch.endScreen?.enabled
                            ? 'bg-purple-950/40 border-purple-800/80 text-purple-400'
                            : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted2)]'
                        }`}
                        title="Episode End Screen"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.end} className="w-2.5 h-2.5" />
                        <span>End</span>
                      </span>
                    </div>

                    {/* Delete Confirmation Box */}
                    {deleteConfirmId === ch.id && (
                      <div className="mt-2 p-2 bg-red-950/80 border border-red-700 rounded-lg text-[11px] space-y-1.5 animate-fade-in">
                        <p className="text-red-200 font-bold">Delete #{ch.number} "{ch.title}"?</p>
                        <p className="text-red-300 text-[10px]">All its {totalScenes} scenes will be permanently deleted.</p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(ch.id);
                            }}
                            className="px-2 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Edit chapter on canvas button */}
            {selectedChapter && (
              <div className="p-3 border-t border-[var(--border)] bg-[var(--header-bg)] shrink-0">
                <button
                  onClick={() => {
                    onSelectChapter(selectedChapter.id);
                    onClose();
                    playSfx('/assets/sfx/start after click intro.mp3', false, 0.3);
                    notify(`Editing on canvas: "${selectedChapter.title}"`);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3.5 h-3.5 text-[#0F0503]" />
                  <span>Edit this Chapter on Screen</span>
                </button>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: INSPECTOR DEL CAPÍTULO SELECCIONADO */}
          {selectedChapter ? (
            <div className="flex-1 flex flex-col bg-[var(--panel)] overflow-hidden">
              
              {/* Inspector Tab Bar */}
              <div className="h-11 border-b border-[var(--border)] bg-[var(--header-bg)] px-4 flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('identity')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'identity'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
                  <span>Identity & Structure</span>
                </button>

                <button
                  onClick={() => setActiveTab('intro_screen')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'intro_screen'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.start} className="w-3.5 h-3.5 text-sky-400" />
                  <span>Start Screen (Intro)</span>
                  {selectedChapter.introScreen?.enabled && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('loading')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'loading'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Loading Screen</span>
                  {selectedChapter.loadingScreen?.enabled && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('end_screen')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'end_screen'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.end} className="w-3.5 h-3.5 text-purple-400" />
                  <span>End Screen (Outro)</span>
                  {selectedChapter.endScreen?.enabled && (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('scenes')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'scenes'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5" />
                  <span>Scenarios ({selectedChapter.scenes?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('atmosphere')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'atmosphere'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  <GuiIconRenderer icon={GUI_ICONS.action.soundOn} className="w-3.5 h-3.5" />
                  <span>Atmosphere & Audio</span>
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* TAB 1: IDENTITY & STRUCTURE */}
                {activeTab === 'identity' && (
                  <div className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                          Number (#)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={selectedChapter.number}
                          onChange={(e) => handleUpdateCurrentChapter({ number: Number(e.target.value) || 1 })}
                          className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--accent)] font-mono font-bold outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                          Chapter Title
                        </label>
                        <input
                          type="text"
                          value={selectedChapter.title}
                          onChange={(e) => handleUpdateCurrentChapter({ title: e.target.value })}
                          placeholder="Enter chapter title here..."
                          className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] font-bold outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                        Synopsis / Narrative Summary (Production Notes)
                      </label>
                      <textarea
                        rows={3}
                        value={selectedChapter.summary || ''}
                        onChange={(e) => handleUpdateCurrentChapter({ summary: e.target.value })}
                        placeholder="Enter chapter synopsis here..."
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] resize-none transition-colors"
                      />
                    </div>

                    {/* Starting scene of the chapter */}
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span>Starting Scene of Chapter</span>
                          </h4>
                          <p className="text-[11px] text-[var(--muted)]">
                            Exact entry point when beginning or loading this chapter.
                          </p>
                        </div>
                      </div>

                      <select
                        value={selectedChapter.startSceneId || selectedChapter.scenes[0]?.id || ''}
                        onChange={(e) => handleUpdateCurrentChapter({ startSceneId: e.target.value })}
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] cursor-pointer transition-colors"
                      >
                        {selectedChapter.scenes.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name} ({sc.timeline?.length || 0} lines)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Metric cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-md text-center space-y-1 shadow-sm">
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">Scenarios</span>
                        <span className="text-xl font-bold text-[var(--accent)] font-mono">
                          {selectedChapter.scenes?.length || 0}
                        </span>
                      </div>

                      <div className="p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-md text-center space-y-1 shadow-sm">
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">Dialogues / Events</span>
                        <span className="text-xl font-bold text-[var(--text)] font-mono">
                          {totalEventsInCurrentChapter}
                        </span>
                      </div>

                      <div className="p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-md text-center space-y-1 shadow-sm">
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">Action Points</span>
                        <span className="text-xl font-bold text-amber-500 font-mono">
                          {totalHotspotsInCurrentChapter}
                        </span>
                      </div>

                      <div className="p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-md text-center space-y-1 shadow-sm">
                        <span className="text-[10px] text-[var(--muted)] uppercase font-bold block">Approx. Reading</span>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ~{Math.max(1, Math.round(totalEventsInCurrentChapter / 12))} min
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: EPISODE START SCREEN (INTRO) */}
                {activeTab === 'intro_screen' && (
                  <div className="space-y-6 max-w-3xl">
                    {/* Toggle Switch */}
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block flex items-center gap-2">
                          <GuiIconRenderer icon={GUI_ICONS.general.start} className="w-3.5 h-3.5 text-sky-400" />
                          <span>Enable Episode Start Screen (Intro)</span>
                        </span>
                        <p className="text-[11px] text-[var(--muted)]">
                          Displays a stylized title/intro screen with animations, visual effects, and music when launching this episode before entering narrative dialogues.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input
                          type="checkbox"
                          checked={selectedChapter.introScreen?.enabled ?? false}
                          onChange={(e) => handleUpdateIntroConfig({ enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--well-bg)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>

                    {selectedChapter.introScreen?.enabled && (
                      <div className="space-y-5 p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-sm animate-fade-in">
                        
                        {/* Mode Selector: Custom or Linked */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                            Screen Source
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateIntroConfig({ sceneId: undefined })}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                !selectedChapter.introScreen?.sceneId
                                  ? 'bg-[var(--accent-surface)] border-sky-500 shadow-sm'
                                  : 'bg-[var(--well-bg)] border-[var(--border)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)]'
                              }`}
                            >
                              <div className="text-xs font-bold text-[var(--text)]">Design Custom Screen</div>
                              <div className="text-[10px] text-[var(--muted)] mt-0.5">
                                Customize title, subtitle, animations, screen FX, and buttons directly.
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateIntroConfig({ sceneId: allStaticScenes[0]?.id || '' })}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                selectedChapter.introScreen?.sceneId
                                  ? 'bg-[var(--accent-surface)] border-sky-500 shadow-sm'
                                  : 'bg-[var(--well-bg)] border-[var(--border)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)]'
                              }`}
                            >
                              <div className="text-xs font-bold text-[var(--text)]">Link Project Scenario</div>
                              <div className="text-[10px] text-[var(--muted)] mt-0.5">
                                Connect an existing static screen scenario built in the Scene Studio.
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Linked Scenario Selector */}
                        {selectedChapter.introScreen?.sceneId ? (
                          <div className="space-y-2 p-4 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg">
                            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                              Select Linked Static Scenario
                            </label>
                            {allStaticScenes.length > 0 ? (
                              <select
                                value={selectedChapter.introScreen.sceneId}
                                onChange={(e) => handleUpdateIntroConfig({ sceneId: e.target.value })}
                                className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-sky-500 cursor-pointer"
                              >
                                {allStaticScenes.map((sc) => (
                                  <option key={sc.id} value={sc.id}>
                                    {sc.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-amber-400">
                                No static screen scenarios found in this project. Use "Design Custom Screen" instead.
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Custom Screen Designer */
                          <div className="space-y-4">
                            {/* Title & Animation */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Screen Title
                                </label>
                                <input
                                  type="text"
                                  value={selectedChapter.introScreen?.staticConfig?.title || `EPISODE #${selectedChapter.number}`}
                                  onChange={(e) => handleUpdateIntroStaticConfig({ title: e.target.value })}
                                  placeholder="e.g. EPISODE 1: THE AWAKENING"
                                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] font-bold outline-none focus:border-sky-500"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Title Animation
                                </label>
                                <select
                                  value={selectedChapter.introScreen?.staticConfig?.titleAnimation || 'glitch'}
                                  onChange={(e) => handleUpdateIntroStaticConfig({ titleAnimation: e.target.value as any })}
                                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-sky-500 cursor-pointer"
                                >
                                  {STATIC_ANIMATION_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Subtitle */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                Subtitle / Epigraph
                              </label>
                              <textarea
                                rows={2}
                                value={selectedChapter.introScreen?.staticConfig?.subtitle || selectedChapter.summary || ''}
                                onChange={(e) => handleUpdateIntroStaticConfig({ subtitle: e.target.value })}
                                placeholder="Enter narrative intro subtitle or location details..."
                                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-sky-500 resize-none"
                              />
                            </div>

                            {/* Background Image & Screen FX */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Background Image
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={selectedChapter.introScreen?.backgroundUrl || ''}
                                    onChange={(e) => handleUpdateIntroConfig({ backgroundUrl: e.target.value })}
                                    placeholder="Background image URL..."
                                    className="flex-1 min-w-0 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] outline-none focus:border-sky-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowAssetPickerFor('intro_bg')}
                                    className="px-2.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-md cursor-pointer shrink-0 flex items-center gap-1.5"
                                  >
                                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
                                    <span>Gallery</span>
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Atmosphere Screen FX
                                </label>
                                <select
                                  value={selectedChapter.introScreen?.staticConfig?.screenFx || 'cctv_monitor'}
                                  onChange={(e) => handleUpdateIntroStaticConfig({ screenFx: e.target.value as any })}
                                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] outline-none focus:border-sky-500 cursor-pointer"
                                >
                                  {STATIC_FX_PRESETS.map((fx) => (
                                    <option key={fx.id} value={fx.id}>
                                      {fx.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Start Button Label */}
                            <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                Start Button Label
                              </label>
                              <input
                                type="text"
                                value={selectedChapter.introScreen?.staticConfig?.buttons?.[0]?.label || 'START EPISODE'}
                                onChange={(e) => {
                                  const currentButtons = selectedChapter.introScreen?.staticConfig?.buttons || DEFAULT_CHAPTER_INTRO_CONFIG.buttons;
                                  const updatedButtons = currentButtons.map((btn, idx) =>
                                    idx === 0 ? { ...btn, label: e.target.value } : btn
                                  );
                                  handleUpdateIntroStaticConfig({ buttons: updatedButtons });
                                }}
                                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] font-bold outline-none focus:border-sky-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Test live preview button */}
                        <div className="pt-3 border-t border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => setShowLiveIntroPreview(true)}
                            className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:opacity-90 text-white font-bold rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5" />
                            <span>Test Live Preview of Episode Start Screen</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CINEMATIC LOADING SCREEN */}
                {activeTab === 'loading' && (
                  <div className="space-y-6 max-w-2xl">
                    {/* Toggle Switch */}
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block">
                          Enable Cinematic Loading Screen
                        </span>
                        <p className="text-[11px] text-[var(--muted)]">
                          Displays an atmospheric transition with background, title, subtitle, lore quote, and progress bar before the first dialogue.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input
                          type="checkbox"
                          checked={selectedChapter.loadingScreen?.enabled ?? false}
                          onChange={(e) => handleUpdateLoadingConfig({ enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--well-bg)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                      </label>
                    </div>

                    {selectedChapter.loadingScreen?.enabled && (
                      <div className="space-y-4 p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-sm animate-fade-in">
                        {/* Loading title and subtitle */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                            Main Loading Title
                          </label>
                          <input
                            type="text"
                            value={selectedChapter.loadingScreen.title || ''}
                            onChange={(e) => handleUpdateLoadingConfig({ title: e.target.value })}
                            placeholder="Enter loading title here..."
                            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] font-mono font-bold outline-none focus:border-[var(--accent)] transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                            Subtitle / Protocol
                          </label>
                          <input
                            type="text"
                            value={selectedChapter.loadingScreen.subtitle || ''}
                            onChange={(e) => handleUpdateLoadingConfig({ subtitle: e.target.value })}
                            placeholder="Enter loading subtitle here..."
                            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--accent)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                          />
                        </div>

                        {/* Lore quote */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                              Lore Quote / Classified Tip
                            </label>
                            <span className="text-[10px] text-[var(--muted2)] font-mono">Universe clues</span>
                          </div>
                          <textarea
                            rows={2}
                            value={selectedChapter.loadingScreen.loreTip || ''}
                            onChange={(e) => handleUpdateLoadingConfig({ loreTip: e.target.value })}
                            placeholder="Enter lore quote or text here..."
                            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] italic outline-none focus:border-[var(--accent)] resize-none transition-colors"
                          />

                          {/* Quick presets */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-[var(--muted)]">Quick presets:</span>
                            {LORE_TIP_PRESETS.slice(0, 3).map((tip, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleUpdateLoadingConfig({ loreTip: tip })}
                                className="text-[9px] px-2 py-0.5 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg truncate max-w-[200px] cursor-pointer transition-colors"
                                title={tip}
                              >
                                "{tip}"
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Loading background */}
                        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                            Atmospheric Loading Background
                          </label>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={selectedChapter.loadingScreen.bgImageUrl || ''}
                              onChange={(e) => handleUpdateLoadingConfig({ bgImageUrl: e.target.value })}
                              placeholder="Or enter custom background URL..."
                              className="flex-1 min-w-0 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowAssetPickerFor('loading_bg')}
                                className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-md cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
                                title="Choose background from Asset Gallery (Backgrounds Only)"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
                                <span>Gallery</span>
                              </button>
                              <label className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-md cursor-pointer shrink-0 transition-colors shadow-sm">
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadLoadingBg}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* On-screen duration */}
                        <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                              On-Screen Duration
                            </label>
                            <span className="text-xs font-mono font-bold text-[var(--accent)]">
                              {((selectedChapter.loadingScreen.durationMs || 2500) / 1000).toFixed(1)} seconds
                            </span>
                          </div>
                          <input
                            type="range"
                            min={1000}
                            max={6000}
                            step={250}
                            value={selectedChapter.loadingScreen.durationMs || 2500}
                            onChange={(e) => handleUpdateLoadingConfig({ durationMs: Number(e.target.value) })}
                            className="w-full accent-[var(--accent)] cursor-pointer"
                          />
                        </div>

                        {/* Test live preview button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowLiveLoadingPreview(true)}
                            className="w-full py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] font-bold rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5" />
                            <span>Test Live Preview of Loading Screen</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: EPISODE END SCREEN (OUTRO) */}
                {activeTab === 'end_screen' && (
                  <div className="space-y-6 max-w-3xl">
                    {/* Toggle Switch */}
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block flex items-center gap-2">
                          <GuiIconRenderer icon={GUI_ICONS.general.end} className="w-3.5 h-3.5 text-purple-400" />
                          <span>Enable Episode End Screen (Conclusion)</span>
                        </span>
                        <p className="text-[11px] text-[var(--muted)]">
                          Displays a static conclusion screen when all narrative scenarios in this chapter are finished, offering clear options to continue to the next chapter, replay, or return to the menu.
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input
                          type="checkbox"
                          checked={selectedChapter.endScreen?.enabled ?? false}
                          onChange={(e) => handleUpdateEndConfig({ enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--well-bg)] border border-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>

                    {selectedChapter.endScreen?.enabled && (
                      <div className="space-y-5 p-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-sm animate-fade-in">
                        
                        {/* Mode Selector: Custom or Linked */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                            Screen Source
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateEndConfig({ sceneId: undefined })}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                !selectedChapter.endScreen?.sceneId
                                  ? 'bg-[var(--accent-surface)] border-purple-500 shadow-sm'
                                  : 'bg-[var(--well-bg)] border-[var(--border)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)]'
                              }`}
                            >
                              <div className="text-xs font-bold text-[var(--text)]">Design Custom Screen</div>
                              <div className="text-[10px] text-[var(--muted)] mt-0.5">
                                Customize title, summary, animations, screen FX, and buttons directly.
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateEndConfig({ sceneId: allStaticScenes[0]?.id || '' })}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                                selectedChapter.endScreen?.sceneId
                                  ? 'bg-[var(--accent-surface)] border-purple-500 shadow-sm'
                                  : 'bg-[var(--well-bg)] border-[var(--border)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)]'
                              }`}
                            >
                              <div className="text-xs font-bold text-[var(--text)]">Link Project Scenario</div>
                              <div className="text-[10px] text-[var(--muted)] mt-0.5">
                                Connect an existing static screen scenario built in the Scene Studio.
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Linked Scenario Selector */}
                        {selectedChapter.endScreen?.sceneId ? (
                          <div className="space-y-2 p-4 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg">
                            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                              Select Linked Static Scenario
                            </label>
                            {allStaticScenes.length > 0 ? (
                              <select
                                value={selectedChapter.endScreen.sceneId}
                                onChange={(e) => handleUpdateEndConfig({ sceneId: e.target.value })}
                                className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-purple-500 cursor-pointer"
                              >
                                {allStaticScenes.map((sc) => (
                                  <option key={sc.id} value={sc.id}>
                                    {sc.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-amber-400">
                                No static screen scenarios found in this project. Use "Design Custom Screen" instead.
                              </p>
                            )}
                          </div>
                        ) : (
                          /* Custom Screen Designer */
                          <div className="space-y-4">
                            {/* Title & Animation */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Screen Title
                                </label>
                                <input
                                  type="text"
                                  value={selectedChapter.endScreen?.staticConfig?.title || `END OF EPISODE #${selectedChapter.number}`}
                                  onChange={(e) => handleUpdateEndStaticConfig({ title: e.target.value })}
                                  placeholder="e.g. END OF CHAPTER 1"
                                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] font-bold outline-none focus:border-purple-500"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Title Animation
                                </label>
                                <select
                                  value={selectedChapter.endScreen?.staticConfig?.titleAnimation || 'fade_in'}
                                  onChange={(e) => handleUpdateEndStaticConfig({ titleAnimation: e.target.value as any })}
                                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-purple-500 cursor-pointer"
                                >
                                  {STATIC_ANIMATION_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Subtitle / Epilogue */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                Subtitle / Epilogue Note
                              </label>
                              <textarea
                                rows={2}
                                value={selectedChapter.endScreen?.staticConfig?.subtitle || 'Episode completed successfully.'}
                                onChange={(e) => handleUpdateEndStaticConfig({ subtitle: e.target.value })}
                                placeholder="Enter concluding narrative epilogue or stats..."
                                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none focus:border-purple-500 resize-none"
                              />
                            </div>

                            {/* Background Image & Screen FX */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Background Image
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={selectedChapter.endScreen?.backgroundUrl || ''}
                                    onChange={(e) => handleUpdateEndConfig({ backgroundUrl: e.target.value })}
                                    placeholder="Background image URL..."
                                    className="flex-1 min-w-0 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] outline-none focus:border-purple-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowAssetPickerFor('end_bg')}
                                    className="px-2.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-md cursor-pointer shrink-0 flex items-center gap-1.5"
                                  >
                                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
                                    <span>Gallery</span>
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest block">
                                  Atmosphere Screen FX
                                </label>
                                <select
                                  value={selectedChapter.endScreen?.staticConfig?.screenFx || 'cinema_grain'}
                                  onChange={(e) => handleUpdateEndStaticConfig({ screenFx: e.target.value as any })}
                                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] outline-none focus:border-purple-500 cursor-pointer"
                                >
                                  {STATIC_FX_PRESETS.map((fx) => (
                                    <option key={fx.id} value={fx.id}>
                                      {fx.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Buttons Preview Info */}
                            <div className="p-3 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--muted)] space-y-1">
                              <span className="font-bold text-[var(--text)] block uppercase tracking-wider text-[10px]">
                                Interactive Options on Screen:
                              </span>
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300 font-bold">
                                  ▶ CONTINUE TO NEXT EPISODE
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)]">
                                  ↺ REPLAY EPISODE
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)]">
                                  ⌂ RETURN TO MENU
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Test live preview button */}
                        <div className="pt-3 border-t border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => setShowLiveEndPreview(true)}
                            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5" />
                            <span>Test Live Preview of Episode End Screen</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: SCENARIOS */}
                {activeTab === 'scenes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                          Scenarios in "{selectedChapter.title}"
                        </h4>
                        <p className="text-[11px] text-[var(--muted)]">
                          {selectedChapter.scenes.length} scenarios compose this narrative arc.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedChapter.scenes.map((sc, scIdx) => {
                        const isStart = sc.id === selectedChapter.startSceneId;
                        const lineCount = sc.timeline?.length || 0;
                        const hsCount = sc.hotspots?.length || 0;

                        return (
                          <div
                            key={sc.id}
                            className={`p-3 bg-[var(--card-bg)] rounded-lg border flex flex-col justify-between space-y-2 relative group overflow-hidden shadow-sm transition-all ${
                              isStart ? 'border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/40' : 'border-[var(--border)] hover:border-[var(--border2)]'
                            }`}
                          >
                            <div className="relative h-24 rounded-md overflow-hidden border border-[var(--border)] mb-1">
                              <img
                                src={sc.backgroundUrl}
                                alt={sc.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/25" />
                              {isStart && (
                                <span className="absolute top-1.5 left-1.5 bg-[var(--accent)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                                  <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-2.5 h-2.5" />
                                  <span>START</span>
                                </span>
                              )}
                              <span className="absolute bottom-1.5 right-1.5 bg-[var(--well-bg)]/80 backdrop-blur-sm text-[var(--text)] text-[9px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]">
                                #{scIdx + 1}
                              </span>
                            </div>

                            <div>
                              <h5 className="text-xs font-bold text-[var(--text)] truncate" title={sc.name}>
                                {sc.name}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] mt-1">
                                <span className="flex items-center gap-1">
                                  <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3 opacity-70" />
                                  <span>{lineCount} lines</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3 h-3 opacity-70" />
                                  <span>{hsCount} hotspots</span>
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                              {!isStart ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCurrentChapter({ startSceneId: sc.id })}
                                  className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] font-bold cursor-pointer transition-colors"
                                >
                                  Set as Starting Scene
                                </button>
                              ) : (
                                <span className="text-[10px] text-[var(--accent)] font-bold">Starting Scene</span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  onSelectChapter(selectedChapter.id);
                                  onClose();
                                  notify(`Opening scene "${sc.name}"`);
                                }}
                                className="text-[10px] px-2.5 py-1 bg-[var(--accent-surface)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white border border-[var(--border2)] rounded-lg font-bold cursor-pointer transition-colors"
                              >
                                Edit on Canvas
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: ATMOSPHERE & AUDIO */}
                {activeTab === 'atmosphere' && (
                  <div className="space-y-6 max-w-xl">
                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3 shadow-sm">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                          <GuiIconRenderer icon={GUI_ICONS.action.soundOn} className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>Chapter Background Music (BGM)</span>
                        </h4>
                        <p className="text-[11px] text-[var(--muted)]">
                          Recommended soundtrack atmosphere when entering this chapter.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="/assets/sfx/bg-tvnoise.mp3 or external URL..."
                          defaultValue="/assets/sfx/bg-tvnoise.mp3"
                          className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => playSfx('/assets/sfx/bg-tvnoise.mp3', false, 0.4)}
                          className="px-3 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3 h-3" />
                          <span>Test Sound</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3 shadow-sm">
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                          <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span>Cinematic Entrance SFX</span>
                        </h4>
                        <p className="text-[11px] text-[var(--muted)]">
                          Sound effect triggered when revealing the chapter title.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => playSfx('/assets/sfx/start after click intro.mp3', false, 0.5)}
                          className="px-3 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3 h-3" />
                          <span>Cinematic Impact</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => playSfx('/assets/sfx/Interactions/open door.mp3', false, 0.5)}
                          className="px-3 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3 h-3" />
                          <span>Blast Door Opening</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-xs">
              Select or create a chapter to begin editing
            </div>
          )}

        </div>

      </div>

      {/* LIVE LOADING PREVIEW MODAL */}
      {showLiveLoadingPreview && selectedChapter?.loadingScreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-cover bg-center animate-fade-in"
          style={{
            backgroundImage: selectedChapter.loadingScreen.bgImageUrl
              ? `url(${selectedChapter.loadingScreen.bgImageUrl})`
              : undefined,
            backgroundColor: '#050508',
          }}
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          <button
            onClick={() => setShowLiveLoadingPreview(false)}
            className="absolute top-6 right-6 z-20 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer shadow-xl flex items-center gap-2"
          >
            <span>Close Preview</span>
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3.5 h-3.5" />
          </button>

          <div className="relative z-10 max-w-xl w-full text-center space-y-4 font-mono animate-fade-in">
            <div className="border border-red-700/50 bg-red-950/20 px-4 py-1 inline-block rounded text-xs text-red-500 font-bold uppercase tracking-widest animate-pulse">
              [ DECLASSIFICATION PROTOCOL IN PROGRESS ]
            </div>

            <h2 className="text-3xl md:text-5xl text-white font-title tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {selectedChapter.loadingScreen.title || selectedChapter.title}
            </h2>

            {selectedChapter.loadingScreen.subtitle && (
              <p className="text-xs uppercase tracking-widest text-red-400 font-bold">
                {selectedChapter.loadingScreen.subtitle}
              </p>
            )}

            <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-red-900/40 my-6">
              <div className="h-full bg-red-600 animate-[pulse_1.5s_infinite] w-full origin-left" />
            </div>

            {selectedChapter.loadingScreen.loreTip && (
              <div className="border-t border-gray-800 pt-4 text-xs text-gray-400 italic">
                {selectedChapter.loadingScreen.loreTip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE EPISODE INTRO PREVIEW MODAL */}
      {showLiveIntroPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-fade-in">
          <button
            onClick={() => setShowLiveIntroPreview(false)}
            className="absolute top-6 right-6 z-50 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer shadow-xl flex items-center gap-2"
          >
            <span>Close Preview</span>
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3.5 h-3.5" />
          </button>

          <div className="w-full h-full max-w-6xl max-h-[85vh] aspect-video relative rounded-lg overflow-hidden border border-[var(--border)] shadow-2xl bg-black">
            <StaticScreenView
              scene={previewIntroScene}
              story={story}
              isInteractive={false}
            />
          </div>
        </div>
      )}

      {/* LIVE EPISODE END PREVIEW MODAL */}
      {showLiveEndPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-fade-in">
          <button
            onClick={() => setShowLiveEndPreview(false)}
            className="absolute top-6 right-6 z-50 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer shadow-xl flex items-center gap-2"
          >
            <span>Close Preview</span>
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3.5 h-3.5" />
          </button>

          <div className="w-full h-full max-w-6xl max-h-[85vh] aspect-video relative rounded-lg overflow-hidden border border-[var(--border)] shadow-2xl bg-black">
            <StaticScreenView
              scene={previewEndScene}
              story={story}
              isInteractive={false}
            />
          </div>
        </div>
      )}

      {showAssetPickerFor && (
        <AssetStudioModal
          story={story}
          initialFilterType="background"
          onSelectAsset={(asset) => {
            if (showAssetPickerFor === 'loading_bg') {
              handleUpdateLoadingConfig({ bgImageUrl: asset.url });
            } else if (showAssetPickerFor === 'intro_bg') {
              handleUpdateIntroConfig({ backgroundUrl: asset.url });
            } else if (showAssetPickerFor === 'end_bg') {
              handleUpdateEndConfig({ backgroundUrl: asset.url });
            }
            setShowAssetPickerFor(null);
            notify(`Background selected: ${asset.name}`);
          }}
          onClose={() => setShowAssetPickerFor(null)}
        />
      )}

    </div>
  );
}
