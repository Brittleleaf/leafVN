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

  return (
    <div className="h-11 border-b vn-glass-header px-4 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* LEFT: Chapter Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-[var(--muted)] uppercase font-bold shrink-0">Chapter:</span>
        <select
          value={selectedChapterId}
          onChange={(e) => {
            const chId = e.target.value;
            setSelectedChapterId(chId);
            const ch = story.chapters.find((c) => c.id === chId);
            const validStartScene = ch?.scenes.find((s) => s.id === ch.startSceneId);
            const targetScene = validStartScene || ch?.scenes[0];
            if (targetScene) {
              setSelectedSceneId(targetScene.id);
              setSelectedLineIndex(0);
            }
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          }}
          className="bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs text-[var(--text)] font-bold outline-none cursor-pointer focus:border-[var(--accent)]"
        >
          {story.chapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.title}
            </option>
          ))}
        </select>
      </div>

      {/* CENTER: Scenario Tabs (Scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs flex-1 custom-scrollbar min-w-0">
        {currentChapter?.scenes.map((sc, scIdx) => {
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
              className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer shrink-0 flex items-center gap-1.5 transition-all text-xs ${
                isActive
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
                    <span className="truncate flex items-center gap-1.5 text-sky-300 font-bold">
                      <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{sc.name}</span>
                    </span>
                  ) : sc.sceneType === 'event' && sc.eventSubtype === 'static' ? (
                    <span className="truncate flex items-center gap-1.5 text-red-300 font-bold">
                      <GuiIconRenderer icon={GUI_ICONS.general.dead} className="w-3 h-3 text-red-400 shrink-0" />
                      <span>{sc.name}</span>
                    </span>
                  ) : (
                    <span className="truncate flex items-center gap-1.5">
                      <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3 h-3 text-gray-400 shrink-0" />
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
      <div className="flex items-center gap-2 shrink-0 pl-2">
        {/* 1. View Map */}
        <button
          onClick={() => setActiveGlobalModal('scene_map')}
          className="px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 border border-[var(--accent-border)] bg-[var(--accent-surface)] text-[var(--text)] hover:shadow-md transition-all shadow-sm active:scale-95"
          title="Open interactive scene and branch map (Shortcut: M)"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.map} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>View Map</span>
        </button>

        {/* 3. Dropdown Menu for '+ New Scene' */}
        <div className="relative" ref={newSceneDropdownRef}>
          <button
            onClick={() => setIsNewSceneOpen(!isNewSceneOpen)}
            className="px-3 py-1 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 border border-[var(--accent)] bg-[var(--accent)] hover:opacity-90 text-white transition-all shadow-md active:scale-95"
            title="Create a new scenario, static screen or cinematic event"
          >
            <span>+ New Scene</span>
            <span className={`text-[9px] transition-transform ${isNewSceneOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isNewSceneOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[#100c1e]/95 backdrop-blur-xl shadow-2xl p-2 z-50 flex flex-col gap-1.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              {/* + Scenario */}
              <button
                onClick={() => {
                  handleAddScene();
                  setIsNewSceneOpen(false);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-3 hover:bg-white/10 text-left cursor-pointer transition-colors text-[var(--text)] group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 transition-transform">
                  +
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-white">+ Scenario</span>
                  <span className="text-[10px] text-gray-400">Standard story & dialogue scene</span>
                </div>
              </button>

              {/* + Static Screen */}
              <button
                onClick={() => {
                  handleAddScene(undefined, undefined, 'event', 'static');
                  setIsNewSceneOpen(false);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-3 hover:bg-red-950/40 text-left cursor-pointer transition-colors text-[var(--text)] group"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GuiIconRenderer icon={GUI_ICONS.general.dead} className="w-4 h-4 text-red-300" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-red-300">+ Static Screen</span>
                  <span className="text-[10px] text-gray-400">Death, game over, or title card</span>
                </div>
              </button>

              {/* + Cinematic */}
              <button
                onClick={() => {
                  handleAddScene(undefined, undefined, 'event', 'cinematic');
                  setIsNewSceneOpen(false);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-3 hover:bg-sky-950/40 text-left cursor-pointer transition-colors text-[var(--text)] group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-4 h-4 text-sky-300" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-sky-300">+ Cinematic</span>
                  <span className="text-[10px] text-gray-400">Multitrack video-editor sequencer</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 4. Fullscreen Workspace Toggle (Far Right Corner Button) */}
        <button
          onClick={toggleFullscreenWorkspace}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5 border transition-all shadow-sm active:scale-95 ${
            isFullscreenWorkspace
              ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900 shadow-[0_0_12px_rgba(34,211,238,0.4)] animate-pulse'
              : 'border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)]'
          }`}
          title={
            isFullscreenWorkspace
              ? "Exit Fullscreen: Show top header and navigation"
              : "Fullscreen Workspace: Hide top window for maximum editing space"
          }
        >
          <span className="text-sm">{isFullscreenWorkspace ? '🗗' : '⛶'}</span>
          <span className="hidden sm:inline">
            {isFullscreenWorkspace ? 'Exit Full' : 'Fullscreen'}
          </span>
        </button>
      </div>
    </div>
  );
}
