"use client";
import React, { useState } from 'react';
import { VNCinematicTransitionType } from '@/types/vn';
import {
  CINEMATIC_TRANSITIONS_CATALOG,
  TransitionBowtieIcon,
  TransitionThumbnailPreview,
} from '../cinematicTransitions';
import { playUiSound } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface CinematicTransitionsTabProps {
  onApplyTransition?: (transitionType: VNCinematicTransitionType, durationSec: number) => void;
  selectedClipId?: string | null;
}

export const CinematicTransitionsTab: React.FC<CinematicTransitionsTabProps> = ({
  onApplyTransition,
  selectedClipId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [transitionDuration, setTransitionDuration] = useState<number>(0.5);
  const [hoveredTransId, setHoveredTransId] = useState<string | null>(null);

  const categories = ['All', 'Basic', 'Slides', '3D & Zoom', 'Creative'];

  const filtered = CINEMATIC_TRANSITIONS_CATALOG.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApply = (transId: VNCinematicTransitionType) => {
    if (onApplyTransition) {
      onApplyTransition(transId, transitionDuration);
      playUiSound('select', 0.35);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Category Filter Pills & Duration Bar */}
      <div className="p-2.5 border-b border-[var(--border)] bg-[var(--surface)] space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  playUiSound('click', 0.1);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'bg-[var(--well-bg)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Duration Control */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--muted)] shrink-0">
            <span>Duration:</span>
            <span className="font-bold text-cyan-400">{transitionDuration.toFixed(1)}s</span>
            <input
              type="range"
              min={0.1}
              max={2.5}
              step={0.1}
              value={transitionDuration}
              onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
              className="w-16 h-1 accent-cyan-400 cursor-pointer"
              title="Transition duration in seconds"
            />
          </div>
        </div>

        {/* Selected Clip Notice */}
        {selectedClipId ? (
          <div className="text-[10px] text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 px-2 py-1 rounded flex items-center gap-1.5">
            <TransitionBowtieIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Click any transition below to apply directly to the selected clip.</span>
          </div>
        ) : (
          <div className="text-[10px] text-amber-300 bg-amber-950/25 border border-amber-800/30 px-2 py-1 rounded flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.info} className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Select a visual or background clip in the timeline to apply transitions.</span>
          </div>
        )}
      </div>

      {/* Grid of Transition Cards */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 custom-scrollbar">
        {filtered.map((trans) => {
          const isHovered = hoveredTransId === trans.id;

          return (
            <div
              key={trans.id}
              onClick={() => handleApply(trans.id)}
              onMouseEnter={() => setHoveredTransId(trans.id)}
              onMouseLeave={() => setHoveredTransId(null)}
              className={`group relative rounded-lg border p-2 flex flex-col justify-between transition-all cursor-pointer shadow-sm ${
                isHovered
                  ? 'border-cyan-400 bg-[var(--surface-strong)] shadow-[0_0_18px_rgba(34,211,238,0.25)] scale-[1.02]'
                  : 'border-[var(--border)] bg-[var(--well-bg)] hover:border-cyan-500/60'
              }`}
            >
              {/* Visual Animated Thumbnail Preview */}
              <div className="w-full relative mb-1.5 rounded overflow-hidden border border-[var(--border2)] group-hover:border-cyan-500/50">
                <TransitionThumbnailPreview
                  transitionType={trans.id}
                  isHovered={isHovered}
                  className="w-full"
                />

                {/* Category pill on thumbnail */}
                <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold bg-black/80 text-gray-200 border border-white/10 shadow pointer-events-none">
                  {trans.category}
                </span>
              </div>

              {/* Label & Description */}
              <div className="space-y-0.5 min-w-0">
                <div className="text-[11px] font-bold text-[var(--text)] group-hover:text-cyan-300 truncate flex items-center justify-between">
                  <span>{trans.name}</span>
                  {isHovered && <span className="text-[8px] text-cyan-400 font-mono">PREVIEW</span>}
                </div>
                <div className="text-[9px] text-[var(--muted)] line-clamp-1 leading-tight font-mono">
                  {trans.description}
                </div>
              </div>

              {/* Action pill */}
              <button
                type="button"
                className="mt-2 w-full py-1 rounded bg-[var(--surface)] group-hover:bg-cyan-500 group-hover:text-black border border-[var(--border)] group-hover:border-cyan-400 text-[9px] font-bold uppercase tracking-wider text-[var(--text)] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <TransitionBowtieIcon className="w-3 h-3 text-cyan-400 group-hover:text-black transition-colors" />
                <span>Apply</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
