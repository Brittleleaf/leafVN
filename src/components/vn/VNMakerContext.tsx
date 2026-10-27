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

export interface VNMakerContextType {
  // Estado básico
  story: VNStory;
  setStory: React.Dispatch<React.SetStateAction<VNStory>>;
  editorTheme: VNEditorTheme;
  handleSelectTheme: (theme: VNEditorTheme) => void;

  // Navegación y Espacios de Trabajo (Workspaces)
  currentWorkspace: VNWorkspaceView;
  setCurrentWorkspace: (view: VNWorkspaceView) => void;
  selectedChapterId: string;
  setSelectedChapterId: (id: string) => void;
  selectedSceneId: string;
  setSelectedSceneId: (id: string) => void;
  selectedLineIndex: number;
  setSelectedLineIndex: (idx: number | ((prev: number) => number)) => void;

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
  playCurrentLinePreview: () => void;
  showCanvasTextbox: boolean;
  setShowCanvasTextbox: (show: boolean) => void;
  currentSelectedFx: VNActiveSelectedFx | null;

  // Hotspots / Botones interactivos
  isPlacingButton: boolean;
  setIsPlacingButton: (placing: boolean) => void;
  pendingButtonType: VNHotspotStyle;
  setPendingButtonType: (type: VNHotspotStyle) => void;
  showHotspotStudio: boolean;
  setShowHotspotStudio: (show: boolean) => void;
  editingHotspotId: string | null;
  setEditingHotspotId: (id: string | null) => void;
  draggingHotspotId: string | null;
  handleCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleHotspotPointerDown: (e: React.PointerEvent, hs: VNHotspot) => void;
  handleRemoveHotspot: (id: string) => void;

  // Línea de tiempo y saltos
  timelineFilter: string;
  setTimelineFilter: (filter: string) => void;
  timelineFxStatus: VNTimelineFxStatus;
  incomingJumpsByEventId: Record<string, { choiceIndex: number; optionLabel: string }[]>;
  incomingJumpsByIndex: Record<number, { choiceIndex: number; optionLabel: string }[]>;

  // Drag and Drop en Timeline & Tabs de Escenas
  draggedTimelineItem: DraggedTimelineItem | null;
  setDraggedTimelineItem: (item: DraggedTimelineItem | null) => void;
  draggedTimelineIndex: number | null;
  setDraggedTimelineIndex: (idx: number | null) => void;
  dragOverTimelineIndex: number | null;
  setDragOverTimelineIndex: (idx: number | null) => void;
  dragOverSceneTabId: string | null;
  setDragOverSceneTabId: (id: string | null) => void;
  draggedSceneIndex: number | null;
  setDraggedSceneIndex: (idx: number | null) => void;
  dragOverSceneIndex: number | null;
  setDragOverSceneIndex: (idx: number | null) => void;
  handleDragCancel: () => void;
  handleMoveSceneTab: (fromIndex: number, toIndex: number) => void;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  recordHistorySnapshot: () => void;

  // Modales y Pickers
  activeGlobalModal: 'characters' | 'variables' | 'chapter' | 'textbox' | 'scenes' | 'scene_map' | 'assets' | 'projects' | 'doctor' | 'menu_tool' | null;
  setActiveGlobalModal: (modal: 'characters' | 'variables' | 'chapter' | 'textbox' | 'scenes' | 'scene_map' | 'assets' | 'projects' | 'doctor' | 'menu_tool' | null) => void;
  showCharacterPicker: boolean;
  setShowCharacterPicker: (show: boolean) => void;
  showAddActionModal: boolean;
  setShowAddActionModal: (show: boolean) => void;
  showSceneAudioModal: boolean;
  setShowSceneAudioModal: (show: boolean) => void;
  showHelpGuide: boolean;
  setShowHelpGuide: React.Dispatch<React.SetStateAction<boolean>>;
  isFullscreenWorkspace: boolean;
  setIsFullscreenWorkspace: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFullscreenWorkspace: () => void;
  assetPickerConfig: VNAssetPickerConfig | null;
  setAssetPickerConfig: (cfg: VNAssetPickerConfig | null) => void;
  openAssetPicker: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => void;

  // Feedback y utilidades
  feedbackMsg: string;
  notify: (msg: string) => void;
  getDisplayAssetName: (url: string | undefined, defaultPlaceholder?: string) => string;

  // Guardado y exportación
  handleManualSave: () => Promise<void>;
  handleExport: () => void;
  handleReset: () => void;

  // Mutaciones de Línea / Evento
  handleUpdateCurrentLine: (field: keyof VNEvent, value: any) => void;
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

  // Mutaciones de Escena / Capítulo / Personaje
  handleSelectScene: (sceneId: string) => void;
  handleAddScene: (
    name?: string,
    bgUrl?: string,
    sceneType?: 'standard' | 'event',
    eventSubtype?: 'cinematic' | 'static'
  ) => void;
  handleDuplicateScene: (sceneId: string) => void;
  handleDeleteScene: (sceneId: string) => void;
  handleUpdateCurrentScene: (field: keyof VNScene, value: any) => void;
  handlePatchCurrentScene: (patch: Partial<VNScene>) => void;
  handleUploadBackground: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleApplyBackgroundToCurrentScene: (bgUrl: string) => void;
  handleUpdateCharacter: (charId: string, patch: Partial<VNCharacter>) => void;
  handleApplyScaleToAllDialogues: (characterId: string, scale: number) => void;
  handleUpdateStoryCustomAssets?: (updatedAssets: VNAssetItem[]) => void;
}

export const VNMakerContext = createContext<VNMakerContextType | null>(null);

export function useVNMaker(): VNMakerContextType {
  const context = useContext(VNMakerContext);
  if (!context) {
    throw new Error('useVNMaker must be used within a VNMakerProvider');
  }
  return context;
}
