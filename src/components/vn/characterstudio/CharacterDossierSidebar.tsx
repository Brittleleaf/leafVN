"use client";
import React from 'react';
import { VNCharacter } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CharacterDossierSidebarProps {
  activeChar: VNCharacter;
  isWorkspaceView?: boolean;
}

export const CharacterDossierSidebar: React.FC<CharacterDossierSidebarProps> = ({
  activeChar,
  isWorkspaceView = false,
}) => {
  return (
    <div className={`w-full md:w-64 lg:w-72 border-l border-[var(--border)] ${isWorkspaceView ? "bg-transparent backdrop-blur-xs" : "bg-[var(--well-bg)]"} p-4 flex flex-col justify-between overflow-y-auto space-y-4 shrink-0 custom-scrollbar`}>

      <div className="space-y-3.5">
        <div className="text-center">
          <div
            className="w-36 h-48 mx-auto rounded-lg overflow-hidden border-2 shadow-xl relative transition-all group bg-[var(--card-bg)]"
            style={{
              borderColor: activeChar.color || '#ef4444',
              boxShadow: `0 0 25px ${(activeChar.color || '#ef4444')}33`,
            }}
          >
            <img
              src={activeChar.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png'}
              alt={activeChar.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </div>

          <h4
            className="text-sm font-extrabold uppercase tracking-widest mt-3 truncate"
            style={{ color: activeChar.color || '#ef4444' }}
          >
            {activeChar.name}
          </h4>
          <span className="text-[10px] text-[var(--muted)] font-mono tracking-wider uppercase block mt-0.5">
            {activeChar.badgeTitle || 'CHARACTER'}
          </span>
        </div>

        {/* Configuration summary */}
        <div className="space-y-2 text-xs py-1">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[10px] uppercase font-bold">Scene Shortcut:</span>
            <span className="px-1.5 py-0.2 bg-[var(--well-bg)] border border-[var(--border)] rounded font-mono text-[var(--text)] text-[10px]">
              #{activeChar.shortcut || '0'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[10px] uppercase font-bold">Total Moods:</span>
            <span className="text-[var(--accent)] font-mono font-bold text-[10px]">
              {Object.keys(activeChar.expressions || {}).length} sprites
            </span>
          </div>

          <div className="flex items-center justify-between text-[var(--muted)]">
            <span className="text-[10px] uppercase font-bold">Position:</span>
            <span className="text-[var(--text)] uppercase font-mono text-[10px] flex items-center gap-1.5">
              <GuiIconRenderer
                icon={
                  activeChar.side === 'left'
                    ? GUI_ICONS.general.alignLeft
                    : activeChar.side === 'right'
                    ? GUI_ICONS.general.alignRight
                    : GUI_ICONS.general.alignCenter
                }
                className="w-3 h-3 text-[var(--accent)]"
              />
              <span>{activeChar.side || 'center'}</span>
            </span>
          </div>
        </div>

        {/* Quick Lore Guide */}
        <div className="h-[1px] bg-[var(--border)] my-3" />
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
              <span>CHARACTER NOTES & LORE</span>
            </span>
            <span className="text-[9px] font-mono text-[var(--muted2)]">CREATOR NOTES</span>
          </div>
          <p className="text-[11px] text-[var(--text)] leading-relaxed max-h-48 overflow-y-auto italic whitespace-pre-wrap font-sans">
            {activeChar.description || (
              <span className="text-[var(--muted2)] not-italic">
                No notes recorded. Add background in 'Identity & Lore' to keep them readily accessible here.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)] text-center">
        <span className="text-[9px] text-[var(--muted2)] font-mono tracking-widest block">
          CHARACTER PROFILE // ACTIVE
        </span>
      </div>
    </div>
  );
};
