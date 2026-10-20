'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const WhiteStrobeComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div
      className="absolute inset-0 bg-white pointer-events-none"
      style={{
        animation: 'fxWhiteStrobe 0.8s ease-in-out infinite',
        opacity: 0.8 * intensityMultiplier,
      }}
    >
      <style jsx global>{`
        @keyframes fxWhiteStrobe {
          0%, 8%, 14%, 28%, 34%, 100% {
            opacity: 0;
          }
          5%, 11%, 31% {
            opacity: 0.75;
          }
          50%, 65% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
};

export const whiteStrobeFx: ScreenFxDefinition = {
  id: 'white_strobe',
  label: 'Strobe Flash',
  description: 'Continuous intermittent flashes of blinding white light.',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'border-amber-400 bg-amber-950/80 text-amber-200',
  defaultSfx: '/assets/sfx/corrupt file.mp3',
  component: WhiteStrobeComponent,
};
