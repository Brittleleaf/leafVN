export type VNButtonHoverEffectId =
  | 'none'
  | 'flare'
  | 'tracking_lines'
  | 'tactile'
  | 'aura'
  | 'vector_trace'
  | 'shine'
  | 'box'
  | 'underline';

export interface VNHoverEffectDefinition {
  id: string;
  label: string;
  className: string;
  containerClassName?: string;
  description?: string;
  tag?: string;
  icon?: string;
}
