"use client";
import React, { useState, useMemo } from 'react';
import { VNStory, VNScene, VNHotspot, VNAssetItem, VNAssetType } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { fileToBase64, uploadProjectAssetFile, cleanOrphanSceneReferences } from '@/lib/vn/engineUtils';
import { GUI_ICONS, HOTSPOT_ICON_PRESETS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import AssetStudioModal from './AssetStudioModal';
import { DEFAULT_DEATH_CONFIG } from './StaticScreenView';
import { DEFAULT_CINEMATIC_CONFIG } from './CinematicPlayerView';

interface SceneStudioModalProps {
  story: VNStory;
  currentChapterId: string;
  selectedSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onUpdateStory: (updatedStory: VNStory) => void;
  onMoveSceneToChapter?: (sceneId: string, targetChapterId: string | '__global__') => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export const ENTRY_SFX_PRESETS = [
  { name: 'Open Metal Door / Entry Access', url: '/assets/sfx/open folder.mp3' },
  { name: 'Cinematic Intro / Scene Start', url: '/assets/sfx/start after click intro.mp3' },
  { name: 'Corrupt File / Electric Glitch', url: '/assets/sfx/corrupt file.mp3' },
  { name: 'Scenario Alarm / Danger', url: '/assets/sfx/ERROR RING.mp3' },
  { name: 'Flip Page / Paper Sheet', url: '/assets/sfx/flip page.mp3' },
  { name: 'Radio Tuning / Retro Frequency', url: '/assets/sfx/back to intro.mp3' },
  { name: 'Success Chime / Revelation', url: '/assets/sfx/success.mp3' },
  { name: 'Fast Typing / Input Terminal', url: '/assets/sfx/typing.mp3' },
];

export const BGM_AMBIENT_PRESETS = [
  { name: 'White Noise / Cyberpunk Static (Loop)', url: '/assets/sfx/bg-tvnoise.mp3' },
  { name: 'Residual Radio Frequency', url: '/assets/sfx/back to intro.mp3' },
];

export default function SceneStudioModal({
  story,
  currentChapterId,
  selectedSceneId,
  onSelectScene,
  onUpdateStory,
  onMoveSceneToChapter,
  onClose,
  notify = () => {},
}: SceneStudioModalProps) {
  const chapter = story.chapters.find((c) => c.id === currentChapterId) || story.chapters[0];
  const [activeTab, setActiveTab] = useState<'identity' | 'audio' | 'hotspots'>('identity');
  const [filterMode, setFilterMode] = useState<'all' | 'chapter' | 'reserve'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBgAssetPicker, setShowBgAssetPicker] = useState<boolean>(false);
  const [assetPickerConfig, setAssetPickerConfig] = useState<{
    filterType: VNAssetType;
    onSelect: (asset: VNAssetItem) => void;
  } | null>(null);

  // Unified project scenarios library
  const allScenarios = useMemo(() => {
    const map = new Map<string, VNScene>();
    (story.scenarios || []).forEach((s) => {
      if (s && s.id) map.set(s.id, s);
    });
    (story.chapters || []).forEach((ch) => {
      (ch.scenes || []).forEach((s) => {
        if (s && s.id && !map.has(s.id)) {
          map.set(s.id, s);
        }
      });
    });
    return Array.from(map.values());
  }, [story.scenarios, story.chapters]);

  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    if (selectedSceneId && allScenarios.some((s) => s.id === selectedSceneId)) {
      return selectedSceneId;
    }
    return allScenarios[0]?.id || '';
  });

  const currentScene = allScenarios.find((s) => s.id === activeSceneId) || allScenarios[0];
  const isActiveInCurrentChapter = Boolean(chapter?.scenes.some((s) => s.id === currentScene?.id));
  const currentAssignedChapter = story.chapters.find((c) =>
    c.scenes.some((s) => s.id === currentScene?.id)
  );

  // Helper to update current scenario in global library and any chapter containing it
  const handleUpdateCurrentScene = (patch: Partial<VNScene>) => {
    if (!currentScene) return;

    // 1. Update in global scenario library
    const updatedScenarios = allScenarios.map((s) =>
      s.id === currentScene.id ? { ...s, ...patch } : s
    );

    // 2. If present in chapters, update there too
    const updatedChapters = story.chapters.map((c) => {
      const hasScene = c.scenes.some((s) => s.id === currentScene.id);
      if (!hasScene) return c;
      const updatedScenes = c.scenes.map((s) =>
        s.id === currentScene.id ? { ...s, ...patch } : s
      );
      return { ...c, scenes: updatedScenes };
    });

    onUpdateStory({
      ...story,
      scenarios: updatedScenarios,
      chapters: updatedChapters,
    });
  };

  // Create new scenario in project library (without forcefully pushing to chapter timeline)
  const handleCreateScene = (
    sceneType: 'standard' | 'event' = 'standard',
    eventSubtype?: 'cinematic' | 'static'
  ) => {
    const newId = `scene-${Date.now()}`;
    const defaultName =
      sceneType === 'event'
        ? eventSubtype === 'cinematic'
          ? `Cinematic Event #${allScenarios.length + 1}`
          : `Static Screen #${allScenarios.length + 1}`
        : `Scenario #${allScenarios.length + 1}`;

    const newScene: VNScene = {
      id: newId,
      name: defaultName,
      backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      sceneType,
      eventSubtype,
      staticScreenConfig: eventSubtype === 'static' ? DEFAULT_DEATH_CONFIG : undefined,
      cinematicConfig: eventSubtype === 'cinematic' ? DEFAULT_CINEMATIC_CONFIG : undefined,
      timeline: [
        {
          id: `ev-${Date.now()}`,
          type: 'dialogue',
          characterId: story.characters[0]?.id,
          text: '',
        },
      ],
      hotspots: [],
    };

    const updatedScenarios = [...allScenarios, newScene];
    onUpdateStory({
      ...story,
      scenarios: updatedScenarios,
    });

    setActiveSceneId(newId);
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    notify(
      sceneType === 'event'
        ? `Created ${eventSubtype === 'cinematic' ? 'Cinematic Event' : 'Static Screen'}!`
        : 'New scenario saved to project catalog'
    );
  };

  // Toggle whether scenario is active in current chapter or in reserve
  const handleToggleChapterActive = (sc: VNScene) => {
    if (!chapter) return;
    const isCurrentlyIn = chapter.scenes.some((s) => s.id === sc.id);

    if (isCurrentlyIn) {
      if (chapter.scenes.length <= 1) {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify('The chapter must have at least one active scenario in its story.');
        return;
      }
      const filtered = chapter.scenes.filter((s) => s.id !== sc.id);
      const newStart = chapter.startSceneId === sc.id ? filtered[0]?.id : chapter.startSceneId;

      const updatedChapters = story.chapters.map((c) =>
        c.id === chapter.id ? { ...c, scenes: filtered, startSceneId: newStart } : c
      );

      onUpdateStory({
        ...story,
        scenarios: allScenarios,
        chapters: updatedChapters,
      });

      playSfx('/assets/sfx/glitch.mp3', false, 0.3);
      notify(`Scenario removed from chapter (kept in library)`);
    } else {
      const updatedChapters = story.chapters.map((c) =>
        c.id === chapter.id ? { ...c, scenes: [...c.scenes, sc] } : c
      );

      onUpdateStory({
        ...story,
        scenarios: allScenarios,
        chapters: updatedChapters,
      });

      playSfx('/assets/sfx/success.mp3', false, 0.4);
      notify(`Scenario added to timeline for "${chapter.title}"`);
    }
  };

  // Duplicate scenario
  const handleDuplicateScene = (sc: VNScene) => {
    const newId = `scene-${Date.now()}`;
    const cloned: VNScene = {
      ...JSON.parse(JSON.stringify(sc)),
      id: newId,
      name: `${sc.name} (Copy)`,
      timeline: sc.timeline?.map((ev, idx) => ({ ...ev, id: `ev-${Date.now()}-${idx}` })) || [],
      hotspots: sc.hotspots?.map((h, idx) => ({ ...h, id: `hs-${Date.now()}-${idx}` })) || [],
    };

    const updatedScenarios = [...allScenarios, cloned];
    onUpdateStory({
      ...story,
      scenarios: updatedScenarios,
    });

    setActiveSceneId(newId);
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify('Scenario duplicated in library');
  };

  // Delete scenario permanently from project
  const handleDeleteScenarioPermanently = (sc: VNScene) => {
    if (allScenarios.length <= 1) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('The project must have at least one scenario.');
      return;
    }

    const confirmMsg = `Permanently delete "${sc.name}" from project library?\n\nThis will remove it from disk and from any chapter where it is present.`;
    if (!confirm(confirmMsg)) return;

    // Purge references to this scene across all other scenes, timelines, choices, hotspots and statics
    const cleanedStory = cleanOrphanSceneReferences(story, sc.id);
    const cleanedScenarios = (cleanedStory.scenarios || []).filter((s) => s.id !== sc.id);

    // Also remove from any chapter
    const updatedChapters = cleanedStory.chapters.map((c) => {
      const filteredScenes = c.scenes.filter((s) => s.id !== sc.id);
      const safeScenes = filteredScenes.length > 0 ? filteredScenes : [cleanedScenarios[0]];
      const safeStart = c.startSceneId === sc.id ? safeScenes[0]?.id : c.startSceneId;
      return {
        ...c,
        scenes: safeScenes,
        startSceneId: safeStart || safeScenes[0]?.id || '',
      };
    });

    onUpdateStory({
      ...cleanedStory,
      scenarios: cleanedScenarios,
      chapters: updatedChapters,
    });

    setActiveSceneId(cleanedScenarios[0]?.id || '');
    playSfx('/assets/sfx/glitch.mp3', false, 0.4);
    notify('Scenario permanently removed and unlinked from project');
  };

  // Move scenario location between chapters or global reserve
  const handleMoveLocation = (target: string) => {
    if (!currentScene) return;
    if (onMoveSceneToChapter) {
      onMoveSceneToChapter(currentScene.id, target as string | '__global__');
      return;
    }

    let updatedChapters = [...story.chapters];
    let updatedScenarios = [...(story.scenarios || [])];

    updatedChapters = updatedChapters.map((ch) => ({
      ...ch,
      scenes: ch.scenes.filter((s) => s.id !== currentScene.id),
      startSceneId:
        ch.startSceneId === currentScene.id
          ? ch.scenes.filter((s) => s.id !== currentScene.id)[0]?.id || ''
          : ch.startSceneId,
    }));
    updatedScenarios = updatedScenarios.filter((s) => s.id !== currentScene.id);

    if (target === '__global__') {
      updatedScenarios.push(currentScene);
      notify(`Scenario moved to Global Reserve`);
    } else {
      const destIdx = updatedChapters.findIndex((c) => c.id === target);
      if (destIdx !== -1) {
        updatedChapters[destIdx] = {
          ...updatedChapters[destIdx],
          scenes: [...updatedChapters[destIdx].scenes, currentScene],
        };
        notify(`Scenario moved to ${updatedChapters[destIdx].title}`);
      }
    }

    onUpdateStory({
      ...story,
      chapters: updatedChapters,
      scenarios: updatedScenarios,
    });
  };

  // Add interaction hotspot
  const handleAddHotspotToScene = () => {
    if (!currentScene) return;
    const currentList = currentScene.hotspots || [];
    const newHs: VNHotspot = {
      id: `hs-${Date.now()}`,
      label: `Access #${currentList.length + 1}`,
      style: 'door',
      icon: GUI_ICONS.action.entryDoor,
      xPercent: 75,
      yPercent: 75,
      actionType: 'jump_scene',
      targetSceneId: allScenarios.find((s) => s.id !== currentScene.id)?.id || currentScene.id,
      interactionLimit: 'permanent',
      sfxUrl: '/assets/sfx/open folder.mp3',
    };
    handleUpdateCurrentScene({
      hotspots: [...currentList, newHs],
      enableHotspots: true,
    });
    playSfx('/assets/sfx/click interface.mp3', true, 0.3);
    notify('Constant hotspot added to scenario');
  };

  const handleUpdateHotspotInScene = (hsId: string, patch: Partial<VNHotspot>) => {
    if (!currentScene?.hotspots) return;
    const updated = currentScene.hotspots.map((h) => (h.id === hsId ? { ...h, ...patch } : h));
    handleUpdateCurrentScene({ hotspots: updated });
  };

  const handleRemoveHotspotFromScene = (hsId: string) => {
    if (!currentScene?.hotspots) return;
    const filtered = currentScene.hotspots.filter((h) => h.id !== hsId);
    handleUpdateCurrentScene({ hotspots: filtered });
    notify('Hotspot deleted');
  };

  // List filtering
  const filteredScenarios = allScenarios.filter((sc) => {
    const matchesSearch = sc.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const inCurrentChap = chapter?.scenes.some((s) => s.id === sc.id);
    if (filterMode === 'chapter') return inCurrentChap;
    if (filterMode === 'reserve') return !inCurrentChap;
    return true;
  });

  const activeInChapterCount = allScenarios.filter((sc) => chapter?.scenes.some((s) => s.id === sc.id)).length;
  const inReserveCount = allScenarios.length - activeInChapterCount;

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-3 md:p-6 flex items-center justify-center animate-fade-in font-sans">
      <div className="max-w-6xl w-full max-h-[88vh] sm:max-h-[85vh] h-full vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
        
        {/* GENERAL HEADER */}
        <header className="h-14 vn-glass-header border-b px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center text-[var(--accent)]">
              <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
                <span>SCENARIO CATALOG & STUDIO</span>
                <span className="text-[10px] bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--accent)] px-2 py-0.5 rounded-full font-mono font-bold">
                  PROJECT: {story.title}
                </span>
              </h2>
              <p className="text-[11px] text-[var(--muted)]">
                Manage your backgrounds and locations. Saved scenarios remain in the library independently of the timeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentScene) {
                  // If not in chapter, add it first
                  if (!isActiveInCurrentChapter && chapter) {
                    const updatedChapters = story.chapters.map((c) =>
                      c.id === chapter.id ? { ...c, scenes: [...c.scenes, currentScene] } : c
                    );
                    onUpdateStory({
                      ...story,
                      scenarios: allScenarios,
                      chapters: updatedChapters,
                    });
                  }
                  onSelectScene(currentScene.id);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.3);
                  notify(`Loaded on screen: ${currentScene.name}`);
                }
                onClose();
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-md text-xs font-extrabold uppercase transition-all shadow cursor-pointer flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.confirmed} className="w-3.5 h-3.5 text-[#0F0503]" />
              <span>Load on Screen and Close</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* TWO-COLUMN CONTAINER */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: SCENARIOS LIST */}
          <aside className="w-80 bg-[var(--well-bg)] border-r border-[var(--border)] flex flex-col shrink-0">
            <div className="p-3 border-b border-[var(--border)] space-y-2.5 bg-[var(--header-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Library ({allScenarios.length})</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCreateScene('standard')}
                    className="px-2 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                    title="New Standard Scenario"
                  >
                    + Scene
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateScene('event', 'cinematic')}
                    className="px-2 py-1 bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                    title="New Cinematic Event Sequencer"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.track.cinematic} size={11} />
                    <span>Cinematic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateScene('event', 'static')}
                    className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/40 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1"
                    title="New Static Screen (Death / Ending / Intro)"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.asset.dead} size={11} />
                    <span>Static</span>
                  </button>
                </div>
              </div>

              {/* Quick Filters: All | In Chapter | Reserve */}
              <div className="grid grid-cols-3 gap-1 bg-[var(--well-bg)] p-1 rounded-md border border-[var(--border)] text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`py-1 rounded-lg text-center transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  All ({allScenarios.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('chapter')}
                  className={`py-1 rounded-lg text-center transition-colors cursor-pointer ${
                    filterMode === 'chapter'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title="Scenarios currently present in this chapter"
                >
                  In Chap. ({activeInChapterCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('reserve')}
                  className={`py-1 rounded-lg text-center transition-colors cursor-pointer ${
                    filterMode === 'reserve'
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-800 dark:text-amber-200 font-bold'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title="Scenarios saved in library but not active in current chapter"
                >
                  Reserve ({inReserveCount})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search scenario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredScenarios.length === 0 ? (
                <div className="text-center py-10 px-4 text-[var(--muted2)] text-xs">
                  No scenarios found matching this filter.
                </div>
              ) : (
                filteredScenarios.map((sc) => {
                  const isSelected = sc.id === activeSceneId;
                  const isLoadedInEditor = sc.id === selectedSceneId;
                  const isInChap = chapter?.scenes.some((s) => s.id === sc.id);

                  return (
                    <div
                      key={sc.id}
                      onClick={() => {
                        setActiveSceneId(sc.id);
                        playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                      }}
                      className={`p-2 rounded-md border flex items-center gap-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-surface)] ring-1 ring-[var(--accent)]/40 shadow-md'
                          : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border2)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-[var(--well-bg)] border border-[var(--border)] shrink-0">
                        {sc.backgroundUrl ? (
                          <img src={sc.backgroundUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {sc.sceneType === 'event' && sc.eventSubtype === 'cinematic' ? (
                              <GuiIconRenderer icon={GUI_ICONS.track.cinematic} size={12} className="text-sky-400 shrink-0" />
                            ) : sc.sceneType === 'event' && sc.eventSubtype === 'static' ? (
                              <GuiIconRenderer icon={GUI_ICONS.asset.dead} size={12} className="text-red-400 shrink-0" />
                            ) : (
                              <GuiIconRenderer icon={GUI_ICONS.general.folder} size={12} className="text-[var(--muted)] shrink-0" />
                            )}
                            <span className="text-xs font-bold text-[var(--text)] truncate block">
                              {sc.name}
                            </span>
                          </div>
                          {isInChap ? (
                            <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono shrink-0">
                              In Chap.
                            </span>
                          ) : (
                            <span className="text-[9px] bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted2)] px-1.5 py-0.2 rounded font-mono shrink-0">
                              Reserve
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] font-mono mt-0.5">
                          {isLoadedInEditor && (
                            <span className="text-[var(--accent)] font-bold">Active on screen</span>
                          )}
                          <span className="flex items-center gap-1">
                            <GuiIconRenderer icon={GUI_ICONS.general.pencil} size={10} />
                            <span>{sc.timeline?.length || 0} ev.</span>
                          </span>
                          {sc.hotspots && sc.hotspots.length > 0 && (
                            <span className="text-amber-500 flex items-center gap-1">
                              <GuiIconRenderer icon={GUI_ICONS.action.target} size={10} />
                              <span>{sc.hotspots.length} btn.</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: SCENARIO EDITOR */}
          <main className="flex-1 flex flex-col bg-[var(--panel)] overflow-hidden">
            {currentScene ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* TABS & SCENARIO ACTIONS */}
                <div className="h-12 bg-[var(--header-bg)] border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('identity')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeTab === 'identity'
                          ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                          : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5" />
                      <span>Background & Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('audio')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeTab === 'audio'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                          : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.soundOn} className="w-3.5 h-3.5" />
                      <span>Entry Audio & BGM</span>
                      {currentScene.entrySfxUrl && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('hotspots')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeTab === 'hotspots'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 shadow-sm'
                          : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.action.entryDoor} className="w-3.5 h-3.5" />
                      <span>Constant Hotspots ({currentScene.hotspots?.length || 0})</span>
                    </button>
                  </div>

                  {/* Scenario Actions */}
                  <div className="flex items-center gap-2">
                    {/* Location Selector */}
                    <div className="flex items-center gap-1.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs shadow-sm">
                      <span className="font-semibold text-[var(--muted)] text-[11px] whitespace-nowrap">Location:</span>
                      <select
                        value={currentAssignedChapter ? currentAssignedChapter.id : '__global__'}
                        onChange={(e) => handleMoveLocation(e.target.value)}
                        className="bg-transparent text-xs font-bold text-[var(--text)] outline-none cursor-pointer"
                        title="Move this scenario to another chapter or to Global Reserve"
                      >
                        {story.chapters.map((ch) => (
                          <option key={ch.id} value={ch.id} className="bg-[var(--card-bg)] text-[var(--text)]">
                            📖 {ch.title}
                          </option>
                        ))}
                        <option value="__global__" className="bg-[var(--card-bg)] text-amber-400">
                          📁 Global Reserve
                        </option>
                      </select>
                    </div>

                    {/* Add / Remove from Chapter */}
                    <button
                      type="button"
                      onClick={() => handleToggleChapterActive(currentScene)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow ${
                        isActiveInCurrentChapter
                          ? 'bg-amber-950/40 hover:bg-amber-900 border-amber-800 text-amber-300'
                          : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                      }`}
                      title={
                        isActiveInCurrentChapter
                          ? 'Remove from this chapter timeline (keeps in library)'
                          : 'Add this scenario to the story and map of this chapter'
                      }
                    >
                      {isActiveInCurrentChapter ? (
                        <>
                          <span>Remove from Chapter</span>
                        </>
                      ) : (
                        <>
                          <span>+ Add to Chapter</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateScene(currentScene)}
                      className="px-2.5 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700 text-xs cursor-pointer flex items-center gap-1.5 shadow"
                      title="Duplicate scenario in library"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteScenarioPermanently(currentScene)}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white rounded-lg border border-red-800 text-xs cursor-pointer flex items-center gap-1 shadow"
                      title="Permanently delete from project library"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SCROLLABLE TAB CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* TAB 1: BACKGROUND & BASIC DATA */}
                  {activeTab === 'identity' && (
                    <div className="space-y-6 text-xs max-w-4xl">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] block">
                          Scenario Name *:
                        </label>
                        <input
                          type="text"
                          value={currentScene.name}
                          onChange={(e) => handleUpdateCurrentScene({ name: e.target.value })}
                          className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2.5 text-sm text-[var(--text)] font-bold outline-none transition-colors"
                        />
                      </div>

                      {/* Scenario Location & Assignment */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] block">
                          Assigned Location (Chapter / Global Reserve):
                        </label>
                        <div className="flex items-center gap-3 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-3">
                          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-5 h-5 text-[var(--accent)] shrink-0" />
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs text-[var(--muted)]">
                              Current placement:{' '}
                              <strong className="text-[var(--text)] font-mono">
                                {currentAssignedChapter ? `Chapter: ${currentAssignedChapter.title}` : '📁 Global Reserve'}
                              </strong>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[var(--muted)]">Move to:</span>
                              <select
                                value={currentAssignedChapter ? currentAssignedChapter.id : '__global__'}
                                onChange={(e) => handleMoveLocation(e.target.value)}
                                className="bg-[var(--card-bg)] border border-[var(--border)] rounded px-2.5 py-1 text-xs font-bold text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)]"
                              >
                                {story.chapters.map((ch) => (
                                  <option key={ch.id} value={ch.id}>
                                    📖 {ch.title}
                                  </option>
                                ))}
                                <option value="__global__">
                                  📁 Global Reserve (Storage)
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Scenario Architecture Type Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text)] block">
                          Scenario Architecture & Engine Mode:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentScene({ sceneType: 'standard', eventSubtype: undefined })}
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              !currentScene.sceneType || currentScene.sceneType === 'standard'
                                ? 'border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--text)] shadow ring-2 ring-[var(--accent)]/40 font-bold'
                                : 'border-[var(--border)] bg-[var(--btn-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border2)]'
                            }`}
                          >
                            <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                              <GuiIconRenderer icon={GUI_ICONS.general.folder} size={14} className="text-[var(--accent)]" />
                              <span>Standard Scenario</span>
                            </div>
                            <div className="text-[10px] opacity-75 leading-tight">
                              Classic visual novel storyline, interactive dialogues, character sprites & choices.
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCurrentScene({
                                sceneType: 'event',
                                eventSubtype: 'cinematic',
                                cinematicConfig: currentScene.cinematicConfig || DEFAULT_CINEMATIC_CONFIG,
                              })
                            }
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              currentScene.sceneType === 'event' && currentScene.eventSubtype === 'cinematic'
                                ? 'border-sky-500 bg-sky-950/40 text-sky-200 shadow ring-2 ring-sky-500/40 font-bold'
                                : 'border-[var(--border)] bg-[var(--btn-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border2)]'
                            }`}
                          >
                            <div className="font-bold text-xs flex items-center gap-1.5 text-sky-400 mb-1">
                              <GuiIconRenderer icon={GUI_ICONS.track.cinematic} size={14} className="text-sky-400" />
                              <span>Cinematic Event</span>
                            </div>
                            <div className="text-[10px] opacity-75 leading-tight">
                              Multi-track video-editor timeline with timed subtitles, audio layers, crossfades & FX.
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCurrentScene({
                                sceneType: 'event',
                                eventSubtype: 'static',
                                staticScreenConfig: currentScene.staticScreenConfig || DEFAULT_DEATH_CONFIG,
                              })
                            }
                            className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                              currentScene.sceneType === 'event' && currentScene.eventSubtype === 'static'
                                ? 'border-red-500 bg-red-950/40 text-red-200 shadow ring-2 ring-red-500/40 font-bold'
                                : 'border-[var(--border)] bg-[var(--btn-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border2)]'
                            }`}
                          >
                            <div className="font-bold text-xs flex items-center gap-1.5 text-red-400 mb-1">
                              <GuiIconRenderer icon={GUI_ICONS.asset.dead} size={14} className="text-red-400" />
                              <span>Static Screen</span>
                            </div>
                            <div className="text-[10px] opacity-75 leading-tight">
                              Death / Game Over, Ending, or Chapter Intro with dynamic Checkpoint Return.
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Preview and Background Upload */}
                      <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                            Scenario Background Image:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowBgAssetPicker(true)}
                              className="px-3 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] rounded-md text-xs uppercase font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5 text-[var(--accent)]" />
                              <span>Project Gallery</span>
                            </button>

                            <label className="px-3 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] rounded-md text-xs uppercase font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5">
                              <GuiIconRenderer icon={GUI_ICONS.general.load} className="w-3.5 h-3.5 text-[var(--accent)]" />
                              <span>Upload PC</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const bgUrl = await uploadProjectAssetFile(file, 'background', story.id || 'current-project');
                                  handleUpdateCurrentScene({ backgroundUrl: bgUrl });
                                  notify('Background updated from your PC');
                                }}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateCurrentScene({ backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg' });
                                notify('Background reset to official template');
                              }}
                              className="px-2.5 py-1.5 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] rounded-md text-xs font-mono border border-[var(--border)] cursor-pointer transition-colors"
                              title="Reset to official template"
                            >
                              Template
                            </button>
                          </div>
                        </div>

                        <div className="relative aspect-video rounded-md overflow-hidden border border-[var(--border)] bg-[var(--well-bg)]">
                          {currentScene.backgroundUrl ? (
                            <img
                              src={currentScene.backgroundUrl}
                              alt={currentScene.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--muted2)]">
                              No Background
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SCENARIO AUDIO (ENTRY SOUND & BGM) */}
                  {activeTab === 'audio' && (
                    <div className="space-y-6 text-xs max-w-3xl animate-fade-in">
                      
                      {/* 1. ENTRY SFX */}
                      <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                            <GuiIconRenderer icon={GUI_ICONS.general.folder} size={14} className="text-[var(--accent)]" />
                            <span>Scenario Entry Sound (Entry SFX):</span>
                          </label>
                          {currentScene.entrySfxUrl && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => playSfx(currentScene.entrySfxUrl!, false, 0.7)}
                                className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                title="Test entry sound"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3 h-3 text-[var(--accent)]" />
                                <span>Test Sound</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCurrentScene({ entrySfxUrl: undefined })}
                                className="text-[var(--muted2)] hover:text-rose-500 text-xs cursor-pointer p-1"
                                title="Remove entry sound"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-[var(--muted)] leading-relaxed">
                          This sound will play automatically every time the player <b>enters or transitions to this scenario</b> (e.g. door opening, alarm, footsteps, or metallic creak).
                        </p>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                            Audio Path or Select from Gallery:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={currentScene.entrySfxUrl || ''}
                              onChange={(e) => handleUpdateCurrentScene({ entrySfxUrl: e.target.value || undefined })}
                              placeholder="/assets/sfx/... or choose from gallery"
                              className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setAssetPickerConfig({
                                  filterType: 'sfx',
                                  onSelect: (asset) => {
                                    handleUpdateCurrentScene({ entrySfxUrl: asset.url });
                                    playSfx(asset.url, false, 0.7);
                                    notify(`Entry SFX selected: ${asset.name}`);
                                  },
                                })
                              }
                              className="px-3.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                              title="Open Asset Gallery filtered strictly to SFX"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-[var(--accent)]" />
                              <span>SFX Gallery</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2. BACKGROUND MUSIC / AMBIENT IN LOOP */}
                      <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                            <GuiIconRenderer icon={GUI_ICONS.media.volume} size={14} className="text-[var(--accent)]" />
                            <span>Background Ambient Music / Sound in Loop (Loop BGM):</span>
                          </label>
                          {currentScene.bgmUrl && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => playSfx(currentScene.bgmUrl!, false, 0.5)}
                                className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                title="Test ambient sound"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3 h-3 text-[var(--accent)]" />
                                <span>Test BGM</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCurrentScene({ bgmUrl: undefined })}
                                className="text-[var(--muted2)] hover:text-rose-500 text-xs cursor-pointer p-1"
                                title="Remove BGM"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-[var(--muted)] leading-relaxed">
                          Continuous looping audio track that plays in the background while the player remains in this scenario.
                        </p>

                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                            Audio Path or Select from Gallery:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={currentScene.bgmUrl || ''}
                              onChange={(e) => handleUpdateCurrentScene({ bgmUrl: e.target.value || undefined })}
                              placeholder="/assets/sfx/... or choose from gallery"
                              className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setAssetPickerConfig({
                                  filterType: 'bgm',
                                  onSelect: (asset) => {
                                    handleUpdateCurrentScene({ bgmUrl: asset.url });
                                    playSfx(asset.url, false, 0.5);
                                    notify(`BGM selected: ${asset.name}`);
                                  },
                                })
                              }
                              className="px-3.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                              title="Open Asset Gallery filtered strictly to BGM"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-[var(--accent)]" />
                              <span>BGM Gallery</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: CONSTANT HOTSPOTS */}
                  {activeTab === 'hotspots' && (
                    <div className="space-y-4 text-xs animate-fade-in max-w-4xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                            <GuiIconRenderer icon={GUI_ICONS.action.target} size={14} className="text-[var(--accent)]" />
                            <span>SCENARIO CONSTANT HOTSPOTS</span>
                            <span className="text-[var(--muted)] font-mono font-normal">
                              ({currentScene.hotspots?.length || 0} configured)
                            </span>
                          </h4>
                          <p className="text-[11px] text-[var(--muted)]">
                            These buttons remain visible on screen so the player can interact or navigate in this scenario.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddHotspotToScene}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-md text-xs font-extrabold uppercase transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <span>+</span> Add Constant Hotspot
                        </button>
                      </div>

                      {/* Hotspots List */}
                      {(!currentScene.hotspots || currentScene.hotspots.length === 0) ? (
                        <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-lg text-center space-y-3 bg-[var(--well-bg)]">
                          <GuiIconRenderer icon={GUI_ICONS.action.target} size={32} className="text-[var(--muted)] mx-auto block" />
                          <p className="text-xs text-[var(--muted)]">
                            This scenario has no constant interaction hotspots yet.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddHotspotToScene}
                            className="px-4 py-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-bold rounded-md text-xs uppercase cursor-pointer transition-all shadow"
                          >
                            + Create First Constant Hotspot
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentScene.hotspots.map((hs, hIdx) => {
                            const targetSc = hs.targetSceneId
                              ? allScenarios.find((s) => s.id === hs.targetSceneId)
                              : null;

                            return (
                              <div
                                key={hs.id}
                                className="p-4 bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg space-y-3 transition-colors shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-[var(--well-bg)] rounded-md border border-[var(--border)] p-1 text-[var(--accent)]">
                                      <GuiIconRenderer icon={hs.icon || GUI_ICONS.action.entryDoor} className="w-5 h-5" />
                                    </div>
                                    <select
                                      value={hs.icon || GUI_ICONS.action.entryDoor}
                                      onChange={(e) =>
                                        handleUpdateHotspotInScene(hs.id, { icon: e.target.value })
                                      }
                                      className="bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                                    >
                                      {HOTSPOT_ICON_PRESETS.map((ic) => (
                                        <option key={ic.label} value={ic.url}>
                                          {ic.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      value={hs.label}
                                      onChange={(e) =>
                                        handleUpdateHotspotInScene(hs.id, { label: e.target.value })
                                      }
                                      className="bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md px-2.5 py-1 text-xs text-[var(--text)] font-bold outline-none transition-colors"
                                      placeholder="Enter hotspot button text here..."
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveHotspotFromScene(hs.id)}
                                      className="p-1.5 hover:bg-rose-500/20 text-[var(--muted2)] hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                      title="Delete hotspot"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  <div className="space-y-1">
                                    <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                                      Click Action:
                                    </label>
                                    <select
                                      value={hs.actionType}
                                      onChange={(e) =>
                                        handleUpdateHotspotInScene(hs.id, {
                                          actionType: e.target.value as any,
                                        })
                                      }
                                      className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                                    >
                                      <option value="jump_scene">Jump to another Scenario</option>
                                      <option value="inspect">Inspect / Examine object</option>
                                    </select>
                                  </div>

                                  {hs.actionType === 'jump_scene' ? (
                                    <div className="space-y-1">
                                      <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                                        Destination Scenario:
                                      </label>
                                      <select
                                        value={hs.targetSceneId || ''}
                                        onChange={(e) =>
                                          handleUpdateHotspotInScene(hs.id, {
                                            targetSceneId: e.target.value,
                                          })
                                        }
                                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--accent)] outline-none focus:border-[var(--accent)]"
                                      >
                                        {allScenarios.map((sc) => (
                                          <option key={sc.id} value={sc.id}>
                                            {sc.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">
                                        Inspection Text:
                                      </label>
                                      <input
                                        type="text"
                                        value={hs.inspectText || ''}
                                        onChange={(e) =>
                                          handleUpdateHotspotInScene(hs.id, {
                                            inspectText: e.target.value,
                                          })
                                        }
                                        placeholder="Enter inspection text here..."
                                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--muted)]">Click Sound:</span>
                                    <select
                                      value={hs.sfxUrl || ''}
                                      onChange={(e) =>
                                        handleUpdateHotspotInScene(hs.id, {
                                          sfxUrl: e.target.value || undefined,
                                        })
                                      }
                                      className="bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-1 text-xs text-[var(--text)] outline-none"
                                    >
                                      <option value="">Default (open folder)</option>
                                      <option value="/assets/sfx/open folder.mp3">Door / Folder</option>
                                      <option value="/assets/sfx/click intro.mp3">Console Beep</option>
                                      <option value="/assets/sfx/click interface.mp3">Light Click</option>
                                      <option value="/assets/sfx/corrupt file.mp3">Glitch / Error</option>
                                      <option value="/assets/sfx/success.mp3">Success</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAssetPickerConfig({
                                          filterType: 'sfx',
                                          onSelect: (asset) => {
                                            handleUpdateHotspotInScene(hs.id, { sfxUrl: asset.url });
                                            playSfx(asset.url, false, 0.6);
                                            notify(`SFX assigned to hotspot: ${asset.name}`);
                                          },
                                        })
                                      }
                                      className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                      title="Choose sound effect from Gallery"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3 h-3 text-[var(--accent)]" />
                                      <span>SFX</span>
                                    </button>
                                    {hs.sfxUrl && (
                                      <button
                                        type="button"
                                        onClick={() => playSfx(hs.sfxUrl!, false, 0.6)}
                                        className="text-xs text-[var(--accent)] hover:text-white px-2 py-0.5 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                                      >
                                        <GuiIconRenderer icon={GUI_ICONS.media.play} size={10} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span className="text-[var(--muted2)] font-bold">Corner:</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateHotspotInScene(hs.id, { xPercent: 10, yPercent: 15 })}
                                      className="px-2 py-0.5 bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded-lg border border-[var(--border)] text-[10px] cursor-pointer flex items-center justify-center"
                                      title="Top Left"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowUp} size={10} className="-rotate-45" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateHotspotInScene(hs.id, { xPercent: 80, yPercent: 15 })}
                                      className="px-2 py-0.5 bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded-lg border border-[var(--border)] text-[10px] cursor-pointer flex items-center justify-center"
                                      title="Top Right"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowUp} size={10} className="rotate-45" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateHotspotInScene(hs.id, { xPercent: 10, yPercent: 80 })}
                                      className="px-2 py-0.5 bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded-lg border border-[var(--border)] text-[10px] cursor-pointer flex items-center justify-center"
                                      title="Bottom Left"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowDown} size={10} className="rotate-45" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateHotspotInScene(hs.id, { xPercent: 80, yPercent: 80 })}
                                      className="px-2 py-0.5 bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded-lg border border-[var(--border)] text-[10px] cursor-pointer flex items-center justify-center"
                                      title="Bottom Right"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowDown} size={10} className="-rotate-45" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateHotspotInScene(hs.id, { xPercent: 45, yPercent: 48 })}
                                      className="px-2 py-0.5 bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded-lg border border-[var(--border)] text-[10px] cursor-pointer flex items-center justify-center"
                                      title="Center"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.action.target} size={11} className="text-[var(--accent)]" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a scenario from the left list to edit.
              </div>
            )}
          </main>

        </div>

      </div>

      {/* ASSET STUDIO MODAL PICKER (SFX, BGM, BACKGROUNDS) */}
      {assetPickerConfig && (
        <AssetStudioModal
          story={story}
          filterType={assetPickerConfig.filterType}
          onSelectAsset={(asset: VNAssetItem) => {
            assetPickerConfig.onSelect(asset);
            setAssetPickerConfig(null);
          }}
          onUpdateStoryCustomAssets={(updatedAssets) => {
            if (onUpdateStory) {
              onUpdateStory({ ...story, customAssets: updatedAssets });
            }
          }}
          onClose={() => setAssetPickerConfig(null)}
          notify={notify}
        />
      )}

      {/* ASSET STUDIO MODAL PICKER FOR BACKGROUNDS */}
      {showBgAssetPicker && (
        <AssetStudioModal
          story={story}
          filterType="background"
          onSelectAsset={(asset: VNAssetItem) => {
            handleUpdateCurrentScene({ backgroundUrl: asset.url });
            setShowBgAssetPicker(false);
            notify(`Background selected from gallery: ${asset.name}`);
          }}
          onUpdateStoryCustomAssets={(updatedAssets) => {
            if (onUpdateStory) {
              onUpdateStory({ ...story, customAssets: updatedAssets });
            }
          }}
          onClose={() => setShowBgAssetPicker(false)}
          notify={notify}
        />
      )}
    </div>
  );
}
