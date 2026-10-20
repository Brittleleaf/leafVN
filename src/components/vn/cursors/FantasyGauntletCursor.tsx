"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const FantasyGauntletCursor: React.FC<VNCursorComponentProps> = ({ isPointer, isDown }) => (
  <div
    style={{
      transform: `translate(0, 0) scale(${isDown ? 0.9 : isPointer ? 1.15 : 1})`,
      transition: 'transform 0.15s ease',
    }}
    className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]"
  >
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
      <path
        d="M5 2L16 13L11 15L15 23L12 25L8 17L3 18L5 2Z"
        fill="#f59e0b"
        stroke="#78350f"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 6L14 13" stroke="#fef3c7" strokeWidth="1" />
    </svg>
  </div>
);

export const FantasyGauntletPreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center text-amber-400">
    <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-5 h-5 text-amber-400" />
  </div>
);

export const fantasyGauntletCursorDef: VNCursorDefinition = {
  id: 'fantasy_gauntlet',
  name: 'RPG Fantasy Gauntlet',
  category: 'fantasy',
  description: 'Golden engraved fantasy knight gauntlet hand pointing forward.',
  icon: GUI_ICONS.action.target,
  renderPreview: () => <FantasyGauntletPreview />,
  renderCursor: (props) => <FantasyGauntletCursor {...props} />,
};
