import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const shineButtonHover: VNHoverEffectDefinition = {
  id: 'shine',
  label: 'Mask Sweep Shine',
  className: 'vn-btn-effect-shine',
  containerClassName: 'vn-btn-container-shine',
  description: 'Infinite diagonal gradient luminance sweep mask with drop shadow glow',
  icon: GUI_ICONS.general.screenFx,
};
