"use client";
import React, { useState } from 'react';
import { VNAssetItem } from '@/types/vn';
import { VN_TEXT_EFFECTS_CATALOG, VNTextEffectRenderer } from '@/lib/vn/textEffects';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface TextEffectShowcaseTabProps {
  searchQuery: string;
  customFontSample: string;
  setCustomFontSample: (sample: string) => void;
  onSelectAsset?: (asset: VNAssetItem) => void;
  onClose: () => void;
}

export function TextEffectShowcaseTab({
  searchQuery,
  customFontSample,
  setCustomFontSample,
  onSelectAsset,
  onClose,
}: TextEffectShowcaseTabProps) {
  const [textEffectCategory, setTextEffectCategory] = useState<string>('all');
  const [textEffectColor, setTextEffectColor] = useState<string>('#ffffff');
  const [textEffectReplayKeys, setTextEffectReplayKeys] = useState<Record<string, number>>({});

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
              { id: 'all', label: 'All Effects' },
              { id: 'horror', label: 'Horror & Ghost' },
              { id: 'cyberpunk', label: 'Cyberpunk & Tech' },
              { id: 'dramatic', label: 'Alert & Dramatic' },
              { id: 'cinematic', label: 'Cinematic & Title' },
              { id: 'ambient', label: 'Terminal & Ambient' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setTextEffectCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  textEffectCategory === cat.id
                    ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] font-bold shadow-sm'
                    : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Color Preset Palette for Live Testing */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--muted)] font-bold uppercase">Color:</span>
            {[
              { color: '#ffffff', title: 'Whitesmoke / Pure White' },
              { color: '#ef4444', title: 'Crimson Casualty Red' },
              { color: '#00ffff', title: 'Cyberpunk Cyan' },
              { color: '#D17BF8', title: 'Neon Orchid Violet' },
              { color: '#fbbf24', title: 'Imperial Gold' },
              { color: '#10b981', title: 'Toxic Terminal Green' },
            ].map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => setTextEffectColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer shadow-sm ${
                  textEffectColor === c.color ? 'scale-125 ring-2 ring-white' : 'border-white/30 hover:scale-110'
                }`}
                title={c.title}
              />
            ))}
          </div>
        </div>

        {/* Custom Sample Input Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
            <span className="font-bold uppercase tracking-wider">
              Audition Sample Sentence:
            </span>
            <button
              type="button"
              onClick={() => {
                const now = Date.now();
                const next: Record<string, number> = {};
                VN_TEXT_EFFECTS_CATALOG.forEach((fx) => {
                  next[fx.id] = now;
                });
                setTextEffectReplayKeys(next);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>↺</span>
              <span>Replay All Effects</span>
            </button>
          </div>
          <input
            type="text"
            value={customFontSample}
            onChange={(e) => setCustomFontSample(e.target.value)}
            placeholder="Type words here to preview in real-time across all text effects..."
            className="w-full bg-[var(--card-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs text-[var(--text)] outline-none font-bold"
          />
        </div>
      </div>

      {/* Grid of Text Effect Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VN_TEXT_EFFECTS_CATALOG
          .filter((fx) => textEffectCategory === 'all' || fx.category === textEffectCategory)
          .filter(
            (fx) =>
              !searchQuery.trim() ||
              fx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              fx.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((fx) => {
            const replayKey = textEffectReplayKeys[fx.id] || 0;
            return (
              <div
                key={fx.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-lg hover:border-[var(--accent)] transition-all flex flex-col group"
              >
                {/* Interactive Dark Stage for Text Animation */}
                <div className="relative w-full h-44 bg-[#050508] border-b border-[var(--border)] flex items-center justify-center p-4 overflow-hidden select-none">
                  <div className="absolute inset-0 bg-radial from-white/5 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/80 border border-white/20 text-gray-200 shadow flex items-center gap-1.5">
                      <GuiIconRenderer icon={fx.icon} className="w-3 h-3 text-[var(--accent)]" />
                      <span>{fx.category.toUpperCase()}</span>
                    </span>
                    {fx.tag && (
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-500 text-white shadow">
                        {fx.tag}
                      </span>
                    )}
                  </div>

                  {/* Replay Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTextEffectReplayKeys((prev) => ({ ...prev, [fx.id]: Date.now() }));
                      playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                    }}
                    className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-full bg-black/80 hover:bg-white/20 border border-white/20 text-gray-300 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer shadow flex items-center gap-1"
                    title="Replay this effect from the beginning"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-3 h-3" />
                    <span>Replay</span>
                  </button>

                  {/* Live Animated Text */}
                  <div className="relative z-10 text-center max-w-full overflow-hidden px-2">
                    <VNTextEffectRenderer
                      keySeed={replayKey}
                      effectId={fx.id}
                      text={customFontSample || fx.defaultSample || 'SIGNAL IN THE FOG'}
                      color={textEffectColor || fx.defaultColor}
                      className="text-lg sm:text-xl font-black uppercase tracking-wider"
                    />
                  </div>
                </div>

                {/* Card Info & Select Button */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                      <GuiIconRenderer icon={fx.icon} className="w-4 h-4 text-[var(--accent)]" />
                      <span>{fx.name}</span>
                    </h4>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-1">
                      {fx.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)]">
                    {onSelectAsset ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAsset({
                            id: `text_effect-${fx.id}`,
                            name: fx.name,
                            type: 'text_effect',
                            origin: 'system',
                            url: fx.id,
                            description: fx.description,
                          });
                          onClose();
                          playSfx('/assets/sfx/success.mp3', false, 0.4);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5" />
                        <span>Select This Text Effect</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted2)] font-mono">
                        <span>Preset ID:</span>
                        <code className="text-cyan-400 font-bold">{fx.id}</code>
                      </div>
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
