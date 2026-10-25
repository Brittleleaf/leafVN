"use client";
import React from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { EventInspectorSubProps } from './types';

export const MediaEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  onUpdateCurrentLine,
  onOpenGlobalModal,
  onOpenAssetPicker,
}) => {
  if (currentLine.type !== 'bg_change') return null;

  return (
    <div className="space-y-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.image} size={14} className="text-sky-500" />
          <span>Dynamic Scenario Background Change</span>
        </span>
        <button
          type="button"
          onClick={() => onOpenAssetPicker('background', (url) => onUpdateCurrentLine('backgroundUrl', url))}
          className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer flex items-center gap-1 font-bold"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={12} />
          <span>Asset Gallery</span>
        </button>
      </div>

      {/* Visual 16:9 Thumbnail Preview Card */}
      {currentLine.backgroundUrl ? (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--well-bg)] group shadow-inner">
          <img
            src={currentLine.backgroundUrl}
            alt="Scenario Background"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity flex flex-col justify-between p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-black/60 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
                Active Background
              </span>
              <button
                type="button"
                onClick={() => onUpdateCurrentLine('backgroundUrl', '')}
                className="w-6 h-6 rounded-lg bg-black/60 hover:bg-rose-900/80 text-gray-300 hover:text-rose-200 border border-white/20 flex items-center justify-center cursor-pointer transition-colors"
                title="Remove background"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} size={12} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-200 font-mono truncate max-w-[200px]" title={currentLine.backgroundUrl}>
                {currentLine.backgroundUrl.split('/').pop() || currentLine.backgroundUrl}
              </span>
              <button
                type="button"
                onClick={() => onOpenAssetPicker('background', (url) => onUpdateCurrentLine('backgroundUrl', url))}
                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-400/40 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer backdrop-blur-sm transition-colors flex items-center gap-1"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.refresh} size={11} />
                <span>Replace</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onOpenAssetPicker('background', (url) => onUpdateCurrentLine('backgroundUrl', url))}
          className="aspect-video w-full rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--well-bg)]/50 hover:bg-[var(--well-bg)] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group p-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all">
            <GuiIconRenderer icon={GUI_ICONS.general.image} size={20} />
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors block">
              No Background Assigned
            </span>
            <span className="text-[10px] text-[var(--muted)]">
              Click to browse Backgrounds Gallery or upload image
            </span>
          </div>
        </div>
      )}

      {/* Manual URL input fallback */}
      <div>
        <label className="text-[10px] text-[var(--muted)] uppercase block mb-1 font-semibold">Image URL / Path:</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentLine.backgroundUrl || ''}
            onChange={(e) => onUpdateCurrentLine('backgroundUrl', e.target.value)}
            placeholder="https://... or select from gallery"
            className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] font-mono outline-none"
          />
          <button
            type="button"
            onClick={() => onOpenAssetPicker('background', (url) => onUpdateCurrentLine('backgroundUrl', url))}
            className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border2)] text-[var(--text)] rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={14} />
            <span>Gallery</span>
          </button>
        </div>
      </div>
    </div>
  );
};
