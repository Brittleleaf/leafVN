"use client";
import React, { useState, useEffect, useRef } from 'react';
import { VNStory, VNTextBoxConfig } from '@/types/vn';
import { VN_FONT_CATALOG, ensureGoogleFontLoaded, resolveEffectiveFontFamily } from '@/lib/vn/fontCatalog';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';
import AssetStudioModal from './AssetStudioModal';

interface GlobalTextBoxModalProps {
  story: VNStory;
  onUpdateStory: (updatedStory: VNStory) => void;
  onOpenCharacterStudio: () => void;
  onClose: () => void;
}

export default function GlobalTextBoxModal({
  story,
  onUpdateStory,
  onOpenCharacterStudio,
  onClose,
}: GlobalTextBoxModalProps) {
  const [showFontGallery, setShowFontGallery] = useState(false);
  const [previewSampleText, setPreviewSampleText] = useState(
    'This is a live preview of your visual novel dialogue box. Customize borders, opacity, colors, fonts, and typography to fit your story atmosphere.'
  );
  const [animatedPreviewText, setAnimatedPreviewText] = useState(previewSampleText);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tb = story.textBoxConfig;

  const updateConfig = (patch: Partial<VNTextBoxConfig>) => {
    onUpdateStory({
      ...story,
      textBoxConfig: {
        ...story.textBoxConfig,
        ...patch,
      },
    });
  };

  // Replay typewriter animation in preview
  const handleTestTypewriter = () => {
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    setIsPlayingPreview(true);
    setAnimatedPreviewText('');
    let idx = 0;
    const speed = Math.max(10, tb.typewriterSpeedMs || 25);

    typewriterTimerRef.current = setInterval(() => {
      idx++;
      setAnimatedPreviewText(previewSampleText.slice(0, idx));
      if (tb.soundBlipEnabled && idx % 2 === 0) {
        playSfx('/assets/sfx/click intro.mp3', false, 0.15);
      }
      if (idx >= previewSampleText.length) {
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        setIsPlayingPreview(false);
      }
    }, speed);
  };

  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };
  }, []);

  const safeOpacity = Math.max(0.1, Math.min(1.0, typeof tb.opacity === 'number' && !isNaN(tb.opacity) ? tb.opacity : 0.92));
  const effectiveBgColor = tb.backgroundColor || `rgba(8, 8, 12, ${safeOpacity})`;
  const effectiveBorderColor = tb.borderColor || '#b91c1c';
  const effectiveNameColor = tb.nameplateColor || '#ef4444';
  const effectiveTextColor = tb.textColor || '#e5e7eb';
  const effectiveFontSize = tb.fontSize || 'base';

  const fontSizeClass =
    effectiveFontSize === 'sm'
      ? 'text-xs'
      : effectiveFontSize === 'lg'
      ? 'text-sm sm:text-base'
      : 'text-xs sm:text-sm';

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-3 md:p-6 flex items-center justify-center animate-fade-in font-sans">
      <div className="max-w-4xl w-full vn-modal-card flex flex-col max-h-[88vh] sm:max-h-[85vh] overflow-hidden text-xs text-[var(--text)]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b vn-glass-header px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center p-1.5 bg-[var(--accent-surface)] rounded-xl border border-[var(--border2)] text-[var(--accent)] shrink-0 shadow-sm">
              <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm text-[var(--text)] font-extrabold uppercase tracking-widest">
                Global Dialogue Text Box
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                Default layout, typography, borders, and sound timing across all scenes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
            title="Close window"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
          
          {/* NOTICE BANNER */}
          <div className="p-3 bg-[var(--accent-surface)] border border-[var(--border2)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[var(--text)]">
            <p className="leading-relaxed">
              <strong className="text-[var(--accent)] inline-flex items-center gap-1.5 font-bold">
                <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5" /> System Base Style:
              </strong>{' '}
              These settings apply to <span className="text-[var(--accent)] font-bold">Narrator</span> lines and serve as the baseline for characters without custom boxes.
            </p>
            <button
              type="button"
              onClick={onOpenCharacterStudio}
              className="py-1.5 px-3 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-xl text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.palette} className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Character Boxes</span>
            </button>
          </div>

          {/* LIVE INTERACTIVE PREVIEW */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.action.lookAt} className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Live Interactive Preview:</span>
              </label>
              <button
                type="button"
                onClick={handleTestTypewriter}
                className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                title="Test typewriter speed and sound blip"
              >
                <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3 h-3 text-[var(--accent)]" />
                <span>{isPlayingPreview ? 'Replaying...' : 'Replay Typewriter'}</span>
              </button>
            </div>

            {/* PREVIEW CONTAINER STYLED EXACTLY AS IN-GAME */}
            <div className="p-4 bg-black/60 rounded-2xl border border-[var(--border)] shadow-inner flex flex-col justify-center min-h-[140px] relative overflow-hidden">
              <div
                className="relative w-full border-2 rounded-xl p-3.5 shadow-2xl transition-all"
                style={{
                  borderColor: effectiveBorderColor,
                  backgroundColor: effectiveBgColor,
                }}
              >
                {/* Cyber corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: effectiveBorderColor }} />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: effectiveBorderColor }} />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: effectiveBorderColor }} />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: effectiveBorderColor }} />

                {/* Header / Nameplate */}
                <div
                  className="flex items-center justify-between mb-2 border-b pb-1.5"
                  style={{ borderColor: `${effectiveBorderColor}40` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold tracking-widest uppercase text-xs sm:text-sm"
                      style={{ color: effectiveNameColor }}
                    >
                      NARRATOR / SYSTEM LOG
                    </span>
                    <span
                      className="px-1.5 py-0.5 border text-[9px] uppercase tracking-widest rounded"
                      style={{
                        backgroundColor: `${effectiveNameColor}20`,
                        borderColor: `${effectiveNameColor}60`,
                        color: effectiveNameColor,
                      }}
                    >
                      GLOBAL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-50" style={{ color: effectiveBorderColor }}>
                    [ CLICK / SPACE ]
                  </span>
                </div>

                {/* Text Body */}
                <p
                  className={`${fontSizeClass} leading-relaxed min-h-[48px] tracking-wide whitespace-pre-wrap`}
                  style={{
                    color: effectiveTextColor,
                    fontFamily: resolveEffectiveFontFamily({
                      storyFont: story.defaultFontFamily,
                      editorTheme: story.editorTheme,
                    }),
                  }}
                >
                  {isPlayingPreview ? animatedPreviewText : previewSampleText}
                </p>
              </div>
            </div>
          </div>

          {/* CONTROLS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* COLUMN 1: TYPOGRAPHY & THEME */}
            <div className="bg-[var(--well-bg)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Typography & Layout</span>
              </h4>

              {/* Story Default Font */}
              <div>
                <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                  Default Story Font Family:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFontGallery(true)}
                    className="flex-1 px-3 py-2 bg-[var(--card-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-left flex items-center justify-between cursor-pointer transition-colors group shadow-sm min-w-0"
                    title="Choose default font from Gallery"
                  >
                    <span
                      className="text-xs font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] flex items-center gap-1.5"
                      style={{ fontFamily: story.defaultFontFamily || undefined }}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span>{VN_FONT_CATALOG.find((f) => f.id === story.defaultFontFamily)?.name || 'Theme Default'}</span>
                    </span>
                    <span className="text-[10px] text-[var(--accent)] font-bold px-2 py-0.5 rounded-lg bg-[var(--btn-bg)] border border-[var(--border)] group-hover:border-[var(--accent)] shrink-0 flex items-center gap-1">
                      <span>Browse</span>
                    </span>
                  </button>
                  {story.defaultFontFamily && (
                    <button
                      type="button"
                      onClick={() => onUpdateStory({ ...story, defaultFontFamily: undefined })}
                      className="p-2 bg-[var(--card-bg)] hover:bg-red-500/20 text-red-400 border border-[var(--border)] rounded-xl cursor-pointer transition-colors text-xs shrink-0 flex items-center justify-center"
                      title="Reset font"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Font Size & Position */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                    Font Size:
                  </label>
                  <select
                    value={tb.fontSize || 'base'}
                    onChange={(e) => updateConfig({ fontSize: e.target.value as any })}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)]"
                  >
                    <option value="sm">Small (text-xs)</option>
                    <option value="base">Normal (text-sm)</option>
                    <option value="lg">Large (text-base)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                    Screen Position:
                  </label>
                  <select
                    value={tb.position || 'bottom'}
                    onChange={(e) => updateConfig({ position: e.target.value as any })}
                    className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)]"
                  >
                    <option value="bottom">Bottom Pinned</option>
                    <option value="middle">Middle / Centered</option>
                  </select>
                </div>
              </div>

              {/* Theme Presets */}
              <div>
                <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1.5">
                  Theme Preset Style:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'classified', label: 'Classified Red', border: '#b91c1c', name: '#ef4444', bg: '#08080c' },
                    { id: 'cyberpunk', label: 'Cyber Yellow', border: '#eab308', name: '#facc15', bg: '#0b0f19' },
                    { id: 'neon', label: 'Neon Cyan', border: '#06b6d4', name: '#22d3ee', bg: '#08080c' },
                    { id: 'minimal', label: 'Monochrome Glass', border: '#4b5563', name: '#f3f4f6', bg: '#111827' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        updateConfig({
                          theme: preset.id as any,
                          borderColor: preset.border,
                          nameplateColor: preset.name,
                          backgroundColor: preset.bg,
                        });
                      }}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                        tb.theme === preset.id
                          ? 'border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--text)]'
                          : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border2)] text-[var(--muted)]'
                      }`}
                    >
                      <span className="font-bold text-[11px] truncate">{preset.label}</span>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.border }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 2: COLORS, OPACITY & SPEED */}
            <div className="bg-[var(--well-bg)] p-4 rounded-xl border border-[var(--border)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text)] flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <GuiIconRenderer icon={GUI_ICONS.general.palette} className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Colors & Timing</span>
              </h4>

              {/* Color pickers */}
              <div className="grid grid-cols-2 gap-3">
                {/* Border Color */}
                <div>
                  <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                    Border Color:
                  </label>
                  <div className="flex items-center gap-2 bg-[var(--card-bg)] p-1.5 rounded-lg border border-[var(--border)]">
                    <input
                      type="color"
                      value={tb.borderColor || '#b91c1c'}
                      onChange={(e) => updateConfig({ borderColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-[var(--text)] truncate">{tb.borderColor || '#b91c1c'}</span>
                  </div>
                </div>

                {/* Nameplate Color */}
                <div>
                  <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                    Name Color:
                  </label>
                  <div className="flex items-center gap-2 bg-[var(--card-bg)] p-1.5 rounded-lg border border-[var(--border)]">
                    <input
                      type="color"
                      value={tb.nameplateColor || '#ef4444'}
                      onChange={(e) => updateConfig({ nameplateColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-[var(--text)] truncate">{tb.nameplateColor || '#ef4444'}</span>
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                    Dialogue Text:
                  </label>
                  <div className="flex items-center gap-2 bg-[var(--card-bg)] p-1.5 rounded-lg border border-[var(--border)]">
                    <input
                      type="color"
                      value={tb.textColor || '#e5e7eb'}
                      onChange={(e) => updateConfig({ textColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-[var(--text)] truncate">{tb.textColor || '#e5e7eb'}</span>
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-[10px] text-[var(--muted)] font-bold uppercase mb-1">
                    Background:
                  </label>
                  <div className="flex items-center gap-2 bg-[var(--card-bg)] p-1.5 rounded-lg border border-[var(--border)]">
                    <input
                      type="color"
                      value={tb.backgroundColor || '#08080c'}
                      onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                      className="w-7 h-7 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-[var(--text)] truncate">{tb.backgroundColor || '#08080c'}</span>
                  </div>
                </div>
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[var(--muted)] font-bold uppercase">
                    Background Opacity:
                  </label>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-bold">
                    {Math.round((tb.opacity ?? 0.92) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={tb.opacity ?? 0.92}
                  onChange={(e) => updateConfig({ opacity: Number(e.target.value) })}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Typewriter Speed slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[var(--muted)] font-bold uppercase">
                    Typewriter Speed:
                  </label>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-bold">
                    {tb.typewriterSpeedMs || 25} ms/char
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={tb.typewriterSpeedMs || 25}
                  onChange={(e) => updateConfig({ typewriterSpeedMs: Number(e.target.value) })}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Auto-Advance Speed slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[var(--muted)] font-bold uppercase">
                    Auto-Advance Delay:
                  </label>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-bold">
                    {((tb.autoSpeedMs || 2000) / 1000).toFixed(1)}s / line
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={tb.autoSpeedMs || 2000}
                  onChange={(e) => updateConfig({ autoSpeedMs: Number(e.target.value) })}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-semibold text-[var(--text)]">Typewriter Blip Sound:</span>
                  <input
                    type="checkbox"
                    checked={tb.soundBlipEnabled ?? true}
                    onChange={(e) => updateConfig({ soundBlipEnabled: e.target.checked })}
                    className="accent-[var(--accent)] cursor-pointer w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-semibold text-[var(--text)]">Show Character Bust Avatar:</span>
                  <input
                    type="checkbox"
                    checked={tb.showAvatar ?? true}
                    onChange={(e) => updateConfig({ showAvatar: e.target.checked })}
                    className="accent-[var(--accent)] cursor-pointer w-4 h-4"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t vn-glass-header flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-xl font-bold uppercase text-xs cursor-pointer transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>

      {showFontGallery && (
        <AssetStudioModal
          story={story}
          filterType="font"
          initialFilterType="font"
          onSelectAsset={(asset) => {
            ensureGoogleFontLoaded(asset.url);
            onUpdateStory({ ...story, defaultFontFamily: asset.url });
            setShowFontGallery(false);
          }}
          onClose={() => setShowFontGallery(false)}
          onUpdateStory={onUpdateStory}
          notify={() => {}}
        />
      )}
    </div>
  );
}
