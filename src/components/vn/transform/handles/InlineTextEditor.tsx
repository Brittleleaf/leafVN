"use client";
import React from 'react';
import { VNTransformableTarget } from '../types';

export interface InlineTextEditorProps {
  target: VNTransformableTarget;
  tempText: string;
  setTempText: (val: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  target,
  tempText,
  setTempText,
  onCommit,
  onCancel,
}) => {
  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-50 flex items-center justify-center p-2 bg-black/85 rounded backdrop-blur-sm pointer-events-auto min-w-[120px] min-h-[48px]"
    >
      <textarea
        autoFocus
        value={tempText}
        onChange={(e) => setTempText(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onCommit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        onBlur={onCommit}
        className="w-full h-full bg-transparent text-center font-bold text-white resize-none outline-none border border-cyan-400/50 rounded p-1 leading-snug"
        style={{
          fontFamily: target.fontFamily || 'inherit',
          color: target.textColor || '#ffffff',
          fontSize:
            target.fontSize === '3xl'
              ? '1.875rem'
              : target.fontSize === '2xl'
              ? '1.5rem'
              : target.fontSize === 'xl'
              ? '1.25rem'
              : target.fontSize === 'lg'
              ? '1.125rem'
              : '1rem',
        }}
        placeholder="Enter text here..."
      />
    </div>
  );
};
