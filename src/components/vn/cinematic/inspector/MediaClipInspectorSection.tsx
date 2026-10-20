"use client";
import React from 'react';
import { VNCinematicClip } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface MediaClipInspectorSectionProps {
  clip: VNCinematicClip;
  onUpdateClip: (clipId: string, patch: Partial<VNCinematicClip>) => void;
  onOpenAssetPicker?: (type: 'sfx' | 'bg' | 'character' | 'font', onSelect: (url: string, name?: string) => void) => void;
}

export const MediaClipInspectorSection: React.FC<MediaClipInspectorSectionProps> = ({
  clip,
  onUpdateClip,
  onOpenAssetPicker,
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-[var(--muted)] uppercase">Image / Video URL:</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={clip.mediaUrl || ''}
            onChange={(e) => onUpdateClip(clip.id, { mediaUrl: e.target.value })}
            className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[11px] text-[var(--text)] font-mono"
            placeholder="https://..."
          />
          {onOpenAssetPicker && (
            <button
              onClick={() =>
                onOpenAssetPicker('bg', (url, name) =>
                  onUpdateClip(clip.id, { mediaUrl: url, name: name || clip.name })
                )
              }
              className="px-2 py-1 rounded bg-[var(--accent)] text-white font-bold text-[10px] shrink-0 hover:opacity-90 transition-opacity"
            >
              Gallery
            </button>
          )}
        </div>
      </div>

      {/* Canvas Coordinates X & Y */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[var(--muted)] block mb-0.5">Position X (%):</label>
          <input
            type="number"
            min={0}
            max={100}
            value={clip.xPercent ?? 50}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateClip(clip.id, { xPercent: Number.isFinite(val) ? val : 50 });
            }}
            className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] block mb-0.5">Position Y (%):</label>
          <input
            type="number"
            min={0}
            max={100}
            value={clip.yPercent ?? 50}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateClip(clip.id, { yPercent: Number.isFinite(val) ? val : 50 });
            }}
            className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] font-mono"
          />
        </div>
      </div>

      {/* Scale & Opacity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[10px] text-[var(--muted)] font-bold">
              Scale / Zoom: {(clip.scale ?? 1).toFixed(2)}x
            </label>
            {(clip.scale !== 1 || clip.xPercent !== 50 || clip.yPercent !== 50) && (
              <button
                type="button"
                onClick={() => onUpdateClip(clip.id, { scale: 1, xPercent: 50, yPercent: 50, rotation: 0 })}
                className="text-[9px] text-cyan-400 hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
                title="Reset scale and position to default 100% fit"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.reset} className="w-2.5 h-2.5" />
                <span>100% Fit</span>
              </button>
            )}
          </div>
          <input
            type="range"
            min={0.2}
            max={4.0}
            step={0.05}
            value={clip.scale ?? 1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateClip(clip.id, { scale: Number.isFinite(val) ? Math.max(0.1, val) : 1 });
            }}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] block mb-0.5">
            Opacity: {Math.round((clip.opacity ?? 1) * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={clip.opacity ?? 1}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateClip(clip.id, { opacity: Number.isFinite(val) ? Math.max(0, Math.min(1, val)) : 1 });
            }}
            className="w-full accent-[var(--accent)]"
          />
        </div>
      </div>

      {/* Blend Mode & Transition */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-[var(--muted)] block mb-0.5">Blend Mode:</label>
          <select
            value={clip.blendMode || 'normal'}
            onChange={(e) => onUpdateClip(clip.id, { blendMode: e.target.value as any })}
            className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px]"
          >
            <option value="normal">Normal</option>
            <option value="screen">Screen (Light/Fire)</option>
            <option value="multiply">Multiply (Shadow)</option>
            <option value="overlay">Overlay</option>
            <option value="lighten">Lighten</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[var(--muted)] block mb-0.5">Transition:</label>
          <select
            value={clip.transition || 'fade'}
            onChange={(e) => onUpdateClip(clip.id, { transition: e.target.value as any })}
            className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px]"
          >
            <option value="fade">Fade In/Out</option>
            <option value="cut">Direct Cut</option>
            <option value="zoom">Zoom Pop</option>
            <option value="slide">Slide</option>
            <option value="glitch">Glitch</option>
          </select>
        </div>
      </div>
    </div>
  );
};
