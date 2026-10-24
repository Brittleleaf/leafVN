"use client";
import React from 'react';
import { VNTransitionDefinition, VNTransitionRenderProps } from './types';
import { GUI_ICONS } from '@/lib/vn/guiIcons';

export const GlitchTearTransitionOverlay: React.FC<VNTransitionRenderProps> = ({
  isActive,
  durationSec = 0.5,
  className = '',
  style = {},
}) => {
  if (!isActive) return null;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-50 overflow-hidden ${className}`}
      style={{
        animation: `glitch-slice ${durationSec}s steps(2, start) infinite`,
        ...style,
      }}
    >
      {/* Sliced RGB channel bands */}
      <div className="absolute inset-0 bg-cyan-500/30 mix-blend-screen translate-x-2 animate-pulse" />
      <div className="absolute inset-0 bg-red-600/30 mix-blend-screen -translate-x-2 animate-pulse" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.6)_3px,rgba(0,0,0,0.6)_6px)]" />
      <div className="absolute inset-x-0 top-1/3 h-12 bg-white/20 skew-x-12 blur-[1px]" />
      <div className="absolute inset-x-0 top-2/3 h-8 bg-cyan-400/30 -skew-x-12 blur-[1px]" />
    </div>
  );
};

export const glitchTearTransition: VNTransitionDefinition = {
  id: 'glitch',
  name: 'Digital Glitch Tear',
  description: 'Cyberpunk signal collapse tearing the frame with horizontal RGB displacement slices.',
  category: 'glitch',
  icon: GUI_ICONS.general.screenFx,
  tag: 'CYBER',
  defaultDurationSec: 0.5,
  renderOverlay: GlitchTearTransitionOverlay,
};
