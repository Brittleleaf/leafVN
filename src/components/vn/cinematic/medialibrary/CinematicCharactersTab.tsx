"use client";
import React, { useState } from 'react';
import { VNCharacter } from '@/types/vn';
import { playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicCharactersTabProps {
  characters: VNCharacter[];
  onAddMediaClip: (asset: {
    url: string;
    name?: string;
    type: 'image' | 'video';
    section?: 'media' | 'background';
  }) => void;
  onAddTextClip: (preset?: {
    text: string;
    style?: string;
    effect?: string;
    speaker?: string;
    avatarUrl?: string;
    speakerColor?: string;
    speakerBadge?: string;
  }) => void;
}

export const CinematicCharactersTab: React.FC<CinematicCharactersTabProps> = ({
  characters,
  onAddMediaClip,
  onAddTextClip,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || '');
  const selectedCharacter = characters.find((c) => c.id === selectedCharId) || characters[0];
  const [selectedExpression, setSelectedExpression] = useState<string>('default');
  const [characterDialogueText, setCharacterDialogueText] = useState<string>('Target acquired in the perimeter!');

  const currentAvatarUrl =
    selectedExpression !== 'default' && selectedCharacter?.expressions?.[selectedExpression]
      ? selectedCharacter.expressions[selectedExpression]
      : selectedCharacter?.avatarUrl || '';

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Character Dialogues & Expressions
        </span>
        <span className="text-[9px] text-[#6A41CC] font-mono">Drag or add to Media</span>
      </div>

      {characters.length === 0 ? (
        <div className="py-8 text-center text-[var(--muted)] text-xs">
          No characters registered in this project.
        </div>
      ) : (
        <div className="space-y-3">
          {/* Character Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {characters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  setSelectedCharId(ch.id);
                  setSelectedExpression('default');
                  playUiSound('click', 0.15);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  selectedCharId === ch.id
                    ? 'border-[#E21345] bg-[#E21345]/20 text-[var(--text)] shadow-md font-black'
                    : 'border-[var(--border)] bg-[var(--btn-bg)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                }`}
              >
                {ch.avatarUrl ? (
                  <img
                    src={ch.avatarUrl}
                    alt={ch.name}
                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-3.5 h-3.5 text-[var(--muted)]" />
                )}
                <span className="font-bold text-xs">{ch.name}</span>
              </button>
            ))}
          </div>

          {/* Character Expression & Dialogue Studio Card */}
          {selectedCharacter && (
            <div
              draggable
              onDragStart={(e) => {
                const payload = {
                  type: 'character_dialogue',
                  speaker: selectedCharacter.name,
                  text: characterDialogueText,
                  avatarUrl: currentAvatarUrl,
                  speakerAvatar: currentAvatarUrl,
                  speakerColor: selectedCharacter.color,
                  speakerBadge: selectedCharacter.badgeTitle,
                  dialogueStyle: 'classic_vn',
                  section: 'media',
                };
                e.dataTransfer.setData('application/json', JSON.stringify(payload));
              }}
              className="p-3.5 rounded-2xl border border-[#E21345]/40 bg-[var(--card-bg)] space-y-3 shadow-lg group hover:border-[#E21345] transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Character Avatar Preview */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#E21345] bg-black/50 shrink-0 shadow">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={selectedCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                      <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-8 h-8" />
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-[#E21345] text-white text-[8px] font-bold text-center py-0.5 truncate uppercase">
                    {selectedExpression}
                  </span>
                </div>

                {/* Character Name & Expression Picker */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[var(--text)] truncate">
                      {selectedCharacter.name}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#E21345]/30 text-[#E21345] font-bold">
                      Speaking
                    </span>
                  </div>

                  {/* Emotion expressions buttons */}
                  {selectedCharacter.expressions && Object.keys(selectedCharacter.expressions).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setSelectedExpression('default')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          selectedExpression === 'default'
                            ? 'bg-[var(--accent)] text-white shadow'
                            : 'bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                        }`}
                      >
                        Default
                      </button>
                      {Object.keys(selectedCharacter.expressions).map((emo) => (
                        <button
                          key={emo}
                          onClick={() => setSelectedExpression(emo)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize transition-all cursor-pointer ${
                            selectedExpression === emo
                              ? 'bg-[#E21345] text-white shadow'
                              : 'bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                          }`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dialogue Input Box */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase">
                  Dialogue Line:
                </label>
                <textarea
                  rows={2}
                  value={characterDialogueText}
                  onChange={(e) => setCharacterDialogueText(e.target.value)}
                  placeholder="Type what the character says in this cinematic..."
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] text-[var(--text)] text-xs resize-none focus:outline-none focus:border-[#E21345] transition-all placeholder-[var(--muted2)]"
                />
              </div>

              {/* Quick Preset Phrases */}
              <div className="flex flex-wrap gap-1">
                {[
                  'Hold it right there!',
                  'This cannot be real...',
                  'Who goes there?',
                  'Target acquired!',
                  'All clear on my end.',
                ].map((phrase, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setCharacterDialogueText(phrase)}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>

              {/* Action Buttons: Add Subtitle / Add Visual Sprite */}
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                {currentAvatarUrl && (
                  <button
                    onClick={() => {
                      onAddMediaClip({
                        url: currentAvatarUrl,
                        name: `${selectedCharacter.name} (${selectedExpression})`,
                        type: 'image',
                      });
                      playUiSound('open', 0.35);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-200 font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                    <span>Add Sprite</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onAddTextClip({
                      text: characterDialogueText,
                      speaker: selectedCharacter.name,
                      avatarUrl: currentAvatarUrl,
                      speakerColor: selectedCharacter.color,
                      speakerBadge: selectedCharacter.badgeTitle,
                      style: 'classic_vn',
                    });
                    playUiSound('open', 0.35);
                  }}
                  className="flex-1 py-1.5 rounded-xl bg-[#E21345] hover:bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-2.5 h-2.5" />
                  <span>Add Dialogue Clip</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
