"use client";
import React from 'react';
import { VNTextBoxSkinDefinition, VNTextBoxRenderProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const ParchmentTextboxComponent: React.FC<VNTextBoxRenderProps> = ({
  speakerName,
  dialogueText,
  speakerColor = '#c8a96e',
  borderColor = '#b8944d',
  backgroundColor = 'rgba(26, 21, 15, 0.95)',
  textColor = '#f7eed8',
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
  const gold = speakerColor || '#c8a96e';

  return (
    <div
      onClick={onAdvance}
      className={`relative w-full rounded-2xl p-4 cursor-pointer select-none border-2 shadow-[0_8px_30px_rgba(0,0,0,0.9)] transition-all ${className}`}
      style={{
        backgroundColor,
        borderColor: borderColor || gold,
        boxShadow: `0 0 20px ${gold}30, inset 0 0 30px rgba(0,0,0,0.8)`,
        fontFamily: fontFamily ? `var(--font-${fontFamily}), ${fontFamily}, Georgia, serif` : 'Georgia, serif',
        ...style,
      }}
    >
      {/* Docked Character Avatar */}
      {avatarNode && (
        <div className="absolute -top-16 left-6 z-20 pointer-events-none">
          {avatarNode}
        </div>
      )}

      {/* Antique Filigree Corner Accents */}
      <span className="absolute top-1 left-1.5 text-xs select-none opacity-60" style={{ color: gold }}>
        ✦
      </span>
      <span className="absolute top-1 right-1.5 text-xs select-none opacity-60" style={{ color: gold }}>
        ✦
      </span>
      <span className="absolute bottom-1 left-1.5 text-xs select-none opacity-60" style={{ color: gold }}>
        ✦
      </span>
      <span className="absolute bottom-1 right-1.5 text-xs select-none opacity-60" style={{ color: gold }}>
        ✦
      </span>

      {/* Header Nameplate */}
      <div
        className="flex items-center justify-between mb-2 pb-1.5 border-b"
        style={{ borderColor: `${gold}40` }}
      >
        <div className="flex items-center gap-2">
          {speakerName && (
            <span
              className="font-bold text-sm tracking-widest uppercase italic"
              style={{
                color: nameplateColor || gold,
                textShadow: `0 1px 4px rgba(0,0,0,0.9)`,
              }}
            >
              {speakerName}
            </span>
          )}
          {badge && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-serif uppercase tracking-wider"
              style={{
                backgroundColor: `${badgeColor || gold}20`,
                border: `1px solid ${badgeColor || gold}60`,
                color: badgeColor || gold,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 px-2 rounded hover:bg-white/10 text-amber-200/70 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 border border-amber-500/20"
            title="Close dialogue box"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dialogue Content */}
      <div
        className={`leading-relaxed tracking-wide min-h-[3rem] font-serif ${fontSizeClass}`}
        style={{
          color: textColor,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        {dialogueText}
      </div>

      {/* Scroll Quill Icon */}
      <div className="flex justify-end mt-1">
        <span className="text-xs opacity-75 animate-bounce" style={{ color: gold }}>
          ❧
        </span>
      </div>
    </div>
  );
};

export const parchmentTextboxSkin: VNTextBoxSkinDefinition = {
  id: 'parchment',
  name: 'Retro Antique Parchment',
  description: 'Warm antique manuscript parchment with ornate gold filigree corners for fantasy, historical, or mystery novels.',
  icon: GUI_ICONS.general.pencil,
  tag: 'FANTASY',
  component: ParchmentTextboxComponent,
};
