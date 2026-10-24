"use client";
import React from 'react';
import { VNTextBoxSkinDefinition, VNTextBoxRenderProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const ClassifiedTextboxComponent: React.FC<VNTextBoxRenderProps> = ({
  speakerName,
  dialogueText,
  speakerColor = '#ef4444',
  borderColor = '#b91c1c',
  backgroundColor = 'rgba(8, 8, 12, 0.94)',
  textColor = '#e5e7eb',
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
  const effectiveSpeakerColor = speakerColor || '#ef4444';
  const effectiveBorderColor = borderColor || '#b91c1c';

  return (
    <div
      onClick={onAdvance}
      className={`relative w-full border-2 rounded-xl p-3.5 cursor-pointer shadow-[0_0_40px_rgba(0,0,0,0.9)] transition-all select-none ${className}`}
      style={{
        borderColor: effectiveBorderColor,
        backgroundColor: backgroundColor,
        fontFamily: fontFamily ? `var(--font-${fontFamily}), ${fontFamily}, monospace` : undefined,
        ...style,
      }}
    >
      {/* Docked Character Avatar pinned flush to top border */}
      {avatarNode && (
        <div className="absolute -top-14 left-4 z-20 pointer-events-none">
          {avatarNode}
        </div>
      )}

      {/* Military/Dossier Corner Accents */}
      <div
        className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 pointer-events-none"
        style={{ borderColor: effectiveSpeakerColor }}
      />
      <div
        className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 pointer-events-none"
        style={{ borderColor: effectiveSpeakerColor }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 pointer-events-none"
        style={{ borderColor: effectiveSpeakerColor }}
      />
      <div
        className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 pointer-events-none"
        style={{ borderColor: effectiveSpeakerColor }}
      />

      {/* Header: Nameplate, Badge, and Close Button */}
      <div
        className="flex items-center justify-between mb-2 border-b pb-1.5"
        style={{ borderColor: `${effectiveBorderColor}40` }}
      >
        <div className="flex items-center gap-2">
          {speakerName && (
            <span
              className="font-bold text-xs tracking-widest uppercase"
              style={{ color: nameplateColor || effectiveSpeakerColor }}
            >
              {speakerName}
            </span>
          )}
          {badge && (
            <span
              className="text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono font-bold"
              style={{
                backgroundColor: `${badgeColor || effectiveSpeakerColor}20`,
                borderColor: `${badgeColor || effectiveSpeakerColor}80`,
                color: badgeColor || effectiveSpeakerColor,
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
            className="p-1 px-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 border border-white/10"
            title="Close dialogue box"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
            <span className="text-[10px] font-mono">HIDE</span>
          </button>
        )}
      </div>

      {/* Dialogue Content */}
      <div
        className={`leading-relaxed tracking-wide min-h-[3rem] ${fontSizeClass}`}
        style={{ color: textColor }}
      >
        {dialogueText}
      </div>

      {/* Advance Arrow Indicator */}
      <div className="flex justify-end mt-1">
        <span
          className="animate-bounce text-xs font-mono font-bold opacity-75"
          style={{ color: effectiveSpeakerColor }}
        >
          ▶
        </span>
      </div>
    </div>
  );
};

export const classifiedTextboxSkin: VNTextBoxSkinDefinition = {
  id: 'classified',
  name: 'Classified Dossier',
  description: 'Military incident report style with corner brackets, stamp tags, and dark dossier framing.',
  icon: GUI_ICONS.general.files,
  tag: 'DEFAULT',
  component: ClassifiedTextboxComponent,
};
