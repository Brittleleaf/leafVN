"use client";
import React from 'react';
import {
  VNEvent,
  VNStory,
  VNChapter,
  VNScene,
  VNCharacter,
  VNAssetType,
  VNScreenFxType,
} from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import ChoiceEditor from './ChoiceEditor';
import { useVNMaker } from './VNMakerContext';
import {
  DialogueEventInspector,
  ScreenFxEventInspector,
  LogicEventInspector,
  MediaEventInspector,
  AudioEventInspector,
  SceneTransitionEventInspector,
  CursorEventInspector,
  EventInspectorSubProps,
} from './inspectors';

export interface EventInspectorProps {
  currentLine?: VNEvent;
  selectedLineIndex?: number;
  story?: VNStory;
  currentChapter?: VNChapter;
  currentScene?: VNScene;
  currentSpeaker?: VNCharacter | undefined;
  timelineFxStatus?: {
    activeMap: Map<string, { type: VNScreenFxType; pairId?: string; intensity?: 'light' | 'medium' | 'heavy' }>;
    pairsMap: Map<string, { startIdx: number; endIdx: number; startId: string; endId: string }>;
  };
  onUpdateCurrentLine?: (field: keyof VNEvent, value: any) => void;
  onPatchCurrentLine?: (patch: Partial<VNEvent>) => void;
  onUpdateCurrentScene?: (field: keyof VNScene, value: any) => void;
  onMoveLineToScene?: (fromIndex: number, targetSceneId: string) => void;
  onSelectLineIndex?: (index: number) => void;
  onOpenCharacterPicker?: () => void;
  onOpenGlobalModal?: (modal: 'variables' | 'scenes' | 'characters') => void;
  onOpenAssetPicker?: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => void;
  notify?: (msg: string) => void;
}

export default function EventInspector(props: EventInspectorProps) {
  let context: ReturnType<typeof useVNMaker> | null = null;
  try {
    context = useVNMaker();
  } catch {
    // context not available if used outside provider
  }

  const currentLine = props.currentLine ?? context?.currentLine;
  const selectedLineIndex = props.selectedLineIndex ?? context?.selectedLineIndex ?? 0;
  const story = props.story ?? context?.story;
  const currentChapter = props.currentChapter ?? context?.currentChapter;
  const currentScene = props.currentScene ?? context?.currentScene;
  const currentSpeaker = props.currentSpeaker ?? context?.currentSpeaker;
  const timelineFxStatus = props.timelineFxStatus ?? context?.timelineFxStatus ?? { activeMap: new Map(), pairsMap: new Map() };
  const onUpdateCurrentLine = props.onUpdateCurrentLine ?? context?.handleUpdateCurrentLine ?? (() => {});
  const onPatchCurrentLine = props.onPatchCurrentLine ?? context?.handlePatchCurrentLine ?? (() => {});
  const onUpdateCurrentScene = props.onUpdateCurrentScene ?? context?.handleUpdateCurrentScene ?? (() => {});
  const onMoveLineToScene = props.onMoveLineToScene ?? context?.handleMoveLineToScene ?? (() => {});
  const onSelectLineIndex = props.onSelectLineIndex ?? context?.setSelectedLineIndex ?? (() => {});
  const onOpenCharacterPicker = props.onOpenCharacterPicker ?? (() => context?.setShowCharacterPicker(true));
  const onOpenGlobalModal = props.onOpenGlobalModal ?? ((m: any) => context?.setActiveGlobalModal(m));
  const onOpenAssetPicker = props.onOpenAssetPicker ?? context?.openAssetPicker ?? (() => {});
  const notify = props.notify ?? context?.notify ?? (() => {});

  if (!currentLine || !story || !currentChapter || !currentScene) {
    return null;
  }

  const subProps: EventInspectorSubProps = {
    currentLine,
    selectedLineIndex,
    story,
    currentChapter,
    currentScene,
    currentSpeaker,
    timelineFxStatus,
    onUpdateCurrentLine,
    onPatchCurrentLine,
    onUpdateCurrentScene,
    onSelectLineIndex,
    onOpenCharacterPicker,
    onOpenGlobalModal,
    onOpenAssetPicker,
    notify,
  };

  return (
    <div className="vn-card p-4 space-y-4 text-xs shrink-0">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--accent)] uppercase tracking-widest flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>LINE INSPECTOR #{selectedLineIndex + 1}</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-lg uppercase font-bold bg-[var(--well-bg)] border border-[var(--border)] text-[var(--text)]">
            Type: {currentLine.type}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(() => {
            const seenIds = new Set<string>();
            const rawOtherScenes = [
              ...story.chapters.flatMap((c) => (c.scenes || []).map((s) => ({ ...s, chapterTitle: c.title }))),
              ...(story.scenarios || []).map((s) => ({ ...s, chapterTitle: 'Scenarios' })),
            ];

            const allOtherScenes = rawOtherScenes.filter((s) => {
              if (!s || !s.id || s.id === currentScene.id || seenIds.has(s.id)) {
                return false;
              }
              seenIds.add(s.id);
              return true;
            });

            if (allOtherScenes.length === 0) return null;

            return (
              <div className="flex items-center gap-1.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg px-2 py-0.5">
                <span className="text-[10px] text-[var(--muted)]">Move to:</span>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onMoveLineToScene(selectedLineIndex, e.target.value);
                    }
                  }}
                  className="bg-transparent text-[11px] text-[var(--accent)] font-bold outline-none cursor-pointer max-w-[140px] truncate"
                  title="Transfer this line to another scenario"
                >
                  <option value="" disabled>-- Scenario --</option>
                  {allOtherScenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.chapterTitle ? `[${s.chapterTitle}] ` : ''}{s.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })()}

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--muted)]">Change type:</span>
            <select
              value={currentLine.type}
              onChange={(e) => {
                const newType = e.target.value as any;
                onUpdateCurrentLine('type', newType);
                if (newType === 'choice' && (!currentLine.options || currentLine.options.length === 0)) {
                  onUpdateCurrentLine('prompt', 'What choice do you make?');
                  onUpdateCurrentLine('options', [
                    { id: `opt-1-${Date.now()}`, label: 'Option 1' },
                    { id: `opt-2-${Date.now()}`, label: 'Option 2' },
                  ]);
                }
                if (newType === 'conditional_branch' && !currentLine.condition) {
                  onPatchCurrentLine({
                    condition: { variableKey: story.variables?.[0]?.key || 'has_keycard', operator: '==', value: true },
                    conditionalTargetSceneId: currentScene.id,
                    elseTargetSceneId: currentScene.id,
                  });
                }
                if (newType === 'mutate_variable' && !currentLine.variableMutation) {
                  onPatchCurrentLine({
                    variableMutation: { key: story.variables?.[0]?.key || 'has_keycard', operation: 'set', value: true },
                  });
                }
                if (newType === 'bg_change' && !currentLine.backgroundUrl) {
                  onPatchCurrentLine({
                    backgroundUrl: currentScene.backgroundUrl,
                  });
                }
                if (newType === 'bgm' && !currentLine.audioUrl) {
                  onPatchCurrentLine({
                    audioUrl: '/assets/sfx/bg-tvnoise.mp3',
                    audioVolume: 0.5,
                  });
                }
                if (newType === 'cursor_change' && !currentLine.cursorType) {
                  onPatchCurrentLine({
                    cursorType: 'palimpsest_dot',
                    cursorMode: 'persistent',
                  });
                }
              }}
              className="bg-[var(--well-bg)] border border-[var(--border)] rounded-lg px-2 py-0.5 text-xs text-[var(--text)] outline-none"
            >
              <option value="dialogue">Dialogue</option>
              <option value="choice">Choice</option>
              <option value="conditional_branch">Conditional Branch (If / Else)</option>
              <option value="mutate_variable">Mutate Variable</option>
              <option value="bg_change">Change Background (BG)</option>
              <option value="bgm">Background Music (BGM)</option>
              <option value="cursor_change">Cursor Change</option>
              <option value="fx_start">Screen FX Start</option>
              <option value="fx_end">Screen FX End</option>
              <option value="shake">Shake</option>
              <option value="flash">Flash</option>
              <option value="jump_scene">Jump Scenario</option>
              <option value="loading_screen">Loading Screen</option>
              <option value="sfx">Sound Effect (SFX)</option>
            </select>
          </div>
        </div>
      </div>

      {/* A. CASE: CHOICE & NARRATIVE BRANCHING */}
      {currentLine.type === 'choice' && (
        <ChoiceEditor
          story={story}
          currentChapter={currentChapter}
          currentScene={currentScene}
          currentLineIndex={selectedLineIndex}
          currentLine={currentLine}
          onUpdateLine={onUpdateCurrentLine}
          onJumpToTimelineIndex={(idx) => {
            onSelectLineIndex(idx);
            playSfx('/assets/sfx/click intro.mp3', false, 0.3);
          }}
          notify={notify}
        />
      )}

      {/* B. CASE: DIALOGUE */}
      {currentLine.type === 'dialogue' && (
        <DialogueEventInspector {...subProps} />
      )}

      {/* C, D, D.1, D.2. CASE: SCREEN FX (SHAKE, FLASH, FX_START, FX_END) */}
      {(currentLine.type === 'shake' ||
        currentLine.type === 'flash' ||
        currentLine.type === 'fx_start' ||
        currentLine.type === 'fx_end') && (
        <ScreenFxEventInspector {...subProps} />
      )}

      {/* E, F. CASE: SCENE TRANSITION & NAVIGATION (JUMP_SCENE, LOADING_SCREEN) */}
      {(currentLine.type === 'jump_scene' || currentLine.type === 'loading_screen') && (
        <SceneTransitionEventInspector {...subProps} />
      )}

      {/* G, H. CASE: LOGIC & STATE (CONDITIONAL_BRANCH, MUTATE_VARIABLE) */}
      {(currentLine.type === 'conditional_branch' || currentLine.type === 'mutate_variable') && (
        <LogicEventInspector {...subProps} />
      )}

      {/* I. CASE: BACKGROUND CHANGE (BG_CHANGE) */}
      {currentLine.type === 'bg_change' && (
        <MediaEventInspector {...subProps} />
      )}

      {/* J, K. CASE: AUDIO (BGM, SFX) */}
      {(currentLine.type === 'bgm' || currentLine.type === 'sfx') && (
        <AudioEventInspector {...subProps} />
      )}

      {/* N. CASE: CURSOR CHANGE */}
      {currentLine.type === 'cursor_change' && (
        <CursorEventInspector {...subProps} />
      )}
    </div>
  );
}
