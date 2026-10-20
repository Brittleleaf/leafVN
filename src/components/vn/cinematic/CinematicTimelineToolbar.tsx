"use client";
import React from 'react';
import { VNCinematicClip, VNCinematicSection } from '@/types/vn';
import { playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicTimelineToolbarProps {
  selectedClip: VNCinematicClip | null;
  snapEnabled: boolean;
  onToggleSnap: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  totalDuration: number;
  onUpdateTotalDuration: (dur: number) => void;
  onDeleteSelectedClip: () => void;
  onRippleDeleteSelectedClip?: () => void;
  onSplitSelectedClip?: () => void;
  onAddTrackToSection?: (section: VNCinematicSection) => void;
  onSave?: () => void;
  isSaving?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const CinematicTimelineToolbar: React.FC<CinematicTimelineToolbarProps> = ({
  selectedClip,
  snapEnabled,
  onToggleSnap,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  totalDuration,
  onUpdateTotalDuration,
  onDeleteSelectedClip,
  onRippleDeleteSelectedClip,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="h-9 px-3 border-b border-[var(--border)] bg-[var(--well-bg)] flex items-center justify-between text-xs shrink-0 select-none">
      {/* LEFT: History (Undo/Redo) & Selected Clip Deletion */}
      <div className="flex items-center gap-1.5 min-w-[140px]">
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-2 py-1 rounded font-bold text-[11px] flex items-center gap-1.5 transition-all border ${
            canUndo
              ? 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)] cursor-pointer active:scale-95'
              : 'bg-transparent border-transparent text-[var(--muted2)] opacity-40 cursor-not-allowed'
          }`}
          title="Undo last action (Ctrl+Z)"
        >
          <GuiIconRenderer icon={GUI_ICONS.state.backwardTime} className="w-3 h-3" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-2 py-1 rounded font-bold text-[11px] flex items-center gap-1.5 transition-all border ${
            canRedo
              ? 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)] cursor-pointer active:scale-95'
              : 'bg-transparent border-transparent text-[var(--muted2)] opacity-40 cursor-not-allowed'
          }`}
          title="Redo action (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-3 h-3" />
          <span className="hidden sm:inline">Redo</span>
        </button>

        {/* Delete / Ripple Delete when clip is selected */}
        {selectedClip && (
          <>
            <div className="h-4 w-px bg-[var(--border)] mx-1" />
            <button
              onClick={onDeleteSelectedClip}
              className="px-2 py-1 rounded bg-red-950/70 hover:bg-red-900 text-red-200 hover:text-white border border-red-500/50 font-bold text-[11px] cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
              title="Delete selected clip leaving gap (Del)"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3" />
              <span className="hidden md:inline">Delete</span>
            </button>

            {onRippleDeleteSelectedClip && (
              <button
                onClick={onRippleDeleteSelectedClip}
                className="px-2 py-1 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-300 hover:text-amber-100 border border-amber-600/70 font-bold text-[11px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Ripple Delete: Deletes clip and automatically pulls following clips left to close the gap (Shift+Del)"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3 h-3 rotate-180" />
                <span className="hidden md:inline">Ripple Del</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* CENTER: Snap on left | Zoom +/- in center | Duration tab on right */}
      <div className="flex items-center gap-3">
        {/* 1. Snap on the left */}
        <button
          onClick={() => {
            onToggleSnap();
            playUiSound('click', 0.2);
          }}
          className={`px-2.5 py-1 rounded border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
            snapEnabled
              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
              : 'border-[var(--border)] bg-[var(--btn-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
          }`}
          title="Magnetic snap to playhead, clip boundaries and time markers"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.snap} className="w-3 h-3" />
          <span>Snap {snapEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* 2. Zoom Controls in the center */}
        <div className="flex items-center gap-1 bg-[var(--well-bg)] rounded-lg px-2 py-0.5 border border-[var(--border)] shadow-inner">
          <button
            onClick={() => {
              onZoomOut();
              playUiSound('click', 0.15);
            }}
            disabled={zoom <= 1}
            className="w-5 h-5 flex items-center justify-center text-[12px] font-bold text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={() => {
              onResetZoom();
              playUiSound('click', 0.15);
            }}
            className="text-[11px] font-mono font-bold text-cyan-400 hover:underline px-1.5 cursor-pointer"
            title="Reset Zoom (100%)"
          >
            {Math.round((Number.isFinite(zoom) && zoom > 0 ? zoom : 1) * 100)}%
          </button>
          <button
            onClick={() => {
              onZoomIn();
              playUiSound('click', 0.15);
            }}
            disabled={zoom >= 4}
            className="w-5 h-5 flex items-center justify-center text-[12px] font-bold text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-30 cursor-pointer transition-colors"
            title="Zoom In"
          >
            +
          </button>
        </div>

        {/* 3. Duration tab to the right of zoom */}
        <div className="flex items-center gap-1.5 bg-[var(--well-bg)] rounded-lg px-2.5 py-1 border border-[var(--border)]">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider">Duration:</span>
          <input
            type="number"
            min={2}
            max={300}
            value={totalDuration}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateTotalDuration(Number.isFinite(val) ? Math.min(300, Math.max(2, val)) : 12);
            }}
            className="w-12 px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--btn-bg)] font-mono text-[11px] text-right font-bold text-[var(--text)] focus:outline-none focus:border-cyan-400"
          />
          <span className="text-[10px] text-[var(--muted)] font-mono">s</span>
        </div>
      </div>

      {/* RIGHT: Selected Clip Indicator or Balanced Label */}
      <div className="min-w-[140px] flex justify-end items-center">
        {selectedClip ? (
          <span className="text-[10px] font-mono text-cyan-300 truncate max-w-[130px] hidden lg:inline">
            Clip: {selectedClip.name || selectedClip.id}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[var(--muted)] hidden lg:inline">
            Timeline Sequencer
          </span>
        )}
      </div>
    </div>
  );
};
