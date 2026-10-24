import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const boxButtonHover: VNHoverEffectDefinition = {
  id: 'box',
  label: 'Box Border Enclose',
  className: 'vn-btn-effect-box',
  containerClassName: 'vn-btn-container-box',
  description: 'Four-sided enclosing line frame animation folding inwards on hover',
  icon: GUI_ICONS.general.screenFx,
};
