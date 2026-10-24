import React from 'react';

export type VNTextBoxSkinId =
  | 'classified'
  | 'cyberpunk'
  | 'neon'
  | 'minimal'
  | 'parchment'
  | 'nvl'
  | (string & {});

export interface VNTextBoxRenderProps {
  speakerName?: string;
  dialogueText: React.ReactNode;
  speakerColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  nameplateColor?: string;
  badge?: string;
  badgeColor?: string;
  avatarNode?: React.ReactNode;
  fontSizeClass?: string;
  fontFamily?: string;
  onAdvance?: () => void;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface VNTextBoxSkinDefinition {
  id: VNTextBoxSkinId;
  name: string;
  description: string;
  icon: string;
  tag?: string;
  component: React.FC<VNTextBoxRenderProps>;
}
