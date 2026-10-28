"use client";
import React, { useState, useEffect } from 'react';
import {
  VNStory,
  VNScene,
  VNCinematicConfig,
  VNCinematicTrack,
  VNCinematicClip,
  VNAssetItem,
  VNAssetType,
} from '@/types/vn';
import { playSfx, playUiSound, stopAudioPreview } from '@/lib/audioSettings';
import CinematicPlayerView, { DEFAULT_CINEMATIC_CONFIG } from './CinematicPlayerView';
import { CinematicMediaLibrary } from './cinematic/CinematicMediaLibrary';
import { CinematicMultitrackTimeline } from './cinematic/CinematicMultitrackTimeline';
import { CinematicClipInspector } from './cinematic/CinematicClipInspector';
import { CinematicTransportBar } from './cinematic/CinematicTransportBar';
import {
  normalizeCinematicTracks,
  splitClipAtTime,
  findOrCreateFreeTrack,
  generateWaveformPeaks,
  moveClipToTrack,
  duplicateClip,
  rippleDeleteClip,
} from './cinematic/cinematicUtils';
import { useCinematicClock } from './cinematic/hooks/useCinematicClock';
import { CinematicContextMenu, ContextMenuState } from './cinematic/CinematicContextMenu';
import AssetStudioModal from './AssetStudioModal';
import { VNTransformToolbar } from './transform';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

import { saveActiveStory } from '@/lib/vn/storage';

interface CinematicSequencerStudioProps {
  scene: VNScene;
  story: VNStory;
  onUpdateScene: (patch: Partial<VNScene>) => void;
  onUpdateStoryCustomAssets?: (updatedAssets: VNAssetItem[]) => void;
  onSave?: () => Promise<void> | void;
  editorTheme?: 'default_dark' | 'default_light' | 'rotp';
}

export default function CinematicSequencerStudio({
  scene,
  story,
  onUpdateScene,
  onUpdateStoryCustomAssets,
  onSave,
  editorTheme = 'default_dark',
}: CinematicSequencerStudioProps) {
  const config: VNCinematicConfig = scene.cinematicConfig || DEFAULT_CINEMATIC_CONFIG;
  const totalDuration = Math.max(1, config.durationSeconds || 12);

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState<boolean>(false);
  const [timelineHeight, setTimelineHeight] = useState<number>(260);

  // Context Menu and Clipboard state (Cut / Copy / Paste / Duplicate)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboardClip, setClipboardClip] = useState<VNCinematicClip | null>(null);

  // Gallery Picker modal state
  const [assetPickerConfig, setAssetPickerConfig] = useState<{
    filterType?: VNAssetType;
    title: string;
    previewBackgroundUrl?: string;
    onSelect: (asset: VNAssetItem) => void;
  } | null>(null);

  // Canvas 16:9 strictly constrained responsive dimension hook (never stretches or squashes)
  const centerContainerRef = React.useRef<HTMLDivElement>(null);
  const [centerContainerHeight, setCenterContainerHeight] = useState<number>(600);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 450,
  });

  useEffect(() => {
    const el = centerContainerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      setCenterContainerHeight(el.clientHeight);
      // Available box leaving room for padding, transport bar, and outside vertical toolbar
      const paddingX = 160;
      const paddingY = 88;
      const availW = Math.max(160, el.clientWidth - paddingX);
      const availH = Math.max(90, el.clientHeight - paddingY);

      const targetRatio = 16 / 9;
      let w = availW;
      let h = w / targetRatio;

      if (h > availH) {
        h = availH;
        w = h * targetRatio;
      }

      setCanvasDimensions({
        width: Math.floor(w),
        height: Math.floor(h),
      });
    };

    updateDimensions();
    const ro = new ResizeObserver(() => updateDimensions());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dynamic tracks
  const tracks: VNCinematicTrack[] = normalizeCinematicTracks(config, scene.backgroundUrl);

  const updateConfig = (patch: Partial<VNCinematicConfig>) => {
    onUpdateScene({
      cinematicConfig: {
        ...config,
        ...patch,
      },
    });
  };

  // Timeline scrubbing state from timeline ruler
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // History stack for Undo / Redo (Up to 50 states)
  const [history, setHistory] = useState<VNCinematicTrack[][]>([tracks]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const handleUpdateTracks = (newTracks: VNCinematicTrack[], recordHistory = true) => {
    if (recordHistory) {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, newTracks];
        if (next.length > 50) next.shift();
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }
    updateConfig({ tracks: newTracks });
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;
    const targetIdx = historyIndex - 1;
    const prevTracks = history[targetIdx];
    if (prevTracks) {
      setHistoryIndex(targetIdx);
      updateConfig({ tracks: prevTracks });
      playUiSound('select', 0.25);
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const targetIdx = historyIndex + 1;
    const nextTracks = history[targetIdx];
    if (nextTracks) {
      setHistoryIndex(targetIdx);
      updateConfig({ tracks: nextTracks });
      playUiSound('select', 0.25);
    }
  };

  // High-precision clock hook with requestAnimationFrame
  const clock = useCinematicClock({
    totalDuration,
  });

  const { currentTimeSec, isPlaying, togglePlay, seek, stepForward, stepBackward, jumpToStart, jumpToEnd } = clock;

  const handleSeek = (newSec: number) => {
    stopAudioPreview();
    seek(newSec);
  };

  const handleTogglePlay = () => {
    stopAudioPreview();
    togglePlay();
  };

  const handleUpdateTotalDuration = (newDuration: number) => {
    updateConfig({ durationSeconds: newDuration });
    if (currentTimeSec > newDuration) {
      seek(newDuration);
    }
  };

  // State and handler for saving cinematic
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSaveCinematic = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      } else {
        saveActiveStory(story);
        await fetch(`/api/projects/${story.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story }),
        });
      }
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      setSaveSuccessMsg('Cinematic Saved!');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (err) {
      console.error('Error saving cinematic:', err);
      setSaveSuccessMsg('Saved to browser');
      setTimeout(() => setSaveSuccessMsg(null), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Find currently selected clip and its parent track
  let selectedClip: VNCinematicClip | null = null;
  for (const t of tracks) {
    const c = t.clips.find((item) => item.id === selectedClipId);
    if (c) {
      selectedClip = c;
      break;
    }
  }

  // Synchronize active track selection with selected clip
  useEffect(() => {
    if (selectedClipId) {
      const parent = tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
      if (parent) setActiveTrackId(parent.id);
    }
  }, [selectedClipId, tracks]);

  // Split selected clip at playhead
  const handleSplitSelectedClip = () => {
    if (!selectedClip) return;
    if (currentTimeSec <= selectedClip.startSec || currentTimeSec >= selectedClip.endSec) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      setSaveSuccessMsg(
        `Playhead (${currentTimeSec.toFixed(1)}s) must be inside clip (${selectedClip.startSec}s - ${selectedClip.endSec}s)`
      );
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return;
    }
    const updated = splitClipAtTime(tracks, selectedClip.id, currentTimeSec);
    handleUpdateTracks(updated);
    playUiSound('select', 0.4);
  };

  // Delete selected clip (leaves gap)
  const handleDeleteClip = (clipId: string) => {
    const updated = tracks.map((t) => ({
      ...t,
      clips: t.clips.filter((c) => c.id !== clipId),
    }));
    handleUpdateTracks(updated);
    if (selectedClipId === clipId) setSelectedClipId(null);
  };

  // Ripple delete selected clip (shifts following clips left to close gap)
  const handleRippleDeleteClip = (clipId: string) => {
    const updated = rippleDeleteClip(tracks, clipId);
    handleUpdateTracks(updated);
    if (selectedClipId === clipId) setSelectedClipId(null);
    playUiSound('delete', 0.35);
  };

  // Clipboard operations (Cut / Copy / Paste / Duplicate)
  const handleCutClip = (clip: VNCinematicClip) => {
    setClipboardClip(clip);
    handleDeleteClip(clip.id);
    playUiSound('delete', 0.35);
  };

  const handleCopyClip = (clip: VNCinematicClip) => {
    setClipboardClip(clip);
    playUiSound('click', 0.25);
  };

  const handlePasteClip = () => {
    if (!clipboardClip) return;
    const duration = clipboardClip.endSec - clipboardClip.startSec;
    const startSec = Number(currentTimeSec.toFixed(1));
    const endSec = Math.min(totalDuration, Number((startSec + duration).toFixed(1)));

    const sourceTrack = tracks.find((t) => t.id === clipboardClip.trackId);
    const section = sourceTrack?.section || 'media';

    const { tracks: currentTracks, targetTrackId } = findOrCreateFreeTrack(tracks, section, startSec, endSec);
    const pastedClip: VNCinematicClip = {
      ...clipboardClip,
      id: `clip-pasted-${Date.now()}`,
      trackId: targetTrackId,
      startSec,
      endSec,
    };

    const updated = currentTracks.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, pastedClip].sort((a, b) => a.startSec - b.startSec) } : t
    );
    handleUpdateTracks(updated);
    setSelectedClipId(pastedClip.id);
    setActiveTrackId(targetTrackId);
    playUiSound('open', 0.35);
  };

  const handleDuplicateClip = (clip: VNCinematicClip) => {
    const { tracks: updatedTracks, newClipId } = duplicateClip(tracks, clip.id, totalDuration);
    handleUpdateTracks(updatedTracks);
    if (newClipId) setSelectedClipId(newClipId);
    playUiSound('open', 0.35);
  };

  const handleUpdateTrack = (trackId: string, patch: Partial<VNCinematicTrack>) => {
    const updated = tracks.map((t) => (t.id === trackId ? { ...t, ...patch } : t));
    handleUpdateTracks(updated);
  };

  const handleDeleteTrack = (trackId: string) => {
    const trackToDelete = tracks.find((t) => t.id === trackId);
    if (trackToDelete && selectedClipId && trackToDelete.clips.some((c) => c.id === selectedClipId)) {
      setSelectedClipId(null);
    }
    handleUpdateTracks(tracks.filter((t) => t.id !== trackId));
    if (activeTrackId === trackId) setActiveTrackId(null);
    playUiSound('delete', 0.35);
  };

  // Context Menu handlers
  const handleContextMenuClip = (e: React.MouseEvent, clip: VNCinematicClip, track?: VNCinematicTrack) => {
    e.preventDefault();
    setSelectedClipId(clip.id);
    if (track) setActiveTrackId(track.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      clip,
      trackId: track?.id || clip.trackId,
    });
  };

  const handleContextMenuLane = (e: React.MouseEvent, track: VNCinematicTrack) => {
    e.preventDefault();
    setActiveTrackId(track.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      clip: null,
      trackId: track.id,
    });
  };

  // CapCut Keyboard Shortcuts (Space, S/C, Delete, Arrow keys, Home/End, Escape, Ctrl+C/V/X/D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')
      ) {
        return;
      }

      // Undo / Redo shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyZ') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          return;
        }
        if (e.code === 'KeyY') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.code === 'KeyS' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleSaveCinematic();
          return;
        }
        if (e.code === 'KeyC' && selectedClip) {
          e.preventDefault();
          handleCopyClip(selectedClip);
          return;
        }
        if (e.code === 'KeyX' && selectedClip) {
          e.preventDefault();
          handleCutClip(selectedClip);
          return;
        }
        if (e.code === 'KeyV' && clipboardClip) {
          e.preventDefault();
          handlePasteClip();
          return;
        }
        if (e.code === 'KeyD' && selectedClip) {
          e.preventDefault();
          handleDuplicateClip(selectedClip);
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
        playUiSound('click', 0.25);
      } else if (e.code === 'KeyS' || e.code === 'KeyC') {
        if (selectedClip && currentTimeSec > selectedClip.startSec && currentTimeSec < selectedClip.endSec) {
          e.preventDefault();
          handleSplitSelectedClip();
        }
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClip) {
          e.preventDefault();
          if (e.shiftKey) {
            handleRippleDeleteClip(selectedClip.id);
          } else {
            handleDeleteClip(selectedClip.id);
            playUiSound('delete', 0.35);
          }
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward(e.shiftKey ? 1.0 : 0.1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward(e.shiftKey ? 1.0 : 0.1);
      } else if (e.code === 'Home') {
        e.preventDefault();
        jumpToStart();
      } else if (e.code === 'End') {
        e.preventDefault();
        jumpToEnd();
      } else if (e.code === 'Escape') {
        if (selectedClipId) {
          e.preventDefault();
          setSelectedClipId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, clipboardClip, currentTimeSec, selectedClipId, handleTogglePlay, stepBackward, stepForward, jumpToStart, jumpToEnd, handleSaveCinematic, handleUndo, handleRedo, handleRippleDeleteClip]);

  // Helper to update a clip
  const handleUpdateClip = (clipId: string, patch: Partial<VNCinematicClip>) => {
    const updated = tracks.map((track) => ({
      ...track,
      clips: track.clips.map((clip) => (clip.id === clipId ? { ...clip, ...patch } : clip)),
    }));
    handleUpdateTracks(updated);
  };

  // Helper to move a clip to another track with collision checks
  const handleMoveClipToTrack = (clipId: string, targetTrackId: string) => {
    const updated = moveClipToTrack(tracks, clipId, targetTrackId);
    handleUpdateTracks(updated);
    setActiveTrackId(targetTrackId);
  };

  // Add Visual Clip from Media Library
  // Add Visual Clip from Media Library (Media or Background section)
  const handleAddMediaClip = (asset: { url: string; name?: string; type: 'image' | 'video'; section?: 'media' | 'background' }) => {
    const targetSection = asset.section || 'media';
    const startSec = Number(currentTimeSec.toFixed(1));
    const endSec = Math.min(totalDuration, Number((startSec + (targetSection === 'background' ? totalDuration : 4)).toFixed(1)));
    const { tracks: currentTracks, targetTrackId } = findOrCreateFreeTrack(tracks, targetSection, startSec, endSec);
    const newClip: VNCinematicClip = {
      id: `clip-vis-${Date.now()}`,
      trackId: targetTrackId,
      name: asset.name || (targetSection === 'background' ? 'Scene Background' : 'New Image'),
      startSec,
      endSec,
      mediaUrl: asset.url,
      mediaType: asset.type,
      xPercent: 50,
      yPercent: 50,
      scale: 1,
      opacity: 1,
      blendMode: 'normal',
      transition: 'fade',
    };

    const updated = currentTracks.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec) } : t
    );
    handleUpdateTracks(updated);
    setSelectedClipId(newClip.id);
    setActiveTrackId(targetTrackId);
  };

  // Add Text / Dialogue Clip from Media Library into Media Section
  const handleAddTextClip = (preset?: {
    text: string;
    style?: string;
    effect?: string;
    speaker?: string;
    avatarUrl?: string;
    speakerColor?: string;
    speakerBadge?: string;
  }) => {
    const startSec = Number(currentTimeSec.toFixed(1));
    const endSec = Math.min(totalDuration, Number((startSec + 3.5).toFixed(1)));
    const { tracks: currentTracks, targetTrackId } = findOrCreateFreeTrack(tracks, 'media', startSec, endSec);
    const newClip: VNCinematicClip = {
      id: `clip-txt-${Date.now()}`,
      trackId: targetTrackId,
      name: preset?.speaker ? `${preset.speaker}: ${preset.text.slice(0, 15)}...` : preset?.text?.slice(0, 15) || 'New Dialogue',
      speaker: preset?.speaker,
      speakerAvatar: preset?.avatarUrl,
      speakerColor: preset?.speakerColor,
      speakerBadge: preset?.speakerBadge,
      dialogueStyle: preset?.speaker ? 'classic_vn' : 'subtitle',
      startSec,
      endSec,
      text: preset?.text || 'New dialogue...',
      fontSize: 'xl',
      textColor: '#ffffff',
      textEffect: preset?.effect,
      textPosition: 'bottom',
      xPercent: 50,
      yPercent: 82,
      scale: 1,
    };

    const updated = currentTracks.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec) } : t
    );
    handleUpdateTracks(updated);
    setSelectedClipId(newClip.id);
    setActiveTrackId(targetTrackId);
  };

  // Add Audio Clip from Media Library
  const handleAddAudioClip = (asset: { url: string; name?: string; isBgm?: boolean }) => {
    const startSec = Number(currentTimeSec.toFixed(1));
    const endSec = Math.min(totalDuration, Number((startSec + (asset.isBgm ? 10 : 3)).toFixed(1)));
    const { tracks: currentTracks, targetTrackId } = findOrCreateFreeTrack(tracks, 'audio', startSec, endSec);
    const newClip: VNCinematicClip = {
      id: `clip-aud-${Date.now()}`,
      trackId: targetTrackId,
      name: asset.name || 'Audio Clip',
      startSec,
      endSec,
      audioUrl: asset.url,
      volume: 0.8,
      loop: Boolean(asset.isBgm),
      waveform: generateWaveformPeaks(asset.name || asset.url),
    };

    const updated = currentTracks.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec) } : t
    );
    handleUpdateTracks(updated);
    setSelectedClipId(newClip.id);
    setActiveTrackId(targetTrackId);
  };

  // Add Screen FX Clip from Media Library
  const handleAddFxClip = (fxType: string) => {
    const startSec = Number(currentTimeSec.toFixed(1));
    const endSec = Math.min(totalDuration, Number((startSec + 4).toFixed(1)));
    const { tracks: currentTracks, targetTrackId } = findOrCreateFreeTrack(tracks, 'media', startSec, endSec);
    const newClip: VNCinematicClip = {
      id: `clip-fx-${Date.now()}`,
      trackId: targetTrackId,
      name: `FX ${fxType.toUpperCase()}`,
      startSec,
      endSec,
      fxType: fxType as any,
      fxIntensity: 'medium',
    };

    const updated = currentTracks.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec) } : t
    );
    handleUpdateTracks(updated);
    setSelectedClipId(newClip.id);
    setActiveTrackId(targetTrackId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent text-[var(--text)] select-none relative z-10">
      {/* Floating Save Toast Notification */}
      {saveSuccessMsg && (
        <div className="absolute top-3 right-4 z-50 pointer-events-none animate-fade-in">
          <div className="bg-emerald-950/95 border border-emerald-500/90 text-emerald-200 text-xs px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.5)] font-mono font-bold flex items-center gap-2 backdrop-blur-md">
            <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* TOP WORKSPACE: 3-PANE LAYOUT (MEDIA LIBRARY | LIVE CANVAS PREVIEW | INSPECTOR) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* 1. LEFT PANE: DOCKED ASSET / MEDIA LIBRARY (CAPCUT STYLE) */}
        <CinematicMediaLibrary
          story={story}
          previewBackgroundUrl={scene.backgroundUrl}
          onAddMediaClip={handleAddMediaClip}
          onAddTextClip={handleAddTextClip}
          onAddAudioClip={handleAddAudioClip}
          onAddFxClip={handleAddFxClip}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
          onOpenAssetStudio={(filterType) => {
            setAssetPickerConfig({
              filterType,
              title: 'Project Asset Studio',
              previewBackgroundUrl: scene.backgroundUrl,
              onSelect: (asset) => {
                if (asset.type === 'bgm' || asset.type === 'sfx' || asset.type === 'voice') {
                  handleAddAudioClip({ url: asset.url, name: asset.name, isBgm: asset.type === 'bgm' });
                } else if (asset.type === 'background') {
                  handleAddMediaClip({ url: asset.url, name: asset.name, type: 'image', section: 'background' });
                } else {
                  handleAddMediaClip({ url: asset.url, name: asset.name, type: 'image', section: 'media' });
                }
              },
            });
          }}
        />

        {/* 2. CENTER PANE: LIVE PREVIEW STAGE WITH DIRECT CANVAS TRANSFORMS & CENTERED TRANSPORT */}
        <div
          ref={centerContainerRef}
          className="flex-1 min-h-0 relative flex flex-col items-center justify-between p-2 md:p-3 bg-[var(--well-bg)] overflow-hidden"
        >
          {/* Strictly 16:9 Aspect Ratio Canvas Stage Container with Dedicated Outside Dock */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && selectedClipId) {
                setSelectedClipId(null);
              }
            }}
            className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-visible"
          >
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget && selectedClipId) {
                  setSelectedClipId(null);
                }
              }}
              className="relative flex items-center justify-center shrink-0"
            >
              {/* 16:9 Canvas Stage */}
              <div
                style={{
                  width: `${canvasDimensions.width}px`,
                  height: `${canvasDimensions.height}px`,
                  aspectRatio: '16 / 9',
                }}
                className="relative rounded-lg overflow-hidden shadow-2xl border border-[var(--border)] bg-black shrink-0 transition-none flex flex-col"
              >
                <CinematicPlayerView
                  scene={scene}
                  isInteractive={true}
                  isEditor={true}
                  currentTimeSec={currentTimeSec}
                  isPlaying={isPlaying}
                  onSeek={handleSeek}
                  onTogglePlay={handleTogglePlay}
                  selectedClipId={selectedClipId}
                  onSelectClip={(id) => setSelectedClipId(id)}
                  onUpdateClip={handleUpdateClip}
                  onContextMenuClip={(e, clip) => handleContextMenuClip(e, clip)}
                  isScrubbing={isScrubbing}
                />
              </div>

              {/* DOCKED VERTICAL STUDIO TOOLBAR (COMPLETELY OUTSIDE CANVAS ON THE RIGHT) */}
              {selectedClip && (() => {
                // Dynamic scaling so the toolbar perfectly fits on screen without losing top/bottom buttons
                const maxToolbarH = Math.max(160, centerContainerHeight - 92);
                const toolbarScale = Math.min(1, Math.max(0.42, maxToolbarH / 580));
                return (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      transform: `translateY(-50%) scale(${toolbarScale})`,
                      transformOrigin: 'left center',
                    }}
                    className="absolute left-full ml-3.5 top-1/2 z-50 shrink-0 pointer-events-auto transition-transform duration-75"
                  >
                  <VNTransformToolbar
                    target={{
                      id: selectedClip.id,
                      xPercent: selectedClip.xPercent ?? 50,
                      yPercent: selectedClip.yPercent ?? (selectedClip.text ? 82 : 50),
                      scale: selectedClip.scale ?? 1,
                      scaleX: selectedClip.scaleX ?? 1,
                      scaleY: selectedClip.scaleY ?? 1,
                      rotation: selectedClip.rotation ?? 0,
                      rotateX: selectedClip.rotateX ?? 0,
                      rotateY: selectedClip.rotateY ?? 0,
                      pivotX: selectedClip.pivotX ?? 50,
                      pivotY: selectedClip.pivotY ?? 50,
                      flipX: selectedClip.flipX,
                      flipY: selectedClip.flipY,
                      crop: selectedClip.crop,
                      isPerspective3D: selectedClip.isPerspective3D,
                      locked: selectedClip.locked,
                      isText: Boolean(selectedClip.text),
                      text: selectedClip.text,
                    }}
                    onUpdate={(patch) => handleUpdateClip(selectedClip.id, patch)}
                    capabilities={{
                      allowCrop: Boolean(selectedClip.mediaUrl || !selectedClip.text),
                      allow3D: Boolean(selectedClip.mediaUrl || !selectedClip.text),
                      allowPivot: false,
                      allowFlip: true,
                      allowLock: true,
                      allowRotate: true,
                    }}
                    onDelete={() => handleDeleteClip(selectedClip.id)}
                    notify={setSaveSuccessMsg}
                  />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Centered Playback Transport Bar Directly Under Canvas */}
          <div className="pt-2 pb-1 flex flex-col items-center gap-1.5 shrink-0 z-30">
            <CinematicTransportBar
              currentTimeSec={currentTimeSec}
              totalDuration={totalDuration}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onSplitAtPlayhead={handleSplitSelectedClip}
              canSplit={Boolean(
                selectedClip && currentTimeSec > selectedClip.startSec && currentTimeSec < selectedClip.endSec
              )}
              onSave={handleSaveCinematic}
              isSaving={isSaving}
            />
          </div>
        </div>

        {/* 3. RIGHT PANE: CLIP PROPERTIES INSPECTOR */}
        <CinematicClipInspector
          selectedClip={selectedClip}
          activeTrackId={activeTrackId}
          tracks={tracks}
          totalDuration={totalDuration}
          story={story}
          onUpdateClip={handleUpdateClip}
          onUpdateTrack={handleUpdateTrack}
          onMoveClipToTrack={handleMoveClipToTrack}
          onDeleteClip={handleDeleteClip}
          onDeleteTrack={handleDeleteTrack}
          onClose={() => {
            setSelectedClipId(null);
            setActiveTrackId(null);
          }}
          onOpenAssetPicker={(filterType, onSelect) => {
            setAssetPickerConfig({
              filterType: filterType === 'sfx' ? 'sfx' : 'background',
              title: 'Browse Asset Library',
              onSelect: (asset) => onSelect(asset.url, asset.name),
            });
          }}
        />
      </div>

      {/* BOTTOM WORKSPACE: MULTITRACK TIMELINE SEQUENCER */}
      <CinematicMultitrackTimeline
        tracks={tracks}
        totalDuration={totalDuration}
        currentTimeSec={currentTimeSec}
        isPlaying={isPlaying}
        selectedClipId={selectedClipId}
        activeTrackId={activeTrackId}
        onSelectClip={(id) => setSelectedClipId(id)}
        onSelectTrack={(tId) => setActiveTrackId(tId)}
        onSeek={handleSeek}
        onUpdateTracks={handleUpdateTracks}
        onUpdateTotalDuration={handleUpdateTotalDuration}
        timelineHeight={timelineHeight}
        onResizeTimelineHeight={setTimelineHeight}
        onContextMenuClip={handleContextMenuClip}
        onContextMenuLane={handleContextMenuLane}
        onSave={handleSaveCinematic}
        isSaving={isSaving}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onScrubbingChange={setIsScrubbing}
        notify={(msg) => {
          setSaveSuccessMsg(msg);
          setTimeout(() => setSaveSuccessMsg(null), 3000);
        }}
      />

      {/* GLOBAL RIGHT-CLICK CONTEXT MENU (Canvas & Timeline) */}
      <CinematicContextMenu
        menu={contextMenu}
        hasClipboard={Boolean(clipboardClip)}
        canSplit={Boolean(
          selectedClip && currentTimeSec > selectedClip.startSec && currentTimeSec < selectedClip.endSec
        )}
        onClose={() => setContextMenu(null)}
        onCut={handleCutClip}
        onCopy={handleCopyClip}
        onPaste={handlePasteClip}
        onDuplicate={handleDuplicateClip}
        onSplit={handleSplitSelectedClip}
        onDelete={(clip) => handleDeleteClip(clip.id)}
        onRippleDelete={(clip) => handleRippleDeleteClip(clip.id)}
        tracks={tracks}
        onRenameTrack={(tId) => {
          const t = tracks.find((item) => item.id === tId);
          const newName = prompt('Enter new track name:', t?.name || '');
          if (newName && newName.trim()) {
            handleUpdateTrack(tId, { name: newName.trim() });
          }
        }}
        onDeleteTrack={handleDeleteTrack}
        onToggleTrackMute={(tId) => {
          const t = tracks.find((item) => item.id === tId);
          if (t) handleUpdateTrack(tId, { muted: !t.muted });
        }}
        onToggleTrackVisibility={(tId) => {
          const t = tracks.find((item) => item.id === tId);
          if (t) handleUpdateTrack(tId, { visible: t.visible === false ? true : false });
        }}
      />

      {/* ASSET STUDIO MODAL PICKER OVERLAY */}
      {assetPickerConfig && (
        <AssetStudioModal
          story={story}
          filterType={assetPickerConfig.filterType}
          initialFilterType={assetPickerConfig.filterType}
          previewBackgroundUrl={assetPickerConfig.previewBackgroundUrl || scene.backgroundUrl}
          onUpdateStoryCustomAssets={onUpdateStoryCustomAssets}
          onSelectAsset={(asset) => {
            assetPickerConfig.onSelect(asset);
            setAssetPickerConfig(null);
            playUiSound('select', 0.35);
          }}
          onClose={() => setAssetPickerConfig(null)}
          notify={() => {}}
        />
      )}
    </div>
  );
}
