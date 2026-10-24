import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const underlineButtonHover: VNHoverEffectDefinition = {
  id: 'underline',
  label: 'Underline Expand',
  className: 'vn-btn-effect-underline',
  containerClassName: 'vn-btn-container-underline',
  description: 'Subtle expanding bottom border with smooth opacity transition',
  icon: GUI_ICONS.general.pencil,
};
