"use client";
import React from 'react';
import { VNTextBoxSkinDefinition, VNTextBoxRenderProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const NeonGlowTextboxComponent: React.FC<VNTextBoxRenderProps> = ({
  speakerName,
  dialogueText,
  speakerColor = '#D17BF8',
  borderColor = '#D17BF8',
  backgroundColor = 'rgba(15, 6, 25, 0.94)',
  textColor = '#faf5ff',
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
  const neon = speakerColor || '#D17BF8';

  return (
    <div
      onClick={onAdvance}
      className={`relative w-full rounded-2xl p-4 cursor-pointer select-none transition-all ${className}`}
      style={{
        backgroundColor,
        border: `2px solid ${borderColor || neon}`,
        boxShadow: `0 0 15px ${neon}60, inset 0 0 20px ${neon}25, 0 10px 30px rgba(0,0,0,0.9)`,
        fontFamily: fontFamily ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif` : undefined,
        ...style,
      }}
    >
      {/* Docked Character Avatar */}
      {avatarNode && (
        <div className="absolute -top-16 left-6 z-20 pointer-events-none">
          {avatarNode}
        </div>
      )}

      {/* Header Nameplate */}
      <div
        className="flex items-center justify-between mb-2 pb-1.5 border-b"
        style={{ borderColor: `${neon}40` }}
      >
        <div className="flex items-center gap-2">
          {speakerName && (
            <span
              className="font-black text-xs tracking-widest uppercase"
              style={{
                color: nameplateColor || neon,
                textShadow: `0 0 8px ${neon}, 0 0 18px ${neon}80`,
              }}
            >
              {speakerName}
            </span>
          )}
          {badge && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${badgeColor || neon}25`,
                border: `1px solid ${badgeColor || neon}80`,
                color: badgeColor || neon,
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
            className="p-1 px-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 border border-white/20"
            title="Close dialogue box"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dialogue Content */}
      <div
        className={`leading-relaxed tracking-wide min-h-[3rem] ${fontSizeClass}`}
        style={{
          color: textColor,
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        {dialogueText}
      </div>

      {/* Neon Indicator */}
      <div className="flex justify-end mt-1">
        <span
          className="text-xs font-mono font-bold animate-pulse"
          style={{ color: neon, textShadow: `0 0 8px ${neon}` }}
        >
          ◆
        </span>
      </div>
    </div>
  );
};

export const neonGlowTextboxSkin: VNTextBoxSkinDefinition = {
  id: 'neon',
  name: 'Neon Tube Glow',
  description: 'High-voltage gas neon cathode tube border with luminous glowing nameplate and soft ambient aura.',
  icon: GUI_ICONS.general.lightBulb,
  tag: 'GLOW',
  component: NeonGlowTextboxComponent,
};
