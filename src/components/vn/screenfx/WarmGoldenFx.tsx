'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const WarmGoldenComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        animation: 'fxGoldenGlowPulse 2.5s ease-in-out infinite',
        background:
          'radial-gradient(circle at center, rgba(251, 191, 36, 0.35) 10%, rgba(217, 119, 6, 0.2) 65%, rgba(180, 83, 9, 0.4) 100%)',
        opacity: 0.8 * intensityMultiplier,
      }}
    >
      <style jsx global>{`
        @keyframes fxGoldenGlowPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export const warmGoldenFx: ScreenFxDefinition = {
  id: 'warm_golden',
  label: 'Mystic Golden Glow',
  description: 'Gleaming ethereal aura ideal for revelations or flashbacks.',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'border-amber-500 bg-amber-950/80 text-amber-100',
  defaultSfx: '/assets/sfx/success.mp3',
  component: WarmGoldenComponent,
};
