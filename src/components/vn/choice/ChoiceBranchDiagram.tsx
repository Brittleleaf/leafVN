"use client";
import React from 'react';
import { VNStory, VNChapter, VNScene, VNChoiceOption } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

export interface ChoiceBranchDiagramProps {
  options: VNChoiceOption[];
  selectedOptIndex: number;
  setSelectedOptIndex: (index: number) => void;
  story: VNStory;
  currentScene: VNScene;
  currentLineIndex: number;
}

export function ChoiceBranchDiagram({
  options,
  selectedOptIndex,
  setSelectedOptIndex,
  story,
  currentScene,
  currentLineIndex,
}: ChoiceBranchDiagramProps) {
  return (
    <div className="p-3 bg-[var(--well-bg)] border border-purple-500/30 rounded-xl space-y-3 animate-fade-in backdrop-blur-md">
      <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-300">
          <GuiIconRenderer icon={GUI_ICONS.general.familyTree} className="w-3.5 h-3.5 text-purple-500" />
          <span>BRANCH MAP FOR THIS CHOICE</span>
        </span>
        <span className="text-[var(--muted2)] font-normal">Route comparison view</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {options.map((opt, oIdx) => {
          const mode = opt.targetSceneId ? 'scene' : opt.targetEventId ? 'line' : 'next';
          const tScene = opt.targetSceneId
            ? story.chapters.flatMap((c) => c.scenes).find((s) => s.id === opt.targetSceneId) ||
              (story.scenarios || []).find((s) => s.id === opt.targetSceneId) ||
              null
            : null;
          const tIdx = opt.targetEventId ? currentScene.timeline.findIndex((e) => e.id === opt.targetEventId) : -1;
          const tLine = tIdx !== -1 ? currentScene.timeline[tIdx] : null;
          const tSpk = tLine ? story.characters.find((c) => c.id === tLine.characterId) : null;

          return (
            <div
              key={opt.id}
              onClick={() => setSelectedOptIndex(oIdx)}
              className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                selectedOptIndex === oIdx
                  ? 'border-purple-500 bg-purple-500/15 shadow-md ring-1 ring-purple-500'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border2)]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-purple-600 dark:text-purple-400">Option #{oIdx + 1}</span>
                  <span className="text-[var(--muted2)] font-mono text-[9px]">{mode}</span>
                </div>
                <p className="text-xs font-bold text-[var(--text)] line-clamp-2">"{opt.label}"</p>
              </div>

              {/* Destination summary box */}
              <div className="p-2 bg-[var(--well-bg)] rounded-lg border border-[var(--border)] text-[10px] space-y-1">
                <span className="text-[9px] text-[var(--muted2)] uppercase block font-bold">Destination:</span>
                {mode === 'next' && (
                  <span className="text-[var(--muted)] flex items-center gap-1 font-mono">
                    <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3 h-3 text-purple-500" />
                    <span>Continues to line #{currentLineIndex + 2}</span>
                  </span>
                )}
                {mode === 'scene' && (
                  <span className="text-sky-600 dark:text-sky-300 flex items-center gap-1 font-bold truncate">
                    <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3 h-3 text-sky-500" />
                    <span>Scene: {tScene?.name || 'Not found'}</span>
                  </span>
                )}
                {mode === 'line' && (
                  <span className="text-emerald-600 dark:text-emerald-300 flex items-center gap-1 font-mono truncate">
                    <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3 h-3 text-emerald-500" />
                    <span>Line #{tIdx + 1} {tSpk ? `(${tSpk.name})` : ''}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
