"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { flushPendingStorySave } from '@/lib/vn/storage';
import { SYSTEM_ASSETS } from '@/lib/vn/systemAssets';
import { playSfx, playAudioPreview, stopAudioPreview } from '@/lib/audioSettings';
import {
  saveActiveStory,
  exportStoryToJson,
  resetToSampleStory,
} from '@/lib/vn/storage';
import { fileToBase64, uploadProjectAssetFile, getCharacterAvatar, syncChoiceJumpsInTimeline } from '@/lib/vn/engineUtils';
import { GUI_ICONS } from '@/lib/vn/guiIcons';
import { VNEditorTheme, getStoredTheme, setStoredTheme, initStoredThemeAndAccent } from '@/lib/vn/themeManager';
import { DEFAULT_DEATH_CONFIG } from '@/components/vn/StaticScreenView';
import { DEFAULT_CINEMATIC_CONFIG } from '@/components/vn/CinematicPlayerView';
import { SCREEN_FX_CONFIGS } from '@/components/vn/VNScreenFxOverlay';
import {
  VNMakerContextType,
  VNMakerStateType,
  VNMakerActionsType,
  VNTimelineFxStatus,
  VNActiveSelectedFx,
  VNAssetPickerConfig,
} from '@/components/vn/VNMakerContext';
import { DraggedTimelineItem } from '@/components/vn/VNMakerTimeline';
import { auth } from '@/lib/firebase/config';
import { saveProjectToCloud } from '@/lib/firebase/cloudProjects';
import { idbSaveWorkingCopy, idbGetWorkingCopy, idbSaveSnapshot } from '@/lib/vn/idbStorage';
import {
  openNativeLeafvnFile,
  saveToExistingFileHandle,
  saveAsNativeLeafvnFile,
  verifyFileHandleHealth,
} from '@/lib/vn/fileSystemAccess';
import { createStoryBundleBlob } from '@/lib/vn/bundleClient';

export function useVNMakerState(
  initialStory: VNStory,
  onPlayStory: (story: VNStory) => void,
  onExit: () => void,
  onSaveStory?: (story: VNStory) => void
): VNMakerContextType {
  const [story, setStory] = useState<VNStory>(initialStory);

  // Tema visual del motor (Modern Dark / Light / ROTP Theme)
  const [editorTheme, setEditorTheme] = useState<VNEditorTheme>(() => story.editorTheme || getStoredTheme());

  useEffect(() => {
    initStoredThemeAndAccent();
  }, []);

  useEffect(() => {
    setStoredTheme(editorTheme);
  }, [editorTheme]);

  const handleSelectTheme = (newTheme: VNEditorTheme) => {
    setEditorTheme(newTheme);
    setStoredTheme(newTheme);
    setStory((prev) => ({ ...prev, editorTheme: newTheme }));
  };

  // Desactivar el efecto CRT/VHS global sobre el motor para mantener la interfaz limpia
  useEffect(() => {
    const overlay = document.getElementById('global-vhs-overlay');
    if (overlay) {
      const prevDisplay = overlay.style.display;
      overlay.style.display = 'none';
      return () => {
        overlay.style.display = prevDisplay;
      };
    }
  }, []);

  // Navegación activa y Espacio de Trabajo Principal (Hub por defecto)
  const [currentWorkspace, setCurrentWorkspaceState] = useState<VNWorkspaceView>('hub');
  const [projectSettingsTab, setProjectSettingsTab] = useState<'variables' | 'textbox' | 'doctor' | 'general'>('variables');

  const setCurrentWorkspace = useCallback((ws: VNWorkspaceView) => {
    setCurrentWorkspaceState(ws);
    playSfx('/assets/sfx/click intro.mp3', false, 0.25);
  }, []);

  const [selectedChapterId, setSelectedChapterId] = useState<string>(story.chapters[0]?.id || '');
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    story.chapters[0]?.scenes[0]?.id || ''
  );
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0);

  // Estados interactivos del Mini-Player en vivo
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [animatedPreviewText, setAnimatedPreviewText] = useState<string>('');
  const [isTypingPreview, setIsTypingPreview] = useState<boolean>(false);
  const [previewShake, setPreviewShake] = useState<string>('');
  const [previewFlash, setPreviewFlash] = useState<string | null>(null);

  // Modales interactivos de edición directa
  const [showCharacterPicker, setShowCharacterPicker] = useState<boolean>(false);
  const [showAddActionModal, setShowAddActionModal] = useState<boolean>(false);
  const [activeGlobalModal, setActiveGlobalModal] = useState<VNActiveGlobalModal>(null);

  // Redirigir modales legados de configuración y assets a sus respectivos Workspaces dedicados
  const handleSetActiveGlobalModal = useCallback((modal: VNActiveGlobalModal) => {
    if (modal === 'variables') {
      setProjectSettingsTab('variables');
      setCurrentWorkspace('project_settings');
      setActiveGlobalModal(null);
      return;
    }
    if (modal === 'textbox') {
      setProjectSettingsTab('textbox');
      setCurrentWorkspace('project_settings');
      setActiveGlobalModal(null);
      return;
    }
    if (modal === 'doctor') {
      setProjectSettingsTab('doctor');
      setCurrentWorkspace('project_settings');
      setActiveGlobalModal(null);
      return;
    }
    if (modal === 'characters' || modal === 'assets') {
      setCurrentWorkspace('gallery_assets');
      setActiveGlobalModal(null);
      return;
    }
    setActiveGlobalModal(modal);
  }, []);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(true);
  const [isFullscreenWorkspace, setIsFullscreenWorkspace] = useState<boolean>(false);

  const toggleFullscreenWorkspace = () => {
    setIsFullscreenWorkspace((prev) => !prev);
    playSfx('/assets/sfx/click intro.mp3', false, 0.25);
  };

  // Selector modal de medios desde la Galería
  const [assetPickerConfig, setAssetPickerConfig] = useState<VNAssetPickerConfig | null>(null);

  const openAssetPicker = (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => {
    setAssetPickerConfig({ filterType, onSelect, initialFontSample, previewBackgroundUrl });
  };

  const [timelineFilter, setTimelineFilter] = useState<string>('');

  // Colocación interactiva de botones sobre el escenario
  const [isPlacingButton, setIsPlacingButton] = useState<boolean>(false);
  const [pendingButtonType, setPendingButtonType] = useState<VNHotspotStyle>('door');
  const [showHotspotStudio, setShowHotspotStudio] = useState<boolean>(false);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [draggingHotspotId, setDraggingHotspotId] = useState<string | null>(null);

  // Drag and drop timeline & scenes
  const [draggedTimelineItem, setDraggedTimelineItem] = useState<DraggedTimelineItem | null>(null);
  const [draggedTimelineIndex, setDraggedTimelineIndex] = useState<number | null>(null);
  const [dragOverTimelineIndex, setDragOverTimelineIndex] = useState<number | null>(null);
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);
  const [dragOverSceneTabId, setDragOverSceneTabId] = useState<string | null>(null);

  const [showSceneAudioModal, setShowSceneAudioModal] = useState<boolean>(false);
  const [showCanvasTextbox, setShowCanvasTextbox] = useState<boolean>(true);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewShakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewFlashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Notificación visual de guardado
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Photopea-style native File System & IndexedDB state
  const [linkedFileHandle, setLinkedFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [linkedFileName, setLinkedFileName] = useState<string | null>(null);
  const [fileSafetyAlert, setFileSafetyAlert] = useState<{
    isOpen: boolean;
    fileName: string;
    errorMessage?: string;
  }>({
    isOpen: false,
    fileName: '',
  });

  const dismissSafetyAlert = useCallback(() => {
    setFileSafetyAlert({ isOpen: false, fileName: '' });
  }, []);

  // Carga inicial: restaurar handle de IndexedDB si existe para este proyecto
  useEffect(() => {
    idbGetWorkingCopy(story.id).then((cached) => {
      if (cached?.fileHandle) {
        setLinkedFileHandle(cached.fileHandle);
        setLinkedFileName(cached.fileName || cached.fileHandle.name);
      }
    });
  }, [story.id]);

  // Auto-guardado en caliente en IndexedDB (provisional) con debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      idbSaveWorkingCopy(story, linkedFileHandle || undefined, linkedFileName || undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, [story, linkedFileHandle, linkedFileName]);

  // Snapshot periódico automático cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      idbSaveSnapshot(story, 'auto');
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [story]);

  // Historial de cambios (Undo / Redo)
  const pastStoriesRef = useRef<VNStory[]>([]);
  const futureStoriesRef = useRef<VNStory[]>([]);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  const recordHistorySnapshot = useCallback(() => {
    try {
      const snapshot: VNStory = JSON.parse(JSON.stringify(story));
      pastStoriesRef.current = [...pastStoriesRef.current.slice(-29), snapshot];
      futureStoriesRef.current = [];
      setCanUndo(true);
      setCanRedo(false);
    } catch (err) {
      console.warn('Could not record history snapshot', err);
    }
  }, [story]);

  const notify = useCallback((msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  }, []);

  const handleUndo = useCallback(() => {
    if (pastStoriesRef.current.length === 0) return;
    const previous = pastStoriesRef.current.pop()!;
    try {
      futureStoriesRef.current.push(JSON.parse(JSON.stringify(story)));
    } catch (e) {}
    setStory(previous);
    saveActiveStory(previous);

    // Ensure selectedChapterId, selectedSceneId, and selectedLineIndex are valid within previous
    const isGlobalScenario = (previous.scenarios || []).some((s) => s.id === selectedSceneId);
    if (isGlobalScenario) {
      const targetScene = (previous.scenarios || []).find((s) => s.id === selectedSceneId);
      const timelineLen = targetScene?.timeline?.length || 0;
      if (selectedLineIndex >= timelineLen) {
        setSelectedLineIndex(Math.max(0, timelineLen - 1));
      }
    } else {
      const validChapter = previous.chapters.find((c) => c.id === selectedChapterId) || previous.chapters[0];
      const hasScene = validChapter?.scenes.some((s) => s.id === selectedSceneId);
      if (!hasScene) {
        if (validChapter) {
          setSelectedChapterId(validChapter.id);
          setSelectedSceneId(validChapter.scenes[0]?.id || '');
          setSelectedLineIndex(0);
        }
      } else {
        const targetScene = validChapter?.scenes.find((s) => s.id === selectedSceneId);
        const timelineLen = targetScene?.timeline?.length || 0;
        if (selectedLineIndex >= timelineLen) {
          setSelectedLineIndex(Math.max(0, timelineLen - 1));
        }
      }
    }

    setCanUndo(pastStoriesRef.current.length > 0);
    setCanRedo(true);
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    notify('Undo applied (Ctrl+Z)');
  }, [story, selectedChapterId, selectedSceneId, selectedLineIndex, notify]);

  const handleRedo = useCallback(() => {
    if (futureStoriesRef.current.length === 0) return;
    const next = futureStoriesRef.current.pop()!;
    try {
      pastStoriesRef.current.push(JSON.parse(JSON.stringify(story)));
    } catch (e) {}
    setStory(next);
    saveActiveStory(next);

    // Ensure selectedChapterId, selectedSceneId, and selectedLineIndex are valid within next
    const isNextGlobalScenario = (next.scenarios || []).some((s) => s.id === selectedSceneId);
    if (isNextGlobalScenario) {
      const targetScene = (next.scenarios || []).find((s) => s.id === selectedSceneId);
      const timelineLen = targetScene?.timeline?.length || 0;
      if (selectedLineIndex >= timelineLen) {
        setSelectedLineIndex(Math.max(0, timelineLen - 1));
      }
    } else {
      const validChapter = next.chapters.find((c) => c.id === selectedChapterId) || next.chapters[0];
      const hasScene = validChapter?.scenes.some((s) => s.id === selectedSceneId);
      if (!hasScene) {
        if (validChapter) {
          setSelectedChapterId(validChapter.id);
          setSelectedSceneId(validChapter.scenes[0]?.id || '');
          setSelectedLineIndex(0);
        }
      } else {
        const targetScene = validChapter?.scenes.find((s) => s.id === selectedSceneId);
        const timelineLen = targetScene?.timeline?.length || 0;
        if (selectedLineIndex >= timelineLen) {
          setSelectedLineIndex(Math.max(0, timelineLen - 1));
        }
      }
    }

    setCanUndo(true);
    setCanRedo(futureStoriesRef.current.length > 0);
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    notify('Redo applied (Ctrl+Y)');
  }, [story, selectedChapterId, selectedSceneId, selectedLineIndex, notify]);

  // Referencias a elementos actuales con protección contra nulos
  const currentChapter =
    story.chapters.find((c) => c.id === selectedChapterId) || story.chapters[0];
  const currentScene =
    currentChapter?.scenes.find((s) => s.id === selectedSceneId) ||
    (story.scenarios || []).find((s) => s.id === selectedSceneId) ||
    currentChapter?.scenes[0];
  const currentLine = currentScene?.timeline?.[selectedLineIndex] || currentScene?.timeline?.[0];

  const currentSpeaker = story.characters.find((c) => c.id === currentLine?.characterId);
  const currentSpeakerAvatar = getCharacterAvatar(currentSpeaker, currentLine?.emotion);

  // Estilos dinámicos calculados para el Text Box
  const activeBorderColor =
    currentSpeaker?.textBoxConfig?.borderColor || currentSpeaker?.color || story.textBoxConfig.borderColor || '#b91c1c';
  const activeBgColor =
    currentSpeaker?.textBoxConfig?.backgroundColor ||
    story.textBoxConfig.backgroundColor ||
    `rgba(8, 8, 12, ${currentSpeaker?.textBoxConfig?.opacity ?? story.textBoxConfig.opacity ?? 0.92})`;
  const activeNameplateColor =
    currentSpeaker?.textBoxConfig?.nameplateColor || currentSpeaker?.color || story.textBoxConfig.nameplateColor || '#ef4444';
  const activeTextColor =
    currentSpeaker?.textBoxConfig?.textColor || story.textBoxConfig.textColor || '#f3f4f6';
  const activeFontSize: 'sm' | 'base' | 'lg' =
    currentSpeaker?.textBoxConfig?.fontSize || story.textBoxConfig.fontSize || 'base';

  const allKnownAssets = [...SYSTEM_ASSETS, ...(story.customAssets || [])];
  const getDisplayAssetName = (url: string | undefined, defaultPlaceholder: string = '-- No SFX --') => {
    if (!url) return defaultPlaceholder;
    const found = allKnownAssets.find((a) => a.url === url);
    if (found) return found.name;
    const filename = url.split('/').pop()?.replace(/\.[^/.]+$/, '');
    if (filename) {
      const decoded = decodeURIComponent(filename);
      const cleanName = decoded.replace(/^\d+_/, '').replace(/[-_]/g, ' ');
      return cleanName.trim() || decoded;
    }
    return url;
  };

  const handleUpdateCharacter = (charId: string, patch: Partial<VNCharacter>) => {
    recordHistorySnapshot();
    setStory((prevStory) => {
      let finalPatch = { ...patch };
      if ('avatarUrl' in patch && patch.avatarUrl !== undefined) {
        const targetChar = prevStory.characters.find((c) => c.id === charId);
        const existingExpressions = patch.expressions || targetChar?.expressions || {};
        finalPatch.expressions = {
          ...existingExpressions,
          neutral: patch.avatarUrl,
        };
      }
      const updated = prevStory.characters.map((c) => (c.id === charId ? { ...c, ...finalPatch } : c));
      const updatedStory = { ...prevStory, characters: updated };
      saveActiveStory(updatedStory);
      return updatedStory;
    });
  };

  const handleApplyScaleToAllDialogues = useCallback((characterId: string, scale: number) => {
    recordHistorySnapshot();
    let totalUpdated = 0;
    setStory((prevStory) => {
      // 1. Guardar como escala por defecto del personaje
      const updatedCharacters = prevStory.characters.map((c) =>
        c.id === characterId ? { ...c, defaultScale: scale } : c
      );

      // 2. Aplicar escala a todos los eventos de diálogo del personaje en toda la historia
      const updatedChapters = prevStory.chapters.map((chap) => {
        const updatedScenes = chap.scenes.map((sc) => {
          if (!sc.timeline) return sc;
          const updatedTimeline = sc.timeline.map((ev) => {
            if (ev.characterId === characterId) {
              totalUpdated++;
              return { ...ev, characterScale: scale };
            }
            return ev;
          });
          return { ...sc, timeline: updatedTimeline };
        });
        return { ...chap, scenes: updatedScenes };
      });

      // 3. Aplicar escala a los escenarios de la biblioteca global si existen
      const updatedScenarios = (prevStory.scenarios || []).map((sc) => {
        if (!sc.timeline) return sc;
        const updatedTimeline = sc.timeline.map((ev) => {
          if (ev.characterId === characterId) {
            totalUpdated++;
            return { ...ev, characterScale: scale };
          }
          return ev;
        });
        return { ...sc, timeline: updatedTimeline };
      });

      const updatedStory = {
        ...prevStory,
        characters: updatedCharacters,
        chapters: updatedChapters,
        scenarios: updatedScenarios,
      };
      saveActiveStory(updatedStory);
      return updatedStory;
    });

    const targetChar = story.characters.find((c) => c.id === characterId);
    notify(`Scale ${Math.round(scale * 100) / 100}x applied to all dialogues of ${targetChar?.name || 'character'}`);
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  }, [story.characters, recordHistorySnapshot, notify]);

  // Estado y rango de Efectos de Pantalla continuos (Screen FX)
  const timelineFxStatus: VNTimelineFxStatus = useMemo(() => {
    const activeMap = new Map<string, {
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
    }>();
    const pairsMap = new Map<string, { startIdx: number; endIdx: number; startId: string; endId: string }>();
    if (!currentScene?.timeline) return { activeMap, pairsMap };

    interface OpenFxItem {
      startIdx: number;
      type: VNScreenFxType;
      pairId: string;
      intensity?: 'light' | 'medium' | 'heavy';
      color?: string;
      animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
      customWords?: string[];
      params?: Record<string, any>;
      flashlightMode?: 'normal' | 'broken';
      flashlightRadius?: number;
      flashlightShutdown?: boolean;
      flashlightHitsRequired?: number;
      eventId: string;
    }

    const openStack: OpenFxItem[] = [];

    currentScene.timeline.forEach((ev, idx) => {
      if (ev.type === 'fx_start') {
        const pId = ev.fxPairId || `pair-${ev.id}`;
        if (!ev.fxPairId) {
          ev.fxPairId = pId;
        }
        openStack.push({
          startIdx: idx,
          type: ev.fxType || 'red_alert',
          pairId: pId,
          intensity: ev.fxIntensity || 'medium',
          color: ev.fxColor,
          animation: ev.fxAnimation,
          customWords: ev.fxCustomWords,
          params: ev.fxParams,
          flashlightMode: ev.flashlightMode,
          flashlightRadius: ev.flashlightRadius,
          flashlightShutdown: ev.flashlightShutdown,
          flashlightHitsRequired: ev.flashlightHitsRequired,
          eventId: ev.id,
        });
      } else if (ev.type === 'fx_end') {
        if (openStack.length > 0) {
          let matchIdx = -1;
          if (ev.fxPairId) {
            matchIdx = openStack.findIndex((item) => item.pairId === ev.fxPairId);
          }
          if (matchIdx === -1) {
            matchIdx = openStack.length - 1;
          }
          const matched = openStack.splice(matchIdx, 1)[0];
          const resolvedPairId = matched.pairId;
          ev.fxPairId = resolvedPairId;
          ev.fxType = matched.type;

          pairsMap.set(resolvedPairId, {
            startIdx: matched.startIdx,
            endIdx: idx,
            startId: matched.eventId,
            endId: ev.id,
          });

          for (let i = matched.startIdx + 1; i < idx; i++) {
            const innerEv = currentScene.timeline[i];
            if (innerEv && innerEv.type !== 'fx_start' && innerEv.type !== 'fx_end') {
              activeMap.set(innerEv.id, {
                type: matched.type,
                pairId: resolvedPairId,
                intensity: matched.intensity,
                color: matched.color,
                animation: matched.animation,
                customWords: matched.customWords,
                params: matched.params,
                flashlightMode: matched.flashlightMode,
                flashlightRadius: matched.flashlightRadius,
                flashlightShutdown: matched.flashlightShutdown,
                flashlightHitsRequired: matched.flashlightHitsRequired,
              });
            }
          }
        }
      }
    });

    // Unclosed open effects continue to remain active on all subsequent events until the end of the timeline
    openStack.forEach((item) => {
      for (let i = item.startIdx + 1; i < currentScene.timeline.length; i++) {
        const innerEv = currentScene.timeline[i];
        if (innerEv && innerEv.type !== 'fx_start' && innerEv.type !== 'fx_end') {
          if (!activeMap.has(innerEv.id)) {
            activeMap.set(innerEv.id, {
              type: item.type,
              pairId: item.pairId,
              intensity: item.intensity,
              color: item.color,
              animation: item.animation,
              customWords: item.customWords,
              params: item.params,
              flashlightMode: item.flashlightMode,
              flashlightRadius: item.flashlightRadius,
              flashlightShutdown: item.flashlightShutdown,
              flashlightHitsRequired: item.flashlightHitsRequired,
            });
          }
        }
      }
    });

    return { activeMap, pairsMap };
  }, [currentScene?.timeline]);

  // Efecto visual activo en la línea actualmente seleccionada
  const currentSelectedFx: VNActiveSelectedFx | null = useMemo(() => {
    if (!currentLine) return null;
    if (currentLine.type === 'fx_start') {
      return {
        type: currentLine.fxType || 'red_alert',
        intensity: currentLine.fxIntensity || 'medium',
        color: currentLine.fxColor,
        animation: currentLine.fxAnimation,
        customWords: currentLine.fxCustomWords,
        params: currentLine.fxParams,
        flashlightMode: currentLine.flashlightMode,
        flashlightRadius: currentLine.flashlightRadius,
        flashlightShutdown: currentLine.flashlightShutdown,
        flashlightHitsRequired: currentLine.flashlightHitsRequired,
        fadeInSeconds: currentLine.fxFadeInSeconds || 1,
      };
    }
    const activeInfo = timelineFxStatus.activeMap.get(currentLine.id);
    if (activeInfo) {
      return {
        type: activeInfo.type,
        intensity: activeInfo.intensity || 'medium',
        color: activeInfo.color,
        animation: activeInfo.animation,
        customWords: activeInfo.customWords,
        params: activeInfo.params,
        flashlightMode: activeInfo.flashlightMode,
        flashlightRadius: activeInfo.flashlightRadius,
        flashlightShutdown: activeInfo.flashlightShutdown,
        flashlightHitsRequired: activeInfo.flashlightHitsRequired,
        fadeInSeconds: 0.5,
      };
    }
    return null;
  }, [currentLine, timelineFxStatus]);

  // Sincronizar el texto del preview cuando cambia la línea seleccionada
  useEffect(() => {
    if (!isPlayingPreview) {
      setAnimatedPreviewText(currentLine?.text || (currentLine?.type === 'choice' ? currentLine.prompt || '' : ''));
    }
  }, [selectedLineIndex, currentLine?.text, currentLine?.prompt, isPlayingPreview]);


  // Mini-reproductor en vivo
  const playCurrentLinePreview = useCallback(() => {
    if (!currentLine) return;

    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (previewShakeTimerRef.current) {
      clearTimeout(previewShakeTimerRef.current);
      previewShakeTimerRef.current = null;
    }
    if (previewFlashTimerRef.current) {
      clearTimeout(previewFlashTimerRef.current);
      previewFlashTimerRef.current = null;
    }
    setPreviewShake('');
    setPreviewFlash(null);

    setIsPlayingPreview(true);
    setIsTypingPreview(true);
    stopAudioPreview();

    if (currentLine.sfx) {
      playAudioPreview(currentLine.sfx, 0.8);
    } else if (currentLine.type === 'fx_start' && currentLine.fxLoopAudioUrl) {
      playAudioPreview(currentLine.fxLoopAudioUrl, 0.7);
    }
    if (currentLine.type === 'shake') {
      setPreviewShake('animate-bounce');
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      previewShakeTimerRef.current = setTimeout(() => {
        setPreviewShake('');
        previewShakeTimerRef.current = null;
      }, 600);
    }
    if (currentLine.type === 'flash') {
      setPreviewFlash(currentLine.flashColor === 'white' ? 'rgba(255,255,255,0.7)' : 'rgba(185,28,28,0.7)');
      previewFlashTimerRef.current = setTimeout(() => {
        setPreviewFlash(null);
        previewFlashTimerRef.current = null;
      }, 400);
    }

    const fullText = currentLine.text || (currentLine.type === 'choice' ? currentLine.prompt || '' : '...');
    let charIdx = 0;
    const charSpeed =
      currentSpeaker?.textBoxConfig?.typewriterSpeedMs || story.textBoxConfig.typewriterSpeedMs || 25;
    const charBlip = currentSpeaker?.blipSound || '/assets/sfx/click intro.mp3';
    const blipEnabled =
      currentSpeaker?.textBoxConfig?.soundBlipEnabled ?? story.textBoxConfig.soundBlipEnabled;

    previewTimerRef.current = setInterval(() => {
      charIdx++;
      setAnimatedPreviewText(fullText.slice(0, charIdx));

      if (charIdx % 3 === 0 && blipEnabled) {
        playSfx(charBlip, false, 0.08);
      }

      if (charIdx >= fullText.length) {
        if (previewTimerRef.current) {
          clearInterval(previewTimerRef.current);
          previewTimerRef.current = null;
        }
        setIsTypingPreview(false);
        setIsPlayingPreview(false);
      }
    }, charSpeed);
  }, [currentLine, currentSpeaker, story.textBoxConfig]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      if (previewShakeTimerRef.current) clearTimeout(previewShakeTimerRef.current);
      if (previewFlashTimerRef.current) clearTimeout(previewFlashTimerRef.current);
    };
  }, []);

  // Escuchar avisos de cuota de almacenamiento y notificar limpiamente sin bloquear la UI
  useEffect(() => {
    const handleQuotaWarning = (e: Event) => {
      const customEv = e as CustomEvent<{ message?: string }>;
      const msg = customEv.detail?.message || 'Storage quota reached in browser.';
      notify(msg);
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
    };
    window.addEventListener('vn:storage_quota_warning', handleQuotaWarning);
    return () => window.removeEventListener('vn:storage_quota_warning', handleQuotaWarning);
  }, [notify]);

  const handleNextLine = useCallback(() => {
    if (!currentScene?.timeline || currentScene.timeline.length === 0) return;
    const maxIdx = currentScene.timeline.length - 1;
    setSelectedLineIndex((prev) => {
      const next = Math.min(maxIdx, Math.max(0, prev + 1));
      if (next !== prev) {
        playSfx('/assets/sfx/click interface.mp3', true, 0.2);
      }
      return next;
    });
  }, [currentScene?.timeline]);

  const handlePrevLine = useCallback(() => {
    if (!currentScene?.timeline || currentScene.timeline.length === 0) return;
    const maxIdx = currentScene.timeline.length - 1;
    setSelectedLineIndex((prev) => {
      const clampedPrev = Math.min(maxIdx, Math.max(0, prev));
      const next = Math.max(0, clampedPrev - 1);
      if (next !== prev) {
        playSfx('/assets/sfx/click interface.mp3', true, 0.2);
      }
      return next;
    });
  }, [currentScene?.timeline]);

  // Abrir archivo .leafvn nativamente desde PC (Estilo Photopea)
  const handleOpenFileFromPC = useCallback(async () => {
    try {
      const result = await openNativeLeafvnFile();
      if (!result) return;
      setStory(result.story);
      setLinkedFileHandle(result.handle);
      setLinkedFileName(result.fileName);
      saveActiveStory(result.story, true);
      playSfx('/assets/sfx/open folder.mp3', false, 0.5);
      notify(`Opened "${result.fileName}" from PC (Direct write enabled)`);
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Could not open file: ${err?.message || err}`);
    }
  }, [notify]);

  // Guardar como en una nueva ubicación en PC
  const handleSaveAsFromPC = useCallback(async () => {
    try {
      const result = await saveAsNativeLeafvnFile(story, linkedFileName || story.title);
      if (!result) return;
      setLinkedFileHandle(result.handle);
      setLinkedFileName(result.fileName);
      setFileSafetyAlert({ isOpen: false, fileName: '' });
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      notify(`Project saved as "${result.fileName}" on PC!`);
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Save As error: ${err?.message || err}`);
    }
  }, [story, linkedFileName, notify]);

  // Manual save (Doble Copia: IndexedDB + Archivo Físico PC / Nube)
  const handleManualSave = useCallback(async () => {
    // 1. Dual-Copy: Guardar siempre en IndexedDB y crear Snapshot preventivo
    await idbSaveWorkingCopy(story, linkedFileHandle || undefined, linkedFileName || undefined);
    await idbSaveSnapshot(story, 'manual');

    saveActiveStory(story, true);
    try {
      localStorage.setItem(`leafvn_project_${story.id}`, JSON.stringify(story));
      localStorage.setItem('leafvn_active_project_id', story.id);
    } catch (_) {}

    if (onSaveStory) {
      try {
        onSaveStory(story);
      } catch (_) {}
    }

    let savedToCloud = false;
    if (auth.currentUser) {
      try {
        await saveProjectToCloud(auth.currentUser.uid, story);
        savedToCloud = true;
      } catch (cloudErr) {
        console.warn('Error saving to Firestore:', cloudErr);
      }
    }

    // 2. Si el proyecto tiene un archivo físico en PC vinculado (Estilo Photopea):
    if (linkedFileHandle) {
      const health = await verifyFileHandleHealth(linkedFileHandle);
      if (health.isMovedOrDeleted) {
        // PARCHE DE SEGURIDAD: Archivo movido o borrado en el disco
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.5);
        setFileSafetyAlert({
          isOpen: true,
          fileName: linkedFileName || linkedFileHandle.name || 'project.leafvn',
          errorMessage: health.error,
        });
        notify('⚠️ File moved or deleted from PC! Working copy is safe in IndexedDB.');
        return;
      }

      try {
        const bundleBlob = await createStoryBundleBlob(story);
        const writeResult = await saveToExistingFileHandle(linkedFileHandle, bundleBlob);
        if (writeResult.success) {
          playSfx('/assets/sfx/success.mp3', false, 0.5);
          notify(`Saved directly to PC file (${linkedFileName || linkedFileHandle.name})!`);
          return;
        } else if (writeResult.isMovedOrDeleted) {
          playSfx('/assets/sfx/corrupt file.mp3', false, 0.5);
          setFileSafetyAlert({
            isOpen: true,
            fileName: linkedFileName || linkedFileHandle.name || 'project.leafvn',
            errorMessage: writeResult.error,
          });
          notify('⚠️ File write failed: missing or moved.');
          return;
        }
      } catch (err: any) {
        console.warn('Direct file handle write failed:', err);
      }
    }

    // 3. Fallback habitual al servidor local o navegador
    try {
      const res = await fetch(`/api/projects/${story.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story }),
      });
      if (res.ok) {
        playSfx('/assets/sfx/success.mp3', false, 0.5);
        notify(savedToCloud ? `Project saved to Cloud & Disk (${story.id})!` : `Project saved to disk: public/projects/${story.id}!`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Server save error response:', errJson);
        notify(savedToCloud ? 'Project saved to Cloud & Browser' : `Saved to browser (${errJson.error || 'Server error ' + res.status})`);
      }
    } catch (netErr) {
      console.warn('Server save network error:', netErr);
      notify(savedToCloud ? 'Project saved to Cloud & Browser' : 'Saved to browser (IndexedDB backup intact)');
    }
  }, [story, notify, onSaveStory, linkedFileHandle, linkedFileName]);

  // Mutaciones de Escena
  const handlePatchCurrentScene = useCallback((patch: Partial<VNScene>) => {
    setStory((prevStory) => {
      const prevChapter = prevStory.chapters.find((c) => c.id === selectedChapterId) || prevStory.chapters[0];
      if (!prevChapter) return prevStory;
      const updatedScenes = prevChapter.scenes.map((s) =>
        s.id === selectedSceneId ? { ...s, ...patch } : s
      );
      const updatedChapters = prevStory.chapters.map((c) =>
        c.id === prevChapter.id ? { ...c, scenes: updatedScenes } : c
      );
      const currentScenarios = prevStory.scenarios || [];
      const updatedScenarios = currentScenarios.map((s) =>
        s.id === selectedSceneId ? { ...s, ...patch } : s
      );
      const updated = { ...prevStory, chapters: updatedChapters, scenarios: updatedScenarios };
      saveActiveStory(updated);
      return updated;
    });
  }, [selectedChapterId, selectedSceneId]);

  const handleUpdateCurrentScene = useCallback((key: keyof VNScene, value: unknown) => {
    handlePatchCurrentScene({ [key]: value });
  }, [handlePatchCurrentScene]);

  const handleUpdateStoryCustomAssets = useCallback((updatedAssets: VNAssetItem[]) => {
    setStory((prevStory) => {
      const updated = { ...prevStory, customAssets: updatedAssets };
      saveActiveStory(updated);
      return updated;
    });
  }, []);

  // Mutaciones de Línea / Evento
  const handlePatchCurrentLine = useCallback((patch: Partial<VNEvent>) => {
    setStory((prevStory) => {
      const prevChapter = prevStory.chapters.find((c) => c.id === selectedChapterId) || prevStory.chapters[0];
      if (!prevChapter) return prevStory;
      const prevScene = prevChapter.scenes.find((s) => s.id === selectedSceneId) || prevChapter.scenes[0];
      if (!prevScene) return prevStory;

      const updatedTimeline = prevScene.timeline.map((line, idx) =>
        idx === selectedLineIndex ? { ...line, ...patch } : line
      );
      const updatedScenes = prevChapter.scenes.map((s) =>
        s.id === prevScene.id ? { ...s, timeline: updatedTimeline } : s
      );
      const updatedChapters = prevStory.chapters.map((c) =>
        c.id === prevChapter.id ? { ...c, scenes: updatedScenes } : c
      );
      const currentScenarios = prevStory.scenarios || [];
      const updatedScenarios = currentScenarios.map((s) =>
        s.id === prevScene.id ? { ...s, timeline: updatedTimeline } : s
      );
      const updated = { ...prevStory, chapters: updatedChapters, scenarios: updatedScenarios };
      saveActiveStory(updated);
      return updated;
    });
  }, [selectedChapterId, selectedSceneId, selectedLineIndex]);

  const handleUpdateCurrentLine = useCallback((key: keyof VNEvent, value: unknown) => {
    handlePatchCurrentLine({ [key]: value });
  }, [handlePatchCurrentLine]);

  const handleSelectScene = useCallback((sceneId: string) => {
    const parentChap = story.chapters.find((c) => c.scenes.some((s) => s.id === sceneId));
    if (parentChap) {
      setSelectedChapterId(parentChap.id);
    }
    setSelectedSceneId(sceneId);
    setSelectedLineIndex(0);
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    notify('Scenario loaded');
  }, [story.chapters, notify]);

  const handleAddScene = useCallback((
    name?: string,
    bgUrl?: string,
    sceneType: 'standard' | 'event' = 'standard',
    eventSubtype?: 'cinematic' | 'static'
  ) => {
    recordHistorySnapshot();
    const newSceneId = `scene-${Date.now()}`;
    const defaultName =
      sceneType === 'event'
        ? eventSubtype === 'cinematic'
          ? `Cinematic #${(currentChapter?.scenes.length || 0) + 1}`
          : `Static Screen #${(currentChapter?.scenes.length || 0) + 1}`
        : `Scenario #${(currentChapter?.scenes.length || 0) + 1}`;

    const newScene: VNScene = {
      id: newSceneId,
      name: name || defaultName,
      backgroundUrl: bgUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      sceneType,
      eventSubtype,
      staticScreenConfig: eventSubtype === 'static' ? DEFAULT_DEATH_CONFIG : undefined,
      cinematicConfig: eventSubtype === 'cinematic' ? DEFAULT_CINEMATIC_CONFIG : undefined,
      timeline: [
        {
          id: `ev-${Date.now()}`,
          type: 'dialogue',
          characterId: story.characters[0]?.id,
          text: '',
        },
      ],
    };
    setStory((prevStory) => {
      const isGlobal = selectedChapterId === '__global__';
      if (isGlobal) {
        const currentScenarios = prevStory.scenarios || [];
        const updatedScenarios = [...currentScenarios, newScene];
        const updated = { ...prevStory, scenarios: updatedScenarios };
        saveActiveStory(updated);
        return updated;
      }

      const prevChapter = prevStory.chapters.find((c) => c.id === selectedChapterId) || prevStory.chapters[0];
      if (!prevChapter) return prevStory;
      const updatedChapters = prevStory.chapters.map((c) =>
        c.id === prevChapter.id ? { ...c, scenes: [...c.scenes, newScene] } : c
      );
      const updated = { ...prevStory, chapters: updatedChapters };
      saveActiveStory(updated);
      return updated;
    });
    setSelectedSceneId(newSceneId);
    setSelectedLineIndex(0);
    playSfx('/assets/sfx/open folder.mp3', false, 0.4);
    notify(
      sceneType === 'event'
        ? `Created ${eventSubtype === 'cinematic' ? 'Cinematic Event' : 'Static Screen'}!`
        : 'New scenario added!'
    );
  }, [currentChapter?.scenes.length, story.characters, selectedChapterId, recordHistorySnapshot, notify]);

  const handleDuplicateScene = useCallback((sceneId: string) => {
    const sceneToClone = currentChapter?.scenes.find((s) => s.id === sceneId);
    if (!sceneToClone) return;
    recordHistorySnapshot();
    const cloned: VNScene = JSON.parse(JSON.stringify(sceneToClone));
    cloned.id = `scene-${Date.now()}`;
    cloned.name = `${cloned.name} (Copy)`;
    cloned.timeline = cloned.timeline.map((e, idx) => ({ ...e, id: `ev-${Date.now()}-${idx}` }));
    if (cloned.hotspots) {
      cloned.hotspots = cloned.hotspots.map((h, idx) => ({ ...h, id: `hs-${Date.now()}-${idx}` }));
    }
    setStory((prevStory) => {
      const prevChapter = prevStory.chapters.find((c) => c.id === selectedChapterId) || prevStory.chapters[0];
      if (!prevChapter) return prevStory;
      const updatedChapters = prevStory.chapters.map((c) =>
        c.id === prevChapter.id ? { ...c, scenes: [...c.scenes, cloned] } : c
      );
      const currentScenarios = prevStory.scenarios || [];
      const updatedScenarios = [...currentScenarios, cloned];
      const updated = { ...prevStory, chapters: updatedChapters, scenarios: updatedScenarios };
      saveActiveStory(updated);
      return updated;
    });
    setSelectedSceneId(cloned.id);
    setSelectedLineIndex(0);
    notify('Scenario duplicated');
  }, [currentChapter?.scenes, selectedChapterId, recordHistorySnapshot, notify]);

  const handleDeleteScene = useCallback((sceneId: string) => {
    if (!currentChapter || currentChapter.scenes.length <= 1) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('The chapter must have at least one active scenario in its storyline.');
      return;
    }
    const sceneToRemove = currentChapter.scenes.find((s) => s.id === sceneId);
    const confirmMsg = `Remove "${sceneToRemove?.name || 'this scenario'}" from current chapter?\n\nThe scenario will NOT be deleted; it will remain saved in your scenario library to use whenever you wish.`;
    if (confirm(confirmMsg)) {
      recordHistorySnapshot();
      const filtered = currentChapter.scenes.filter((s) => s.id !== sceneId);
      setStory((prevStory) => {
        const prevChapter = prevStory.chapters.find((c) => c.id === selectedChapterId) || prevStory.chapters[0];
        if (!prevChapter) return prevStory;

        const currentScenarios = prevStory.scenarios || [];
        const updatedScenarios = sceneToRemove && !currentScenarios.some((s) => s.id === sceneToRemove.id)
          ? [...currentScenarios, sceneToRemove]
          : currentScenarios;

        const updatedChapters = prevStory.chapters.map((c) =>
          c.id === prevChapter.id
            ? {
                ...c,
                scenes: filtered,
                startSceneId: c.startSceneId === sceneId ? filtered[0]?.id || '' : c.startSceneId,
              }
            : c
        );
        const updated = { ...prevStory, chapters: updatedChapters, scenarios: updatedScenarios };
        saveActiveStory(updated);
        return updated;
      });
      if (selectedSceneId === sceneId) {
        setSelectedSceneId(filtered[0]?.id || '');
        setSelectedLineIndex(0);
      }
      playSfx('/assets/sfx/glitch.mp3', false, 0.4);
      notify('Scenario removed from chapter (kept in library)');
    }
  }, [currentChapter, selectedChapterId, selectedSceneId, recordHistorySnapshot, notify]);

  const handleApplyBackgroundToCurrentScene = useCallback((bgUrl: string) => {
    handleUpdateCurrentScene('backgroundUrl', bgUrl);
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify('Background applied to current scenario');
  }, [handleUpdateCurrentScene, notify]);

  const handleUploadBackground = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the same file fires onChange reliably
    e.target.value = '';

    const projectId = story.id || 'current-project';

    try {
      const finalUrl = await uploadProjectAssetFile(file, 'background', projectId);
      handleUpdateCurrentScene('backgroundUrl', finalUrl);
      playSfx('/assets/sfx/success.mp3', false, 0.4);
      notify('Scenario background saved to project assets!');
    } catch (err) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('Error saving or uploading image');
    }
  }, [story.id, handleUpdateCurrentScene, notify]);

  const handleInsertEvent = useCallback((type: VNEvent['type'], customPayload?: Partial<VNEvent>) => {
    if (!currentScene) return;
    recordHistorySnapshot();

    if (type === 'fx_start') {
      const pairId = 'pair-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const chosenFxType = customPayload?.fxType || 'red_alert';
      const cfg = SCREEN_FX_CONFIGS[chosenFxType as VNScreenFxType];
      const startEvent: VNEvent = {
        id: `ev-${Date.now()}-fx-start`,
        type: 'fx_start',
        fxPairId: pairId,
        fxType: chosenFxType,
        fxIntensity: customPayload?.fxIntensity || 'medium',
        fxFadeInSeconds: customPayload?.fxFadeInSeconds ?? 1.0,
        fxLoopAudioUrl: customPayload?.fxLoopAudioUrl !== undefined
          ? customPayload.fxLoopAudioUrl
          : (cfg?.defaultSfx || (chosenFxType === 'red_alert' ? '/assets/sfx/ERROR RING.mp3' : undefined)),
        fxLoopAudioVolume: customPayload?.fxLoopAudioVolume ?? 0.6,
        ...customPayload,
      };
      const endEvent: VNEvent = {
        id: `ev-${Date.now() + 1}-fx-end`,
        type: 'fx_end',
        fxPairId: pairId,
        fxType: chosenFxType,
        fxFadeOutSeconds: 1.0,
      };

      const currentTimeline = currentScene.timeline || [];
      const insertIdx = Math.min(currentTimeline.length, selectedLineIndex + 1);
      const updated = [...currentTimeline];
      updated.splice(insertIdx, 0, startEvent, endEvent);
      handleUpdateCurrentScene('timeline', updated);
      setSelectedLineIndex(insertIdx);
      setShowAddActionModal(false);
      playSfx('/assets/sfx/click interface.mp3', true, 0.3);
      notify(`Screen FX "${cfg?.label || chosenFxType}" range added!`);
      return;
    }

    const newId = `ev-${Date.now()}`;
    const defaultVarKey = story.variables?.[0]?.key || 'has_keycard';
    const chosenCharId = customPayload?.characterId !== undefined ? customPayload.characterId : story.characters[0]?.id;
    const speakerChar = story.characters.find((c) => c.id === chosenCharId);

    const newEvent: VNEvent = {
      id: newId,
      type,
      characterId: chosenCharId,
      characterPosition: customPayload?.characterPosition || speakerChar?.side || story.characters[0]?.side || 'left',
      characterScale: customPayload?.characterScale ?? speakerChar?.defaultScale ?? story.characters[0]?.defaultScale ?? 1.0,
      text: type === 'dialogue' ? (customPayload?.text ?? '') : undefined,
      prompt: type === 'choice' ? (customPayload?.prompt ?? '') : undefined,
      options:
        type === 'choice'
          ? (customPayload?.options || [
              {
                id: `opt-1-${Date.now()}`,
                label: 'Option 1',
                reaction: {
                  characterId: story.characters[0]?.id,
                  text: '',
                },
              },
              {
                id: `opt-2-${Date.now()}`,
                label: 'Option 2',
                reaction: {
                  characterId: story.characters[1]?.id || story.characters[0]?.id,
                  text: '',
                },
              },
            ])
          : undefined,
      condition:
        type === 'conditional_branch'
          ? (customPayload?.condition || {
              variableKey: defaultVarKey,
              operator: '==',
              value: true,
            })
          : undefined,
      conditionalTargetSceneId: type === 'conditional_branch' ? (customPayload?.conditionalTargetSceneId || currentScene.id) : undefined,
      elseTargetSceneId: type === 'conditional_branch' ? (customPayload?.elseTargetSceneId || currentScene.id) : undefined,
      variableMutation:
        type === 'mutate_variable'
          ? (customPayload?.variableMutation || {
              key: defaultVarKey,
              operation: 'set',
              value: true,
            })
          : undefined,
      backgroundUrl:
        type === 'bg_change'
          ? (customPayload?.backgroundUrl || currentScene.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg')
          : undefined,
      shakeIntensity: type === 'shake' ? (customPayload?.shakeIntensity || 'medium') : undefined,
      flashColor: type === 'flash' ? (customPayload?.flashColor || 'red') : undefined,
      audioUrl:
        type === 'sfx'
          ? (customPayload?.audioUrl || '/assets/sfx/click interface.mp3')
          : type === 'bgm'
          ? (customPayload?.audioUrl || '/assets/sfx/bg-tvnoise.mp3')
          : undefined,
      audioVolume: type === 'bgm' ? (customPayload?.audioVolume ?? 0.5) : undefined,
      cursorType: type === 'cursor_change' ? (customPayload?.cursorType || 'palimpsest_dot') : undefined,
      cursorMode: type === 'cursor_change' ? (customPayload?.cursorMode || 'persistent') : undefined,
      targetSceneId: type === 'jump_scene' ? (customPayload?.targetSceneId || currentScene.id) : undefined,
      loadingTitle: type === 'loading_screen' ? (customPayload?.loadingTitle || 'DATA PROCESSING...') : undefined,
      durationMs: type === 'loading_screen' ? (customPayload?.durationMs ?? 2500) : undefined,
      ...customPayload,
    };

    const currentTimeline = currentScene.timeline || [];
    const insertIdx = Math.min(currentTimeline.length, selectedLineIndex + 1);
    const updated = [...currentTimeline];
    updated.splice(insertIdx, 0, newEvent);
    const syncedTimeline = syncChoiceJumpsInTimeline(updated, currentTimeline);
    handleUpdateCurrentScene('timeline', syncedTimeline);
    setSelectedLineIndex(insertIdx);
    setShowAddActionModal(false);
    playSfx('/assets/sfx/click interface.mp3', true, 0.3);
    notify('New action added to the script!');
  }, [currentScene, recordHistorySnapshot, selectedLineIndex, story.variables, story.characters, handleUpdateCurrentScene, notify]);

  const handleDeleteLine = useCallback((index: number) => {
    if (!currentScene?.timeline) return;
    if (currentScene.timeline.length <= 1) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('There must be at least one line in the scene.');
      return;
    }
    recordHistorySnapshot();

    const targetLine = currentScene.timeline[index];
    if (targetLine && (targetLine.type === 'fx_start' || targetLine.type === 'fx_end')) {
      const pId = targetLine.fxPairId;
      const pairInfo = pId ? timelineFxStatus.pairsMap.get(pId) : null;
      let otherIndex = -1;

      if (pairInfo) {
        otherIndex = targetLine.type === 'fx_start' ? pairInfo.endIdx : pairInfo.startIdx;
      } else {
        otherIndex = currentScene.timeline.findIndex(
          (ev, i) =>
            i !== index &&
            ((pId && ev.fxPairId === pId) ||
              (targetLine.type === 'fx_start' && ev.type === 'fx_end' && i > index) ||
              (targetLine.type === 'fx_end' && ev.type === 'fx_start' && i < index))
        );
      }

      if (otherIndex !== -1) {
        const indicesToDelete = new Set([index, otherIndex]);
        let filtered = currentScene.timeline.filter((_, idx) => !indicesToDelete.has(idx));
        if (filtered.length === 0) {
          filtered = [
            {
              id: `ev-${Date.now()}`,
              type: 'dialogue',
              characterId: story.characters[0]?.id,
              text: '...',
            },
          ];
        }
        const syncedFiltered = syncChoiceJumpsInTimeline(filtered, currentScene.timeline);
        handleUpdateCurrentScene('timeline', syncedFiltered);
        setSelectedLineIndex(Math.max(0, Math.min(Math.min(index, otherIndex), syncedFiltered.length - 1)));
        playSfx('/assets/sfx/flip page.mp3', false, 0.3);
        notify('Screen FX Range deleted (Start & End removed together)');
        return;
      }
    }

    const filtered = currentScene.timeline.filter((_, idx) => idx !== index);
    const syncedFiltered = syncChoiceJumpsInTimeline(filtered, currentScene.timeline);
    handleUpdateCurrentScene('timeline', syncedFiltered);
    setSelectedLineIndex(Math.max(0, Math.min(index, syncedFiltered.length - 1)));
    playSfx('/assets/sfx/flip page.mp3', false, 0.3);
    notify('Line deleted');
  }, [currentScene?.timeline, recordHistorySnapshot, timelineFxStatus.pairsMap, handleUpdateCurrentScene, notify]);

  const handleDeleteCurrentLine = useCallback(() => {
    handleDeleteLine(selectedLineIndex);
  }, [handleDeleteLine, selectedLineIndex]);

  const handleMoveLine = useCallback((fromIndex: number, toIndex: number) => {
    if (!currentScene?.timeline) return;
    if (toIndex < 0 || toIndex >= currentScene.timeline.length || fromIndex === toIndex) return;

    const movingLine = currentScene.timeline[fromIndex];
    if (movingLine?.type === 'fx_start') {
      const pair = movingLine.fxPairId ? timelineFxStatus.pairsMap.get(movingLine.fxPairId) : null;
      if (pair && toIndex >= pair.endIdx) {
        notify('FX Start cannot be moved after its FX End node');
        return;
      }
    } else if (movingLine?.type === 'fx_end') {
      const pair = movingLine.fxPairId ? timelineFxStatus.pairsMap.get(movingLine.fxPairId) : null;
      if (pair && toIndex <= pair.startIdx) {
        notify('FX End cannot be moved before its FX Start node');
        return;
      }
    }

    recordHistorySnapshot();
    const updated = [...currentScene.timeline];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    const syncedTimeline = syncChoiceJumpsInTimeline(updated, currentScene.timeline);

    handleUpdateCurrentScene('timeline', syncedTimeline);
    setSelectedLineIndex(toIndex);
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  }, [currentScene?.timeline, timelineFxStatus.pairsMap, recordHistorySnapshot, handleUpdateCurrentScene, notify]);

  const handleMoveSceneTab = useCallback((fromIndex: number, toIndex: number) => {
    const isGlobal =
      (story.scenarios || []).some((s) => s.id === selectedSceneId) &&
      !currentChapter?.scenes.some((s) => s.id === selectedSceneId);

    if (isGlobal) {
      if (!story.scenarios || toIndex < 0 || toIndex >= story.scenarios.length || fromIndex === toIndex) return;
      recordHistorySnapshot();
      const updatedScenarios = [...story.scenarios];
      const [moved] = updatedScenarios.splice(fromIndex, 1);
      updatedScenarios.splice(toIndex, 0, moved);
      const updatedStory = { ...story, scenarios: updatedScenarios };
      setStory(updatedStory);
      saveActiveStory(updatedStory);
      playSfx('/assets/sfx/click intro.mp3', false, 0.2);
      notify('Tab order rearranged');
      return;
    }

    if (!currentChapter?.scenes) return;
    if (toIndex < 0 || toIndex >= currentChapter.scenes.length || fromIndex === toIndex) return;
    recordHistorySnapshot();
    const updatedScenes = [...currentChapter.scenes];
    const [moved] = updatedScenes.splice(fromIndex, 1);
    updatedScenes.splice(toIndex, 0, moved);

    const updatedChapters = story.chapters.map((c) =>
      c.id === currentChapter.id ? { ...c, scenes: updatedScenes } : c
    );
    const updatedStory = { ...story, chapters: updatedChapters };
    setStory(updatedStory);
    saveActiveStory(updatedStory);
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    notify('Tab order rearranged');
  }, [currentChapter, recordHistorySnapshot, story, selectedSceneId, notify]);

  const handleDragCancel = useCallback(() => {
    if (draggedTimelineItem && draggedTimelineItem.sourceSceneId !== selectedSceneId) {
      setSelectedSceneId(draggedTimelineItem.sourceSceneId);
      setSelectedLineIndex(draggedTimelineItem.sourceLineIndex);
    }
    setDraggedTimelineItem(null);
    setDraggedTimelineIndex(null);
    setDragOverTimelineIndex(null);
    setDragOverSceneTabId(null);
  }, [draggedTimelineItem, selectedSceneId]);

  const handleMoveLineBetweenScenes = useCallback((
    fromSceneId: string,
    fromIndex: number,
    toSceneId: string,
    toIndex?: number
  ) => {
    if (fromSceneId === toSceneId) {
      if (toIndex !== undefined && toIndex !== fromIndex) {
        handleMoveLine(fromIndex, toIndex);
      }
      return;
    }

    const allKnownScenes = [
      ...story.chapters.flatMap((ch) => ch.scenes),
      ...(story.scenarios || []),
    ];
    const sourceScene = allKnownScenes.find((s) => s.id === fromSceneId);
    if (!sourceScene || !sourceScene.timeline || fromIndex < 0 || fromIndex >= sourceScene.timeline.length) {
      return;
    }
    const candidateLine = sourceScene.timeline[fromIndex];
    if (candidateLine && (candidateLine.type === 'fx_start' || candidateLine.type === 'fx_end')) {
      notify('FX Start/End blocks must remain within their enclosing scenario to preserve visual integrity.');
      return;
    }

    recordHistorySnapshot();

    let lineToMove: VNEvent | null = null;
    let fromSceneName = sourceScene.name;
    let toSceneName = '';

    const removeLineFromScene = (sc: VNScene): VNScene => {
      if (sc.id === fromSceneId) {
        const newTimeline = [...(sc.timeline || [])];
        if (fromIndex >= 0 && fromIndex < newTimeline.length) {
          lineToMove = newTimeline[fromIndex];
          newTimeline.splice(fromIndex, 1);
        }
        return { ...sc, timeline: newTimeline };
      }
      return sc;
    };

    const insertLineIntoScene = (sc: VNScene): VNScene => {
      if (sc.id === toSceneId) {
        toSceneName = sc.name;
        const newTimeline = [...(sc.timeline || [])];
        const insertPos =
          toIndex !== undefined
            ? Math.max(0, Math.min(newTimeline.length, toIndex))
            : newTimeline.length;
        newTimeline.splice(insertPos, 0, lineToMove!);
        return { ...sc, timeline: newTimeline };
      }
      return sc;
    };

    const chaptersAfterRemoval = story.chapters.map((ch) => ({
      ...ch,
      scenes: ch.scenes.map(removeLineFromScene),
    }));
    const scenariosAfterRemoval = (story.scenarios || []).map(removeLineFromScene);

    if (!lineToMove) return;

    const finalChapters = chaptersAfterRemoval.map((ch) => ({
      ...ch,
      scenes: ch.scenes.map(insertLineIntoScene),
    }));
    const finalScenarios = scenariosAfterRemoval.map(insertLineIntoScene);

    const updatedStory = { ...story, chapters: finalChapters, scenarios: finalScenarios };
    setStory(updatedStory);
    saveActiveStory(updatedStory);

    setSelectedSceneId(toSceneId);
    const allFinalScenes = [...finalChapters.flatMap((c) => c.scenes), ...finalScenarios];
    const targetScene = allFinalScenes.find((s) => s.id === toSceneId);
    const finalPos =
      toIndex !== undefined
        ? Math.max(0, Math.min((targetScene?.timeline?.length || 1) - 1, toIndex))
        : (targetScene?.timeline?.length || 1) - 1;

    setSelectedLineIndex(finalPos);
    playSfx('/assets/sfx/open folder.mp3', false, 0.4);
    notify(`Dialogue placed in "${toSceneName || targetScene?.name || 'Scenario'}" (Position #${finalPos + 1})`);
  }, [handleMoveLine, recordHistorySnapshot, story, notify]);

  const handleMoveLineToScene = useCallback((lineIdx: number, targetSceneId: string) => {
    if (!currentScene) return;
    handleMoveLineBetweenScenes(currentScene.id, lineIdx, targetSceneId);
  }, [currentScene, handleMoveLineBetweenScenes]);

  const handleDuplicateLine = useCallback((index: number) => {
    if (!currentScene?.timeline) return;
    const itemToClone = currentScene.timeline[index];
    if (!itemToClone) return;

    if (itemToClone.type === 'fx_end') {
      playSfx('/assets/sfx/click intro.mp3', false, 0.2);
      notify('To duplicate an FX loop, duplicate the FX Start event instead.');
      return;
    }

    recordHistorySnapshot();

    if (itemToClone.type === 'fx_start' && itemToClone.fxPairId) {
      const pId = itemToClone.fxPairId;
      const endIdx = currentScene.timeline.findIndex(
        (e, i) => i > index && e.type === 'fx_end' && e.fxPairId === pId
      );

      if (endIdx !== -1) {
        const endItem = currentScene.timeline[endIdx];
        const newPairId = `fx-pair-${Date.now()}`;
        const clonedStart: VNEvent = {
          ...JSON.parse(JSON.stringify(itemToClone)),
          id: `ev-start-${Date.now()}`,
          fxPairId: newPairId,
        };
        const clonedEnd: VNEvent = {
          ...JSON.parse(JSON.stringify(endItem)),
          id: `ev-end-${Date.now() + 1}`,
          fxPairId: newPairId,
        };

        const updated = [...currentScene.timeline];
        updated.splice(endIdx + 1, 0, clonedStart, clonedEnd);
        const syncedTimeline = syncChoiceJumpsInTimeline(updated, currentScene.timeline);
        handleUpdateCurrentScene('timeline', syncedTimeline);
        setSelectedLineIndex(endIdx + 1);
        playSfx('/assets/sfx/click interface.mp3', true, 0.3);
        notify('Screen FX Range duplicated (Start & End)');
        return;
      }
    }

    const cloned: VNEvent = JSON.parse(JSON.stringify(itemToClone));
    cloned.id = `ev-${Date.now()}`;
    if (cloned.options && Array.isArray(cloned.options)) {
      cloned.options = cloned.options.map((opt, oIdx) => ({
        ...opt,
        id: `opt-${Date.now()}-${oIdx}`,
      }));
    }
    if (cloned.fxPairId) {
      cloned.fxPairId = `fx-pair-${Date.now()}`;
    }
    const updated = [...currentScene.timeline];
    updated.splice(index + 1, 0, cloned);
    const syncedTimeline = syncChoiceJumpsInTimeline(updated, currentScene.timeline);
    handleUpdateCurrentScene('timeline', syncedTimeline);
    setSelectedLineIndex(index + 1);
    playSfx('/assets/sfx/click interface.mp3', true, 0.3);
    notify('Line duplicated');
  }, [currentScene?.timeline, recordHistorySnapshot, handleUpdateCurrentScene, notify]);

  // Manejador de Hotspots / Botones sobre el canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingButton || !canvasRef.current || !currentScene) return;
    recordHistorySnapshot();

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const xPercent = Math.round((clickX / rect.width) * 100);
    const yPercent = Math.round((clickY / rect.height) * 100);

    const icons: Record<VNHotspotStyle, string> = {
      door: GUI_ICONS.action.entryDoor,
      terminal: GUI_ICONS.action.usable,
      arrow: GUI_ICONS.action.nextButton,
      radar: GUI_ICONS.action.sheikahEye,
      inspect: GUI_ICONS.action.search,
      button: GUI_ICONS.action.select,
    };

    const newHs: VNHotspot = {
      id: `hs-${Date.now()}`,
      label: pendingButtonType === 'door' ? 'Door to...' : pendingButtonType === 'terminal' ? 'Terminal' : 'Inspect',
      style: pendingButtonType,
      xPercent: Math.max(5, Math.min(85, xPercent - 5)),
      yPercent: Math.max(5, Math.min(85, yPercent - 5)),
      icon: icons[pendingButtonType] || GUI_ICONS.action.search,
      actionType: pendingButtonType === 'door' ? 'jump_scene' : 'inspect',
      inspectText: 'Enter inspection text here...',
    };

    const currentHotspots = currentScene.hotspots || [];
    handleUpdateCurrentScene('hotspots', [...currentHotspots, newHs]);
    handleUpdateCurrentScene('enableHotspots', true);
    setIsPlacingButton(false);
    playSfx('/assets/sfx/click interface.mp3', true, 0.5);
    notify('Button placed on scenario!');
  }, [isPlacingButton, currentScene, recordHistorySnapshot, pendingButtonType, handleUpdateCurrentScene, notify]);

  const handleRemoveHotspot = useCallback((id: string) => {
    if (!currentScene?.hotspots) return;
    recordHistorySnapshot();
    handleUpdateCurrentScene('hotspots', currentScene.hotspots.filter((h) => h.id !== id));
  }, [currentScene?.hotspots, recordHistorySnapshot, handleUpdateCurrentScene]);

  const handleHotspotPointerDown = useCallback((_e: React.PointerEvent, hs: VNHotspot) => {
    setEditingHotspotId(hs.id);
    setShowHotspotStudio(true);
    playSfx('/assets/sfx/click interface.mp3', true, 0.3);
  }, []);

  // Atajos de Teclado Globales (Keyboard Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        (activeEl as HTMLElement)?.isContentEditable;

      const isAnyModalOpen =
        Boolean(activeGlobalModal) ||
        showCharacterPicker ||
        showAddActionModal ||
        Boolean(assetPickerConfig) ||
        showHotspotStudio ||
        showSceneAudioModal;

      if (e.key === 'Escape') {
        if (assetPickerConfig) {
          e.preventDefault();
          setAssetPickerConfig(null);
          return;
        }
        if (showAddActionModal) {
          e.preventDefault();
          setShowAddActionModal(false);
          return;
        }
        if (showCharacterPicker) {
          e.preventDefault();
          setShowCharacterPicker(false);
          return;
        }
        if (showSceneAudioModal) {
          e.preventDefault();
          setShowSceneAudioModal(false);
          return;
        }
        if (showHotspotStudio) {
          e.preventDefault();
          setShowHotspotStudio(false);
          setEditingHotspotId(null);
          return;
        }
        if (activeGlobalModal) {
          e.preventDefault();
          setActiveGlobalModal(null);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isTyping && !isAnyModalOpen) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isTyping && !isAnyModalOpen) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      // Atajos de Timeline / Editor: Activos solo cuando NO se está escribiendo y NO hay ningún modal abierto
      if (!isTyping && !isAnyModalOpen) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicateLine(selectedLineIndex);
          return;
        }

        if (e.key === 'Delete') {
          e.preventDefault();
          handleDeleteLine(selectedLineIndex);
          return;
        }

        if (e.key === ' ' || e.key.toLowerCase() === 'p') {
          e.preventDefault();
          playCurrentLinePreview();
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          handlePrevLine();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleNextLine();
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleInsertEvent('dialogue');
          return;
        }

        if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setActiveGlobalModal('scene_map');
          return;
        }
      } else if (!isTyping && activeGlobalModal === 'scene_map' && (e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Cerrar mapa de escenas con la misma tecla 'M'
        e.preventDefault();
        setActiveGlobalModal(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeGlobalModal,
    showCharacterPicker,
    showAddActionModal,
    assetPickerConfig,
    showHotspotStudio,
    showSceneAudioModal,
    handleManualSave,
    handleUndo,
    handleRedo,
    handleDuplicateLine,
    handleDeleteLine,
    playCurrentLinePreview,
    handlePrevLine,
    handleNextLine,
    handleInsertEvent,
    selectedLineIndex,
  ]);

  const handleExport = () => {
    exportStoryToJson(story);
    playSfx('/assets/sfx/click interface.mp3', true, 0.4);
  };

  const handleReset = () => {
    if (confirm('Reset to original sample project?')) {
      const def = resetToSampleStory();
      setStory(def);
      setSelectedChapterId(def.chapters[0]?.id || '');
      setSelectedSceneId(def.chapters[0]?.scenes[0]?.id || '');
      setSelectedLineIndex(0);
      notify('Reset to original');
    }
  };

  // Mapeo reactivo de bifurcaciones narrativas
  const incomingJumpsByEventId: Record<string, { choiceIndex: number; optionLabel: string }[]> = {};
  const incomingJumpsByIndex: Record<number, { choiceIndex: number; optionLabel: string }[]> = {};

  currentScene?.timeline?.forEach((ev, choiceIdx) => {
    if (ev.type === 'choice' && ev.options) {
      ev.options.forEach((opt) => {
        if (opt.targetEventId) {
          if (!incomingJumpsByEventId[opt.targetEventId]) incomingJumpsByEventId[opt.targetEventId] = [];
          incomingJumpsByEventId[opt.targetEventId].push({ choiceIndex: choiceIdx, optionLabel: opt.label });
        } else if (typeof opt.jumpToEventIndex === 'number') {
          if (!incomingJumpsByIndex[opt.jumpToEventIndex]) incomingJumpsByIndex[opt.jumpToEventIndex] = [];
          incomingJumpsByIndex[opt.jumpToEventIndex].push({ choiceIndex: choiceIdx, optionLabel: opt.label });
        }
      });
    }
  });

  const actions: VNMakerActionsType = useMemo(() => ({
    setStory,
    handleSelectTheme,
    setCurrentWorkspace,
    setProjectSettingsTab,
    setSelectedChapterId,
    setSelectedSceneId,
    setSelectedLineIndex,
    playCurrentLinePreview,
    setShowCanvasTextbox,
    setIsPlacingButton,
    setPendingButtonType,
    setShowHotspotStudio,
    setEditingHotspotId,
    handleCanvasClick,
    handleHotspotPointerDown,
    handleRemoveHotspot,
    setTimelineFilter,
    setDraggedTimelineItem,
    setDraggedTimelineIndex,
    setDragOverTimelineIndex,
    setDragOverSceneTabId,
    setDraggedSceneIndex,
    setDragOverSceneIndex,
    handleDragCancel,
    handleMoveSceneTab,
    handleUndo,
    handleRedo,
    recordHistorySnapshot,
    setActiveGlobalModal: handleSetActiveGlobalModal,
    setShowCharacterPicker,
    setShowAddActionModal,
    setShowSceneAudioModal,
    setShowHelpGuide,
    setIsFullscreenWorkspace,
    toggleFullscreenWorkspace,
    setAssetPickerConfig,
    openAssetPicker,
    notify,
    getDisplayAssetName,
    handleManualSave,
    handleExport,
    handleReset,
    handleOpenFileFromPC,
    handleSaveAsFromPC,
    dismissSafetyAlert,
    handleUpdateCurrentLine,
    handlePatchCurrentLine,
    handleDeleteCurrentLine,
    handlePrevLine,
    handleNextLine,
    handleInsertEvent,
    handleMoveLine,
    handleDuplicateLine,
    handleDeleteLine,
    handleMoveLineToScene,
    handleMoveLineBetweenScenes,
    handleSelectScene,
    handleAddScene,
    handleDuplicateScene,
    handleDeleteScene,
    handleUpdateCurrentScene,
    handlePatchCurrentScene,
    handleUploadBackground,
    handleApplyBackgroundToCurrentScene,
    handleUpdateCharacter,
    handleApplyScaleToAllDialogues,
    handleUpdateStoryCustomAssets,
  }), [
    handleSelectTheme,
    setCurrentWorkspace,
    setProjectSettingsTab,
    setSelectedChapterId,
    setSelectedSceneId,
    setSelectedLineIndex,
    playCurrentLinePreview,
    setShowCanvasTextbox,
    setIsPlacingButton,
    setPendingButtonType,
    setShowHotspotStudio,
    setEditingHotspotId,
    handleCanvasClick,
    handleHotspotPointerDown,
    handleRemoveHotspot,
    setTimelineFilter,
    setDraggedTimelineItem,
    setDraggedTimelineIndex,
    setDragOverTimelineIndex,
    setDragOverSceneTabId,
    setDraggedSceneIndex,
    setDragOverSceneIndex,
    handleDragCancel,
    handleMoveSceneTab,
    handleUndo,
    handleRedo,
    recordHistorySnapshot,
    setActiveGlobalModal,
    setShowCharacterPicker,
    setShowAddActionModal,
    setShowSceneAudioModal,
    setShowHelpGuide,
    setIsFullscreenWorkspace,
    toggleFullscreenWorkspace,
    setAssetPickerConfig,
    openAssetPicker,
    notify,
    getDisplayAssetName,
    handleManualSave,
    handleExport,
    handleReset,
    handleOpenFileFromPC,
    handleSaveAsFromPC,
    dismissSafetyAlert,
    handleUpdateCurrentLine,
    handlePatchCurrentLine,
    handleDeleteCurrentLine,
    handlePrevLine,
    handleNextLine,
    handleInsertEvent,
    handleMoveLine,
    handleDuplicateLine,
    handleDeleteLine,
    handleMoveLineToScene,
    handleMoveLineBetweenScenes,
    handleSelectScene,
    handleAddScene,
    handleDuplicateScene,
    handleDeleteScene,
    handleUpdateCurrentScene,
    handlePatchCurrentScene,
    handleUploadBackground,
    handleApplyBackgroundToCurrentScene,
    handleUpdateCharacter,
    handleApplyScaleToAllDialogues,
    handleUpdateStoryCustomAssets,
  ]);

  const state: VNMakerStateType = useMemo(() => ({
    story,
    editorTheme,
    currentWorkspace,
    projectSettingsTab,
    selectedChapterId,
    selectedSceneId,
    selectedLineIndex,
    currentChapter,
    currentScene,
    currentLine,
    currentSpeaker,
    currentSpeakerAvatar,
    activeBorderColor,
    activeBgColor,
    activeNameplateColor,
    activeTextColor,
    activeFontSize,
    canvasRef,
    previewShake,
    previewFlash,
    isPlayingPreview,
    animatedPreviewText,
    isTypingPreview,
    showCanvasTextbox,
    currentSelectedFx,
    isPlacingButton,
    pendingButtonType,
    showHotspotStudio,
    editingHotspotId,
    draggingHotspotId,
    timelineFilter,
    timelineFxStatus,
    incomingJumpsByEventId,
    incomingJumpsByIndex,
    draggedTimelineItem,
    draggedTimelineIndex,
    dragOverTimelineIndex,
    dragOverSceneTabId,
    draggedSceneIndex,
    dragOverSceneIndex,
    canUndo,
    canRedo,
    activeGlobalModal,
    showCharacterPicker,
    showAddActionModal,
    showSceneAudioModal,
    showHelpGuide,
    isFullscreenWorkspace,
    assetPickerConfig,
    feedbackMsg,
    linkedFileHandle,
    linkedFileName,
    fileSafetyAlert,
  }), [
    story,
    editorTheme,
    currentWorkspace,
    projectSettingsTab,
    selectedChapterId,
    selectedSceneId,
    selectedLineIndex,
    currentChapter,
    currentScene,
    currentLine,
    currentSpeaker,
    currentSpeakerAvatar,
    activeBorderColor,
    activeBgColor,
    activeNameplateColor,
    activeTextColor,
    activeFontSize,
    canvasRef,
    previewShake,
    previewFlash,
    isPlayingPreview,
    animatedPreviewText,
    isTypingPreview,
    showCanvasTextbox,
    currentSelectedFx,
    isPlacingButton,
    pendingButtonType,
    showHotspotStudio,
    editingHotspotId,
    draggingHotspotId,
    timelineFilter,
    timelineFxStatus,
    incomingJumpsByEventId,
    incomingJumpsByIndex,
    draggedTimelineItem,
    draggedTimelineIndex,
    dragOverTimelineIndex,
    dragOverSceneTabId,
    draggedSceneIndex,
    dragOverSceneIndex,
    canUndo,
    canRedo,
    activeGlobalModal,
    showCharacterPicker,
    showAddActionModal,
    showSceneAudioModal,
    showHelpGuide,
    isFullscreenWorkspace,
    assetPickerConfig,
    feedbackMsg,
    linkedFileHandle,
    linkedFileName,
    fileSafetyAlert,
  ]);

  return useMemo<VNMakerContextType>(() => ({
    ...state,
    ...actions,
  }), [state, actions]);
}
