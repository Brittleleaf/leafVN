"use client";
import React, { useState, useRef } from 'react';
import { VNStory, VNChapter, VNScene, VNHotspot, VNHotspotStyle, VNVariableMutation } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { GUI_ICONS, HOTSPOT_ICON_PRESETS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import AssetStudioModal from './AssetStudioModal';

interface HotspotStudioModalProps {
  story: VNStory;
  currentChapter: VNChapter;
  currentScene: VNScene;
  initialHotspotId?: string | null;
  onUpdateHotspots: (updatedHotspots: VNHotspot[]) => void;
  onUpdateSceneDisplayMode?: (mode: 'always' | 'after_timeline') => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export const HOTSPOT_SFX_PRESETS = [
  { name: 'Open Door (Interaction)', url: '/assets/sfx/Interactions/open door.mp3' },
  { name: 'Close Door After Entry (Interaction)', url: '/assets/sfx/Interactions/close door after entry.mp3' },
  { name: 'Open Drawer / Cabinet (Interaction)', url: '/assets/sfx/Interactions/drawer open.mp3' },
  { name: 'Item Select / Pick Up', url: '/assets/sfx/Item select.mp3' },
  { name: 'Open Folder / Dossier', url: '/assets/sfx/open folder.mp3' },
  { name: 'Terminal / Console Beep', url: '/assets/sfx/click intro.mp3' },
  { name: 'Soft Interface Click', url: '/assets/sfx/click interface.mp3' },
  { name: 'System Glitch / Static', url: '/assets/sfx/corrupt file.mp3' },
  { name: 'Error / Lockout Alert', url: '/assets/sfx/ERROR RING.mp3' },
  { name: 'Turn Page / Note', url: '/assets/sfx/flip page.mp3' },
  { name: 'Success / Item Acquired', url: '/assets/sfx/success.mp3' },
];

export default function HotspotStudioModal({
  story,
  currentChapter,
  currentScene,
  initialHotspotId,
  onUpdateHotspots,
  onUpdateSceneDisplayMode,
  onClose,
  notify = () => {},
}: HotspotStudioModalProps) {
  const hotspots: VNHotspot[] = currentScene.hotspots || [];
  const [selectedHsId, setSelectedHsId] = useState<string>(
    initialHotspotId || (hotspots[0]?.id ?? '')
  );
  const [showScenePreview, setShowScenePreview] = useState<boolean>(false);
  const [showSfxGallery, setShowSfxGallery] = useState<boolean>(false);
  const [draggingHsId, setDraggingHsId] = useState<string | null>(null);

  const miniCanvasRef = useRef<HTMLDivElement>(null);
  const fullPreviewCanvasRef = useRef<HTMLDivElement>(null);

  const activeHs = hotspots.find((h) => h.id === selectedHsId) || hotspots[0];

  const cleanupDragRef = useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      cleanupDragRef.current?.();
    };
  }, []);

  const handleUpdateActiveHs = (patch: Partial<VNHotspot>) => {
    if (!activeHs) return;
    const cleanPatch = { ...patch };
    if (cleanPatch.xPercent !== undefined) {
      cleanPatch.xPercent = Number.isFinite(cleanPatch.xPercent) ? Math.max(0, Math.min(100, Math.round(cleanPatch.xPercent * 10) / 10)) : 50;
    }
    if (cleanPatch.yPercent !== undefined) {
      cleanPatch.yPercent = Number.isFinite(cleanPatch.yPercent) ? Math.max(0, Math.min(100, Math.round(cleanPatch.yPercent * 10) / 10)) : 50;
    }
    if (cleanPatch.scale !== undefined) {
      cleanPatch.scale = Number.isFinite(cleanPatch.scale) ? Math.max(0.1, Math.min(5, Math.round(cleanPatch.scale * 100) / 100)) : 1;
    }
    if (cleanPatch.iconSize !== undefined) {
      cleanPatch.iconSize = Number.isFinite(cleanPatch.iconSize) ? Math.max(16, Math.min(256, Math.round(cleanPatch.iconSize))) : 64;
    }
    const updated = hotspots.map((h) => (h.id === activeHs.id ? { ...h, ...cleanPatch } : h));
    onUpdateHotspots(updated);
  };

  // Free drag handling over canvas container
  const startDragOnCanvas = (
    e: React.PointerEvent,
    hsId: string,
    canvasElement: HTMLDivElement | null
  ) => {
    const targetHs = hotspots.find((h) => h.id === hsId);
    if (e.button !== 0 || !canvasElement || targetHs?.locked) return;
    e.preventDefault();
    e.stopPropagation();

    setSelectedHsId(hsId);
    setDraggingHsId(hsId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const rect = canvasElement.getBoundingClientRect();
      const rawX = ((moveEvent.clientX - rect.left) / (rect.width || 1)) * 100;
      const rawY = ((moveEvent.clientY - rect.top) / (rect.height || 1)) * 100;
      const clampedX = Math.max(2, Math.min(98, Math.round(rawX)));
      const clampedY = Math.max(2, Math.min(98, Math.round(rawY)));

      const updated = hotspots.map((h) =>
        h.id === hsId ? { ...h, xPercent: clampedX, yPercent: clampedY } : h
      );
      onUpdateHotspots(updated);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      cleanupDragRef.current = null;
      setDraggingHsId(null);
      playSfx('/assets/sfx/click intro.mp3', false, 0.2);
    };

    cleanupDragRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleMiniCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeHs || !miniCanvasRef.current) return;
    const rect = miniCanvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const rectW = rect.width || 1;
    const rectH = rect.height || 1;
    const xPercent = Math.max(2, Math.min(98, Math.round((clickX / rectW) * 100)));
    const yPercent = Math.max(2, Math.min(98, Math.round((clickY / rectH) * 100)));
    handleUpdateActiveHs({ xPercent, yPercent });
    playSfx('/assets/sfx/click interface.mp3', true, 0.2);
  };

  const handleCreateNewHotspot = () => {
    const newId = `hs-${Date.now()}`;
    const newHs: VNHotspot = {
      id: newId,
      label: `Button #${hotspots.length + 1}`,
      style: 'door',
      icon: GUI_ICONS.action.entryDoor,
      xPercent: 50,
      yPercent: 50,
      actionType: 'jump_scene',
      targetSceneId: currentChapter.scenes.find((s) => s.id !== currentScene.id)?.id || currentScene.id,
      sfxUrl: '/assets/sfx/open folder.mp3',
    };
    onUpdateHotspots([...hotspots, newHs]);
    setSelectedHsId(newId);
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    notify('New navigation button created');
  };

  const handleDeleteHotspot = (id: string) => {
    if (confirm('Delete this interaction button?')) {
      const filtered = hotspots.filter((h) => h.id !== id);
      onUpdateHotspots(filtered);
      if (filtered.length > 0) {
        setSelectedHsId(filtered[0].id);
      } else {
        setSelectedHsId('');
      }
      playSfx('/assets/sfx/click interface.mp3', true, 0.3);
      notify('Button deleted');
    }
  };

  const setCornerPosition = (corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') => {
    switch (corner) {
      case 'top-left':
        handleUpdateActiveHs({ xPercent: 10, yPercent: 15 });
        break;
      case 'top-right':
        handleUpdateActiveHs({ xPercent: 80, yPercent: 15 });
        break;
      case 'bottom-left':
        handleUpdateActiveHs({ xPercent: 10, yPercent: 80 });
        break;
      case 'bottom-right':
        handleUpdateActiveHs({ xPercent: 80, yPercent: 80 });
        break;
      case 'center':
        handleUpdateActiveHs({ xPercent: 45, yPercent: 48 });
        break;
    }
    playSfx('/assets/sfx/click interface.mp3', true, 0.2);
  };

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans">
      <div className="max-w-4xl w-full vn-modal-card flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden text-[var(--text)]">
        
        {/* HEADER */}
        <div className="p-4 vn-glass-header border-b flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
                <span>INTERACTION & BUTTON SETTINGS</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[var(--btn-bg)] text-[var(--accent)] border border-[var(--border)]">
                  {hotspots.length} in scene
                </span>
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                Define doors to other scenes, terminals, or interactive inspection points.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
            title="Close"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MAIN BODY (2 COLUMNS) */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 overflow-hidden">
          
          {/* LEFT COLUMN: BUTTON LIST */}
          <div className="w-full md:w-1/3 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-[var(--border)] pr-0 md:pr-4">
            {onUpdateSceneDisplayMode && (
              <div className="p-2.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-1.5 shrink-0 shadow-sm">
                <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Button Visibility in Scene:</span>
                </span>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSceneDisplayMode('always');
                      notify('Buttons configured as permanent on screen');
                    }}
                    className={`p-1.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      (currentScene.hotspotsDisplayMode || 'always') === 'always'
                        ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                        : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                    }`}
                  >
                    Constant (Always)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSceneDisplayMode('after_timeline');
                      notify('Buttons configured for exploration mode after script');
                    }}
                    className={`p-1.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      currentScene.hotspotsDisplayMode === 'after_timeline'
                        ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                        : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                    }`}
                  >
                    After Script End
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                Active Buttons:
              </span>
              <button
                type="button"
                onClick={handleCreateNewHotspot}
                className="px-2.5 py-1 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-lg text-xs font-extrabold cursor-pointer transition-colors shadow flex items-center gap-1"
              >
                <span>+</span> Add Button
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {hotspots.length === 0 ? (
                <div className="p-4 border border-dashed border-[var(--border)] rounded-2xl text-center space-y-2 my-auto bg-[var(--well-bg)]">
                  <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-8 h-8 mx-auto text-[var(--accent)] opacity-60" />
                  <p className="text-xs text-[var(--muted)]">No buttons in this scene.</p>
                  <button
                    type="button"
                    onClick={handleCreateNewHotspot}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-bold rounded-xl text-xs cursor-pointer shadow"
                  >
                    + Create First Button
                  </button>
                </div>
              ) : (
                hotspots.map((hs, idx) => {
                  const isSelected = hs.id === selectedHsId;
                  const targetSc = hs.targetSceneId ? currentChapter.scenes.find((s) => s.id === hs.targetSceneId) : null;

                  return (
                    <div
                      key={hs.id}
                      onClick={() => {
                        setSelectedHsId(hs.id);
                        playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-surface)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                          : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border2)] hover:bg-[var(--panel-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-[var(--well-bg)] rounded-xl border border-[var(--border)] p-1 text-[var(--accent)]">
                          <GuiIconRenderer icon={hs.icon || GUI_ICONS.action.entryDoor} className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-[var(--text)] block truncate">
                            {hs.label}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] font-mono block truncate">
                            {hs.actionType === 'jump_scene' ? (
                              `➔ Scene: ${targetSc?.name || 'Unassigned'}`
                            ) : hs.actionType === 'inspect' ? (
                              <span className="inline-flex items-center gap-1">
                                <GuiIconRenderer icon={GUI_ICONS.general.search} className="w-3 h-3 text-[var(--accent)] inline" />
                                <span>Inspection</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3 h-3 text-[var(--accent)] inline" />
                                <span>Dialogue</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono text-[var(--muted2)] shrink-0">
                        ({hs.xPercent}%, {hs.yPercent}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SELECTED BUTTON EDITOR */}
          <div className="flex-1 overflow-y-auto space-y-4 pl-0 md:pl-2">
            {activeHs ? (
              <div className="space-y-4 text-xs">
                {/* 1. Name & Style */}
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                      Button Visual Identity:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteHotspot(activeHs.id)}
                      className="text-[var(--muted2)] hover:text-rose-500 text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                      <span>Delete this button</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                        On-Screen Display Text *:
                      </label>
                      <input
                        type="text"
                        value={activeHs.label}
                        onChange={(e) => handleUpdateActiveHs({ label: e.target.value })}
                        placeholder="e.g. Open Door, Quantum Terminal..."
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl p-2.5 text-xs text-[var(--text)] font-bold outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                        Vector GUI Icon:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[var(--well-bg)] border border-[var(--border)] flex items-center justify-center shrink-0 p-1 text-[var(--accent)]">
                          <GuiIconRenderer icon={activeHs.icon || GUI_ICONS.action.entryDoor} className="w-6 h-6" />
                        </div>
                        <input
                          type="text"
                          value={activeHs.icon || ''}
                          placeholder="SVG Path or Icon..."
                          onChange={(e) => handleUpdateActiveHs({ icon: e.target.value })}
                          className="flex-1 min-w-0 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick SVG vector icon selector */}
                  <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                    <span className="text-[9px] text-[var(--muted)] uppercase font-bold tracking-wider block">
                      Available Vector Presets (GUI Icons Collection):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {HOTSPOT_ICON_PRESETS.map((preset) => {
                        const isChosen = activeHs.icon === preset.url;
                        return (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => {
                              handleUpdateActiveHs({ icon: preset.url });
                              playSfx('/assets/sfx/click interface.mp3', true, 0.2);
                            }}
                            className={`p-1.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                              isChosen
                                ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] ring-1 ring-[var(--accent)]/40'
                                : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                            }`}
                          >
                            <div className="w-6 h-6 shrink-0 flex items-center justify-center bg-[var(--card-bg)] rounded-lg p-0.5 border border-[var(--border)] text-[var(--accent)]">
                              <GuiIconRenderer icon={preset.url} className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-medium truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1.5 SVG Vector Icon Size and Live Previewer */}
                  <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-[var(--text)] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.resize} className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>SVG Button Size ({activeHs.iconSize || 64}px):</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowScenePreview(true)}
                        className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-xl text-[11px] font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5" />
                        <span>Preview in Scene</span>
                      </button>
                    </div>

                    {/* Size slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--muted)] font-mono">32px</span>
                      <input
                        type="range"
                        min="32"
                        max="140"
                        step="4"
                        value={activeHs.iconSize || 64}
                        onChange={(e) => handleUpdateActiveHs({ iconSize: Number(e.target.value) })}
                        className="flex-1 accent-[var(--accent)] cursor-pointer"
                      />
                      <span className="text-[10px] text-[var(--muted)] font-mono">140px</span>
                    </div>

                    {/* Quick size presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] text-[var(--muted)] uppercase font-bold mr-1">Presets:</span>
                      {[
                        { label: 'Small', size: 40 },
                        { label: 'Normal', size: 56 },
                        { label: 'Large', size: 72 },
                        { label: 'Extra', size: 96 },
                        { label: 'Huge', size: 120 },
                      ].map((preset) => (
                        <button
                          key={preset.size}
                          type="button"
                          onClick={() => {
                            handleUpdateActiveHs({ iconSize: preset.size });
                            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            (activeHs.iconSize || 64) === preset.size
                              ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)]'
                              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {preset.label} ({preset.size}px)
                        </button>
                      ))}
                    </div>

                    {/* Interactive preview with scene background */}
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-800 relative bg-black/90 aspect-video max-h-48 flex items-center justify-center group shadow-inner">
                      {currentScene.backgroundUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-65"
                          style={{ backgroundImage: `url('${currentScene.backgroundUrl}')` }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px] pointer-events-none" />
                      
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/85 border border-gray-800 text-[9px] text-sky-300 font-mono">
                        PREVIEW (Hover cursor over SVG)
                      </div>

                      {/* SVG Only as rendered in-game */}
                      <div className="relative z-10 flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 group-hover:scale-125 select-none">
                        <div
                          style={{
                            width: `${activeHs.iconSize || 64}px`,
                            height: `${activeHs.iconSize || 64}px`,
                          }}
                          className="flex items-center justify-center filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] hover:drop-shadow-[0_0_24px_rgba(56,189,248,0.9)] transition-all"
                        >
                          <GuiIconRenderer
                            icon={activeHs.icon || GUI_ICONS.action.entryDoor}
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                          />
                        </div>
                        <span className="mt-1 text-[11px] font-bold tracking-wider text-white uppercase filter drop-shadow-[0_2px_5px_rgba(0,0,0,1)] select-none">
                          {activeHs.label || 'Action Button'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Action when pressed */}
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-3.5 shadow-sm">
                  <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider block">
                    What happens when pressed? *:
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveHs({ actionType: 'jump_scene' })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeHs.actionType === 'jump_scene'
                          ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                          : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.action.entryDoor} className="w-3.5 h-3.5" />
                      <span>Enter Scene</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveHs({ actionType: 'inspect' })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeHs.actionType === 'inspect'
                          ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                          : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.search} className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveHs({ actionType: 'trigger_dialogue' })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        activeHs.actionType === 'trigger_dialogue'
                          ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                          : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5" />
                      <span>Dialogue</span>
                    </button>
                  </div>

                  {/* Action Config: jump_scene */}
                  {activeHs.actionType === 'jump_scene' && (
                    <div className="pt-2 space-y-2 border-t border-[var(--border)]">
                      <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                        Target Scene:
                      </label>
                      <select
                        value={activeHs.targetSceneId || ''}
                        onChange={(e) => handleUpdateActiveHs({ targetSceneId: e.target.value })}
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl p-2.5 text-xs text-[var(--accent)] font-bold outline-none transition-colors"
                      >
                        <option value="">-- Choose target scene --</option>
                        {story?.chapters && story.chapters.length > 1
                          ? story.chapters.map((ch) => (
                              <optgroup key={ch.id} label={`Chapter ${ch.number || ''}: ${ch.title}`}>
                                {ch.scenes.map((sc) => (
                                  <option key={sc.id} value={sc.id}>
                                    {sc.name} {sc.id === currentScene.id ? '(Current)' : ''}
                                  </option>
                                ))}
                              </optgroup>
                            ))
                          : currentChapter.scenes.map((sc) => (
                              <option key={sc.id} value={sc.id}>
                                {sc.name} {sc.id === currentScene.id ? '(Current)' : ''}
                              </option>
                            ))}
                      </select>
                    </div>
                  )}

                  {/* Action Config: inspect */}
                  {activeHs.actionType === 'inspect' && (
                    <div className="pt-2 space-y-2 border-t border-[var(--border)]">
                      <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                        Inspection Text (what the player reads when activating):
                      </label>
                      <textarea
                        rows={3}
                        value={activeHs.inspectText || ''}
                        onChange={(e) => handleUpdateActiveHs({ inspectText: e.target.value })}
                        placeholder="e.g. You approach the blast door. It seems locked by a quantum reader..."
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl p-2.5 text-xs text-[var(--text)] outline-none resize-none transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* 2.5 Persistence / Interaction Frequency (Permanent vs Once) */}
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 shadow-sm">
                  <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.general.transform} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Persistence / Interaction Frequency:</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveHs({ interactionLimit: 'permanent' })}
                      className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-colors cursor-pointer flex flex-col gap-1 ${
                        (activeHs.interactionLimit || 'permanent') === 'permanent'
                          ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-sm'
                          : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.transform} className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Permanent</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)] font-normal leading-tight">
                        Constant button: player can interact with it as many times as desired.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateActiveHs({ interactionLimit: 'once' })}
                      className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-colors cursor-pointer flex flex-col gap-1 ${
                        activeHs.interactionLimit === 'once'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200 shadow-sm'
                          : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-amber-500" />
                        <span>One-Time</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)] font-normal leading-tight">
                        Single use: executing the action consumes the button and removes it from screen.
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3. Sound Effect (SFX on press) */}
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Sound Effect on Press:</span>
                    </span>
                    {activeHs.sfxUrl && (
                      <button
                        type="button"
                        onClick={() => playSfx(activeHs.sfxUrl!, false, 0.7)}
                        className="text-xs text-[var(--accent)] hover:text-[var(--text)] font-bold flex items-center gap-1 cursor-pointer bg-[var(--well-bg)] px-2 py-0.5 rounded-lg border border-[var(--border)]"
                        title="Test sound now"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3 h-3" />
                        <span>Play</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-[var(--muted)] uppercase block mb-0.5">Quick Preset:</label>
                      <select
                        value={activeHs.sfxUrl || ''}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          handleUpdateActiveHs({ sfxUrl: chosen || undefined });
                          if (chosen) playSfx(chosen, false, 0.6);
                        }}
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] outline-none"
                      >
                        <option value="">-- No special sound (Default) --</option>
                        {HOTSPOT_SFX_PRESETS.map((p, pIdx) => (
                          <option key={pIdx} value={p.url}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[9px] text-[var(--muted)] uppercase">SFX Effect / URL:</label>
                        <button
                          type="button"
                          onClick={() => setShowSfxGallery(true)}
                          className="px-2.5 py-0.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1.5 transition"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3 h-3 text-[var(--accent)]" />
                          <span>SFX Gallery</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={activeHs.sfxUrl || ''}
                          onChange={(e) => handleUpdateActiveHs({ sfxUrl: e.target.value })}
                          placeholder="/assets/sfx/... or https://..."
                          className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)]"
                        />
                        {activeHs.sfxUrl && (
                          <button
                            type="button"
                            onClick={() => playSfx(activeHs.sfxUrl!, false, 0.6)}
                            className="px-2.5 py-1.5 bg-[var(--well-bg)] border border-[var(--border)] hover:bg-[var(--btn-hover-bg)] text-[var(--accent)] rounded-xl text-xs cursor-pointer flex items-center justify-center"
                            title="Test sound"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.media.play} size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Screen Position with Free and Interactive Drag */}
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GuiIconRenderer icon={GUI_ICONS.general.grab} className="w-4 h-4 text-[var(--accent)]" />
                      <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider">
                        Free Placement on Scene (Drag the Button):
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--accent)] font-bold bg-[var(--well-bg)] px-2 py-0.5 rounded-lg border border-[var(--border)]">
                      X: {activeHs.xPercent}% • Y: {activeHs.yPercent}%
                    </span>
                  </div>

                  {/* REAL-TIME INTERACTIVE FREE DRAG CANVAS */}
                  <div
                    ref={miniCanvasRef}
                    onClick={handleMiniCanvasClick}
                    style={{ aspectRatio: '16 / 9' }}
                    className="relative w-full aspect-video shrink-0 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--well-bg)] shadow-inner cursor-crosshair group select-none"
                    title="Click anywhere to place the button or drag it freely"
                  >
                    {/* Scene background */}
                    {currentScene.backgroundUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-85 pointer-events-none"
                        style={{ backgroundImage: `url('${currentScene.backgroundUrl}')` }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                    {/* Subtle reference grid (rule of thirds) */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/5">
                      <div className="border-r border-b border-white/10" />
                      <div className="border-r border-b border-white/10" />
                      <div className="border-b border-white/10" />
                      <div className="border-r border-b border-white/10" />
                      <div className="border-r border-b border-white/10" />
                      <div className="border-b border-white/10" />
                      <div className="border-r border-b border-white/10" />
                      <div className="border-r border-b border-white/10" />
                      <div />
                    </div>

                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-[var(--card-bg)]/90 backdrop-blur-sm border border-[var(--border)] text-[9px] text-[var(--text)] font-bold uppercase tracking-wider pointer-events-none flex items-center gap-1.5 shadow-md">
                      <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3 h-3 text-[var(--accent)]" />
                      <span>Click or drag the button to position freely</span>
                    </div>

                    {/* All scene buttons */}
                    {hotspots.map((hs) => {
                      const isSelected = hs.id === activeHs.id;
                      const isDraggingThis = draggingHsId === hs.id;
                      const iconSize = Math.max(28, Math.min(64, (hs.iconSize || 64) * 0.7)); // Proportional visual scale for mini-canvas
                      const iconUrl = hs.icon || GUI_ICONS.action.entryDoor;

                      return (
                        <div
                          key={hs.id}
                          onPointerDown={(e) => startDragOnCanvas(e, hs.id, miniCanvasRef.current)}
                          style={{
                            left: `${hs.xPercent}%`,
                            top: `${hs.yPercent}%`,
                            transform: `translate(-50%, -50%) rotate(${hs.rotation ?? 0}deg) scale(${
                              (hs.scale ?? 1) * (hs.flipX ? -1 : 1)
                            }, ${hs.scale ?? 1})`,
                            transformOrigin: '50% 50%',
                          }}
                          className={`absolute z-20 flex flex-col items-center justify-center transition-all duration-75 select-none ${
                            isSelected
                              ? 'cursor-grab active:cursor-grabbing scale-110 z-30'
                              : 'cursor-pointer opacity-60 hover:opacity-100 hover:scale-105'
                          }`}
                          title={`Button: ${hs.label}. Drag to move.`}
                        >
                          {/* Floating coordinate indicator while dragging */}
                          {isDraggingThis && (
                            <div className="absolute -top-7 px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--accent)] text-[var(--accent)] rounded text-[9px] font-mono font-bold tracking-tight shadow-xl whitespace-nowrap pointer-events-none animate-bounce">
                              X: {hs.xPercent}% | Y: {hs.yPercent}%
                            </div>
                          )}

                          <div
                            style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                            className={`flex items-center justify-center transition-all ${
                              isSelected
                                ? 'filter drop-shadow-[0_0_16px_rgba(78,160,255,0.8)] scale-110'
                                : 'filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
                            }`}
                          >
                            <GuiIconRenderer icon={iconUrl} className="w-full h-full object-contain" />
                          </div>

                          <span className={`mt-0.5 text-[9px] font-bold tracking-wider uppercase pointer-events-none truncate max-w-[100px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${
                            isSelected
                              ? 'text-[var(--accent)] font-extrabold'
                              : 'text-white'
                          }`}>
                            {hs.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick corner buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold mr-1">Quick Positions:</span>
                    <button
                      type="button"
                      onClick={() => setCornerPosition('top-left')}
                      className="px-2 py-1 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text)] cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowUp} size={10} className="-rotate-45 text-[var(--accent)]" />
                      <span>Top Left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCornerPosition('top-right')}
                      className="px-2 py-1 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text)] cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowUp} size={10} className="rotate-45 text-[var(--accent)]" />
                      <span>Top Right</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCornerPosition('bottom-left')}
                      className="px-2 py-1 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text)] cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowDown} size={10} className="rotate-45 text-[var(--accent)]" />
                      <span>Bottom Left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCornerPosition('bottom-right')}
                      className="px-2 py-1 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text)] cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.navigation.arrowDown} size={10} className="-rotate-45 text-[var(--accent)]" />
                      <span>Bottom Right</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCornerPosition('center')}
                      className="px-2 py-1 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] rounded-lg text-[11px] text-[var(--text)] cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3 h-3 text-[var(--accent)]" />
                      <span>Center</span>
                    </button>
                  </div>

                  {/* Fine numeric adjustment sliders */}
                  <details className="pt-2 border-t border-[var(--border)] group">
                    <summary className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-3 h-3 text-[var(--accent)]" />
                        <span>Precise Numeric Adjustment (Sliders)</span>
                      </span>
                      <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[9px] text-[var(--muted)] uppercase block mb-1">
                          Horizontal Position X ({activeHs.xPercent}%)
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="98"
                          value={activeHs.xPercent}
                          onChange={(e) => handleUpdateActiveHs({ xPercent: Number(e.target.value) })}
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[var(--muted)] uppercase block mb-1">
                          Vertical Position Y ({activeHs.yPercent}%)
                        </label>
                        <input
                          type="range"
                          min="2"
                          max="98"
                          value={activeHs.yPercent}
                          onChange={(e) => handleUpdateActiveHs({ yPercent: Number(e.target.value) })}
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] text-[var(--muted)] uppercase">
                            Scale ({Math.round((activeHs.scale ?? 1) * 100)}%)
                          </label>
                          {(activeHs.scale !== undefined && activeHs.scale !== 1) && (
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveHs({ scale: 1 })}
                              className="text-[9px] text-[var(--accent)] hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.05"
                          value={activeHs.scale ?? 1}
                          onChange={(e) => handleUpdateActiveHs({ scale: Number(e.target.value) })}
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[9px] text-[var(--muted)] uppercase">
                            Rotation ({activeHs.rotation ?? 0}°)
                          </label>
                          {(activeHs.rotation !== undefined && activeHs.rotation !== 0) && (
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveHs({ rotation: 0 })}
                              className="text-[9px] text-[var(--accent)] hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={activeHs.rotation ?? 0}
                          onChange={(e) => handleUpdateActiveHs({ rotation: Number(e.target.value) })}
                          className="w-full accent-[var(--accent)] cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => {
                            const next = !activeHs.flipX;
                            handleUpdateActiveHs({ flipX: next });
                            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center ${
                            activeHs.flipX
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {activeHs.flipX ? '↔ Flipped Horizontal' : '↔ Flip Horizontal'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const next = !activeHs.locked;
                            handleUpdateActiveHs({ locked: next });
                            playSfx(next ? '/assets/sfx/click intro.mp3' : '/assets/sfx/click interface.mp3', false, 0.2);
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center ${
                            activeHs.locked
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {activeHs.locked ? '🔒 Locked (Frozen)' : '🔓 Lock Element'}
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* 5. Requirements and Locks (Conditions) */}
                <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Security Requirement / Lock (Optional):</span>
                    </span>
                    {activeHs.condition ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateActiveHs({ condition: undefined })}
                        className="text-rose-500 text-[10px] hover:underline cursor-pointer"
                      >
                        Remove lock
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateActiveHs({
                            condition: {
                              variableKey: story.variables?.[0]?.key || 'key',
                              operator: '==',
                              value: true,
                            },
                          })
                        }
                        className="text-[var(--accent)] text-[10px] font-bold hover:underline cursor-pointer"
                      >
                        + Lock with Condition
                      </button>
                    )}
                  </div>

                  {activeHs.condition && (
                    <div className="p-3 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-[var(--muted)] uppercase">Required Variable:</label>
                          <input
                            type="text"
                            value={activeHs.condition.variableKey}
                            onChange={(e) =>
                              handleUpdateActiveHs({
                                condition: { ...activeHs.condition!, variableKey: e.target.value },
                              })
                            }
                            placeholder="e.g. access_key"
                            className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-[var(--muted)] uppercase">Operator:</label>
                          <select
                            value={activeHs.condition.operator}
                            onChange={(e) =>
                              handleUpdateActiveHs({
                                condition: { ...activeHs.condition!, operator: e.target.value as any },
                              })
                            }
                            className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] outline-none"
                          >
                            <option value="==">== (Equal to)</option>
                            <option value="!=">!= (Not equal)</option>
                            <option value=">">&gt; (Greater than)</option>
                            <option value="<">&lt; (Less than)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-[var(--muted)] uppercase">Required Value:</label>
                          <input
                            type="text"
                            value={String(activeHs.condition.value)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const parsed = val === 'true' ? true : val === 'false' ? false : !isNaN(Number(val)) ? Number(val) : val;
                              handleUpdateActiveHs({
                                condition: { ...activeHs.condition!, value: parsed },
                              });
                            }}
                            placeholder="true, 10, etc."
                            className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--muted2)] text-xs">
                Select or create a button on the left to configure its action.
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end pt-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-bold rounded-xl text-xs uppercase cursor-pointer transition-all shadow flex items-center gap-1.5"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.check} size={14} className="text-[#0F0503]" />
            <span>Save and Close</span>
          </button>
        </div>

      </div>

      {/* FULLSCREEN SCENE PREVIEW MODAL */}
      {showScenePreview && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in font-sans">
          {/* Top preview control bar */}
          <div className="w-full max-w-5xl bg-black/90 border border-sky-600/70 rounded-2xl p-3 flex items-center justify-between backdrop-blur-md shadow-2xl z-20">
            <div className="flex items-center gap-3">
              <GuiIconRenderer icon={GUI_ICONS.general.eye} size={20} className="text-sky-400" />
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
                  Live Scene Preview: "{currentScene.name}"
                </span>
                <span className="text-[10px] text-gray-400">
                  Preview clean buttons (SVG only) and adjust size live.
                </span>
              </div>
            </div>

            {activeHs && (
              <div className="flex items-center gap-3 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800">
                <span className="text-[11px] text-gray-300 font-bold whitespace-nowrap">
                  Size ({activeHs.iconSize || 64}px):
                </span>
                <input
                  type="range"
                  min="32"
                  max="140"
                  step="4"
                  value={activeHs.iconSize || 64}
                  onChange={(e) => handleUpdateActiveHs({ iconSize: Number(e.target.value) })}
                  className="w-32 accent-sky-500 cursor-pointer"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowScenePreview(false)}
              className="px-4 py-1.5 bg-red-950/80 hover:bg-red-800 border border-red-600 text-red-200 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all shadow"
            >
              ✕ Close Preview
            </button>
          </div>

          {/* Interactive preview canvas with free drag */}
          <div
            ref={fullPreviewCanvasRef}
            onClick={(e) => {
              if (!activeHs || !fullPreviewCanvasRef.current) return;
              const rect = fullPreviewCanvasRef.current.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;
              const xPercent = Math.max(2, Math.min(98, Math.round((clickX / rect.width) * 100)));
              const yPercent = Math.max(2, Math.min(98, Math.round((clickY / rect.height) * 100)));
              handleUpdateActiveHs({ xPercent, yPercent });
              playSfx('/assets/sfx/click interface.mp3', true, 0.2);
            }}
            style={{ aspectRatio: '16 / 9' }}
            className="relative w-full max-w-5xl aspect-video shrink-0 rounded-2xl overflow-hidden border-2 border-sky-600/50 shadow-[0_0_50px_rgba(0,0,0,0.9)] my-auto bg-black cursor-crosshair select-none"
          >
            {currentScene.backgroundUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url('${currentScene.backgroundUrl}')` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40 pointer-events-none" />

            {/* Render all clean hotspots with interactive drag */}
            {hotspots.map((hs) => {
              const iconSize = hs.iconSize || 64;
              const isCurrent = hs.id === activeHs?.id;
              const isDraggingThis = draggingHsId === hs.id;
              const iconUrl = hs.icon || GUI_ICONS.action.entryDoor;

              return (
                <div
                  key={hs.id}
                  onPointerDown={(e) => startDragOnCanvas(e, hs.id, fullPreviewCanvasRef.current)}
                  style={{
                    left: `${hs.xPercent}%`,
                    top: `${hs.yPercent}%`,
                    transform: `translate(-50%, -50%) rotate(${hs.rotation ?? 0}deg) scale(${
                      (hs.scale ?? 1) * (hs.flipX ? -1 : 1)
                    }, ${hs.scale ?? 1})`,
                    transformOrigin: '50% 50%',
                  }}
                  className={`absolute group flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 z-20 select-none ${
                    isCurrent ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-transparent rounded-full scale-105 z-30' : ''
                  }`}
                  title="Drag this button to move"
                >
                  {/* Real-time coordinates while dragging */}
                  {isDraggingThis && (
                    <div className="absolute -top-7 px-2.5 py-0.5 bg-black/95 border border-sky-400 text-sky-300 rounded text-[10px] font-mono font-bold tracking-tight shadow-2xl whitespace-nowrap pointer-events-none animate-bounce">
                      X: {hs.xPercent}% | Y: {hs.yPercent}%
                    </div>
                  )}

                  <div
                    style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                    className="relative flex items-center justify-center transition-all duration-300 group-hover:scale-125 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] group-hover:drop-shadow-[0_0_24px_rgba(56,189,248,0.85)]"
                  >
                    <GuiIconRenderer icon={iconUrl} className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
                  </div>

                  <div className="mt-1 flex flex-col items-center pointer-events-none transition-all duration-200 opacity-95 group-hover:opacity-100 group-hover:scale-105">
                    <span className="text-[11px] font-bold tracking-wider text-white uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      {hs.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-gray-400 text-xs text-center flex items-center justify-center gap-2">
            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-sky-400" />
            <span>Click anywhere to place the button or <strong>drag it freely</strong> across the background.</span>
          </div>
        </div>
      )}

      {showSfxGallery && (
        <AssetStudioModal
          story={story}
          initialFilterType="sfx"
          onSelectAsset={(asset) => {
            handleUpdateActiveHs({ sfxUrl: asset.url });
            setShowSfxGallery(false);
            playSfx(asset.url, false, 0.6);
            notify(`SFX assigned: ${asset.name}`);
          }}
          onClose={() => setShowSfxGallery(false)}
        />
      )}
    </div>
  );
}
