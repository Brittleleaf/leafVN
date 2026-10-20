'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const OldCrtTvComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <style jsx global>{`
        @keyframes crtFlicker {
          0% {
            transform: translateY(1px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
      {/* Scanlines & RGB Subpixel Shift */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, ${0.28 * intensityMultiplier}) 50%),
            linear-gradient(
              90deg,
              rgba(255, 0, 0, ${0.07 * intensityMultiplier}),
              rgba(0, 255, 0, ${0.03 * intensityMultiplier}),
              rgba(0, 0, 255, ${0.07 * intensityMultiplier})
            )
          `,
          backgroundSize: '100% 4px, 30px 100%',
          animation: 'crtFlicker 100ms infinite',
          zIndex: 1,
        }}
      />
      {/* CRT Curvature Spherical Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(255, 255, 255, 0) 65%, rgba(0, 0, 0, ${0.85 * intensityMultiplier}) 100%)`,
          zIndex: 2,
        }}
      />
    </div>
  );
};

export const oldCrtTvFx: ScreenFxDefinition = {
  id: 'crt_tv',
  label: 'Old CRT TV screen',
  description: 'Retro television scanlines with RGB channel split, high-frequency flicker and spherical vignette.',
  icon: GUI_ICONS.general.clapperboard,
  badgeColor: 'border-amber-600 bg-amber-950/80 text-amber-200',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  component: OldCrtTvComponent,
};
