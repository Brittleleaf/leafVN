"use client";
import React from 'react';
import { VNCharacter } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import { fileToBase64, uploadProjectAssetFile } from '@/lib/vn/engineUtils';

interface CharacterAvatarTabProps {
  activeChar: VNCharacter;
  projectId?: string;
  handleUpdateChar: (charId: string, patch: Partial<VNCharacter>) => void;
  onOpenAvatarAssetPicker: () => void;
  notify: (msg: string) => void;
}

export const CharacterAvatarTab: React.FC<CharacterAvatarTabProps> = ({
  activeChar,
  projectId,
  handleUpdateChar,
  onOpenAvatarAssetPicker,
  notify,
}) => {
  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div className="p-3 bg-[var(--accent-surface)] border border-[var(--border2)] rounded-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <GuiIconRenderer icon={GUI_ICONS.general.info} className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <span className="text-[var(--text)]">
            Profile picture automatically syncs with the character's <strong>Neutral</strong> mood.
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
          Auto-Sync Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* PC upload dropzone */}
        <label className="sm:col-span-1 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] transition-all group min-h-[220px]">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const safeProjectId = projectId || 'current-project';
              const assetUrl = await uploadProjectAssetFile(file, 'character', safeProjectId);
              handleUpdateChar(activeChar.id, {
                avatarUrl: assetUrl,
              });
              playSfx('/assets/sfx/success.mp3', false, 0.4);
              notify('Profile picture saved to project assets');
            }}
            className="hidden"
          />
          <GuiIconRenderer icon={GUI_ICONS.general.upload} className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform text-[var(--muted)]" />
          <span className="text-xs font-bold text-[var(--text)] uppercase block">
            Upload PC Photo
          </span>
          <span className="text-[10px] text-[var(--muted2)] mt-1">
            PNG, JPG or WebP
          </span>
        </label>

        <div className="sm:col-span-2 space-y-3 bg-[var(--card-bg)] p-4 border border-[var(--border)] rounded-lg flex flex-col justify-between">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block">
              Or select from Gallery or URL:
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="/assets/... or https://..."
                value={activeChar.avatarUrl || ''}
                onChange={(e) => handleUpdateChar(activeChar.id, { avatarUrl: e.target.value })}
                className="flex-1 min-w-0 bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] font-mono transition-colors"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenAvatarAssetPicker}
                  className="px-3.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-md text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                  title="Select image from Asset Gallery"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>
                {activeChar.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => handleUpdateChar(activeChar.id, { avatarUrl: '' })}
                    className="px-2.5 py-2 bg-[var(--well-bg)] hover:bg-rose-500/20 text-[var(--muted)] hover:text-rose-500 rounded-md text-xs cursor-pointer flex items-center justify-center transition-colors border border-[var(--border)]"
                    title="Clear image"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[var(--well-bg)] p-3 rounded-md border border-[var(--border)]">
            <img
              src={activeChar.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png'}
              alt={activeChar.name}
              className="w-16 h-20 object-cover rounded-md border-2 shadow"
              style={{ borderColor: activeChar.color || '#ef4444' }}
            />
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[var(--text)] uppercase block">{activeChar.name}</span>
              <span className="text-[10px] text-[var(--muted)] block">{activeChar.badgeTitle || 'OPERATOR'}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 pt-1">
                <GuiIconRenderer icon={GUI_ICONS.action.check} className="w-3 h-3 text-emerald-500" />
                <span>Active photo in viewer and dialogue</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
