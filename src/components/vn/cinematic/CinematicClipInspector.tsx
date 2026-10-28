"use client";
import React, { useState, useRef, useEffect } from 'react';
import { VNCinematicClip, VNCinematicTrack, VNStory } from '@/types/vn';
import { MediaClipInspectorSection } from './inspector/MediaClipInspectorSection';
import { TextClipInspectorSection } from './inspector/TextClipInspectorSection';
import { AudioClipInspectorSection } from './inspector/AudioClipInspectorSection';
import { FxClipInspectorSection } from './inspector/FxClipInspectorSection';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicClipInspectorProps {
  selectedClip: VNCinematicClip | null;
  activeTrackId?: string | null;
  tracks: VNCinematicTrack[];
  totalDuration: number;
  story?: VNStory;
  onUpdateClip: (clipId: string, patch: Partial<VNCinematicClip>) => void;
  onUpdateTrack?: (trackId: string, patch: Partial<VNCinematicTrack>) => void;
  onMoveClipToTrack: (clipId: string, targetTrackId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onClose?: () => void;
  onOpenAssetPicker?: (type: 'sfx' | 'bg' | 'character' | 'font', onSelect: (url: string, name?: string) => void) => void;
}

export const CinematicClipInspector: React.FC<CinematicClipInspectorProps> = ({
  selectedClip,
  activeTrackId,
  tracks,
  totalDuration,
  story,
  onUpdateClip,
  onUpdateTrack,
  onMoveClipToTrack,
  onDeleteClip,
  onDeleteTrack,
  onClose,
  onOpenAssetPicker,
}) => {
  const [inspectorWidth, setInspectorWidth] = useState<number>(320);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(320);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startXRef.current - e.clientX; // dragging left expands width
      const newW = Math.max(260, Math.min(560, startWidthRef.current + deltaX));
      setInspectorWidth(newW);
    };

    const onPointerUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (isResizingRef.current) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  const handleStartResize = (e: React.PointerEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = inspectorWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const currentTrack = selectedClip ? tracks.find((t) => t.clips.some((c) => c.id === selectedClip.id)) : null;
  const trackKind = currentTrack?.kind || (currentTrack?.section === 'media' ? 'visual' : currentTrack?.section === 'dialog' ? 'text' : currentTrack?.section === 'audio' ? 'audio' : 'visual');

  return (
    <div
      style={{ width: `${inspectorWidth}px` }}
      className="relative border-l border-[var(--border)] bg-[var(--surface)] flex flex-col h-full select-none shrink-0 text-xs overflow-y-auto animate-fade-in z-20"
    >
      {/* DRAG-TO-RESIZE LEFT HANDLE */}
      <div
        onPointerDown={handleStartResize}
        className="absolute top-0 left-0 bottom-0 w-2.5 -ml-1 cursor-col-resize hover:bg-[var(--accent)]/50 active:bg-[var(--accent)] transition-colors z-30 group"
        title="Drag to resize inspector width"
      >
        <div className="h-full w-0.5 bg-transparent group-hover:bg-[var(--accent)] mx-auto" />
      </div>

      {!selectedClip ? (
        (() => {
          const activeTrack = activeTrackId ? tracks.find((t) => t.id === activeTrackId) : null;
          if (activeTrack) {
            return (
              <div className="flex flex-col h-full">
                {/* Track Inspector Header */}
                <div className="p-3 border-b border-[var(--border)] bg-[var(--well-bg)] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <GuiIconRenderer
                      icon={
                        activeTrack.section === 'audio'
                          ? GUI_ICONS.general.sound
                          : activeTrack.section === 'background'
                          ? GUI_ICONS.general.background
                          : GUI_ICONS.general.clapperboard
                      }
                      className="w-4 h-4 text-cyan-400"
                    />
                    <span className="font-bold text-[var(--text)] uppercase tracking-wider truncate text-[11px]">
                      Track Settings
                    </span>
                  </div>
                  {onDeleteTrack && (
                    <button
                      onClick={() => onDeleteTrack(activeTrack.id)}
                      className="text-red-400 hover:text-red-300 font-bold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                      title="Delete track"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                {/* Track Properties Body */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase font-bold block mb-1">
                      Track Name / Label:
                    </label>
                    <input
                      type="text"
                      value={activeTrack.name || ''}
                      onChange={(e) => onUpdateTrack && onUpdateTrack(activeTrack.id, { name: e.target.value })}
                      placeholder={`Track ${activeTrack.index}`}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] text-xs text-[var(--text)] font-bold focus:outline-none focus:border-cyan-400 shadow-inner"
                    />
                  </div>

                  <div className="p-2.5 rounded-md bg-[var(--well-bg)] border border-[var(--border)] space-y-2 text-[11px]">
                    <div className="flex justify-between items-center text-[var(--muted)]">
                      <span>Section:</span>
                      <span className="font-bold uppercase text-cyan-300 font-mono text-[10px]">
                        {activeTrack.section}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[var(--muted)]">
                      <span>Layer Priority (Index):</span>
                      <span className="font-mono text-[var(--text)] font-bold">{activeTrack.index}</span>
                    </div>
                    <div className="flex justify-between items-center text-[var(--muted)]">
                      <span>Clips on this Track:</span>
                      <span className="font-mono text-amber-500 dark:text-amber-300 font-bold">{activeTrack.clips.length}</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-1 border-t border-white/5">
                    <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] cursor-pointer hover:border-white/20 transition-colors">
                      <span className="font-medium text-xs text-[var(--text)] flex items-center gap-2">
                        <GuiIconRenderer
                          icon={activeTrack.visible !== false ? GUI_ICONS.general.viewShow : GUI_ICONS.general.viewHide}
                          className="w-3.5 h-3.5"
                        />
                        <span>Track Visible</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={activeTrack.visible !== false}
                        onChange={(e) => onUpdateTrack && onUpdateTrack(activeTrack.id, { visible: e.target.checked })}
                        className="accent-cyan-400 rounded"
                      />
                    </label>

                    {activeTrack.section === 'audio' && (
                      <label className="flex items-center justify-between p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] cursor-pointer hover:border-white/20 transition-colors">
                        <span className="font-medium text-xs text-[var(--text)] flex items-center gap-2">
                          <GuiIconRenderer
                            icon={activeTrack.muted ? GUI_ICONS.general.speakerOff : GUI_ICONS.general.speaker}
                            className="w-3.5 h-3.5"
                          />
                          <span>Mute Audio Track</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(activeTrack.muted)}
                          onChange={(e) => onUpdateTrack && onUpdateTrack(activeTrack.id, { muted: e.target.checked })}
                          className="accent-red-400 rounded"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-[var(--muted)] space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] flex items-center justify-center text-2xl shadow-inner">
                <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-6 h-6 text-cyan-400 opacity-80" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--text)] mb-1">Inspector</h4>
                <p className="text-[11px] leading-relaxed max-w-[210px] text-[var(--muted)]">
                  Select any clip or track from the timeline to rename it and adjust its properties.
                </p>
              </div>
              <div className="text-[10px] text-[var(--muted)] bg-[var(--well-bg)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                Double-click track name to rename
              </div>
            </div>
          );
        })()
      ) : (
        <>
          {/* Header */}
          <div className="p-3 border-b border-[var(--border)] bg-[var(--well-bg)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <GuiIconRenderer
                icon={
                  trackKind === 'visual'
                    ? GUI_ICONS.general.background
                    : trackKind === 'text'
                    ? GUI_ICONS.general.conversation
                    : trackKind === 'audio'
                    ? GUI_ICONS.general.sound
                    : GUI_ICONS.general.screenFx
                }
                className="w-4 h-4 text-cyan-400"
              />
              <span className="font-bold text-[var(--text)] uppercase tracking-wider truncate">
                {selectedClip.name || selectedClip.text || 'Selected Clip'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDeleteClip(selectedClip.id)}
                className="text-red-400 hover:text-red-300 font-bold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                title="Delete clip"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                <span>Delete</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-[var(--btn-bg)] text-[var(--muted)] hover:text-white cursor-pointer"
                  title="Close inspector"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 space-y-4">
            {/* Layer / Track Assignment (Moving clips between layers!) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--muted)] uppercase">
                Assigned Track:
              </label>
              <select
                value={selectedClip.trackId}
                onChange={(e) => onMoveClipToTrack(selectedClip.id, e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-xs font-semibold cursor-pointer outline-none focus:border-[var(--accent)]"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || `${t.section.toUpperCase()} ${t.index}`} ({(t.kind || t.section).toUpperCase()})
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-[var(--muted)] block">
                Shift this clip to another track to adjust visual priority or lane organization.
              </span>
            </div>

            {/* Timing Block (Start, End, Duration) */}
            <div className="p-2.5 rounded-md border border-[var(--border)] bg-[var(--well-bg)] space-y-2">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.state.backwardTime} className="w-3 h-3 text-cyan-400" />
                <span>Clip Timing</span>
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[9px] text-[var(--muted)] block mb-0.5">Start (s):</label>
                  <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={totalDuration}
                    value={selectedClip.startSec}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (Number.isFinite(val)) {
                        const safeStart = Math.max(0, val);
                        const safeEnd = Math.max(safeStart + 0.1, Number.isFinite(selectedClip.endSec) ? selectedClip.endSec : safeStart + 1);
                        onUpdateClip(selectedClip.id, { startSec: safeStart, endSec: safeEnd });
                      }
                    }}
                    className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[var(--muted)] block mb-0.5">End (s):</label>
                  <input
                    type="number"
                    step={0.1}
                    min={(Number.isFinite(selectedClip.startSec) ? selectedClip.startSec : 0) + 0.1}
                    max={totalDuration}
                    value={selectedClip.endSec}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (Number.isFinite(val)) {
                        const minEnd = (Number.isFinite(selectedClip.startSec) ? selectedClip.startSec : 0) + 0.1;
                        const safeEnd = Math.max(minEnd, val);
                        onUpdateClip(selectedClip.id, { endSec: safeEnd });
                      }
                    }}
                    className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs"
                  />
                </div>
              </div>
              <div className="text-[10px] text-[var(--muted)] font-mono flex justify-between pt-1 border-t border-[var(--border)]">
                <span>Total Duration:</span>
                <span className="font-bold text-[var(--accent)]">
                  {Math.max(0.1, (Number.isFinite(selectedClip.endSec) ? selectedClip.endSec : 1) - (Number.isFinite(selectedClip.startSec) ? selectedClip.startSec : 0)).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Specific Sections based on clip properties */}
            {Boolean(selectedClip.mediaUrl || (!selectedClip.text && !selectedClip.audioUrl && !selectedClip.fxType && trackKind === 'visual')) && (
              <MediaClipInspectorSection
                clip={selectedClip}
                onUpdateClip={onUpdateClip}
                onOpenAssetPicker={onOpenAssetPicker}
              />
            )}

            {Boolean(selectedClip.text) && (
              <TextClipInspectorSection
                clip={selectedClip}
                onUpdateClip={onUpdateClip}
                story={story}
                onOpenAssetPicker={onOpenAssetPicker}
              />
            )}

            {Boolean(selectedClip.audioUrl || (!selectedClip.text && !selectedClip.mediaUrl && trackKind === 'audio')) && (
              <AudioClipInspectorSection
                clip={selectedClip}
                onUpdateClip={onUpdateClip}
                onOpenAssetPicker={onOpenAssetPicker}
              />
            )}

            {Boolean(selectedClip.fxType) && (
              <FxClipInspectorSection clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
