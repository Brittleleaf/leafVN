"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { VNStory, VNChapter, VNScene, VNChoiceOption } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface SceneMapModalProps {
  story: VNStory;
  currentChapterId: string;
  selectedSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onUpdateStory: (newStory: VNStory) => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 160;

interface SceneConnection {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  label?: string;
  type: 'choice' | 'jump' | 'hotspot';
}

export default function SceneMapModal({
  story,
  currentChapterId,
  selectedSceneId,
  onSelectScene,
  onUpdateStory,
  onClose,
  notify = () => {},
}: SceneMapModalProps) {
  const [activeChapterId, setActiveChapterId] = useState(currentChapterId);
  const chapter = useMemo(
    () => story.chapters.find((c) => c.id === activeChapterId) || story.chapters[0],
    [story, activeChapterId]
  );

  // Escenarios disponibles en la biblioteca pero no presentes en este capítulo
  const unplacedScenarios = useMemo(() => {
    const activeIds = new Set((chapter?.scenes || []).map((s) => s.id));
    const all = story.scenarios || [];
    return all.filter((s) => !activeIds.has(s.id));
  }, [story.scenarios, chapter?.scenes]);

  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Canvas viewport navigation
  const [pan, setPan] = useState({ x: 80, y: 100 });
  const [zoom, setZoom] = useState(1);
  const [isHandTool, setIsHandTool] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragNodePos, setDragNodePos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard listener for Space bar navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onClose]);

  // Compute node positions (fallback to grid/flow if not set)
  const scenePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    if (!chapter) return positions;

    chapter.scenes.forEach((sc, idx) => {
      if (dragNodePos && dragNodePos.id === sc.id) {
        positions[sc.id] = { x: dragNodePos.x, y: dragNodePos.y };
      } else if (sc.mapPosition && Number.isFinite(sc.mapPosition.x) && Number.isFinite(sc.mapPosition.y)) {
        positions[sc.id] = sc.mapPosition;
      } else {
        // Automatic default placement: 3 columns grid
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        positions[sc.id] = {
          x: 100 + col * 360,
          y: 80 + row * 240,
        };
      }
    });

    return positions;
  }, [chapter, dragNodePos]);

  // Extract all branching connections between scenes
  const connections = useMemo(() => {
    const conns: SceneConnection[] = [];
    if (!chapter) return conns;

    const validSceneIds = new Set(chapter.scenes.map((s) => s.id));

    chapter.scenes.forEach((sc) => {
      // 1. Hotspots with targetSceneId
      sc.hotspots?.forEach((hs) => {
        if (hs.actionType === 'jump_scene' && hs.targetSceneId && validSceneIds.has(hs.targetSceneId)) {
          conns.push({
            id: `conn-hs-${hs.id}`,
            fromSceneId: sc.id,
            toSceneId: hs.targetSceneId,
            label: hs.label || 'Door/Link',
            type: 'hotspot',
          });
        }
      });

      // 2. Timeline events
      sc.timeline?.forEach((ev) => {
        if (ev.type === 'choice' && ev.options) {
          ev.options.forEach((opt: VNChoiceOption) => {
            if (opt.targetSceneId && validSceneIds.has(opt.targetSceneId)) {
              conns.push({
                id: `conn-opt-${opt.id}`,
                fromSceneId: sc.id,
                toSceneId: opt.targetSceneId,
                label: opt.label,
                type: 'choice',
              });
            }
          });
        } else if (ev.type === 'jump_scene' && ev.targetSceneId && validSceneIds.has(ev.targetSceneId)) {
          conns.push({
            id: `conn-jump-${ev.id}`,
            fromSceneId: sc.id,
            toSceneId: ev.targetSceneId,
            label: 'Automatic Jump',
            type: 'jump',
          });
        } else if (ev.type === 'conditional_branch') {
          if (ev.conditionalTargetSceneId && validSceneIds.has(ev.conditionalTargetSceneId)) {
            conns.push({
              id: `conn-branch-if-${ev.id}`,
              fromSceneId: sc.id,
              toSceneId: ev.conditionalTargetSceneId,
              label: `IF ${ev.condition?.variableKey || 'var'}`,
              type: 'jump',
            });
          }
          if (ev.elseTargetSceneId && validSceneIds.has(ev.elseTargetSceneId)) {
            conns.push({
              id: `conn-branch-else-${ev.id}`,
              fromSceneId: sc.id,
              toSceneId: ev.elseTargetSceneId,
              label: 'ELSE',
              type: 'jump',
            });
          }
        }
      });

      // 3. Static screen buttons
      if (sc.sceneType === 'event' && sc.eventSubtype === 'static' && sc.staticScreenConfig?.buttons) {
        sc.staticScreenConfig.buttons.forEach((btn) => {
          if (btn.action === 'jump_scene' && btn.targetSceneId && validSceneIds.has(btn.targetSceneId)) {
            conns.push({
              id: `conn-static-${btn.id}`,
              fromSceneId: sc.id,
              toSceneId: btn.targetSceneId,
              label: btn.label || 'Screen Button',
              type: 'jump',
            });
          }
        });
      }

      // 4. Cinematic completion jump
      if (sc.sceneType === 'event' && sc.eventSubtype === 'cinematic' && sc.cinematicConfig?.targetSceneIdOnEnd) {
        const endTarget = sc.cinematicConfig.targetSceneIdOnEnd;
        if (validSceneIds.has(endTarget)) {
          conns.push({
            id: `conn-cinematic-${sc.id}`,
            fromSceneId: sc.id,
            toSceneId: endTarget,
            label: 'On Cinematic End',
            type: 'jump',
          });
        }
      }
    });

    return conns;
  }, [chapter]);

  // Handler for mouse pan & drag
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // If clicking directly on canvas background or hand tool is active
    if (e.target === containerRef.current || isHandTool || isSpacePressed || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingNodeId && chapter) {
      const safeZoom = Number.isFinite(zoom) && zoom > 0.05 ? zoom : 1;
      const mouseCanvasX = (e.clientX - pan.x) / safeZoom;
      const mouseCanvasY = (e.clientY - pan.y) / safeZoom;
      const newX = Math.round(mouseCanvasX - dragOffset.x);
      const newY = Math.round(mouseCanvasY - dragOffset.y);

      setDragNodePos({ id: draggingNodeId, x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodeId && chapter) {
      if (dragNodePos && dragNodePos.id === draggingNodeId) {
        const finalX = dragNodePos.x;
        const finalY = dragNodePos.y;
        const updatedChapters = story.chapters.map((ch) => {
          if (ch.id !== chapter.id) return ch;
          return {
            ...ch,
            scenes: ch.scenes.map((s) => (s.id === draggingNodeId ? { ...s, mapPosition: { x: finalX, y: finalY } } : s)),
          };
        });
        const currentScenarios = story.scenarios || [];
        const updatedScenarios = currentScenarios.map((s) =>
          s.id === draggingNodeId ? { ...s, mapPosition: { x: finalX, y: finalY } } : s
        );
        onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
      }
      setDraggingNodeId(null);
      setDragNodePos(null);
      playSfx('/assets/sfx/click interface.mp3', true, 0.2);
    }
  };

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.2, Math.max(0.35, zoom * zoomFactor));

    // Zoom toward mouse pointer
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setZoom(newZoom);
    }
  };

  // Center camera on start scene
  const handleCenterOnStart = useCallback(() => {
    if (!chapter) return;
    const startScene = chapter.scenes.find((s) => s.id === chapter.startSceneId) || chapter.scenes[0];
    if (!startScene) return;

    const pos = scenePositions[startScene.id] || { x: 100, y: 100 };
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - (pos.x + NODE_WIDTH / 2) * zoom,
        y: rect.height / 2 - (pos.y + NODE_HEIGHT / 2) * zoom,
      });
      playSfx('/assets/sfx/click intro.mp3', false, 0.3);
      notify(`Camera centered on: ${startScene.name}`);
    }
  }, [chapter, scenePositions, zoom, notify]);

  // Auto layout algorithm (Tree BFS from start scene)
  const handleAutoLayout = () => {
    if (!chapter || chapter.scenes.length === 0) return;

    const visited = new Set<string>();
    const levels: Record<number, string[]> = {};
    const queue: { id: string; level: number }[] = [];

    const startId = chapter.startSceneId || chapter.scenes[0].id;
    queue.push({ id: startId, level: 0 });
    visited.add(startId);

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (!levels[level]) levels[level] = [];
      levels[level].push(id);

      // Find children
      const outConns = connections.filter((c) => c.fromSceneId === id);
      outConns.forEach((c) => {
        if (!visited.has(c.toSceneId)) {
          visited.add(c.toSceneId);
          queue.push({ id: c.toSceneId, level: level + 1 });
        }
      });
    }

    // Place remaining unreached scenes at level 0 or bottom
    const unvisited = chapter.scenes.filter((s) => !visited.has(s.id));
    if (unvisited.length > 0) {
      levels[999] = unvisited.map((s) => s.id);
    }

    const updatedScenes = chapter.scenes.map((s) => {
      let lvl = 0;
      let idxInLevel = 0;

      for (const [l, ids] of Object.entries(levels)) {
        const found = ids.indexOf(s.id);
        if (found !== -1) {
          lvl = Number(l);
          idxInLevel = found;
          break;
        }
      }

      const x = lvl === 999 ? 120 + idxInLevel * (NODE_WIDTH + 60) : 120 + lvl * (NODE_WIDTH + 140);
      const y = lvl === 999 ? 600 : 100 + idxInLevel * (NODE_HEIGHT + 60);

      return {
        ...s,
        mapPosition: { x, y },
      };
    });

    const updatedChapters = story.chapters.map((ch) =>
      ch.id === chapter.id ? { ...ch, scenes: updatedScenes } : ch
    );
    const updatedPosMap = new Map(updatedScenes.map((s) => [s.id, s.mapPosition]));
    const currentScenarios = story.scenarios || [];
    const updatedScenarios = currentScenarios.map((s) => {
      const pos = updatedPosMap.get(s.id);
      return pos ? { ...s, mapPosition: pos } : s;
    });

    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify('Auto-layout completed successfully');
  };

  // Add new scene
  const handleAddNewScene = () => {
    if (!chapter) return;
    const newId = `scene-${Date.now()}`;
    const newPos = {
      x: Math.round((-pan.x + 300) / zoom),
      y: Math.round((-pan.y + 200) / zoom),
    };

    const newScene: VNScene = {
      id: newId,
      name: `Scenario #${chapter.scenes.length + 1}`,
      backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      mapPosition: newPos,
      timeline: [
        {
          id: `ev-${Date.now()}`,
          type: 'dialogue',
          characterId: story.characters[0]?.id,
          text: 'Entering a new location...',
        },
      ],
    };

    const updatedChapters = story.chapters.map((ch) =>
      ch.id === chapter.id ? { ...ch, scenes: [...ch.scenes, newScene] } : ch
    );
    const currentScenarios = story.scenarios || [];
    const updatedScenarios = [...currentScenarios, newScene];

    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    playSfx('/assets/sfx/click intro.mp3', false, 0.4);
    notify('New scenario added to map and saved in library');
  };

  // Insert existing scenario from library
  const handleInsertFromLibrary = (sc: VNScene) => {
    if (!chapter) return;
    const newPos = {
      x: Math.round((-pan.x + 300) / zoom),
      y: Math.round((-pan.y + 200) / zoom),
    };

    const sceneToAdd: VNScene = {
      ...sc,
      mapPosition: newPos,
    };

    const updatedChapters = story.chapters.map((ch) =>
      ch.id === chapter.id ? { ...ch, scenes: [...ch.scenes, sceneToAdd] } : ch
    );
    const currentScenarios = story.scenarios || [];
    const updatedScenarios = currentScenarios.map((s) =>
      s.id === sc.id ? { ...s, mapPosition: newPos } : s
    );

    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    setShowLibraryModal(false);
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify(`Scenario "${sc.name}" inserted into map`);
  };

  // Duplicate scene
  const handleDuplicateScene = (sc: VNScene) => {
    if (!chapter) return;
    const newId = `scene-${Date.now()}`;
    const currPos = scenePositions[sc.id] || { x: 100, y: 100 };

    const clonedScene: VNScene = {
      ...JSON.parse(JSON.stringify(sc)),
      id: newId,
      name: `${sc.name} (Copy)`,
      mapPosition: { x: currPos.x + 40, y: currPos.y + 40 },
    };

    const updatedChapters = story.chapters.map((ch) =>
      ch.id === chapter.id ? { ...ch, scenes: [...ch.scenes, clonedScene] } : ch
    );
    const currentScenarios = story.scenarios || [];
    const updatedScenarios = [...currentScenarios, clonedScene];

    onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify(`Scenario duplicated: ${clonedScene.name}`);
  };

  // Remove scene from map (keeps it in scenario library)
  const handleDeleteScene = (sceneId: string) => {
    if (!chapter) return;
    if (chapter.scenes.length <= 1) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('The chapter must have at least one active scenario in its story.');
      return;
    }
    const targetScene = chapter.scenes.find((s) => s.id === sceneId);
    const confirmMsg = `Remove "${targetScene?.name || 'this scenario'}" from this chapter's map?\n\nThe scenario will NOT be deleted; it will remain saved in your scenario library so you can reuse it whenever you want.`;
    if (confirm(confirmMsg)) {
      const filtered = chapter.scenes.filter((s) => s.id !== sceneId);
      const newStart = chapter.startSceneId === sceneId ? filtered[0]?.id : chapter.startSceneId;

      // Ensure targetScene remains in story.scenarios
      const currentScenarios = story.scenarios || [];
      const updatedScenarios = targetScene && !currentScenarios.some((s) => s.id === targetScene.id)
        ? [...currentScenarios, targetScene]
        : currentScenarios;

      const updatedChapters = story.chapters.map((ch) =>
        ch.id === chapter.id ? { ...ch, scenes: filtered, startSceneId: newStart } : ch
      );
      onUpdateStory({ ...story, chapters: updatedChapters, scenarios: updatedScenarios });
      if (selectedSceneId === sceneId) {
        const nextSceneId = newStart || filtered[0]?.id;
        if (nextSceneId) onSelectScene(nextSceneId);
      }
      playSfx('/assets/sfx/glitch.mp3', false, 0.4);
      notify('Scenario removed from map (kept in library)');
    }
  };

  // Set start scene
  const handleSetStartScene = (sceneId: string) => {
    if (!chapter) return;
    const updatedChapters = story.chapters.map((ch) =>
      ch.id === chapter.id ? { ...ch, startSceneId: sceneId } : ch
    );
    onUpdateStory({ ...story, chapters: updatedChapters });
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify('Starting scenario set');
  };

  // Minimap bounding calculations
  const minimapData = useMemo(() => {
    if (!chapter || chapter.scenes.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    chapter.scenes.forEach((s) => {
      const pos = scenePositions[s.id] || { x: 0, y: 0 };
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + NODE_WIDTH);
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
    });

    const padding = 120;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = Math.max(400, maxX - minX);
    const height = Math.max(300, maxY - minY);

    return { minX, minY, width, height };
  }, [chapter, scenePositions]);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] text-[var(--text)] flex flex-col select-none overflow-hidden animate-fade-in font-sans">
      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-14 vn-glass-header border-b px-4 flex items-center justify-between shrink-0 shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GuiIconRenderer icon={GUI_ICONS.track.branch} size={20} className="text-[var(--accent)]" />
            <div>
              <h1 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <span>SCENE MAP</span>
                <span className="text-[10px] bg-[var(--accent-surface)] border border-[var(--border2)] text-[var(--accent)] px-2 py-0.5 rounded-full font-mono font-bold">
                  ROUTE-VN ENGINE
                </span>
              </h1>
              <p className="text-[10px] text-[var(--muted)]">
                Infinite canvas &bull; Drag nodes &bull; Visualize story branches
              </p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-[var(--border)] mx-2" />

          {/* Chapter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)] font-bold">Chapter:</span>
            <select
              value={activeChapterId}
              onChange={(e) => setActiveChapterId(e.target.value)}
              className="bg-[var(--well-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-md px-2.5 py-1 text-xs text-[var(--text)] font-bold focus:outline-none"
            >
              {story.chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  #{ch.number} - {ch.title} ({ch.scenes.length} scenes)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddNewScene}
            className="px-3 py-1 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] text-xs font-extrabold rounded-md flex items-center gap-1.5 transition-all shadow cursor-pointer"
          >
            <span>+</span> New Scene
          </button>

          {unplacedScenarios.length > 0 && (
            <button
              onClick={() => setShowLibraryModal(true)}
              className="px-2.5 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-600/80 text-sky-200 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title="Insert scenario saved in library that is not in this chapter"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5 text-sky-400" />
              <span>+ Insert from Library ({unplacedScenarios.length})</span>
            </button>
          )}

          <button
            onClick={handleAutoLayout}
            className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Automatically organize nodes into visual hierarchy"
          >
            <GuiIconRenderer icon={GUI_ICONS.track.branch} size={12} />
            <span>Auto-Layout</span>
          </button>

          <button
            onClick={handleCenterOnStart}
            className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-amber-500 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Center camera on starting scenario"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.target} size={12} />
            <span>Center Start</span>
          </button>
        </div>

        {/* Right Tools: Navigation & Close */}
        <div className="flex items-center gap-2">
          {/* Pan Hand Toggle */}
          <button
            onClick={() => setIsHandTool(!isHandTool)}
            className={`px-3 py-1 rounded-md text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isHandTool || isSpacePressed
                ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] border-[var(--border)]'
            }`}
            title="Hand Tool (or hold Spacebar)"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.grab} size={12} />
            <span>{isHandTool ? 'Hand Active' : 'Pan (Space)'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-2 py-0.5 gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.35, z - 0.15))}
              className="px-1.5 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <span
              onClick={() => setZoom(1)}
              className="text-[11px] font-mono text-[var(--text)] px-1 cursor-pointer hover:opacity-80"
              title="Reset to 100%"
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
              className="px-1.5 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer font-bold"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <div className="h-6 w-[1px] bg-[var(--border)] mx-1" />

          {/* Exit / Return */}
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
            <span>Return to Editor</span>
          </button>
        </div>
      </header>

      {/* 2. INFINITE CANVAS WORKSPACE */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 relative overflow-hidden bg-[var(--well-bg)] select-none ${
          isPanning ? 'cursor-grabbing' : isHandTool || isSpacePressed ? 'cursor-grab' : 'cursor-default'
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(177, 91, 228, 0.05) 0%, transparent 80%),
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: `${30 * zoom}px ${30 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* WORLD CONTAINER TRANSFORMED BY PAN & ZOOM */}
        <div
          className="absolute top-0 left-0 origin-top-left pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG CONNECTIONS LAYER */}
          <svg
            className="absolute top-0 left-0 overflow-visible pointer-events-auto"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <marker
                id="arrow-choice"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M 0 1 L 8 4 L 0 7 z" fill="#38bdf8" />
              </marker>
              <marker
                id="arrow-jump"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M 0 1 L 8 4 L 0 7 z" fill="#ef4444" />
              </marker>
              <marker
                id="arrow-hotspot"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M 0 1 L 8 4 L 0 7 z" fill="#10b981" />
              </marker>
            </defs>

            {connections.map((conn) => {
              const fromPos = scenePositions[conn.fromSceneId];
              const toPos = scenePositions[conn.toSceneId];
              if (!fromPos || !toPos) return null;

              // Source: right edge center of node
              const x1 = fromPos.x + NODE_WIDTH;
              const y1 = fromPos.y + NODE_HEIGHT / 2;

              // Target: left edge center of target node
              const x2 = toPos.x;
              const y2 = toPos.y + NODE_HEIGHT / 2;

              const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const isHovered = hoveredConnId === conn.id;
              const strokeColor =
                conn.type === 'choice'
                  ? isHovered ? '#38bdf8' : 'rgba(56, 189, 248, 0.45)'
                  : conn.type === 'hotspot'
                  ? isHovered ? '#10b981' : 'rgba(16, 185, 129, 0.45)'
                  : isHovered ? '#ef4444' : 'rgba(239, 68, 68, 0.45)';

              const markerId =
                conn.type === 'choice'
                  ? 'url(#arrow-choice)'
                  : conn.type === 'hotspot'
                  ? 'url(#arrow-hotspot)'
                  : 'url(#arrow-jump)';

              // Midpoint for label
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={conn.id} className="cursor-pointer">
                  {/* Thick invisible hit area for easy hover */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    onMouseEnter={() => setHoveredConnId(conn.id)}
                    onMouseLeave={() => setHoveredConnId(null)}
                  />

                  {/* Visible Glow Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isHovered ? 3.5 : 2}
                    strokeDasharray={conn.type === 'choice' ? '6 4' : undefined}
                    markerEnd={markerId}
                    className="transition-all"
                  />

                  {/* Midpoint Label badge on hover */}
                  {conn.label && (
                    <foreignObject
                      x={midX - 70}
                      y={midY - 14}
                      width={140}
                      height={28}
                      className="overflow-visible pointer-events-none"
                    >
                      <div
                        className={`text-[10px] px-2 py-0.5 rounded-full truncate text-center border backdrop-blur-md shadow-md transition-all flex items-center justify-center gap-1 ${
                          isHovered
                            ? 'bg-[var(--card-bg)] text-[var(--text)] border-[var(--accent)] scale-110 font-bold z-30 shadow-lg'
                            : 'bg-[var(--well-bg)] text-[var(--muted)] border-[var(--border)] opacity-85'
                        }`}
                      >
                        <GuiIconRenderer
                          icon={conn.type === 'choice' ? GUI_ICONS.track.branch : conn.type === 'hotspot' ? GUI_ICONS.action.target : GUI_ICONS.navigation.arrowRight}
                          size={10}
                        />
                        <span>{conn.label}</span>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          {/* SCENE NODES */}
          {chapter?.scenes.map((sc) => {
            const pos = scenePositions[sc.id] || { x: 100, y: 100 };
            const isSelected = sc.id === selectedSceneId;
            const isStart = sc.id === chapter.startSceneId;

            // Metrics
            const choicesCount = sc.timeline?.filter((ev) => ev.type === 'choice').length || 0;
            const hotspotsCount = sc.hotspots?.length || 0;
            const eventsCount = sc.timeline?.length || 0;

            // Dead-end detection (no choices with targets, no jump events, no door hotspots)
            const outgoingCount = connections.filter((c) => c.fromSceneId === sc.id).length;
            const isDeadEnd = outgoingCount === 0;

            return (
              <div
                key={sc.id}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${NODE_WIDTH}px`,
                }}
                className={`absolute pointer-events-auto rounded-md border backdrop-blur-xl shadow-2xl transition-shadow flex flex-col overflow-hidden ${
                  isSelected
                    ? 'border-[var(--accent)] shadow-[0_0_25px_var(--accent-glow)] ring-2 ring-[var(--accent)]/50 bg-[var(--modal-bg)] text-[var(--text)]'
                    : isStart
                    ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)] bg-[var(--modal-bg)] text-[var(--text)]'
                    : 'border-[var(--border)] hover:border-[var(--border2)] bg-[var(--card-bg)] text-[var(--text)]'
                }`}
              >
                {/* NODE HEADER (DRAG HANDLE) */}
                <div
                  onMouseDown={(e) => {
                    if (isHandTool || isSpacePressed) return;
                    e.stopPropagation();
                    setDraggingNodeId(sc.id);
                    const mouseCanvasX = (e.clientX - pan.x) / zoom;
                    const mouseCanvasY = (e.clientY - pan.y) / zoom;
                    setDragOffset({
                      x: mouseCanvasX - pos.x,
                      y: mouseCanvasY - pos.y,
                    });
                  }}
                  className="px-3 py-2 bg-[var(--well-bg)] border-b border-[var(--border)] flex items-center justify-between cursor-move"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isStart ? (
                      <span className="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                        <GuiIconRenderer icon={GUI_ICONS.general.start} className="w-3 h-3 text-black" />
                        <span>START</span>
                      </span>
                    ) : (
                      <GuiIconRenderer icon={GUI_ICONS.general.image} size={12} className="text-[var(--accent)]" />
                    )}
                    <span className="text-xs font-bold text-[var(--text)] truncate max-w-[140px]" title={sc.name}>
                      {sc.name}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono text-[var(--muted2)] truncate max-w-[60px]">
                    {sc.id.slice(-6)}
                  </span>
                </div>

                {/* THUMBNAIL PREVIEW */}
                <div className="relative h-20 w-full overflow-hidden bg-[var(--card-bg)]">
                  {sc.backgroundUrl ? (
                    <img
                      src={sc.backgroundUrl}
                      alt={sc.name}
                      className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted2)]">
                      No Background
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Status Badges */}
                  <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
                    <span className="text-[9px] bg-[var(--card-bg)] backdrop-blur-md border border-[var(--border)] text-[var(--text)] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                      <GuiIconRenderer icon={GUI_ICONS.general.pencil} size={10} />
                      <span>{eventsCount}</span>
                    </span>
                    {choicesCount > 0 && (
                      <span className="text-[9px] bg-sky-500/10 backdrop-blur-md border border-sky-500/30 text-sky-600 dark:text-sky-300 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <GuiIconRenderer icon={GUI_ICONS.track.branch} size={10} />
                        <span>{choicesCount}</span>
                      </span>
                    )}
                    {hotspotsCount > 0 && (
                      <span className="text-[9px] bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <GuiIconRenderer icon={GUI_ICONS.action.target} size={10} />
                        <span>{hotspotsCount}</span>
                      </span>
                    )}
                  </div>

                  {isDeadEnd && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold shadow-sm flex items-center gap-1">
                        <GuiIconRenderer icon={GUI_ICONS.general.circle} size={7} className="text-amber-500" />
                        <span>Branch end</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* NODE ACTIONS FOOTER */}
                <div className="p-2 bg-[var(--well-bg)] flex items-center justify-between gap-1 border-t border-[var(--border)]">
                  <button
                    onClick={() => {
                      onSelectScene(sc.id);
                      onClose();
                      playSfx('/assets/sfx/click intro.mp3', false, 0.4);
                      notify(`Editing scene: ${sc.name}`);
                    }}
                    className="flex-1 py-1 bg-[var(--accent)] hover:brightness-110 text-white rounded-lg text-[11px] font-bold border border-transparent transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.pencil} size={11} />
                    <span>Edit</span>
                  </button>

                  {!isStart && (
                    <button
                      onClick={() => handleSetStartScene(sc.id)}
                      className="px-2 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-amber-500 rounded-lg text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                      title="Set as start scene for this chapter"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.start} className="w-3 h-3" />
                      <span>Start</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDuplicateScene(sc)}
                    className="px-2 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg text-[11px] transition-colors cursor-pointer flex items-center justify-center"
                    title="Duplicate this scenario"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.copy} size={11} />
                  </button>

                  <button
                    onClick={() => handleDeleteScene(sc.id)}
                    className="px-2 py-1 bg-[var(--btn-bg)] hover:bg-red-500/10 text-[var(--muted2)] hover:text-red-500 border border-[var(--border)] rounded-lg text-[11px] transition-colors cursor-pointer flex items-center justify-center"
                    title="Delete scenario"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.trash} size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. MINIMAP OVERLAY (BOTTOM LEFT) */}
        {minimapData && (
          <div className="absolute bottom-4 left-4 w-52 h-36 bg-[var(--card-bg)] backdrop-blur-lg border border-[var(--border)] rounded-md shadow-2xl p-2 pointer-events-auto flex flex-col z-30">
            <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-bold mb-1 pb-1 border-b border-[var(--border)]">
              <span className="flex items-center gap-1">
                <GuiIconRenderer icon={GUI_ICONS.general.sitemap} size={12} className="text-[var(--accent)]" />
                <span>MINIMAP</span>
              </span>
              <span className="font-mono text-[var(--muted2)]">{chapter?.scenes.length} nodes</span>
            </div>

            {/* Radar Mini Viewport Canvas */}
            <div
              className="flex-1 relative bg-[var(--well-bg)] rounded border border-[var(--border)] overflow-hidden cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickXPercent = (e.clientX - rect.left) / rect.width;
                const clickYPercent = (e.clientY - rect.top) / rect.height;

                const worldX = minimapData.minX + clickXPercent * minimapData.width;
                const worldY = minimapData.minY + clickYPercent * minimapData.height;

                if (containerRef.current) {
                  const containerRect = containerRef.current.getBoundingClientRect();
                  setPan({
                    x: containerRect.width / 2 - worldX * zoom,
                    y: containerRect.height / 2 - worldY * zoom,
                  });
                }
              }}
            >
              {/* Mini Node Dots */}
              {chapter?.scenes.map((s) => {
                const pos = scenePositions[s.id] || { x: 0, y: 0 };
                const dotLeft = ((pos.x - minimapData.minX) / minimapData.width) * 100;
                const dotTop = ((pos.y - minimapData.minY) / minimapData.height) * 100;
                const isStart = s.id === chapter.startSceneId;
                const isSelected = s.id === selectedSceneId;

                return (
                  <div
                    key={s.id}
                    style={{
                      left: `${dotLeft}%`,
                      top: `${dotTop}%`,
                      width: '6px',
                      height: '5px',
                    }}
                    className={`absolute rounded-sm ${
                      isSelected
                        ? 'bg-[var(--accent)] ring-2 ring-[var(--accent)] z-10'
                        : isStart
                        ? 'bg-amber-400'
                        : 'bg-sky-500/70'
                    }`}
                  />
                );
              })}

              {/* Viewport Box */}
              {containerRef.current && (
                (() => {
                  const cRect = containerRef.current.getBoundingClientRect();
                  const viewWorldX = -pan.x / zoom;
                  const viewWorldY = -pan.y / zoom;
                  const viewWorldW = cRect.width / zoom;
                  const viewWorldH = cRect.height / zoom;

                  const boxLeft = Math.max(0, Math.min(100, ((viewWorldX - minimapData.minX) / minimapData.width) * 100));
                  const boxTop = Math.max(0, Math.min(100, ((viewWorldY - minimapData.minY) / minimapData.height) * 100));
                  const boxWidth = Math.max(5, Math.min(100, (viewWorldW / minimapData.width) * 100));
                  const boxHeight = Math.max(5, Math.min(100, (viewWorldH / minimapData.height) * 100));

                  return (
                    <div
                      style={{
                        left: `${boxLeft}%`,
                        top: `${boxTop}%`,
                        width: `${boxWidth}%`,
                        height: `${boxHeight}%`,
                      }}
                      className="absolute border border-[var(--accent)] bg-[var(--accent-surface)] pointer-events-none rounded-sm"
                    />
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* 4. FLOATING HINT HELPER (BOTTOM RIGHT) */}
        <div className="absolute bottom-4 right-4 bg-[var(--card-bg)] backdrop-blur-md border border-[var(--border)] text-[10px] text-[var(--muted)] px-3 py-1.5 rounded-md shadow-lg flex items-center gap-4 z-20 pointer-events-none">
          <span>
            <strong className="text-[var(--text)]">Space + Drag:</strong> Pan canvas
          </span>
          <span>
            <strong className="text-[var(--text)]">Wheel:</strong> Zoom
          </span>
          <span>
            <strong className="text-[var(--text)]">Drag header:</strong> Move node
          </span>
        </div>
      </div>

      {/* LIBRARY INSERTION MODAL */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="max-w-2xl w-full bg-[var(--card-bg)] border border-[var(--border2)] rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden backdrop-blur-xl">
            <div className="p-4 bg-[var(--well-bg)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[var(--accent-surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                  <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                    Insert Scenario into Map
                  </h3>
                  <p className="text-[10px] text-[var(--muted)]">
                    Select a scenario from your library to activate it in this chapter.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLibraryModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] text-base font-bold cursor-pointer transition-colors"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {unplacedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleInsertFromLibrary(sc)}
                  className="p-3 bg-[var(--well-bg)] hover:bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-md flex items-center gap-3 cursor-pointer transition-all shadow-sm hover:shadow group"
                >
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-[var(--card-bg)] border border-[var(--border)] shrink-0">
                    {sc.backgroundUrl ? (
                      <img src={sc.backgroundUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {sc.name}
                    </h4>
                    <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                      {sc.timeline?.length || 0} events &bull; {sc.hotspots?.length || 0} interaction hotspots
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 bg-[var(--accent)] hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase transition-colors shrink-0 shadow-sm"
                  >
                    + Insert
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
