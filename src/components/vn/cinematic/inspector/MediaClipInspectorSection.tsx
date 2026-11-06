"use client";
import React from 'react';
import { VNCinematicClip, VNCinematicTransitionType, VNCinematicAnimationType } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import {
  CINEMATIC_TRANSITIONS_CATALOG,
  IN_ANIMATIONS_CATALOG,
  OUT_ANIMATIONS_CATALOG,
  TransitionBowtieIcon,
} from '../cinematicTransitions';

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

      {/* Blend Mode */}
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

      {/* CAPCUT TRANSITIONS & IN/OUT ANIMATIONS */}
      <div className="pt-2 border-t border-[var(--border)] space-y-3">
        {/* Cut Transition Header */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
          <TransitionBowtieIcon className="w-3.5 h-3.5" />
          <span>Cut Transition (Between Media)</span>
        </div>

        <div className="space-y-1.5 p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-[var(--text)]">Transition Style:</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">
              {((clip.transitionDuration ?? 0.5)).toFixed(1)}s
            </span>
          </div>
          <select
            value={clip.transition || 'dissolve'}
            onChange={(e) => onUpdateClip(clip.id, { transition: e.target.value as any })}
            className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-medium"
          >
            {CINEMATIC_TRANSITIONS_CATALOG.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.category}] {t.name}
              </option>
            ))}
          </select>

          {/* Transition Duration Slider */}
          {clip.transition !== 'cut' && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[9px] text-[var(--muted)]">
                <span>Transition Duration:</span>
                <span className="font-mono text-cyan-400">{(clip.transitionDuration ?? 0.5).toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.5}
                step={0.05}
                value={clip.transitionDuration ?? 0.5}
                onChange={(e) => onUpdateClip(clip.id, { transitionDuration: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1 bg-[var(--border)] rounded"
              />
            </div>
          )}
        </div>

        {/* Individual Fade In & In-Animation */}
        <div className="space-y-1.5 p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-2.5 h-2.5 text-emerald-400" />
              <span>In Animation (Fade In):</span>
            </span>
            <span className="font-mono text-emerald-300 font-bold">
              {(clip.fadeInSec ?? 0) > 0 ? `${(clip.fadeInSec ?? 0).toFixed(1)}s` : 'OFF'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] text-[var(--muted)] block mb-0.5">Duration (s):</label>
              <input
                type="range"
                min={0}
                max={3.0}
                step={0.1}
                value={clip.fadeInSec ?? 0}
                onChange={(e) => onUpdateClip(clip.id, { fadeInSec: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer h-1 bg-[var(--border)] rounded"
              />
            </div>
            <div>
              <label className="text-[9px] text-[var(--muted)] block mb-0.5">Motion:</label>
              <select
                value={clip.inAnimation || 'fade'}
                onChange={(e) => onUpdateClip(clip.id, { inAnimation: e.target.value as any })}
                className="w-full px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[10px]"
              >
                {IN_ANIMATIONS_CATALOG.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Individual Fade Out & Out-Animation */}
        <div className="space-y-1.5 p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5 text-rose-400" />
              <span>Out Animation (Fade Out):</span>
            </span>
            <span className="font-mono text-rose-300 font-bold">
              {(clip.fadeOutSec ?? 0) > 0 ? `${(clip.fadeOutSec ?? 0).toFixed(1)}s` : 'OFF'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] text-[var(--muted)] block mb-0.5">Duration (s):</label>
              <input
                type="range"
                min={0}
                max={3.0}
                step={0.1}
                value={clip.fadeOutSec ?? 0}
                onChange={(e) => onUpdateClip(clip.id, { fadeOutSec: parseFloat(e.target.value) })}
                className="w-full accent-rose-400 cursor-pointer h-1 bg-[var(--border)] rounded"
              />
            </div>
            <div>
              <label className="text-[9px] text-[var(--muted)] block mb-0.5">Motion:</label>
              <select
                value={clip.outAnimation || 'fade'}
                onChange={(e) => onUpdateClip(clip.id, { outAnimation: e.target.value as any })}
                className="w-full px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[10px]"
              >
                {OUT_ANIMATIONS_CATALOG.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
