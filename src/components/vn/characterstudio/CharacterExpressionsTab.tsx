"use client";
import React from 'react';
import { VNCharacter } from '@/types/vn';
import { CHARACTER_MOOD_PRESETS, GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import { fileToBase64 } from '@/lib/vn/engineUtils';

interface CharacterExpressionsTabProps {
  activeChar: VNCharacter;
  newMoodName: string;
  setNewMoodName: (name: string) => void;
  newMoodUrl: string;
  setNewMoodUrl: (url: string) => void;
  handleUpdateChar: (charId: string, patch: Partial<VNCharacter>) => void;
  onOpenMoodAssetPicker: (editingKey?: string | null) => void;
  notify: (msg: string) => void;
}

export const CharacterExpressionsTab: React.FC<CharacterExpressionsTabProps> = ({
  activeChar,
  newMoodName,
  setNewMoodName,
  newMoodUrl,
  setNewMoodUrl,
  handleUpdateChar,
  onOpenMoodAssetPicker,
  notify,
}) => {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
            <GuiIconRenderer icon={GUI_ICONS.general.masksMood} className="w-4 h-4 text-[var(--accent)]" />
            <span>Moods & Expression Sprites</span>
          </h4>
          <span className="text-xs font-mono text-[var(--accent)] bg-[var(--well-bg)] px-2 py-0.5 rounded-lg border border-[var(--border)]">
            {Object.keys(activeChar.expressions || {}).length} configured
          </span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-1">
          Define visual reactions for {activeChar.name}. You can select them instantly when crafting dialogue lines.
        </p>
      </div>

      {/* Quick mood suggestion chips */}
      <div className="space-y-2 p-3 bg-[var(--well-bg)] border border-[var(--border)] rounded-md">
        <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block">
          Quick Mood Suggestions:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CHARACTER_MOOD_PRESETS.map((chip) => {
            const exists = activeChar.expressions?.[chip.key];
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  setNewMoodName(chip.key);
                  if (!newMoodUrl && activeChar.avatarUrl) {
                    setNewMoodUrl(activeChar.avatarUrl);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  exists
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border2)] hover:text-[var(--text)]'
                }`}
              >
                <GuiIconRenderer icon={chip.icon} className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
                {exists && <GuiIconRenderer icon={GUI_ICONS.action.check} className="w-2.5 h-2.5 text-emerald-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form to add or edit mood */}
      <div className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg space-y-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Add or Edit Mood Expression</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
              Mood / Emotion Name:
            </label>
            <input
              type="text"
              placeholder="Enter expression name here..."
              value={newMoodName}
              onChange={(e) => setNewMoodName(e.target.value)}
              className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text)] font-bold outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
              Photo for this Mood:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Photo URL or choose from Gallery / PC..."
                value={newMoodUrl}
                onChange={(e) => setNewMoodUrl(e.target.value)}
                className="flex-1 min-w-0 bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] font-mono transition-colors"
              />
              
              <div className="flex items-center gap-2 shrink-0">
                {/* Gallery button */}
                <button
                  type="button"
                  onClick={() => onOpenMoodAssetPicker(null)}
                  className="px-3 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  title="Choose image from Asset Studio"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>

                {/* PC Upload button */}
                <label className="px-3 py-2 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const b64 = await fileToBase64(file);
                      setNewMoodUrl(b64);
                      playSfx('/assets/sfx/success.mp3', false, 0.4);
                      notify('Photo loaded for this mood');
                    }}
                    className="hidden"
                  />
                  <GuiIconRenderer icon={GUI_ICONS.general.upload} className="w-3.5 h-3.5" />
                  <span>From PC</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => {
              setNewMoodName('');
              setNewMoodUrl('');
            }}
            className="px-3 py-1.5 rounded-md text-xs font-bold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
          >
            Clear Form
          </button>
          <button
            type="button"
            onClick={() => {
              const cleanKey = newMoodName.trim().toLowerCase();
              if (!cleanKey) {
                notify('Please enter a name for the mood (e.g. happy, angry, smirk)');
                return;
              }
              const cleanUrl = newMoodUrl.trim() || activeChar.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png';
              const existing = { ...(activeChar.expressions || {}) };
              existing[cleanKey] = cleanUrl;
              handleUpdateChar(activeChar.id, { expressions: existing });
              notify(`Mood '${cleanKey}' saved successfully`);
              setNewMoodName('');
              setNewMoodUrl('');
              playSfx('/assets/sfx/success.mp3', false, 0.4);
            }}
            className="px-4 py-1.5 rounded-md text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow transition-all active:scale-95 flex items-center gap-1.5"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5" />
            <span>Save / Update Mood</span>
          </button>
        </div>
      </div>

      {/* Grid of registered moods */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Registered Expressions:
          </span>
          <span className="text-[10px] text-[var(--muted2)]">
            Tip: Click 'Make Base' to use an expression as the main avatar.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {/* Neutral expression card (always present) */}
          <div className="p-3 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg flex flex-col justify-between items-center text-center relative group shadow-sm">
            <div className="w-full flex items-center justify-between mb-1.5">
              <span className="text-[9px] px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 rounded-full font-mono uppercase flex items-center gap-1 font-bold">
                <span>Base</span>
              </span>
              <span className="text-[9px] text-[var(--muted2)] font-mono">Protected</span>
            </div>

            <div className="w-full aspect-[3/4] rounded-md overflow-hidden mb-2 border border-[var(--border)] bg-[var(--card-bg)]">
              <img
                src={activeChar.expressions?.neutral || activeChar.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png'}
                alt="neutral"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="flex items-center gap-1.5 justify-center max-w-full">
              <GuiIconRenderer icon={GUI_ICONS.mood.neutralFace} className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="text-xs font-bold text-[var(--text)] uppercase truncate">
                neutral
              </span>
            </div>
          </div>

          {/* Configured moods */}
          {activeChar.expressions &&
            Object.entries(activeChar.expressions)
              .filter(([key]) => key !== 'neutral')
              .map(([emKey, emUrl]) => {
                const matchedMood = CHARACTER_MOOD_PRESETS.find((p) => p.key === emKey);
                return (
                  <div
                    key={emKey}
                    className="p-3 bg-[var(--card-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg flex flex-col justify-between items-center text-center relative group transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span className="text-[9px] px-2 py-0.5 bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--border2)] rounded-full font-mono uppercase flex items-center gap-1 font-bold">
                        {matchedMood && <GuiIconRenderer icon={matchedMood.icon} className="w-2.5 h-2.5" />}
                        <span>Mood</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete mood '${emKey}'?`)) {
                            const existing = { ...(activeChar.expressions || {}) };
                            delete existing[emKey];
                            handleUpdateChar(activeChar.id, { expressions: existing });
                            notify(`Mood '${emKey}' deleted`);
                          }
                        }}
                        className="text-[var(--muted2)] hover:text-rose-500 hover:bg-rose-500/20 rounded-md p-1 text-xs cursor-pointer flex items-center justify-center transition-colors"
                        title="Delete mood"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-full aspect-[3/4] rounded-md overflow-hidden mb-2 border border-[var(--border)] bg-[var(--well-bg)]">
                      <img
                        src={emUrl}
                        alt={emKey}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 justify-center max-w-full mb-2">
                      {matchedMood && <GuiIconRenderer icon={matchedMood.icon} className="w-3.5 h-3.5 text-[var(--accent)]" />}
                      <span className="text-xs font-bold text-[var(--text)] uppercase truncate">
                        {emKey}
                      </span>
                    </div>

                    {/* Mood action buttons */}
                    <div className="w-full grid grid-cols-2 gap-1 pt-2 border-t border-[var(--border)] text-[10px]">
                      <button
                        type="button"
                        onClick={() => onOpenMoodAssetPicker(emKey)}
                        className="p-1 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] rounded-lg font-bold uppercase cursor-pointer text-center truncate border border-[var(--border)] transition-colors"
                        title="Change photo from Gallery"
                      >
                        Gallery
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateChar(activeChar.id, { avatarUrl: emUrl });
                          notify(`Mood '${emKey}' set as base photo`);
                        }}
                        className="p-1 bg-[var(--accent-surface)] hover:bg-[var(--btn-hover-bg)] text-[var(--accent)] rounded-lg font-bold uppercase cursor-pointer truncate border border-[var(--border2)] transition-colors"
                        title="Set as primary character photo"
                      >
                        Make Base
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
