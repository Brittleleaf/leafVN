"use client";
import React from 'react';
import { VNEvent, VNScene, VNAssetType } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import { useVNMaker } from '../VNMakerContext';

export interface StageTransportControlsProps {
  currentLine?: VNEvent;
  selectedLineIndex?: number;
  currentScene?: VNScene;
  isPlayingPreview?: boolean;
  handlePrevLine?: () => void;
  playCurrentLinePreview?: () => void;
  handleNextLine?: () => void;
  getDisplayAssetName?: (url: string | undefined) => string;
  handleUpdateCurrentLine?: (field: keyof VNEvent, value: unknown) => void;
  openAssetPicker?: (
    filterType: VNAssetType,
    onSelect: (url: string, assetName?: string) => void
  ) => void;
}

export default function StageTransportControls(props: StageTransportControlsProps = {}) {
  const ctx = useVNMaker();

  const currentLine = props.currentLine ?? ctx.currentLine;
  const selectedLineIndex = props.selectedLineIndex ?? ctx.selectedLineIndex;
  const currentScene = props.currentScene ?? ctx.currentScene;
  const isPlayingPreview = props.isPlayingPreview ?? ctx.isPlayingPreview;
  const handlePrevLine = props.handlePrevLine ?? ctx.handlePrevLine;
  const playCurrentLinePreview = props.playCurrentLinePreview ?? ctx.playCurrentLinePreview;
  const handleNextLine = props.handleNextLine ?? ctx.handleNextLine;
  const getDisplayAssetName = props.getDisplayAssetName ?? ctx.getDisplayAssetName;
  const handleUpdateCurrentLine = props.handleUpdateCurrentLine ?? ctx.handleUpdateCurrentLine;
  const openAssetPicker = props.openAssetPicker ?? ctx.openAssetPicker;

  const totalLines = currentScene?.timeline?.length || 1;

  return (
    <div className="vn-card p-3 flex items-center justify-between gap-3 text-xs shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevLine}
          disabled={selectedLineIndex === 0}
          className="vn-btn px-3 py-1.5 text-xs font-bold disabled:opacity-30 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
        >
          <GuiIconRenderer icon={GUI_ICONS.state.backwardTime} className="w-3 h-3 text-[var(--muted)]" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={playCurrentLinePreview}
          className="vn-btn primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3.5 h-3.5" />
          <span>{isPlayingPreview ? 'Playing...' : 'PLAY LINE'}</span>
        </button>

        <button
          type="button"
          onClick={handleNextLine}
          disabled={selectedLineIndex === totalLines - 1}
          className="vn-btn px-3 py-1.5 text-xs font-bold disabled:opacity-30 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
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
                className="w-5 h-5 flex items-center justify-center rounded-lg bg-[var(--btn-bg)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-[var(--accent-contrast)] text-[10px] cursor-pointer shrink-0 transition-colors"
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
  );
}
