import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const trackingLinesButtonHover: VNHoverEffectDefinition = {
  id: 'tracking_lines',
  label: 'Tracking & Flank Lines',
  className: 'vn-btn-effect-tracking-lines',
  containerClassName: 'vn-btn-container-tracking-lines',
  description: 'Kinetic letter-spacing expansion with symmetric top & bottom expanding border lines',
  tag: 'NEW',
  icon: GUI_ICONS.general.texts,
};
