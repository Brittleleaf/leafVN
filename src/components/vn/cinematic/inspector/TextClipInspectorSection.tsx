"use client";
import React, { useState, useEffect } from 'react';
import { VNCinematicClip, VNStory, VNCharacter, VNAssetType } from '@/types/vn';
import { VN_TEXT_EFFECTS_CATALOG } from '@/lib/vn/textEffects';
import { VN_FONT_CATALOG, ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import { VN_CURSORS_CATALOG } from '../../cursors';
import { playSfx, playAudioPreview, stopAudioPreview, subscribeAudioPreview, getActivePreviewUrl } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface TextClipInspectorSectionProps {
  clip: VNCinematicClip;
  onUpdateClip: (clipId: string, patch: Partial<VNCinematicClip>) => void;
  story?: VNStory;
  onOpenAssetPicker?: (
    filterType: 'sfx' | 'bg' | 'character' | 'font',
    onSelect: (url: string, name?: string) => void
  ) => void;
}

export const TextClipInspectorSection: React.FC<TextClipInspectorSectionProps> = ({
  clip,
  onUpdateClip,
  story,
  onOpenAssetPicker,
}) => {
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return subscribeAudioPreview(() => {
      setActivePreviewUrl(getActivePreviewUrl());
    });
  }, []);

  // Find matching character from story roster
  const activeSpeaker: VNCharacter | undefined = story?.characters?.find(
    (c) => c.id === clip.characterId || c.name.toLowerCase() === clip.speaker?.toLowerCase()
  );

  const isClassicVN = clip.dialogueStyle === 'classic_vn' || Boolean(clip.speaker) || Boolean(clip.speakerAvatar);

  return (
    <div className="space-y-4">
      {/* 1. Dialogue Presentation Style */}
      <div className="space-y-1">
        <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
          Presentation Style:
        </label>
        <select
          value={clip.dialogueStyle || (clip.speaker ? 'classic_vn' : 'subtitle')}
          onChange={(e) => onUpdateClip(clip.id, { dialogueStyle: e.target.value as any })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-xs font-semibold cursor-pointer outline-none focus:border-[var(--accent)]"
        >
          <option value="classic_vn">Classic VN Dialogue (Character Bust + Cyber Textbox)</option>
          <option value="subtitle">Floating Subtitle / Title (Cinematic Caption)</option>
          <option value="narration_card">Narration Card (Full-width Overlay)</option>
        </select>
      </div>

      {/* 2. Speaking Character Selector from Story Roster */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-3.5 h-3.5 text-cyan-400" />
            <span>Speaking Character:</span>
          </label>
          {activeSpeaker && (
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${activeSpeaker.color}15`,
                borderColor: `${activeSpeaker.color}50`,
                color: activeSpeaker.color,
              }}
            >
              {activeSpeaker.name}
            </span>
          )}
        </div>

        {story?.characters && story.characters.length > 0 ? (
          <select
            value={activeSpeaker?.id || (clip.speaker ? '__custom__' : '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__custom__') {
                onUpdateClip(clip.id, { characterId: undefined });
              } else if (!val) {
                onUpdateClip(clip.id, {
                  characterId: undefined,
                  speaker: undefined,
                  speakerAvatar: undefined,
                  speakerColor: undefined,
                  speakerBadge: undefined,
                });
              } else {
                const char = story.characters?.find((c) => c.id === val);
                if (char) {
                  onUpdateClip(clip.id, {
                    characterId: char.id,
                    speaker: char.name,
                    speakerColor: char.color,
                    speakerBadge: char.badgeTitle,
                    speakerAvatar: char.avatarUrl,
                    emotion: 'neutral',
                    dialogueStyle: 'classic_vn',
                    fontFamily: char.fontFamily || clip.fontFamily,
                  });
                }
              }
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-bold outline-none cursor-pointer"
          >
            <option value="">-- Generic / No Character --</option>
            {story.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.badgeTitle ? `[${c.badgeTitle}]` : ''}
              </option>
            ))}
            <option value="__custom__">Custom Speaker Name...</option>
          </select>
        ) : null}

        {/* Custom or editable Speaker Name */}
        <div>
          <input
            type="text"
            value={clip.speaker || ''}
            onChange={(e) => onUpdateClip(clip.id, { speaker: e.target.value })}
            placeholder="Speaker display name (e.g. Justin / Commander / Narrator)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs outline-none focus:border-[var(--accent)] font-semibold"
          />
        </div>

        {/* Speaker Badge & Color Tag */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
          <div>
            <label className="text-[9px] text-[var(--muted)] block mb-0.5 font-bold uppercase">Badge Title:</label>
            <input
              type="text"
              value={clip.speakerBadge || ''}
              onChange={(e) => onUpdateClip(clip.id, { speakerBadge: e.target.value })}
              placeholder="e.g. AGENTE DE CAMPO"
              className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-mono outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] text-[var(--muted)] block mb-0.5 font-bold uppercase">Speaker Color:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={clip.speakerColor || '#ef4444'}
                onChange={(e) => onUpdateClip(clip.id, { speakerColor: e.target.value })}
                className="w-6 h-6 rounded border border-[var(--border)] bg-transparent cursor-pointer p-0.5 shrink-0"
              />
              <input
                type="text"
                value={clip.speakerColor || '#ef4444'}
                onChange={(e) => onUpdateClip(clip.id, { speakerColor: e.target.value })}
                className="flex-1 px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Character Emotion / Expression & Standing Bust Photo */}
        {activeSpeaker?.expressions && Object.keys(activeSpeaker.expressions).length > 0 && (
          <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
            <label className="text-[9px] text-[var(--muted)] font-bold uppercase block">
              Character Emotion / Expression:
            </label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(activeSpeaker.expressions).map(([emoKey, emoUrl]) => (
                <button
                  key={emoKey}
                  type="button"
                  onClick={() =>
                    onUpdateClip(clip.id, {
                      emotion: emoKey,
                      speakerAvatar: emoUrl,
                    })
                  }
                  className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                    (clip.emotion || 'neutral') === emoKey
                      ? 'bg-[var(--accent)] text-white shadow-md'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {emoKey}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Avatar / Portrait Photo */}
        <div className="pt-2 border-t border-[var(--border)] space-y-1">
          <label className="text-[9px] text-[var(--muted)] font-bold uppercase block">
            Portrait Bust Photo:
          </label>
          <div className="flex items-center gap-2">
            {clip.speakerAvatar ? (
              <img
                src={clip.speakerAvatar}
                alt={clip.speaker || 'Avatar'}
                className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0 shadow"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-sm shrink-0">
                <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <input
              type="text"
              value={clip.speakerAvatar || ''}
              onChange={(e) => onUpdateClip(clip.id, { speakerAvatar: e.target.value })}
              placeholder="Avatar / photo URL..."
              className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-mono outline-none"
            />
            {onOpenAssetPicker && (
              <button
                type="button"
                onClick={() =>
                  onOpenAssetPicker('character', (url) => onUpdateClip(clip.id, { speakerAvatar: url }))
                }
                className="px-2.5 py-1 rounded-lg bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[11px] font-bold cursor-pointer flex items-center justify-center"
                title="Browse Character Gallery"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Dialogue Textarea & Quick Phrase presets */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
          Dialogue Spoken Text:
        </label>
        <textarea
          rows={3}
          value={clip.text || ''}
          onChange={(e) => onUpdateClip(clip.id, { text: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] text-[var(--text)] text-xs resize-none outline-none focus:border-[var(--accent)] leading-relaxed"
          placeholder="Type what the character says in this cinematic scene..."
        />
        {/* Quick presets */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {[
            'Hold it right there!',
            'Target acquired!',
            'This cannot be real...',
            'Who goes there?',
            'All clear on my end.',
          ].map((phrase, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => onUpdateClip(clip.id, { text: phrase })}
              className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              "{phrase}"
            </button>
          ))}
        </div>
      </div>

      {/* 5. Speaking Voice / Sound Effect (SFX) with Audio Presets */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-3.5 h-3.5 text-cyan-400" />
            <span>Speaking Voice / SFX:</span>
          </label>
          {clip.sfx && (
            <div className="flex items-center gap-1.5">
              {(() => {
                const isPlaying = activePreviewUrl === clip.sfx;
                return (
                  <button
                    type="button"
                    onClick={() => playAudioPreview(clip.sfx!, 0.8)}
                    className={`px-2 py-0.5 border rounded text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ${
                      isPlaying
                        ? 'bg-[#A1FE10]/30 text-[#A1FE10] border-[#A1FE10] animate-pulse'
                        : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)]'
                    }`}
                    title={isPlaying ? "Stop audio" : "Test audio file"}
                  >
                    <GuiIconRenderer
                      icon={isPlaying ? GUI_ICONS.state.pause : GUI_ICONS.state.play}
                      className="w-3 h-3"
                    />
                    <span>{isPlaying ? 'Stop' : 'Test'}</span>
                  </button>
                );
              })()}
              <button
                type="button"
                onClick={() => {
                  if (activePreviewUrl === clip.sfx) stopAudioPreview();
                  onUpdateClip(clip.id, { sfx: undefined });
                }}
                className="text-red-400 hover:text-red-300 text-xs cursor-pointer px-1 transition-colors flex items-center"
                title="Remove audio"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={clip.sfx || ''}
            onChange={(e) => onUpdateClip(clip.id, { sfx: e.target.value || undefined })}
            placeholder="Audio path (e.g. /assets/ui-sfx/... or choose Gallery)"
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-[11px] font-mono outline-none focus:border-[var(--accent)]"
          />
          {onOpenAssetPicker && (
            <button
              type="button"
              onClick={() =>
                onOpenAssetPicker('sfx', (url) => {
                  onUpdateClip(clip.id, { sfx: url });
                  if (url) playAudioPreview(url, 0.8);
                })
              }
              className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
              title="Browse SFX Gallery"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-3 h-3" />
              <span>Gallery</span>
            </button>
          )}
        </div>

        {/* Quick audio presets */}
        <div className="flex items-center gap-1 flex-wrap pt-0.5 text-[9px]">
          <span className="text-[var(--muted)] font-bold">Presets:</span>
          {[
            { label: 'Door', icon: GUI_ICONS.action.entryDoor, url: '/assets/sfx/open folder.mp3' },
            { label: 'Error', icon: GUI_ICONS.general.hazard, url: '/assets/sfx/corrupt file.mp3' },
            { label: 'Success', icon: GUI_ICONS.general.check, url: '/assets/sfx/success.mp3' },
            { label: 'Alarm', icon: GUI_ICONS.general.hazard, url: '/assets/sfx/ERROR RING.mp3' },
            { label: 'Typing', icon: GUI_ICONS.general.texts, url: '/assets/sfx/typing.mp3' },
          ].map((preset) => {
            const isPlayingThis = activePreviewUrl === preset.url;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onUpdateClip(clip.id, { sfx: preset.url });
                  playAudioPreview(preset.url, 0.7);
                }}
                className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  isPlayingThis
                    ? 'bg-[#A1FE10]/30 border-[#A1FE10] text-[#A1FE10] font-bold animate-pulse'
                    : clip.sfx === preset.url
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
                title={isPlayingThis ? 'Stop audio' : 'Select and test preset'}
              >
                <GuiIconRenderer icon={isPlayingThis ? GUI_ICONS.state.pause : preset.icon} className="w-2.5 h-2.5" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Font Selection (Google Font Catalog) */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.texts} className="w-3.5 h-3.5 text-cyan-400" />
            <span>Font Family Override:</span>
          </label>
          {clip.fontFamily && (
            <button
              type="button"
              onClick={() => onUpdateClip(clip.id, { fontFamily: undefined })}
              className="text-red-400 hover:text-red-300 text-xs cursor-pointer px-1"
              title="Reset to default font"
            >
              ✕ Reset
            </button>
          )}
        </div>

        <select
          value={clip.fontFamily || ''}
          onChange={(e) => {
            const fontId = e.target.value;
            const fontDef = VN_FONT_CATALOG.find((f) => f.id === fontId);
            if (fontDef) {
              ensureGoogleFontLoaded(fontDef.googleUrl || fontDef.id);
            }
            onUpdateClip(clip.id, { fontFamily: fontId || undefined });
          }}
          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-semibold outline-none cursor-pointer"
        >
          <option value="">Default (Theme font)</option>
          {VN_FONT_CATALOG.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.category})
            </option>
          ))}
        </select>

        {/* Font Sample Preview */}
        {clip.fontFamily && (
          <div
            className="p-2 rounded-lg bg-black/40 border border-white/10 text-xs text-center truncate"
            style={{ fontFamily: clip.fontFamily }}
          >
            {clip.text ? clip.text.slice(0, 35) : 'Sample text in selected font...'}
          </div>
        )}
      </div>

      {/* 7. Text Effect (FX) */}
      <div className="space-y-1">
        <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
          Text Effect (FX Animation):
        </label>
        <select
          value={clip.textEffect || 'none'}
          onChange={(e) => onUpdateClip(clip.id, { textEffect: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-xs font-semibold cursor-pointer outline-none focus:border-[var(--accent)]"
        >
          <option value="none">None (Static Text)</option>
          {VN_TEXT_EFFECTS_CATALOG.map((eff) => (
            <option key={eff.id} value={eff.id}>
              {eff.name}
            </option>
          ))}
        </select>
      </div>

      {/* 8. Typography: Size & Color */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Font Size:</label>
          <select
            value={clip.fontSize || 'xl'}
            onChange={(e) => onUpdateClip(clip.id, { fontSize: e.target.value as any })}
            className="w-full px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-xs font-semibold cursor-pointer outline-none"
          >
            <option value="sm">Small</option>
            <option value="base">Normal</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large (Default)</option>
            <option value="2xl">2XL Dramatic</option>
            <option value="3xl">3XL Cinematic Title</option>
          </select>
        </div>

        <div>
          <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Text Color:</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={clip.textColor || '#ffffff'}
              onChange={(e) => onUpdateClip(clip.id, { textColor: e.target.value })}
              className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer p-0.5 shrink-0"
            />
            <input
              type="text"
              value={clip.textColor || '#ffffff'}
              onChange={(e) => onUpdateClip(clip.id, { textColor: e.target.value })}
              className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[11px] font-mono outline-none"
            />
          </div>
        </div>
      </div>

      {/* 9. Direct Positioning & Alignment */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] space-y-2">
        <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
          Placement & Positioning:
        </label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateClip(clip.id, { yPercent: 82, textPosition: 'bottom' })}
            className={`flex-1 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
              (clip.yPercent ?? 82) >= 70
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Bottom
          </button>
          <button
            type="button"
            onClick={() => onUpdateClip(clip.id, { yPercent: 50, textPosition: 'center' })}
            className={`flex-1 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
              (clip.yPercent ?? 82) > 30 && (clip.yPercent ?? 82) < 70
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => onUpdateClip(clip.id, { yPercent: 20, textPosition: 'top' })}
            className={`flex-1 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
              (clip.yPercent ?? 82) <= 30
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Top
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[9px] text-[var(--muted)] block mb-0.5 font-bold">X Position (%):</label>
            <input
              type="number"
              min={0}
              max={100}
              value={clip.xPercent ?? 50}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateClip(clip.id, { xPercent: Number.isFinite(val) ? val : 50 });
              }}
              className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-mono text-xs outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] text-[var(--muted)] block mb-0.5 font-bold">Y Position (%):</label>
            <input
              type="number"
              min={0}
              max={100}
              value={clip.yPercent ?? 82}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateClip(clip.id, { yPercent: Number.isFinite(val) ? val : 82 });
              }}
              className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-mono text-xs outline-none"
            />
          </div>
        </div>
      </div>

      {/* 10. Optional Cursor Override */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--well-bg)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cursor Style Override:</span>
          </label>
          {clip.cursorType && (
            <button
              type="button"
              onClick={() => onUpdateClip(clip.id, { cursorType: undefined })}
              className="text-red-400 hover:text-red-300 text-xs cursor-pointer px-1"
              title="Reset cursor"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={clip.cursorType || ''}
          onChange={(e) => onUpdateClip(clip.id, { cursorType: (e.target.value as any) || undefined })}
          className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs font-semibold outline-none cursor-pointer"
        >
          <option value="">Default (Inherited)</option>
          {VN_CURSORS_CATALOG.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
