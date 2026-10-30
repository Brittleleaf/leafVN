'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  VNStory,
  VNChapter,
  VNScene,
  VNEvent,
  VNGameState,
  VNHotspot,
  VNSaveSlot,
  VNChoiceOption,
  VNChoiceReaction,
  VNPosition,
  VNScreenFxType,
  VNCursorType,
  VNCharacter,
  VNChapterScreenConfig,
  VNStaticScreenConfig,
} from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { getSaveSlots, saveGameStateToSlot, deleteSaveSlot } from '@/lib/vn/storage';
import { evaluateCondition, applyVariableMutation, getCharacterAvatar, interpolateText } from '@/lib/vn/engineUtils';
import { DEFAULT_CHAPTER_INTRO_CONFIG, DEFAULT_CHAPTER_END_CONFIG } from '@/components/vn/StaticScreenView';

export interface UseVNPlayerProps {
  story: VNStory;
  initialSaveState?: VNGameState;
  onExit?: () => void;
}

// Helper para identificar escenarios estáticos aislados (Pantallas de Muerte / Menús / Portadas)
// que NUNCA deben ejecutarse automáticamente por avance secuencial de lectura
export function isIsolatedStaticScene(sc?: VNScene): boolean {
  if (!sc) return false;
  if (sc.sceneType === 'event' && sc.eventSubtype === 'static') {
    const purpose = sc.staticScreenConfig?.purpose;
    if (purpose && ['death', 'ending', 'intro', 'title', 'load_game', 'settings', 'gallery'].includes(purpose)) {
      return true;
    }
  }
  return false;
}

// Obtener el primer escenario narrativo jugable de un capítulo de forma segura
export function getChapterInitialSceneId(chap?: VNChapter): string {
  if (!chap || !chap.scenes || chap.scenes.length === 0) return '';
  if (chap.startSceneId && chap.scenes.some((s) => s.id === chap.startSceneId)) {
    return chap.startSceneId;
  }
  const narrativeScene = chap.scenes.find((s) => !isIsolatedStaticScene(s));
  return narrativeScene ? narrativeScene.id : (chap.scenes[0]?.id || '');
}

export function useVNPlayer({ story, initialSaveState, onExit }: UseVNPlayerProps) {
  // Inicialización de variables desde la historia
  const getInitialVariables = useCallback(() => {
    if (initialSaveState?.variablesState) return initialSaveState.variablesState;
    const initial: Record<string, boolean | string | number> = {};
    story.variables?.forEach((v) => {
      initial[v.key] = v.defaultValue;
    });
    return initial;
  }, [initialSaveState, story.variables]);

  // Estado de juego
  const [currentChapterId, setCurrentChapterId] = useState<string>(
    initialSaveState?.currentChapterId || story.chapters[0]?.id || ''
  );
  const [currentSceneId, setCurrentSceneId] = useState<string>(
    initialSaveState?.currentSceneId ||
    (story.menuSystemConfig?.enabled
      ? (story.menuSystemConfig.introSceneId || story.menuSystemConfig.mainMenuSceneId || getChapterInitialSceneId(story.chapters[0]))
      : getChapterInitialSceneId(story.chapters[0]))
  );
  const [eventIndex, setEventIndex] = useState<number>(initialSaveState?.eventIndex || 0);
  const [variablesState, setVariablesState] = useState<Record<string, boolean | string | number>>(
    getInitialVariables()
  );
  const [history, setHistory] = useState<{ speaker: string; speakerColor: string; text: string }[]>(
    (initialSaveState?.history || []).slice(-250)
  );
  const [isHotspotMode, setIsHotspotMode] = useState<boolean>(
    initialSaveState?.isHotspotMode || false
  );
  const [isStoryCompleted, setIsStoryCompleted] = useState<boolean>(false);
  const [pendingReaction, setPendingReaction] = useState<{
    reaction: VNChoiceReaction;
    onComplete: () => void;
  } | null>(null);

  // Aislamiento inteligente de ramas de elección
  const [activeChoiceBranch, setActiveChoiceBranch] = useState<{
    choiceEventId: string;
    chosenOptionId: string;
    unchosenTargetEventIds: Set<string>;
    unchosenTargetIndices: Set<number>;
    rejoinIndex: number;
    rejoinEventId?: string;
  } | null>(null);

  // Estados visuales y de control
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [autoMode, setAutoMode] = useState<boolean>(false);
  const [skipMode, setSkipMode] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showSaveLoadModal, setShowSaveLoadModal] = useState<'save' | 'load' | null>(null);
  const [showVariablesHud, setShowVariablesHud] = useState<boolean>(false);
  const [saveSlots, setSaveSlots] = useState<VNSaveSlot[]>([]);
  const [consumedHotspots, setConsumedHotspots] = useState<string[]>([]);
  const [onStageCharacters, setOnStageCharacters] = useState<Record<string, { position: VNPosition; emotion?: string }>>({});
  const [customSceneBg, setCustomSceneBg] = useState<string | null>(null);
  const [inspectionBanner, setInspectionBanner] = useState<{ title: string; text: string } | null>(null);
  const [activeInspection, setActiveInspection] = useState<{
    speaker: string;
    speakerColor: string;
    badge?: string;
    text: string;
    characterId?: string;
    avatarUrl?: string;
  } | null>(null);
  const [isTextBoxVisible, setIsTextBoxVisible] = useState<boolean>(true);
  const [persistentCursor, setPersistentCursor] = useState<VNCursorType>('default');
  const [temporaryCursor, setTemporaryCursor] = useState<VNCursorType | null>(null);
  const isRestoringSaveRef = useRef<boolean>(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Pantallas de carga / intermisiones
  const [loadingScreen, setLoadingScreen] = useState<{
    active: boolean;
    title: string;
    subtitle?: string;
    loreTip?: string;
    bgUrl?: string;
  } | null>(null);

  // Pantallas de Episodio: Intro (Inicio) y End (Fin de Episodio)
  const [activeEpisodeScreen, setActiveEpisodeScreen] = useState<{
    type: 'intro' | 'end';
    chapterId: string;
    scene: VNScene;
  } | null>(null);

  const seenChapterIntrosRef = useRef<Set<string>>(new Set());

  // Efectos de cámara y Pantalla
  const [shakeClass, setShakeClass] = useState<string>('');
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [isFlashlightShutdownActive, setIsFlashlightShutdownActive] = useState<boolean>(false);
  const [activeScreenFx, setActiveScreenFx] = useState<{
    pairId?: string;
    fxType: VNScreenFxType;
    intensity?: 'light' | 'medium' | 'heavy';
    color?: string;
    animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
    customWords?: string[];
    flashlightMode?: 'normal' | 'broken';
    flashlightRadius?: number;
    flashlightShutdown?: boolean;
    flashlightHitsRequired?: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
    isFadingOut?: boolean;
    sfxUrl?: string;
    params?: Record<string, any>;
  } | null>(null);

  // Referencias para timers y audio
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipModeRef = useRef(skipMode);
  skipModeRef.current = skipMode;
  const autoModeRef = useRef(autoMode);
  autoModeRef.current = autoMode;
  const historyBottomRef = useRef<HTMLDivElement>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const fxLoopAudioRef = useRef<HTMLAudioElement | null>(null);
  const fxFadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fxFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingScreenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSelectChoiceRef = useRef<(opt: VNChoiceOption) => void>(() => {});
  const lastBlipTimeRef = useRef<number>(0);

  // Guardado de última posición de gameplay seguro
  const lastGameplayLocationRef = useRef<{
    chapterId: string;
    sceneId: string;
    eventIndex: number;
    variablesState: Record<string, any>;
  } | null>(null);

  // Resolver escenarios entre cualquier capítulo o biblioteca global
  const resolveScene = useCallback(
    (targetSceneId: string): { scene?: VNScene; chapter?: VNChapter } => {
      for (const ch of story.chapters) {
        const sc = ch.scenes.find((s) => s.id === targetSceneId);
        if (sc) return { scene: sc, chapter: ch };
      }
      const globalSc = (story.scenarios || []).find((s) => s.id === targetSceneId);
      if (globalSc) return { scene: globalSc, chapter: story.chapters[0] };
      return {};
    },
    [story.chapters, story.scenarios]
  );

  // Salto inteligente a escenario con validación contra escenas inexistentes e índices fuera de rango
  const jumpToScene = useCallback(
    (targetSceneId: string, targetLineIdx: number = 0): boolean => {
      if (!targetSceneId) return false;
      const found = resolveScene(targetSceneId);
      if (!found.scene) {
        console.warn(`[VNPlayer] Jump aborted: Scene ID "${targetSceneId}" not found in chapters or scenarios.`);
        return false;
      }
      if (found.chapter && found.chapter.id !== currentChapterId) {
        setCurrentChapterId(found.chapter.id);
      }
      const timelineLen = found.scene.timeline?.length || 0;
      setCurrentSceneId(found.scene.id);
      if (timelineLen === 0) {
        setEventIndex(0);
        if (found.scene.enableHotspots && found.scene.hotspots && found.scene.hotspots.length > 0) {
          setIsHotspotMode(true);
          setIsTextBoxVisible(false);
          setDisplayedText('');
        } else {
          setIsHotspotMode(false);
          setIsTextBoxVisible(true);
        }
      } else {
        const safeLineIdx = Math.max(0, Math.min(targetLineIdx, timelineLen - 1));
        setEventIndex(safeLineIdx);
        setIsHotspotMode(false);
        setIsTextBoxVisible(true);
      }
      setActiveChoiceBranch(null);
      return true;
    },
    [resolveScene, currentChapterId]
  );

  // Entidades activas computadas
  const resolved = useMemo(() => {
    if (currentSceneId) {
      const res = resolveScene(currentSceneId);
      if (res.scene) return { chapter: res.chapter || story.chapters[0], scene: res.scene };
    }
    const fallbackChapter = story.chapters.find((c) => c.id === currentChapterId) || story.chapters[0];
    const fallbackScene = fallbackChapter?.scenes.find((s) => s.id === currentSceneId) || fallbackChapter?.scenes[0];
    return { chapter: fallbackChapter, scene: fallbackScene };
  }, [resolveScene, currentSceneId, currentChapterId, story.chapters]);

  const currentChapter: VNChapter | undefined = resolved.chapter;
  const currentScene: VNScene | undefined = resolved.scene;
  const currentEvent: VNEvent | undefined = currentScene?.timeline[eventIndex];

  // Constructor / Resolutor de escenarios de Pantalla de Episodio (Intro / Fin)
  const resolveEpisodeScene = useCallback(
    (type: 'intro' | 'end', chapter: VNChapter, screenConfig?: VNChapterScreenConfig): VNScene => {
      const isIntro = type === 'intro';
      const defaultStatic = isIntro ? DEFAULT_CHAPTER_INTRO_CONFIG : DEFAULT_CHAPTER_END_CONFIG;

      // 1. Si apunta a un escenario existente del proyecto:
      if (screenConfig?.sceneId) {
        const found =
          (story.scenarios || []).find((s) => s.id === screenConfig.sceneId) ||
          chapter.scenes.find((s) => s.id === screenConfig.sceneId);
        if (found) return found;
      }

      // 2. Usar configuración estática personalizada o plantilla por defecto
      const baseConfig = screenConfig?.staticConfig || defaultStatic;
      const config: VNStaticScreenConfig = {
        ...baseConfig,
        title:
          baseConfig.title ||
          (isIntro
            ? chapter.title
              ? `EPISODE: ${chapter.title.toUpperCase()}`
              : `EPISODE #${chapter.number}`
            : `END OF EPISODE #${chapter.number}`),
        subtitle:
          baseConfig.subtitle ||
          (isIntro
            ? chapter.summary || 'Prepare to enter the scenario.'
            : 'Episode completed successfully.'),
      };

      return {
        id: `ep-${type}-${chapter.id}`,
        name: config.title || (isIntro ? 'Episode Intro' : 'Episode End'),
        backgroundUrl: screenConfig?.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
        sceneType: 'event',
        eventSubtype: 'static',
        staticScreenConfig: config,
        timeline: [],
      };
    },
    [story.scenarios]
  );

  // Ejecutor de Pantalla de Carga
  const triggerLoadingScreen = useCallback(
    (chapter: VNChapter, onComplete: () => void) => {
      if (chapter.loadingScreen?.enabled) {
        setLoadingScreen({
          active: true,
          title: chapter.loadingScreen.title || chapter.title,
          subtitle: chapter.loadingScreen.subtitle,
          loreTip: chapter.loadingScreen.loreTip,
          bgUrl: chapter.loadingScreen.bgImageUrl,
        });

        if (loadingScreenTimerRef.current) clearTimeout(loadingScreenTimerRef.current);
        loadingScreenTimerRef.current = setTimeout(() => {
          setLoadingScreen(null);
          loadingScreenTimerRef.current = null;
          onComplete();
        }, chapter.loadingScreen.durationMs || 2500);
      } else {
        onComplete();
      }
    },
    []
  );

  // Inicializador de capítulo con soporte para Pantalla de Inicio (Intro) y Carga
  const startChapter = useCallback(
    (chapter: VNChapter) => {
      if (!chapter) return;
      setCurrentChapterId(chapter.id);

      // Si el capítulo tiene Pantalla de Inicio habilitada y no ha sido vista en esta sesión:
      if (chapter.introScreen?.enabled && !seenChapterIntrosRef.current.has(chapter.id)) {
        seenChapterIntrosRef.current.add(chapter.id);
        const introScene = resolveEpisodeScene('intro', chapter, chapter.introScreen);
        setActiveEpisodeScreen({
          type: 'intro',
          chapterId: chapter.id,
          scene: introScene,
        });
        return;
      }

      // Si no tiene intro o ya se vio, ejecutar pantalla de carga si está activa y saltar al primer escenario
      const targetSceneId = getChapterInitialSceneId(chapter);
      triggerLoadingScreen(chapter, () => {
        if (targetSceneId) {
          jumpToScene(targetSceneId, 0);
        }
      });
    },
    [resolveEpisodeScene, triggerLoadingScreen, jumpToScene]
  );

  // Continuar desde Pantalla de Episodio (Intro -> Escenario | End -> Siguiente Capítulo)
  const handleEpisodeScreenContinue = useCallback(() => {
    if (!activeEpisodeScreen) return;
    const { type, chapterId } = activeEpisodeScreen;
    const ch = story.chapters.find((c) => c.id === chapterId) || currentChapter;
    setActiveEpisodeScreen(null);

    if (type === 'intro') {
      if (ch) {
        const targetSceneId = getChapterInitialSceneId(ch);
        triggerLoadingScreen(ch, () => {
          if (targetSceneId) {
            jumpToScene(targetSceneId, 0);
          }
        });
      }
    } else if (type === 'end') {
      const chapIdx = story.chapters.findIndex((c) => c.id === chapterId);
      if (chapIdx !== -1 && chapIdx + 1 < story.chapters.length) {
        const nextChap = story.chapters[chapIdx + 1];
        startChapter(nextChap);
      } else {
        setIsStoryCompleted(true);
        setSkipMode(false);
        setIsTextBoxVisible(false);
        playSfx('/assets/sfx/success.mp3', false, 0.7);
      }
    }
  }, [activeEpisodeScreen, story.chapters, currentChapter, triggerLoadingScreen, jumpToScene, startChapter]);

  // Reintentar / Repetir episodio actual desde pantalla de fin
  const handleEpisodeScreenRetry = useCallback(() => {
    if (!activeEpisodeScreen) return;
    const { chapterId } = activeEpisodeScreen;
    setActiveEpisodeScreen(null);
    const ch = story.chapters.find((c) => c.id === chapterId) || currentChapter;
    if (ch) {
      seenChapterIntrosRef.current.delete(ch.id);
      startChapter(ch);
    }
  }, [activeEpisodeScreen, story.chapters, currentChapter, startChapter]);

  // Avance secuencial de escenarios entre capítulos o final de historia
  const advanceToNextScene = useCallback(() => {
    if (activeEpisodeScreen) {
      handleEpisodeScreenContinue();
      return;
    }

    const sceneIdx = currentChapter?.scenes?.findIndex((s) => s.id === currentSceneId) ?? -1;

    // Buscar el siguiente escenario NARRATIVO jugable dentro del capítulo actual
    // (omitiendo automáticamente pantallas de muerte, menús o pantallas estáticas aisladas)
    let nextNarrativeScene: VNScene | null = null;
    if (currentChapter && sceneIdx !== -1) {
      for (let i = sceneIdx + 1; i < currentChapter.scenes.length; i++) {
        const candidate = currentChapter.scenes[i];
        if (!isIsolatedStaticScene(candidate)) {
          nextNarrativeScene = candidate;
          break;
        }
      }
    }

    if (nextNarrativeScene) {
      jumpToScene(nextNarrativeScene.id, 0);
      return;
    }

    // No hay más escenarios narrativos en este capítulo: Fin del Capítulo / Episodio
    if (currentChapter?.endScreen?.enabled) {
      const endScene = resolveEpisodeScene('end', currentChapter, currentChapter.endScreen);
      setActiveEpisodeScreen({
        type: 'end',
        chapterId: currentChapter.id,
        scene: endScene,
      });
      playSfx('/assets/sfx/success.mp3', false, 0.6);
      return;
    }

    // Si no hay endScreen habilitado, avanzar al siguiente capítulo
    const chapIdx = story.chapters.findIndex((c) => c.id === currentChapterId);
    if (chapIdx !== -1 && chapIdx + 1 < story.chapters.length) {
      const nextChap = story.chapters[chapIdx + 1];
      startChapter(nextChap);
    } else {
      setIsStoryCompleted(true);
      setSkipMode(false);
      setIsTextBoxVisible(false);
      playSfx('/assets/sfx/success.mp3', false, 0.7);
    }
  }, [
    activeEpisodeScreen,
    currentChapter,
    currentSceneId,
    currentChapterId,
    story.chapters,
    jumpToScene,
    resolveEpisodeScene,
    handleEpisodeScreenContinue,
    startChapter,
  ]);

  // Registrar último punto de guardado
  useEffect(() => {
    if (!currentScene || !currentChapter) return;
    const isSpecialEventScreen =
      currentScene.sceneType === 'event' &&
      currentScene.eventSubtype === 'static' &&
      (currentScene.staticScreenConfig?.purpose === 'death' ||
        currentScene.staticScreenConfig?.purpose === 'ending');

    if (!isSpecialEventScreen) {
      lastGameplayLocationRef.current = {
        chapterId: currentChapter.id,
        sceneId: currentScene.id,
        eventIndex: eventIndex,
        variablesState: { ...variablesState },
      };
    }
  }, [currentScene, currentChapter, eventIndex, variablesState]);

  // Manejador del botón RETRY de pantalla estática
  const handleRetryPrevious = () => {
    playSfx('/assets/sfx/start after click intro.mp3', false, 0.7);
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    setShakeClass('');
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setFlashColor(null);
    if (loadingScreenTimerRef.current) {
      clearTimeout(loadingScreenTimerRef.current);
      loadingScreenTimerRef.current = null;
    }
    setLoadingScreen(null);
    setActiveEpisodeScreen(null);

    if (lastGameplayLocationRef.current) {
      const { chapterId, sceneId, eventIndex: prevIdx, variablesState: savedVars } = lastGameplayLocationRef.current;
      const targetScene = resolveScene(sceneId).scene;
      if (!targetScene) {
        advanceToNextScene();
        return;
      }

      if (savedVars) setVariablesState(savedVars);
      if (chapterId && chapterId !== currentChapterId) setCurrentChapterId(chapterId);

      const isSameScene = sceneId === currentSceneId;
      if (isSameScene) {
        playSceneBgm(targetScene, prevIdx);
        if (prevIdx === eventIndex) {
          const ev = targetScene.timeline?.[prevIdx];
          if (ev?.text) {
            setDisplayedText(interpolateText(ev.text, savedVars || variablesState));
            setIsTyping(false);
          }
        }
      }

      setCurrentSceneId(sceneId);
      setEventIndex(prevIdx);
      setIsHotspotMode(false);
      setIsTextBoxVisible(true);
      setActiveChoiceBranch(null);
    } else {
      advanceToNextScene();
    }
  };

  // Identificar el hablante actual
  const activeReaction = pendingReaction?.reaction;
  const currentSpeaker: VNCharacter | undefined = activeReaction
    ? story.characters.find((c) => c.id === activeReaction.characterId)
    : story.characters.find((c) => c.id === currentEvent?.characterId);

  // Reproducción inteligente de BGM por escena, evento de timeline o guardado previo
  const playSceneBgm = useCallback((targetScene?: VNScene, targetIndex: number = 0, explicitUrl?: string | null, explicitVol?: number) => {
    if (!targetScene) return;
    const isSpecialEventScene = targetScene.sceneType === 'event';
    if (isSpecialEventScene) {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
      return;
    }

    let urlToPlay: string | undefined = explicitUrl || undefined;
    let volToPlay = explicitVol ?? 0.5;

    if (!urlToPlay && targetScene.timeline) {
      for (let i = targetIndex; i >= 0; i--) {
        const ev = targetScene.timeline[i];
        if (ev && ev.type === 'bgm' && ev.audioUrl) {
          urlToPlay = ev.audioUrl;
          volToPlay = ev.audioVolume ?? 0.5;
          break;
        }
      }
    }

    if (!urlToPlay) {
      urlToPlay = targetScene.bgmUrl;
    }

    if (urlToPlay) {
      const isAlreadyPlaying =
        bgmAudioRef.current &&
        !bgmAudioRef.current.paused &&
        (decodeURIComponent(bgmAudioRef.current.src).includes(decodeURIComponent(urlToPlay)) ||
          bgmAudioRef.current.src.endsWith(urlToPlay));

      if (isAlreadyPlaying && bgmAudioRef.current) {
        bgmAudioRef.current.volume = volToPlay;
        return;
      }
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
      try {
        const audio = new Audio(urlToPlay);
        audio.loop = true;
        audio.volume = volToPlay;
        audio.play().catch(() => {});
        bgmAudioRef.current = audio;
      } catch {}
    } else {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    }
  }, []);

  // Audio al entrar a la escena y BGM
  useEffect(() => {
    if (isRestoringSaveRef.current) {
      isRestoringSaveRef.current = false;
    } else {
      setCustomSceneBg(null);
      setOnStageCharacters({});
      setInspectionBanner(null);
      setActiveInspection(null);
      setActiveScreenFx(null);
      setIsFlashlightShutdownActive(false);

      if (currentScene?.cursorType) {
        setPersistentCursor(currentScene.cursorType);
      } else {
        setPersistentCursor('default');
      }
      setTemporaryCursor(null);

      if (currentScene?.entrySfxUrl) {
        playSfx(currentScene.entrySfxUrl, false, 0.7);
      }
    }

    playSceneBgm(currentScene, eventIndex);

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      if (bgmAudioRef.current) {
        try {
          bgmAudioRef.current.pause();
          bgmAudioRef.current.removeAttribute('src');
          bgmAudioRef.current.load();
        } catch {}
        bgmAudioRef.current = null;
      }
      if (fxLoopAudioRef.current) {
        try {
          fxLoopAudioRef.current.pause();
          fxLoopAudioRef.current.removeAttribute('src');
          fxLoopAudioRef.current.load();
        } catch {}
        fxLoopAudioRef.current = null;
      }
      if (fxFadeOutTimerRef.current) {
        clearTimeout(fxFadeOutTimerRef.current);
        fxFadeOutTimerRef.current = null;
      }
      if (fxFadeIntervalRef.current) {
        clearInterval(fxFadeIntervalRef.current);
        fxFadeIntervalRef.current = null;
      }
      if (shakeTimerRef.current) {
        clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = null;
      }
      setShakeClass('');
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
      setFlashColor(null);
      if (loadingScreenTimerRef.current) {
        clearTimeout(loadingScreenTimerRef.current);
        loadingScreenTimerRef.current = null;
      }
      setLoadingScreen(null);
      setActiveScreenFx(null);
    };
  }, [currentSceneId, playSceneBgm]);

  // Recargar ranuras al abrir modal
  useEffect(() => {
    if (showSaveLoadModal) {
      setSaveSlots(getSaveSlots(story.id));
    }
  }, [showSaveLoadModal, story.id]);

  // Auto-scroll en el historial
  useEffect(() => {
    if (showHistoryModal) {
      setTimeout(() => historyBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [showHistoryModal]);

  // Escuchar avisos de cuota de almacenamiento sin alertas bloqueantes
  useEffect(() => {
    const handleQuotaWarning = () => {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
    };
    window.addEventListener('vn:storage_quota_warning', handleQuotaWarning);
    return () => window.removeEventListener('vn:storage_quota_warning', handleQuotaWarning);
  }, []);

  // Pantalla de Inicio de Episodio / Pantalla de Carga al arrancar o cambiar capítulo
  useEffect(() => {
    if (isRestoringSaveRef.current) return;
    if (!currentChapter) return;

    if (
      currentChapter.introScreen?.enabled &&
      !seenChapterIntrosRef.current.has(currentChapter.id) &&
      eventIndex === 0 &&
      !activeEpisodeScreen
    ) {
      seenChapterIntrosRef.current.add(currentChapter.id);
      const introScene = resolveEpisodeScene('intro', currentChapter, currentChapter.introScreen);
      setActiveEpisodeScreen({
        type: 'intro',
        chapterId: currentChapter.id,
        scene: introScene,
      });
      return;
    }

    if (currentChapter.loadingScreen?.enabled && eventIndex === 0 && !activeEpisodeScreen) {
      setLoadingScreen({
        active: true,
        title: currentChapter.loadingScreen.title || currentChapter.title,
        subtitle: currentChapter.loadingScreen.subtitle,
        loreTip: currentChapter.loadingScreen.loreTip,
        bgUrl: currentChapter.loadingScreen.bgImageUrl,
      });

      if (loadingScreenTimerRef.current) clearTimeout(loadingScreenTimerRef.current);
      loadingScreenTimerRef.current = setTimeout(() => {
        setLoadingScreen(null);
        loadingScreenTimerRef.current = null;
      }, currentChapter.loadingScreen.durationMs || 2500);
    }
  }, [currentChapterId]);

  const advanceEventRef = useRef<() => void>(() => {});

  // Avanzar al siguiente evento
  const advanceEvent = useCallback(() => {
    if (isStoryCompleted) return;
    if (isFlashlightShutdownActive) return;

    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
      setShakeClass('');
    }
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
      setFlashColor(null);
    }
    if (loadingScreenTimerRef.current) {
      clearTimeout(loadingScreenTimerRef.current);
      loadingScreenTimerRef.current = null;
      setLoadingScreen(null);
    }

    if (activeInspection) {
      if (isTyping) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setDisplayedText(activeInspection.text);
        setIsTyping(false);
        return;
      }
      setActiveInspection(null);
      setDisplayedText('');
      setIsTextBoxVisible(false);
      return;
    }

    if (pendingReaction) {
      if (isTyping) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setDisplayedText(interpolateText(pendingReaction.reaction.text, variablesState));
        setIsTyping(false);
        return;
      }
      const callback = pendingReaction.onComplete;
      setPendingReaction(null);
      callback();
      return;
    }

    if (!currentScene) return;

    if (currentScene.sceneType === 'event') {
      advanceToNextScene();
      return;
    }

    if (isTyping && currentEvent?.text) {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setDisplayedText(interpolateText(currentEvent.text, variablesState));
      setIsTyping(false);
      return;
    }

    if (currentEvent?.type === 'choice') {
      return;
    }

    if (currentEvent?.type === 'hotspot_mode' || isHotspotMode) {
      const availableHotspots = (currentScene.hotspots || []).filter(
        (hs) => !(hs.interactionLimit === 'once' && consumedHotspots.includes(hs.id))
      );
      if (availableHotspots.length > 0) {
        setIsTextBoxVisible(false);
        return;
      }
      setIsHotspotMode(false);
      setIsTextBoxVisible(true);
    }

    if (currentEvent?.targetSceneId) {
      const jumped = jumpToScene(currentEvent.targetSceneId, 0);
      if (jumped) return;
      console.warn(`[VNPlayer] Scene jump target "${currentEvent.targetSceneId}" not found. Advancing linearly.`);
    }

    if (currentEvent?.targetEventId) {
      const explicitTargetIdx = currentScene.timeline.findIndex((e) => e.id === currentEvent.targetEventId);
      if (explicitTargetIdx !== -1) {
        setEventIndex(explicitTargetIdx);
        setIsTextBoxVisible(true);
        setActiveChoiceBranch(null);
        return;
      }
    }

    let nextIndex = eventIndex + 1;

    if (activeChoiceBranch && nextIndex < currentScene.timeline.length) {
      const nextEv = currentScene.timeline[nextIndex];
      const isUnchosenBranch =
        activeChoiceBranch.unchosenTargetIndices.has(nextIndex) ||
        (nextEv && activeChoiceBranch.unchosenTargetEventIds.has(nextEv.id));

      if (isUnchosenBranch) {
        nextIndex = activeChoiceBranch.rejoinIndex;
        setActiveChoiceBranch(null);
      } else if (nextIndex >= activeChoiceBranch.rejoinIndex) {
        setActiveChoiceBranch(null);
      }
    }

    if (nextIndex < currentScene.timeline.length) {
      setEventIndex(nextIndex);
      setIsTextBoxVisible(true);
    } else {
      if (currentScene.enableHotspots && currentScene.hotspots && currentScene.hotspots.length > 0) {
        setIsHotspotMode(true);
        setIsTextBoxVisible(false);
        setDisplayedText('');
      } else {
        advanceToNextScene();
      }
    }
  }, [
    isStoryCompleted,
    isFlashlightShutdownActive,
    activeInspection,
    isTyping,
    variablesState,
    pendingReaction,
    currentScene,
    currentEvent,
    isHotspotMode,
    eventIndex,
    activeChoiceBranch,
    jumpToScene,
    advanceToNextScene,
  ]);

  useEffect(() => {
    advanceEventRef.current = advanceEvent;
  });

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement)?.isContentEditable)
      ) {
        return;
      }

      if (showHistoryModal || showSaveLoadModal || showVariablesHud) {
        if (e.key === 'Escape') {
          setShowHistoryModal(false);
          setShowSaveLoadModal(null);
          setShowVariablesHud(false);
        }
        return;
      }

      if (isFlashlightShutdownActive) return;

      // Selección rápida de opciones con teclas 1-9
      if (currentEvent?.type === 'choice' && currentEvent.options && !pendingReaction) {
        const allDisabled = currentEvent.options.every((opt) => !evaluateCondition(opt.condition, variablesState));
        if (allDisabled && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')) {
          e.preventDefault();
          handleSelectChoiceRef.current({
            id: 'auto-bypass',
            label: 'Continue',
            targetEventId: currentEvent.rejoinEventId,
          });
          return;
        }

        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= currentEvent.options.length) {
          const opt = currentEvent.options[num - 1];
          if (opt) {
            const canSelect = evaluateCondition(opt.condition, variablesState);
            if (canSelect) {
              e.preventDefault();
              handleSelectChoiceRef.current(opt);
              return;
            } else {
              e.preventDefault();
              playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
              return;
            }
          }
        }
      }

      // Atajo H para abrir/cerrar historial de diálogos
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowHistoryModal((prev) => !prev);
        return;
      }

      // Atajo V para abrir/cerrar visor de variables
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setShowVariablesHud((prev) => !prev);
        return;
      }

      // Atajo A para alternar avance automático
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setAutoMode((prev) => !prev);
        return;
      }

      // Atajo Tab para alternar modo salto
      if (e.key === 'Tab') {
        e.preventDefault();
        setSkipMode((prev) => !prev);
        return;
      }

      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        if (e.repeat) return;
        e.preventDefault();
        advanceEventRef.current();
      } else if (e.key === 'Escape') {
        if (onExit) onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHistoryModal, showSaveLoadModal, showVariablesHud, onExit, isFlashlightShutdownActive, currentEvent, pendingReaction, variablesState]);

  // Manejo de reacción
  const triggerReactionDialogue = (reaction: VNChoiceReaction, onComplete: () => void) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    setPendingReaction({ reaction, onComplete });
    if (reaction.sfx && !skipModeRef.current) {
      playSfx(reaction.sfx);
    }
    const fullText = interpolateText(reaction.text, variablesState);
    let charIndex = 0;
    setDisplayedText('');
    setIsTyping(true);

    const reactionChar = reaction.characterId
      ? story.characters.find((c) => c.id === reaction.characterId)
      : currentSpeaker;
    const speakerName = interpolateText(reaction.speakerName || reactionChar?.name || 'System', variablesState);
    const speakerCol = reactionChar?.textBoxConfig?.nameplateColor || reactionChar?.color || '#ef4444';
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speakerName && last.text === fullText) {
        return prev;
      }
      return [...prev.slice(-249), { speaker: speakerName, speakerColor: speakerCol, text: fullText }];
    });

    const speed = skipModeRef.current
      ? 5
      : reactionChar?.textBoxConfig?.typewriterSpeedMs || story.textBoxConfig.typewriterSpeedMs || 25;
    const blipSound = reactionChar?.blipSound || '/assets/sfx/click intro.mp3';
    const blipEnabled = reactionChar?.textBoxConfig?.soundBlipEnabled ?? story.textBoxConfig.soundBlipEnabled;

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    typingTimerRef.current = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));

      const now = Date.now();
      if (charIndex % 3 === 0 && blipEnabled && !skipModeRef.current && now - lastBlipTimeRef.current >= 45) {
        lastBlipTimeRef.current = now;
        playSfx(blipSound, false, 0.08);
      }

      if (charIndex >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setIsTyping(false);

        if (skipModeRef.current) {
          autoTimerRef.current = setTimeout(() => {
            advanceEventRef.current();
          }, 140);
        } else if (autoModeRef.current) {
          const autoDelay = story.textBoxConfig.autoSpeedMs || 2000;
          autoTimerRef.current = setTimeout(() => {
            advanceEventRef.current();
          }, autoDelay);
        }
      }
    }, speed);
  };

  // Procesamiento secuencial del timeline
  useEffect(() => {
    if (isStoryCompleted) return;
    if (pendingReaction) return;
    if (!currentEvent) return;

    if (currentEvent.condition && !evaluateCondition(currentEvent.condition, variablesState)) {
      setEventIndex((prev) => prev + 1);
      return;
    }

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    switch (currentEvent.type) {
      case 'dialogue': {
        setIsTextBoxVisible(true);
        setActiveInspection(null);

        if (currentEvent.cursorType) {
          if (currentEvent.cursorMode === 'persistent') {
            setPersistentCursor(currentEvent.cursorType);
            setTemporaryCursor(null);
          } else {
            setTemporaryCursor(currentEvent.cursorType);
          }
        } else {
          setTemporaryCursor(null);
        }

        const fullText = interpolateText(currentEvent.text || '', variablesState);
        const charSpeed = currentSpeaker?.textBoxConfig?.typewriterSpeedMs || story.textBoxConfig.typewriterSpeedMs || 25;
        const speed = skipModeRef.current ? 5 : charSpeed;
        const charBlip = currentSpeaker?.blipSound || '/assets/sfx/click intro.mp3';
        const blipEnabled = currentSpeaker?.textBoxConfig?.soundBlipEnabled ?? story.textBoxConfig.soundBlipEnabled;
        let charIndex = 0;
        setDisplayedText('');
        setIsTyping(true);

        if (currentEvent.sfx && !skipModeRef.current) {
          playSfx(currentEvent.sfx);
        }

        const speakerName = interpolateText(currentEvent.customSpeakerName || currentSpeaker?.name || 'Narrator', variablesState);
        const speakerCol = currentSpeaker?.textBoxConfig?.nameplateColor || currentSpeaker?.color || '#ef4444';
        setHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.speaker === speakerName && last.text === fullText) {
            return prev;
          }
          return [...prev.slice(-249), { speaker: speakerName, speakerColor: speakerCol, text: fullText }];
        });

        typingTimerRef.current = setInterval(() => {
          charIndex++;
          setDisplayedText(fullText.slice(0, charIndex));

          const now = Date.now();
          if (charIndex % 3 === 0 && blipEnabled && !skipModeRef.current && now - lastBlipTimeRef.current >= 45) {
            lastBlipTimeRef.current = now;
            playSfx(charBlip, false, 0.08);
          }

          if (charIndex >= fullText.length) {
            if (typingTimerRef.current) clearInterval(typingTimerRef.current);
            setIsTyping(false);

            if (skipModeRef.current) {
              autoTimerRef.current = setTimeout(() => {
                advanceEventRef.current();
              }, 140);
            } else if (autoModeRef.current) {
              const autoDelay = story.textBoxConfig.autoSpeedMs || 2000;
              autoTimerRef.current = setTimeout(() => {
                advanceEventRef.current();
              }, autoDelay);
            }
          }
        }, speed);
        break;
      }

      case 'conditional_branch': {
        const conditionMet = currentEvent.condition
          ? evaluateCondition(currentEvent.condition, variablesState)
          : true;
        if (conditionMet) {
          if (currentEvent.conditionalTargetSceneId) {
            const jumped = jumpToScene(currentEvent.conditionalTargetSceneId, 0);
            if (!jumped) {
              console.warn(`[VNPlayer] conditionalTargetSceneId "${currentEvent.conditionalTargetSceneId}" not found. Advancing to next event.`);
              advanceEventRef.current();
            }
          } else if (currentEvent.conditionalTargetEventId && currentScene) {
            const targetIdx = currentScene.timeline.findIndex((e) => e.id === currentEvent.conditionalTargetEventId);
            if (targetIdx !== -1 && targetIdx !== eventIndex) {
              setEventIndex(targetIdx);
              setActiveChoiceBranch(null);
            } else {
              advanceEventRef.current();
            }
          } else {
            advanceEventRef.current();
          }
        } else {
          if (currentEvent.elseTargetSceneId) {
            const jumped = jumpToScene(currentEvent.elseTargetSceneId, 0);
            if (!jumped) {
              console.warn(`[VNPlayer] elseTargetSceneId "${currentEvent.elseTargetSceneId}" not found. Advancing to next event.`);
              advanceEventRef.current();
            }
          } else if (currentEvent.elseTargetEventId && currentScene) {
            const targetIdx = currentScene.timeline.findIndex((e) => e.id === currentEvent.elseTargetEventId);
            if (targetIdx !== -1 && targetIdx !== eventIndex) {
              setEventIndex(targetIdx);
              setActiveChoiceBranch(null);
            } else {
              advanceEventRef.current();
            }
          } else {
            advanceEventRef.current();
          }
        }
        break;
      }

      case 'bg_change': {
        if (currentEvent.backgroundUrl) {
          setCustomSceneBg(currentEvent.backgroundUrl);
        }
        advanceEventRef.current();
        break;
      }

      case 'bgm': {
        if (currentEvent.audioUrl) {
          const isSameTrack =
            bgmAudioRef.current &&
            !bgmAudioRef.current.paused &&
            (decodeURIComponent(bgmAudioRef.current.src).includes(decodeURIComponent(currentEvent.audioUrl)) ||
              bgmAudioRef.current.src.endsWith(currentEvent.audioUrl));

          if (isSameTrack && bgmAudioRef.current) {
            bgmAudioRef.current.volume = currentEvent.audioVolume ?? 0.5;
          } else {
            if (bgmAudioRef.current) {
              bgmAudioRef.current.pause();
              bgmAudioRef.current = null;
            }
            try {
              const audio = new Audio(currentEvent.audioUrl);
              audio.loop = true;
              audio.volume = currentEvent.audioVolume ?? 0.5;
              audio.play().catch(() => {});
              bgmAudioRef.current = audio;
            } catch {}
          }
        } else {
          if (bgmAudioRef.current) {
            bgmAudioRef.current.pause();
            bgmAudioRef.current = null;
          }
        }
        advanceEventRef.current();
        break;
      }

      case 'character_enter': {
        if (currentEvent.characterId) {
          setOnStageCharacters((prev) => ({
            ...prev,
            [currentEvent.characterId!]: {
              position: currentEvent.characterPosition || 'center',
              emotion: currentEvent.emotion || 'neutral',
            },
          }));
        }
        advanceEventRef.current();
        break;
      }

      case 'character_exit': {
        if (currentEvent.characterId) {
          setOnStageCharacters((prev) => {
            const updated = { ...prev };
            delete updated[currentEvent.characterId!];
            return updated;
          });
        }
        advanceEventRef.current();
        break;
      }

      case 'choice': {
        if (skipMode) setSkipMode(false);
        break;
      }

      case 'hotspot_mode': {
        if (skipMode) setSkipMode(false);
        setIsHotspotMode(true);
        setIsTextBoxVisible(false);
        break;
      }

      case 'sfx': {
        if (currentEvent.audioUrl) {
          playSfx(currentEvent.audioUrl, false, currentEvent.audioVolume ?? 0.8);
        }
        advanceEventRef.current();
        break;
      }

      case 'shake': {
        const intensity = currentEvent.shakeIntensity || 'medium';
        const shakeMap = {
          light: 'animate-pulse',
          medium: 'animate-bounce',
          heavy: 'animate-ping',
        };
        setShakeClass(shakeMap[intensity] || 'animate-bounce');
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.3);
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => {
          setShakeClass('');
          shakeTimerRef.current = null;
          advanceEventRef.current();
        }, 600);
        break;
      }

      case 'flash': {
        const col = currentEvent.flashColor || 'red';
        const duration = currentEvent.durationMs || 400;
        setFlashColor(col === 'red' ? 'rgba(185,28,28,0.7)' : col === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.9)');
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          setFlashColor(null);
          flashTimerRef.current = null;
          advanceEventRef.current();
        }, duration);
        break;
      }

      case 'fx_start': {
        setIsTextBoxVisible(false);
        if (fxFadeOutTimerRef.current) {
          clearTimeout(fxFadeOutTimerRef.current);
          fxFadeOutTimerRef.current = null;
        }

        const fxType = currentEvent.fxType || 'red_alert';
        const fadeIn = Math.max(0, currentEvent.fxFadeInSeconds ?? 1.0);
        const targetVol = currentEvent.fxLoopAudioVolume ?? 0.6;

        if (currentEvent.fxLoopAudioUrl) {
          if (fxLoopAudioRef.current) {
            fxLoopAudioRef.current.pause();
            fxLoopAudioRef.current = null;
          }
          try {
            const cleanUrl = encodeURI(decodeURI(currentEvent.fxLoopAudioUrl));
            const audio = new Audio(cleanUrl);
            audio.loop = true;
            if (fadeIn > 0) {
              audio.volume = 0;
              const stepTime = 50;
              const steps = Math.max(1, (fadeIn * 1000) / stepTime);
              const volInc = targetVol / steps;
              let currentVol = 0;
              if (fxFadeIntervalRef.current) clearInterval(fxFadeIntervalRef.current);
              fxFadeIntervalRef.current = setInterval(() => {
                currentVol = Math.min(targetVol, currentVol + volInc);
                if (audio) audio.volume = currentVol;
                if (currentVol >= targetVol) {
                  if (fxFadeIntervalRef.current) {
                    clearInterval(fxFadeIntervalRef.current);
                    fxFadeIntervalRef.current = null;
                  }
                }
              }, stepTime);
            } else {
              audio.volume = targetVol;
            }
            audio.play().catch(() => {});
            fxLoopAudioRef.current = audio;
          } catch (e) {
            console.error('Error starting FX loop audio:', e);
          }
        }

        setActiveScreenFx({
          pairId: currentEvent.fxPairId,
          fxType,
          intensity: currentEvent.fxIntensity || 'medium',
          color: currentEvent.fxColor,
          animation: currentEvent.fxAnimation,
          customWords: currentEvent.fxCustomWords,
          flashlightMode: currentEvent.flashlightMode || 'normal',
          flashlightRadius: currentEvent.flashlightRadius,
          flashlightShutdown: currentEvent.flashlightShutdown || false,
          flashlightHitsRequired: currentEvent.flashlightHitsRequired || 3,
          fadeInSeconds: fadeIn,
          fadeOutSeconds: 1.0,
          isFadingOut: false,
          sfxUrl: currentEvent.fxLoopAudioUrl,
          params: currentEvent.fxParams,
        });

        if (currentEvent.flashlightShutdown) {
          setIsFlashlightShutdownActive(true);
        }

        advanceEventRef.current();
        break;
      }

      case 'fx_end': {
        setIsTextBoxVisible(false);
        const fadeOut = Math.max(0, currentEvent.fxFadeOutSeconds ?? 1.0);

        if (fxLoopAudioRef.current) {
          const audio = fxLoopAudioRef.current;
          if (fadeOut > 0) {
            const startVol = audio.volume;
            const stepTime = 50;
            const steps = Math.max(1, (fadeOut * 1000) / stepTime);
            const volDec = startVol / steps;
            let currentVol = startVol;
            if (fxFadeIntervalRef.current) clearInterval(fxFadeIntervalRef.current);
            fxFadeIntervalRef.current = setInterval(() => {
              currentVol = Math.max(0, currentVol - volDec);
              if (audio) audio.volume = currentVol;
              if (currentVol <= 0) {
                if (fxFadeIntervalRef.current) {
                  clearInterval(fxFadeIntervalRef.current);
                  fxFadeIntervalRef.current = null;
                }
                audio.pause();
                if (fxLoopAudioRef.current === audio) {
                  fxLoopAudioRef.current = null;
                }
              }
            }, stepTime);
          } else {
            audio.pause();
            fxLoopAudioRef.current = null;
          }
        }

        setActiveScreenFx((prev) => (prev ? { ...prev, isFadingOut: true, fadeOutSeconds: fadeOut } : null));

        if (fadeOut > 0) {
          fxFadeOutTimerRef.current = setTimeout(() => {
            setActiveScreenFx(null);
            fxFadeOutTimerRef.current = null;
          }, fadeOut * 1000);
        } else {
          setActiveScreenFx(null);
        }

        advanceEventRef.current();
        break;
      }

      case 'loading_screen': {
        setLoadingScreen({
          active: true,
          title: currentEvent.loadingTitle || 'ACCESSING DATA...',
          subtitle: currentEvent.loadingSubtitle,
          loreTip: currentEvent.loadingTip,
        });
        const duration = skipModeRef.current ? 200 : (currentEvent.durationMs || 2500);
        if (loadingScreenTimerRef.current) clearTimeout(loadingScreenTimerRef.current);
        loadingScreenTimerRef.current = setTimeout(() => {
          setLoadingScreen(null);
          loadingScreenTimerRef.current = null;
          advanceEventRef.current();
        }, duration);
        break;
      }

      case 'jump_scene': {
        if (currentEvent.targetSceneId) {
          const jumped = jumpToScene(currentEvent.targetSceneId, 0);
          if (!jumped) {
            console.warn(`[VNPlayer] jump_scene event targetSceneId "${currentEvent.targetSceneId}" not found. Advancing to next event.`);
            advanceEventRef.current();
          }
        } else {
          advanceEventRef.current();
        }
        break;
      }

      case 'mutate_variable': {
        if (currentEvent.variableMutation) {
          setVariablesState((prev) => applyVariableMutation(currentEvent.variableMutation!, prev));
        }
        advanceEventRef.current();
        break;
      }

      case 'cursor_change': {
        const cType = currentEvent.cursorType || 'palimpsest_dot';
        if (currentEvent.cursorMode === 'dialogue_only') {
          setTemporaryCursor(cType);
        } else {
          setPersistentCursor(cType);
          setTemporaryCursor(null);
        }
        advanceEventRef.current();
        break;
      }

      default:
        break;
    }

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [currentEvent, story.textBoxConfig, pendingReaction, isStoryCompleted, variablesState, currentScene, currentSpeaker, eventIndex, jumpToScene]);

  // Manejo reactivo de activación de modo Salto (SKIP) sin reiniciar la línea ni duplicar historia
  useEffect(() => {
    if (skipMode) {
      if (isTyping) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        if (pendingReaction) {
          setDisplayedText(interpolateText(pendingReaction.reaction.text, variablesState));
        } else if (currentEvent?.text) {
          setDisplayedText(interpolateText(currentEvent.text, variablesState));
        }
        setIsTyping(false);
      }
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      autoTimerRef.current = setTimeout(() => {
        advanceEventRef.current();
      }, 140);
    }
  }, [skipMode, isTyping, pendingReaction, currentEvent, variablesState]);

  // Manejo reactivo de activación/desactivación de modo Automático (AUTO) sin reiniciar la línea ni duplicar historia
  useEffect(() => {
    if (autoMode) {
      if (
        !isTyping &&
        !isStoryCompleted &&
        !isFlashlightShutdownActive &&
        !skipMode &&
        currentEvent?.type !== 'choice' &&
        (!isHotspotMode || Boolean(activeInspection))
      ) {
        if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
        const autoDelay = story.textBoxConfig.autoSpeedMs || 2000;
        autoTimerRef.current = setTimeout(() => {
          advanceEventRef.current();
        }, autoDelay);
      }
    } else {
      if (!skipModeRef.current && autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
      }
    }
  }, [
    autoMode,
    isTyping,
    isStoryCompleted,
    isFlashlightShutdownActive,
    skipMode,
    currentEvent?.type,
    isHotspotMode,
    activeInspection,
    story.textBoxConfig.autoSpeedMs,
  ]);

  // Selección de opciones de elección
  const handleSelectChoice = (option: VNChoiceOption) => {
    if (option.condition && !evaluateCondition(option.condition, variablesState)) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      return;
    }

    playSfx('/assets/sfx/click interface.mp3', true, 0.4);

    if (option.mutations && option.mutations.length > 0) {
      let updated = { ...variablesState };
      option.mutations.forEach((m) => {
        updated = applyVariableMutation(m, updated);
      });
      setVariablesState(updated);
    }

    let currentBranchInfo: {
      unchosenTargetIndices: Set<number>;
      rejoinIndex: number;
    } | null = null;

    if (currentEvent && currentEvent.type === 'choice' && currentEvent.options && currentScene) {
      const otherOptions = currentEvent.options.filter((o) => o.id !== option.id);
      const unchosenTargetEventIds = new Set<string>();
      const unchosenTargetIndices = new Set<number>();

      otherOptions.forEach((o) => {
        if (o.targetEventId) {
          unchosenTargetEventIds.add(o.targetEventId);
          const idx = currentScene.timeline.findIndex((e) => e.id === o.targetEventId);
          if (idx !== -1) unchosenTargetIndices.add(idx);
        } else if (typeof o.jumpToEventIndex === 'number') {
          unchosenTargetIndices.add(o.jumpToEventIndex);
          const ev = currentScene.timeline[o.jumpToEventIndex];
          if (ev) unchosenTargetEventIds.add(ev.id);
        }
      });

      let maxBranchIdx = eventIndex;
      currentEvent.options.forEach((o) => {
        if (o.targetEventId) {
          const idx = currentScene.timeline.findIndex((e) => e.id === o.targetEventId);
          if (idx > maxBranchIdx) maxBranchIdx = idx;
        } else if (typeof o.jumpToEventIndex === 'number') {
          if (o.jumpToEventIndex > maxBranchIdx) maxBranchIdx = o.jumpToEventIndex;
        }
      });

      const rejoinIndex = currentEvent.rejoinEventId
        ? currentScene.timeline.findIndex((e) => e.id === currentEvent.rejoinEventId)
        : maxBranchIdx + 1;

      const effectiveRejoinIndex = rejoinIndex !== -1 ? rejoinIndex : maxBranchIdx + 1;

      currentBranchInfo = {
        unchosenTargetIndices,
        rejoinIndex: effectiveRejoinIndex,
      };

      setActiveChoiceBranch({
        choiceEventId: currentEvent.id,
        chosenOptionId: option.id,
        unchosenTargetEventIds,
        unchosenTargetIndices,
        rejoinIndex: effectiveRejoinIndex,
        rejoinEventId: currentEvent.rejoinEventId,
      });
    }

    const proceedWithOption = () => {
      setIsTextBoxVisible(true);
      const branch = currentBranchInfo || activeChoiceBranch;
      if (option.targetSceneId) {
        const jumped = jumpToScene(option.targetSceneId, 0);
        if (!jumped) {
          console.warn(`[VNPlayer] Choice option targetSceneId "${option.targetSceneId}" not found. Falling back to linear progression.`);
          const fallbackTarget =
            branch && branch.unchosenTargetIndices.has(eventIndex + 1)
              ? branch.rejoinIndex
              : eventIndex + 1;
          if (fallbackTarget < currentScene.timeline.length) {
            setEventIndex(fallbackTarget);
          } else {
            advanceToNextScene();
          }
        }
      } else if (option.targetEventId) {
        const evIdx = currentScene.timeline.findIndex((e) => e.id === option.targetEventId);
        if (evIdx !== -1) {
          setEventIndex(evIdx);
        } else {
          const fallbackTarget =
            branch && branch.unchosenTargetIndices.has(eventIndex + 1)
              ? branch.rejoinIndex
              : eventIndex + 1;
          if (fallbackTarget < currentScene.timeline.length) {
            setEventIndex(fallbackTarget);
          } else {
            advanceToNextScene();
          }
        }
      } else if (typeof option.jumpToEventIndex === 'number') {
        setEventIndex(option.jumpToEventIndex);
      } else {
        const fallbackTarget =
          branch && branch.unchosenTargetIndices.has(eventIndex + 1)
            ? branch.rejoinIndex
            : eventIndex + 1;
        if (fallbackTarget < currentScene.timeline.length) {
          setEventIndex(fallbackTarget);
        } else {
          advanceToNextScene();
        }
      }
    };

    if (option.reaction) {
      triggerReactionDialogue(option.reaction, proceedWithOption);
    } else {
      proceedWithOption();
    }
  };
  handleSelectChoiceRef.current = handleSelectChoice;

  // Manejo de clics en Hotspots
  const handleHotspotClick = (hotspot: VNHotspot) => {
    if (hotspot.interactionLimit === 'once' && consumedHotspots.includes(hotspot.id)) {
      return;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    if (hotspot.condition && !evaluateCondition(hotspot.condition, variablesState)) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.5);
      const denyMsg = `[ACCESS DENIED]: Authorization required (${hotspot.condition.variableKey} ${hotspot.condition.operator || '=='} ${hotspot.condition.value}).`;
      setActiveInspection({
        speaker: 'SECURITY SYSTEM',
        speakerColor: '#ef4444',
        badge: 'LOCKED',
        text: denyMsg,
      });
      setDisplayedText(denyMsg);
      setIsTyping(false);
      setIsTextBoxVisible(true);
      return;
    }

    if (hotspot.sfxUrl) {
      playSfx(hotspot.sfxUrl, false, 0.7);
    } else {
      playSfx('/assets/sfx/open folder.mp3', false, 0.5);
    }

    let currentVars = variablesState;
    if (hotspot.mutation) {
      currentVars = applyVariableMutation(hotspot.mutation, variablesState);
      setVariablesState(currentVars);
    }

    if (hotspot.interactionLimit === 'once') {
      setConsumedHotspots((prev) => [...prev, hotspot.id]);
    }

    if (hotspot.actionType === 'jump_scene' && hotspot.targetSceneId) {
      const jumped = jumpToScene(hotspot.targetSceneId, 0);
      if (jumped) {
        setActiveInspection(null);
      } else {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.5);
        const unreachableMsg = `[WAYPOINT UNREACHABLE]: Destination scene "${hotspot.targetSceneId}" is unavailable or unlinked.`;
        setActiveInspection({
          speaker: 'NAVIGATION SYSTEM',
          speakerColor: '#ef4444',
          badge: 'ERROR',
          text: unreachableMsg,
        });
        setDisplayedText(unreachableMsg);
        setIsTyping(false);
        setIsTextBoxVisible(true);
      }
    } else if (hotspot.actionType === 'inspect' || hotspot.actionType === 'trigger_dialogue') {
      const textToSpeak = hotspot.inspectText || (hotspot.actionType === 'inspect' ? 'Nothing of special interest observed in this area.' : '...');
      const interpolatedText = interpolateText(textToSpeak, currentVars);
      
      let speakerName = 'SYSTEM LOG';
      let speakerColor = '#38bdf8';
      let badgeTitle = 'INSPECTION';
      let charId: string | undefined = undefined;
      let avatarUrl: string | undefined = undefined;

      if (hotspot.actionType === 'trigger_dialogue' && hotspot.dialogueCharacterId) {
        const char = story.characters.find((c) => c.id === hotspot.dialogueCharacterId);
        if (char) {
          speakerName = char.name;
          speakerColor = char.color || '#ef4444';
          badgeTitle = char.badgeTitle || 'DIALOGUE';
          charId = char.id;
          avatarUrl = getCharacterAvatar(char, hotspot.dialogueEmotion);
        }
      } else if (hotspot.label) {
        speakerName = interpolateText(hotspot.label, currentVars);
      }

      setActiveInspection({
        speaker: speakerName,
        speakerColor,
        badge: badgeTitle,
        text: interpolatedText,
        characterId: charId,
        avatarUrl,
      });
      setIsTextBoxVisible(true);

      let charIndex = 0;
      setDisplayedText('');
      setIsTyping(true);

      setHistory((prev) => {
        const formattedSpeaker = `[${badgeTitle}: ${speakerName}]`;
        const last = prev[prev.length - 1];
        if (last && last.speaker === formattedSpeaker && last.text === interpolatedText) {
          return prev;
        }
        return [
          ...prev.slice(-249),
          { speaker: formattedSpeaker, speakerColor, text: interpolatedText },
        ];
      });

      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      const speed = skipModeRef.current ? 5 : (story.textBoxConfig.typewriterSpeedMs || 25);
      const blipSound = '/assets/sfx/click intro.mp3';
      const blipEnabled = story.textBoxConfig.soundBlipEnabled !== false;

      typingTimerRef.current = setInterval(() => {
        charIndex++;
        setDisplayedText(interpolatedText.slice(0, charIndex));

        const now = Date.now();
        if (charIndex % 3 === 0 && blipEnabled && !skipModeRef.current && now - lastBlipTimeRef.current >= 45) {
          lastBlipTimeRef.current = now;
          playSfx(blipSound, false, 0.06);
        }

        if (charIndex >= interpolatedText.length) {
          if (typingTimerRef.current) clearInterval(typingTimerRef.current);
          setIsTyping(false);

          if (skipModeRef.current) {
            autoTimerRef.current = setTimeout(() => {
              advanceEventRef.current();
            }, 140);
          } else if (autoModeRef.current) {
            const autoDelay = story.textBoxConfig.autoSpeedMs || 2000;
            autoTimerRef.current = setTimeout(() => {
              advanceEventRef.current();
            }, autoDelay);
          }
        }
      }, speed);
    }
  };

  // Guardar partida en ranura
  const handleSaveToSlot = (slotNumber: number) => {
    const activeCharactersList = Object.entries(onStageCharacters).map(([characterId, data]) => ({
      characterId,
      position: data.position,
      emotion: data.emotion,
    }));

    const currentState: VNGameState = {
      currentChapterId,
      currentSceneId,
      eventIndex,
      variablesState,
      history,
      activeCharacters: activeCharactersList,
      isHotspotMode,
      consumedHotspots,
      customSceneBg,
      persistentCursor,
      activeScreenFx,
      currentBgmUrl: bgmAudioRef.current?.src || currentScene?.bgmUrl || null,
      currentBgmVolume: bgmAudioRef.current?.volume ?? 0.5,
    };
    const effectiveBg = customSceneBg || currentScene?.backgroundUrl;
    const updated = saveGameStateToSlot(slotNumber, story, currentState, effectiveBg);
    setSaveSlots(updated);
    playSfx('/assets/sfx/success.mp3', false, 0.6);
  };

  // Cargar partida desde ranura
  const handleLoadFromSlot = (slot: VNSaveSlot) => {
    // Limpiar temporizadores activos antes de restaurar estado
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (fxFadeIntervalRef.current) {
      clearInterval(fxFadeIntervalRef.current);
      fxFadeIntervalRef.current = null;
    }
    if (fxFadeOutTimerRef.current) {
      clearTimeout(fxFadeOutTimerRef.current);
      fxFadeOutTimerRef.current = null;
    }
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    setShakeClass('');
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setFlashColor(null);
    if (loadingScreenTimerRef.current) {
      clearTimeout(loadingScreenTimerRef.current);
      loadingScreenTimerRef.current = null;
    }
    setLoadingScreen(null);

    const targetResolved = resolveScene(slot.gameState.currentSceneId);
    const safeScene = targetResolved.scene || story.chapters[0]?.scenes[0] || (story.scenarios || [])[0];
    const safeChapter = targetResolved.chapter || story.chapters[0];
    const safeSceneId = safeScene?.id || slot.gameState.currentSceneId;
    const safeChapterId = safeChapter?.id || slot.gameState.currentChapterId;
    const safeEventIndex = targetResolved.scene
      ? Math.min(Math.max(0, slot.gameState.eventIndex), Math.max(0, (safeScene?.timeline?.length || 1) - 1))
      : 0;

    const isSameScene = safeSceneId === currentSceneId;
    if (isSameScene) {
      isRestoringSaveRef.current = false;
      playSceneBgm(safeScene, safeEventIndex, slot.gameState.currentBgmUrl, slot.gameState.currentBgmVolume);
      if (safeEventIndex === eventIndex) {
        const ev = safeScene?.timeline?.[safeEventIndex];
        if (ev?.text) {
          setDisplayedText(interpolateText(ev.text, slot.gameState.variablesState || {}));
          setIsTyping(false);
        }
      }
    } else {
      isRestoringSaveRef.current = true;
    }

    if (fxLoopAudioRef.current) {
      fxLoopAudioRef.current.pause();
      fxLoopAudioRef.current = null;
    }
    // Sincronizar punto de control seguro para que RETRY funcione desde la partida cargada
    lastGameplayLocationRef.current = {
      chapterId: safeChapterId,
      sceneId: safeSceneId,
      eventIndex: safeEventIndex,
      variablesState: { ...(slot.gameState.variablesState || {}) },
    };
    setCurrentChapterId(safeChapterId);
    setCurrentSceneId(safeSceneId);
    setEventIndex(safeEventIndex);
    setVariablesState(slot.gameState.variablesState || {});
    setHistory((slot.gameState.history || []).slice(-250));
    setIsHotspotMode(slot.gameState.isHotspotMode);
    setConsumedHotspots(slot.gameState.consumedHotspots || []);
    setCustomSceneBg(slot.gameState.customSceneBg || null);
    setPersistentCursor(slot.gameState.persistentCursor || 'default');
    setTemporaryCursor(null);
    const loadedCharacters: Record<string, { position: VNPosition; emotion?: string }> = {};
    (slot.gameState.activeCharacters || []).forEach((c) => {
      if (c && c.characterId) {
        loadedCharacters[c.characterId] = {
          position: c.position,
          emotion: c.emotion,
        };
      }
    });
    setOnStageCharacters(loadedCharacters);
    if (slot.gameState.activeScreenFx) {
      setActiveScreenFx(slot.gameState.activeScreenFx);
      if (slot.gameState.activeScreenFx.sfxUrl) {
        try {
          const a = new Audio(slot.gameState.activeScreenFx.sfxUrl);
          a.loop = true;
          a.volume = 0.5;
          a.play().catch(() => {});
          fxLoopAudioRef.current = a;
        } catch {}
      }
    } else {
      setActiveScreenFx(null);
    }
    setIsFlashlightShutdownActive(false);
    setSkipMode(false);
    setIsStoryCompleted(false);
    setShowSaveLoadModal(null);
    setPendingReaction(null);
    setActiveInspection(null);
    setActiveChoiceBranch(null);
    setIsTextBoxVisible(!slot.gameState.isHotspotMode);
    playSfx('/assets/sfx/open folder.mp3', false, 0.6);
  };

  const handleDeleteSlot = (slotNumber: number) => {
    if (confirm(`Delete save slot #${slotNumber}?`)) {
      const updated = deleteSaveSlot(slotNumber, story.id);
      setSaveSlots(updated);
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
    }
  };

  const handleRestartStory = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (fxFadeIntervalRef.current) {
      clearInterval(fxFadeIntervalRef.current);
      fxFadeIntervalRef.current = null;
    }
    if (fxFadeOutTimerRef.current) {
      clearTimeout(fxFadeOutTimerRef.current);
      fxFadeOutTimerRef.current = null;
    }
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    setShakeClass('');
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setFlashColor(null);
    if (loadingScreenTimerRef.current) {
      clearTimeout(loadingScreenTimerRef.current);
      loadingScreenTimerRef.current = null;
    }
    setLoadingScreen(null);
    setActiveEpisodeScreen(null);
    seenChapterIntrosRef.current.clear();

    const firstChapter = story.chapters[0];
    const firstSceneId = (story.menuSystemConfig?.enabled && (story.menuSystemConfig.introSceneId || story.menuSystemConfig.mainMenuSceneId))
      ? (story.menuSystemConfig.introSceneId || story.menuSystemConfig.mainMenuSceneId!)
      : getChapterInitialSceneId(firstChapter);
    const isSameScene = firstSceneId === currentSceneId;

    if (isSameScene) {
      const targetScene = firstChapter?.scenes.find((s) => s.id === firstSceneId);
      playSceneBgm(targetScene, 0);
    } else {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    }

    if (fxLoopAudioRef.current) {
      fxLoopAudioRef.current.pause();
      fxLoopAudioRef.current = null;
    }
    lastGameplayLocationRef.current = {
      chapterId: story.chapters[0]?.id || '',
      sceneId: firstSceneId,
      eventIndex: 0,
      variablesState: getInitialVariables(),
    };
    setCurrentChapterId(story.chapters[0]?.id || '');
    setCurrentSceneId(firstSceneId);
    setEventIndex(0);
    setVariablesState(getInitialVariables());
    setHistory([]);
    setConsumedHotspots([]);
    setIsHotspotMode(false);
    setCustomSceneBg(null);
    setOnStageCharacters({});
    setActiveScreenFx(null);
    setPersistentCursor('default');
    setTemporaryCursor(null);
    setIsFlashlightShutdownActive(false);
    setSkipMode(false);
    setIsStoryCompleted(false);
    setPendingReaction(null);
    setActiveInspection(null);
    setActiveChoiceBranch(null);
    setIsTextBoxVisible(true);
    playSfx('/assets/sfx/start after click intro.mp3', false, 0.7);
  };

  const activeEmotion = activeReaction?.emotion || currentEvent?.emotion;
  const activeAvatarUrl = activeInspection
    ? activeInspection.avatarUrl
    : getCharacterAvatar(currentSpeaker, activeEmotion);

  const activeCursorType: VNCursorType =
    temporaryCursor || persistentCursor || currentScene?.cursorType || 'default';

  const handleCloseTextBox = useCallback(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setIsTyping(false);
    setActiveInspection(null);
    setIsTextBoxVisible(false);
    setDisplayedText('');
  }, []);

  return {
    // State
    currentChapterId,
    currentSceneId,
    eventIndex,
    variablesState,
    history,
    isHotspotMode,
    isStoryCompleted,
    pendingReaction,
    activeChoiceBranch,
    displayedText,
    isTyping,
    autoMode,
    skipMode,
    showHistoryModal,
    showSaveLoadModal,
    showVariablesHud,
    saveSlots,
    consumedHotspots,
    onStageCharacters,
    customSceneBg,
    inspectionBanner,
    activeInspection,
    isTextBoxVisible,
    persistentCursor,
    temporaryCursor,
    loadingScreen,
    activeEpisodeScreen,
    shakeClass,
    flashColor,
    isFlashlightShutdownActive,
    activeScreenFx,

    // Resolved entities
    currentChapter,
    currentScene,
    currentEvent,
    currentSpeaker,
    activeReaction,
    activeEmotion,
    activeAvatarUrl,
    activeCursorType,

    // Actions
    advanceEvent,
    advanceToNextScene,
    jumpToScene,
    handleEpisodeScreenContinue,
    handleEpisodeScreenRetry,
    handleSelectChoice,
    handleHotspotClick,
    handleRetryPrevious,
    handleRestartStory,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleDeleteSlot,
    handleCloseTextBox,
    setAutoMode,
    setSkipMode,
    setShowHistoryModal,
    setShowSaveLoadModal,
    setShowVariablesHud,
    setIsTextBoxVisible,
    setIsFlashlightShutdownActive,

    // Refs
    playerContainerRef,
    historyBottomRef,
  };
}
