import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const flareButtonHover: VNHoverEffectDefinition = {
  id: 'flare',
  label: 'Specular Light Flare',
  className: 'vn-btn-effect-flare',
  containerClassName: 'vn-btn-container-flare',
  description: '35-degree diagonal specular light blade sweeping rapidly across button on hover',
  tag: 'NEW',
  icon: GUI_ICONS.general.screenFx,
};
