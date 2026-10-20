"use client";
import React from 'react';
import { VNStory } from '@/types/vn';

export interface VisualScenePickerProps {
  story: VNStory;
  currentTargetSceneId?: string;
  onSelectScene: (sceneId: string, sceneName: string) => void;
}

export function VisualScenePicker({
  story,
  currentTargetSceneId,
  onSelectScene,
}: VisualScenePickerProps) {
  const allScenes = [
    ...story.chapters.flatMap((ch) =>
      ch.scenes.map((sc) => ({ ...sc, chapterTitle: ch.title }))
    ),
    ...(story.scenarios || [])
      .filter((sc) => !story.chapters.some((ch) => ch.scenes.some((s) => s.id === sc.id)))
      .map((sc) => ({ ...sc, chapterTitle: 'Library / Reserve' })),
  ];

  return (
    <div className="p-3 bg-[var(--panel)] border border-[var(--border2)] rounded-xl space-y-2 animate-fade-in shadow-lg">
      <span className="text-[10px] text-[var(--muted)] font-bold uppercase block">
        Click any scene to assign it as destination:
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {allScenes.map((sc) => (
          <div
            key={sc.id}
            onClick={() => onSelectScene(sc.id, sc.name)}
            className={`p-1.5 rounded-lg border cursor-pointer group transition-all flex flex-col gap-1 ${
              sc.id === currentTargetSceneId
                ? 'border-[var(--accent)] bg-[var(--accent-surface)] ring-1 ring-[var(--accent)] shadow-sm'
                : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--well-bg)] hover:bg-[var(--panel-hover)]'
            }`}
          >
            <div className="aspect-video rounded overflow-hidden bg-[var(--well-bg)]">
              {sc.backgroundUrl ? (
                <img
                  src={sc.backgroundUrl}
                  alt={sc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : null}
            </div>
            <span className="text-[10px] font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
              {sc.name}
            </span>
            {story.chapters.length > 1 && (
              <span className="text-[8px] text-[var(--muted2)] truncate">
                {sc.chapterTitle}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
