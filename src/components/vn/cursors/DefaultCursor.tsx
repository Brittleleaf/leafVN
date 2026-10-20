"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const DefaultCursor: React.FC<VNCursorComponentProps> = () => null;

export const DefaultCursorPreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center text-gray-300">
    <GuiIconRenderer icon={GUI_ICONS.navigation.arrowUp} className="w-5 h-5 -rotate-45" />
  </div>
);

export const defaultCursorDef: VNCursorDefinition = {
  id: 'default',
  name: 'Default OS Pointer',
  category: 'classic',
  description: 'Standard operating system arrow cursor without override.',
  icon: GUI_ICONS.navigation.arrowUp,
  renderPreview: () => <DefaultCursorPreview />,
  renderCursor: (props) => <DefaultCursor {...props} />,
};
