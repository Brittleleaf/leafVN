"use client";
import React, { useState } from 'react';
import { VNStory, VNScene, VNChoiceOption } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { getCharacterAvatar } from '@/lib/vn/engineUtils';

export interface VisualLinePickerProps {
  story: VNStory;
  currentScene: VNScene;
  currentLineIndex: number;
  activeOption: VNChoiceOption;
  onSelectLine: (eventId: string, lineIndex: number) => void;
}

export function VisualLinePicker({
  story,
  currentScene,
  currentLineIndex,
  activeOption,
  onSelectLine,
}: VisualLinePickerProps) {
  const [lineSearchFilter, setLineSearchFilter] = useState<string>('');

  return (
    <div className="p-3 bg-[var(--panel)] border border-[var(--border2)] rounded-xl space-y-2 animate-fade-in shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Search line by text or character..."
          value={lineSearchFilter}
          onChange={(e) => setLineSearchFilter(e.target.value)}
          className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)]"
        />
        {lineSearchFilter && (
          <button
            type="button"
            onClick={() => setLineSearchFilter('')}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] p-1 cursor-pointer"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {currentScene.timeline.map((line, lIdx) => {
          const spk = story.characters.find((c) => c.id === line.characterId);
          const avt = spk ? getCharacterAvatar(spk, line.emotion) : null;
          const preview = line.text || line.prompt || `Effect: ${line.type}`;

          if (
            lineSearchFilter &&
            !preview.toLowerCase().includes(lineSearchFilter.toLowerCase()) &&
            !spk?.name.toLowerCase().includes(lineSearchFilter.toLowerCase())
          ) {
            return null;
          }

          const isThis = activeOption.targetEventId === line.id || activeOption.jumpToEventIndex === lIdx;

          return (
            <div
              key={line.id}
              onClick={() => onSelectLine(line.id, lIdx)}
              className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                isThis
                  ? 'border-[var(--accent)] bg-[var(--accent-surface)] ring-1 ring-[var(--accent)] shadow-sm'
                  : 'border-[var(--border)] hover:border-[var(--border2)] hover:bg-[var(--panel-hover)] bg-[var(--well-bg)]'
              }`}
            >
              <span className="text-[10px] font-mono font-bold text-[var(--muted)] w-7 shrink-0">
                #{lIdx + 1}
              </span>

              <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--well-bg)] border border-[var(--border)] shrink-0">
                {avt ? (
                  <img src={avt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-[10px]">
                    <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5 text-[var(--muted2)]" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {spk && (
                    <span className="text-[10px] font-bold truncate" style={{ color: spk.color }}>
                      {spk.name}
                    </span>
                  )}
                  <span className="text-[9px] text-[var(--muted2)] uppercase font-mono">[{line.type}]</span>
                </div>
                <p className="text-xs text-[var(--text)] truncate">"{preview}"</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
