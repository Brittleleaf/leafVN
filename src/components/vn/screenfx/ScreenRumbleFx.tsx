'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const ScreenRumbleComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        animation: 'fxScreenRumbleContinuous 0.25s linear infinite',
      }}
    >
      <style jsx global>{`
        @keyframes fxScreenRumbleContinuous {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          15% {
            transform: translate(-3px, 2px) rotate(-0.4deg);
          }
          30% {
            transform: translate(3px, -2px) rotate(0.4deg);
          }
          45% {
            transform: translate(-2px, -3px) rotate(0.2deg);
          }
          60% {
            transform: translate(3px, 2px) rotate(-0.3deg);
          }
          75% {
            transform: translate(-2px, 1px) rotate(0.3deg);
          }
          90% {
            transform: translate(2px, -2px) rotate(-0.2deg);
          }
        }
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 40%, rgba(202, 138, 4, 0.2) 80%, rgba(113, 63, 18, 0.5) 100%)',
          opacity: 0.6 * intensityMultiplier,
        }}
      />
    </div>
  );
};

export const screenRumbleFx: ScreenFxDefinition = {
  id: 'screen_rumble',
  label: 'Continuous Screen Rumble',
  description: 'Sustained seismic shake and vibration across the scene.',
  icon: GUI_ICONS.general.hazard,
  badgeColor: 'border-yellow-600 bg-yellow-950/80 text-yellow-200',
  defaultSfx: '/assets/sfx/corrupt file.mp3',
  component: ScreenRumbleComponent,
};
