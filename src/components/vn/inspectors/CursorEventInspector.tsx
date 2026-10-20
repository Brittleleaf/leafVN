"use client";
import React from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VN_CURSORS_CATALOG, VN_CURSORS_MAP } from '../cursors';
import { EventInspectorSubProps } from './types';

export const CursorEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  onUpdateCurrentLine,
  onOpenAssetPicker,
}) => {
  if (currentLine.type !== 'cursor_change') return null;

  const cursorDef = VN_CURSORS_MAP[currentLine.cursorType || 'palimpsest_dot'];

  return (
    <div className="space-y-3 p-3.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <GuiIconRenderer icon={GUI_ICONS.action.target} size={16} />
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
          className="px-2.5 py-1.5 bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
          title="Open Asset Gallery to audition cursors"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Browse Gallery</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-[10px] text-[var(--muted)] uppercase block mb-1 font-semibold">
            Select Cursor Style:
          </label>
          <select
            value={currentLine.cursorType || 'palimpsest_dot'}
            onChange={(e) => onUpdateCurrentLine('cursorType', e.target.value)}
            className="w-full bg-[var(--card-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
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
            className="w-full bg-[var(--card-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
          >
            <option value="persistent">Persistent (Active until another change)</option>
            <option value="dialogue_only">Single Step / Temporary</option>
          </select>
        </div>
      </div>

      {/* Quick cursor preview card */}
      {cursorDef && (
        <div className="flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl mt-2">
          <div className="w-10 h-10 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
            <GuiIconRenderer icon={cursorDef.icon} className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[var(--text)]">{cursorDef.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)]">
                {cursorDef.category}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] truncate">{cursorDef.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};
