'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const CinemaGrainComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.1) 30%, rgba(59, 7, 100, 0.6) 80%, rgba(15, 23, 42, 0.9) 100%)',
          opacity: 0.7 * intensityMultiplier,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0px, rgba(255, 255, 255, 0.04) 1px, transparent 1px, transparent 3px)',
          opacity: 0.5 * intensityMultiplier,
        }}
      />
    </div>
  );
};

export const cinemaGrainFx: ScreenFxDefinition = {
  id: 'cinema_grain',
  label: 'Noir Grain / Interference',
  description: 'Suspenseful atmosphere with cinematic vignette and soft static.',
  icon: GUI_ICONS.general.film,
  badgeColor: 'border-purple-600 bg-purple-950/80 text-purple-200',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  component: CinemaGrainComponent,
};
