"use client";
import React from 'react';
import { VNCharacter } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CharacterDossierSidebarProps {
  activeChar: VNCharacter;
}

export const CharacterDossierSidebar: React.FC<CharacterDossierSidebarProps> = ({
  activeChar,
}) => {
  return (
    <div className="w-full md:w-64 lg:w-72 border-l border-[var(--border)] bg-[var(--well-bg)] p-4 flex flex-col justify-between overflow-y-auto space-y-4 shrink-0 custom-scrollbar">
      <div className="space-y-3.5">
        <div className="text-center">
          <div
            className="w-36 h-48 mx-auto rounded-2xl overflow-hidden border-2 shadow-xl relative transition-all group bg-[var(--card-bg)]"
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
            {activeChar.badgeTitle || 'OPERATOR'}
          </span>
        </div>

        {/* Configuration summary */}
        <div className="p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
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
            <span className="text-[var(--text)] uppercase font-mono text-[10px]">
              {activeChar.side || 'center'}
            </span>
          </div>
        </div>

        {/* Quick Lore Guide */}
        <div className="p-3 bg-[var(--accent-surface)] border border-[var(--border2)] rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-[var(--accent)] text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
              <span>LORE GUIDE / NOTES</span>
            </span>
            <span className="text-[9px] font-mono text-[var(--muted2)]">CONFIDENTIAL</span>
          </div>
          <p className="text-[11px] text-[var(--text)] leading-relaxed max-h-48 overflow-y-auto italic whitespace-pre-wrap font-sans">
            {activeChar.description || (
              <span className="text-[var(--muted2)] not-italic">
                No lore notes recorded. Add background in 'Identity & Lore' to keep them readily accessible here.
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)] text-center">
        <span className="text-[9px] text-[var(--muted2)] font-mono tracking-widest block">
          CHARACTER DOSSIER // ACTIVE
        </span>
      </div>
    </div>
  );
};
