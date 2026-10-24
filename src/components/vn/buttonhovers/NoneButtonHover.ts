import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const noneButtonHover: VNHoverEffectDefinition = {
  id: 'none',
  label: 'None',
  className: '',
  containerClassName: '',
  description: 'Default state without active hover animation',
  icon: GUI_ICONS.general.circle,
};
