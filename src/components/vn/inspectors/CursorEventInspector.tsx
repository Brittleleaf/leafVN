"use client";
import React, { useRef } from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VN_CURSORS_CATALOG, VN_CURSORS_MAP, VNCursorLayer } from '../cursors';
import { EventInspectorSubProps } from './types';

export const CursorEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  onUpdateCurrentLine,
  onOpenAssetPicker,
}) => {
  if (currentLine.type !== 'cursor_change') return null;

  const currentCursorId = currentLine.cursorType || 'palimpsest_dot';
  const cursorDef = VN_CURSORS_MAP[currentCursorId];
  const auditionAreaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-3 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <GuiIconRenderer icon={GUI_ICONS.action.target} size={16} className="text-cyan-400" />
          <div>
            <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider block">
              In-Game Cursor Change
            </span>
            <span className="text-[10px] text-[var(--muted)]">
              Switches the mouse cursor style dynamically for the player.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onOpenAssetPicker('cursor', (selectedId) => {
              if (selectedId) {
                onUpdateCurrentLine('cursorType', selectedId);
              }
            });
          }}
          className="px-2.5 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-cyan-400 text-[var(--text)] rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
          title="Open Asset Gallery to audition all cursors"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-cyan-400" />
          <span>Browse Gallery</span>
        </button>
      </div>

      {/* Interactive Quick Cursor Playground & Audition Arena */}
      {cursorDef && (
        <div
          ref={auditionAreaRef}
          className={`relative p-3.5 rounded-xl bg-black/70 border border-cyan-500/30 overflow-hidden shadow-inner flex items-center justify-between gap-3 select-none transition-all ${
            currentCursorId !== 'default' ? 'cursor-none' : ''
          }`}
        >
          <VNCursorLayer cursorType={currentCursorId as any} containerRef={auditionAreaRef} />
          
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center shrink-0 text-cyan-300">
              <GuiIconRenderer icon={cursorDef.icon} className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white truncate">{cursorDef.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  {cursorDef.category}
                </span>
              </div>
              <p className="text-[11px] text-gray-300 truncate">{cursorDef.description}</p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 pointer-events-auto">
            <span className="text-[9px] font-mono px-2 py-1 rounded-lg bg-white/10 text-gray-300 border border-white/20">
              Hover to test pointer
            </span>
          </div>
        </div>
      )}

      {/* Popular Cursors Visual Grid */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block">
          Quick Select Pointer:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VN_CURSORS_CATALOG.slice(0, 4).map((c) => {
            const isSelected = currentCursorId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onUpdateCurrentLine('cursorType', c.id)}
                className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)]'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center shrink-0 text-cyan-400">
                  <GuiIconRenderer icon={c.icon} size={12} />
                </div>
                <span className="text-[11px] font-bold truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full Dropdown & Persistence Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase block mb-1 font-semibold">
            All Cursors Catalog:
          </label>
          <select
            value={currentCursorId}
            onChange={(e) => onUpdateCurrentLine('cursorType', e.target.value)}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-cyan-400 rounded-lg p-2 text-xs text-[var(--text)] outline-none"
          >
            {VN_CURSORS_CATALOG.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase block mb-1 font-semibold">
            Persistence Mode:
          </label>
          <select
            value={currentLine.cursorMode || 'persistent'}
            onChange={(e) => onUpdateCurrentLine('cursorMode', e.target.value as any)}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-cyan-400 rounded-lg p-2 text-xs text-[var(--text)] outline-none"
          >
            <option value="persistent">Persistent (Active until another change)</option>
            <option value="dialogue_only">Single Step / Temporary</option>
          </select>
        </div>
      </div>
    </div>
  );
};
