"use client";
import React from 'react';
import { EventInspectorSubProps } from './types';
import { getAllTransitions } from '../transitions';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

export const SceneTransitionEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  story,
  currentChapter,
  onUpdateCurrentLine,
  onOpenAssetPicker,
}) => {
  // Find destination scenario for live preview card
  const targetScene = React.useMemo(() => {
    if (!currentLine.targetSceneId || !story) return null;
    for (const ch of story.chapters || []) {
      const found = (ch.scenes || []).find((s) => s.id === currentLine.targetSceneId);
      if (found) return { ...found, chapterTitle: ch.title };
    }
    const foundReserve = (story.scenarios || []).find((s) => s.id === currentLine.targetSceneId);
    if (foundReserve) return { ...foundReserve, chapterTitle: 'Scenarios Library' };
    return null;
  }, [currentLine.targetSceneId, story]);

  return (
    <>
      {/* CASE: JUMP SCENARIO (JUMP_SCENE) */}
      {currentLine.type === 'jump_scene' && (
        <div className="space-y-3 p-3.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <label className="text-[10px] text-[var(--accent)] uppercase font-bold tracking-wider">
              Target Scenario:
            </label>
            {targetScene && (
              <span className="text-[9px] font-mono text-[var(--muted)]">
                ID: {targetScene.id.slice(-6)}
              </span>
            )}
          </div>

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

          {/* Destination Scenario Thumbnail Preview Card */}
          {targetScene && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--well-bg)] border border-[var(--border)]">
              <div className="w-20 aspect-video rounded-lg overflow-hidden bg-[var(--card-bg)] border border-[var(--border)] shrink-0">
                {targetScene.backgroundUrl ? (
                  <img
                    src={targetScene.backgroundUrl}
                    alt={targetScene.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted2)]">
                    <GuiIconRenderer icon={GUI_ICONS.general.image} size={14} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-[var(--text)] truncate">
                    {targetScene.name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-[var(--card-bg)] border border-[var(--border)] text-[var(--accent)] shrink-0">
                    Target
                  </span>
                </div>
                {targetScene.chapterTitle && (
                  <p className="text-[10px] text-[var(--muted)] truncate">
                    {targetScene.chapterTitle}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider">
                Scene Transition Effect:
              </label>
              {onOpenAssetPicker && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAssetPicker('transition', (selectedId) => {
                      if (selectedId) {
                        onUpdateCurrentLine('transition', selectedId as any);
                      }
                    });
                  }}
                  className="text-[10px] text-[var(--accent)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <GuiIconRenderer icon={GUI_ICONS.state.play} size={11} />
                  <span>Open Transition Gallery</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentLine.transition || 'instant'}
                onChange={(e) => onUpdateCurrentLine('transition', e.target.value === 'instant' ? undefined : (e.target.value as any))}
                className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
              >
                {getAllTransitions().map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
