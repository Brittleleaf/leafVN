"use client";
import React from 'react';
import { EventInspectorSubProps } from './types';

export const SceneTransitionEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  story,
  currentChapter,
  onUpdateCurrentLine,
}) => {
  return (
    <>
      {/* CASE: JUMP SCENARIO (JUMP_SCENE) */}
      {currentLine.type === 'jump_scene' && (
        <div className="space-y-2 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <label className="text-[10px] text-[var(--accent)] uppercase block font-bold">
            Target Scenario:
          </label>
          <select
            value={currentLine.targetSceneId || ''}
            onChange={(e) => onUpdateCurrentLine('targetSceneId', e.target.value)}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
          >
            <option value="">-- Select scenario --</option>
            {story?.chapters && story.chapters.length > 1
              ? story.chapters.map((ch) => (
                  <optgroup key={ch.id} label={`Chapter ${ch.number || ''}: ${ch.title}`}>
                    {ch.scenes.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </optgroup>
                ))
              : currentChapter?.scenes.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
            {story?.scenarios && story.scenarios.length > 0 && (
              <optgroup label="Library / Reserve Scenarios">
                {story.scenarios
                  .filter((sc) => !story.chapters.some((ch) => ch.scenes.some((s) => s.id === sc.id)))
                  .map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      {/* CASE: LOADING SCREEN (LOADING_SCREEN) */}
      {currentLine.type === 'loading_screen' && (
        <div className="space-y-2 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <label className="text-[10px] text-[var(--muted)] uppercase block font-bold">
            Loading Screen Configuration:
          </label>
          <input
            type="text"
            value={currentLine.loadingTitle || ''}
            onChange={(e) => onUpdateCurrentLine('loadingTitle', e.target.value)}
            placeholder="Enter loading title here..."
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
          />
          <input
            type="text"
            value={currentLine.loadingSubtitle || ''}
            onChange={(e) => onUpdateCurrentLine('loadingSubtitle', e.target.value)}
            placeholder="Enter loading subtitle here..."
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--muted)] outline-none"
          />
          <input
            type="text"
            value={currentLine.loadingTip || ''}
            onChange={(e) => onUpdateCurrentLine('loadingTip', e.target.value)}
            placeholder="Enter loading tip or lore here..."
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--muted2)] outline-none"
          />
        </div>
      )}
    </>
  );
};
