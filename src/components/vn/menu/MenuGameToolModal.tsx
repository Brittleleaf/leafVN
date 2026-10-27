"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  VNStory,
  VNScene,
  VNMenuSystemConfig,
  VNStaticScreenConfig,
} from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import StaticScreenStudio from '../StaticScreenStudio';
import {
  DEFAULT_TITLE_CONFIG,
  DEFAULT_LOAD_GAME_CONFIG,
  DEFAULT_SETTINGS_CONFIG,
  DEFAULT_GALLERY_CONFIG,
  DEFAULT_INTRO_CONFIG,
} from '../StaticScreenView';

interface MenuGameToolModalProps {
  story: VNStory;
  onUpdateStory: (updatedStory: VNStory) => void;
  onSelectScene?: (sceneId: string) => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export type MenuScreenRole = 'intro' | 'main_menu' | 'play' | 'load_game' | 'settings' | 'gallery';

interface MenuRoleDefinition {
  role: MenuScreenRole;
  title: string;
  badge: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  icon: any;
  defaultPos: { x: number; y: number };
}

const MENU_ROLES: MenuRoleDefinition[] = [
  {
    role: 'intro',
    title: 'Pantalla de Intro',
    badge: 'STARTUP INTRO',
    description: 'Secuencia cinemática o estática al iniciar la novela visual',
    color: '#38bdf8',
    borderColor: 'border-sky-500/50',
    bgColor: 'bg-sky-950/20',
    icon: GUI_ICONS.media.video,
    defaultPos: { x: 100, y: 300 },
  },
  {
    role: 'main_menu',
    title: 'Menú Principal (Title)',
    badge: 'CORE TITLE SCREEN',
    description: 'Pantalla de inicio con botones libres, fondo y banda sonora',
    color: '#10b981',
    borderColor: 'border-emerald-500/70',
    bgColor: 'bg-emerald-950/25',
    icon: GUI_ICONS.general.gameMenu,
    defaultPos: { x: 440, y: 260 },
  },
  {
    role: 'play',
    title: 'Iniciar Historia (Play)',
    badge: 'GAMEPLAY ENTRY',
    description: 'Punto de partida de la historia o prólogo del juego',
    color: '#a855f7',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-purple-950/20',
    icon: GUI_ICONS.action.play,
    defaultPos: { x: 860, y: 70 },
  },
  {
    role: 'load_game',
    title: 'Partidas Guardadas',
    badge: 'SAVE / LOAD SLOTS',
    description: 'Ranuras interactivas de guardado con capturas y marcas de tiempo',
    color: '#06b6d4',
    borderColor: 'border-cyan-500/50',
    bgColor: 'bg-cyan-950/20',
    icon: GUI_ICONS.general.save,
    defaultPos: { x: 860, y: 220 },
  },
  {
    role: 'settings',
    title: 'Configuración',
    badge: 'SETTINGS & AUDIO',
    description: 'Ajustes de sonido, pantalla, velocidad de texto e idioma',
    color: '#ec4899',
    borderColor: 'border-pink-500/50',
    bgColor: 'bg-pink-950/20',
    icon: GUI_ICONS.general.gear,
    defaultPos: { x: 860, y: 370 },
  },
  {
    role: 'gallery',
    title: 'Galería & Cinemáticas',
    badge: 'EXTRAS & DOSSIERS',
    description: 'Visor de cinemáticas por capítulo, escenarios y personajes',
    color: '#f59e0b',
    borderColor: 'border-amber-500/50',
    bgColor: 'bg-amber-950/20',
    icon: GUI_ICONS.general.gallery,
    defaultPos: { x: 860, y: 520 },
  },
];

const NODE_WIDTH = 290;
const NODE_HEIGHT = 200;

export default function MenuGameToolModal({
  story,
  onUpdateStory,
  onSelectScene,
  onClose,
  notify = () => {},
}: MenuGameToolModalProps) {
  // Currently editing scene in embedded studio
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  // Viewport Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 60 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging nodes
  const [draggingRole, setDraggingRole] = useState<MenuScreenRole | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Collect all scenes in the story (from chapters + global scenarios)
  const allScenes = useMemo(() => {
    const list: { scene: VNScene; chapterTitle: string }[] = [];
    (story.chapters || []).forEach((ch) => {
      (ch.scenes || []).forEach((sc) => {
        list.push({ scene: sc, chapterTitle: ch.title });
      });
    });
    (story.scenarios || []).forEach((sc) => {
      if (!list.some((item) => item.scene.id === sc.id)) {
        list.push({ scene: sc, chapterTitle: 'Escenarios Globales' });
      }
    });
    return list;
  }, [story]);

  // Read Menu System configuration
  const menuConfig: VNMenuSystemConfig = story.menuSystemConfig || {};

  // Resolve assigned scene for each role
  const resolvedRoleScenes = useMemo(() => {
    const findScene = (sceneId?: string) => {
      if (!sceneId) return null;
      return allScenes.find((s) => s.scene.id === sceneId)?.scene || null;
    };

    // Auto-discovery heuristics if sceneId not explicitly configured
    const findByPurpose = (purposes: string[]) => {
      return (
        allScenes.find(
          (s) =>
            s.scene.sceneType === 'event' &&
            s.scene.eventSubtype === 'static' &&
            s.scene.staticScreenConfig &&
            purposes.includes(s.scene.staticScreenConfig.purpose)
        )?.scene || null
      );
    };

    const intro = findScene(menuConfig.introSceneId) || findByPurpose(['intro']);
    const mainMenu = findScene(menuConfig.mainMenuSceneId) || findByPurpose(['title']);
    const loadGame = findScene(menuConfig.loadGameSceneId) || findByPurpose(['load_game']);
    const settings = findScene(menuConfig.settingsSceneId) || findByPurpose(['settings']);
    const gallery = findScene(menuConfig.gallerySceneId) || findByPurpose(['gallery']);
    
    // Play: first standard scene of chapter 1 or story start
    let play = findScene(menuConfig.playStartSceneId);
    if (!play) {
      const ch1 = story.chapters[0];
      if (ch1 && ch1.scenes.length > 0) {
        play = ch1.scenes.find((s) => s.id === ch1.startSceneId) || ch1.scenes[0];
      }
    }

    return {
      intro,
      main_menu: mainMenu,
      play,
      load_game: loadGame,
      settings,
      gallery,
    };
  }, [allScenes, menuConfig, story.chapters]);

  // Node Positions
  const nodePositions = useMemo(() => {
    const saved = menuConfig.nodePositions || {};
    const positions: Record<MenuScreenRole, { x: number; y: number }> = {} as any;

    MENU_ROLES.forEach((def) => {
      if (draggingRole === def.role && dragCurrentPos) {
        positions[def.role] = dragCurrentPos;
      } else if (saved[def.role] && Number.isFinite(saved[def.role].x) && Number.isFinite(saved[def.role].y)) {
        positions[def.role] = saved[def.role];
      } else {
        positions[def.role] = def.defaultPos;
      }
    });

    return positions;
  }, [menuConfig.nodePositions, draggingRole, dragCurrentPos]);

  // Save node position on drag end
  const handleSaveNodePosition = (role: MenuScreenRole, pos: { x: number; y: number }) => {
    const updatedPositions = {
      ...(menuConfig.nodePositions || {}),
      [role]: { x: Math.round(pos.x), y: Math.round(pos.y) },
    };
    const updatedConfig: VNMenuSystemConfig = {
      ...menuConfig,
      nodePositions: updatedPositions,
    };
    onUpdateStory({
      ...story,
      menuSystemConfig: updatedConfig,
    });
  };

  const isMenuEnabled = menuConfig.enabled !== false;

  const handleToggleMenuEnabled = () => {
    const nextState = !isMenuEnabled;
    onUpdateStory({
      ...story,
      menuSystemConfig: {
        ...menuConfig,
        enabled: nextState,
      },
    });
    playUiSound('select', 0.5);
    notify(
      nextState
        ? 'Sistema de Menú Activado: El juego iniciará desde Intro / Menú Principal'
        : 'Sistema de Menú Desactivado: El juego iniciará directo en el Capítulo 1'
    );
  };

  const handlePlaytestMenu = () => {
    playSfx('/assets/sfx/click intro.mp3', false, 0.4);
    if (typeof window !== 'undefined') {
      window.open('/player', '_blank');
    }
  };

  // Assign or reassign a scene to a role
  const handleAssignSceneToRole = (role: MenuScreenRole, sceneId: string) => {
    const keyMap: Record<MenuScreenRole, keyof VNMenuSystemConfig> = {
      intro: 'introSceneId',
      main_menu: 'mainMenuSceneId',
      play: 'playStartSceneId',
      load_game: 'loadGameSceneId',
      settings: 'settingsSceneId',
      gallery: 'gallerySceneId',
    };

    const key = keyMap[role];
    const updatedConfig: VNMenuSystemConfig = {
      ...menuConfig,
      [key]: sceneId || undefined,
    };

    onUpdateStory({
      ...story,
      menuSystemConfig: updatedConfig,
    });
    playUiSound('select', 0.5);
    notify(`Pantalla asignada a rol: ${role.toUpperCase()}`);
  };

  // Generate missing menu screens with one click
  const handleGenerateMissingScreens = () => {
    playSfx('/assets/sfx/open folder.mp3', false, 0.4);
    const updatedStory = { ...story };
    const currentScenarios = [...(updatedStory.scenarios || [])];
    const newConfig: VNMenuSystemConfig = { ...(updatedStory.menuSystemConfig || {}) };

    let createdCount = 0;

    // Helper to create static screen scene
    const createScreen = (idSuffix: string, name: string, config: VNStaticScreenConfig): VNScene => {
      return {
        id: `menu-screen-${idSuffix}-${Date.now()}`,
        name,
        backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
        sceneType: 'event',
        eventSubtype: 'static',
        staticScreenConfig: { ...config },
        timeline: [],
      };
    };

    // 1. Intro Screen
    if (!resolvedRoleScenes.intro) {
      const introScene = createScreen('intro', 'Inicio: Intro Cinemática', DEFAULT_INTRO_CONFIG);
      currentScenarios.push(introScene);
      newConfig.introSceneId = introScene.id;
      createdCount++;
    }

    // 2. Main Menu
    if (!resolvedRoleScenes.main_menu) {
      const menuScene = createScreen('title', 'Menú Principal (Title)', DEFAULT_TITLE_CONFIG);
      currentScenarios.push(menuScene);
      newConfig.mainMenuSceneId = menuScene.id;
      createdCount++;
    }

    // 3. Load Game
    if (!resolvedRoleScenes.load_game) {
      const loadScene = createScreen('load', 'Menú: Cargar Partida', DEFAULT_LOAD_GAME_CONFIG);
      currentScenarios.push(loadScene);
      newConfig.loadGameSceneId = loadScene.id;
      createdCount++;
    }

    // 4. Settings
    if (!resolvedRoleScenes.settings) {
      const settingsScene = createScreen('settings', 'Menú: Configuración', DEFAULT_SETTINGS_CONFIG);
      currentScenarios.push(settingsScene);
      newConfig.settingsSceneId = settingsScene.id;
      createdCount++;
    }

    // 5. Gallery
    if (!resolvedRoleScenes.gallery) {
      const galleryScene = createScreen('gallery', 'Menú: Galería y Extras', DEFAULT_GALLERY_CONFIG);
      currentScenarios.push(galleryScene);
      newConfig.gallerySceneId = galleryScene.id;
      createdCount++;
    }

    // 6. Play start scene (first scene of chapter 1 if not set)
    if (!resolvedRoleScenes.play && story.chapters[0]?.scenes[0]) {
      newConfig.playStartSceneId = story.chapters[0].startSceneId || story.chapters[0].scenes[0].id;
    }

    newConfig.enabled = true;
    updatedStory.scenarios = currentScenarios;
    updatedStory.menuSystemConfig = newConfig;

    onUpdateStory(updatedStory);
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify(
      createdCount > 0
        ? `Se han generado ${createdCount} pantallas del sistema de menú.`
        : 'Todas las pantallas de menú ya están configuradas.'
    );
  };

  // Auto layout nodes cleanly
  const handleAutoLayout = () => {
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    const layoutPositions: Record<string, { x: number; y: number }> = {
      intro: { x: 80, y: 300 },
      main_menu: { x: 440, y: 260 },
      play: { x: 860, y: 60 },
      load_game: { x: 860, y: 220 },
      settings: { x: 860, y: 380 },
      gallery: { x: 860, y: 540 },
    };

    const updatedConfig: VNMenuSystemConfig = {
      ...menuConfig,
      nodePositions: layoutPositions,
    };

    onUpdateStory({
      ...story,
      menuSystemConfig: updatedConfig,
    });
    setPan({ x: 80, y: 80 });
    setZoom(0.95);
    notify('Distribución automática de menús aplicada');
  };

  // Center view on Main Menu
  const handleCenterOnMenu = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuPos = nodePositions.main_menu || { x: 440, y: 260 };
    setPan({
      x: rect.width / 2 - (menuPos.x + NODE_WIDTH / 2) * zoom,
      y: rect.height / 2 - (menuPos.y + NODE_HEIGHT / 2) * zoom,
    });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  };

  // Update scene from embedded StaticScreenStudio
  const handleUpdateCurrentScene = (patch: Partial<VNScene>) => {
    if (!editingSceneId) return;

    let updated = false;
    const updatedChapters = story.chapters.map((ch) => {
      const idx = ch.scenes.findIndex((s) => s.id === editingSceneId);
      if (idx !== -1) {
        updated = true;
        const newScenes = [...ch.scenes];
        newScenes[idx] = { ...newScenes[idx], ...patch };
        return { ...ch, scenes: newScenes };
      }
      return ch;
    });

    let updatedScenarios = story.scenarios || [];
    if (!updated && story.scenarios) {
      const sIdx = story.scenarios.findIndex((s) => s.id === editingSceneId);
      if (sIdx !== -1) {
        updatedScenarios = [...story.scenarios];
        updatedScenarios[sIdx] = { ...updatedScenarios[sIdx], ...patch };
        updated = true;
      }
    }

    if (updated) {
      onUpdateStory({
        ...story,
        chapters: updatedChapters,
        scenarios: updatedScenarios,
      });
    }
  };

  // Find currently editing scene object
  const editingScene = useMemo(() => {
    if (!editingSceneId) return null;
    return allScenes.find((s) => s.scene.id === editingSceneId)?.scene || null;
  }, [allScenes, editingSceneId]);

  // Canvas Mouse Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingRole) {
      const newX = (e.clientX - pan.x) / zoom - dragOffset.x;
      const newY = (e.clientY - pan.y) / zoom - dragOffset.y;
      setDragCurrentPos({ x: newX, y: newY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingRole && dragCurrentPos) {
      handleSaveNodePosition(draggingRole, dragCurrentPos);
      setDraggingRole(null);
      setDragCurrentPos(null);
    }
  };

  // Wheel zoom
  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(2.0, Math.max(0.4, zoom * zoomFactor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
      });
    }
    setZoom(newZoom);
  };

  // If in embedded editing mode, display the full StaticScreenStudio with a sleek back button
  if (editingScene) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
        <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingSceneId(null);
                playSfx('/assets/sfx/click intro.mp3', false, 0.3);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--accent)] font-bold text-xs hover:opacity-80 transition-all cursor-pointer shadow-sm"
            >
              <GuiIconRenderer icon={GUI_ICONS.navigation.arrowLeft} className="w-4 h-4" />
              <span>Volver al Mapa de Menú</span>
            </button>
            <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />
            <span className="text-xs font-mono text-[var(--muted)]">Configurando:</span>
            <span className="text-xs font-bold text-[var(--text)]">{editingScene.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
              Auto-guardado activo
            </span>
            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] p-1.5 cursor-pointer rounded-lg hover:bg-[var(--btn-hover-bg)]"
              title="Cerrar"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <StaticScreenStudio
            scene={editingScene}
            story={story}
            onUpdateScene={handleUpdateCurrentScene}
            onBackToMenuMap={() => setEditingSceneId(null)}
          />
        </div>
      </div>
    );
  }

  // Count configured screens
  const configuredCount = Object.values(resolvedRoleScenes).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150">
      {/* HEADER / TOOLBAR */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-surface)] border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shadow-sm">
            <GuiIconRenderer icon={GUI_ICONS.general.gameMenu} className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-[var(--text)]">
                Menu Game Tool
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 font-mono font-bold">
                {configuredCount} / 6 Pantallas
              </span>
            </div>
            <p className="text-[10px] text-[var(--muted)]">
              Arquitectura visual del menú principal, pantallas de inicio y enlaces del sistema
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Menu Enabled Toggle */}
          <button
            onClick={handleToggleMenuEnabled}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isMenuEnabled
                ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-[var(--border)] bg-[var(--btn-bg)] text-[var(--muted)] hover:text-white'
            }`}
            title="Activa o desactiva que el juego arranque en la Intro/Menú Principal"
          >
            <div className={`w-2 h-2 rounded-full ${isMenuEnabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-gray-500'}`} />
            <span>{isMenuEnabled ? 'Menú Activo en Juego' : 'Menú Omitido'}</span>
          </button>

          {/* Playtest Menu Button */}
          <button
            onClick={handlePlaytestMenu}
            className="px-3 py-1.5 rounded-xl border border-sky-500/60 bg-sky-950/40 text-sky-300 hover:bg-sky-900/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Abre el reproductor para probar la experiencia de menú en tiempo real"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3.5 h-3.5 text-sky-400" />
            <span>Probar Menú</span>
          </button>

          {/* Generate Missing Screens Button */}
          {configuredCount < 6 && (
            <button
              onClick={handleGenerateMissingScreens}
              className="px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Crea automáticamente en el proyecto las pantallas de menú que aún no existen"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5 text-amber-400" />
              <span>Generar Pantallas Faltantes</span>
            </button>
          )}

          {/* Auto Layout */}
          <button
            onClick={handleAutoLayout}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
            title="Ordenar nodos automáticamente"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.transform} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-Layout</span>
          </button>

          {/* Center on Menu */}
          <button
            onClick={handleCenterOnMenu}
            className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
            title="Centrar vista en Menú Principal"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Centrar</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              title="Reducir Zoom"
            >
              -
            </button>
            <span className="text-[10px] font-mono px-1.5 text-[var(--muted)]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              title="Aumentar Zoom"
            >
              +
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] cursor-pointer transition-colors"
            title="Cerrar (Esc)"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CANVAS VIEWPORT */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleCanvasWheel}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#090b10]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* WORLD CONTAINER TRANSFORMED BY PAN & ZOOM */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: '3000px',
            height: '2000px',
          }}
        >
          {/* SVG CONNECTION CABLES */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
            <defs>
              <linearGradient id="cable-intro" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="cable-menu-play" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="cable-menu-load" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="cable-menu-settings" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="cable-menu-gallery" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Cable: Intro -> Main Menu */}
            {(() => {
              const fromPos = nodePositions.intro;
              const toPos = nodePositions.main_menu;
              if (!fromPos || !toPos) return null;

              const x1 = fromPos.x + NODE_WIDTH;
              const y1 = fromPos.y + NODE_HEIGHT / 2;
              const x2 = toPos.x;
              const y2 = toPos.y + NODE_HEIGHT / 2;
              const dx = (x2 - x1) * 0.5;

              return (
                <g key="conn-intro-menu">
                  <path
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="url(#cable-intro)"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    className="opacity-70"
                  />
                  <circle cx={x2} cy={y2} r="4" fill="#10b981" />
                </g>
              );
            })()}

            {/* Cables: Main Menu -> Sub-screens (Play, Load, Settings, Gallery) */}
            {(['play', 'load_game', 'settings', 'gallery'] as MenuScreenRole[]).map((destRole) => {
              const menuPos = nodePositions.main_menu;
              const destPos = nodePositions[destRole];
              if (!menuPos || !destPos) return null;

              const x1 = menuPos.x + NODE_WIDTH;
              const y1 = menuPos.y + 40 + (destRole === 'play' ? 30 : destRole === 'load_game' ? 65 : destRole === 'settings' ? 100 : 135);
              const x2 = destPos.x;
              const y2 = destPos.y + NODE_HEIGHT / 2;
              const dx = Math.max(60, (x2 - x1) * 0.45);

              const strokeMap: Record<string, string> = {
                play: 'url(#cable-menu-play)',
                load_game: 'url(#cable-menu-load)',
                settings: 'url(#cable-menu-settings)',
                gallery: 'url(#cable-menu-gallery)',
              };

              return (
                <g key={`conn-menu-${destRole}`}>
                  <path
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={strokeMap[destRole] || '#10b981'}
                    strokeWidth="2.5"
                    className="opacity-80 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  />
                  <circle cx={x1} cy={y1} r="3.5" fill="#10b981" />
                  <circle cx={x2} cy={y2} r="3.5" fill="#ffffff" />
                </g>
              );
            })}
          </svg>

          {/* RENDER THE 6 SYSTEM NODES */}
          {MENU_ROLES.map((def) => {
            const pos = nodePositions[def.role] || def.defaultPos;
            const assignedScene = resolvedRoleScenes[def.role];
            const isDragging = draggingRole === def.role;
            const isConfigured = Boolean(assignedScene);

            return (
              <div
                key={def.role}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  width: `${NODE_WIDTH}px`,
                }}
                className={`absolute z-20 pointer-events-auto rounded-2xl border transition-shadow duration-150 select-none ${
                  def.role === 'main_menu'
                    ? 'border-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/30'
                    : def.borderColor
                } bg-[#11141c]/95 backdrop-blur-xl ${
                  isDragging ? 'shadow-2xl scale-[1.02] cursor-grabbing' : 'shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Drag handle header */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingRole(def.role);
                    setDragOffset({
                      x: (e.clientX - pan.x) / zoom - pos.x,
                      y: (e.clientY - pan.y) / zoom - pos.y,
                    });
                    setDragCurrentPos(pos);
                  }}
                  className={`p-2.5 rounded-t-2xl flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-[var(--border)] ${def.bgColor}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: `${def.color}25`, color: def.color }}
                    >
                      <GuiIconRenderer icon={def.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide leading-tight">
                        {def.title}
                      </h4>
                      <span
                        className="text-[9px] font-mono font-bold uppercase tracking-wider block"
                        style={{ color: def.color }}
                      >
                        {def.badge}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      isConfigured
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/40'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                    }`}
                  >
                    {isConfigured ? 'Activo' : 'Sin vincular'}
                  </span>
                </div>

                {/* Node Body / Preview Box */}
                <div className="p-3 space-y-2.5">
                  {/* Visual Live Preview Card */}
                  <div
                    onClick={() => {
                      if (assignedScene) {
                        setEditingSceneId(assignedScene.id);
                        playSfx('/assets/sfx/click intro.mp3', false, 0.3);
                      }
                    }}
                    className={`h-24 rounded-xl relative overflow-hidden border border-[var(--border)] bg-black/60 flex flex-col justify-between p-2 group transition-all ${
                      assignedScene ? 'cursor-pointer hover:border-[var(--accent)] hover:scale-[1.01]' : 'opacity-60'
                    }`}
                  >
                    {assignedScene?.backgroundUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{ backgroundImage: `url(${assignedScene.backgroundUrl})` }}
                      />
                    )}

                    <div className="relative z-10 flex items-start justify-between">
                      <span className="text-[10px] font-bold text-white drop-shadow truncate max-w-[170px]">
                        {assignedScene ? assignedScene.name : 'Pantalla no vinculada'}
                      </span>
                      {assignedScene?.staticScreenConfig?.screenFx && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/70 border border-white/20 text-cyan-300">
                          FX: {assignedScene.staticScreenConfig.screenFx}
                        </span>
                      )}
                    </div>

                    {/* Preview Buttons representation */}
                    <div className="relative z-10 flex flex-col gap-1 items-center">
                      {(assignedScene?.staticScreenConfig?.buttons || []).slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className="w-full max-w-[180px] h-3 rounded bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center px-1"
                        >
                          <span className="text-[8px] font-mono text-gray-200 truncate uppercase">
                            {b.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[9px] text-gray-400">
                      <span>{assignedScene?.sceneType === 'event' ? 'Pantalla Estática' : 'Escena Narrativa'}</span>
                      {assignedScene && (
                        <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
                          <span>Editar</span>
                          <span>➜</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scene Selector Dropdown */}
                  <div>
                    <label className="text-[9px] text-[var(--muted)] font-mono block mb-1">
                      Escenario Vinculado:
                    </label>
                    <select
                      value={assignedScene?.id || ''}
                      onChange={(e) => handleAssignSceneToRole(def.role, e.target.value)}
                      className="w-full text-[11px] px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] cursor-pointer truncate"
                    >
                      <option value="">-- Sin asignar --</option>
                      {allScenes.map(({ scene: sc, chapterTitle }) => (
                        <option key={sc.id} value={sc.id}>
                          [{chapterTitle}] {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Configure Button */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {assignedScene ? (
                      assignedScene.sceneType === 'event' && assignedScene.eventSubtype === 'static' ? (
                        <button
                          onClick={() => {
                            setEditingSceneId(assignedScene.id);
                            playSfx('/assets/sfx/click intro.mp3', false, 0.3);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--accent)] hover:opacity-85 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-3.5 h-3.5" />
                          <span>Configurar Pantalla</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (onSelectScene) onSelectScene(assignedScene.id);
                            onClose();
                            playSfx('/assets/sfx/click intro.mp3', false, 0.3);
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-purple-500/50 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          title="Abrir este escenario narrativo en el editor principal"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5" />
                          <span>Editar Escenario ➜</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={handleGenerateMissingScreens}
                        className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-3.5 h-3.5" />
                        <span>Crear Pantalla</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FLOATING INFORMATIVE HUD */}
        <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
          <div className="bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] p-3 rounded-2xl shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[var(--text)]">
                Arquitectura de Menús Totalmente Personalizable
              </p>
              <p className="text-[10px] text-[var(--muted)]">
                Arrastra los nodos para organizar el mapa. Haz clic en "Configurar Pantalla" para diseñar los botones y estética con el gizmo libre.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
