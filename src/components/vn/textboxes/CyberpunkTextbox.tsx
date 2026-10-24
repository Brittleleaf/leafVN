"use client";
import React from 'react';
import { VNTextBoxSkinDefinition, VNTextBoxRenderProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const CyberpunkTextboxComponent: React.FC<VNTextBoxRenderProps> = ({
  speakerName,
  dialogueText,
  speakerColor = '#00ffff',
  borderColor = '#00ffff',
  backgroundColor = 'rgba(5, 7, 15, 0.92)',
  textColor = '#f0fdf4',
  nameplateColor,
  badge,
  badgeColor,
  avatarNode,
  fontSizeClass = 'text-base',
  fontFamily,
  onAdvance,
  onClose,
  className = '',
  style = {},
}) => {
  const accentColor = speakerColor || '#00ffff';

  return (
    <div
      onClick={onAdvance}
      className={`relative w-full rounded-2xl p-4 cursor-pointer backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_35px_rgba(0,255,255,0.25)] transition-all select-none ${className}`}
      style={{
        backgroundColor,
        borderColor: borderColor || 'rgba(0, 255, 255, 0.4)',
        fontFamily: fontFamily ? `var(--font-${fontFamily}), ${fontFamily}, monospace` : 'monospace',
        ...style,
      }}
    >
      {/* Docked Character Avatar */}
      {avatarNode && (
        <div className="absolute -top-16 left-6 z-20 pointer-events-none">
          {avatarNode}
        </div>
      )}

      {/* Cyberpunk Circuit Header Rail */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          {/* Status LED */}
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          {speakerName && (
            <span
              className="font-mono font-black text-xs tracking-widest uppercase drop-shadow-[0_0_8px_currentColor]"
              style={{ color: nameplateColor || accentColor }}
            >
              {speakerName}
            </span>
          )}
          {badge && (
            <span
              className="text-[9px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-mono tracking-widest uppercase"
              style={{
                color: badgeColor || undefined,
                borderColor: badgeColor || undefined,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-cyan-500/70 tracking-widest hidden sm:inline">
            // NEURAL_LINK: SYNCED
          </span>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 px-2 rounded hover:bg-cyan-500/20 text-cyan-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 border border-cyan-500/30"
              title="Close dialogue box"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Dialogue Content */}
      <div
        className={`leading-relaxed tracking-wide min-h-[3rem] ${fontSizeClass}`}
        style={{ color: textColor }}
      >
        {dialogueText}
      </div>

      {/* Futuristic Blinking Terminal Cursor */}
      <div className="flex justify-end mt-1 items-center gap-1">
        <span className="text-[10px] font-mono text-cyan-400 opacity-60">NEXT</span>
        <span className="w-2 h-3.5 bg-cyan-400 animate-pulse block" />
      </div>
    </div>
  );
};

export const cyberpunkTextboxSkin: VNTextBoxSkinDefinition = {
  id: 'cyberpunk',
  name: 'Cyberpunk Acrylic Glass',
  description: 'Futuristic HUD terminal with neon circuit borders, neural link indicators, and frosted glass.',
  icon: GUI_ICONS.general.screenFx,
  tag: 'CYBER',
  component: CyberpunkTextboxComponent,
};
