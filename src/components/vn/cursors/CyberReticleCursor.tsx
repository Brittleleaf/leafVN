"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const CyberReticleCursor: React.FC<VNCursorComponentProps> = ({ isPointer, isDown }) => (
  <div
    style={{
      transform: `translate(-50%, -50%) scale(${isDown ? 0.85 : isPointer ? 1.25 : 1})`,
      transition: 'transform 0.15s ease',
    }}
    className="relative w-7 h-7 text-cyan-400 filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] pointer-events-none"
  >
    <svg viewBox="0 0 28 28" className="w-full h-full animate-spin" style={{ animationDuration: '8s' }} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="14" cy="14" r="10" strokeDasharray="5 3" />
      <line x1="14" y1="1" x2="14" y2="5" />
      <line x1="14" y1="23" x2="14" y2="27" />
      <line x1="1" y1="14" x2="5" y2="14" />
      <line x1="23" y1="14" x2="27" y2="14" />
    </svg>
    <span className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-pink-500 rounded-full animate-ping" />
    <span className="absolute top-1/2 left-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full" />
  </div>
);

export const CyberReticlePreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center text-cyan-400">
    <svg viewBox="0 0 24 24" className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
    </svg>
  </div>
);

export const cyberReticleCursorDef: VNCursorDefinition = {
  id: 'cyber_reticle',
  name: 'Cyberpunk Reticle',
  category: 'cyberpunk',
  description: 'Neon cyan digital targeting reticle with rotary tick marks and center lock pip.',
  icon: GUI_ICONS.action.target,
  renderPreview: () => <CyberReticlePreview />,
  renderCursor: (props) => <CyberReticleCursor {...props} />,
};
