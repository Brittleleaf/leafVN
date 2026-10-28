"use client";
import React, { useEffect } from 'react';
import { VNCharacter } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface QuickCharacterPickerModalProps {
  characters: VNCharacter[];
  onSelectCharacterEmotion: (characterId: string | undefined, emotion: string | undefined, characterName?: string) => void;
  onClose: () => void;
}

export default function QuickCharacterPickerModal({
  characters,
  onSelectCharacterEmotion,
  onClose,
}: QuickCharacterPickerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const safeCharacters = Array.isArray(characters) ? characters : [];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 vn-modal-backdrop p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans"
    >
      <div className="max-w-2xl w-full max-h-[85vh] rounded-2xl border border-[var(--border2)] bg-[var(--modal-bg)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[var(--text)]">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] shrink-0 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-4 h-4 text-[var(--accent)]" />
              <span>Select Speaker & Emotion</span>
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Click directly on an expression or narrator to assign to this line.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer text-sm transition-colors shrink-0"
            title="Close modal (Esc)"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {/* Option for Narrator / System Log without bust */}
          <div
            onClick={() => onSelectCharacterEmotion(undefined, undefined, 'Narrator / System')}
            className="p-3 rounded-xl hover:bg-[var(--surface-strong)] flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-surface)] flex items-center justify-center shrink-0 text-[var(--accent)] group-hover:scale-105 transition-transform">
                <GuiIconRenderer icon={GUI_ICONS.general.speaker} className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div>
                <span className="font-bold text-xs text-[var(--text)] uppercase block group-hover:text-[var(--accent)] transition-colors">
                  Narrator / System Log
                </span>
                <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--text)]/80 transition-colors">
                  Voice-over narration without a character bust on screen.
                </span>
              </div>
            </div>
            <span className="text-xs text-[var(--muted)] group-hover:text-[var(--accent)] font-semibold uppercase transition-colors shrink-0">
              Select →
            </span>
          </div>

          <div className="h-[1px] bg-[var(--border)] my-1" />

          {safeCharacters.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--muted)]">
              No characters registered in this story yet. You can add characters from Character Studio.
            </div>
          ) : (
            safeCharacters.map((ch, idx) => (
              <React.Fragment key={ch.id}>
                {idx > 0 && <div className="h-[1px] bg-[var(--border)] my-3" />}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-bold text-xs uppercase tracking-wide flex items-center gap-2" style={{ color: ch.color || 'var(--accent)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color || 'var(--accent)' }} />
                      {ch.name}
                    </span>
                    {ch.badgeTitle && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--well-bg)] text-[var(--muted)]">
                        {ch.badgeTitle}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {/* Neutral emotion */}
                    <div
                      onClick={() => onSelectCharacterEmotion(ch.id, 'neutral', `${ch.name} (Neutral)`)}
                      className="p-2 rounded-xl hover:bg-[var(--surface-strong)] text-center cursor-pointer transition-all group"
                    >
                      <img
                        src={ch.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png'}
                        alt="neutral"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/image/characters/SUBJECT-TEMPLATE.png';
                        }}
                        className="w-14 h-14 object-cover mx-auto rounded-lg mb-1 group-hover:scale-105 transition-transform shadow-xs"
                      />
                      <span className="text-[10px] text-[var(--muted)] group-hover:text-[var(--text)] font-semibold uppercase block truncate transition-colors">
                        Neutral
                      </span>
                    </div>

                    {/* Other emotions */}
                    {ch.expressions &&
                      Object.entries(ch.expressions)
                        .filter(([emKey]) => emKey !== 'neutral')
                        .map(([emKey, emUrl]) => (
                        <div
                          key={emKey}
                          onClick={() => onSelectCharacterEmotion(ch.id, emKey, `${ch.name} (${emKey})`)}
                          className="p-2 rounded-xl hover:bg-[var(--surface-strong)] text-center cursor-pointer transition-all group"
                        >
                          <img
                            src={emUrl || ch.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png'}
                            alt={emKey}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/image/characters/SUBJECT-TEMPLATE.png';
                            }}
                            className="w-14 h-14 object-cover mx-auto rounded-lg mb-1 group-hover:scale-105 transition-transform shadow-xs"
                          />
                          <span className="text-[10px] text-[var(--accent)] group-hover:text-[var(--text)] font-semibold uppercase block truncate transition-colors">
                            {emKey}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
