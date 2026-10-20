"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const DetectiveLensCursor: React.FC<VNCursorComponentProps> = ({ isPointer, isDown }) => (
  <div
    style={{
      transform: `translate(-35%, -35%) scale(${isDown ? 0.88 : isPointer ? 1.2 : 1})`,
      transition: 'transform 0.15s ease',
    }}
    className="pointer-events-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
  >
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#d97706" strokeWidth="2.5" fill="rgba(217,119,6,0.12)" />
      <circle cx="12" cy="12" r="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="18" y1="18" x2="28" y2="28" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.5" fill="#fff" />
    </svg>
  </div>
);

export const DetectiveLensPreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center text-amber-200">
    <GuiIconRenderer icon={GUI_ICONS.action.search} className="w-5 h-5 text-amber-400" />
  </div>
);

export const detectiveLensCursorDef: VNCursorDefinition = {
  id: 'detective_lens',
  name: 'Detective Magnifier',
  category: 'noir',
  description: 'Noir detective optical lens revealing clues and hidden details.',
  icon: GUI_ICONS.action.search,
  renderPreview: () => <DetectiveLensPreview />,
  renderCursor: (props) => <DetectiveLensCursor {...props} />,
};
