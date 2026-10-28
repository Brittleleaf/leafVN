"use client";
import React, { useState } from 'react';
import { VNCinematicClip, VNScreenFxType } from '@/types/vn';
import { SCREEN_FX_CONFIGS, VNScreenFxPickerGrid } from '../../screenfx';
import { ScreenFxShowcaseTab } from '../../assetstudio/ScreenFxShowcaseTab';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface FxClipInspectorSectionProps {
  clip: VNCinematicClip;
  onUpdateClip: (clipId: string, patch: Partial<VNCinematicClip>) => void;
}

export const FxClipInspectorSection: React.FC<FxClipInspectorSectionProps> = ({
  clip,
  onUpdateClip,
}) => {
  const [showGalleryModal, setShowGalleryModal] = useState<boolean>(false);

  return (
    <div className="space-y-3.5">
      {/* Header and gallery trigger */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
          Visual Screen FX:
        </label>
        <button
          type="button"
          onClick={() => setShowGalleryModal(true)}
          className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <GuiIconRenderer icon={GUI_ICONS.action.sparkles} size={11} />
          <span>Browse FX Gallery</span>
        </button>
      </div>

      {/* 2-column live preview viewport picker grid */}
      <VNScreenFxPickerGrid
        activeFx={clip.fxType || 'vignette'}
        intensity={clip.fxIntensity || 'medium'}
        columns={2}
        accentColor="purple"
        onSelectFx={(fxKey) => onUpdateClip(clip.id, { fxType: fxKey })}
        onOpenGallery={() => setShowGalleryModal(true)}
      />

      {/* Intensity Selector with segmented buttons */}
      <div>
        <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block mb-1.5">
          Intensity:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['light', 'medium', 'heavy'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onUpdateClip(clip.id, { fxIntensity: lvl })}
              className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
                (clip.fxIntensity || 'medium') === lvl
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                  : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Screen FX Gallery Modal */}
      {showGalleryModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGalleryModal(false);
          }}
          className="fixed inset-0 z-50 vn-modal-backdrop p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans"
        >
          <div className="w-full max-w-5xl max-h-[88vh] vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
            <div className="p-4 sm:p-5 border-b vn-glass-header shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">
                    Cinematic Screen FX Showcase
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Pick a visual overlay effect with 16:9 simulated live previews.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryModal(false)}
                className="w-8 h-8 rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer transition-colors"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <ScreenFxShowcaseTab
                searchQuery=""
                onSelectAsset={(asset) => {
                  onUpdateClip(clip.id, {
                    fxType: asset.url as VNScreenFxType,
                    fxIntensity: asset.extra?.intensity || clip.fxIntensity || 'medium',
                  });
                  setShowGalleryModal(false);
                }}
                onClose={() => setShowGalleryModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
