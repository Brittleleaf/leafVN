"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const PalimpsestDotCursor: React.FC<VNCursorComponentProps> = ({ isPointer, isDown }) => (
  <div
    style={{
      width: isDown ? '6px' : isPointer ? '16px' : '8px',
      height: isDown ? '6px' : isPointer ? '16px' : '8px',
      borderRadius: '50%',
      backgroundColor: '#ede0c8',
      mixBlendMode: 'difference',
      transform: 'translate(-50%, -50%)',
      transition: 'width 0.2s ease, height 0.2s ease, opacity 0.3s ease',
      boxShadow: isPointer ? '0 0 14px rgba(237, 224, 200, 0.8)' : '0 0 6px rgba(237, 224, 200, 0.5)',
    }}
  />
);

export const PalimpsestDotPreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center">
    <span className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse" />
  </div>
);

export const palimpsestDotCursorDef: VNCursorDefinition = {
  id: 'palimpsest_dot',
  name: 'Palimpsest Dot',
  category: 'artistic',
  description: 'Minimal luminous inverted dot with difference blend mode, expands on interactive elements.',
  icon: GUI_ICONS.general.circle,
  renderPreview: () => <PalimpsestDotPreview />,
  renderCursor: (props) => <PalimpsestDotCursor {...props} />,
};
