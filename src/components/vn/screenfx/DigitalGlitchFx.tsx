'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const DigitalGlitchComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <style jsx global>{`
        @keyframes fxDigitalGlitchLines {
          0% {
            background-position: 0 0;
            opacity: 0.4;
          }
          50% {
            background-position: 0 20px;
            opacity: 0.8;
          }
          100% {
            background-position: 0 40px;
            opacity: 0.4;
          }
        }

        @keyframes fxGlitchFlicker {
          0%, 100% {
            opacity: 0.1;
          }
          20% {
            opacity: 0.5;
            transform: translate(-2px, 1px);
          }
          40% {
            opacity: 0.15;
            transform: translate(2px, -1px);
          }
          70% {
            opacity: 0.6;
            transform: translate(-1px, -2px);
          }
        }
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(6, 182, 212, 0.15) 0px, rgba(6, 182, 212, 0.15) 2px, transparent 2px, transparent 6px)',
          animation: 'fxDigitalGlitchLines 1.2s linear infinite',
          opacity: 0.75 * intensityMultiplier,
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-pink-500/20"
        style={{
          animation: 'fxGlitchFlicker 0.4s steps(2) infinite',
          opacity: 0.65 * intensityMultiplier,
        }}
      />
      <div className="absolute inset-0 border-2 border-cyan-500/30" />
    </div>
  );
};

export const digitalGlitchFx: ScreenFxDefinition = {
  id: 'digital_glitch',
  label: 'Digital Glitch / Static',
  description: 'CRT scanlines, chromatic aberration, and cybernetic interference.',
  icon: GUI_ICONS.general.screenFx,
  badgeColor: 'border-cyan-500 bg-cyan-950/80 text-cyan-200',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  component: DigitalGlitchComponent,
};
