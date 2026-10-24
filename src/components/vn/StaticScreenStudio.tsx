"use client";
import React, { useState } from 'react';
import {
  VNStory,
  VNScene,
  VNStaticScreenConfig,
  VNStaticScreenButton,
  VNAssetItem,
  VNAssetType,
} from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import StaticScreenView, {
  DEFAULT_DEATH_CONFIG,
  DEFAULT_ENDING_CONFIG,
  DEFAULT_INTRO_CONFIG,
  DEFAULT_TITLE_CONFIG,
} from './StaticScreenView';
import AssetStudioModal from './AssetStudioModal';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

// Modular Sub-sections
import { StaticScreenVisualSection } from './staticscreen/StaticScreenVisualSection';
import { StaticScreenTypographySection } from './staticscreen/StaticScreenTypographySection';
import { StaticScreenButtonsSection } from './staticscreen/StaticScreenButtonsSection';
import { VNTransformToolbar, VNTransformableTarget } from './transform';

interface StaticScreenStudioProps {
  scene: VNScene;
  story: VNStory;
  onUpdateScene: (patch: Partial<VNScene>) => void;
  onUpdateStoryCustomAssets?: (updatedAssets: VNAssetItem[]) => void;
  editorTheme?: 'default_dark' | 'default_light' | 'rotp';
}

export default function StaticScreenStudio({
  scene,
  story,
  onUpdateScene,
  onUpdateStoryCustomAssets,
  editorTheme = 'default_dark',
}: StaticScreenStudioProps) {
  const config: VNStaticScreenConfig = scene.staticScreenConfig || DEFAULT_DEATH_CONFIG;

  const [activeTab, setActiveTab] = useState<'visual' | 'typography' | 'buttons'>('visual');
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(
    config.buttons?.[0]?.id || null
  );
  const [selectedTarget, setSelectedTarget] = useState<'title' | 'subtitle' | string | null>(
    config.buttons?.[0]?.id || null
  );

  // Interactive Canvas Alignment & Snapping state (default OFF for a clean canvas)
  const [showGuides, setShowGuides] = useState<boolean>(false);
  const [snapToGuides, setSnapToGuides] = useState<boolean>(true);

  // Gallery Picker modal state
  const [assetPickerConfig, setAssetPickerConfig] = useState<{
    filterType: VNAssetType;
    title: string;
    initialFontSample?: string;
    previewBackgroundUrl?: string;
    onSelect: (asset: VNAssetItem) => void;
  } | null>(null);

  const updateConfig = (patch: Partial<VNStaticScreenConfig>) => {
    const updated: VNStaticScreenConfig = {
      ...config,
      ...patch,
    };
    onUpdateScene({
      staticScreenConfig: updated,
    });
  };

  const handleApplyPreset = (purpose: 'death' | 'ending' | 'intro' | 'title') => {
    playSfx('/assets/sfx/open folder.mp3', false, 0.4);
    if (purpose === 'death') {
      updateConfig(DEFAULT_DEATH_CONFIG);
      onUpdateScene({
        name: scene.name.startsWith('Scenario') ? 'Death Screen' : scene.name,
      });
    } else if (purpose === 'ending') {
      updateConfig(DEFAULT_ENDING_CONFIG);
      onUpdateScene({
        name: scene.name.startsWith('Scenario') ? 'Story Ending' : scene.name,
      });
    } else if (purpose === 'intro') {
      updateConfig(DEFAULT_INTRO_CONFIG);
      onUpdateScene({
        name: scene.name.startsWith('Scenario') ? 'Chapter Intro' : scene.name,
      });
    } else if (purpose === 'title') {
      updateConfig(DEFAULT_TITLE_CONFIG);
      onUpdateScene({
        name: scene.name.startsWith('Scenario') ? 'Main Menu' : scene.name,
      });
    }
  };

  const handleAddButton = () => {
    const newBtn: VNStaticScreenButton = {
      id: `btn-${Date.now()}`,
      label: 'NEW ACTION BUTTON',
      action: 'jump_scene',
      style: 'ghost',
      size: 'md',
      xPercent: 50,
      yPercent: Math.min(90, 50 + (config.buttons?.length || 0) * 8),
    };
    updateConfig({
      buttons: [...(config.buttons || []), newBtn],
    });
    setSelectedButtonId(newBtn.id);
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
  };

  const handleUpdateButton = (btnId: string, patch: Partial<VNStaticScreenButton>) => {
    const updated = (config.buttons || []).map((b) => (b.id === btnId ? { ...b, ...patch } : b));
    updateConfig({ buttons: updated });
  };

  const handleTransformButton = (btnId: string, patch: Partial<VNStaticScreenButton>) => {
    const total = config.buttons?.length || 1;
    const updated = (config.buttons || []).map((b, idx) => {
      const defY = Math.round((70 + (idx - (total - 1) / 2) * 11) * 10) / 10;
      if (b.id === btnId) {
        return {
          ...b,
          ...patch,
          xPercent: patch.xPercent !== undefined ? patch.xPercent : (b.xPercent ?? 50),
          yPercent: patch.yPercent !== undefined ? patch.yPercent : (b.yPercent ?? defY),
        };
      }
      return {
        ...b,
        xPercent: b.xPercent ?? 50,
        yPercent: b.yPercent ?? defY,
      };
    });
    const shouldSwitchFree =
      config.buttonsLayout !== 'free' &&
      (patch.xPercent !== undefined ||
        patch.yPercent !== undefined ||
        patch.scale !== undefined ||
        patch.rotation !== undefined);
    updateConfig({
      buttons: updated,
      ...(shouldSwitchFree ? { buttonsLayout: 'free' } : {}),
    });
  };

  const handleDeleteButton = (btnId: string) => {
    const filtered = (config.buttons || []).filter((b) => b.id !== btnId);
    updateConfig({ buttons: filtered });
    if (selectedButtonId === btnId) {
      setSelectedButtonId(filtered[0]?.id || null);
    }
    playSfx('/assets/sfx/corrupt file.mp3', false, 0.3);
  };

  const selectedButton = (config.buttons || []).find((b) => b.id === selectedButtonId);

  // List of all scenarios for scene jumping
  const allStoryScenarios: { id: string; name: string }[] = [];
  story.chapters.forEach((ch) => {
    ch.scenes.forEach((s) => allStoryScenarios.push({ id: s.id, name: `[${ch.title}] ${s.name}` }));
  });
  (story.scenarios || []).forEach((s) => {
    if (!allStoryScenarios.some((item) => item.id === s.id)) {
      allStoryScenarios.push({ id: s.id, name: `[Global] ${s.name}` });
    }
  });

  // Active target for docked vertical VNTransformToolbar
  const isTitleSelected = selectedTarget === 'title';
  const isSubtitleSelected = selectedTarget === 'subtitle';
  const isButtonSelected =
    !isTitleSelected && !isSubtitleSelected && Boolean(selectedButton);

  const selectedBtnIndex = (config.buttons || []).findIndex((b) => b.id === selectedButton?.id);
  const totalBtns = config.buttons?.length || 1;
  const defaultBtnY = Math.round((70 + (selectedBtnIndex - (totalBtns - 1) / 2) * 11) * 10) / 10;

  const activeTransformTarget: VNTransformableTarget | null = isTitleSelected
    ? {
        id: 'static-screen-title',
        xPercent: config.titleXPercent ?? 50,
        yPercent: config.titleYPercent ?? 28,
        scale: config.titleScale ?? 1,
        rotation: config.titleRotation ?? 0,
        locked: config.titleLocked ?? false,
        isText: true,
        text: config.title,
        textColor: config.titleColor,
        fontFamily: config.titleFontFamily,
      }
    : isSubtitleSelected
    ? {
        id: 'static-screen-subtitle',
        xPercent: config.subtitleXPercent ?? 50,
        yPercent: config.subtitleYPercent ?? 40,
        scale: config.subtitleScale ?? 1,
        rotation: config.subtitleRotation ?? 0,
        locked: config.subtitleLocked ?? false,
        isText: true,
        text: config.subtitle,
        textColor: config.subtitleColor,
        fontFamily: config.subtitleFontFamily,
      }
    : isButtonSelected && selectedButton
    ? {
        id: selectedButton.id,
        xPercent: selectedButton.xPercent ?? 50,
        yPercent: selectedButton.yPercent ?? defaultBtnY,
        scale: selectedButton.scale ?? 1,
        scaleX: selectedButton.scaleX ?? 1,
        scaleY: selectedButton.scaleY ?? 1,
        rotation: selectedButton.rotation ?? 0,
        locked: selectedButton.locked ?? false,
        widthPercent: selectedButton.widthPercent,
        isText: true,
        text: selectedButton.label,
      }
    : null;

  const handleToolbarUpdate = (patch: Partial<VNTransformableTarget>) => {
    if (isTitleSelected) {
      updateConfig({
        ...(patch.xPercent !== undefined ? { titleXPercent: patch.xPercent } : {}),
        ...(patch.yPercent !== undefined ? { titleYPercent: patch.yPercent } : {}),
        ...(patch.scale !== undefined ? { titleScale: patch.scale } : {}),
        ...(patch.rotation !== undefined ? { titleRotation: patch.rotation } : {}),
        ...(patch.locked !== undefined ? { titleLocked: patch.locked } : {}),
      });
    } else if (isSubtitleSelected) {
      updateConfig({
        ...(patch.xPercent !== undefined ? { subtitleXPercent: patch.xPercent } : {}),
        ...(patch.yPercent !== undefined ? { subtitleYPercent: patch.yPercent } : {}),
        ...(patch.scale !== undefined ? { subtitleScale: patch.scale } : {}),
        ...(patch.rotation !== undefined ? { subtitleRotation: patch.rotation } : {}),
        ...(patch.locked !== undefined ? { subtitleLocked: patch.locked } : {}),
      });
    } else if (selectedButton) {
      handleTransformButton(selectedButton.id, {
        ...(patch.xPercent !== undefined ? { xPercent: patch.xPercent } : {}),
        ...(patch.yPercent !== undefined ? { yPercent: patch.yPercent } : {}),
        ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
        ...(patch.scaleX !== undefined ? { scaleX: patch.scaleX } : {}),
        ...(patch.scaleY !== undefined ? { scaleY: patch.scaleY } : {}),
        ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
        ...(patch.locked !== undefined ? { locked: patch.locked } : {}),
        ...(patch.widthPercent !== undefined ? { widthPercent: patch.widthPercent } : {}),
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--bg)] text-[var(--text)] select-none">
      {/* LEFT COLUMN: STATIC SCREEN CONFIGURATION CONTROLS */}
      <div className="w-full lg:w-[420px] p-4 overflow-y-auto space-y-4 border-r border-[var(--border)] bg-[var(--surface)] backdrop-blur-md shrink-0 custom-scrollbar flex flex-col">
        
        {/* Header & Quick Presets */}
        <div className="space-y-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center text-[var(--accent)]">
                <GuiIconRenderer icon={GUI_ICONS.general.staticScreen} className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-wide uppercase text-[var(--text)]">
                  Static Screen Studio
                </h3>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  {scene.name || 'Static Event'}
                </span>
              </div>
            </div>

            {/* Quick Presets dropdown / pill */}
            <div className="flex items-center gap-1 bg-[var(--well-bg)] border border-[var(--border)] p-1 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-[var(--muted)] px-1.5 font-mono">Preset:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('title')}
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg hover:bg-[var(--btn-hover-bg)] text-emerald-400 cursor-pointer transition-colors"
                title="Title / Main Menu preset"
              >
                Title
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('death')}
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg hover:bg-[var(--btn-hover-bg)] text-red-400 cursor-pointer transition-colors"
                title="You Died / Game Over preset"
              >
                Death
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('ending')}
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg hover:bg-[var(--btn-hover-bg)] text-purple-400 cursor-pointer transition-colors"
                title="Story Ending preset"
              >
                Ending
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('intro')}
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg hover:bg-[var(--btn-hover-bg)] text-sky-400 cursor-pointer transition-colors"
                title="Chapter Intro card preset"
              >
                Intro
              </button>
            </div>
          </div>

          {/* Sleek Segmented Studio Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('visual');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'visual'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('typography');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'typography'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5" />
              <span>Typography</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('buttons');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'buttons'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5" />
              <span>Buttons ({config.buttons?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Section */}
        <div className="flex-1 space-y-4">
          {activeTab === 'visual' && (
            <StaticScreenVisualSection
              scene={scene}
              config={config}
              updateConfig={updateConfig}
              onUpdateScene={onUpdateScene}
              setAssetPickerConfig={setAssetPickerConfig}
            />
          )}

          {activeTab === 'typography' && (
            <StaticScreenTypographySection
              config={config}
              updateConfig={updateConfig}
              selectedTarget={selectedTarget}
              setSelectedTarget={setSelectedTarget}
              setSelectedButtonId={setSelectedButtonId}
              setAssetPickerConfig={setAssetPickerConfig}
            />
          )}

          {activeTab === 'buttons' && (
            <StaticScreenButtonsSection
              config={config}
              updateConfig={updateConfig}
              selectedButtonId={selectedButtonId}
              setSelectedButtonId={setSelectedButtonId}
              handleAddButton={handleAddButton}
              handleUpdateButton={handleUpdateButton}
              handleDeleteButton={handleDeleteButton}
              allStoryScenarios={allStoryScenarios}
              setAssetPickerConfig={setAssetPickerConfig}
            />
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE WYSIWYG PREVIEW WITH DRAGGABLE BUTTONS */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 xl:pr-24 bg-black/60 overflow-hidden">
        {/* Sleek Workspace Top Bar OUTSIDE the canvas */}
        <div className="w-full max-w-4xl mb-2.5 flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[var(--well-bg)] border border-[var(--border)] text-xs backdrop-blur-md shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_8px_var(--accent-glow)]" />
            <span className="font-bold tracking-wider uppercase text-[11px] text-[var(--text)]">Static Screen Studio</span>
            <span className="text-[10px] text-[var(--muted)] font-mono">
              • {selectedTarget === 'title' ? 'Title Selected' : selectedTarget === 'subtitle' ? 'Subtitle Selected' : selectedButton ? `Button: "${selectedButton.label}"` : 'Clean Canvas'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Guides */}
            <button
              type="button"
              onClick={() => {
                setShowGuides(!showGuides);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shadow-sm flex items-center gap-1.5 backdrop-blur-md ${
                showGuides
                  ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                  : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              title="Toggle alignment guides"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.ruler} className="w-3.5 h-3.5" />
              <span>{showGuides ? 'Guides: ON' : 'Guides: OFF'}</span>
            </button>

            {/* Toggle Snap */}
            <button
              type="button"
              onClick={() => {
                setSnapToGuides(!snapToGuides);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shadow-sm flex items-center gap-1.5 backdrop-blur-md ${
                snapToGuides
                  ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--accent)] shadow-sm'
                  : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              title="Toggle magnetic snapping"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.pin} className="w-3.5 h-3.5" />
              <span>{snapToGuides ? 'Snap: ON' : 'Snap: OFF'}</span>
            </button>
          </div>
        </div>

        {/* 16:9 Canvas Viewport */}
        <div className="relative w-full h-full max-w-4xl max-h-[640px] flex items-center justify-center">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--border)]">
            <StaticScreenView
              scene={scene}
              isInteractive={false}
              selectedButtonId={selectedButtonId}
              selectedTarget={selectedTarget}
              showGuides={showGuides}
              snapToGuides={snapToGuides}
              onSelectTarget={(target) => {
                setSelectedTarget(target);
                if (target === 'title' || target === 'subtitle') {
                  setSelectedButtonId(null);
                } else if (target) {
                  setSelectedButtonId(target);
                }
              }}
              onSelectButton={(btnId) => {
                setSelectedButtonId(btnId);
                setSelectedTarget(btnId);
              }}
              onDragButton={(btnId, xPercent, yPercent) => {
                handleTransformButton(btnId, { xPercent, yPercent });
              }}
              onTransformButton={(btnId, patch) => {
                handleTransformButton(btnId, patch);
              }}
              onTransformText={(target, patch) => {
                if (target === 'title') {
                  updateConfig({
                    ...(patch.xPercent !== undefined ? { titleXPercent: patch.xPercent } : {}),
                    ...(patch.yPercent !== undefined ? { titleYPercent: patch.yPercent } : {}),
                    ...(patch.scale !== undefined ? { titleScale: patch.scale } : {}),
                    ...(patch.rotation !== undefined ? { titleRotation: patch.rotation } : {}),
                    ...(patch.locked !== undefined ? { titleLocked: patch.locked } : {}),
                    ...(patch.text !== undefined ? { title: patch.text } : {}),
                  });
                } else if (target === 'subtitle') {
                  updateConfig({
                    ...(patch.xPercent !== undefined ? { subtitleXPercent: patch.xPercent } : {}),
                    ...(patch.yPercent !== undefined ? { subtitleYPercent: patch.yPercent } : {}),
                    ...(patch.scale !== undefined ? { subtitleScale: patch.scale } : {}),
                    ...(patch.rotation !== undefined ? { subtitleRotation: patch.rotation } : {}),
                    ...(patch.locked !== undefined ? { subtitleLocked: patch.locked } : {}),
                    ...(patch.text !== undefined ? { subtitle: patch.text } : {}),
                  });
                }
              }}
            />
          </div>

          {/* DOCKED VERTICAL STUDIO TOOLBAR (STRICTLY OUTSIDE CANVAS ON THE RIGHT RAIL) */}
          {activeTransformTarget && (
            <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 z-50 shrink-0 pointer-events-auto">
              <VNTransformToolbar
                target={activeTransformTarget}
                onUpdate={handleToolbarUpdate}
                onDelete={
                  isButtonSelected && selectedButton
                    ? () => {
                        handleDeleteButton(selectedButton.id);
                        setSelectedButtonId(null);
                        setSelectedTarget(null);
                        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                      }
                    : undefined
                }
                capabilities={{
                  allowCrop: false,
                  allow3D: false,
                  allowPivot: false,
                  allowLock: true,
                  allowRotate: true,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ASSET STUDIO MODAL PICKER OVERLAY */}
      {assetPickerConfig && (
        <AssetStudioModal
          story={story}
          filterType={assetPickerConfig.filterType}
          initialFilterType={assetPickerConfig.filterType}
          initialFontSample={assetPickerConfig.initialFontSample}
          previewBackgroundUrl={assetPickerConfig.previewBackgroundUrl || scene.backgroundUrl}
          onUpdateStoryCustomAssets={onUpdateStoryCustomAssets}
          onSelectAsset={(asset) => {
            assetPickerConfig.onSelect(asset);
            setAssetPickerConfig(null);
            playSfx('/assets/sfx/click intro.mp3', false, 0.3);
          }}
          onClose={() => setAssetPickerConfig(null)}
          notify={() => {}}
        />
      )}
    </div>
  );
}
