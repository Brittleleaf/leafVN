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
          onClick={() => onOpenGlobalModal('scenes')}
          className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
        >
          Background Gallery ➔
        </button>
      </div>

      <div>
        <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">Background Image:</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={currentLine.backgroundUrl || ''}
            onChange={(e) => onUpdateCurrentLine('backgroundUrl', e.target.value)}
            placeholder="https://... or choose from gallery"
            className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] font-mono outline-none"
          />
          <button
            type="button"
            onClick={() => onOpenAssetPicker('background', (url) => onUpdateCurrentLine('backgroundUrl', url))}
            className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border2)] text-[var(--text)] rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.gallery} size={14} />
            <span>Backgrounds</span>
          </button>
        </div>
      </div>
    </div>
  );
};
