import { VNHoverEffectDefinition } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const vectorTraceButtonHover: VNHoverEffectDefinition = {
  id: 'vector_trace',
  label: 'Vector Circuit Trace',
  className: 'vn-btn-effect-vector-trace',
  containerClassName: 'vn-btn-container-vector-trace',
  description: 'Animated vector border contour tracing across perimeter lines with text expansion',
  tag: 'NEW',
  icon: GUI_ICONS.track.branch,
};
