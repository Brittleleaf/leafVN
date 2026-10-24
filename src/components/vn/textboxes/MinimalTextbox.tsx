"use client";
import React from 'react';
import { VNTextBoxSkinDefinition, VNTextBoxRenderProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const MinimalTextboxComponent: React.FC<VNTextBoxRenderProps> = ({
  speakerName,
  dialogueText,
  speakerColor = '#ffffff',
  textColor = '#ffffff',
  nameplateColor,
  badge,
  badgeColor,
  avatarNode,
  fontSizeClass = 'text-lg',
  fontFamily,
  onAdvance,
  onClose,
  className = '',
  style = {},
}) => {
  return (
    <div
      onClick={onAdvance}
      className={`relative w-full max-w-4xl mx-auto p-4 cursor-pointer select-none rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl transition-all ${className}`}
      style={{
        fontFamily: fontFamily ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif` : undefined,
        ...style,
      }}
    >
      {/* Avatar Node */}
      {avatarNode && (
        <div className="absolute -top-14 left-4 z-20 pointer-events-none">
          {avatarNode}
        </div>
      )}

      {/* Header */}
      {(speakerName || badge) && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {speakerName && (
              <span
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: nameplateColor || speakerColor }}
              >
                {speakerName}
              </span>
            )}
            {badge && (
              <span
                className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono uppercase"
                style={{ color: badgeColor }}
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
              className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
              title="Close dialogue box"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Minimal Subtitle Text */}
      <div
        className={`leading-relaxed text-center font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] ${fontSizeClass}`}
        style={{ color: textColor }}
      >
        {dialogueText}
      </div>
    </div>
  );
};

export const minimalTextboxSkin: VNTextBoxSkinDefinition = {
  id: 'minimal',
  name: 'Minimal Subtitle',
  description: 'Clean modern cinematic subtitles floating gracefully over the viewport without heavy frames.',
  icon: GUI_ICONS.general.texts,
  tag: 'CLEAN',
  component: MinimalTextboxComponent,
};
