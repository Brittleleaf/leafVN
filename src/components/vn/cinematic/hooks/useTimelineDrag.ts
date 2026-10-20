"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { VNCinematicTrack, VNCinematicClip, VNCinematicSection } from '@/types/vn';
import {
  trimClip,
  calculateValidClipStart,
  applyClipMoveToTracks,
} from '../cinematicUtils';

interface UseTimelineDragProps {
  tracks: VNCinematicTrack[];
  totalDuration: number;
  currentTimeSec: number;
  snapEnabled: boolean;
  zoom: number;
  timelineHeight: number;
  headerWidth: number;
  tracksContainerRef: React.RefObject<HTMLDivElement | null>;
  onSeek: (timeSec: number) => void;
  onUpdateTracks: (newTracks: VNCinematicTrack[]) => void;
  onResizeTimelineHeight: (newHeight: number) => void;
  onResizeHeaderWidth: (newWidth: number) => void;
  onSelectClip: (clipId: string | null) => void;
}

export function useTimelineDrag({
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
  onResizeHeaderWidth,
  onSelectClip,
}: UseTimelineDragProps) {
  const [isScrubbingRuler, setIsScrubbingRuler] = useState(false);
  const [snapLineSec, setSnapLineSec] = useState<number | null>(null);

  // Resize refs
  const isResizingHeaderRef = useRef(false);
  const startHeaderXRef = useRef(0);
  const startHeaderWidthRef = useRef(headerWidth);

  const isResizingHeightRef = useRef(false);
  const startHeightYRef = useRef(0);
  const startHeightRef = useRef(timelineHeight);

  // Clip drag ref with snapshot of initial state
  const dragRef = useRef<{
    type: 'trim-left' | 'trim-right' | 'move-body';
    clipId: string;
    sourceTrackId: string;
    currentTrackId: string;
    section: VNCinematicSection;
    initialMouseX: number;
    initialMouseY: number;
    initialStartSec: number;
    initialEndSec: number;
    duration: number;
    initialTracks: VNCinematicTrack[];
  } | null>(null);

  // Calculate time from clientX with zoom
  const getTimeFromMouseX = useCallback(
    (clientX: number): number => {
      if (!tracksContainerRef.current) return 0;
      const rect = tracksContainerRef.current.getBoundingClientRect();
      const safeWidth = Math.max(1, rect.width || 1);
      const safeTotalDur = Math.max(0.1, Number.isFinite(totalDuration) ? totalDuration : 10);
      const relativeX = clientX - rect.left;
      const clampedX = Math.max(0, Math.min(safeWidth, relativeX));
      const rawTime = (clampedX / safeWidth) * safeTotalDur;
      return Math.max(0, Math.min(safeTotalDur, rawTime));
    },
    [totalDuration, tracksContainerRef]
  );

  // Magnetic Snap Helper: Snaps to playhead, other clip edges, and 0.1s grid
  const applyMagneticSnap = useCallback(
    (targetTime: number, clipId: string, trackId: string): { snappedTime: number; snapHit: number | null } => {
      if (!snapEnabled) {
        return { snappedTime: Math.round(targetTime * 100) / 100, snapHit: null };
      }

      const snapThreshold = 0.18; // Snap magnet zone in seconds

      // 1. Check Playhead snap
      if (Math.abs(targetTime - currentTimeSec) < snapThreshold) {
        return { snappedTime: currentTimeSec, snapHit: currentTimeSec };
      }

      // 2. Check 0s and totalDuration snap
      if (Math.abs(targetTime - 0) < snapThreshold) {
        return { snappedTime: 0, snapHit: 0 };
      }
      if (Math.abs(targetTime - totalDuration) < snapThreshold) {
        return { snappedTime: totalDuration, snapHit: totalDuration };
      }

      // 3. Check adjacent clips edges in all tracks
      for (const track of tracks) {
        for (const c of track.clips) {
          if (c.id === clipId) continue;
          if (Math.abs(targetTime - c.startSec) < snapThreshold) {
            return { snappedTime: c.startSec, snapHit: c.startSec };
          }
          if (Math.abs(targetTime - c.endSec) < snapThreshold) {
            return { snappedTime: c.endSec, snapHit: c.endSec };
          }
        }
      }

      // Fallback: round to nearest 0.1s
      return { snappedTime: Math.round(targetTime * 10) / 10, snapHit: null };
    },
    [snapEnabled, currentTimeSec, totalDuration, tracks]
  );

  // Ruler pointer down
  const handleRulerPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsScrubbingRuler(true);
    const time = getTimeFromMouseX(e.clientX);
    onSeek(snapEnabled ? Math.round(time * 10) / 10 : time);
  };

  // Start Header Width Resize
  const handleStartHeaderResize = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingHeaderRef.current = true;
    startHeaderXRef.current = e.clientX;
    startHeaderWidthRef.current = headerWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Start Timeline Height Resize
  const handleStartHeightResize = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingHeightRef.current = true;
    startHeightYRef.current = e.clientY;
    startHeightRef.current = timelineHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // Start Trim Clip
  const handleStartTrimClip = (
    e: React.PointerEvent,
    clip: VNCinematicClip,
    track: VNCinematicTrack,
    edge: 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectClip(clip.id);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    dragRef.current = {
      type: edge,
      clipId: clip.id,
      sourceTrackId: track.id,
      currentTrackId: track.id,
      section: track.section,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialStartSec: clip.startSec,
      initialEndSec: clip.endSec,
      duration: Number((clip.endSec - clip.startSec).toFixed(2)),
      initialTracks: tracks,
    };
  };

  // Start Move Clip
  const handleStartMoveClip = (
    e: React.PointerEvent,
    clip: VNCinematicClip,
    track: VNCinematicTrack
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectClip(clip.id);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    dragRef.current = {
      type: 'move-body',
      clipId: clip.id,
      sourceTrackId: track.id,
      currentTrackId: track.id,
      section: track.section,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialStartSec: clip.startSec,
      initialEndSec: clip.endSec,
      duration: Number((clip.endSec - clip.startSec).toFixed(2)),
      initialTracks: tracks,
    };
  };

  // Pointer Move & Up listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // 1. Height resize
      if (isResizingHeightRef.current) {
        const deltaY = startHeightYRef.current - e.clientY;
        const newH = Math.max(160, Math.min(650, startHeightRef.current + deltaY));
        onResizeTimelineHeight(newH);
        return;
      }

      // 2. Header width resize
      if (isResizingHeaderRef.current) {
        const deltaX = e.clientX - startHeaderXRef.current;
        const newW = Math.max(130, Math.min(350, startHeaderWidthRef.current + deltaX));
        onResizeHeaderWidth(newW);
        return;
      }

      // 3. Scrubbing ruler
      if (isScrubbingRuler) {
        const time = getTimeFromMouseX(e.clientX);
        onSeek(snapEnabled ? Math.round(time * 10) / 10 : time);
        return;
      }

      // 4. Clip Trimming or Moving
      if (!dragRef.current || !tracksContainerRef.current) return;
      const rect = tracksContainerRef.current.getBoundingClientRect();
      const safeRectWidth = Math.max(1, rect.width || 1);
      const safeTotalDur = Math.max(0.1, Number.isFinite(totalDuration) ? totalDuration : 10);
      const deltaPxX = e.clientX - dragRef.current.initialMouseX;
      const deltaSec = (deltaPxX / safeRectWidth) * safeTotalDur;

      const {
        type,
        clipId,
        sourceTrackId,
        currentTrackId,
        section,
        initialStartSec,
        initialEndSec,
        duration,
        initialTracks,
      } = dragRef.current;

      if (type === 'trim-left') {
        const rawNewStart = initialStartSec + deltaSec;
        const { snappedTime, snapHit } = applyMagneticSnap(rawNewStart, clipId, currentTrackId);
        setSnapLineSec(snapHit);
        onUpdateTracks(trimClip(initialTracks, clipId, 'start', snappedTime, totalDuration));
      } else if (type === 'trim-right') {
        const rawNewEnd = initialEndSec + deltaSec;
        const { snappedTime, snapHit } = applyMagneticSnap(rawNewEnd, clipId, currentTrackId);
        setSnapLineSec(snapHit);
        onUpdateTracks(trimClip(initialTracks, clipId, 'end', snappedTime, totalDuration));
      } else if (type === 'move-body') {
        const rawNewStart = initialStartSec + deltaSec;
        const { snappedTime, snapHit } = applyMagneticSnap(rawNewStart, clipId, currentTrackId);
        setSnapLineSec(snapHit);

        // Check vertical drag crossing to another track in same section
        let activeTrackId = currentTrackId;
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        for (const el of elements) {
          const tid = el.getAttribute?.('data-track-id');
          if (tid) {
            const candidateTrack = initialTracks.find((t) => t.id === tid);
            if (candidateTrack && candidateTrack.section === section) {
              const otherClips = candidateTrack.clips.filter((c) => c.id !== clipId);
              const clampedDesired = Math.max(0, Math.min(totalDuration - duration, snappedTime));
              const collides = otherClips.some(
                (c) => clampedDesired < c.endSec && clampedDesired + duration > c.startSec
              );
              if (!collides) {
                activeTrackId = tid;
                dragRef.current.currentTrackId = tid;
              }
              break;
            }
          }
        }

        const targetTrack = initialTracks.find((t) => t.id === activeTrackId);
        if (!targetTrack) return;

        const finalStartSec = calculateValidClipStart(
          targetTrack,
          clipId,
          duration,
          snappedTime,
          initialStartSec,
          totalDuration
        );

        const updatedTracks = applyClipMoveToTracks(
          initialTracks,
          clipId,
          sourceTrackId,
          activeTrackId,
          finalStartSec,
          duration
        );

        onUpdateTracks(updatedTracks);
      }
    };

    const handlePointerUp = () => {
      setIsScrubbingRuler(false);
      isResizingHeightRef.current = false;
      isResizingHeaderRef.current = false;
      dragRef.current = null;
      setSnapLineSec(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [
    isScrubbingRuler,
    tracks,
    totalDuration,
    snapEnabled,
    getTimeFromMouseX,
    applyMagneticSnap,
    onSeek,
    onUpdateTracks,
    onResizeTimelineHeight,
    onResizeHeaderWidth,
    tracksContainerRef,
  ]);

  return {
    isScrubbingRuler,
    snapLineSec,
    handleRulerPointerDown,
    handleStartHeaderResize,
    handleStartHeightResize,
    handleStartTrimClip,
    handleStartMoveClip,
  };
}
