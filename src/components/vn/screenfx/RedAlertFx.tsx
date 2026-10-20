'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const RedAlertComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <style jsx global>{`
        @keyframes fxRedAlertPulse {
          0%, 100% {
            opacity: 0.25;
            background-color: rgba(220, 38, 38, 0.25);
          }
          50% {
            opacity: 0.75;
            background-color: rgba(239, 68, 68, 0.45);
          }
        }
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          animation: 'fxRedAlertPulse 1.4s ease-in-out infinite',
          opacity: 0.7 * intensityMultiplier,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(220, 38, 38, 0.1) 30%, rgba(185, 28, 28, 0.7) 90%, rgba(127, 29, 29, 0.95) 100%)',
          opacity: 0.85 * intensityMultiplier,
        }}
      />
      <div className="absolute inset-0 border-8 border-red-600/40 animate-pulse pointer-events-none" />
    </div>
  );
};

export const redAlertFx: ScreenFxDefinition = {
  id: 'red_alert',
  label: 'Red Alert / Siren',
  description: 'Rhythmic crimson pulse with high-tension emergency vignette.',
  icon: GUI_ICONS.general.hazard,
  badgeColor: 'border-red-600 bg-red-950/80 text-red-200',
  defaultSfx: '/assets/sfx/ERROR RING.mp3',
  component: RedAlertComponent,
};
