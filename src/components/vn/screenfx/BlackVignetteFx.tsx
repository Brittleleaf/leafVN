'use client';

import { ScreenFxDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';
import { VignetteComponent, VignetteInspector } from './VignetteFx';

export { VignetteComponent as BlackVignetteComponent };

export const blackVignetteFx: ScreenFxDefinition = {
  id: 'black_vignette',
  label: 'Shadow Pulse / Horror',
  description: 'Breathing dark vignette that constricts player field of view.',
  icon: GUI_ICONS.general.circle,
  badgeColor: 'border-zinc-500 bg-zinc-950/80 text-zinc-300',
  defaultSfx: '/assets/sfx/bg-tvnoise.mp3',
  defaultParams: {
    color: '#000000',
    animation: 'breathe',
  },
  component: VignetteComponent,
  inspector: VignetteInspector,
};
