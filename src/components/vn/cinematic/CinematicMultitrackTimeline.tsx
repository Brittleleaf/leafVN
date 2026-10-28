"use client";
import React, { useRef, useState, useEffect } from 'react';
import {
  VNCinematicTrack,
  VNCinematicClip,
  VNCinematicSection,
} from '@/types/vn';
import { playUiSound, playSfx } from '@/lib/audioSettings';
import {
  splitClipAtTime,
  reorderTracksWithinSection,
  generateWaveformPeaks,
  SECTION_THEMES,
  rippleDeleteClip,
  insertTrackIntoSection,
} from './cinematicUtils';
import { CinematicTimelineToolbar } from './CinematicTimelineToolbar';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { useTimelineDrag } from './hooks/useTimelineDrag';
import { getAudioDuration } from './hooks/useCinematicAudio';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicMultitrackTimelineProps {
  tracks: VNCinematicTrack[];
  totalDuration: number;
  currentTimeSec: number;
  isPlaying?: boolean;
  selectedClipId: string | null;
  activeTrackId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onSelectTrack: (trackId: string | null) => void;
  onSeek: (timeSec: number) => void;
  onUpdateTracks: (newTracks: VNCinematicTrack[]) => void;
  onUpdateTotalDuration: (newDuration: number) => void;
  timelineHeight: number;
  onResizeTimelineHeight: (newHeight: number) => void;
  onContextMenuClip?: (e: React.MouseEvent, clip: VNCinematicClip, track: VNCinematicTrack) => void;
  onContextMenuLane?: (e: React.MouseEvent, track: VNCinematicTrack) => void;
  onSave?: () => void;
  isSaving?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onScrubbingChange?: (isScrubbing: boolean) => void;
  notify?: (msg: string) => void;
}

export const CinematicMultitrackTimeline: React.FC<CinematicMultitrackTimelineProps> = ({
  tracks,
  totalDuration,
  currentTimeSec,
  isPlaying = false,
  selectedClipId,
  activeTrackId,
  onSelectClip,
  onSelectTrack,
  onSeek,
  onUpdateTracks,
  onUpdateTotalDuration,
  timelineHeight,
  onResizeTimelineHeight,
  onContextMenuClip,
  onContextMenuLane,
  onSave,
  isSaving = false,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onScrubbingChange,
  notify,
}) => {
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  // Responsive container width tracking for accurate zoom & layout
  const [containerWidth, setContainerWidth] = useState<number>(900);

  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(timelineScrollRef.current);
    return () => ro.disconnect();
  }, []);

  // CapCut Controls: Magnetic Snap & Zoom Level (1x to 4x)
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [zoom, setZoom] = useState<number>(1);
  const [headerWidth, setHeaderWidth] = useState<number>(180);

  // Track reorder drag state
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);

  // Sections ordered list
  const sectionsList: VNCinematicSection[] = ['media', 'audio', 'background'];

  // Width calculations:
  // Base available width for the lanes = containerWidth - headerWidth
  const safeTotalDuration = Math.max(0.1, Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 10);
  const baseLanesWidth = Math.max(300, containerWidth - headerWidth);
  const lanesWidth = Math.round(baseLanesWidth * zoom);
  const totalRowWidth = headerWidth + lanesWidth;

  // Find currently selected clip
  let selectedClip: VNCinematicClip | null = null;
  for (const t of tracks) {
    const c = t.clips.find((item) => item.id === selectedClipId);
    if (c) {
      selectedClip = c;
      break;
    }
  }

  // Hook: Timeline Drag, Snap, Trim, and Resize
  const {
    isScrubbingRuler,
    snapLineSec,
    handleRulerPointerDown,
    handleStartHeaderResize,
    handleStartHeightResize,
    handleStartTrimClip,
    handleStartMoveClip,
  } = useTimelineDrag({
    tracks,
    totalDuration,
    currentTimeSec,
    snapEnabled,
    zoom,
    timelineHeight,
    headerWidth,
    tracksContainerRef,
    onSeek,
    onUpdateTracks,
    onResizeTimelineHeight,
    onResizeHeaderWidth: setHeaderWidth,
    onSelectClip,
  });

  // Notify parent of scrubbing state to silence/pause audio without pops
  useEffect(() => {
    if (onScrubbingChange) {
      onScrubbingChange(isScrubbingRuler);
    }
  }, [isScrubbingRuler, onScrubbingChange]);

  // Synchronize horizontal scroll between Time Ruler and Tracks Body
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (rulerScrollRef.current) {
      rulerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Auto-scroll timeline to follow playhead when zoomed in during playback
  useEffect(() => {
    if (!isPlaying || isScrubbingRuler || !timelineScrollRef.current) return;
    const scrollContainer = timelineScrollRef.current;
    const playheadPx = headerWidth + (currentTimeSec / safeTotalDuration) * lanesWidth;
    const currentScroll = scrollContainer.scrollLeft;
    const viewWidth = scrollContainer.clientWidth;

    // Follow playhead if it approaches the right edge (85% of visible container) or is offscreen
    if (playheadPx > currentScroll + viewWidth * 0.85 || playheadPx < currentScroll) {
      scrollContainer.scrollLeft = Math.max(0, playheadPx - viewWidth * 0.25);
      if (rulerScrollRef.current) {
        rulerScrollRef.current.scrollLeft = scrollContainer.scrollLeft;
      }
    }
  }, [isPlaying, currentTimeSec, totalDuration, lanesWidth, headerWidth, isScrubbingRuler]);

  // Split Clip Action
  const handleSplitSelectedClip = () => {
    if (!selectedClip) return;
    if (currentTimeSec <= selectedClip.startSec || currentTimeSec >= selectedClip.endSec) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify?.(
        `The playhead (${currentTimeSec.toFixed(1)}s) must be inside the selected clip duration (${selectedClip.startSec}s - ${selectedClip.endSec}s) to split it.`
      );
      return;
    }
    const updated = splitClipAtTime(tracks, selectedClip.id, currentTimeSec);
    onUpdateTracks(updated);
    playUiSound('select', 0.4);
  };

  // Delete Selected Clip (leaves gap)
  const handleDeleteSelectedClip = () => {
    if (!selectedClip) return;
    const updated = tracks.map((t) => ({
      ...t,
      clips: t.clips.filter((c) => c.id !== selectedClip!.id),
    }));
    onUpdateTracks(updated);
    onSelectClip(null);
    playUiSound('delete', 0.35);
  };

  // Ripple Delete Selected Clip (shifts subsequent clips left to close gap)
  const handleRippleDeleteSelectedClip = () => {
    if (!selectedClip) return;
    const updated = rippleDeleteClip(tracks, selectedClip.id);
    onUpdateTracks(updated);
    onSelectClip(null);
    playUiSound('delete', 0.35);
  };

  // Add new track inside a section (placed contiguously with its section tracks)
  const handleAddTrackToSection = (section: VNCinematicSection) => {
    const targetSec = section === 'dialog' ? 'media' : section;
    const sectionTracks = tracks.filter((t) => t.section === targetSec);
    const nextIndex = sectionTracks.length + 1;
    const kindMap: Record<VNCinematicSection, any> = {
      media: 'visual',
      audio: 'audio',
      background: 'visual',
      dialog: 'visual',
    };
    const sectionNameMap: Record<VNCinematicSection, string> = {
      media: 'Media',
      audio: 'Audio',
      background: 'Background',
      dialog: 'Media',
    };
    const newTrack: VNCinematicTrack = {
      id: `track-${targetSec}-${Date.now()}`,
      section: targetSec,
      index: nextIndex,
      name: `${sectionNameMap[targetSec]} ${nextIndex}`,
      kind: kindMap[targetSec],
      visible: true,
      clips: [],
    };

    const updated = insertTrackIntoSection(tracks, newTrack, targetSec);
    onUpdateTracks(updated);
    onSelectTrack(newTrack.id);
    playUiSound('open', 0.35);
  };

  // Delete a track
  const handleDeleteTrack = (trackId: string) => {
    const updated = tracks.filter((t) => t.id !== trackId);
    onUpdateTracks(updated);
    if (activeTrackId === trackId) onSelectTrack(null);
    playUiSound('delete', 0.35);
  };

  // Toggle Track Visibility
  const handleToggleTrackVisibility = (trackId: string) => {
    const updated = tracks.map((t) =>
      t.id === trackId ? { ...t, visible: t.visible === false ? true : false } : t
    );
    onUpdateTracks(updated);
  };

  // Toggle Track Mute (Audio)
  const handleToggleTrackMute = (trackId: string) => {
    const updated = tracks.map((t) =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    );
    onUpdateTracks(updated);
  };

  // Track rename inline state & handlers
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState<string>('');

  const handleStartRenameTrack = (trackId: string, currentName?: string) => {
    setEditingTrackId(trackId);
    setEditingTrackName(currentName || '');
  };

  const handleCommitTrackName = (trackId: string) => {
    if (editingTrackName.trim()) {
      const updated = tracks.map((t) =>
        t.id === trackId ? { ...t, name: editingTrackName.trim() } : t
      );
      onUpdateTracks(updated);
    }
    setEditingTrackId(null);
  };

  // Track Drag & Drop Reordering
  const handleTrackDragStart = (trackId: string) => {
    setDraggedTrackId(trackId);
  };

  const handleTrackDragOver = (e: React.DragEvent, targetTrackId: string, section: VNCinematicSection) => {
    e.preventDefault();
    if (!draggedTrackId || draggedTrackId === targetTrackId) return;

    const sectionTracks = tracks.filter((t) => t.section === section);
    const fromIdx = sectionTracks.findIndex((t) => t.id === draggedTrackId);
    const toIdx = sectionTracks.findIndex((t) => t.id === targetTrackId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const reordered = reorderTracksWithinSection(tracks, section, fromIdx, toIdx);
      onUpdateTracks(reordered);
    }
  };

  const handleTrackDragEnd = () => {
    setDraggedTrackId(null);
  };

  // Handle dropping asset from Gallery directly onto a track lane
  const handleDropAssetOnTrack = (e: React.DragEvent, track: VNCinematicTrack) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    try {
      const payload = JSON.parse(dataStr);
      const rect = tracksContainerRef.current?.getBoundingClientRect();
      const safeTotalDur = Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 10;
      let dropSec = Number.isFinite(currentTimeSec) ? Math.max(0, Math.min(safeTotalDur - 0.5, currentTimeSec)) : 0;

      if (rect && rect.width > 0) {
        const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        dropSec = Math.max(0, Math.min(Math.max(0, safeTotalDur - 0.5), Number(((relX / rect.width) * safeTotalDur).toFixed(1))));
      }

      const defaultDur = payload.type === 'text' || payload.type === 'character_dialogue' ? 3.5 : 4;
      const endSec = Math.min(safeTotalDur, Number((dropSec + defaultDur).toFixed(1)));

      if (endSec <= dropSec) {
        notify?.('Cannot place clip: not enough time remaining at this drop position.');
        return;
      }

      // Check collision on this track
      const hasCollision = track.clips.some((c) => dropSec < c.endSec && endSec > c.startSec);
      if (hasCollision) {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify?.('That time is already occupied on this track. Drag to an empty area or drop onto another track.');
        return;
      }

      let newClip: VNCinematicClip;

      if (payload.type === 'character_dialogue') {
        newClip = {
          id: `clip-txt-${Date.now()}`,
          trackId: track.id,
          name: `${payload.speaker || 'Character'}: ${payload.text?.slice(0, 15)}...`,
          speaker: payload.speaker,
          speakerAvatar: payload.avatarUrl || payload.speakerAvatar,
          speakerColor: payload.speakerColor,
          speakerBadge: payload.speakerBadge,
          dialogueStyle: 'classic_vn',
          text: payload.text || '...',
          startSec: dropSec,
          endSec,
          fontSize: 'xl',
          textColor: '#ffffff',
          textPosition: 'bottom',
          xPercent: 50,
          yPercent: 82,
          scale: 1,
        };
      } else if (payload.type === 'media') {
        newClip = {
          id: `clip-vis-${Date.now()}`,
          trackId: track.id,
          name: payload.name || 'Image',
          startSec: dropSec,
          endSec,
          mediaUrl: payload.url,
          mediaType: payload.mediaType || 'image',
          xPercent: 50,
          yPercent: 50,
          scale: 1,
          opacity: 1,
          blendMode: 'normal',
          transition: 'fade',
        };
      } else if (payload.type === 'text') {
        newClip = {
          id: `clip-txt-${Date.now()}`,
          trackId: track.id,
          name: payload.text?.slice(0, 15) || 'Text',
          startSec: dropSec,
          endSec,
          text: payload.text || 'Text...',
          textEffect: payload.effect,
          fontSize: 'xl',
          textColor: '#ffffff',
          textPosition: 'bottom',
          xPercent: 50,
          yPercent: 82,
          scale: 1,
        };
      } else if (payload.type === 'audio') {
        newClip = {
          id: `clip-aud-${Date.now()}`,
          trackId: track.id,
          name: payload.name || 'Audio',
          startSec: dropSec,
          endSec,
          audioUrl: payload.url,
          volume: 0.8,
          loop: Boolean(payload.isBgm),
          waveform: generateWaveformPeaks(payload.name || payload.url),
        };
      } else if (payload.type === 'fx') {
        newClip = {
          id: `clip-fx-${Date.now()}`,
          trackId: track.id,
          name: payload.name || 'FX',
          startSec: dropSec,
          endSec,
          fxType: payload.fxType,
          fxIntensity: 'medium',
        };
      } else {
        return;
      }

      const updated = tracks.map((t) =>
        t.id === track.id ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec) } : t
      );
      onUpdateTracks(updated);
      onSelectClip(newClip.id);
      onSelectTrack(track.id);
      playUiSound('open', 0.4);
    } catch (err) {}
  };

  // Step markers calculation depending on duration & zoom
  const validTotalDur = Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 10;
  const baseStep = validTotalDur > 45 ? 5 : validTotalDur > 20 ? 2 : 1;
  const markerStep = Math.max(0.2, zoom >= 2 ? Math.max(0.5, baseStep / 2) : baseStep);

  const timeMarkers: number[] = [];
  for (let s = 0; s <= validTotalDur; s += markerStep) {
    timeMarkers.push(Number(s.toFixed(1)));
  }

  const safeCurrentTimeSec = Number.isFinite(currentTimeSec) ? Math.max(0, currentTimeSec) : 0;
  const playheadPct = Math.max(0, Math.min(100, (safeCurrentTimeSec / safeTotalDuration) * 100));
  const snapLinePct = snapLineSec !== null && Number.isFinite(snapLineSec) ? Math.max(0, Math.min(100, (snapLineSec / safeTotalDuration) * 100)) : null;

  return (
    <div
      style={{ height: `${timelineHeight}px` }}
      className="relative flex flex-col bg-[var(--surface)] text-[var(--text)] select-none overflow-hidden border-t border-[var(--border)] shrink-0 transition-[height] duration-75"
    >
      {/* TOP HORIZONTAL RESIZE HANDLE (Drag up/down to stretch timeline height) */}
      <div
        onPointerDown={handleStartHeightResize}
        className="absolute top-0 left-0 right-0 h-2 -mt-1 cursor-row-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-50 group"
        title="Drag vertically to adjust timeline height"
      >
        <div className="w-16 h-1 bg-white/20 group-hover:bg-cyan-400 rounded-full mx-auto" />
      </div>

      {/* TIMELINE TOOLBAR (Split, Delete, Snap, Zoom, Add Track, Duration, Undo/Redo) */}
      <CinematicTimelineToolbar
        selectedClip={selectedClip}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(4, Number((z + 0.5).toFixed(1))))}
        onZoomOut={() => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
        onResetZoom={() => setZoom(1)}
        totalDuration={totalDuration}
        onUpdateTotalDuration={onUpdateTotalDuration}
        onSplitSelectedClip={handleSplitSelectedClip}
        onDeleteSelectedClip={handleDeleteSelectedClip}
        onRippleDeleteSelectedClip={handleRippleDeleteSelectedClip}
        onAddTrackToSection={handleAddTrackToSection}
        onSave={onSave}
        isSaving={isSaving}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      {/* 1. FIXED TOP ROW: TRACKS HEADER (LEFT) & TIME RULER (RIGHT) - CAN NEVER BE SCROLLED OVER! */}
      <div className="flex h-6 border-b border-[var(--border)] bg-[#0b0914] shrink-0 select-none z-40 relative">
        {/* Top-Left: Tracks Header Cell */}
        <div
          style={{ width: `${headerWidth}px` }}
          className="shrink-0 bg-[#0b0914] px-2.5 flex items-center justify-between text-[9px] font-mono font-bold uppercase border-r border-[var(--border)] relative select-none"
        >
          <span className="text-[var(--text-dim)]">Tracks</span>
          <span className="text-[8px] text-cyan-400">Draggable</span>

          {/* Drag handle to resize headerWidth */}
          <div
            onPointerDown={handleStartHeaderResize}
            className="absolute top-0 right-0 bottom-0 w-2.5 -mr-1 cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 transition-colors z-50 group"
            title="Drag to resize track headers width"
          >
            <div className="h-full w-0.5 bg-transparent group-hover:bg-cyan-400 mx-auto" />
          </div>
        </div>

        {/* Top-Right: Time Ruler Viewport (Synchronized horizontally with tracks body) */}
        <div
          ref={rulerScrollRef}
          className="flex-1 overflow-hidden relative bg-[var(--well-bg)] select-none"
        >
          <div
            style={{ width: `${lanesWidth}px` }}
            onPointerDown={handleRulerPointerDown}
            className="relative h-full cursor-ew-resize select-none shrink-0"
          >
            {timeMarkers.map((sec) => {
              const leftPct = (sec / safeTotalDuration) * 100;
              return (
                <div
                  key={sec}
                  style={{ left: `${leftPct}%` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                >
                  <span className="text-[9px] font-mono text-[var(--muted)] -translate-x-1/2 font-bold">
                    {sec}s
                  </span>
                  <div className="w-px h-1.5 bg-[var(--border)]" />
                </div>
              );
            })}

            {/* Playhead Diamond Indicator in the Time Ruler */}
            <div
              style={{ left: `${playheadPct}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-50"
            >
              <div className="w-3.5 h-3.5 bg-red-500 rotate-45 -translate-x-[5px] -translate-y-0.5 rounded-sm shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TRACKS BODY SCROLL VIEWPORT: PROPERLY CLIPPED BELOW RULER SO TRACKS NEVER OVERFLOW ABOVE */}
      <div
        ref={timelineScrollRef}
        onScroll={handleTimelineScroll}
        className="flex-1 overflow-x-auto overflow-y-auto relative bg-[var(--surface)] select-none"
      >
        <div
          style={{ width: `${totalRowWidth}px`, minWidth: '100%' }}
          className="relative flex flex-col min-h-full"
        >
          {/* PLAYHEAD & SNAP OVERLAY (Spans through all rows in the lanes column) */}
          <div
            ref={tracksContainerRef}
            style={{ left: `${headerWidth}px`, width: `${lanesWidth}px` }}
            className="absolute top-0 bottom-0 pointer-events-none z-30"
          >
            {/* Playhead Vertical Needle */}
            <div
              style={{ left: `${playheadPct}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none shadow-[0_0_12px_rgba(239,68,68,1)]"
            />

            {/* Magnetic Snap Guide Line */}
            {snapLinePct !== null && (
              <div
                style={{ left: `${snapLinePct}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse"
              />
            )}
          </div>

          {/* SECTIONS & TRACK ROWS */}
          {sectionsList.map((secKey) => {
            const theme = SECTION_THEMES[secKey];
            const sectionTracks = tracks.filter((t) => t.section === secKey);
            const isAudio = secKey === 'audio';

            return (
              <div key={secKey} className="flex flex-col border-b border-black/30">
                {/* SECTION DIVIDER ROW */}
                <div
                  style={{
                    backgroundColor: theme.bg,
                    width: `${totalRowWidth}px`,
                  }}
                  className="flex h-[24px] border-b border-black/20 shrink-0"
                >
                  {/* Sticky Left Section Header */}
                  <div
                    style={{
                      width: `${headerWidth}px`,
                      backgroundColor: theme.bg,
                      color: theme.text,
                    }}
                    className="sticky left-0 z-20 shrink-0 px-2.5 flex items-center justify-between text-[10px] font-extrabold tracking-wider border-r border-black/20 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 drop-shadow-sm">
                      <GuiIconRenderer icon={theme.icon} className="w-3.5 h-3.5" />
                      <span>{theme.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddTrackToSection(secKey)}
                      className="w-4 h-4 rounded flex items-center justify-center bg-black/25 hover:bg-black/50 text-white cursor-pointer text-xs font-black transition-transform hover:scale-110 active:scale-95"
                      title={`Add track to ${theme.label}`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Right Section Lane Banner */}
                  <div
                    style={{
                      width: `${lanesWidth}px`,
                      backgroundColor: theme.bg,
                      color: theme.text,
                    }}
                    className="px-3 flex items-center text-[10px] font-extrabold tracking-wider shadow-sm select-none shrink-0"
                  >
                    <span className="drop-shadow-sm font-mono text-[9px] opacity-90 uppercase">
                      SECTION {theme.label} ({sectionTracks.length} {sectionTracks.length === 1 ? 'track' : 'tracks'})
                    </span>
                  </div>
                </div>

                {/* TRACK ROWS IN THIS SECTION */}
                <div style={{ backgroundColor: theme.bg }} className="flex flex-col gap-[1px]">
                  {sectionTracks.map((track) => {
                    const isTrackActive = activeTrackId === track.id;

                    return (
                      <div
                        key={track.id}
                        style={{
                          width: `${totalRowWidth}px`,
                          backgroundColor: 'var(--panel)',
                          borderLeft: isTrackActive ? '3px solid var(--accent)' : '3px solid transparent',
                        }}
                        className={`flex h-9 border-b border-black/20 text-xs transition-colors shrink-0 ${
                          draggedTrackId === track.id ? 'opacity-30' : ''
                        } ${isTrackActive ? 'brightness-125' : 'hover:brightness-110'}`}
                      >
                        {/* Sticky Left Track Header - 100% solid background so clips sliding behind it never show through */}
                        <div
                          style={{ width: `${headerWidth}px` }}
                          draggable={editingTrackId !== track.id}
                          onDragStart={() => handleTrackDragStart(track.id)}
                          onDragOver={(e) => handleTrackDragOver(e, track.id, secKey)}
                          onDragEnd={handleTrackDragEnd}
                          onClick={() => onSelectTrack(track.id)}
                          onContextMenu={(e) => {
                            if (onContextMenuLane) onContextMenuLane(e, track);
                          }}
                          className="sticky left-0 z-20 shrink-0 px-2 flex items-center justify-between bg-[var(--well-bg)] border-r border-[var(--border)] select-none group cursor-grab active:cursor-grabbing"
                          title="Drag to reorder track priority | Double-click to rename"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                            <span className="text-white/60 group-hover:text-white text-[10px] cursor-grab shrink-0">
                              â‹®â‹®
                            </span>
                            {editingTrackId === track.id ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingTrackName}
                                onChange={(e) => setEditingTrackName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    handleCommitTrackName(track.id);
                                  } else if (e.key === 'Escape') {
                                    e.stopPropagation();
                                    setEditingTrackId(null);
                                  }
                                }}
                                onBlur={() => handleCommitTrackName(track.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-1.5 py-0.5 rounded bg-[var(--well-bg)] border border-[var(--accent)] text-[var(--text)] font-bold text-[10px] outline-none shadow-inner"
                              />
                            ) : (
                              <div
                                className="flex items-center gap-1 min-w-0 truncate cursor-pointer group/name"
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRenameTrack(track.id, track.name || `${theme.label} ${track.index}`);
                                }}
                                title="Double-click to rename track"
                              >
                                <span className="font-bold text-[11px] truncate tracking-wide text-[var(--text)] group-hover/name:text-[var(--accent)]">
                                  {track.name || `${theme.label} ${track.index}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartRenameTrack(track.id, track.name || `${theme.label} ${track.index}`);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-cyan-300 p-0.5 transition-opacity cursor-pointer shrink-0"
                                  title="Rename Track"
                                >
                                  <GuiIconRenderer icon={GUI_ICONS.general.pencil} className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Track Controls (Mute / Visibility / Delete) */}
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Audio Mute Button */}
                            {isAudio && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTrackMute(track.id);
                                  playUiSound('click', 0.2);
                                }}
                                className={`p-0.5 rounded cursor-pointer hover:scale-110 transition-transform ${
                                  track.muted ? 'text-red-400' : 'text-[#A1FE10]'
                                }`}
                                title={track.muted ? 'Unmute track' : 'Mute track'}
                              >
                                <GuiIconRenderer
                                  icon={track.muted ? GUI_ICONS.general.speakerOff : GUI_ICONS.general.speaker}
                                  className="w-3.5 h-3.5"
                                />
                              </button>
                            )}

                            {/* Visibility Eye */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTrackVisibility(track.id);
                                playUiSound('click', 0.2);
                              }}
                              className={`p-0.5 rounded cursor-pointer hover:scale-110 transition-transform ${
                                track.visible !== false ? 'text-gray-200' : 'text-gray-600 opacity-40'
                              }`}
                              title={track.visible !== false ? 'Hide track' : 'Show track'}
                            >
                              <GuiIconRenderer
                                icon={track.visible !== false ? GUI_ICONS.general.viewShow : GUI_ICONS.general.viewHide}
                                className="w-3.5 h-3.5"
                              />
                            </button>

                            {/* Delete Track */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteTrack(track.id);
                              }}
                              className="w-4 h-4 rounded flex items-center justify-center text-gray-400 hover:text-red-300 hover:bg-red-500/30 transition-all cursor-pointer"
                              title="Delete this track"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Right Track Lane */}
                        <div
                          data-track-id={track.id}
                          style={{
                            width: `${lanesWidth}px`,
                            boxShadow: isTrackActive ? 'inset 0 0 15px rgba(255, 255, 255, 0.25)' : 'none',
                          }}
                          onClick={() => onSelectTrack(track.id)}
                          onContextMenu={(e) => onContextMenuLane && onContextMenuLane(e, track)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(e) => handleDropAssetOnTrack(e, track)}
                          className="h-full relative overflow-hidden transition-colors shrink-0"
                        >
                          {/* Clips on this track (Sequential, non-overlapping) */}
                          {track.clips.map((clip) => {
                            const leftPct = (clip.startSec / safeTotalDuration) * 100;
                            const widthPct = Math.max(0.8, ((clip.endSec - clip.startSec) / safeTotalDuration) * 100);
                            const isSelected = selectedClipId === clip.id;

                            const isAudioClip = track.section === 'audio';
                            const isBackground = track.section === 'background';
                            const isTextOrDialog = Boolean(clip.text);
                            const detectedAudioDur = isAudioClip ? getAudioDuration(clip.audioUrl || clip.sfx) : null;
                            const isStretchedLoop = isAudioClip && (Boolean(clip.loop) || (detectedAudioDur ? (clip.endSec - clip.startSec > detectedAudioDur + 0.05) : false));

                            let clipStyle = {
                              backgroundColor: isSelected
                                ? '#0284c7'
                                : isAudioClip
                                ? 'rgba(161, 254, 16, 0.25)'
                                : isBackground
                                ? 'rgba(226, 19, 69, 0.85)'
                                : isTextOrDialog
                                ? 'rgba(147, 51, 234, 0.9)'
                                : 'rgba(106, 65, 204, 0.85)',
                              borderColor: isSelected
                                ? '#38bdf8'
                                : isAudioClip
                                ? '#A1FE10'
                                : isBackground
                                ? '#E21345'
                                : isTextOrDialog
                                ? '#c084fc'
                                : '#6A41CC',
                              color: isAudioClip && !isSelected ? '#A1FE10' : '#ffffff',
                            };

                            return (
                              <div
                                key={clip.id}
                                onPointerDown={(e) => handleStartMoveClip(e, clip, track)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectClip(clip.id);
                                  onSelectTrack(track.id);
                                }}
                                onContextMenu={(e) => onContextMenuClip && onContextMenuClip(e, clip, track)}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  ...clipStyle,
                                }}
                                className={`absolute top-0.5 bottom-0.5 rounded-md px-1.5 flex items-center justify-between text-[10px] font-mono border transition-colors duration-150 cursor-grab active:cursor-grabbing select-none group/clip overflow-hidden shadow-sm ${
                                  isSelected
                                    ? 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.7)] z-10 font-bold'
                                    : ''
                                }`}
                                title={`${clip.name || clip.text || clip.id} (${clip.startSec}s - ${clip.endSec}s)${isStretchedLoop ? ' [Looping]' : ''}`}
                              >
                                {/* AUDIO WAVEFORM BACKGROUND (If audio clip) */}
                                {isAudioClip && (
                                  <AudioWaveformVisualizer
                                    peaks={clip.waveform}
                                    color={isSelected ? 'rgba(255, 255, 255, 0.5)' : 'rgba(161, 254, 16, 0.7)'}
                                  />
                                )}

                                {/* Left Trim Handle */}
                                <div
                                  onPointerDown={(e) => handleStartTrimClip(e, clip, track, 'trim-left')}
                                  className="absolute left-0 top-0 bottom-0 w-2.5 bg-white/25 hover:bg-white/70 cursor-ew-resize rounded-l-md opacity-0 group-hover/clip:opacity-100 transition-opacity z-20 flex items-center justify-center text-[8px] font-bold"
                                  title="Trim start"
                                >
                                  â‹®
                                </div>

                                {/* Clip Label */}
                                <span className="truncate px-1.5 font-bold pointer-events-none relative z-10 drop-shadow flex items-center gap-1 min-w-0">
                                  {clip.speaker ? `[${clip.speaker}] ` : ''}
                                  <span className="truncate">{clip.name || clip.text || clip.id}</span>
                                  {isStretchedLoop && (
                                    <span
                                      className="text-[9px] px-1 py-0.5 rounded bg-black/70 text-[#A1FE10] border border-[#A1FE10]/40 font-mono font-bold shrink-0 shadow flex items-center gap-1"
                                      title="Audio loops to fill stretched clip duration"
                                    >
                                      <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-2.5 h-2.5" />
                                      <span className="hidden sm:inline">Loop</span>
                                    </span>
                                  )}
                                </span>

                                {/* Right Trim Handle */}
                                <div
                                  onPointerDown={(e) => handleStartTrimClip(e, clip, track, 'trim-right')}
                                  className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/25 hover:bg-white/70 cursor-ew-resize rounded-r-md opacity-0 group-hover/clip:opacity-100 transition-opacity z-20 flex items-center justify-center text-[8px] font-bold"
                                  title="Trim end"
                                >
                                  â‹®
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty section row if 0 tracks */}
                  {sectionTracks.length === 0 && (
                    <div
                      style={{
                        width: `${totalRowWidth}px`,
                        backgroundColor: 'var(--well-bg)',
                      }}
                      className="flex h-8 border-b border-black/20 italic shrink-0"
                    >
                      <div
                        style={{ width: `${headerWidth}px` }}
                        className="sticky left-0 z-20 shrink-0 px-2.5 flex items-center justify-between text-[10px] text-[var(--muted)] bg-[var(--well-bg)] border-r border-[var(--border)]"
                      >
                        <span>No tracks</span>
                        <button
                          type="button"
                          onClick={() => handleAddTrackToSection(secKey)}
                          className="text-[var(--accent)] hover:underline font-bold text-[10px] cursor-pointer"
                        >
                          + Add track
                        </button>
                      </div>
                      <div
                        style={{ width: `${lanesWidth}px` }}
                        className="h-full flex items-center px-4 text-xs text-[var(--muted2)] shrink-0"
                      >
                        Drag assets here or create a new track with +
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
