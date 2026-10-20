"use client";
import React from 'react';
import { VNCharacter, VNStory } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { resolveEffectiveFontFamily } from '@/lib/vn/fontCatalog';

interface CharacterTextBoxTabProps {
  activeChar: VNCharacter;
  story: VNStory;
  handleUpdateChar: (charId: string, patch: Partial<VNCharacter>) => void;
  notify: (msg: string) => void;
}

export const CharacterTextBoxTab: React.FC<CharacterTextBoxTabProps> = ({
  activeChar,
  story,
  handleUpdateChar,
  notify,
}) => {
  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-2">
          <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-4 h-4 text-[var(--accent)]" />
          <span>Text Box Style: {activeChar.name}</span>
        </h4>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Customize how dialogue is rendered and sounds when this character speaks on screen.
        </p>
      </div>

      {/* Style controls grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Border Color */}
        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Border & Corners
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeChar.textBoxConfig?.borderColor || activeChar.color || '#ef4444'}
              onChange={(e) => {
                const existing = activeChar.textBoxConfig || {};
                handleUpdateChar(activeChar.id, {
                  textBoxConfig: { ...existing, borderColor: e.target.value },
                });
              }}
              className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
            />
            <span className="font-mono text-[10px] text-[var(--text)] truncate">
              {activeChar.textBoxConfig?.borderColor || activeChar.color || '#ef4444'}
            </span>
          </div>
        </div>

        {/* Nameplate Color */}
        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Name Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeChar.textBoxConfig?.nameplateColor || activeChar.color || '#ef4444'}
              onChange={(e) => {
                const existing = activeChar.textBoxConfig || {};
                handleUpdateChar(activeChar.id, {
                  textBoxConfig: { ...existing, nameplateColor: e.target.value },
                });
              }}
              className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
            />
            <span className="font-mono text-[10px] text-[var(--text)] truncate">
              {activeChar.textBoxConfig?.nameplateColor || activeChar.color || '#ef4444'}
            </span>
          </div>
        </div>

        {/* Font Color */}
        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Font Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeChar.textBoxConfig?.textColor || '#e5e7eb'}
              onChange={(e) => {
                const existing = activeChar.textBoxConfig || {};
                handleUpdateChar(activeChar.id, {
                  textBoxConfig: { ...existing, textColor: e.target.value },
                });
              }}
              className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
            />
            <span className="font-mono text-[10px] text-[var(--text)] truncate">
              {activeChar.textBoxConfig?.textColor || '#e5e7eb'}
            </span>
          </div>
        </div>

        {/* Background / Tint */}
        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Background (Tint)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeChar.textBoxConfig?.backgroundColor || '#08080c'}
              onChange={(e) => {
                const existing = activeChar.textBoxConfig || {};
                handleUpdateChar(activeChar.id, {
                  textBoxConfig: { ...existing, backgroundColor: e.target.value },
                });
              }}
              className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
            />
            <span className="font-mono text-[10px] text-[var(--text)] truncate">
              {activeChar.textBoxConfig?.backgroundColor || '#08080c'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick background color presets */}
      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className="text-[var(--muted)] font-bold uppercase">Background Presets:</span>
        {[
          { name: 'Abyssal', color: '#08080c' },
          { name: 'Blood Red', color: '#1a0505' },
          { name: 'Cyber Blue', color: '#05101a' },
          { name: 'Terminal Green', color: '#051a0a' },
          { name: 'Violet Shade', color: '#14051a' },
          { name: 'Ancient Amber', color: '#1a1405' },
        ].map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              const existing = activeChar.textBoxConfig || {};
              handleUpdateChar(activeChar.id, {
                textBoxConfig: { ...existing, backgroundColor: p.color },
              });
            }}
            className="px-2.5 py-1 rounded-lg border border-[var(--border)] hover:border-[var(--border2)] text-[var(--text)] cursor-pointer flex items-center gap-1.5 transition-colors"
            style={{ backgroundColor: p.color }}
          >
            <span className="w-2 h-2 rounded-full border border-gray-600" style={{ backgroundColor: p.color }} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Opacity, Blip Sound, and Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Opacity ({Math.round((activeChar.textBoxConfig?.opacity ?? story.textBoxConfig.opacity ?? 0.92) * 100)}%)
          </label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={activeChar.textBoxConfig?.opacity ?? story.textBoxConfig.opacity ?? 0.92}
            onChange={(e) => {
              const existing = activeChar.textBoxConfig || {};
              handleUpdateChar(activeChar.id, {
                textBoxConfig: { ...existing, opacity: parseFloat(e.target.value) },
              });
            }}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Text Speed ({activeChar.textBoxConfig?.typewriterSpeedMs ?? story.textBoxConfig.typewriterSpeedMs ?? 25}ms)
          </label>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={activeChar.textBoxConfig?.typewriterSpeedMs ?? story.textBoxConfig.typewriterSpeedMs ?? 25}
            onChange={(e) => {
              const existing = activeChar.textBoxConfig || {};
              handleUpdateChar(activeChar.id, {
                textBoxConfig: { ...existing, typewriterSpeedMs: parseInt(e.target.value) },
              });
            }}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div className="bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)] space-y-1">
          <label className="block text-[10px] text-[var(--muted)] font-bold uppercase">
            Font Size
          </label>
          <select
            value={activeChar.textBoxConfig?.fontSize || story.textBoxConfig.fontSize || 'base'}
            onChange={(e) => {
              const existing = activeChar.textBoxConfig || {};
              handleUpdateChar(activeChar.id, {
                textBoxConfig: { ...existing, fontSize: e.target.value as any },
              });
            }}
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-2 text-xs text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)] transition-colors"
          >
            <option value="sm">Small (sm)</option>
            <option value="base">Normal (base)</option>
            <option value="lg">Large (lg)</option>
          </select>
        </div>
      </div>

      {/* Live Preview of Character Text Box */}
      <div className="pt-3 border-t border-[var(--border)] space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Live In-Game Preview for {activeChar.name}:</span>
          </label>
          {activeChar.textBoxConfig && (
            <button
              type="button"
              onClick={() => {
                handleUpdateChar(activeChar.id, { textBoxConfig: undefined });
                notify(`Reset ${activeChar.name} to global text box style`);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-red-400 hover:bg-red-500/20 border border-red-500/30 cursor-pointer transition-colors"
            >
              Reset to Global Style
            </button>
          )}
        </div>

        {(() => {
          const effBorder = activeChar.textBoxConfig?.borderColor || activeChar.color || story.textBoxConfig.borderColor || '#ef4444';
          const effBg = activeChar.textBoxConfig?.backgroundColor || story.textBoxConfig.backgroundColor || `rgba(8, 8, 12, ${activeChar.textBoxConfig?.opacity ?? story.textBoxConfig.opacity ?? 0.92})`;
          const effName = activeChar.textBoxConfig?.nameplateColor || activeChar.color || story.textBoxConfig.nameplateColor || '#ef4444';
          const effText = activeChar.textBoxConfig?.textColor || story.textBoxConfig.textColor || '#e5e7eb';
          const effSize = activeChar.textBoxConfig?.fontSize || story.textBoxConfig.fontSize || 'base';
          const sizeClass = effSize === 'sm' ? 'text-xs' : effSize === 'lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm';

          return (
            <div className="p-4 bg-black/60 rounded-2xl border border-[var(--border)] shadow-inner relative overflow-hidden">
              <div
                className="relative w-full border-2 rounded-xl p-3.5 shadow-2xl transition-all"
                style={{
                  borderColor: effBorder,
                  backgroundColor: effBg,
                }}
              >
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: effBorder }} />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: effBorder }} />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: effBorder }} />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: effBorder }} />

                <div className="flex items-center justify-between mb-2 border-b pb-1.5" style={{ borderColor: `${effBorder}40` }}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold tracking-widest uppercase text-xs sm:text-sm" style={{ color: effName }}>
                      {activeChar.name}
                    </span>
                    {activeChar.badgeTitle && (
                      <span
                        className="px-1.5 py-0.5 border text-[9px] uppercase tracking-widest rounded"
                        style={{
                          backgroundColor: `${activeChar.color || '#ef4444'}20`,
                          borderColor: `${activeChar.color || '#ef4444'}60`,
                          color: activeChar.color || '#ef4444',
                        }}
                      >
                        {activeChar.badgeTitle}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono opacity-50" style={{ color: effBorder }}>
                    [ DIALOGUE BEAT ]
                  </span>
                </div>

                <p
                  className={`${sizeClass} leading-relaxed min-h-[44px] tracking-wide whitespace-pre-wrap`}
                  style={{
                    color: effText,
                    fontFamily: resolveEffectiveFontFamily({
                      characterFont: activeChar.fontFamily,
                      storyFont: story.defaultFontFamily,
                      editorTheme: story.editorTheme,
                    }),
                  }}
                >
                  {activeChar.description
                    ? `"${activeChar.description.slice(0, 140)}..."`
                    : 'Sample dialogue line demonstrating how this character\'s custom box renders during gameplay.'}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
