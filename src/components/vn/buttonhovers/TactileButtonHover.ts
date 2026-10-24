import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const tactileButtonHover: VNHoverEffectDefinition = {
  id: 'tactile',
  label: 'Tactile 3D Press',
  className: 'vn-btn-effect-tactile',
  containerClassName: 'vn-btn-container-tactile',
  description: 'Physical depth press with bevel shadows, mechanical displacement and button depression',
  tag: 'NEW',
  icon: GUI_ICONS.general.click,
};
