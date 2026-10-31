"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useVNMaker } from './VNMakerContext';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';

export default function VNMakerSceneTabs() {
  const {
    story,
    selectedChapterId,
    setSelectedChapterId,
    selectedSceneId,
    setSelectedSceneId,
    setSelectedLineIndex,
    currentChapter,
    draggedTimelineItem,
    dragOverSceneTabId,
    setDragOverSceneTabId,
    draggedSceneIndex,
    setDraggedSceneIndex,
    dragOverSceneIndex,
    setDragOverSceneIndex,
    handleMoveSceneTab,
    handleMoveLineBetweenScenes,
    setDraggedTimelineItem,
    handleAddScene,
    setActiveGlobalModal,
    isFullscreenWorkspace,
    toggleFullscreenWorkspace,
    setCurrentWorkspace,
  } = useVNMaker();

  const [isNewSceneOpen, setIsNewSceneOpen] = useState(false);
  const newSceneDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        newSceneDropdownRef.current &&
        !newSceneDropdownRef.current.contains(e.target as Node)
      ) {
        setIsNewSceneOpen(false);
      }
    };
    if (isNewSceneOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNewSceneOpen]);

  const isViewingGlobal =
    selectedChapterId === '__global__' ||
    Boolean(
      (story.scenarios || []).some((s) => s.id === selectedSceneId) &&
      !currentChapter?.scenes.some((s) => s.id === selectedSceneId)
    );

  const displayedScenes = isViewingGlobal
    ? story.scenarios || []
    : currentChapter?.scenes || [];

  return (
    <div className="h-11 border-b vn-glass-header px-4 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* LEFT: Chapter Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-[var(--muted)] uppercase font-bold shrink-0">
          {isViewingGlobal ? 'Reserve:' : 'Chapter:'}
        </span>
        <select
          value={isViewingGlobal ? '__global__' : selectedChapterId}
          onChange={(e) => {
            const chId = e.target.value;
            if (chId === '__global__') {
              const firstGlobal = story.scenarios?.[0];
              if (firstGlobal) {
                setSelectedSceneId(firstGlobal.id);
                setSelectedLineIndex(0);
              }
            } else {
              setSelectedChapterId(chId);
              const ch = story.chapters.find((c) => c.id === chId);
              const validStartScene = ch?.scenes.find((s) => s.id === ch.startSceneId);
              const targetScene = validStartScene || ch?.scenes[0];
              if (targetScene) {
                setSelectedSceneId(targetScene.id);
                setSelectedLineIndex(0);
              }
            }
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          }}
          className="bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-2.5 py-1 text-xs text-[var(--text)] font-bold outline-none cursor-pointer focus:border-[var(--accent)]"
        >
          <optgroup label="Chapters">
            {story.chapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title}
              </option>
            ))}
          </optgroup>
          {story.scenarios && story.scenarios.length > 0 && (
            <optgroup label="Project Library">
              <option value="__global__">
                📁 Global Reserve ({story.scenarios.length} scenes)
              </option>
            </optgroup>
          )}
        </select>

        {/* Chapter Settings Button */}
        <button
          onClick={() => {
            playSfx('/assets/sfx/open folder.mp3', false, 0.35);
            setActiveGlobalModal('chapter');
          }}
          className="h-7 px-2 rounded-md border border-[var(--border)] bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-purple-400 text-[var(--text)] text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
          title="Configure Chapter: Loading Screen, Episode Intro, End Screen & Scenes"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline font-mono text-[11px] font-bold">Chapter Settings</span>
        </button>
      </div>

      {/* CENTER: Scenario Tabs (Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs flex-1 custom-scrollbar min-w-0">
        {displayedScenes.length === 0 && (
          <span className="text-[11px] text-[var(--muted)] italic px-2">No scenarios found</span>
        )}
        {displayedScenes.map((sc, scIdx) => {
          const isActive = sc.id === selectedSceneId;
          const isDragOver = dragOverSceneIndex === scIdx;
          const isBeingDragged = draggedSceneIndex === scIdx;
          const isOpenedCrossSceneTarget = draggedTimelineItem !== null && sc.id === selectedSceneId;

          return (
            <div
              key={sc.id}
              draggable
              onDragStart={(e) => {
                if (draggedTimelineItem) {
                  e.preventDefault();
                  return;
                }
                setDraggedSceneIndex(scIdx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', sc.id);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => {
                if (draggedTimelineItem) {
                  if (sc.id !== selectedSceneId) {
                    setSelectedSceneId(sc.id);
                    setSelectedLineIndex(0);
                    setDragOverSceneTabId(sc.id);
                    playSfx('/assets/sfx/click intro.mp3', false, 0.15);
                  }
                } else if (draggedSceneIndex !== null && draggedSceneIndex !== scIdx) {
                  setDragOverSceneIndex(scIdx);
                }
              }}
              onDragLeave={() => {
                if (dragOverSceneTabId === sc.id) setDragOverSceneTabId(null);
                if (dragOverSceneIndex === scIdx) setDragOverSceneIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedTimelineItem && handleMoveLineBetweenScenes) {
                  handleMoveLineBetweenScenes(
                    draggedTimelineItem.sourceSceneId,
                    draggedTimelineItem.sourceLineIndex,
                    sc.id
                  );
                  setDraggedTimelineItem?.(null);
                } else if (draggedSceneIndex !== null && draggedSceneIndex !== scIdx) {
                  handleMoveSceneTab(draggedSceneIndex, scIdx);
                }
                setDraggedSceneIndex(null);
                setDragOverSceneIndex(null);
                setDragOverSceneTabId(null);
              }}
              onDragEnd={() => {
                setDraggedTimelineItem?.(null);
                setDraggedSceneIndex(null);
                setDragOverSceneIndex(null);
                setDragOverSceneTabId(null);
              }}
              onClick={() => {
                setSelectedSceneId(sc.id);
                setSelectedLineIndex(0);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`px-3 py-1.5 rounded-md border font-bold cursor-pointer shrink-0 flex items-center gap-1.5 transition-all text-xs ${
                isViewingGlobal
                  ? isActive
                    ? 'border-amber-500 bg-amber-600 text-white shadow-md'
                    : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'
                  : isActive
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-md'
                  : 'border-[var(--border)] bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)]'
              } ${isDragOver ? 'ring-2 ring-amber-400 scale-105' : ''} ${
                isBeingDragged ? 'opacity-40' : ''
              } ${isOpenedCrossSceneTarget ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-black' : ''}`}
            >
              {isOpenedCrossSceneTarget ? (
                <span className="text-emerald-300 font-extrabold flex items-center gap-1 animate-pulse">
                  <GuiIconRenderer icon={GUI_ICONS.general.load} className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{sc.name}</span>
                </span>
              ) : (
                <>
                  {sc.sceneType === 'event' && sc.eventSubtype === 'cinematic' ? (
                    <span className="truncate flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold">
                      <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{sc.name}</span>
                    </span>
                  ) : sc.sceneType === 'event' && sc.eventSubtype === 'static' ? (() => {
                    const purpose = sc.staticScreenConfig?.purpose;
                    let icon = GUI_ICONS.general.staticScreen;
                    let textClass = 'text-purple-700 dark:text-purple-300';
                    let iconClass = 'text-purple-400';

                    if (purpose === 'title') {
                      icon = GUI_ICONS.general.gameMenu;
                      textClass = 'text-emerald-700 dark:text-emerald-300';
                      iconClass = 'text-emerald-400';
                    } else if (purpose === 'intro') {
                      icon = GUI_ICONS.media.video;
                      textClass = 'text-sky-700 dark:text-sky-300';
                      iconClass = 'text-sky-400';
                    } else if (purpose === 'load_game') {
                      icon = GUI_ICONS.general.save;
                      textClass = 'text-cyan-700 dark:text-cyan-300';
                      iconClass = 'text-cyan-400';
                    } else if (purpose === 'settings') {
                      icon = GUI_ICONS.general.gear;
                      textClass = 'text-pink-700 dark:text-pink-300';
                      iconClass = 'text-pink-400';
                    } else if (purpose === 'gallery') {
                      icon = GUI_ICONS.general.gallery;
                      textClass = 'text-amber-700 dark:text-amber-300';
                      iconClass = 'text-amber-400';
                    } else if (purpose === 'death') {
                      icon = GUI_ICONS.general.dead;
                      textClass = 'text-red-700 dark:text-red-300';
                      iconClass = 'text-red-400';
                    }

                    return (
                      <span className={`truncate flex items-center gap-1.5 ${textClass} font-bold`}>
                        <GuiIconRenderer icon={icon} className={`w-3 h-3 ${iconClass} shrink-0`} />
                        <span>{sc.name}</span>
                      </span>
                    );
                  })() : (
                    <span className="truncate flex items-center gap-1.5">
                      <GuiIconRenderer
                        icon={isViewingGlobal ? GUI_ICONS.general.folder : GUI_ICONS.general.scenario}
                        className={`w-3 h-3 ${isViewingGlobal ? (isActive ? 'text-white' : 'text-amber-400') : 'text-gray-400'} shrink-0`}
                      />
                      <span>{sc.name}</span>
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* RIGHT: Fixed Navigation & Creation Action Group */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        {/* 1. View Map */}
        <button
          onClick={() => setActiveGlobalModal('scene_map')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer shrink-0 flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)] transition-all"
          title="Open interactive scene and branch map (Shortcut: M)"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.map} className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline">Map</span>
        </button>

        {/* 2. Menu Game Tool */}
        <button
          onClick={() => setCurrentWorkspace('menu_tool')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer shrink-0 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all"
          title="Open Menu Game Tool flow map"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gameMenu} className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Menu Tool</span>
        </button>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-0.5" />

        {/* 3. Dropdown Menu for '+ New Scene' */}
        <div className="relative" ref={newSceneDropdownRef}>
          <button
            onClick={() => setIsNewSceneOpen(!isNewSceneOpen)}
            className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 bg-[var(--accent)] hover:opacity-90 text-white transition-all shadow-xs active:scale-95"
            title="Create a new scenario, static screen or cinematic event"
          >
            <span>+ New Scene</span>
            <span className={`text-[9px] transition-transform ${isNewSceneOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isNewSceneOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-1.5 z-50 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95 duration-150">
              {/* + Scenario */}
              <button
                onClick={() => {
                  handleAddScene();
                  setIsNewSceneOpen(false);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                }}
                className="w-full p-2 rounded-lg flex items-center gap-2.5 hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-colors text-[var(--text)] group"
              >
                <div className="w-7 h-7 rounded-md bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                  +
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-[var(--text)]">+ Scenario</span>
                  <span className="text-[10px] text-[var(--muted)] truncate">Standard story & dialogue scene</span>
                </div>
              </button>

              <div className="h-[1px] bg-[var(--border)] my-0.5" />

              {/* + Static Screen */}
              <button
                onClick={() => {
                  handleAddScene(undefined, undefined, 'event', 'static');
                  setIsNewSceneOpen(false);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                }}
                className="w-full p-2 rounded-lg flex items-center gap-2.5 hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-colors text-[var(--text)] group"
              >
                <div className="w-7 h-7 rounded-md bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <GuiIconRenderer icon={GUI_ICONS.general.staticScreen} className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-purple-600 dark:text-purple-300">+ Static Screen</span>
                  <span className="text-[10px] text-[var(--muted)] truncate">Title, intro, load, settings or death</span>
                </div>
              </button>

              <div className="h-[1px] bg-[var(--border)] my-0.5" />

              {/* + Cinematic */}
              <button
                onClick={() => {
                  handleAddScene(undefined, undefined, 'event', 'cinematic');
                  setIsNewSceneOpen(false);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                }}
                className="w-full p-2 rounded-lg flex items-center gap-2.5 hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-colors text-[var(--text)] group"
              >
                <div className="w-7 h-7 rounded-md bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-4 h-4 text-sky-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-sky-600 dark:text-sky-300">+ Cinematic</span>
                  <span className="text-[10px] text-[var(--muted)] truncate">Multitrack video-editor sequencer</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)] mx-0.5" />

        {/* 4. Fullscreen Workspace Toggle (Far Right Corner Button) */}
        <button
          onClick={toggleFullscreenWorkspace}
          className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
            isFullscreenWorkspace
              ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
              : 'border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)]'
          }`}
          title={
            isFullscreenWorkspace
              ? "Exit Fullscreen: Show top header and navigation"
              : "Fullscreen Workspace: Hide top window for maximum editing space"
          }
        >
          <GuiIconRenderer
            icon={isFullscreenWorkspace ? GUI_ICONS.general.exitFullscreen : GUI_ICONS.general.fullscreen}
            className="w-3.5 h-3.5"
          />
          <span className="hidden sm:inline">
            {isFullscreenWorkspace ? 'Exit Full' : 'Fullscreen'}
          </span>
        </button>
      </div>
    </div>
  );
}
