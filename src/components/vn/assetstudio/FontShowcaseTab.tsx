"use client";
import React, { useState } from 'react';
import { VNStory, VNAssetItem } from '@/types/vn';
import { VN_FONT_CATALOG, ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface FontShowcaseTabProps {
  story: VNStory;
  searchQuery: string;
  customFontSample: string;
  setCustomFontSample: (sample: string) => void;
  onSelectAsset?: (asset: VNAssetItem) => void;
  onUpdateStory?: (updatedStory: VNStory) => void;
  onClose: () => void;
  notify: (msg: string) => void;
}

export function FontShowcaseTab({
  story,
  searchQuery,
  customFontSample,
  setCustomFontSample,
  onSelectAsset,
  onUpdateStory,
  onClose,
  notify,
}: FontShowcaseTabProps) {
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('all');

  return (
    <div className="space-y-4">
      {/* Category Pills & Interactive Tester Bar */}
      <div className="p-4 rounded-2xl bg-[var(--well-bg)] border border-[var(--border)] space-y-3 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
              Categories:
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'sans-serif', label: 'Sans-Serif' },
              { id: 'serif', label: 'Serif' },
              { id: 'monospace', label: 'Monospace' },
              { id: 'handwriting', label: 'Handwriting' },
              { id: 'display', label: 'Display & Horror' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFontCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  fontCategoryFilter === cat.id
                    ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] font-bold shadow-sm'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {story.defaultFontFamily && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-mono">
              <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5 text-emerald-500" />
              <span>Current Project Font:</span>
              <strong className="text-[var(--text)] uppercase">{story.defaultFontFamily}</strong>
            </div>
          )}
        </div>

        {/* Tester input */}
        <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span className="font-bold uppercase tracking-wider">Live Sample Sentence:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCustomFontSample('The quick brown fox jumps over the lazy dog. 0123456789')
                }
                className="text-[var(--muted)] hover:text-[var(--text)] text-[10px] underline cursor-pointer"
              >
                Pangram
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomFontSample('CLASSIFIED REPORT: Subject does not respond to light stimulus.')
                }
                className="text-[var(--muted)] hover:text-[var(--text)] text-[10px] underline cursor-pointer"
              >
                Classified
              </button>
              <button
                type="button"
                onClick={() =>
                  setCustomFontSample('"There are no secrets that time does not eventually uncover."')
                }
                className="text-[var(--muted)] hover:text-[var(--text)] text-[10px] underline cursor-pointer"
              >
                Dramatic
              </button>
            </div>
          </div>
          <input
            type="text"
            value={customFontSample}
            onChange={(e) => setCustomFontSample(e.target.value)}
            placeholder="Type sample text to test across all fonts..."
            className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs text-[var(--text)] outline-none font-sans"
          />
        </div>
      </div>

      {/* Grid of Font Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {VN_FONT_CATALOG.filter((f) => {
          if (fontCategoryFilter !== 'all' && f.category !== fontCategoryFilter) return false;
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
              f.name.toLowerCase().includes(q) ||
              f.category.toLowerCase().includes(q) ||
              f.description.toLowerCase().includes(q)
            );
          }
          return true;
        }).map((font) => {
          ensureGoogleFontLoaded(font.id);
          const isCurrentDefault =
            (story.defaultFontFamily || '').toLowerCase() === font.id.toLowerCase() ||
            (story.defaultFontFamily || '').toLowerCase() === font.name.toLowerCase();

          return (
            <div
              key={font.id}
              className={`rounded-2xl border p-4 bg-[var(--card-bg)] flex flex-col justify-between gap-3 transition-all backdrop-blur-md ${
                isCurrentDefault
                  ? 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : 'border-[var(--border)] hover:border-[var(--border2)]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[var(--text)]">{font.name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--well-bg)] text-[var(--muted)] border border-[var(--border)]">
                      {font.category}
                    </span>
                    {font.isBuiltIn && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40">
                        BUILT-IN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--muted2)] mt-1 leading-snug">{font.description}</p>
                </div>

                {isCurrentDefault && (
                  <span className="px-2 py-0.5 rounded-xl text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shrink-0 flex items-center gap-1">
                    <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3 h-3 text-emerald-500" />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              {/* Live Text Sample Box */}
              <div
                className="p-3.5 rounded-xl bg-[var(--well-bg)] border border-[var(--border)] min-h-[70px] flex items-center justify-center text-center transition-all overflow-hidden"
                style={{ fontFamily: font.fontFamily }}
              >
                <p className="text-base text-[var(--text)] leading-relaxed break-words max-w-full">
                  {customFontSample || font.previewSample}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)] text-xs">
                <span className="text-[10px] font-mono text-[var(--muted2)] truncate max-w-[160px]">
                  ID: {font.id}
                </span>

                <div className="flex items-center gap-2">
                  {onSelectAsset ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAsset({
                          id: `font-${font.id}`,
                          name: font.name,
                          type: 'font',
                          origin: 'system',
                          url: font.id,
                          category: font.category,
                          description: font.description,
                        });
                        onClose();
                        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow transition-all flex items-center gap-1.5"
                    >
                      <span>✓</span>
                      <span>Select Font</span>
                    </button>
                  ) : (
                    onUpdateStory && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStory({
                            ...story,
                            defaultFontFamily: font.id,
                          });
                          notify(`Set "${font.name}" as the default project font.`);
                          playSfx('/assets/sfx/click intro.mp3', false, 0.25);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                          isCurrentDefault
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-[var(--text)]'
                        }`}
                      >
                        {isCurrentDefault ? '✓ Project Default' : 'Set as Project Font'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
