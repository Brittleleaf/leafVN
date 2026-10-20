"use client";
import React, { useRef, useEffect, useMemo } from 'react';
import { VNScene, VNStory, VNEvent, VNScreenFxType } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import { SCREEN_FX_CONFIGS } from './VNScreenFxOverlay';
import { VN_CURSORS_MAP } from './cursors';

export interface DraggedTimelineItem {
  sourceSceneId: string;
  sourceLineIndex: number;
  event: VNEvent;
}

const FX_THREAD_COLORS: Record<string, { border: string; bg: string; glow: string; text: string; bgTint: string }> = {
  red_alert: { border: 'border-rose-500', bg: 'bg-rose-500', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.7)]', text: 'text-rose-700 dark:text-rose-300 font-bold', bgTint: 'bg-rose-500/8 dark:bg-rose-950/20' },
  white_strobe: { border: 'border-amber-400', bg: 'bg-amber-400', glow: 'shadow-[0_0_8px_rgba(252,211,77,0.7)]', text: 'text-amber-800 dark:text-amber-300 font-bold', bgTint: 'bg-amber-500/8 dark:bg-amber-950/20' },
  black_vignette: { border: 'border-slate-500', bg: 'bg-slate-500', glow: 'shadow-[0_0_8px_rgba(100,116,139,0.7)]', text: 'text-slate-800 dark:text-zinc-300 font-bold', bgTint: 'bg-slate-500/8 dark:bg-zinc-950/20' },
  vignette: { border: 'border-slate-500', bg: 'bg-slate-500', glow: 'shadow-[0_0_8px_rgba(100,116,139,0.7)]', text: 'text-slate-800 dark:text-zinc-300 font-bold', bgTint: 'bg-slate-500/8 dark:bg-zinc-950/20' },
  digital_glitch: { border: 'border-cyan-500', bg: 'bg-cyan-500', glow: 'shadow-[0_0_8px_rgba(6,182,212,0.7)]', text: 'text-cyan-800 dark:text-cyan-300 font-bold', bgTint: 'bg-cyan-500/8 dark:bg-cyan-950/20' },
  heartbeat: { border: 'border-rose-600', bg: 'bg-rose-600', glow: 'shadow-[0_0_8px_rgba(225,29,72,0.7)]', text: 'text-rose-800 dark:text-rose-300 font-bold', bgTint: 'bg-rose-500/8 dark:bg-rose-950/20' },
  screen_rumble: { border: 'border-amber-600', bg: 'bg-amber-600', glow: 'shadow-[0_0_8px_rgba(217,119,6,0.7)]', text: 'text-amber-800 dark:text-amber-300 font-bold', bgTint: 'bg-amber-500/8 dark:bg-amber-950/20' },
  warm_golden: { border: 'border-amber-500', bg: 'bg-amber-500', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.7)]', text: 'text-amber-800 dark:text-amber-300 font-bold', bgTint: 'bg-amber-500/8 dark:bg-amber-950/20' },
  cinema_grain: { border: 'border-purple-500', bg: 'bg-purple-500', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.7)]', text: 'text-purple-800 dark:text-purple-300 font-bold', bgTint: 'bg-purple-500/8 dark:bg-purple-950/20' },
  crt_tv: { border: 'border-orange-500', bg: 'bg-orange-500', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.7)]', text: 'text-orange-800 dark:text-orange-300 font-bold', bgTint: 'bg-orange-500/8 dark:bg-orange-950/20' },
  cctv_monitor: { border: 'border-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.7)]', text: 'text-emerald-800 dark:text-emerald-300 font-bold', bgTint: 'bg-emerald-500/8 dark:bg-emerald-950/20' },
  flashlight: { border: 'border-yellow-500', bg: 'bg-yellow-500', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.7)]', text: 'text-yellow-800 dark:text-yellow-300 font-bold', bgTint: 'bg-yellow-500/8 dark:bg-yellow-950/20' },
  code_flythrough: { border: 'border-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.7)]', text: 'text-emerald-800 dark:text-emerald-300 font-bold', bgTint: 'bg-emerald-500/8 dark:bg-emerald-950/20' },
};

import { useVNMaker } from './VNMakerContext';

export interface VNMakerTimelineProps {
  currentScene?: VNScene | undefined;
  selectedLineIndex?: number;
  timelineFilter?: string;
  setTimelineFilter?: (f: string) => void;
  setShowAddActionModal?: (show: boolean) => void;
  handleInsertEvent?: (type: any) => void;
  handleMoveLine?: (fromIndex: number, toIndex: number) => void;
  handleDuplicateLine?: (index: number) => void;
  handleDeleteLine?: (index: number) => void;
  setSelectedLineIndex?: (index: number) => void;
  draggedTimelineIndex?: number | null;
  setDraggedTimelineIndex?: (idx: number | null) => void;
  dragOverTimelineIndex?: number | null;
  setDragOverTimelineIndex?: (idx: number | null) => void;
  setDragOverSceneTabId?: (id: string | null) => void;
  draggedTimelineItem?: DraggedTimelineItem | null;
  setDraggedTimelineItem?: (item: DraggedTimelineItem | null) => void;
  handleMoveLineBetweenScenes?: (
    fromSceneId: string,
    fromIndex: number,
    toSceneId: string,
    toIndex?: number
  ) => void;
  handleDragCancel?: () => void;
  story?: VNStory;
  timelineFxStatus?: {
    activeMap: Map<string, { type: VNScreenFxType; pairId?: string; intensity?: 'light' | 'medium' | 'heavy' }>;
    pairsMap: Map<string, { startIdx: number; endIdx: number; startId: string; endId: string }>;
  };
  incomingJumpsByEventId?: Record<string, { choiceIndex: number; optionLabel: string }[]>;
  incomingJumpsByIndex?: Record<number, { choiceIndex: number; optionLabel: string }[]>;
  getDisplayAssetName?: (url: string | undefined) => string;
  editorTheme?: string;
}

export default function VNMakerTimeline(props: VNMakerTimelineProps) {
  let context: ReturnType<typeof useVNMaker> | null = null;
  try {
    context = useVNMaker();
  } catch {
    // context not available if used outside provider
  }

  const currentScene = props.currentScene ?? context?.currentScene;
  const selectedLineIndex = props.selectedLineIndex ?? context?.selectedLineIndex ?? 0;
  const timelineFilter = props.timelineFilter ?? context?.timelineFilter ?? '';
  const setTimelineFilter = props.setTimelineFilter ?? context?.setTimelineFilter ?? (() => {});
  const setShowAddActionModal = props.setShowAddActionModal ?? context?.setShowAddActionModal ?? (() => {});
  const handleInsertEvent = props.handleInsertEvent ?? context?.handleInsertEvent ?? (() => {});
  const handleMoveLine = props.handleMoveLine ?? context?.handleMoveLine ?? (() => {});
  const handleDuplicateLine = props.handleDuplicateLine ?? context?.handleDuplicateLine ?? (() => {});
  const handleDeleteLine = props.handleDeleteLine ?? context?.handleDeleteLine ?? (() => {});
  const setSelectedLineIndex = props.setSelectedLineIndex ?? context?.setSelectedLineIndex ?? (() => {});
  const draggedTimelineIndex = props.draggedTimelineIndex !== undefined ? props.draggedTimelineIndex : (context?.draggedTimelineIndex ?? null);
  const setDraggedTimelineIndex = props.setDraggedTimelineIndex ?? context?.setDraggedTimelineIndex ?? (() => {});
  const dragOverTimelineIndex = props.dragOverTimelineIndex !== undefined ? props.dragOverTimelineIndex : (context?.dragOverTimelineIndex ?? null);
  const setDragOverTimelineIndex = props.setDragOverTimelineIndex ?? context?.setDragOverTimelineIndex ?? (() => {});
  const setDragOverSceneTabId = props.setDragOverSceneTabId ?? context?.setDragOverSceneTabId ?? (() => {});
  const draggedTimelineItem = props.draggedTimelineItem !== undefined ? props.draggedTimelineItem : (context?.draggedTimelineItem ?? null);
  const setDraggedTimelineItem = props.setDraggedTimelineItem ?? context?.setDraggedTimelineItem ?? (() => {});
  const handleMoveLineBetweenScenes = props.handleMoveLineBetweenScenes ?? context?.handleMoveLineBetweenScenes;
  const handleDragCancel = props.handleDragCancel ?? context?.handleDragCancel ?? (() => {});
  const story = props.story ?? context?.story;
  const timelineFxStatus = props.timelineFxStatus ?? context?.timelineFxStatus ?? { activeMap: new Map(), pairsMap: new Map() };
  const incomingJumpsByEventId = props.incomingJumpsByEventId ?? context?.incomingJumpsByEventId ?? {};
  const incomingJumpsByIndex = props.incomingJumpsByIndex ?? context?.incomingJumpsByIndex ?? {};
  const getDisplayAssetName = props.getDisplayAssetName ?? context?.getDisplayAssetName ?? ((u) => u || '');
  const editorTheme = props.editorTheme ?? context?.editorTheme ?? 'default_dark';
  const dropHandledRef = useRef<boolean>(false);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  const allAvailableScenes = useMemo(() => {
    if (!story || !Array.isArray(story.chapters)) return [];
    const chapterScenes = story.chapters.flatMap((c) => (Array.isArray(c?.scenes) ? c.scenes : []));
    const reserveScenes = Array.isArray(story.scenarios) ? story.scenarios : [];
    return [...chapterScenes, ...reserveScenes];
  }, [story?.chapters, story?.scenarios]);

  // Auto-scroll timeline smoothly to keep selected event visible
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedLineIndex]);

  if (!currentScene || !story) {
    return null;
  }

  const handleDropAtSlot = (targetSlot: number) => {
    dropHandledRef.current = true;
    if (!currentScene) return;

    if (draggedTimelineItem) {
      if (draggedTimelineItem.sourceSceneId === currentScene.id) {
        const fromIdx = draggedTimelineItem.sourceLineIndex;
        if (targetSlot !== fromIdx && targetSlot !== fromIdx + 1) {
          const toIdx = fromIdx < targetSlot ? targetSlot - 1 : targetSlot;
          handleMoveLine(fromIdx, toIdx);
        }
      } else if (handleMoveLineBetweenScenes) {
        handleMoveLineBetweenScenes(
          draggedTimelineItem.sourceSceneId,
          draggedTimelineItem.sourceLineIndex,
          currentScene.id,
          targetSlot
        );
      }
    } else if (draggedTimelineIndex !== null) {
      const fromIdx = draggedTimelineIndex;
      if (targetSlot !== fromIdx && targetSlot !== fromIdx + 1) {
        const toIdx = fromIdx < targetSlot ? targetSlot - 1 : targetSlot;
        handleMoveLine(fromIdx, toIdx);
      }
    }

    setDraggedTimelineItem?.(null);
    setDraggedTimelineIndex(null);
    setDragOverTimelineIndex(null);
    setDragOverSceneTabId(null);
  };

  const renderDropSlot = (slotIndex: number, label: string) => {
    const isDraggingActive = Boolean(draggedTimelineItem || draggedTimelineIndex !== null);
    const currentDraggedIdx =
      draggedTimelineItem && currentScene && draggedTimelineItem.sourceSceneId === currentScene.id
        ? draggedTimelineItem.sourceLineIndex
        : draggedTimelineIndex;
    const isSelfSlot =
      currentDraggedIdx !== null &&
      (slotIndex === currentDraggedIdx || slotIndex === currentDraggedIdx + 1);
    const isSlotActive = isDraggingActive && dragOverTimelineIndex === slotIndex && !isSelfSlot;
    const isCrossScene = Boolean(
      draggedTimelineItem && draggedTimelineItem.sourceSceneId !== currentScene?.id
    );

    return (
      <div
        key={`drop-slot-${slotIndex}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          if (dragOverTimelineIndex !== slotIndex) {
            setDragOverTimelineIndex(slotIndex);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDropAtSlot(slotIndex);
        }}
        className={`transition-all duration-200 ease-out overflow-hidden flex items-center justify-center select-none ${
          isSlotActive
            ? 'h-11 my-1.5 opacity-100 scale-100'
            : 'h-0 my-0 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div
          className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm ${
            isCrossScene
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
              : 'border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--accent)]'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.download} className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-80 md:w-96 xl:w-[420px] shrink-0 border-r flex flex-col overflow-hidden transition-colors vn-glass-panel select-none"
    >
      <div
        className="p-2.5 border-b border-[var(--border)] space-y-2 shrink-0 transition-colors vn-glass-header"
      >
        {/* Header Row: Title & Counter on Left, Clean Primary Button on Right */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-[var(--accent-surface)] border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5 text-[var(--accent)]" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider whitespace-nowrap">
                Timeline
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--well-bg)] border border-[var(--border)] text-[10px] font-mono text-[var(--accent)] font-bold shrink-0">
                {currentScene?.timeline?.length || 0}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAddActionModal(true)}
            className="h-7 px-3 rounded-lg bg-[var(--accent)] hover:opacity-90 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm shrink-0 whitespace-nowrap"
            title="Add event or dialogue line to scenario (Insert)"
          >
            <span className="text-sm leading-none">+</span>
            <span>Add Event</span>
          </button>
        </div>

        {/* Search Bar with dedicated Search Icon */}
        <div className="relative flex items-center">
          <div className="absolute left-2.5 pointer-events-none text-[var(--muted2)] flex items-center">
            <GuiIconRenderer icon={GUI_ICONS.action.search} className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Filter by text or character..."
            value={timelineFilter}
            onChange={(e) => setTimelineFilter(e.target.value)}
            className="w-full h-7 pl-8 pr-7 bg-[var(--well-bg)] border border-[var(--border)] hover:border-[var(--border2)] rounded-lg text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          {timelineFilter && (
            <button
              onClick={() => setTimelineFilter('')}
              className="absolute right-2 text-xs text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
              title="Clear filter"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Shortcuts Ribbon: Sleek, compact and evenly distributed */}
        <div className="flex items-center justify-between text-[10px] text-[var(--muted2)] font-mono px-1 pt-0.5 select-none">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--well-bg)] border border-[var(--border)] rounded text-[9px] font-bold">↑↓</kbd>
            <span>Nav</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--well-bg)] border border-[var(--border)] rounded text-[9px] font-bold">Ctrl+D</kbd>
            <span>Dup</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--well-bg)] border border-[var(--border)] rounded text-[9px] font-bold">Del</kbd>
            <span>Delete</span>
          </span>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (e.target === e.currentTarget && currentScene?.timeline) {
            if (dragOverTimelineIndex !== currentScene.timeline.length) {
              setDragOverTimelineIndex(currentScene.timeline.length);
            }
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverTimelineIndex(null);
          }
        }}
        onDrop={(e) => {
          if (e.target === e.currentTarget && currentScene?.timeline) {
            e.preventDefault();
            handleDropAtSlot(currentScene.timeline.length);
          }
        }}
        className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar"
      >
        {(!currentScene?.timeline || currentScene.timeline.length === 0) ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedTimelineItem && currentScene && handleMoveLineBetweenScenes) {
                dropHandledRef.current = true;
                handleMoveLineBetweenScenes(
                  draggedTimelineItem.sourceSceneId,
                  draggedTimelineItem.sourceLineIndex,
                  currentScene.id,
                  0
                );
                setDraggedTimelineItem?.(null);
                setDraggedTimelineIndex(null);
                setDragOverTimelineIndex(null);
                setDragOverSceneTabId(null);
              }
            }}
            className={`text-center py-12 px-4 border border-dashed rounded-xl space-y-3 transition-all ${
              draggedTimelineItem
                ? 'border-emerald-400 bg-emerald-950/30 text-emerald-200 ring-2 ring-emerald-500/50 animate-pulse'
                : 'border-[var(--border)]'
            }`}
          >
            <div className="flex justify-center">
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-8 h-8 opacity-40 text-[var(--muted2)]" />
            </div>
            <p className="text-xs text-[var(--muted)]">
              {draggedTimelineItem ? 'Drop dialogue here as first line of this scenario!' : 'This scene is empty.'}
            </p>
            {!draggedTimelineItem && (
              <button
                onClick={() => setShowAddActionModal(true)}
                className="px-3.5 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-fg,#000)] rounded-xl text-xs uppercase font-extrabold cursor-pointer transition-all shadow-sm"
              >
                + Add First Event
              </button>
            )}
          </div>
        ) : (
          <>
            {renderDropSlot(
              0,
              draggedTimelineItem && draggedTimelineItem.sourceSceneId !== currentScene.id
                ? 'Insert dialogue at beginning (Position #1)'
                : 'Move dialogue to beginning (Position #1)'
            )}

            {currentScene.timeline.map((line, idx) => {
              const isSelected = idx === selectedLineIndex;
              const isBeingDragged =
                (draggedTimelineItem?.sourceSceneId === currentScene.id && draggedTimelineItem?.sourceLineIndex === idx) ||
                draggedTimelineIndex === idx;
              const isCrossSceneDrag = Boolean(
                draggedTimelineItem && draggedTimelineItem.sourceSceneId !== currentScene.id
              );
              const speaker = story.characters.find((c) => c.id === line.characterId);

              // Visual filtering
              const query = timelineFilter.toLowerCase();
              const matchesFilter =
                !timelineFilter ||
                (line.text && line.text.toLowerCase().includes(query)) ||
                (line.prompt && line.prompt.toLowerCase().includes(query)) ||
                (line.type && line.type.toLowerCase().includes(query)) ||
                (line.cursorType && line.cursorType.toLowerCase().includes(query)) ||
                (speaker && speaker.name.toLowerCase().includes(query)) ||
                (line.condition?.variableKey && line.condition.variableKey.toLowerCase().includes(query)) ||
                (line.variableMutation?.key && line.variableMutation.key.toLowerCase().includes(query)) ||
                (line.loadingTitle && line.loadingTitle.toLowerCase().includes(query)) ||
                (line.backgroundUrl && line.backgroundUrl.toLowerCase().includes(query)) ||
                (line.audioUrl && line.audioUrl.toLowerCase().includes(query)) ||
                (line.sfx && line.sfx.toLowerCase().includes(query));

              if (!matchesFilter) return null;

              // Incoming jumps targeting this line
              const incoming = [
                ...(incomingJumpsByEventId[line.id] || []),
                ...(incomingJumpsByIndex[idx] || []),
              ];

              const isInsideFx = timelineFxStatus.activeMap.get(line.id);
              const isFxStart = line.type === 'fx_start';
              const isFxEnd = line.type === 'fx_end';
              const fxStartPair = isFxStart ? timelineFxStatus.pairsMap.get(line.fxPairId || '') : null;
              const fxEndPair = isFxEnd ? timelineFxStatus.pairsMap.get(line.fxPairId || '') : null;
              const screenFxCfg = SCREEN_FX_CONFIGS[line.fxType || 'red_alert'] || SCREEN_FX_CONFIGS.red_alert;
              const activeFxType = isFxStart ? line.fxType : isFxEnd ? line.fxType : isInsideFx?.type;
              const threadColor = FX_THREAD_COLORS[activeFxType || 'red_alert'] || FX_THREAD_COLORS.red_alert;

              return (
                <React.Fragment key={line.id}>
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      dropHandledRef.current = false;
                      e.dataTransfer.setData('text/plain', String(idx));
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedTimelineIndex(idx);
                      if (setDraggedTimelineItem && currentScene) {
                        setDraggedTimelineItem({
                          sourceSceneId: currentScene.id,
                          sourceLineIndex: idx,
                          event: line,
                        });
                      }
                      playSfx('/assets/sfx/click intro.mp3', false, 0.15);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const slot = relY < rect.height / 2 ? idx : idx + 1;
                      if (dragOverTimelineIndex !== slot) {
                        setDragOverTimelineIndex(slot);
                      }
                    }}
                    onDragEnd={() => {
                      if (!dropHandledRef.current && handleDragCancel) {
                        handleDragCancel();
                      }
                      setDraggedTimelineItem?.(null);
                      setDraggedTimelineIndex(null);
                      setDragOverTimelineIndex(null);
                      setDragOverSceneTabId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const slot = relY < rect.height / 2 ? idx : idx + 1;
                      handleDropAtSlot(slot);
                    }}
                    onClick={() => {
                      setSelectedLineIndex(idx);
                      playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                    }}
                    ref={isSelected ? selectedItemRef : undefined}
                    className={`p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all duration-200 ease-out relative group select-none ${
                      isBeingDragged
                        ? 'opacity-30 scale-[0.98] border-dashed border-[var(--accent)] bg-[var(--accent-surface)] shadow-none'
                        : isSelected
                        ? isFxStart
                          ? 'border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.3)] text-[var(--text)]'
                          : isFxEnd
                          ? 'border-slate-500 bg-slate-500/15 ring-1 ring-slate-500/70 shadow-[0_0_20px_rgba(161,161,170,0.25)] text-[var(--text)]'
                          : 'border-[var(--accent)] bg-[var(--accent-surface)] shadow-[0_10px_25px_var(--accent-glow)] ring-1 ring-[var(--accent)]/50 text-[var(--text)]'
                        : isFxStart
                        ? 'border-rose-500/50 bg-rose-500/10 hover:border-rose-500 text-[var(--text)]'
                        : isFxEnd
                        ? 'border-slate-500/50 bg-slate-500/10 hover:border-slate-400 text-[var(--text)]'
                        : isInsideFx
                        ? `border-[var(--border)] border-l-2 ${threadColor.border} ${threadColor.bgTint} hover:border-[var(--border2)] text-[var(--text)]`
                        : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border2)] hover:bg-[var(--btn-hover-bg)] hover:-translate-y-0.5 shadow-sm text-[var(--text)]'
                    } ${isInsideFx && !isFxStart && !isFxEnd ? 'ml-6' : 'ml-0'}`}
                  >
                    {/* Visual scope thread indicator for items inside FX */}
                    {isInsideFx && !isFxStart && !isFxEnd && (
                      <div
                        className={`absolute -left-3.5 -top-2 -bottom-2 w-[3px] rounded-full ${threadColor.bg} ${threadColor.glow} pointer-events-none z-10`}
                      />
                    )}

                    {/* Bracket hook at bottom of Start FX */}
                    {isFxStart && fxStartPair && (
                      <div className="absolute -bottom-3 left-4 pointer-events-none z-10 flex items-center">
                        <div className={`w-3.5 h-3.5 border-l-[3px] border-b-[3px] rounded-bl-sm ${threadColor.border} ${threadColor.glow}`} />
                      </div>
                    )}

                    {/* Bracket hook at top of End FX */}
                    {isFxEnd && fxEndPair && (
                      <div className="absolute -top-3 left-4 pointer-events-none z-10 flex items-center">
                        <div className={`w-3.5 h-3.5 border-l-[3px] border-t-[3px] rounded-tl-sm ${threadColor.border} ${threadColor.glow}`} />
                      </div>
                    )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Drag handle */}
                    <span
                      className="cursor-grab active:cursor-grabbing text-[var(--muted2)] hover:text-[var(--text)] select-none text-xs tracking-tighter px-0.5"
                      title="Drag to move up or down"
                    >
                      ⠿
                    </span>

                    <span className="text-xs font-mono font-bold text-[var(--muted)] pt-0.5">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>

                    {isFxStart ? (
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-center gap-1.5 shadow-sm">
                        <GuiIconRenderer icon={screenFxCfg.icon} className="w-3 h-3" />
                        <span>FX START: {screenFxCfg.label}</span>
                      </span>
                    ) : isFxEnd ? (
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-slate-500/15 border border-slate-500/40 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-sm">
                        <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                        <span>FX END: {screenFxCfg.label}</span>
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          line.type === 'dialogue'
                            ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                            : line.type === 'choice'
                            ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30'
                            : line.type === 'jump_scene'
                            ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30'
                            : line.type === 'loading_screen'
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : line.type === 'conditional_branch'
                            ? 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30'
                            : line.type === 'mutate_variable'
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : line.type === 'bg_change'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                            : line.type === 'bgm' || line.type === 'sfx'
                            ? 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border border-violet-500/30'
                            : line.type === 'shake'
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                            : line.type === 'flash'
                            ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                            : line.type === 'cursor_change'
                            ? 'bg-pink-500/15 text-pink-800 dark:text-pink-300 border border-pink-500/30'
                            : 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {line.type.replace('_', ' ')}
                      </span>
                    )}

                    {isInsideFx && !isFxStart && !isFxEnd && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono border flex items-center gap-1 shrink-0 ${threadColor.border} ${threadColor.text} bg-[var(--well-bg)] shadow-sm`}
                        title="This dialogue line is inside the active loop screen effect"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-2.5 h-2.5 text-purple-400" />
                        <span>FX: {SCREEN_FX_CONFIGS[isInsideFx.type as VNScreenFxType]?.label || isInsideFx.type}</span>
                      </span>
                    )}

                    {line.type === 'dialogue' && speaker && (
                      <span className="font-bold text-xs" style={{ color: speaker.color }}>
                        {speaker.name}
                      </span>
                    )}

                    {line.type === 'dialogue' && line.cursorType && (
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-pink-500/15 border border-pink-500/40 text-pink-800 dark:text-pink-300 flex items-center gap-1 shrink-0"
                        title={`Line cursor override: ${line.cursorType} (${line.cursorMode || 'dialogue_only'})`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-2.5 h-2.5 text-pink-400" />
                        <span>{VN_CURSORS_MAP[line.cursorType]?.name || line.cursorType}</span>
                        {line.cursorMode === 'persistent' && (
                          <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-2 h-2 opacity-75" />
                        )}
                      </span>
                    )}

                    {line.emotion && (
                      <span className="text-[10px] text-[var(--muted)] font-mono font-semibold">[{line.emotion}]</span>
                    )}

                    {line.sfx && (
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shrink-0"
                        title={`SFX: ${line.sfx}`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                        <span className="truncate max-w-[80px]">{getDisplayAssetName(line.sfx)}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick line toolbar on hover or active */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLine(idx, idx - 1);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded text-[10px] disabled:opacity-20 cursor-pointer shadow-sm"
                      title="Move line up in timeline (ArrowUp)"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === currentScene.timeline.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveLine(idx, idx + 1);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded text-[10px] disabled:opacity-20 cursor-pointer shadow-sm"
                      title="Move line down in timeline (ArrowDown)"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateLine(idx);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded text-[10px] cursor-pointer shadow-sm"
                      title="Duplicate this line (Ctrl+D)"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3 text-[var(--text)]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLine(idx);
                      }}
                      className="w-5 h-5 flex items-center justify-center bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-400 rounded text-[10px] cursor-pointer shadow-sm"
                      title="Delete this line (Delete)"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-[var(--text)] font-medium line-clamp-2 leading-relaxed">
                  {line.type === 'dialogue' ? (
                    line.text || '...'
                  ) : line.type === 'choice' ? (
                    <span className="flex items-center gap-1">
                      <GuiIconRenderer icon={GUI_ICONS.general.question} className="w-3.5 h-3.5" />
                      <span>{line.prompt}</span>
                    </span>
                  ) : isFxStart ? (
                    <div className="flex flex-col gap-1 text-[11px] font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                          <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-2.5 h-2.5 text-rose-400" />
                          <span>Continuous loop: {screenFxCfg.label}</span>
                        </span>
                        <span>•</span>
                        <span className="text-[var(--text)] font-medium">Fade In: {line.fxFadeInSeconds ?? 1}s</span>
                        <span>•</span>
                        <span className="text-[var(--text)] font-medium">Intensity: {line.fxIntensity || 'medium'}</span>
                        {line.fxLoopAudioUrl && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                              <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                              <span>Audio: {getDisplayAssetName(line.fxLoopAudioUrl)}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] font-mono">
                        {fxStartPair ? (
                          fxStartPair.endIdx > idx + 1 ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              ✓ Encloses lines #{idx + 2}–#{fxStartPair.endIdx} (Ends at #{fxStartPair.endIdx + 1})
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-bold">
                              ✓ Empty scope • Immediately ends at #{fxStartPair.endIdx + 1}
                            </span>
                          )
                        ) : (
                          <span className="text-red-700 dark:text-red-400 font-bold flex items-center gap-1.5">
                            <GuiIconRenderer icon={GUI_ICONS.general.hazard} className="w-3 h-3 text-red-500" />
                            <span>Missing linked End node in this chapter</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : isFxEnd ? (
                    <div className="flex flex-col gap-1 text-[11px] font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                          <span>Continuous loop end</span>
                        </span>
                        <span>•</span>
                        <span className="text-[var(--text)] font-medium">Fade Out: {line.fxFadeOutSeconds ?? 1}s</span>
                      </div>
                      <div className="text-[10px] font-mono">
                        {fxEndPair ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            ✓ Closes FX started at line #{fxEndPair.startIdx + 1}
                          </span>
                        ) : (
                          <span className="text-red-700 dark:text-red-400 font-bold flex items-center gap-1.5">
                            <GuiIconRenderer icon={GUI_ICONS.general.hazard} className="w-3 h-3 text-red-500" />
                            <span>No linked start node</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : line.type === 'cursor_change' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-pink-600 dark:text-pink-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3 h-3 text-pink-400" />
                        <span>In-Game Cursor:</span>
                      </span>
                      <span className="text-[var(--text)] font-semibold">
                        {VN_CURSORS_MAP[line.cursorType || 'palimpsest_dot']?.name || line.cursorType || 'Default'}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        • {line.cursorMode === 'dialogue_only' ? 'Single dialogue step' : 'Persistent until changed'}
                      </span>
                    </div>
                  ) : line.type === 'jump_scene' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.map} className="w-3 h-3 text-cyan-400" />
                        <span>Jump to Scenario:</span>
                      </span>
                      <span className="text-[var(--text)] font-bold">
                        {allAvailableScenes.find((s) => s.id === line.targetSceneId)?.name || line.targetSceneId || '(No scenario selected)'}
                      </span>
                    </div>
                  ) : line.type === 'loading_screen' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-3 h-3 text-amber-400" />
                        <span>Loading Screen:</span>
                      </span>
                      <span className="text-[var(--text)] font-semibold">
                        "{line.loadingTitle || 'ACCESSING DATA...'}"
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        • {line.durationMs || 2500}ms
                      </span>
                    </div>
                  ) : line.type === 'conditional_branch' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-3 h-3 text-indigo-400" />
                        <span>Branch:</span>
                      </span>
                      <span className="text-[var(--text)] font-semibold">
                        IF {line.condition?.variableKey || 'var'} {line.condition?.operator || '=='} {String(line.condition?.value ?? true)}
                      </span>
                      {line.conditionalTargetSceneId && (
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                          ➔ {allAvailableScenes.find((s) => s.id === line.conditionalTargetSceneId)?.name || line.conditionalTargetSceneId}
                        </span>
                      )}
                      {line.elseTargetSceneId && (
                        <span className="text-amber-600 dark:text-amber-400 text-[10px]">
                          ELSE ➔ {allAvailableScenes.find((s) => s.id === line.elseTargetSceneId)?.name || line.elseTargetSceneId}
                        </span>
                      )}
                    </div>
                  ) : line.type === 'mutate_variable' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-3 h-3 text-amber-400" />
                        <span>Mutate Variable:</span>
                      </span>
                      <span className="text-[var(--text)] font-bold">
                        {line.variableMutation?.key || 'variable'} {line.variableMutation?.operation || '='} {String(line.variableMutation?.value ?? '')}
                      </span>
                    </div>
                  ) : line.type === 'bg_change' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.image} className="w-3 h-3 text-emerald-400" />
                        <span>Background:</span>
                      </span>
                      <span className="text-[var(--text)] font-semibold truncate max-w-[280px]">
                        {getDisplayAssetName(line.backgroundUrl) || line.backgroundUrl || 'No image'}
                      </span>
                    </div>
                  ) : line.type === 'bgm' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3 h-3 text-purple-400" />
                        <span>BGM:</span>
                      </span>
                      <span className="text-[var(--text)] font-semibold truncate max-w-[240px]">
                        {getDisplayAssetName(line.audioUrl) || line.audioUrl || 'No track'}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        • Vol: {Math.round((line.audioVolume ?? 0.5) * 100)}%
                      </span>
                    </div>
                  ) : line.type === 'sfx' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3 h-3 text-emerald-400" />
                        <span>SFX:</span>
                      </span>
                      <span className="text-[var(--text)] font-semibold truncate max-w-[280px]">
                        {getDisplayAssetName(line.audioUrl) || line.audioUrl || 'No sound'}
                      </span>
                    </div>
                  ) : line.type === 'shake' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">Screen Shake:</span>
                      <span className="text-[var(--text)] font-semibold uppercase">{line.shakeIntensity || 'medium'} intensity</span>
                    </div>
                  ) : line.type === 'flash' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">Screen Flash:</span>
                      <span className="text-[var(--text)] font-semibold">{line.flashColor || 'white'} ({line.durationMs || 500}ms)</span>
                    </div>
                  ) : (
                    `Effect: ${line.type}`
                  )}
                </div>

                {/* Branch Badges / Choice Targets */}
                {line.type === 'choice' && line.options && line.options.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-purple-900/30 text-[10px]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">
                      Branches for this choice:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {line.options.map((opt, optIdx) => {
                        const targetIdx = opt.targetEventId
                          ? currentScene.timeline.findIndex((e) => e.id === opt.targetEventId)
                          : typeof opt.jumpToEventIndex === 'number'
                          ? opt.jumpToEventIndex
                          : null;

                        return (
                          <button
                            key={opt.id}
                            onClick={(e) => {
                              if (targetIdx !== null && targetIdx >= 0) {
                                e.stopPropagation();
                                setSelectedLineIndex(targetIdx);
                                playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono border transition-all flex items-center gap-1 ${
                              targetIdx !== null && targetIdx >= 0
                                ? 'bg-purple-950/80 hover:bg-purple-900 border-purple-700/80 text-purple-300 hover:text-white cursor-pointer shadow-sm'
                                : 'bg-black/40 border-gray-800 text-gray-500 cursor-default'
                            }`}
                            title={
                              targetIdx !== null && targetIdx >= 0
                                ? `Click to jump to destination Line #${targetIdx + 1}`
                                : 'No destination assigned'
                            }
                          >
                            <span className="font-bold uppercase text-[8px] opacity-75">#{optIdx + 1}</span>
                            <span className="truncate max-w-[90px]">{opt.label || `Opt ${optIdx + 1}`}</span>
                            <span className="font-bold text-purple-400">
                              {targetIdx !== null && targetIdx >= 0 ? `➔ #${targetIdx + 1}` : '➔ Next'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Jump Target Badge (If any choice jumps here) */}
                {incoming.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-800/60">
                    {incoming.map((jump, jIdx) => (
                      <span
                        key={jIdx}
                        className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 flex items-center gap-1 shadow"
                        title={`This line is jumped to from Choice Line #${jump.choiceIndex + 1} (${jump.optionLabel})`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3 h-3 text-emerald-400" />
                        <span>Target of Choice #{jump.choiceIndex + 1}</span>
                        <span className="text-emerald-400 font-normal truncate max-w-[120px]">("{jump.optionLabel}")</span>
                      </span>
                    ))}
                  </div>
                )}
                </div>
                {renderDropSlot(
                  idx + 1,
                  draggedTimelineItem && draggedTimelineItem.sourceSceneId !== currentScene.id
                    ? `Insert dialogue here (Position #${idx + 2})`
                    : `Move dialogue here (Position #${idx + 2})`
                )}
              </React.Fragment>
            );
          })}
          </>
        )}

        {/* CRITICAL FOR CHROMIUM/FIREFOX: Keep dragged DOM node alive when switching scenes */}
        {draggedTimelineItem && currentScene && draggedTimelineItem.sourceSceneId !== currentScene.id && (
          <div
            key={draggedTimelineItem.event.id}
            draggable={true}
            onDragEnd={() => {
              if (!dropHandledRef.current && handleDragCancel) {
                handleDragCancel();
              }
              setDraggedTimelineItem?.(null);
              setDraggedTimelineIndex(null);
              setDragOverTimelineIndex(null);
              setDragOverSceneTabId(null);
            }}
            style={{
              position: 'fixed',
              top: -9999,
              left: -9999,
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          />
        )}
      </div>

      <div className="p-3 border-t border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
        <button
          onClick={() => setShowAddActionModal(true)}
          className="w-full py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-dashed border-[var(--border2)] hover:border-[var(--accent)] text-[var(--text)] rounded-lg text-xs uppercase font-bold tracking-wider cursor-pointer transition-colors shadow-sm"
        >
          + Add next line to story
        </button>
      </div>
    </div>
  );
}
