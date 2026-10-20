"use client";
import React, { useState, useEffect } from 'react';
import { VNCinematicClip } from '@/types/vn';
import { playAudioPreview, subscribeAudioPreview, getActivePreviewUrl } from '@/lib/audioSettings';
import { getAudioDuration } from '../hooks/useCinematicAudio';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface AudioClipInspectorSectionProps {
  clip: VNCinematicClip;
  onUpdateClip: (clipId: string, patch: Partial<VNCinematicClip>) => void;
  onOpenAssetPicker?: (type: 'sfx' | 'bg' | 'character' | 'font', onSelect: (url: string, name?: string) => void) => void;
}

export const AudioClipInspectorSection: React.FC<AudioClipInspectorSectionProps> = ({
  clip,
  onUpdateClip,
  onOpenAssetPicker,
}) => {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAudioPreview(() => {
      setActiveUrl(getActivePreviewUrl());
    });
  }, []);

  const isPlaying = Boolean(clip.audioUrl && activeUrl === clip.audioUrl);
  const detectedDuration = getAudioDuration(clip.audioUrl || clip.sfx);
  const clipDuration = Number((clip.endSec - clip.startSec).toFixed(1));
  const isAutoLooping = Boolean(detectedDuration && clipDuration > detectedDuration + 0.05);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-[var(--muted)] block mb-1">Audio Name / Label:</label>
        <input
          type="text"
          value={clip.name || ''}
          onChange={(e) => onUpdateClip(clip.id, { name: e.target.value })}
          className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)]"
        />
      </div>

      <div>
        <label className="text-[10px] text-[var(--muted)] block mb-1">Audio File URL:</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={clip.audioUrl || ''}
            onChange={(e) => onUpdateClip(clip.id, { audioUrl: e.target.value })}
            className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[11px] text-[var(--text)] font-mono"
            placeholder="/assets/audio/..."
          />
          {onOpenAssetPicker && (
            <button
              onClick={() =>
                onOpenAssetPicker('sfx', (url, name) =>
                  onUpdateClip(clip.id, { audioUrl: url, name: name || clip.name })
                )
              }
              className="px-2 py-1 rounded bg-[var(--accent)] text-white font-bold text-[10px] shrink-0 hover:opacity-90 transition-opacity"
            >
              Gallery
            </button>
          )}
          <button
            type="button"
            onClick={() => clip.audioUrl && playAudioPreview(clip.audioUrl, clip.volume ?? 0.8)}
            className={`px-2.5 py-1 rounded font-bold text-xs transition-colors cursor-pointer flex items-center justify-center ${
              isPlaying
                ? 'bg-[#A1FE10]/30 text-[#A1FE10] border border-[#A1FE10] animate-pulse'
                : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-amber-400'
            }`}
            title={isPlaying ? "Stop audio preview" : "Preview Audio"}
          >
            <GuiIconRenderer
              icon={isPlaying ? GUI_ICONS.state.pause : GUI_ICONS.state.play}
              className="w-3.5 h-3.5"
            />
          </button>
        </div>
      </div>

      {/* Duration info */}
      <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1 text-[10px]">
        <div className="flex justify-between text-[var(--muted)]">
          <span>Timeline Span:</span>
          <span className="font-mono font-bold text-white">{clipDuration}s ({clip.startSec}s - {clip.endSec}s)</span>
        </div>
        {detectedDuration && (
          <div className="flex justify-between text-[var(--muted)]">
            <span>Audio File Duration:</span>
            <span className="font-mono text-gray-300">{detectedDuration.toFixed(1)}s</span>
          </div>
        )}
        {isAutoLooping && (
          <div className="pt-1 text-[#A1FE10] font-bold flex items-center gap-1.5 text-[9px]">
            <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-2.5 h-2.5" />
            <span>Auto-loop active (stretched beyond file duration)</span>
          </div>
        )}
      </div>

      {/* Volume slider */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-[var(--muted)]">Volume:</span>
          <span className="font-bold font-mono text-amber-400">
            {Math.round((clip.volume ?? 0.8) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={clip.volume ?? 0.8}
          onChange={(e) => onUpdateClip(clip.id, { volume: parseFloat(e.target.value) || 0 })}
          className="w-full accent-amber-500"
        />
      </div>

      {/* Fade In & Fade Out Curves */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--muted)]">Fade In:</span>
            <span className="font-mono text-cyan-400 text-[10px]">{(clip.fadeInSec ?? 0).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, Math.min(5, (clipDuration || 0) / 2))}
            step={0.1}
            value={clip.fadeInSec ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateClip(clip.id, { fadeInSec: Number.isFinite(val) ? Math.max(0, val) : 0 });
            }}
            className="w-full accent-cyan-400"
          />
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-[var(--muted)]">Fade Out:</span>
            <span className="font-mono text-cyan-400 text-[10px]">{(clip.fadeOutSec ?? 0).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0.1, Math.min(5, (clipDuration || 0) / 2))}
            step={0.1}
            value={clip.fadeOutSec ?? 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateClip(clip.id, { fadeOutSec: Number.isFinite(val) ? Math.max(0, val) : 0 });
            }}
            className="w-full accent-cyan-400"
          />
        </div>
      </div>

      {/* Source In-point Slip Offset */}
      {(clip.sourceOffsetSec ?? 0) > 0 && (
        <div className="flex justify-between items-center px-2 py-1 bg-black/40 rounded border border-white/5 text-[10px]">
          <span className="text-[var(--muted)]">Slip Trim Offset:</span>
          <span className="font-mono text-amber-300">+{clip.sourceOffsetSec?.toFixed(2)}s in file</span>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-[var(--text)] font-bold">
        <input
          type="checkbox"
          checked={Boolean(clip.loop) || isAutoLooping}
          disabled={isAutoLooping}
          onChange={(e) => onUpdateClip(clip.id, { loop: e.target.checked })}
          className="rounded border-[var(--border)] text-amber-500 disabled:opacity-60"
        />
        <span>Loop Playback {isAutoLooping && '(Forced by stretch)'}</span>
      </label>
    </div>
  );
};
