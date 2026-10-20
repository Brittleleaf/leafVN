import React from 'react';
import { VNCursorType } from '@/types/vn';

export interface VNCursorComponentProps {
  isPointer: boolean;
  isDown: boolean;
}

export interface VNCursorDefinition {
  id: VNCursorType;
  name: string;
  category: 'artistic' | 'classic' | 'cyberpunk' | 'fantasy' | 'noir';
  description: string;
  icon: string;
  renderPreview: () => React.ReactNode;
  renderCursor: (props: VNCursorComponentProps) => React.ReactNode;
}
