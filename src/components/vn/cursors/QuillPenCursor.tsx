"use client";
import React from 'react';
import { VNCursorDefinition, VNCursorComponentProps } from './types';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export const QuillPenCursor: React.FC<VNCursorComponentProps> = ({ isPointer, isDown }) => (
  <div
    style={{
      transform: `translate(0, -20px) scale(${isDown ? 0.88 : isPointer ? 1.12 : 1}) rotate(${isPointer ? '-15deg' : '0deg'})`,
      transition: 'transform 0.15s ease',
      transformOrigin: 'bottom left',
    }}
    className="pointer-events-none filter drop-shadow-[0_2px_10px_rgba(192,132,252,0.6)]"
  >
    <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
      <path
        d="M26 4C24 7 20 12 17 17C14 22 10 26 6 29C7 25 9 20 12 17C15 14 21 8 26 4Z"
        fill="#c084fc"
        stroke="#581c87"
        strokeWidth="1.2"
      />
      <path d="M6 29L4 31L7 30L6 29Z" fill="#e9d5ff" stroke="#3b0764" strokeWidth="0.8" />
      <circle cx="5" cy="30" r="1.5" fill="#f43f5e" />
    </svg>
  </div>
);

export const QuillPenPreview: React.FC = () => (
  <div className="w-8 h-8 flex items-center justify-center text-purple-300">
    <GuiIconRenderer icon={GUI_ICONS.general.pencil} className="w-5 h-5 text-purple-400" />
  </div>
);

export const quillPenCursorDef: VNCursorDefinition = {
  id: 'quill_pen',
  name: 'Calligraphy Quill',
  category: 'artistic',
  description: 'Elegant Victorian feather quill and fountain ink nib.',
  icon: GUI_ICONS.general.pencil,
  renderPreview: () => <QuillPenPreview />,
  renderCursor: (props) => <QuillPenCursor {...props} />,
};
