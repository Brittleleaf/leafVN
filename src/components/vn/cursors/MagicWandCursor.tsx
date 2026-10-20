"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const MagicWandCursor: React.FC<VNCursorComponentProps> = ({ isPointer, isDown }) => (
  <div
    style={{
      transform: `translate(0, 0) scale(${isDown ? 0.9 : isPointer ? 1.2 : 1})`,
      transition: 'transform 0.15s ease',
    }}
    className="pointer-events-none filter drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
  >
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
      <line x1="6" y1="26" x2="24" y2="8" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="26" x2="24" y2="8" stroke="#ca8a04" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="25" cy="7" r="3" fill="#fef08a" stroke="#eab308" strokeWidth="1.5" />
      <path d="M25 1V5M25 9V13M19 7H23M27 7H31" stroke="#fde047" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  </div>
);

export const MagicWandPreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center text-yellow-300">
    <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-5 h-5 text-yellow-300" />
  </div>
);

export const magicWandCursorDef: VNCursorDefinition = {
  id: 'magic_wand',
  name: 'Arcane Wand',
  category: 'fantasy',
  description: 'Enchanted cosmic crystal staff tipped with gleaming starbursts.',
  icon: GUI_ICONS.general.screenFx,
  renderPreview: () => <MagicWandPreview />,
  renderCursor: (props) => <MagicWandCursor {...props} />,
};
