"use client";
import React from 'react';
import { VNCinematicClip } from '@/types/vn';
import { VNScreenFxOverlay } from '../../VNScreenFxOverlay';

interface CinematicScreenFxLayerProps {
  activeFxClips: VNCinematicClip[];
}

export const CinematicScreenFxLayer: React.FC<CinematicScreenFxLayerProps> = ({
  activeFxClips,
}) => {
  return (
    <>
      {activeFxClips.map((fx) => {
        if (!fx.fxType) return null;
        const fadeIn = Number.isFinite(fx.fadeInSec) ? Math.max(0, fx.fadeInSec!) : 0.3;
        const fadeOut = Number.isFinite(fx.fadeOutSec) ? Math.max(0, fx.fadeOutSec!) : 0.3;

        return (
          <VNScreenFxOverlay
            key={fx.id}
            fxType={fx.fxType}
            intensity={fx.fxIntensity || 'medium'}
            fadeInSeconds={fadeIn}
            fadeOutSeconds={fadeOut}
          />
        );
      })}
    </>
  );
};
