import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const auraButtonHover: VNHoverEffectDefinition = {
  id: 'aura',
  label: 'Expanding Shockwave Aura',
  className: 'vn-btn-effect-aura',
  containerClassName: 'vn-btn-container-aura',
  description: 'Expanding ghost perimeter shockwave with luminous internal chamber glow',
  tag: 'NEW',
  icon: GUI_ICONS.general.screenFx,
};
