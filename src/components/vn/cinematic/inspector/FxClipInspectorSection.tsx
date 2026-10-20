"use client";
import React from 'react';
import { VNCinematicClip, VNScreenFxType } from '@/types/vn';
import { SCREEN_FX_CONFIGS } from '../../screenfx';

interface FxClipInspectorSectionProps {
  clip: VNCinematicClip;
  onUpdateClip: (clipId: string, patch: Partial<VNCinematicClip>) => void;
}

export const FxClipInspectorSection: React.FC<FxClipInspectorSectionProps> = ({
  clip,
  onUpdateClip,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-[var(--muted)] block mb-1">Visual Effect Type:</label>
        <select
          value={clip.fxType || 'vignette'}
          onChange={(e) => onUpdateClip(clip.id, { fxType: e.target.value as VNScreenFxType })}
          className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] font-bold"
        >
          {Object.entries(SCREEN_FX_CONFIGS).map(([fxKey, fxDef]) => (
            <option key={fxKey} value={fxKey}>
              {fxDef.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] text-[var(--muted)] block mb-1">Intensity:</label>
        <select
          value={clip.fxIntensity || 'medium'}
          onChange={(e) => onUpdateClip(clip.id, { fxIntensity: e.target.value as any })}
          className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)]"
        >
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="heavy">Heavy</option>
        </select>
      </div>
    </div>
  );
};
