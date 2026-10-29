"use client";
import React from 'react';
import {
  VNEvent,
  VNScene,
  VNHotspotStyle,
  VNAssetType,
  VNActiveGlobalModal,
} from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import { useVNMaker } from '../VNMakerContext';

export interface StageStudioActionBarProps {
  showGuides: boolean;
  setShowGuides: (show: boolean) => void;
  snapToGuides: boolean;
  setSnapToGuides: (snap: boolean) => void;

  // Optional overrides
  currentLine?: VNEvent;
  currentScene?: VNScene;
  isPlacingButton?: boolean;
  setIsPlacingButton?: (placing: boolean) => void;
  setPendingButtonType?: (type: VNHotspotStyle) => void;
  setEditingHotspotId?: (id: string | null) => void;
  setShowHotspotStudio?: (show: boolean) => void;
  showCanvasTextbox?: boolean;
  setShowCanvasTextbox?: (show: boolean) => void;
  handlePatchCurrentLine?: (patch: Partial<VNEvent>) => void;
  recordHistorySnapshot?: () => void;
  notify?: (msg: string) => void;
  setShowSceneAudioModal?: (show: boolean) => void;
  openAssetPicker?: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void,
    initialFontSample?: string,
    previewBackgroundUrl?: string
  ) => void;
  handleUpdateCurrentScene?: (field: keyof VNScene, value: unknown) => void;
  setActiveGlobalModal?: (modal: VNActiveGlobalModal) => void;
  handleUploadBackground?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function StageStudioActionBar({
  showGuides,
  setShowGuides,
  snapToGuides,
  setSnapToGuides,
  ...props
}: StageStudioActionBarProps) {
  const ctx = useVNMaker();

  const currentLine = props.currentLine ?? ctx.currentLine;
  const currentScene = props.currentScene ?? ctx.currentScene;
  const isPlacingButton = props.isPlacingButton ?? ctx.isPlacingButton;
  const setIsPlacingButton = props.setIsPlacingButton ?? ctx.setIsPlacingButton;
  const setPendingButtonType = props.setPendingButtonType ?? ctx.setPendingButtonType;
  const setEditingHotspotId = props.setEditingHotspotId ?? ctx.setEditingHotspotId;
  const setShowHotspotStudio = props.setShowHotspotStudio ?? ctx.setShowHotspotStudio;
  const showCanvasTextbox = props.showCanvasTextbox ?? ctx.showCanvasTextbox;
  const setShowCanvasTextbox = props.setShowCanvasTextbox ?? ctx.setShowCanvasTextbox;
  const handlePatchCurrentLine = props.handlePatchCurrentLine ?? ctx.handlePatchCurrentLine;
  const recordHistorySnapshot = props.recordHistorySnapshot ?? ctx.recordHistorySnapshot;
  const notify = props.notify ?? ctx.notify;
  const setShowSceneAudioModal = props.setShowSceneAudioModal ?? ctx.setShowSceneAudioModal;
  const openAssetPicker = props.openAssetPicker ?? ctx.openAssetPicker;
  const handleUpdateCurrentScene = props.handleUpdateCurrentScene ?? ctx.handleUpdateCurrentScene;
  const setActiveGlobalModal = props.setActiveGlobalModal ?? ctx.setActiveGlobalModal;
  const handleUploadBackground = props.handleUploadBackground ?? ctx.handleUploadBackground;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
      {/* Left: Button / Hotspot placement and alignment guides */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
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
          type="button"
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
            type="button"
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
          type="button"
          onClick={() => setShowSceneAudioModal?.(true)}
          className="px-2.5 py-1.5 hover:bg-[var(--surface-strong)] text-[var(--text)] rounded-lg text-xs uppercase font-bold cursor-pointer transition-all flex items-center gap-1.5"
          title="Configure background BGM and entrance SFX for this scenario"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.soundOn} className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Audio</span>
          {currentScene?.entrySfxUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
        </button>

        <button
          type="button"
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
  );
}
