"use client";
import React from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicTransportBarProps {
  currentTimeSec: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (newTime: number) => void;
  onSplitAtPlayhead?: () => void;
  canSplit?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}

export const CinematicTransportBar: React.FC<CinematicTransportBarProps> = ({
  currentTimeSec,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSplitAtPlayhead,
  canSplit = false,
  onSave,
  isSaving = false,
}) => {
  const formatTime = (sec: number) => {
    const safeSec = Number.isFinite(sec) && sec >= 0 ? sec : 0;
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    const ms = Math.floor((safeSec % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-[var(--border)] shadow-2xl select-none text-xs">
      {/* Replay Button */}
      <button
        onClick={() => onSeek(0)}
        className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
        title="Replay from start (0s)"
      >
        <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-3.5 h-3.5" />
      </button>

      {/* Step Backward 1s */}
      <button
        onClick={() => onSeek(Math.max(0, currentTimeSec - 1))}
        className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors font-mono cursor-pointer"
        title="Rewind 1s"
      >
        -1s
      </button>

      {/* Play / Pause Main Button */}
      <button
        onClick={onTogglePlay}
        className={`px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
          isPlaying
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : 'bg-[var(--accent)] hover:opacity-90 text-white'
        }`}
        title="Space to Play/Pause"
      >
        <GuiIconRenderer icon={isPlaying ? GUI_ICONS.state.pause : GUI_ICONS.state.play} className="w-3.5 h-3.5" />
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
      </button>

      {/* Step Forward 1s */}
      <button
        onClick={() => onSeek(Math.min(totalDuration, currentTimeSec + 1))}
        className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors font-mono cursor-pointer"
        title="Forward 1s"
      >
        +1s
      </button>

      <div className="h-4 w-px bg-white/20 mx-1" />

      {/* Digital Time Readout */}
      <div className="px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-cyan-300 font-mono text-[11px] font-bold tracking-wider">
        {formatTime(currentTimeSec)} / {formatTime(totalDuration)}
      </div>

      {/* Quick Split Tool Button if available */}
      {onSplitAtPlayhead && (
        <>
          <div className="h-4 w-px bg-white/20 mx-1" />
          <button
            onClick={onSplitAtPlayhead}
            disabled={!canSplit}
            className={`px-2.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5 transition-all ${
              canSplit
                ? 'bg-red-950/60 hover:bg-red-900 border border-red-500/60 text-red-300 cursor-pointer shadow-sm'
                : 'bg-white/5 text-gray-500 opacity-40 cursor-not-allowed'
            }`}
            title="Split selected clip at playhead position"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.split} className="w-3 h-3" />
            <span>Split</span>
          </button>
        </>
      )}

      {/* Save Button */}
      {onSave && (
        <>
          <div className="h-4 w-px bg-white/20 mx-1" />
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5 transition-all bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/60 text-emerald-200 hover:text-white cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
            title="Save cinematic state and project (Ctrl+S)"
          >
            {isSaving ? (
              <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-3 h-3 animate-spin" />
            ) : (
              <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3 h-3" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </>
      )}
    </div>
  );
};
