'use client';

import React from 'react';
import { ScreenFxDefinition, ScreenFxProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const HeartbeatComponent: React.FC<ScreenFxProps> = ({ intensityMultiplier }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        animation: 'fxHeartbeatPulse 1.2s cubic-bezier(0.25, 1, 0.5, 1) infinite',
        background:
          'radial-gradient(ellipse at center, rgba(225, 29, 72, 0.2) 20%, rgba(159, 18, 57, 0.8) 75%, rgba(76, 5, 25, 0.95) 100%)',
        opacity: 0.85 * intensityMultiplier,
      }}
    >
      <style jsx global>{`
        @keyframes fxHeartbeatPulse {
          0% {
            opacity: 0.15;
            transform: scale(1);
          }
          14% {
            opacity: 0.7;
            transform: scale(1.03);
          }
          28% {
            opacity: 0.25;
            transform: scale(1);
          }
          42% {
            opacity: 0.85;
            transform: scale(1.04);
          }
          65%, 100% {
            opacity: 0.15;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export const heartbeatFx: ScreenFxDefinition = {
  id: 'heartbeat',
  label: 'Tension Heartbeat',
  description: 'Double rhythmic blood pulse simulating accelerated heart rate.',
  icon: GUI_ICONS.general.heart,
  badgeColor: 'border-rose-600 bg-rose-950/80 text-rose-200',
  defaultSfx: '',
  component: HeartbeatComponent,
};
