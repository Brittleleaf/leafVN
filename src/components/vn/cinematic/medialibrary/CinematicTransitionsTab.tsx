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
import {
  playTransitionSfx,
  isTransitionSfxEnabled,
  setTransitionSfxEnabled,
} from '@/lib/vn/transitionSfx';

interface CinematicTransitionsTabProps {
  onApplyTransition?: (transitionType: VNCinematicTransitionType, durationSec: number) => void;
  onApplyToAll?: (transitionType: VNCinematicTransitionType, durationSec: number) => void;
  selectedClipId?: string | null;
}

export const CinematicTransitionsTab: React.FC<CinematicTransitionsTabProps> = ({
  onApplyTransition,
  onApplyToAll,
  selectedClipId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [transitionDuration, setTransitionDuration] = useState<number>(0.5);
  const [hoveredTransId, setHoveredTransId] = useState<string | null>(null);
  const [sfxMuted, setSfxMuted] = useState<boolean>(!isTransitionSfxEnabled());

  const categories = ['All', 'Basic', 'Slides', '3D & Zoom', 'Creative'];

  const filtered = CINEMATIC_TRANSITIONS_CATALOG.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApply = (transId: VNCinematicTransitionType) => {
    if (onApplyTransition) {
      onApplyTransition(transId, transitionDuration);
      playTransitionSfx(transId, 0.4);
      playUiSound('select', 0.25);
    }
  };

  const handleApplyAll = (transId: VNCinematicTransitionType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onApplyToAll) {
      onApplyToAll(transId, transitionDuration);
      playTransitionSfx(transId, 0.45);
      playUiSound('select', 0.3);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#0a0a0f]">
      {/* Category Filter Pills & Duration Bar */}
      <div className="p-3 border-b border-white/10 bg-[#101117]/90 backdrop-blur-md space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Category Pill Track */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/60 border border-white/10 overflow-x-auto custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  playUiSound('click', 0.1);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-black shadow-[0_0_12px_rgba(34,211,238,0.5)] font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Duration & Procedural SFX Control */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextVal = !sfxMuted;
                setSfxMuted(nextVal);
                setTransitionSfxEnabled(!nextVal);
                if (!nextVal) playTransitionSfx('slide_left', 0.35);
              }}
              className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                !sfxMuted
                  ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'bg-black/50 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={!sfxMuted ? 'Procedural Transition SFX Enabled (Whoosh/Glitch/Snap)' : 'Transition SFX Muted'}
            >
              <GuiIconRenderer icon={!sfxMuted ? GUI_ICONS.general.sound : GUI_ICONS.general.cancel} className="w-3 h-3 text-cyan-400" />
              <span>SFX {!sfxMuted ? 'ON' : 'OFF'}</span>
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 border border-white/10 text-[10px] font-mono text-gray-300">
              <span className="text-gray-400">Dur:</span>
              <span className="font-bold text-cyan-400 min-w-[28px] text-center">{transitionDuration.toFixed(1)}s</span>
              <input
                type="range"
                min={0.1}
                max={2.5}
                step={0.1}
                value={transitionDuration}
                onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
                className="w-14 h-1 accent-cyan-400 cursor-pointer"
                title="Transition duration in seconds"
              />
            </div>
          </div>
        </div>

        {/* Selected Clip Notice & Batch Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {selectedClipId ? (
            <div className="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/40 px-2.5 py-1 rounded-lg flex items-center gap-2 flex-1 min-w-[180px] shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <TransitionBowtieIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              <span className="truncate font-medium">Selected clip ready. Click any card below to apply.</span>
            </div>
          ) : (
            <div className="text-[10px] text-amber-300 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-2 flex-1 min-w-[180px]">
              <GuiIconRenderer icon={GUI_ICONS.general.info} className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-medium">Select a clip in the timeline, or use "All" for batch apply.</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Transition Cards */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 custom-scrollbar">
        {filtered.map((trans) => {
          const isHovered = hoveredTransId === trans.id;

          return (
            <div
              key={trans.id}
              onClick={() => handleApply(trans.id)}
              onMouseEnter={() => {
                setHoveredTransId(trans.id);
                playTransitionSfx(trans.id, 0.2);
              }}
              onMouseLeave={() => setHoveredTransId(null)}
              className={`group relative rounded-xl border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md ${
                isHovered
                  ? 'border-cyan-400 bg-[#161822] shadow-[0_0_22px_rgba(34,211,238,0.25)] -translate-y-0.5'
                  : 'border-white/10 bg-[#101116] hover:border-cyan-500/50 hover:bg-[#14151e]'
              }`}
            >
              {/* Visual Animated Thumbnail Preview */}
              <div className="w-full relative mb-2 rounded-lg overflow-hidden border border-white/10 group-hover:border-cyan-400/60 shadow-inner">
                <TransitionThumbnailPreview
                  transitionType={trans.id}
                  isHovered={isHovered}
                  className="w-full"
                />

                {/* Category micro-pill on thumbnail */}
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold bg-black/85 backdrop-blur-md text-gray-200 border border-white/15 shadow pointer-events-none">
                  {trans.category}
                </span>
              </div>

              {/* Label & Description */}
              <div className="space-y-0.5 min-w-0 px-0.5">
                <div className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate flex items-center justify-between transition-colors">
                  <span>{trans.name}</span>
                  {isHovered && <span className="text-[8px] text-cyan-400 font-mono tracking-widest font-black animate-pulse">PREVIEW</span>}
                </div>
                <div className="text-[9px] text-gray-400 line-clamp-1 leading-tight font-mono">
                  {trans.description}
                </div>
              </div>

              {/* Action buttons: Apply to selected vs Apply to All */}
              <div className="mt-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(trans.id);
                  }}
                  className="flex-1 py-1 rounded-lg bg-cyan-950/40 group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-teal-400 group-hover:text-black border border-cyan-500/40 group-hover:border-cyan-300 text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95"
                  title="Apply to selected clip"
                >
                  <TransitionBowtieIcon className="w-2.5 h-2.5 group-hover:text-black transition-colors" />
                  <span>Apply</span>
                </button>
                {onApplyToAll && (
                  <button
                    type="button"
                    onClick={(e) => handleApplyAll(trans.id, e)}
                    className="px-2 py-1 rounded-lg bg-black/60 hover:bg-cyan-400 hover:text-black border border-white/10 hover:border-cyan-300 text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-all cursor-pointer flex items-center justify-center shadow-sm active:scale-95"
                    title="Apply this transition to ALL clips across the timeline (CapCut 1-Click)"
                  >
                    <span>All</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
