"use client";
import React from 'react';
import { VNStaticScreenConfig, VNAssetItem, VNAssetType } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { VN_FONT_CATALOG, ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import { VN_TEXT_EFFECTS_CATALOG } from '@/lib/vn/textEffects';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { getProxiedImageUrl } from '@/lib/vn/mediaUtils';

interface StaticScreenTypographySectionProps {
  config: VNStaticScreenConfig;
  updateConfig: (patch: Partial<VNStaticScreenConfig>) => void;
  selectedTarget: 'title' | 'subtitle' | string | null;
  setSelectedTarget: (target: 'title' | 'subtitle' | string | null) => void;
  setSelectedButtonId: (id: string | null) => void;
  setAssetPickerConfig: (cfg: {
    filterType: VNAssetType;
    title: string;
    initialFontSample?: string;
    onSelect: (asset: VNAssetItem) => void;
  } | null) => void;
}

export function StaticScreenTypographySection({
  config,
  updateConfig,
  selectedTarget,
  setSelectedTarget,
  setSelectedButtonId,
  setAssetPickerConfig,
}: StaticScreenTypographySectionProps) {
  return (
    <div className="space-y-3 p-3 rounded-md border border-[var(--border)] bg-[var(--btn-bg)] backdrop-blur-sm">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
        <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Text & Typography</span>
      </span>

      {/* Game Logo / Official Brand Graphic (Transparent PNG) */}
      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)]/40 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--text)] font-bold uppercase flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.general.image} className="w-3 h-3 text-[var(--accent)]" />
            <span>Official Game Logo (PNG)</span>
          </label>
          {config.logoUrl && (
            <button
              type="button"
              onClick={() => {
                updateConfig({ logoUrl: undefined });
                if (selectedTarget === 'logo') setSelectedTarget(null);
                playSfx('/assets/sfx/corrupt file.mp3', false, 0.2);
              }}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
            >
              Remove Logo
            </button>
          )}
        </div>

        {config.logoUrl ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-[var(--border)]">
              <div className="w-12 h-12 rounded bg-black/60 border border-[var(--border2)] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <img
                  src={getProxiedImageUrl(config.logoUrl)}
                  alt="Game Logo Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[var(--muted)] font-mono truncate">
                  {config.logoUrl.split('/').pop()}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-[var(--text)]">
                  <span>X: {config.logoXPercent ?? 50}%</span>
                  <span>Y: {config.logoYPercent ?? 28}%</span>
                  <span>({config.logoScale ?? 1.0}x)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssetPickerConfig({
                    filterType: 'background',
                    title: 'Select Game Logo Image (PNG)',
                    onSelect: (asset) => {
                      updateConfig({ logoUrl: asset.url });
                    },
                  });
                }}
                className="px-2 py-1 rounded bg-[var(--surface)] hover:bg-[var(--accent-surface)] border border-[var(--border)] text-[10px] font-bold text-[var(--text)] cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Logo Canvas Controls */}
            <div className="flex items-center justify-between text-[10px] pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedTarget('logo');
                  setSelectedButtonId(null);
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedTarget === 'logo'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
                }`}
                title="Select Logo directly on canvas to drag, scale and rotate"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-2.5 h-2.5" />
                <span>Select Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateConfig({ logoXPercent: 50 });
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--muted)] hover:text-cyan-300 hover:bg-[var(--surface-strong)] cursor-pointer flex items-center gap-1 transition-colors"
                title="Center Logo horizontally"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.circle} className="w-2.5 h-2.5" />
                <span>Center X</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateConfig({ logoXPercent: 50, logoYPercent: 28, logoScale: 1.0, logoRotation: 0 });
                  playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                }}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--muted)] hover:text-red-400 hover:bg-[var(--surface-strong)] cursor-pointer flex items-center gap-1 transition-colors"
                title="Reset Logo position, scale and rotation"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.reset} className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Logo Scale Slider */}
            <div className="space-y-1 pt-1 border-t border-[var(--border)]">
              <div className="flex items-center justify-between text-[9px] text-[var(--muted)] font-bold">
                <span>Logo Scale:</span>
                <span className="font-mono text-cyan-400">{config.logoScale ?? 1.0}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={config.logoScale ?? 1.0}
                onChange={(e) => updateConfig({ logoScale: parseFloat(e.target.value) })}
                className="w-full h-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAssetPickerConfig({
                filterType: 'background',
                title: 'Select Game Logo Image (PNG)',
                onSelect: (asset) => {
                  updateConfig({
                    logoUrl: asset.url,
                    logoXPercent: 50,
                    logoYPercent: 28,
                    logoScale: 1.0,
                    logoRotation: 0,
                  });
                  setSelectedTarget('logo');
                  setSelectedButtonId(null);
                },
              });
            }}
            className="w-full py-2 px-3 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-surface)] text-[10px] font-bold text-[var(--muted)] hover:text-[var(--accent)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.image} className="w-3.5 h-3.5" />
            <span>+ Add Official Game Logo (PNG)</span>
          </button>
        )}
      </div>

      {/* Title Direct Canvas Transform Status & Controls */}
      <div
        className={`p-2 rounded-lg transition-all ${
          selectedTarget === 'title'
            ? 'bg-cyan-950/25'
            : 'bg-[var(--surface-strong)]/40 hover:bg-[var(--surface-strong)]/60'
        }`}
      >
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-mono flex items-center gap-1">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <GuiIconRenderer icon={GUI_ICONS.general.pin} className="w-3 h-3 text-cyan-400" />
              <span>Title Canvas:</span>
            </span>
            <span className="text-[var(--text)]">
              X: <strong>{config.titleXPercent ?? 50}%</strong> Y: <strong>{config.titleYPercent ?? 28}%</strong> ({config.titleScale ?? 1.0}x)
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedTarget('title');
                setSelectedButtonId(null);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedTarget === 'title'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
              }`}
              title="Select Title directly on canvas to drag and transform"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-2.5 h-2.5" />
              <span>Select Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updateConfig({ titleXPercent: 50 });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--muted)] hover:text-cyan-300 hover:bg-[var(--surface-strong)] cursor-pointer flex items-center gap-1 transition-colors"
              title="Center Title horizontally (X: 50%)"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.circle} className="w-2.5 h-2.5" />
              <span>Center X</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updateConfig({ titleXPercent: 50, titleYPercent: 28, titleScale: 1.0 });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--muted)] hover:text-red-400 hover:bg-[var(--surface-strong)] cursor-pointer flex items-center gap-1 transition-colors"
              title="Reset Title position and scale"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.reset} className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Title Text & Font */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase">
            Title Text & Color:
          </label>
          <input
            type="color"
            value={config.titleColor || '#ef4444'}
            onChange={(e) => updateConfig({ titleColor: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            title="Title color"
          />
        </div>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => updateConfig({ title: e.target.value })}
          placeholder="Enter screen title here..."
          className="w-full text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
        />

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Title Font</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setAssetPickerConfig({
                    filterType: 'font',
                    title: 'Select Title Font from Gallery',
                    initialFontSample: config.title || 'SAMPLE TITLE',
                    onSelect: (asset) => {
                      updateConfig({ titleFontFamily: asset.url });
                      ensureGoogleFontLoaded(asset.url);
                    },
                  });
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-surface)] text-left flex items-center justify-between transition-all cursor-pointer shadow-sm group min-w-0"
                title="Click to choose font from Gallery"
              >
                <span
                  className="text-xs text-[var(--text)] font-bold truncate group-hover:text-[var(--accent)] flex items-center gap-1.5"
                  style={{ fontFamily: config.titleFontFamily || undefined }}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span>{VN_FONT_CATALOG.find((f) => f.id === config.titleFontFamily)?.name || 'Default Font'}</span>
                </span>
                <span className="text-[10px] text-[var(--accent)] font-bold shrink-0 flex items-center gap-1">
                  <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-2.5 h-2.5" />
                  <span>Gallery</span>
                </span>
              </button>
              {config.titleFontFamily && (
                <button
                  type="button"
                  onClick={() => updateConfig({ titleFontFamily: undefined })}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/20 text-red-400 cursor-pointer transition-colors text-xs shrink-0 flex items-center justify-center"
                  title="Reset font to default"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Title Size</label>
            <select
              value={config.titleFontSize || '2xl'}
              onChange={(e) => updateConfig({ titleFontSize: e.target.value as any })}
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] cursor-pointer"
            >
              <option value="sm">Small</option>
              <option value="base">Normal</option>
              <option value="lg">Large</option>
              <option value="xl">XL</option>
              <option value="2xl">2XL (Impact)</option>
              <option value="3xl">3XL (Monumental)</option>
            </select>
          </div>
        </div>

        {/* Title Text Effect (Animation) from Gallery */}
        <div className="pt-2">
          <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">
            Title Text Effect (Animation)
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setAssetPickerConfig({
                  filterType: 'text_effect',
                  title: 'Select Title Text Effect from Gallery',
                  initialFontSample: config.title || 'SIGNAL TERMINATED',
                  onSelect: (asset) => {
                    updateConfig({ titleAnimation: asset.url as any });
                  },
                });
              }}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-surface)] text-left flex items-center justify-between transition-all cursor-pointer shadow-sm group min-w-0"
              title="Choose text effect from Gallery"
            >
              <span className="text-xs text-[var(--text)] font-bold truncate group-hover:text-[var(--accent)] flex items-center gap-1.5">
                <GuiIconRenderer
                  icon={VN_TEXT_EFFECTS_CATALOG.find((e) => e.id === config.titleAnimation)?.icon || GUI_ICONS.general.screenFx}
                  className="w-3.5 h-3.5 text-[var(--accent)] shrink-0"
                />
                <span>
                  {VN_TEXT_EFFECTS_CATALOG.find((e) => e.id === config.titleAnimation)?.name ||
                    (config.titleAnimation && config.titleAnimation !== 'none'
                      ? config.titleAnimation.toUpperCase()
                      : 'None (Static Text)')}
                </span>
              </span>
              <span className="text-[10px] text-[var(--accent)] font-bold shrink-0 flex items-center gap-1">
                <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-2.5 h-2.5" />
                <span>Gallery</span>
              </span>
            </button>
            {config.titleAnimation && config.titleAnimation !== 'none' && (
              <button
                type="button"
                onClick={() => updateConfig({ titleAnimation: 'none' })}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/20 text-red-400 cursor-pointer transition-colors text-xs shrink-0 flex items-center justify-center"
                title="Remove text effect"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtitle Direct Canvas Transform Status & Controls */}
      <div
        className={`p-2 rounded-lg transition-all ${
          selectedTarget === 'subtitle'
            ? 'bg-purple-950/25'
            : 'bg-[var(--surface-strong)]/40 hover:bg-[var(--surface-strong)]/60'
        }`}
      >
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-mono flex items-center gap-1">
            <span className="text-purple-400 font-bold flex items-center gap-1">
              <GuiIconRenderer icon={GUI_ICONS.general.pin} className="w-3 h-3 text-purple-400" />
              <span>Subtitle Canvas:</span>
            </span>
            <span className="text-[var(--text)]">
              X: <strong>{config.subtitleXPercent ?? 50}%</strong> Y: <strong>{config.subtitleYPercent ?? 40}%</strong> ({config.subtitleScale ?? 1.0}x)
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedTarget('subtitle');
                setSelectedButtonId(null);
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedTarget === 'subtitle'
                  ? 'bg-purple-500 text-black shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
              }`}
              title="Select Subtitle directly on canvas to drag and transform"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-2.5 h-2.5" />
              <span>Select Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updateConfig({ subtitleXPercent: 50 });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--muted)] hover:text-purple-300 hover:bg-[var(--surface-strong)] cursor-pointer flex items-center gap-1 transition-colors"
              title="Center Subtitle horizontally (X: 50%)"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.circle} className="w-2.5 h-2.5" />
              <span>Center X</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updateConfig({ subtitleXPercent: 50, subtitleYPercent: 40, subtitleScale: 1.0 });
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-[var(--muted)] hover:text-red-400 hover:bg-[var(--surface-strong)] cursor-pointer flex items-center gap-1 transition-colors"
              title="Reset Subtitle position and scale"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.reset} className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtitle Text & Font */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-[var(--muted)] font-bold uppercase">
            Subtitle & Color:
          </label>
          <input
            type="color"
            value={config.subtitleColor || '#d1d5db'}
            onChange={(e) => updateConfig({ subtitleColor: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            title="Subtitle color"
          />
        </div>
        <textarea
          rows={2}
          value={config.subtitle || ''}
          onChange={(e) => updateConfig({ subtitle: e.target.value })}
          placeholder="Enter screen subtitle or message here..."
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none"
        />

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Subtitle Font</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setAssetPickerConfig({
                    filterType: 'font',
                    title: 'Select Subtitle Font from Gallery',
                    initialFontSample: config.subtitle || 'Sample Subtitle Text',
                    onSelect: (asset) => {
                      updateConfig({ subtitleFontFamily: asset.url });
                      ensureGoogleFontLoaded(asset.url);
                    },
                  });
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-surface)] text-left flex items-center justify-between transition-all cursor-pointer shadow-sm group min-w-0"
                title="Click to choose font from Gallery"
              >
                <span
                  className="text-xs text-[var(--text)] font-bold truncate group-hover:text-[var(--accent)] flex items-center gap-1.5"
                  style={{ fontFamily: config.subtitleFontFamily || undefined }}
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span>{VN_FONT_CATALOG.find((f) => f.id === config.subtitleFontFamily)?.name || 'Default Font'}</span>
                </span>
                <span className="text-[10px] text-[var(--accent)] font-bold shrink-0 flex items-center gap-1">
                  <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-2.5 h-2.5" />
                  <span>Gallery</span>
                </span>
              </button>
              {config.subtitleFontFamily && (
                <button
                  type="button"
                  onClick={() => updateConfig({ subtitleFontFamily: undefined })}
                  className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/20 text-red-400 cursor-pointer transition-colors text-xs shrink-0 flex items-center justify-center"
                  title="Reset font to default"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[9px] text-[var(--muted)] block mb-0.5">Subtitle Size</label>
            <select
              value={config.subtitleFontSize || 'base'}
              onChange={(e) => updateConfig({ subtitleFontSize: e.target.value as any })}
              className="w-full text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] cursor-pointer"
            >
              <option value="xs">Extra Small</option>
              <option value="sm">Small</option>
              <option value="base">Normal</option>
              <option value="lg">Large</option>
              <option value="xl">XL</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
