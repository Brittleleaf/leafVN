'use client';

import React, { createContext, useContext } from 'react';
import {
  VNStory,
  VNChapter,
  VNScene,
  VNEvent,
  VNCharacter,
  VNHotspot,
  VNHotspotStyle,
  VNAssetType,
  VNAssetItem,
  VNScreenFxType,
  VNWorkspaceView,
  VNActiveGlobalModal,
} from '@/types/vn';
import { VNEditorTheme } from '@/lib/vn/themeManager';
import { DraggedTimelineItem } from './VNMakerTimeline';

export interface VNTimelineFxStatus {
  activeMap: Map<string, {
    type: VNScreenFxType;
    pairId?: string;
    intensity?: 'light' | 'medium' | 'heavy';
    color?: string;
    animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
    customWords?: string[];
    params?: Record<string, any>;
    flashlightMode?: 'normal' | 'broken';
    flashlightRadius?: number;
    flashlightShutdown?: boolean;
    flashlightHitsRequired?: number;
  }>;
  pairsMap: Map<string, { startIdx: number; endIdx: number; startId: string; endId: string }>;
}

export interface VNActiveSelectedFx {
  type: VNScreenFxType;
  intensity: 'light' | 'medium' | 'heavy';
  color?: string;
  animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
  customWords?: string[];
  flashlightMode?: 'normal' | 'broken';
  flashlightRadius?: number;
  flashlightShutdown?: boolean;
  flashlightHitsRequired?: number;
  fadeInSeconds: number;
  params?: Record<string, any>;
}

export interface VNAssetPickerConfig {
  filterType: VNAssetType;
  initialFontSample?: string;
  previewBackgroundUrl?: string;
  onSelect: (url: string, assetName?: string) => void;
}

export interface VNMakerStateType {
  // Estado básico
  story: VNStory;
  editorTheme: VNEditorTheme;

  // Navegación y Espacios de Trabajo (Workspaces)
  currentWorkspace: VNWorkspaceView;
  projectSettingsTab: 'variables' | 'textbox' | 'doctor' | 'general';
  selectedChapterId: string;
  selectedSceneId: string;
  selectedLineIndex: number;

  // Objetos computados activos
  currentChapter?: VNChapter;
  currentScene?: VNScene;
  currentLine?: VNEvent;
  currentSpeaker?: VNCharacter;
  currentSpeakerAvatar?: string;
  activeBorderColor: string;
  activeBgColor: string;
  activeNameplateColor: string;
  activeTextColor: string;
  activeFontSize?: 'sm' | 'base' | 'lg';

  // Vista previa interactiva (Mini-player)
  canvasRef: React.RefObject<HTMLDivElement | null>;
  previewShake: string;
  previewFlash: string | null;
  isPlayingPreview: boolean;
  animatedPreviewText: string;
  isTypingPreview: boolean;
  showCanvasTextbox: boolean;
  currentSelectedFx: VNActiveSelectedFx | null;

  // Hotspots / Botones interactivos
  isPlacingButton: boolean;
  pendingButtonType: VNHotspotStyle;
  showHotspotStudio: boolean;
  editingHotspotId: string | null;
  draggingHotspotId: string | null;

  // Línea de tiempo y saltos
  timelineFilter: string;
  timelineFxStatus: VNTimelineFxStatus;
  incomingJumpsByEventId: Record<string, { choiceIndex: number; optionLabel: string }[]>;
  incomingJumpsByIndex: Record<number, { choiceIndex: number; optionLabel: string }[]>;

  // Drag and Drop en Timeline & Tabs de Escenas
  draggedTimelineItem: DraggedTimelineItem | null;
  draggedTimelineIndex: number | null;
  dragOverTimelineIndex: number | null;
  dragOverSceneTabId: string | null;
  draggedSceneIndex: number | null;
  dragOverSceneIndex: number | null;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;

  // Modales y Pickers
  activeGlobalModal: VNActiveGlobalModal;
  showCharacterPicker: boolean;
  showAddActionModal: boolean;
  showSceneAudioModal: boolean;
  showHelpGuide: boolean;
  isFullscreenWorkspace: boolean;
  assetPickerConfig: VNAssetPickerConfig | null;

  // Feedback y utilidades
  feedbackMsg: string;

  // Photopea-style native File System & IndexedDB state
  linkedFileHandle: FileSystemFileHandle | null;
  linkedFileName: string | null;
  fileSafetyAlert: {
    isOpen: boolean;
    fileName: string;
    errorMessage?: string;
  };
}

export interface VNMakerActionsType {
  setStory: React.Dispatch<React.SetStateAction<VNStory>>;
  handleSelectTheme: (theme: VNEditorTheme) => void;
  setCurrentWorkspace: (view: VNWorkspaceView) => void;
  setProjectSettingsTab: (tab: 'variables' | 'textbox' | 'doctor' | 'general') => void;
  setSelectedChapterId: (id: string) => void;
  setSelectedSceneId: (id: string) => void;
  setSelectedLineIndex: (idx: number | ((prev: number) => number)) => void;

  playCurrentLinePreview: () => void;
  setShowCanvasTextbox: (show: boolean) => void;
  setIsPlacingButton: (placing: boolean) => void;
  setPendingButtonType: (type: VNHotspotStyle) => void;
  setShowHotspotStudio: (show: boolean) => void;
  setEditingHotspotId: (id: string | null) => void;
  handleCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleHotspotPointerDown: (e: React.PointerEvent, hs: VNHotspot) => void;
  handleRemoveHotspot: (id: string) => void;

  setTimelineFilter: (filter: string) => void;
  setDraggedTimelineItem: (item: DraggedTimelineItem | null) => void;
  setDraggedTimelineIndex: (idx: number | null) => void;
  setDragOverTimelineIndex: (idx: number | null) => void;
  setDragOverSceneTabId: (id: string | null) => void;
  setDraggedSceneIndex: (idx: number | null) => void;
  setDragOverSceneIndex: (idx: number | null) => void;
  handleDragCancel: () => void;
  handleMoveSceneTab: (fromIndex: number, toIndex: number) => void;

  handleUndo: () => void;
  handleRedo: () => void;
  recordHistorySnapshot: () => void;

  setActiveGlobalModal: (modal: VNActiveGlobalModal) => void;
  setShowCharacterPicker: (show: boolean) => void;
  setShowAddActionModal: (show: boolean) => void;
  setShowSceneAudioModal: (show: boolean) => void;
  setShowHelpGuide: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFullscreenWorkspace: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFullscreenWorkspace: () => void;
  setAssetPickerConfig: (cfg: VNAssetPickerConfig | null) => void;
  openAssetPicker: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => void;

  notify: (msg: string) => void;
  getDisplayAssetName: (url: string | undefined, defaultPlaceholder?: string) => string;

  handleManualSave: () => Promise<void>;
  handleExport: () => void;
  handleReset: () => void;
  handleOpenFileFromPC: () => Promise<void>;
  handleSaveAsFromPC: () => Promise<void>;
  dismissSafetyAlert: () => void;

  handleUpdateCurrentLine: (field: keyof VNEvent, value: unknown) => void;
  handlePatchCurrentLine: (patch: Partial<VNEvent>) => void;
  handleDeleteCurrentLine: () => void;
  handlePrevLine: () => void;
  handleNextLine: () => void;
  handleInsertEvent: (type: VNEvent['type'], customPayload?: Partial<VNEvent>) => void;
  handleMoveLine: (fromIndex: number, toIndex: number) => void;
  handleDuplicateLine: (index: number) => void;
  handleDeleteLine: (index: number) => void;
  handleMoveLineToScene: (fromIndex: number, targetSceneId: string) => void;
  handleMoveLineBetweenScenes: (fromSceneId: string, fromIndex: number, toSceneId: string, toIndex?: number) => void;

  handleSelectScene: (sceneId: string) => void;
  handleAddScene: (
    name?: string,
    bgUrl?: string,
    sceneType?: 'standard' | 'event',
    eventSubtype?: 'cinematic' | 'static'
  ) => void;
  handleDuplicateScene: (sceneId: string) => void;
  handleDeleteScene: (sceneId: string) => void;
  handleMoveSceneToChapter?: (sceneId: string, targetChapterId: string | '__global__') => void;
  handleUpdateCurrentScene: (field: keyof VNScene, value: unknown) => void;
  handlePatchCurrentScene: (patch: Partial<VNScene>) => void;
  handleUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleApplyBackgroundToCurrentScene: (bgUrl: string) => void;
  handleUpdateCharacter: (charId: string, patch: Partial<VNCharacter>) => void;
  handleApplyScaleToAllDialogues: (characterId: string, scale: number) => void;
  handleUpdateStoryCustomAssets?: (updatedAssets: VNAssetItem[]) => void;
}

export type VNMakerContextType = VNMakerStateType & VNMakerActionsType;

export const VNMakerStateContext = createContext<VNMakerStateType | null>(null);
export const VNMakerActionsContext = createContext<VNMakerActionsType | null>(null);
export const VNMakerContext = createContext<VNMakerContextType | null>(null);

/**
 * Hook unificado 100% compatible con todos los componentes existentes
 */
export function useVNMaker(): VNMakerContextType {
  const combined = useContext(VNMakerContext);
  if (combined) return combined;

  const state = useContext(VNMakerStateContext);
  const actions = useContext(VNMakerActionsContext);
  if (!state || !actions) {
    throw new Error('useVNMaker must be used within a VNMakerProvider');
  }
  return { ...state, ...actions };
}

/**
 * Hook optimizado que consume exclusivamente las acciones memoizadas
 * Cero re-renders cuando el estado, texto de tecleo o animación cambian.
 */
export function useVNMakerActions(): VNMakerActionsType {
  const actions = useContext(VNMakerActionsContext);
  if (actions) return actions;
  const combined = useContext(VNMakerContext);
  if (combined) return combined;
  throw new Error('useVNMakerActions must be used within a VNMakerProvider');
}

/**
 * Hook optimizado que consume exclusivamente el estado
 */
export function useVNMakerStateContext(): VNMakerStateType {
  const state = useContext(VNMakerStateContext);
  if (state) return state;
  const combined = useContext(VNMakerContext);
  if (combined) return combined;
  throw new Error('useVNMakerStateContext must be used within a VNMakerProvider');
}
