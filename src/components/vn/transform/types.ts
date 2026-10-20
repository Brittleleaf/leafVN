export interface VNTransformCrop {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface VNTransformableTarget {
  id: string;
  xPercent: number;
  yPercent: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  rotateX?: number;
  rotateY?: number;
  pivotX?: number;
  pivotY?: number;
  flipX?: boolean;
  flipY?: boolean;
  crop?: VNTransformCrop;
  isPerspective3D?: boolean;
  widthPercent?: number;
  locked?: boolean; // Prevents accidental movement or transformation
  disableSnap?: boolean; // When true, element neither attracts nor is attracted by magnetic snapping

  // Text specific metadata for inline editing
  isText?: boolean;
  text?: string;
  textColor?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontFamily?: string;
}

export type VNTransformHandleType =
  | 'move'
  | 'pivot'
  | 'rotate'
  | 'rotate3d'
  | 'tl'
  | 'tr'
  | 'bl'
  | 'br'
  | 't'
  | 'b'
  | 'l'
  | 'r'
  | 'crop-t'
  | 'crop-b'
  | 'crop-l'
  | 'crop-r'
  | 'crop-tl'
  | 'crop-tr'
  | 'crop-bl'
  | 'crop-br';

export interface VNTransformCapabilities {
  allowRotate?: boolean;         // Enable 2D rotation handle & 4 corner zones
  allow3D?: boolean;             // Enable 3D perspective orbit mode
  allowCrop?: boolean;           // Enable crop handles
  allowNonUniformScale?: boolean;// Enable cardinal edge handles (T, B, L, R)
  allowPivot?: boolean;          // Enable draggable pivot anchor point
  allowKeyboardNudge?: boolean;  // Enable arrow keys nudging
  allowLock?: boolean;           // Enable element locking
  allowFlip?: boolean;           // Enable horizontal and vertical flip controls
}

export const DEFAULT_TRANSFORM_CAPABILITIES: Required<VNTransformCapabilities> = {
  allowRotate: true,
  allow3D: true,
  allowCrop: true,
  allowNonUniformScale: true,
  allowPivot: true,
  allowKeyboardNudge: true,
  allowLock: true,
  allowFlip: true,
};

export interface VNSnapTarget {
  id: string;
  xPercent: number; // Center X (0 to 100)
  yPercent: number; // Center Y (0 to 100)
  widthPercent?: number; // Width in % of stage (e.g. 20)
  heightPercent?: number; // Height in % of stage (e.g. 10)
  disableSnap?: boolean; // If true, target does not emit attraction
}

export interface VNTransformDragSession {
  handle: VNTransformHandleType;
  startX: number;
  startY: number;
  targetRect: DOMRect;
  stageRect: DOMRect;
  targetUnrotatedW: number;
  targetUnrotatedH: number;
  initialTarget: VNTransformableTarget;
  initialCenterScreenX: number;
  initialCenterScreenY: number;
  initialAngleRad: number;
  pointerId?: number;
  snapTargets?: VNSnapTarget[];
  disableSnapping?: boolean;
}

export interface VNTransformHudInfo {
  label: string;
  value: string;
  color: 'cyan' | 'amber' | 'purple';
}

export interface VNTransformStepResult {
  patch: Partial<VNTransformableTarget>;
  hudInfo: VNTransformHudInfo | null;
  snapGuideX?: boolean;
  snapGuideY?: boolean;
  snapGuideXPercent?: number;
  snapGuideYPercent?: number;
  snapSoundKey?: string;
}
