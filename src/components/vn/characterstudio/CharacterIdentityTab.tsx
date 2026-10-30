"use client";
import React from 'react';
import { VNCharacter, VNStory } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VN_FONT_CATALOG, resolveEffectiveFontFamily } from '@/lib/vn/fontCatalog';
import { playSfx } from '@/lib/audioSettings';

interface CharacterIdentityTabProps {
  activeChar: VNCharacter;
  story: VNStory;
  handleUpdateChar: (charId: string, patch: Partial<VNCharacter>) => void;
  onUpdateStory: (updatedStory: VNStory) => void;
  onOpenFontPicker: () => void;
  notify: (msg: string) => void;
}

export const CharacterIdentityTab: React.FC<CharacterIdentityTabProps> = ({
  activeChar,
  story,
  handleUpdateChar,
  onUpdateStory,
  onOpenFontPicker,
  notify,
}) => {
  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
            Character Name *
          </label>
          <input
            type="text"
            value={activeChar.name}
            placeholder="Enter character name here..."
            onChange={(e) => handleUpdateChar(activeChar.id, { name: e.target.value })}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-[var(--text)] font-bold text-sm outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Rank / Subtitle */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
            Badge / Rank
          </label>
          <input
            type="text"
            value={activeChar.badgeTitle || ''}
            placeholder="Enter badge or title here..."
            onChange={(e) => handleUpdateChar(activeChar.id, { badgeTitle: e.target.value })}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-[var(--text)] text-xs outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Distinctive Color */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
            Distinctive Color (Borders & Name)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeChar.color || '#ef4444'}
              onChange={(e) => handleUpdateChar(activeChar.id, { color: e.target.value })}
              className="w-10 h-10 rounded-md border border-[var(--border)] bg-transparent cursor-pointer p-0.5"
            />
            <input
              type="text"
              value={activeChar.color || '#ef4444'}
              onChange={(e) => handleUpdateChar(activeChar.id, { color: e.target.value })}
              className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-[var(--text)] font-mono text-xs outline-none uppercase focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>

        {/* Quick Shortcut Key */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
            Quick Keyboard Shortcut (Dialogue Line)
          </label>
          <input
            type="text"
            maxLength={1}
            value={activeChar.shortcut || ''}
            placeholder="1, 2, J..."
            onChange={(e) => handleUpdateChar(activeChar.id, { shortcut: e.target.value })}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-2.5 text-[var(--text)] font-mono font-bold text-sm outline-none focus:border-[var(--accent)] uppercase text-center transition-colors"
          />
        </div>

        {/* Character Dialogue Font */}
        <div className="space-y-1.5 sm:col-span-2 pt-1">
          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Dialogue Font (Character Typography)</span>
            </span>
            <span className="text-[10px] text-[var(--muted2)] font-mono">optional override</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFontPicker}
              className="flex-1 px-3 py-2 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-md text-left flex items-center justify-between cursor-pointer transition-colors group shadow-sm min-w-0"
              title="Click to choose character font from Gallery"
            >
              <span
                className="text-xs font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] flex items-center gap-1.5"
                style={{ fontFamily: activeChar.fontFamily || undefined }}
              >
                <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>{VN_FONT_CATALOG.find((f) => f.id === activeChar.fontFamily)?.name || 'Default Project Font (Inherited)'}</span>
              </span>
              <span className="text-[10px] text-[var(--accent)] font-bold px-2 py-0.5 rounded-lg bg-[var(--btn-bg)] border border-[var(--border)] group-hover:border-[var(--accent)] shrink-0 flex items-center gap-1">
                <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3 h-3" />
                <span>Browse Fonts</span>
              </span>
            </button>
            {activeChar.fontFamily && (
              <button
                type="button"
                onClick={() => handleUpdateChar(activeChar.id, { fontFamily: undefined })}
                className="p-2 bg-[var(--well-bg)] hover:bg-red-500/20 text-red-400 border border-[var(--border)] rounded-md cursor-pointer transition-colors text-xs shrink-0 flex items-center justify-center"
                title="Reset to inherited font"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
              </button>
            )}
          </div>
          {activeChar.fontFamily && (
            <div
              className="p-3 rounded-md bg-[var(--well-bg)] border border-[var(--border)] text-sm mt-1 transition-all"
              style={{
                fontFamily: resolveEffectiveFontFamily({ characterFont: activeChar.fontFamily }),
              }}
            >
              <span className="text-[10px] text-[var(--muted)] block mb-1 font-mono uppercase tracking-wider">
                Typography Preview:
              </span>
              <span style={{ color: activeChar.color || '#ef4444' }} className="font-bold mr-1">
                {activeChar.name}:
              </span>
              <span className="text-[var(--text)]">
                &ldquo;This is a sample line previewing the typography and dialogue font for this character.&rdquo;
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scene Position */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
          Default Scene Position:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'left', label: 'Left', icon: GUI_ICONS.general.alignLeft },
            { id: 'center', label: 'Center', icon: GUI_ICONS.general.alignCenter },
            { id: 'right', label: 'Right', icon: GUI_ICONS.general.alignRight },
          ].map((pos) => {
            const isSel = (activeChar.side || 'center') === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => handleUpdateChar(activeChar.id, { side: pos.id as any })}
                className={`py-2 px-3 rounded-md border text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSel
                    ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow'
                    : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                }`}
              >
                <GuiIconRenderer icon={pos.icon} className="w-3.5 h-3.5" />
                <span>{pos.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Character Base Scale */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
            Default Character Scale:
          </label>
          <span className="text-xs font-mono font-bold text-[var(--accent)]">
            {(activeChar.defaultScale ?? 1.0).toFixed(2)}x
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-2 py-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                const current = activeChar.defaultScale ?? 1.0;
                const next = Math.max(0.4, Math.round((current - 0.05) * 100) / 100);
                handleUpdateChar(activeChar.id, { defaultScale: next });
              }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--btn-hover-bg)] text-[var(--text)] font-bold cursor-pointer transition-colors"
              title="Decrease scale"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold text-[var(--text)] min-w-[48px] text-center">
              {(activeChar.defaultScale ?? 1.0).toFixed(2)}x
            </span>
            <button
              type="button"
              onClick={() => {
                const current = activeChar.defaultScale ?? 1.0;
                const next = Math.min(2.5, Math.round((current + 0.05) * 100) / 100);
                handleUpdateChar(activeChar.id, { defaultScale: next });
              }}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-[var(--btn-hover-bg)] text-[var(--text)] font-bold cursor-pointer transition-colors"
              title="Increase scale"
            >
              +
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1">
            {[0.8, 1.0, 1.2, 1.5].map((preset) => {
              const isCurrent = Math.abs((activeChar.defaultScale ?? 1.0) - preset) < 0.01;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleUpdateChar(activeChar.id, { defaultScale: preset })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                      : 'bg-[var(--well-bg)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                  }`}
                >
                  {preset}x
                </button>
              );
            })}
          </div>

          {/* Button: Apply scale to all existing dialogues of this character */}
          <button
            type="button"
            onClick={() => {
              const scale = activeChar.defaultScale ?? 1.0;
              let count = 0;
              const updatedChapters = story.chapters.map((chap) => ({
                ...chap,
                scenes: chap.scenes.map((sc) => ({
                  ...sc,
                  timeline: (sc.timeline || []).map((ev) => {
                    if (ev.characterId === activeChar.id) {
                      count++;
                      return { ...ev, characterScale: scale };
                    }
                    return ev;
                  }),
                })),
              }));
              const updatedScenarios = (story.scenarios || []).map((sc) => ({
                ...sc,
                timeline: (sc.timeline || []).map((ev) => {
                  if (ev.characterId === activeChar.id) {
                    count++;
                    return { ...ev, characterScale: scale };
                  }
                  return ev;
                }),
              }));
              const updatedCharacters = story.characters.map((c) =>
                c.id === activeChar.id ? { ...c, defaultScale: scale } : c
              );
              onUpdateStory({
                ...story,
                characters: updatedCharacters,
                chapters: updatedChapters,
                scenarios: updatedScenarios,
              });
              notify(`Scale ${scale}x applied to all dialogues of ${activeChar.name} (${count} lines)`);
              playSfx('/assets/sfx/click intro.mp3', false, 0.2);
            }}
            className="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Apply this universal scale to all existing dialogues of this character across all chapters"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.copy} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Copy scale to existing dialogues</span>
          </button>
        </div>
      </div>

      {/* Lore Dossier / Notes */}
      <div className="space-y-1 pt-2 border-t border-[var(--border)]">
        <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center justify-between">
          <span>Character Lore & Creator Notes</span>
          <span className="text-[10px] text-[var(--muted2)] font-normal">Private to writer</span>
        </label>
        <textarea
          rows={4}
          value={activeChar.description || ''}
          placeholder="Enter character description here..."
          onChange={(e) => handleUpdateChar(activeChar.id, { description: e.target.value })}
          className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-3 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] leading-relaxed font-sans transition-colors"
        />
      </div>
    </div>
  );
};
