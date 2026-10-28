"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  VNEvent,
  VNScene,
  VNCharacter,
  VNHotspot,
  VNHotspotStyle,
  VNAssetType,
  VNScreenFxType,
} from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import { VNScreenFxOverlay, ScreenFxSvgDefs, getSceneElementFxFilter } from './screenfx';
import { resolveEffectiveFontFamily } from '@/lib/vn/fontCatalog';
import { useVNMaker, VNActiveSelectedFx } from './VNMakerContext';
import {
  VNUniversalTransformGizmo,
  VNTransformToolbar,
  VNTransformableTarget,
  VNSnapTarget,
} from './transform';
import VNUniversalButton from './ui/VNUniversalButton';
import { getProxiedImageUrl } from '@/lib/vn/mediaUtils';

export interface VNMakerStageProps {
  currentLine?: VNEvent;
  selectedLineIndex?: number;
  currentScene?: VNScene;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  previewShake?: string;
  previewFlash?: string | null;
  isPlacingButton?: boolean;
  defaultFontFamily?: string;
  editorTheme?: string;
  currentSelectedFx?: VNActiveSelectedFx | null;
  showCanvasTextbox?: boolean;
  setShowCanvasTextbox?: (show: boolean) => void;
  currentSpeaker?: VNCharacter;
  currentSpeakerAvatar?: string;
  activeBorderColor?: string;
  activeBgColor?: string;
  activeNameplateColor?: string;
  activeTextColor?: string;
  activeFontSize?: 'sm' | 'base' | 'lg';
  isPlayingPreview?: boolean;
  animatedPreviewText?: string;
  draggingHotspotId?: string | null;
  handleCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleHotspotPointerDown?: (e: React.PointerEvent, hs: VNHotspot) => void;
  handleRemoveHotspot?: (id: string) => void;
  handleDeleteCurrentLine?: () => void;
  handleUploadBackground?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePrevLine?: () => void;
  handleNextLine?: () => void;
  playCurrentLinePreview?: () => void;
  handleUpdateCurrentLine?: (field: keyof VNEvent, value: any) => void;
  handlePatchCurrentLine?: (patch: Partial<VNEvent>) => void;
  handleUpdateCurrentScene?: (field: keyof VNScene, value: any) => void;
  recordHistorySnapshot?: () => void;
  setShowSceneAudioModal?: (show: boolean) => void;
  setActiveGlobalModal?: (modal: any) => void;
  setShowHotspotStudio?: (show: boolean) => void;
  setEditingHotspotId?: (id: string | null) => void;
  setPendingButtonType?: (type: VNHotspotStyle) => void;
  setIsPlacingButton?: (placing: boolean) => void;
  setShowCharacterPicker?: (show: boolean) => void;
  openAssetPicker?: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => void;
  getDisplayAssetName?: (url: string | undefined) => string;
  notify?: (msg: string) => void;
}

export default function VNMakerStage(props: VNMakerStageProps = {}) {
  const ctx = useVNMaker();

  const currentLine = props.currentLine ?? ctx.currentLine;
  const selectedLineIndex = props.selectedLineIndex ?? ctx.selectedLineIndex;
  const currentScene = props.currentScene ?? ctx.currentScene;
  const canvasRef = props.canvasRef ?? ctx.canvasRef;
  const previewShake = props.previewShake ?? ctx.previewShake;
  const previewFlash = props.previewFlash ?? ctx.previewFlash;
  const isPlacingButton = props.isPlacingButton ?? ctx.isPlacingButton;
  const defaultFontFamily = props.defaultFontFamily ?? ctx.story.defaultFontFamily;
  const editorTheme = props.editorTheme ?? ctx.editorTheme;
  const currentSelectedFx = props.currentSelectedFx !== undefined ? props.currentSelectedFx : ctx.currentSelectedFx;
  const showCanvasTextbox = props.showCanvasTextbox ?? ctx.showCanvasTextbox;
  const setShowCanvasTextbox = props.setShowCanvasTextbox ?? ctx.setShowCanvasTextbox;
  const currentSpeaker = props.currentSpeaker ?? ctx.currentSpeaker;
  const currentSpeakerAvatar = props.currentSpeakerAvatar ?? ctx.currentSpeakerAvatar;
  const activeBorderColor = props.activeBorderColor ?? ctx.activeBorderColor;
  const activeBgColor = props.activeBgColor ?? ctx.activeBgColor;
  const activeNameplateColor = props.activeNameplateColor ?? ctx.activeNameplateColor;
  const activeTextColor = props.activeTextColor ?? ctx.activeTextColor;
  const activeFontSize = props.activeFontSize ?? ctx.activeFontSize ?? 'base';
  const isPlayingPreview = props.isPlayingPreview ?? ctx.isPlayingPreview;
  const animatedPreviewText = props.animatedPreviewText ?? ctx.animatedPreviewText;
  const draggingHotspotId = props.draggingHotspotId !== undefined ? props.draggingHotspotId : ctx.draggingHotspotId;
  const handleCanvasClick = props.handleCanvasClick ?? ctx.handleCanvasClick;
  const handleHotspotPointerDown = props.handleHotspotPointerDown ?? ctx.handleHotspotPointerDown;
  const handleRemoveHotspot = props.handleRemoveHotspot ?? ctx.handleRemoveHotspot;
  const handleDeleteCurrentLine = props.handleDeleteCurrentLine ?? ctx.handleDeleteCurrentLine;
  const handleUploadBackground = props.handleUploadBackground ?? ctx.handleUploadBackground;
  const handlePrevLine = props.handlePrevLine ?? ctx.handlePrevLine;
  const handleNextLine = props.handleNextLine ?? ctx.handleNextLine;
  const playCurrentLinePreview = props.playCurrentLinePreview ?? ctx.playCurrentLinePreview;
  const handleUpdateCurrentLine = props.handleUpdateCurrentLine ?? ctx.handleUpdateCurrentLine;
  const handlePatchCurrentLine = props.handlePatchCurrentLine ?? ctx.handlePatchCurrentLine;
  const handleUpdateCurrentScene = props.handleUpdateCurrentScene ?? ctx.handleUpdateCurrentScene;
  const recordHistorySnapshot = props.recordHistorySnapshot ?? ctx.recordHistorySnapshot;
  const setShowSceneAudioModal = props.setShowSceneAudioModal ?? ctx.setShowSceneAudioModal;
  const setActiveGlobalModal = props.setActiveGlobalModal ?? ctx.setActiveGlobalModal;
  const setShowHotspotStudio = props.setShowHotspotStudio ?? ctx.setShowHotspotStudio;
  const setEditingHotspotId = props.setEditingHotspotId ?? ctx.setEditingHotspotId;
  const setPendingButtonType = props.setPendingButtonType ?? ctx.setPendingButtonType;
  const setIsPlacingButton = props.setIsPlacingButton ?? ctx.setIsPlacingButton;
  const setShowCharacterPicker = props.setShowCharacterPicker ?? ctx.setShowCharacterPicker;
  const openAssetPicker = props.openAssetPicker ?? ctx.openAssetPicker;
  const getDisplayAssetName = props.getDisplayAssetName ?? ctx.getDisplayAssetName;
  const notify = props.notify ?? ctx.notify;

  const [selectedElement, setSelectedElement] = useState<'character' | 'hotspot' | 'choice_button' | 'choice_prompt' | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [isEditingChoiceText, setIsEditingChoiceText] = useState<boolean>(false);
  const [isEditingPromptText, setIsEditingPromptText] = useState<boolean>(false);
  const [showGuides, setShowGuides] = useState<boolean>(false);

  // Directly apply SVG visual filter to stage background and character photo
  const stageFxFilter = getSceneElementFxFilter(currentSelectedFx);
  const isStagePixelate = currentSelectedFx?.type === 'retro_pixelate';
  const [snapToGuides, setSnapToGuides] = useState<boolean>(true);

  // Auto-clear selection when switching scenes or lines
  useEffect(() => {
    setSelectedElement(null);
    setSelectedHotspotId(null);
    setSelectedChoiceIndex(null);
    setIsEditingChoiceText(false);
    setIsEditingPromptText(false);
  }, [currentScene?.id, selectedLineIndex]);

  // Press Enter to edit text when choice button or prompt is selected
  useEffect(() => {
    const handleStageKeyDown = (e: KeyboardEvent) => {
      // Never intercept Enter if user is typing inside an input/textarea/editable element
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable ||
        target?.closest('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }

      if (selectedElement === 'choice_button' && selectedChoiceIndex !== null && !isEditingChoiceText) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setIsEditingChoiceText(true);
          playSfx('/assets/sfx/click intro.mp3', false, 0.2);
        }
      } else if (selectedElement === 'choice_prompt' && !isEditingPromptText) {
        if (e.key === 'Enter') {
          e.preventDefault();
          setIsEditingPromptText(true);
          playSfx('/assets/sfx/click intro.mp3', false, 0.2);
        }
      }
    };
    window.addEventListener('keydown', handleStageKeyDown);
    return () => window.removeEventListener('keydown', handleStageKeyDown);
  }, [selectedElement, selectedChoiceIndex, isEditingChoiceText, isEditingPromptText]);

  const selectedHotspot = currentScene?.hotspots?.find((h) => h.id === selectedHotspotId);

  // Effective background in stage: tracks bg_change events up to the selected line
  const effectiveBgUrl = React.useMemo(() => {
    if (!currentScene?.timeline || selectedLineIndex === undefined) return currentScene?.backgroundUrl;
    for (let i = selectedLineIndex; i >= 0; i--) {
      const line = currentScene.timeline[i];
      if (line && line.type === 'bg_change' && line.backgroundUrl) {
        return line.backgroundUrl;
      }
    }
    return currentScene?.backgroundUrl;
  }, [currentScene?.timeline, currentScene?.backgroundUrl, selectedLineIndex]);

  const textboxRef = useRef<HTMLDivElement>(null);

  const getDialogueSnapTarget = (): VNSnapTarget | null => {
    if (!showCanvasTextbox || !textboxRef.current || !canvasRef?.current) return null;
    const tRect = textboxRef.current.getBoundingClientRect();
    const cRect = canvasRef.current.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return null;
    return {
      id: 'textbox-boundary',
      xPercent: ((tRect.left + tRect.width / 2 - cRect.left) / cRect.width) * 100,
      yPercent: ((tRect.top + tRect.height / 2 - cRect.top) / cRect.height) * 100,
      widthPercent: (tRect.width / cRect.width) * 100,
      heightPercent: (tRect.height / cRect.height) * 100,
    };
  };

  const dialogueSnap = getDialogueSnapTarget() || (showCanvasTextbox ? {
    id: 'textbox-boundary',
    xPercent: 50,
    yPercent: 75.5,
    widthPercent: 96,
    heightPercent: 22,
  } : null);

  // Computed character staging & docking: strictly determined by individual line, never by speaker profile
  const defaultSlot = currentLine?.characterPosition || 'left';
  const defaultX = defaultSlot === 'center' ? 50 : defaultSlot === 'right' ? 86.5 : 13.5;
  const defaultY = showCanvasTextbox ? 75.5 : 95;
  const rawCharX = currentLine?.characterXPercent;
  const rawCharY = currentLine?.characterYPercent;
  const isCustomPlaced =
    typeof rawCharX === 'number' &&
    Number.isFinite(rawCharX) &&
    typeof rawCharY === 'number' &&
    Number.isFinite(rawCharY);
  const charX = isCustomPlaced ? (rawCharX as number) : defaultX;
  const charY = isCustomPlaced ? (rawCharY as number) : defaultY;
  const charScale = currentLine?.characterScale ?? currentSpeaker?.defaultScale ?? 1.0;
  const charRotation = currentLine?.characterRotation ?? 0;
  const charFlipX = currentLine?.characterFlipX ?? false;
  const charLocked = currentLine?.characterLocked ?? false;
  const charDisableSnap = currentLine?.characterDisableSnap ?? false;
  const isDocked = !isCustomPlaced && showCanvasTextbox && (ctx.story?.textBoxConfig?.showAvatar !== false);

  const handleTransformCharacter = (patch: Partial<VNTransformableTarget>) => {
    if (!handlePatchCurrentLine) return;
    handlePatchCurrentLine({
      ...(patch.xPercent !== undefined ? { characterXPercent: Math.max(-20, Math.min(120, Math.round(patch.xPercent * 10) / 10)) } : {}),
      ...(patch.yPercent !== undefined ? { characterYPercent: Math.max(0, Math.min(120, Math.round(patch.yPercent * 10) / 10)) } : {}),
      ...(patch.scale !== undefined ? { characterScale: patch.scale } : {}),
      ...(patch.rotation !== undefined ? { characterRotation: patch.rotation } : {}),
      ...(patch.flipX !== undefined ? { characterFlipX: patch.flipX } : {}),
      ...(patch.locked !== undefined ? { characterLocked: patch.locked } : {}),
      ...(patch.disableSnap !== undefined ? { characterDisableSnap: patch.disableSnap } : {}),
    });
  };

  const handleTransformHotspot = (hsId: string, patch: Partial<VNTransformableTarget>) => {
    if (!currentScene?.hotspots || !handleUpdateCurrentScene) return;
    const updated = currentScene.hotspots.map((h) => {
      if (h.id !== hsId) return h;
      return {
        ...h,
        ...(patch.xPercent !== undefined ? { xPercent: Math.max(0, Math.min(100, Math.round(patch.xPercent * 10) / 10)) } : {}),
        ...(patch.yPercent !== undefined ? { yPercent: Math.max(0, Math.min(100, Math.round(patch.yPercent * 10) / 10)) } : {}),
        ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
        ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
        ...(patch.flipX !== undefined ? { flipX: patch.flipX } : {}),
        ...(patch.locked !== undefined ? { locked: patch.locked } : {}),
        ...(patch.disableSnap !== undefined ? { disableSnap: patch.disableSnap } : {}),
        ...(patch.text !== undefined ? { label: patch.text } : {}),
      };
    });
    handleUpdateCurrentScene('hotspots', updated);
  };

  const handleTransformChoiceOption = (index: number, patch: Partial<VNTransformableTarget>) => {
    if (!handlePatchCurrentLine || !currentLine?.options) return;
    const options = [...currentLine.options];
    const targetOpt = options[index];
    if (!targetOpt) return;

    const total = options.length;
    const defaultY = Math.round((50 + (index - (total - 1) / 2) * 12) * 10) / 10;

    const updatedOpt = {
      ...targetOpt,
      ...(patch.xPercent !== undefined ? { xPercent: Math.max(0, Math.min(100, Math.round(patch.xPercent * 10) / 10)) } : {}),
      ...(patch.yPercent !== undefined ? { yPercent: Math.max(0, Math.min(100, Math.round(patch.yPercent * 10) / 10)) } : {}),
      ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
      ...(patch.scaleX !== undefined ? { scaleX: patch.scaleX } : {}),
      ...(patch.scaleY !== undefined ? { scaleY: patch.scaleY } : {}),
      ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
      ...(patch.locked !== undefined ? { locked: patch.locked } : {}),
      ...(patch.disableSnap !== undefined ? { disableSnap: patch.disableSnap } : {}),
      ...(patch.widthPercent !== undefined ? { widthPercent: patch.widthPercent } : {}),
      ...(patch.text !== undefined ? { label: patch.text } : {}),
    };

    options[index] = updatedOpt;

    // Ensure all options have coordinate anchors when in free layout mode matching their visual position
    options.forEach((opt, idx) => {
      if (opt.xPercent === undefined) {
        opt.xPercent = 50;
        opt.yPercent = Math.round((50 + (idx - (total - 1) / 2) * 12) * 10) / 10;
      }
    });

    handlePatchCurrentLine({
      options,
      choiceLayout: 'free',
    });
  };

  const handleTransformChoicePrompt = (patch: Partial<VNTransformableTarget>) => {
    if (!handlePatchCurrentLine || currentLine?.type !== 'choice') return;
    const updatedLine: Partial<VNEvent> = {
      ...(patch.xPercent !== undefined ? { promptXPercent: Math.max(0, Math.min(100, Math.round(patch.xPercent * 10) / 10)) } : {}),
      ...(patch.yPercent !== undefined ? { promptYPercent: Math.max(0, Math.min(100, Math.round(patch.yPercent * 10) / 10)) } : {}),
      ...(patch.scale !== undefined ? { promptScale: patch.scale } : {}),
      ...(patch.rotation !== undefined ? { promptRotation: patch.rotation } : {}),
      ...(patch.locked !== undefined ? { promptLocked: patch.locked } : {}),
      ...(patch.widthPercent !== undefined ? { promptWidthPercent: patch.widthPercent } : {}),
      ...(patch.text !== undefined ? { prompt: patch.text } : {}),
    };
    handlePatchCurrentLine(updatedLine);
  };

  const isDialogueLine = currentLine?.type === 'dialogue';

  const renderCharacter = (docked: boolean) => {
    if (!currentSpeakerAvatar || !isDialogueLine) return null;
    if (!showCanvasTextbox && !isCustomPlaced) return null;

    const charStyle: React.CSSProperties = docked
      ? {
          position: 'absolute',
          bottom: 'calc(100% - 2px)',
          left: defaultSlot === 'left' ? '0px' : defaultSlot === 'right' ? 'auto' : '50%',
          right: defaultSlot === 'right' ? '0px' : 'auto',
          transform: `${defaultSlot === 'center' ? 'translateX(-50%) ' : ''}rotate(${charRotation}deg) scale(${charScale})`,
          transformOrigin: defaultSlot === 'left' ? '0% 100%' : defaultSlot === 'right' ? '100% 100%' : '50% 100%',
          zIndex: selectedElement === 'character' ? 36 : 32,
        }
      : {
          position: 'absolute',
          left: `${charX}%`,
          top: `${charY}%`,
          transform: `translate(-50%, -100%) rotate(${charRotation}deg) scale(${charScale})`,
          transformOrigin: '50% 100%',
          zIndex: selectedElement === 'character' ? 36 : 32,
        };

    return (
      <div
        id="vn-stage-character"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElement('character');
          setSelectedHotspotId(null);
        }}
        style={charStyle}
        className={`group select-none transition-shadow ${
          selectedElement === 'character'
            ? 'ring-2 ring-amber-400/90 rounded-t-2xl shadow-[0_0_30px_rgba(245,158,11,0.35)]'
            : 'hover:brightness-105 cursor-pointer'
        }`}
      >
        {/* Floating badge outside document flow so it never alters transform bounding box or docked anchor */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 flex items-center gap-1.5 z-30 pointer-events-auto whitespace-nowrap">
          <span
            onClick={(e) => {
              e.stopPropagation();
              setShowCharacterPicker(true);
            }}
            className="px-2.5 py-0.5 bg-black/95 text-[10px] font-bold text-amber-400 border border-amber-500/70 rounded-full uppercase shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:bg-amber-950 flex items-center gap-1 cursor-pointer"
            title="Click to change character or expression"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-2.5 h-2.5 text-amber-400" />
            <span>{currentSpeaker?.name || 'Character'}: {currentLine?.emotion || 'neutral'}</span>
            {charLocked && <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-2.5 h-2.5 text-amber-300 ml-1 inline" />}
          </span>

          {isCustomPlaced && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePatchCurrentLine?.({
                  characterXPercent: undefined,
                  characterYPercent: undefined,
                });
                notify?.('Character pinned to dialogue box');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="px-2 py-0.5 bg-cyan-950/90 text-[10px] font-bold text-cyan-300 border border-cyan-500/70 rounded-full hover:bg-cyan-900 transition-colors shadow-lg cursor-pointer flex items-center gap-1"
              title="Restore automatic anchor to dialogue box"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.pin} className="w-2.5 h-2.5" />
              <span>Re-dock</span>
            </button>
          )}
        </div>

        <img
          src={getProxiedImageUrl(currentSpeakerAvatar)}
          crossOrigin="anonymous"
          alt={currentSpeaker?.name || 'avatar'}
          draggable={false}
          style={{
            borderColor: activeBorderColor,
            transform: charFlipX ? 'scaleX(-1)' : undefined,
            filter: stageFxFilter,
            imageRendering: isStagePixelate ? 'pixelated' : undefined,
          }}
          className="h-[54cqh] max-h-[56cqh] aspect-[3/4] w-auto object-cover rounded-t-2xl border-2 shadow-2xl pointer-events-none"
        />

        {/* Universal Transform Gizmo attached to Character Sprite when selected */}
        {selectedElement === 'character' && (
          <VNUniversalTransformGizmo
            target={{
              id: 'stage-character',
              xPercent: charX,
              yPercent: charY,
              scale: charScale,
              scaleX: 1,
              scaleY: 1,
              rotation: charRotation,
              flipX: charFlipX,
              locked: charLocked,
              disableSnap: charDisableSnap,
              pivotX: docked ? (defaultSlot === 'left' ? 0 : defaultSlot === 'right' ? 100 : 50) : 50,
              pivotY: 100,
            }}
            stageRef={canvasRef}
            disableSnapping={!snapToGuides}
            capabilities={{
              allowCrop: false,
              allow3D: false,
              allowPivot: false,
              allowFlip: true,
              allowLock: true,
              allowRotate: true,
              allowNonUniformScale: false,
              allowKeyboardNudge: true,
            }}
            snapTargets={[
              ...(dialogueSnap ? [dialogueSnap] : []),
              ...(currentScene?.hotspots || []).map((h) => ({
                id: h.id,
                xPercent: h.xPercent,
                yPercent: h.yPercent,
                widthPercent: 12,
                heightPercent: 12,
                disableSnap: h.locked || h.disableSnap,
              })),
            ]}
            onUpdate={handleTransformCharacter}
            onTransformEnd={() => {
              if (recordHistorySnapshot) recordHistorySnapshot();
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--accent)] uppercase tracking-widest">
            [ INTERACTIVE CANVAS // LINE #{selectedLineIndex + 1} ]
          </span>
          <span className="text-[var(--muted2)] text-[11px]">(Click on any element to edit it)</span>
        </div>

        <button
          onClick={handleDeleteCurrentLine}
          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold text-xs cursor-pointer flex items-center gap-1 transition-colors"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
          <span>Delete this line</span>
        </button>
      </div>

      {/* STUDIO ACTION BAR (OUTSIDE CANVAS — 100% CLEAN UNOBSTRUCTED VIEWPORT) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
        {/* Left: Button / Hotspot placement and alignment guides */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => {
              setPendingButtonType('door');
              setIsPlacingButton(true);
              playSfx('/assets/sfx/click interface.mp3', true, 0.4);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              isPlacingButton
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 animate-pulse'
                : 'text-[var(--text)] hover:bg-[var(--surface-strong)]'
            }`}
          >
            {isPlacingButton ? 'Click on canvas...' : '+ Place Button'}
          </button>

          <button
            onClick={() => {
              setEditingHotspotId(null);
              setShowHotspotStudio(true);
              playSfx('/assets/sfx/click intro.mp3', false, 0.3);
            }}
            className="px-2.5 py-1.5 hover:bg-[var(--surface-strong)] text-[var(--text)] rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
            title="Open navigation hotspot manager and editor"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Manage Buttons ({currentScene?.hotspots?.length || 0})</span>
          </button>

          <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

          {/* Guides & Snapping Controls */}
          <button
            type="button"
            onClick={() => {
              setShowGuides(!showGuides);
              playSfx('/assets/sfx/click intro.mp3', false, 0.2);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              showGuides
                ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                : 'text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
            }`}
            title="Show or hide center alignment guides on canvas"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.ruler} className="w-3.5 h-3.5" />
            <span>{showGuides ? 'Guides: ON' : 'Guides'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSnapToGuides(!snapToGuides);
              playSfx('/assets/sfx/click intro.mp3', false, 0.2);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              snapToGuides
                ? 'bg-pink-500/20 text-pink-400 font-bold'
                : 'text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
            }`}
            title="Toggle magnetic snap to center and alignments"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.pin} className="w-3.5 h-3.5" />
            <span>{snapToGuides ? 'Snap: ON' : 'Snap: OFF'}</span>
          </button>
        </div>

        {/* Right: Stage Media, Textbox Visibility, Audio, Background & Upload */}
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {currentLine?.type === 'dialogue' ? (
            <button
              onClick={() => setShowCanvasTextbox?.(!showCanvasTextbox)}
              className={`px-2.5 py-1.5 rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                showCanvasTextbox
                  ? 'text-[var(--text)] hover:bg-[var(--surface-strong)]'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
              }`}
              title={showCanvasTextbox ? 'Hide textbox to view full canvas' : 'Show textbox'}
            >
              <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5" />
              <span>{showCanvasTextbox ? 'Textbox: Visible' : 'Textbox: Hidden'}</span>
            </button>
          ) : currentLine?.type === 'choice' ? (
            <button
              type="button"
              onClick={() => {
                const isFree = currentLine.choiceLayout === 'free' || currentLine.options?.some((o) => o.xPercent !== undefined);
                if (isFree) {
                  const resetOpts = (currentLine.options || []).map((o) => ({
                    ...o,
                    xPercent: undefined,
                    yPercent: undefined,
                    rotation: 0,
                    scale: 1,
                  }));
                  handlePatchCurrentLine?.({
                    choiceLayout: 'stacked',
                    options: resetOpts,
                    promptXPercent: undefined,
                    promptYPercent: undefined,
                    promptRotation: 0,
                    promptScale: 1,
                  });
                  if (recordHistorySnapshot) recordHistorySnapshot();
                  notify?.("Layout changed to stacked column");
                } else {
                  const total = currentLine.options?.length || 1;
                  const freeOpts = (currentLine.options || []).map((o, idx) => ({
                    ...o,
                    xPercent: o.xPercent ?? 50,
                    yPercent: o.yPercent ?? (Math.round((50 + (idx - (total - 1) / 2) * 12) * 10) / 10),
                  }));
                  handlePatchCurrentLine?.({ choiceLayout: 'free', options: freeOpts });
                  if (recordHistorySnapshot) recordHistorySnapshot();
                  notify?.("Layout changed to free transformable mode");
                }
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
              title="Toggle between stacked column or free transformable mode"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {currentLine.choiceLayout === 'free' || currentLine.options?.some((o) => o.xPercent !== undefined)
                  ? 'Layout: Free'
                  : 'Layout: Stacked'}
              </span>
            </button>
          ) : (
            <div className="px-2.5 py-1.5 rounded-lg text-xs uppercase font-mono font-bold text-[var(--muted)] flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {currentLine?.type === 'fx_start'
                  ? 'FX Start'
                  : currentLine?.type === 'fx_end'
                  ? 'FX End'
                  : `Event: ${currentLine?.type || 'Control'}`}
              </span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

          <button
            onClick={() => setShowSceneAudioModal?.(true)}
            className="px-2.5 py-1.5 hover:bg-[var(--surface-strong)] text-[var(--text)] rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
            title="Configure background BGM and entrance SFX for this scenario"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.soundOn} className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Audio</span>
            {currentScene?.entrySfxUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
          </button>

          <button
            onClick={() => {
              if (openAssetPicker && handleUpdateCurrentScene) {
                openAssetPicker('background', (url) => {
                  handleUpdateCurrentScene('backgroundUrl', url);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  notify?.('Scenario background updated');
                });
              } else if (setActiveGlobalModal) {
                setActiveGlobalModal('scenes');
              }
            }}
            className="px-2.5 py-1.5 hover:bg-[var(--surface-strong)] text-[var(--text)] rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
            title="Select scenario background from Gallery"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Background</span>
          </button>

          <label className="px-2.5 py-1.5 hover:bg-[var(--surface-strong)] text-[var(--text)] rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.upload} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Upload</span>
            <input type="file" accept="image/*" onChange={handleUploadBackground} className="hidden" />
          </label>
        </div>
      </div>

      {/* GAME SCREEN CANVAS WRAPPER WITH DOCKED TOOLBAR RAIL */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedElement(null);
            setSelectedHotspotId(null);
            setSelectedChoiceIndex(null);
            setIsEditingChoiceText(false);
            setIsEditingPromptText(false);
          }
        }}
        className="relative w-full flex items-center justify-center"
      >
        {/* SVG Filter Definitions for Liquid & Pixelate (Always mounted, immune to Chromium culling) */}
        <ScreenFxSvgDefs activeFx={currentSelectedFx} />

        {/* GAME SCREEN CANVAS */}
        <div
          ref={canvasRef}
          onClick={(e) => {
            if (isPlacingButton) {
              if (handleCanvasClick) handleCanvasClick(e);
              return;
            }
            setSelectedElement(null);
            setSelectedHotspotId(null);
            setSelectedChoiceIndex(null);
            setIsEditingChoiceText(false);
            setIsEditingPromptText(false);
          }}
          style={{ aspectRatio: '16 / 9', containerType: 'size' }}
          className={`relative w-full aspect-video shrink-0 rounded-lg overflow-hidden border border-[var(--border2)] bg-black shadow-2xl transition-all ${
            previewShake
          } ${isPlacingButton ? 'cursor-crosshair' : 'cursor-default'}`}
        >
          {/* Continuous Screen Effect Overlay & Filter Definitions in Editor */}
          {currentSelectedFx && (
            <VNScreenFxOverlay
              fxType={currentSelectedFx.type}
              intensity={currentSelectedFx.intensity}
              color={currentSelectedFx.color}
              animation={currentSelectedFx.animation}
              customWords={currentSelectedFx.customWords}
              flashlightMode={currentSelectedFx.flashlightMode}
              flashlightRadius={currentSelectedFx.flashlightRadius}
              flashlightShutdown={currentSelectedFx.flashlightShutdown}
              flashlightHitsRequired={currentSelectedFx.flashlightHitsRequired}
              fadeInSeconds={currentSelectedFx.fadeInSeconds}
              isFadingOut={false}
              params={currentSelectedFx.params}
            />
          )}

          {/* Background layer with live SVG filter support */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-300 overflow-hidden"
          >
            {effectiveBgUrl ? (
              effectiveBgUrl.endsWith('.mp4') || effectiveBgUrl.endsWith('.webm') || effectiveBgUrl.startsWith('data:video/') ? (
                <video
                  src={getProxiedImageUrl(effectiveBgUrl)}
                  crossOrigin="anonymous"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  style={{ filter: stageFxFilter, imageRendering: isStagePixelate ? 'pixelated' : undefined }}
                />
              ) : (
                <img
                  src={getProxiedImageUrl(effectiveBgUrl)}
                  crossOrigin="anonymous"
                  alt="Scene Background"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  style={{ filter: stageFxFilter, imageRendering: isStagePixelate ? 'pixelated' : undefined }}
                />
              )
            ) : null}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50 pointer-events-none" />

          {previewFlash && (
            <div
              className="absolute inset-0 pointer-events-none z-40 transition-opacity"
              style={{ backgroundColor: previewFlash }}
            />
          )}

        {currentScene?.hotspots?.map((hs) => {
          const iconSize = hs.iconSize || 64;
          const iconUrl = hs.icon || GUI_ICONS.action.entryDoor;
          const isSelected = selectedElement === 'hotspot' && selectedHotspotId === hs.id;
          const hsScale = typeof hs.scale === 'number' && Number.isFinite(hs.scale) ? hs.scale : 1;
          const hsRotation = typeof hs.rotation === 'number' && Number.isFinite(hs.rotation) ? hs.rotation : 0;
          const hsFlipX = hs.flipX ?? false;
          const hsLocked = hs.locked ?? false;
          const hsX = typeof hs.xPercent === 'number' && Number.isFinite(hs.xPercent) ? hs.xPercent : 50;
          const hsY = typeof hs.yPercent === 'number' && Number.isFinite(hs.yPercent) ? hs.yPercent : 50;

          return (
            <div
              key={hs.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElement('hotspot');
                setSelectedHotspotId(hs.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (setEditingHotspotId) setEditingHotspotId(hs.id);
                if (setShowHotspotStudio) setShowHotspotStudio(true);
              }}
              style={{
                position: 'absolute',
                left: `${hsX}%`,
                top: `${hsY}%`,
                transform: `translate(-50%, -50%) rotate(${hsRotation}deg) scale(${
                  hsScale * (hsFlipX ? -1 : 1)
                }, ${hsScale})`,
                transformOrigin: '50% 50%',
                zIndex: isSelected ? 40 : 20,
              }}
              className={`group flex flex-col items-center justify-center select-none cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-sky-400 rounded-md shadow-[0_0_24px_rgba(56,189,248,0.5)]'
                  : 'hover:brightness-110'
              }`}
              title="Click to select & transform / Double-click to open Hotspot Studio"
            >
              {/* Clean SVG icon */}
              <div
                className={`relative flex items-center justify-center transition-[filter] duration-150 filter ${
                  isSelected
                    ? 'drop-shadow-[0_0_24px_rgba(56,189,248,1)]'
                    : 'drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] group-hover:drop-shadow-[0_0_20px_rgba(56,189,248,0.9)]'
                }`}
                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
              >
                <GuiIconRenderer icon={iconUrl} className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
              </div>

              {/* Clean label text */}
              <div className="mt-1 flex flex-col items-center pointer-events-none transition-opacity duration-150 opacity-90 group-hover:opacity-100">
                <span className="text-[10px] font-bold tracking-wider text-white uppercase filter drop-shadow-[0_2px_5px_rgba(0,0,0,1)] group-hover:text-sky-300 transition-colors flex items-center justify-center gap-1 max-w-[140px]">
                  <span className="truncate">{hs.label}</span>
                  {hsLocked && <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-2.5 h-2.5 text-sky-300 shrink-0 inline" />}
                </span>
              </div>

              {/* Universal Transform Gizmo attached to Hotspot when selected */}
              {isSelected && (
                <VNUniversalTransformGizmo
                  target={{
                    id: hs.id,
                    xPercent: hsX,
                    yPercent: hsY,
                    scale: hsScale,
                    scaleX: 1,
                    scaleY: 1,
                    rotation: hsRotation,
                    flipX: hsFlipX,
                    locked: hsLocked,
                    disableSnap: hs.disableSnap ?? false,
                    pivotX: 50,
                    pivotY: 50,
                    isText: true,
                    text: hs.label,
                  }}
                  stageRef={canvasRef}
                  disableSnapping={!snapToGuides}
                  capabilities={{
                    allowCrop: false,
                    allow3D: false,
                    allowPivot: false,
                    allowFlip: true,
                    allowLock: true,
                    allowRotate: true,
                    allowNonUniformScale: false,
                    allowKeyboardNudge: true,
                  }}
                  snapTargets={[
                    ...(dialogueSnap ? [dialogueSnap] : []),
                    ...(currentSpeakerAvatar ? [{
                      id: 'stage-character',
                      xPercent: charX,
                      yPercent: charY,
                      widthPercent: 20,
                      heightPercent: 35,
                      disableSnap: charDisableSnap || charLocked,
                    }] : []),
                    ...(currentScene?.hotspots || [])
                      .filter((other) => other.id !== hs.id)
                      .map((other) => ({
                        id: other.id,
                        xPercent: other.xPercent,
                        yPercent: other.yPercent,
                        widthPercent: 12,
                        heightPercent: 12,
                        disableSnap: other.locked || other.disableSnap,
                      })),
                  ]}
                  onUpdate={(patch) => handleTransformHotspot(hs.id, patch)}
                  onCommitText={(newText) => handleTransformHotspot(hs.id, { text: newText })}
                  onTransformEnd={() => {
                    if (recordHistorySnapshot) recordHistorySnapshot();
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Canvas-level character sprite (active ONLY when custom placed in free layout) */}
        {!isDocked && isCustomPlaced && renderCharacter(false)}

        {/* Reference Guides Overlay (Center and Thirds) */}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
            {/* Vertical Center Axis (X: 50%) */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-400/40 border-l border-dashed border-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              <span className="absolute top-12 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow">
                X: 50%
              </span>
            </div>

            {/* Horizontal Center Axis (Y: 50%) */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-400/40 border-t border-dashed border-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow">
                Y: 50%
              </span>
            </div>

            {/* Rule of Thirds subtle lines */}
            <div className="absolute top-0 bottom-0 left-1/3 -translate-x-1/2 w-[1px] border-l border-dotted border-white/10" />
            <div className="absolute top-0 bottom-0 left-2/3 -translate-x-1/2 w-[1px] border-l border-dotted border-white/10" />
            <div className="absolute left-0 right-0 top-1/3 -translate-y-1/2 h-[1px] border-t border-dotted border-white/10" />
            <div className="absolute left-0 right-0 top-2/3 -translate-y-1/2 h-[1px] border-t border-dotted border-white/10" />
          </div>
        )}

        {/* If current line is 'choice', render cinematic floating choice bars */}
        {currentLine?.type === 'choice' && currentLine.options && (() => {
          const totalOptions = currentLine.options.length;

          return (
            <div className="absolute inset-0 z-25 pointer-events-auto">
              {/* Dim backdrop */}
              <div
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade-in"
                onClick={() => {
                  setSelectedElement(null);
                  setSelectedChoiceIndex(null);
                  setIsEditingPromptText(false);
                }}
              />

              {/* Question or prompt displayed on screen (Fully Transformable & Editable) */}
              {(currentLine.prompt !== undefined || selectedElement === 'choice_prompt') && (() => {
                const isSelectedPrompt = selectedElement === 'choice_prompt';
                const defaultY = currentLine.choiceLayout === 'free' || currentLine.options?.some((o) => o.xPercent !== undefined) ? 12 : 32;
                const px = currentLine.promptXPercent ?? 50;
                const py = currentLine.promptYPercent ?? defaultY;
                const pScale = currentLine.promptScale ?? 1;
                const pRot = currentLine.promptRotation ?? 0;
                const isPromptNearRight = px > 75;

                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${px}%`,
                      top: `${py}%`,
                      transform: `translate(-50%, -50%) rotate(${pRot}deg) scale(${pScale})`,
                      zIndex: isSelectedPrompt ? 40 : 30,
                    }}
                    className="select-none transition-transform duration-75 pointer-events-auto"
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement('choice_prompt');
                        setSelectedChoiceIndex(null);
                        notify?.("Pregunta / Prompt seleccionada");
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement('choice_prompt');
                        setIsEditingPromptText(true);
                      }}
                      className={`px-6 py-2 bg-black/85 backdrop-blur-md border rounded-full shadow-2xl text-center max-w-xl transition-all cursor-pointer flex items-center justify-center ${
                        isSelectedPrompt && !isEditingPromptText
                          ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black/60 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                          : isEditingPromptText
                          ? 'ring-2 ring-cyan-400/80 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {isEditingPromptText ? (
                        <input
                          data-raw-input="true"
                          type="text"
                          value={currentLine.prompt || ''}
                          onChange={(e) => handleUpdateCurrentLine('prompt', e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setIsEditingPromptText(false);
                              notify?.("Pregunta actualizada");
                              if (recordHistorySnapshot) recordHistorySnapshot();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setIsEditingPromptText(false);
                            }
                          }}
                          onBlur={() => {
                            setIsEditingPromptText(false);
                            if (recordHistorySnapshot) recordHistorySnapshot();
                          }}
                          className="text-xs md:text-sm text-gray-200 font-medium tracking-wide bg-transparent border-0 outline-none text-center p-0 m-0 select-text cursor-text min-w-[140px] shadow-none ring-0"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                          }}
                          placeholder="Enter prompt here..."
                          autoFocus
                        />
                      ) : (
                        <span className={`text-xs md:text-sm font-medium tracking-wide ${
                          currentLine.prompt ? 'text-gray-200' : 'text-gray-400 italic'
                        }`}>
                          {currentLine.prompt || '(Enter prompt here...)'}
                        </span>
                      )}
                    </div>

                    {/* Floating Edit Button to the Right */}
                    {isSelectedPrompt && (
                      <div
                        className={`absolute ${
                          isPromptNearRight ? 'right-[calc(100%+12px)]' : 'left-[calc(100%+12px)]'
                        } top-1/2 -translate-y-1/2 z-50 pointer-events-auto flex items-center shrink-0`}
                        style={{
                          transform: `translateY(-50%) scale(${1 / Math.max(0.1, pScale)})`,
                          transformOrigin: isPromptNearRight ? 'right center' : 'left center',
                        }}
                      >
                        {!isEditingPromptText ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditingPromptText(true);
                              playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-cyan-950/95 hover:bg-cyan-900 border border-cyan-400/80 hover:border-cyan-300 text-cyan-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.7)] cursor-pointer whitespace-nowrap transition-all group"
                            title="Edit question text on screen (or press Enter / Double Click)"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            <span>Edit Question</span>
                            <span className="opacity-50 text-[9px] font-sans font-normal">(Enter)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditingPromptText(false);
                              notify?.("Question updated");
                              if (recordHistorySnapshot) recordHistorySnapshot();
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-emerald-950/95 hover:bg-emerald-900 border border-emerald-400/80 hover:border-emerald-300 text-emerald-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer whitespace-nowrap transition-all"
                            title="Confirm changes (Enter)"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-400">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Listo</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Universal Transform Gizmo (Hidden while editing text!) */}
                    {isSelectedPrompt && !isEditingPromptText && (
                      <VNUniversalTransformGizmo
                        target={{
                          id: 'choice-prompt',
                          xPercent: px,
                          yPercent: py,
                          scale: pScale,
                          rotation: pRot,
                          locked: currentLine.promptLocked ?? false,
                          isText: true,
                          text: currentLine.prompt,
                        }}
                        stageRef={canvasRef}
                        disableSnapping={!snapToGuides}
                        onUpdate={handleTransformChoicePrompt}
                        onCommitText={(newText) => {
                          handleUpdateCurrentLine('prompt', newText);
                          if (recordHistorySnapshot) recordHistorySnapshot();
                        }}
                        snapTargets={[
                          ...(currentLine.options || []).map((o, sIdx) => ({
                            id: o.id,
                            xPercent: o.xPercent ?? 50,
                            yPercent: o.yPercent ?? Math.round((50 + (sIdx - ((currentLine.options?.length || 1) - 1) / 2) * 12) * 10) / 10,
                            widthPercent: o.widthPercent,
                          })),
                        ]}
                        capabilities={{
                          allowCrop: false,
                          allow3D: false,
                          allowPivot: false,
                          allowFlip: false,
                          allowLock: true,
                          allowRotate: true,
                          allowNonUniformScale: false,
                        }}
                      />
                    )}
                  </div>
                );
              })()}

              {/* Free / Centered Unified Choice Option Bars */}
              <div className="absolute inset-0 pointer-events-none">
                {currentLine.options.map((opt, i) => {
                  const hideContainer = opt.hideContainer ?? currentLine.choiceHideContainer ?? false;
                  const hoverEffect = opt.hoverEffect || currentLine.choiceHoverEffect || 'none';
                  const hoverEffectClass =
                    hoverEffect === 'underline'
                      ? 'vn-btn-effect-underline'
                      : hoverEffect === 'box'
                      ? 'vn-btn-effect-box'
                      : hoverEffect === 'shine'
                      ? 'vn-btn-effect-shine'
                      : '';

                  const isSelected = selectedElement === 'choice_button' && selectedChoiceIndex === i;
                  const containerClass = hideContainer
                    ? 'bg-transparent hover:bg-transparent border-transparent hover:border-transparent text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]'
                    : 'bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 hover:border-purple-400 text-white shadow-xl hover:brightness-110';

                  const defaultY = Math.round((50 + (i - (totalOptions - 1) / 2) * 12) * 10) / 10;
                  const x = typeof opt.xPercent === 'number' && Number.isFinite(opt.xPercent) ? opt.xPercent : 50;
                  const y = typeof opt.yPercent === 'number' && Number.isFinite(opt.yPercent) ? opt.yPercent : defaultY;
                  const rot = typeof opt.rotation === 'number' && Number.isFinite(opt.rotation) ? opt.rotation : 0;
                  const sc = typeof opt.scale === 'number' && Number.isFinite(opt.scale) ? opt.scale : 1;

                  return (
                    <VNUniversalButton
                      key={opt.id}
                      id={opt.id}
                      label={opt.label || ''}
                      placeholder={`Enter option #${i + 1} here...`}
                      sublabel={`#${i + 1}`}
                      actionIcon={
                        <span className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3.5 h-3.5" />
                        </span>
                      }
                      style={opt.style || 'cyber'}
                      size={opt.size || 'md'}
                      fontFamily={opt.fontFamily}
                      hoverEffect={hoverEffect}
                      hideContainer={hideContainer}
                      isSelected={isSelected}
                      isEditingText={isSelected && isEditingChoiceText}
                      onStartEditText={() => {
                        setIsEditingChoiceText(true);
                        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                      }}
                      onCommitText={(newText) => {
                        handleTransformChoiceOption(i, { text: newText });
                        setIsEditingChoiceText(false);
                        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                        notify?.(`Option #${i + 1} text updated`);
                        if (recordHistorySnapshot) recordHistorySnapshot();
                      }}
                      onCancelEditText={() => {
                        setIsEditingChoiceText(false);
                      }}
                      xPercent={x}
                      yPercent={y}
                      widthPercent={opt.widthPercent}
                      scale={sc}
                      scaleX={opt.scaleX}
                      scaleY={opt.scaleY}
                      rotation={rot}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedElement !== 'choice_button' || selectedChoiceIndex !== i) {
                          setIsEditingChoiceText(false);
                        }
                        setSelectedElement('choice_button');
                        setSelectedChoiceIndex(i);
                        notify(`Option #${i + 1} button selected`);
                      }}
                    >
                      {/* Universal Gizmo attached when Choice Button is Selected (Hidden during text editing) */}
                      {isSelected && !isEditingChoiceText && (
                        <VNUniversalTransformGizmo
                          target={{
                            id: opt.id,
                            xPercent: x,
                            yPercent: y,
                            scale: sc,
                            scaleX: opt.scaleX ?? 1,
                            scaleY: opt.scaleY ?? 1,
                            rotation: rot,
                            locked: opt.locked ?? false,
                            disableSnap: opt.disableSnap ?? false,
                            widthPercent: opt.widthPercent,
                            isText: true,
                            text: opt.label,
                          }}
                          stageRef={canvasRef}
                          disableSnapping={!snapToGuides}
                          onUpdate={(patch) => handleTransformChoiceOption(i, patch)}
                          onCommitText={(newText) => handleTransformChoiceOption(i, { text: newText })}
                          capabilities={{
                            allowCrop: false,
                            allow3D: false,
                            allowPivot: false,
                            allowFlip: false,
                            allowLock: true,
                            allowRotate: true,
                            allowNonUniformScale: true,
                          }}
                          snapTargets={[
                            ...(dialogueSnap ? [dialogueSnap] : []),
                            ...(currentSpeakerAvatar ? [{
                              id: 'stage-character',
                              xPercent: charX,
                              yPercent: charY,
                              widthPercent: 20,
                              heightPercent: 35,
                              disableSnap: charDisableSnap || charLocked,
                            }] : []),
                            ...(currentLine.prompt !== undefined ? [{
                              id: 'choice-prompt',
                              xPercent: currentLine.promptXPercent ?? 50,
                              yPercent: currentLine.promptYPercent ?? (currentLine.choiceLayout === 'free' || currentLine.options?.some((o) => o.xPercent !== undefined) ? 12 : 32),
                              widthPercent: currentLine.promptWidthPercent ?? 40,
                              heightPercent: 6,
                              disableSnap: currentLine.promptLocked,
                            }] : []),
                            ...(currentLine.options || [])
                              .filter((_, idx) => idx !== i)
                              .map((sibling, sIdx) => {
                                const sibDefaultY = Math.round((50 + (sIdx - (totalOptions - 1) / 2) * 12) * 10) / 10;
                                return {
                                  id: sibling.id,
                                  xPercent: sibling.xPercent ?? 50,
                                  yPercent: sibling.yPercent ?? sibDefaultY,
                                  widthPercent: sibling.widthPercent ?? 55,
                                  heightPercent: 8,
                                  disableSnap: sibling.locked || sibling.disableSnap,
                                };
                              }),
                          ]}
                        />
                      )}
                    </VNUniversalButton>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {currentLine?.type === 'dialogue' && (
          showCanvasTextbox ? (
            <div className={`absolute inset-x-[2cqw] z-30 ${ctx.story?.textBoxConfig?.position === 'middle' ? 'top-1/2 -translate-y-1/2' : 'bottom-[2cqh]'}`}>
              {/* Docked Character Avatar pinned flush to top border of Dialogue Box */}
              {isDocked && renderCharacter(true)}

              <div
                ref={textboxRef}
                className="relative rounded-md p-3 border-2 shadow-2xl transition-all"
                style={{
                  borderColor: activeBorderColor,
                  backgroundColor: activeBgColor,
                }}
              >
                {/* Cyber corners synced with player */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: activeBorderColor }} />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: activeBorderColor }} />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: activeBorderColor }} />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: activeBorderColor }} />

                <div className="flex items-center justify-between mb-1.5 border-b pb-1" style={{ borderColor: `${activeBorderColor}40` }}>
                  <button
                    onClick={() => setShowCharacterPicker?.(true)}
                    className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:underline"
                    style={{ color: activeNameplateColor }}
                  >
                    <span>{currentLine?.customSpeakerName || currentSpeaker?.name || 'SYSTEM LOG'}</span>
                    {currentSpeaker?.badgeTitle && (
                      <span
                        className="px-1.5 py-0.2 border text-[9px] uppercase tracking-widest rounded"
                        style={{
                          backgroundColor: `${currentSpeaker.color || '#ef4444'}20`,
                          borderColor: `${currentSpeaker.color || '#ef4444'}60`,
                          color: currentSpeaker.color || '#ef4444',
                        }}
                      >
                        {currentSpeaker.badgeTitle}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-2.5 h-2.5 text-gray-500" />
                      <span>(change)</span>
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 font-mono">
                      LINE #{selectedLineIndex + 1}
                    </span>
                    <button
                      onClick={() => setShowCanvasTextbox?.(false)}
                      className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] px-2 py-0.5 rounded-lg bg-[var(--btn-bg)] border border-[var(--border)] hover:border-[var(--border2)] transition-colors cursor-pointer flex items-center gap-1"
                      title="Minimize to keep canvas unobstructed"
                    >
                      <span>Hide</span>
                      <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {currentLine?.type === 'dialogue' && (
                  <>
                    <textarea
                      rows={2}
                      value={isPlayingPreview ? animatedPreviewText : (currentLine.text || '')}
                      onChange={(e) => handleUpdateCurrentLine('text', e.target.value)}
                      placeholder="Enter dialogue text here..."
                      className={`w-full bg-transparent ${
                        activeFontSize === 'sm' ? 'text-xs' : activeFontSize === 'lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                      } leading-relaxed focus:bg-[var(--well-bg)] rounded-lg p-1 outline-none resize-none placeholder-[var(--muted2)] transition-colors min-h-[50px]`}
                      style={{
                        color: activeTextColor,
                        fontFamily: resolveEffectiveFontFamily({
                          eventFont: currentLine.fontFamily,
                          characterFont: currentSpeaker?.fontFamily,
                          storyFont: defaultFontFamily,
                          editorTheme,
                        }),
                      }}
                    />

                    {/* Preview of quick player controls to match 1:1 box height with reproduction */}
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-gray-500 opacity-40 pointer-events-none select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-[var(--muted2)] uppercase tracking-wider opacity-70">
                          [IN-GAME HUD]
                        </span>
                        <span className="px-1.5 py-0.5 rounded border border-gray-800 text-[9px] uppercase tracking-widest">
                          AUTO
                        </span>
                        <span className="px-1.5 py-0.5 rounded border border-gray-800 text-[9px] uppercase tracking-widest">
                          SKIP
                        </span>
                        <span className="px-1.5 py-0.5 rounded border border-gray-800 text-[9px] uppercase tracking-widest">
                          LOG
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-red-950/30 border border-red-900/60 text-red-400 rounded text-[9px] uppercase tracking-widest flex items-center gap-1">
                          <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-2.5 h-2.5 text-red-400" />
                          <span>SAVE</span>
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 text-gray-400 rounded text-[9px] uppercase tracking-widest flex items-center gap-1">
                          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-2.5 h-2.5 text-gray-400" />
                          <span>LOAD</span>
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <button
                onClick={() => setShowCanvasTextbox?.(true)}
                className="px-3.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer shadow-2xl backdrop-blur-md flex items-center gap-1.5 transition-all"
                title="Restore textbox on interactive canvas"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Show Textbox (Line #{selectedLineIndex + 1})</span>
              </button>
            </div>
          )
        )}
        </div>

        {/* DOCKED VERTICAL STUDIO TOOLBAR (STRICTLY OUTSIDE CANVAS ON THE RIGHT RAIL) */}
        {selectedElement === 'character' && currentSpeakerAvatar && (
          <div onClick={(e) => e.stopPropagation()} className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 shrink-0 pointer-events-auto">
            <VNTransformToolbar
              target={{
                id: 'stage-character',
                xPercent: charX,
                yPercent: charY,
                scale: charScale,
                rotation: charRotation,
                flipX: charFlipX,
                locked: charLocked,
                pivotX: 50,
                pivotY: 100,
              }}
              onUpdate={handleTransformCharacter}
              onTransformEnd={() => {
                if (recordHistorySnapshot) recordHistorySnapshot();
              }}
              capabilities={{
                allowCrop: false,
                allow3D: false,
                allowPivot: false,
                allowFlip: true,
                allowLock: true,
                allowRotate: true,
              }}
              notify={notify}
              onConfigure={() => {
                if (setShowCharacterPicker) setShowCharacterPicker(true);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              onDelete={() => {
                if (!handlePatchCurrentLine) return;
                handlePatchCurrentLine({
                  characterId: undefined,
                  customSpeakerName: undefined,
                  emotion: undefined,
                });
                setSelectedElement(null);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                notify?.("Character removed from this line");
                if (recordHistorySnapshot) recordHistorySnapshot();
              }}
            />
          </div>
        )}

        {selectedElement === 'hotspot' && selectedHotspot && (
          <div onClick={(e) => e.stopPropagation()} className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 shrink-0 pointer-events-auto">
            <VNTransformToolbar
              target={{
                id: selectedHotspot.id,
                xPercent: selectedHotspot.xPercent,
                yPercent: selectedHotspot.yPercent,
                scale: selectedHotspot.scale ?? 1,
                rotation: selectedHotspot.rotation ?? 0,
                flipX: selectedHotspot.flipX ?? false,
                locked: selectedHotspot.locked ?? false,
                pivotX: 50,
                pivotY: 50,
                isText: true,
                text: selectedHotspot.label,
              }}
              onUpdate={(patch) => handleTransformHotspot(selectedHotspot.id, patch)}
              onTransformEnd={() => {
                if (recordHistorySnapshot) recordHistorySnapshot();
              }}
              notify={notify}
              onConfigure={() => {
                if (setEditingHotspotId) setEditingHotspotId(selectedHotspot.id);
                if (setShowHotspotStudio) setShowHotspotStudio(true);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              onDelete={() => {
                if (handleRemoveHotspot) handleRemoveHotspot(selectedHotspot.id);
                setSelectedElement(null);
                setSelectedHotspotId(null);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                notify?.("Hotspot button removed from scenario");
              }}
              capabilities={{
                allowCrop: false,
                allow3D: false,
                allowPivot: false,
                allowFlip: true,
                allowLock: true,
                allowRotate: true,
              }}
            />
          </div>
        )}

        {selectedElement === 'choice_button' && selectedChoiceIndex !== null && currentLine?.options?.[selectedChoiceIndex] && (() => {
          const opt = currentLine.options[selectedChoiceIndex];
          const total = currentLine.options.length;
          const defaultY = Math.round((50 + (selectedChoiceIndex - (total - 1) / 2) * 12) * 10) / 10;
          const x = opt.xPercent ?? 50;
          const y = opt.yPercent ?? defaultY;

          return (
            <div onClick={(e) => e.stopPropagation()} className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 shrink-0 pointer-events-auto">
              <VNTransformToolbar
                target={{
                  id: opt.id,
                  xPercent: x,
                  yPercent: y,
                  scale: opt.scale ?? 1,
                  scaleX: opt.scaleX ?? 1,
                  scaleY: opt.scaleY ?? 1,
                  rotation: opt.rotation ?? 0,
                  locked: opt.locked ?? false,
                  widthPercent: opt.widthPercent,
                  isText: true,
                  text: opt.label,
                }}
                onUpdate={(patch) => handleTransformChoiceOption(selectedChoiceIndex, patch)}
                onTransformEnd={() => {
                  if (recordHistorySnapshot) recordHistorySnapshot();
                }}
                notify={notify}
                onEditText={() => {
                  setIsEditingChoiceText(true);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                onDelete={() => {
                  if (!handlePatchCurrentLine || !currentLine?.options) return;
                  const remaining = currentLine.options.filter((_, idx) => idx !== selectedChoiceIndex);
                  handlePatchCurrentLine({ options: remaining });
                  setSelectedElement(null);
                  setSelectedChoiceIndex(null);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  notify?.("Option deleted");
                  if (recordHistorySnapshot) recordHistorySnapshot();
                }}
                capabilities={{
                  allowCrop: false,
                  allow3D: false,
                  allowPivot: false,
                  allowFlip: false,
                  allowLock: true,
                  allowRotate: true,
                }}
              />
            </div>
          );
        })()}

        {selectedElement === 'choice_prompt' && currentLine?.type === 'choice' && (() => {
          const defaultY = currentLine.choiceLayout === 'free' || currentLine.options?.some((o) => o.xPercent !== undefined) ? 12 : 32;
          const px = currentLine.promptXPercent ?? 50;
          const py = currentLine.promptYPercent ?? defaultY;

          return (
            <div onClick={(e) => e.stopPropagation()} className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 shrink-0 pointer-events-auto">
              <VNTransformToolbar
                target={{
                  id: 'choice-prompt',
                  xPercent: px,
                  yPercent: py,
                  scale: currentLine.promptScale ?? 1,
                  rotation: currentLine.promptRotation ?? 0,
                  locked: currentLine.promptLocked ?? false,
                  widthPercent: currentLine.promptWidthPercent,
                  isText: true,
                  text: currentLine.prompt,
                }}
                onUpdate={handleTransformChoicePrompt}
                onTransformEnd={() => {
                  if (recordHistorySnapshot) recordHistorySnapshot();
                }}
                notify={notify}
                onEditText={() => {
                  setIsEditingPromptText(true);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                onDelete={() => {
                  if (!handlePatchCurrentLine) return;
                  handlePatchCurrentLine({ prompt: undefined });
                  setSelectedElement(null);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                  notify?.("Pregunta eliminada");
                  if (recordHistorySnapshot) recordHistorySnapshot();
                }}
                capabilities={{
                  allowCrop: false,
                  allow3D: false,
                  allowPivot: false,
                  allowFlip: false,
                  allowLock: true,
                  allowRotate: true,
                }}
              />
            </div>
          );
        })()}
      </div>

      {/* 5. LIVE MINI-PLAYER CONTROLS */}
      <div className="vn-card p-3 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevLine}
            disabled={selectedLineIndex === 0}
            className="vn-btn px-3 py-1.5 text-xs font-bold disabled:opacity-30 flex items-center gap-1"
          >
            <GuiIconRenderer icon={GUI_ICONS.state.backwardTime} className="w-3 h-3 text-[var(--muted)]" />
            <span>Previous</span>
          </button>

          <button
            onClick={playCurrentLinePreview}
            className="vn-btn primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3.5 h-3.5" />
            <span>{isPlayingPreview ? 'Playing...' : 'PLAY LINE'}</span>
          </button>

          <button
            onClick={handleNextLine}
            disabled={selectedLineIndex === (currentScene?.timeline?.length || 1) - 1}
            className="vn-btn px-3 py-1.5 text-xs font-bold disabled:opacity-30 flex items-center gap-1"
          >
            <span>Next</span>
            <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3 h-3 text-[var(--muted)]" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>SFX:</span>
          </span>

          <div className="flex items-center gap-1.5 bg-[var(--well-bg)] rounded-lg px-2 py-1 max-w-[260px]">
            {currentLine?.sfx ? (
              <>
                <button
                  type="button"
                  onClick={() => playSfx(currentLine.sfx!, false, 0.8)}
                  className="w-5 h-5 flex items-center justify-center rounded-lg bg-[var(--btn-bg)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-white text-[10px] cursor-pointer shrink-0 transition-colors"
                  title="Listen to assigned sound"
                >
                  <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs text-[var(--text)] font-mono truncate max-w-[120px]" title={currentLine.sfx}>
                  {getDisplayAssetName(currentLine.sfx)}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateCurrentLine('sfx', undefined)}
                  className="text-[var(--muted2)] hover:text-red-500 text-xs cursor-pointer ml-1"
                  title="Remove sound from this line"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
                </button>
              </>
            ) : (
              <span className="text-xs text-[var(--muted2)] italic">-- No SFX --</span>
            )}

            <button
              type="button"
              onClick={() =>
                openAssetPicker('sfx', (url) => handleUpdateCurrentLine('sfx', url || undefined))
              }
              className="ml-1 px-2 py-0.5 hover:bg-[var(--surface-strong)] text-[var(--text)] rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1 shrink-0"
              title="Open Asset Gallery to select an SFX (sound effects only)"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3 h-3 text-[var(--accent)]" />
              <span>Gallery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
