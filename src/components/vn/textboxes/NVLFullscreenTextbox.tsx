"use client";
import React from 'react';
import { VNTextBoxSkinDefinition, VNTextBoxRenderProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const NVLFullscreenTextboxComponent: React.FC<VNTextBoxRenderProps> = ({
  speakerName,
  dialogueText,
  speakerColor = '#ef4444',
  backgroundColor = 'rgba(4, 4, 8, 0.88)',
  textColor = '#f3f4f6',
  nameplateColor,
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
      className={`fixed inset-0 z-40 p-8 sm:p-14 flex flex-col justify-end cursor-pointer backdrop-blur-md select-none transition-all ${className}`}
      style={{
        backgroundColor,
        fontFamily: fontFamily ? `var(--font-${fontFamily}), ${fontFamily}, Georgia, serif` : undefined,
        ...style,
      }}
    >
      {/* Header Bar */}
      <div className="absolute top-6 right-8 flex items-center gap-3">
        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500">
          NVL FULLSCREEN MODE
        </span>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 px-2.5 rounded bg-white/10 hover:bg-white/20 text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto w-full space-y-4">
        {/* Speaker Name */}
        {speakerName && (
          <div className="flex items-center gap-3 border-b border-white/15 pb-2">
            {avatarNode && <div className="w-10 h-10 shrink-0">{avatarNode}</div>}
            <span
              className="text-sm font-black tracking-widest uppercase"
              style={{ color: nameplateColor || speakerColor }}
            >
              {speakerName}
            </span>
          </div>
        )}

        {/* Narrative Flow Paragraph */}
        <div
          className={`leading-loose tracking-wide font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] ${fontSizeClass}`}
          style={{ color: textColor }}
        >
          {dialogueText}
        </div>

        <div className="flex justify-end pt-2">
          <span className="text-xs font-mono font-bold text-gray-400 animate-pulse">
            CLICK TO ADVANCE ▾
          </span>
        </div>
      </div>
    </div>
  );
};

export const nvlFullscreenTextboxSkin: VNTextBoxSkinDefinition = {
  id: 'nvl',
  name: 'NVL Fullscreen Mode',
  description: 'Classic full-screen visual novel narrative format covering the scene with atmospheric prose overlay.',
  icon: GUI_ICONS.general.files,
  tag: 'CLASSIC',
  component: NVLFullscreenTextboxComponent,
};
