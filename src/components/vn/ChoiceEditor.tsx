"use client";
import React, { useState } from 'react';
import {
  VNStory,
  VNChapter,
  VNScene,
  VNEvent,
  VNChoiceOption,
} from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { getCharacterAvatar } from '@/lib/vn/engineUtils';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { getAllButtonHoverEffects, getButtonHoverEffectClass } from '@/lib/vn/buttonHoverEffects';
import {
  ChoiceBranchDiagram,
  VisualScenePicker,
  VisualLinePicker,
  ChoiceMutationsSection,
} from './choice';

interface ChoiceEditorProps {
  story: VNStory;
  currentChapter: VNChapter;
  currentScene: VNScene;
  currentLineIndex: number;
  currentLine: VNEvent;
  onUpdateLine: (field: keyof VNEvent, value: any) => void;
  onJumpToTimelineIndex: (index: number) => void;
  notify?: (msg: string) => void;
}

export default function ChoiceEditor({
  story,
  currentChapter,
  currentScene,
  currentLineIndex,
  currentLine,
  onUpdateLine,
  onJumpToTimelineIndex,
  notify = () => {},
}: ChoiceEditorProps) {
  const options: VNChoiceOption[] = currentLine.options || [];
  const [selectedOptIndex, setSelectedOptIndex] = useState<number>(0);
  const [showVisualScenePicker, setShowVisualScenePicker] = useState<boolean>(false);
  const [showVisualLinePicker, setShowVisualLinePicker] = useState<boolean>(false);
  const [showBranchDiagram, setShowBranchDiagram] = useState<boolean>(false);

  const activeOption = options[selectedOptIndex] || options[0];

  // Helper to update options array
  const handleUpdateChoiceOption = (index: number, patch: Partial<VNChoiceOption>) => {
    const updated = options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt));
    onUpdateLine('options', updated);
  };

  const handleAddOption = () => {
    const newOpt: VNChoiceOption = {
      id: `opt-${Date.now()}`,
      label: `New Option #${options.length + 1}`,
    };
    const updated = [...options, newOpt];
    onUpdateLine('options', updated);
    setSelectedOptIndex(updated.length - 1);
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    notify('New option added');
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('The choice must keep at least one option.');
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    onUpdateLine('options', updated);
    setSelectedOptIndex(Math.max(0, index - 1));
    playSfx('/assets/sfx/click interface.mp3', true, 0.3);
    notify('Option deleted');
  };

  // Destination mode of active option
  const activeDestMode: 'next' | 'scene' | 'line' = activeOption?.targetSceneId
    ? 'scene'
    : activeOption?.targetEventId || typeof activeOption?.jumpToEventIndex === 'number'
    ? 'line'
    : 'next';

  // Finding target line details
  const targetLineIdx = activeOption?.targetEventId
    ? (currentScene?.timeline || []).findIndex((e) => e.id === activeOption.targetEventId)
    : typeof activeOption?.jumpToEventIndex === 'number'
    ? activeOption.jumpToEventIndex
    : -1;

  const targetLine =
    currentScene?.timeline && targetLineIdx >= 0 && targetLineIdx < currentScene.timeline.length
      ? currentScene.timeline[targetLineIdx]
      : null;
  const targetSpeaker = targetLine ? story.characters.find((c) => c.id === targetLine.characterId) : null;
  const targetAvatar = targetSpeaker ? getCharacterAvatar(targetSpeaker, targetLine?.emotion) : null;

  // Finding target scene details
  const targetScene = activeOption?.targetSceneId
    ? story.chapters.flatMap((c) => c.scenes).find((s) => s.id === activeOption.targetSceneId) ||
      (story.scenarios || []).find((s) => s.id === activeOption.targetSceneId) ||
      null
    : null;

  return (
    <div className="space-y-4">
      {/* 1. HEADER: QUESTION & TOP CONTROLS */}
      <div className="p-3 bg-[var(--card-bg)] border border-purple-500/40 rounded-xl space-y-2.5 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.questionSign} className="w-4 h-4 text-purple-500" />
            <span>QUESTION / CHOICE PROMPT:</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBranchDiagram(!showBranchDiagram)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                showBranchDiagram
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                  : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
              }`}
              title="Toggle flowchart view"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3" />
              <span>{showBranchDiagram ? 'Hide Diagram' : 'View Diagram'}</span>
            </button>
            <span className="text-[10px] text-purple-600 dark:text-purple-300 font-mono font-bold">
              ({options.length} options)
            </span>
          </div>
        </div>

        <input
          type="text"
          value={currentLine.prompt || ''}
          onChange={(e) => onUpdateLine('prompt', e.target.value)}
          placeholder="Enter choice prompt here..."
          className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-purple-500 rounded-lg p-2.5 text-xs text-[var(--text)] font-bold outline-none"
        />

        {/* BUTTON APPEARANCE & HOVER EFFECT */}
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5 text-purple-400" />
              <span>Choice Buttons Style & Hover Effect:</span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout mode switcher: Stacked vs Free Canvas */}
              <div className="flex items-center gap-1 bg-[var(--well-bg)] p-0.5 rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    const resetOpts = options.map((o) => ({
                      ...o,
                      xPercent: undefined,
                      yPercent: undefined,
                      rotation: 0,
                      scale: 1,
                    }));
                    onUpdateLine('choiceLayout', 'stacked');
                    onUpdateLine('options', resetOpts);
                    onUpdateLine('promptXPercent', undefined);
                    onUpdateLine('promptYPercent', undefined);
                    onUpdateLine('promptRotation', 0);
                    onUpdateLine('promptScale', 1);
                    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                    notify('Layout set to Stacked Column');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    currentLine.choiceLayout !== 'free' && !options.some((o) => o.xPercent !== undefined)
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title="Centered stacked column"
                >
                  Stacked
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const total = options.length || 1;
                    const freeOpts = options.map((o, idx) => ({
                      ...o,
                      xPercent: o.xPercent ?? 50,
                      yPercent: o.yPercent ?? (Math.round((50 + (idx - (total - 1) / 2) * 12) * 10) / 10),
                    }));
                    onUpdateLine('choiceLayout', 'free');
                    onUpdateLine('options', freeOpts);
                    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                    notify('Layout set to Free Canvas');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    currentLine.choiceLayout === 'free' || options.some((o) => o.xPercent !== undefined)
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title="Free canvas placement with universal transform gizmo"
                >
                  Free Canvas
                </button>
              </div>

              {/* Container visibility toggle ("quitar la visualización del contenedor a los botones") */}
              <div className="flex items-center gap-1 bg-[var(--well-bg)] p-0.5 rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateLine('choiceHideContainer', false);
                    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    !currentLine.choiceHideContainer
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title="Con contenedor (fondo oscuro y borde)"
                >
                  Classic Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateLine('choiceHideContainer', true);
                    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    currentLine.choiceHideContainer
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title="Sin contenedor (texto flotante transparente)"
                >
                  Frameless
                </button>
              </div>
            </div>
          </div>

          {/* Hover effects options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {getAllButtonHoverEffects().map((eff) => {
              const isSelected = (currentLine.choiceHoverEffect || 'none') === eff.id;
              const previewClass = getButtonHoverEffectClass(eff.id);
              return (
                <button
                  key={eff.id}
                  type="button"
                  onClick={() => {
                    onUpdateLine('choiceHoverEffect', eff.id);
                    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                    notify?.(`Hover effect changed to: ${eff.label}`);
                  }}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between group ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20 ring-1 ring-purple-500/50 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--well-bg)] hover:border-[var(--border2)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3 h-3 text-purple-400" />
                    <span className={isSelected ? 'text-purple-600 dark:text-purple-300' : 'text-[var(--text)]'}>
                      {eff.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-center py-0.5 text-[10px] font-semibold text-[var(--muted2)]">
                    <span className={previewClass || undefined}>
                      Preview
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. FLOWCHART BRANCH DIAGRAM (IF ACTIVE) */}
      {showBranchDiagram && (
        <ChoiceBranchDiagram
          options={options}
          selectedOptIndex={selectedOptIndex}
          setSelectedOptIndex={setSelectedOptIndex}
          story={story}
          currentScene={currentScene}
          currentLineIndex={currentLineIndex}
        />
      )}

      {/* 3. HORIZONTAL OPTION TABS BAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Select an option to edit its route and effects:
          </span>
          <button
            type="button"
            onClick={handleAddOption}
            className="px-2.5 py-1 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-xl text-xs uppercase cursor-pointer transition-all shadow-[0_4px_12px_rgba(209,123,248,0.4)] flex items-center gap-1"
          >
            <span>+</span> Add Option
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {options.map((opt, oIdx) => {
            const isSelected = oIdx === selectedOptIndex;
            const mode = opt.targetSceneId ? 'scene' : opt.targetEventId ? 'line' : 'next';

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedOptIndex(oIdx);
                  setShowVisualScenePicker(false);
                  setShowVisualLinePicker(false);
                  playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shrink-0 cursor-pointer max-w-[220px] ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500 text-[var(--text)] shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--border2)]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                    isSelected ? 'bg-purple-600 text-white' : 'bg-[var(--well-bg)] text-[var(--muted)] border border-[var(--border)]'
                  }`}
                >
                  {oIdx + 1}
                </span>

                <span className="truncate flex-1 text-left">{opt.label || `Option #${oIdx + 1}`}</span>

                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted2)] shrink-0 flex items-center">
                  {mode === 'scene' ? (
                    <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3 h-3" />
                  ) : mode === 'line' ? (
                    <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3 h-3" />
                  ) : (
                    <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3 h-3" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SELECTED OPTION EDITING PANEL */}
      {activeOption && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 space-y-4 shadow-xl backdrop-blur-md">
          {/* Header of active option */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                <span>OPTION #{selectedOptIndex + 1} CONFIGURATION</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">ID: {activeOption.id}</span>
            </div>

            {options.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(selectedOptIndex)}
                className="text-red-400 hover:text-red-300 text-xs cursor-pointer px-2 py-0.5 rounded hover:bg-red-950/50 border border-red-900/50 flex items-center gap-1.5 transition-colors"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                <span>Delete Option</span>
              </button>
            )}
          </div>

          {/* Option text shown to player */}
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
              Button text read by the player:
            </label>
            <input
              type="text"
              value={activeOption.label}
              onChange={(e) => handleUpdateChoiceOption(selectedOptIndex, { label: e.target.value })}
              placeholder="Enter option text here..."
              className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-purple-500 rounded-xl p-2.5 text-xs text-[var(--text)] font-bold outline-none"
            />
          </div>

          {/* Individual option appearance override (optional) */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--well-bg)] border border-[var(--border)] text-xs flex-wrap gap-2">
            {/* Style Preset Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Style:</span>
              <select
                value={activeOption.style || 'cyber'}
                onChange={(e) => handleUpdateChoiceOption(selectedOptIndex, { style: e.target.value as any })}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--text)] outline-none cursor-pointer"
              >
                <option value="cyber">Cyber (Standard)</option>
                <option value="danger">Danger (Red Glow)</option>
                <option value="primary">Accent (Violet Glow)</option>
                <option value="glass">Frosted Glass</option>
                <option value="retro">Retro CRT</option>
                <option value="ghost">Ghost Dark</option>
              </select>
            </div>

            {/* Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Size:</span>
              <select
                value={activeOption.size || 'md'}
                onChange={(e) => handleUpdateChoiceOption(selectedOptIndex, { size: e.target.value as any })}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--text)] outline-none cursor-pointer"
              >
                <option value="sm">Small Compact</option>
                <option value="md">Medium Standard</option>
                <option value="lg">Large Prominent</option>
                <option value="xl">Extra Large (Hero)</option>
              </select>
            </div>

            {/* Hover Effect */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Hover:</span>
              <select
                value={activeOption.hoverEffect || ''}
                onChange={(e) => handleUpdateChoiceOption(selectedOptIndex, { hoverEffect: (e.target.value as any) || undefined })}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--text)] outline-none cursor-pointer"
              >
                <option value="">Inherit ({currentLine.choiceHoverEffect || 'none'})</option>
                {getAllButtonHoverEffects().map((eff) => (
                  <option key={eff.id} value={eff.id}>
                    {eff.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--text)] select-none">
              <input
                type="checkbox"
                checked={activeOption.hideContainer ?? (currentLine.choiceHideContainer ?? false)}
                onChange={(e) => handleUpdateChoiceOption(selectedOptIndex, { hideContainer: e.target.checked })}
                className="rounded border-[var(--border)] text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-[10px] font-bold uppercase text-[var(--muted)]">Hide container</span>
            </label>
          </div>

          {/* Transform & Spatial Info for Choice Button */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] text-[10px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-cyan-400 font-mono">TRANSFORM:</span>
              <span className="text-[var(--muted)] font-mono">
                {activeOption.xPercent !== undefined
                  ? `X: ${Math.round(activeOption.xPercent)}% | Y: ${Math.round(activeOption.yPercent ?? 50)}%`
                  : 'Posición: Centrado automático (Arrastra en el canvas para mover)'}
              </span>
              {activeOption.scale !== undefined && activeOption.scale !== 1 && (
                <span className="text-cyan-300 font-mono font-bold">Escala: {Math.round(activeOption.scale * 100)}%</span>
              )}
              {((activeOption.scaleX !== undefined && activeOption.scaleX !== 1) || (activeOption.scaleY !== undefined && activeOption.scaleY !== 1)) && (
                <span className="text-cyan-200 font-mono font-bold">
                  Dim: {Math.round((activeOption.scaleX ?? 1) * 100)}% x {Math.round((activeOption.scaleY ?? 1) * 100)}%
                </span>
              )}
              {activeOption.rotation !== undefined && activeOption.rotation !== 0 && (
                <span className="text-amber-300 font-mono font-bold">Rot: {activeOption.rotation}°</span>
              )}
            </div>
            {(activeOption.xPercent !== undefined || (activeOption.scale !== undefined && activeOption.scale !== 1) || (activeOption.scaleX !== undefined && activeOption.scaleX !== 1) || (activeOption.scaleY !== undefined && activeOption.scaleY !== 1) || (activeOption.rotation !== undefined && activeOption.rotation !== 0) || activeOption.widthPercent !== undefined) && (
              <button
                type="button"
                onClick={() => {
                  handleUpdateChoiceOption(selectedOptIndex, {
                    xPercent: undefined,
                    yPercent: undefined,
                    scale: 1,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: 0,
                    widthPercent: undefined,
                  });
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  notify('Posición y escala de botón reseteadas');
                }}
                className="text-red-400 hover:underline font-bold cursor-pointer shrink-0 ml-2"
                title="Restablecer posición, escala y rotación por defecto"
              >
                Reset Transform
              </button>
            )}
          </div>

          {/* Action / Destination selector */}
          <div className="space-y-2 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-3">
            <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
              Where does this choice lead?:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Continue */}
              <button
                type="button"
                onClick={() => {
                  handleUpdateChoiceOption(selectedOptIndex, {
                    targetSceneId: undefined,
                    targetEventId: undefined,
                    jumpToEventIndex: undefined,
                  });
                  setShowVisualScenePicker(false);
                  setShowVisualLinePicker(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  activeDestMode === 'next'
                    ? 'bg-purple-500/20 border-purple-500 text-[var(--text)] shadow-sm ring-1 ring-purple-500/50'
                    : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3.5 h-3.5" />
                  <span>Continue Flow</span>
                </div>
                <span className="text-[10px] text-[var(--muted2)] leading-tight">
                  Proceeds normally to the next timeline line.
                </span>
              </button>

              {/* Option 2: Change Scene */}
              <button
                type="button"
                onClick={() => {
                  const defaultTargetScene =
                    currentChapter.scenes.find((s) => s.id !== currentScene.id) || currentChapter.scenes[0];
                  handleUpdateChoiceOption(selectedOptIndex, {
                    targetSceneId: activeOption.targetSceneId || defaultTargetScene?.id,
                    targetEventId: undefined,
                    jumpToEventIndex: undefined,
                  });
                  setShowVisualLinePicker(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  activeDestMode === 'scene'
                    ? 'bg-sky-500/20 border-sky-500 text-[var(--text)] shadow-sm ring-1 ring-sky-500/50'
                    : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5 text-sky-500" />
                  <span>Change Scene</span>
                </div>
                <span className="text-[10px] text-[var(--muted2)] leading-tight">
                  Transitions to another location or chapter.
                </span>
              </button>

              {/* Option 3: Jump to Dialogue Line */}
              <button
                type="button"
                onClick={() => {
                  const defaultTargetLine =
                    currentScene.timeline[currentLineIndex + 1] || currentScene.timeline[0];
                  handleUpdateChoiceOption(selectedOptIndex, {
                    targetEventId: activeOption.targetEventId || defaultTargetLine?.id,
                    jumpToEventIndex: undefined,
                    targetSceneId: undefined,
                  });
                  setShowVisualScenePicker(false);
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  activeDestMode === 'line'
                    ? 'bg-emerald-500/20 border-emerald-500 text-[var(--text)] shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Jump to Dialogue</span>
                </div>
                <span className="text-[10px] text-[var(--muted2)] leading-tight">
                  Jumps to a specific point in this scene.
                </span>
              </button>
            </div>

            {/* VISUAL DESTINATION DETAIL: SCENE */}
            {activeDestMode === 'scene' && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-600 dark:text-sky-300 font-bold uppercase tracking-wider text-[10px]">
                    Selected Target Scene:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVisualScenePicker(!showVisualScenePicker)}
                    className="text-xs text-sky-600 dark:text-sky-300 font-bold flex items-center gap-1.5 cursor-pointer bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3 h-3 text-sky-500" />
                    <span>{showVisualScenePicker ? 'Close Gallery' : 'Choose from Visual Gallery'}</span>
                  </button>
                </div>

                {targetScene ? (
                  <div className="p-3 bg-[var(--card-bg)] border border-sky-500/30 rounded-xl flex items-center gap-3">
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--well-bg)] shrink-0">
                      {targetScene.backgroundUrl ? (
                        <img
                          src={targetScene.backgroundUrl}
                          alt={targetScene.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted2)]">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-[var(--text)] block truncate">{targetScene.name}</span>
                      <span className="text-[10px] text-[var(--muted)] block">
                        {targetScene.timeline?.length || 0} events &bull; ID: {targetScene.id}
                      </span>
                      {targetScene.id === currentScene.id && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 pt-0.5">
                          <GuiIconRenderer icon={GUI_ICONS.general.questionSign} className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>This is the current scene (will restart from beginning)</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 italic">No target scene selected.</p>
                )}

                {/* Galería Visual de Selección de Escenarios */}
                {showVisualScenePicker && (
                  <VisualScenePicker
                    story={story}
                    currentTargetSceneId={activeOption.targetSceneId}
                    onSelectScene={(scId, scName) => {
                      handleUpdateChoiceOption(selectedOptIndex, { targetSceneId: scId });
                      setShowVisualScenePicker(false);
                      notify(`Destination assigned: ${scName}`);
                    }}
                  />
                )}
              </div>
            )}

            {/* VISUAL DESTINATION DETAIL: DIALOGUE LINE */}
            {activeDestMode === 'line' && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                    Selected Target Line:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {targetLineIdx !== -1 && (
                      <button
                        type="button"
                        onClick={() => {
                          onJumpToTimelineIndex(targetLineIdx);
                          notify(`Navigating to line #${targetLineIdx + 1}`);
                        }}
                        className="text-xs text-amber-600 dark:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30"
                        title="Scroll editor to this line"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.search} className="w-3 h-3 text-amber-500" />
                        <span>View in Timeline</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowVisualLinePicker(!showVisualLinePicker)}
                      className="text-xs text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3 h-3 text-emerald-500" />
                      <span>{showVisualLinePicker ? 'Close Search' : 'Choose Visual Dialogue'}</span>
                    </button>
                  </div>
                </div>

                {targetLine ? (
                  <div className="p-3 bg-[var(--card-bg)] border border-emerald-500/30 rounded-xl flex items-start gap-3">
                    {/* Speaker Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 bg-[var(--well-bg)] shrink-0 mt-0.5">
                      {targetAvatar ? (
                        <img src={targetAvatar} alt="Speaker" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted2)]">
                          <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-4 h-4 text-[var(--muted2)]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Line #{targetLineIdx + 1}
                        </span>
                        {targetSpeaker && (
                          <span className="text-xs font-bold" style={{ color: targetSpeaker.color }}>
                            {targetSpeaker.name}
                          </span>
                        )}
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)]">
                          {targetLine.type}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--text)] italic line-clamp-2">
                        "{targetLine.text || targetLine.prompt || 'No text'}"
                      </p>

                      {/* Position warning / hint */}
                      {targetLineIdx <= currentLineIndex ? (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 pt-0.5">
                          <GuiIconRenderer icon={GUI_ICONS.general.questionSign} className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Warning: This line is BEFORE the choice on the timeline (will create a loop).</span>
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                          <GuiIconRenderer icon={GUI_ICONS.action.check} className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>Forward jump (progresses story normally).</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 italic">No target line selected.</p>
                )}

                {/* Visual Line Search and Selector */}
                {showVisualLinePicker && (
                  <VisualLinePicker
                    story={story}
                    currentScene={currentScene}
                    currentLineIndex={currentLineIndex}
                    activeOption={activeOption}
                    onSelectLine={(eventId, lIdx) => {
                      handleUpdateChoiceOption(selectedOptIndex, {
                        targetEventId: eventId,
                        jumpToEventIndex: lIdx,
                        targetSceneId: undefined,
                      });
                      setShowVisualLinePicker(false);
                      notify(`Line #${lIdx + 1} assigned as destination`);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* 5. VARIABLE MUTATIONS MANAGER (UPDATE VARIABLES) */}
          <ChoiceMutationsSection
            activeOption={activeOption}
            selectedOptIndex={selectedOptIndex}
            story={story}
            handleUpdateChoiceOption={handleUpdateChoiceOption}
            notify={notify}
          />

          {/* 6. IMMEDIATE REACTION (OPTIONAL) */}
          <div className="bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5 text-purple-500" />
                <span>Immediate Character Reaction (Optional):</span>
              </span>
              {activeOption.reaction ? (
                <button
                  type="button"
                  onClick={() => handleUpdateChoiceOption(selectedOptIndex, { reaction: undefined })}
                  className="text-red-500 text-[10px] hover:underline cursor-pointer"
                >
                  Remove reaction
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateChoiceOption(selectedOptIndex, {
                      reaction: {
                        characterId: story.characters[0]?.id,
                        text: "Understood, let's go!",
                      },
                    })
                  }
                  className="text-purple-600 dark:text-purple-400 text-[10px] font-bold hover:underline cursor-pointer"
                >
                  + Add Quick Reaction
                </button>
              )}
            </div>

            {activeOption.reaction && (
              <div className="p-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">Who responds:</span>
                  <select
                    value={activeOption.reaction.characterId || ''}
                    onChange={(e) =>
                      handleUpdateChoiceOption(selectedOptIndex, {
                        reaction: { ...activeOption.reaction!, characterId: e.target.value },
                      })
                    }
                    className="bg-[var(--well-bg)] border border-[var(--border)] rounded-lg px-2 py-0.5 text-xs text-[var(--text)] outline-none"
                  >
                    {story.characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Enter character reaction here..."
                  value={activeOption.reaction.text}
                  onChange={(e) =>
                    handleUpdateChoiceOption(selectedOptIndex, {
                      reaction: { ...activeOption.reaction!, text: e.target.value },
                    })
                  }
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. NARRATIVE CONVERGENCE: WHERE BRANCHES REJOIN AFTER CHOICE */}
      <div className="bg-[var(--card-bg)] border border-purple-500/30 rounded-xl p-3.5 space-y-2 text-xs shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="font-bold text-purple-600 dark:text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.familyTree} className="w-3.5 h-3.5 text-purple-500" />
            <span>Narrative Convergence (Rejoin After Choice):</span>
          </span>
          <span className="text-[9px] text-[var(--muted)] font-mono bg-[var(--well-bg)] border border-[var(--border)] px-2 py-0.5 rounded-lg">
            {currentLine.rejoinEventId ? 'Custom' : 'Smart automatic'}
          </span>
        </div>

        <p className="text-[10px] text-[var(--muted2)] leading-relaxed">
          Upon completing the chosen option, the game will jump here to continue the story, <strong>isolating branches so dialogue from unchosen branches is never shown</strong>.
        </p>

        <div className="flex items-center gap-2">
          <select
            value={currentLine.rejoinEventId || ''}
            onChange={(e) => onUpdateLine('rejoinEventId', e.target.value || undefined)}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-purple-500 rounded-lg p-2 text-xs text-[var(--text)] font-mono outline-none cursor-pointer"
          >
            <option value="">-- Automatic (First common line after all branches) --</option>
            {currentScene.timeline.map((line, lIdx) => {
              if (lIdx <= currentLineIndex) return null;
              const spk = story.characters.find((c) => c.id === line.characterId);
              const preview = line.text ? `"${line.text.slice(0, 40)}..."` : `[${line.type}]`;
              return (
                <option key={line.id} value={line.id}>
                  Line #{lIdx + 1} {spk ? `(${spk.name})` : ''}: {preview}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
