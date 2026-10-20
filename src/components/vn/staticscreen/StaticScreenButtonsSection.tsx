"use client";
import React from 'react';
import {
  VNStaticScreenConfig,
  VNStaticScreenButton,
  VNAssetItem,
  VNAssetType,
} from '@/types/vn';
import { VN_FONT_CATALOG, ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import { getAllButtonHoverEffects } from '@/lib/vn/buttonHoverEffects';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface StaticScreenButtonsSectionProps {
  config: VNStaticScreenConfig;
  updateConfig: (patch: Partial<VNStaticScreenConfig>) => void;
  selectedButtonId: string | null;
  setSelectedButtonId: (id: string | null) => void;
  handleAddButton: () => void;
  handleUpdateButton: (btnId: string, patch: Partial<VNStaticScreenButton>) => void;
  handleDeleteButton: (btnId: string) => void;
  allStoryScenarios: { id: string; name: string }[];
  setAssetPickerConfig: (cfg: {
    filterType: VNAssetType;
    title: string;
    initialFontSample?: string;
    onSelect: (asset: VNAssetItem) => void;
  } | null) => void;
}

export function StaticScreenButtonsSection({
  config,
  updateConfig,
  selectedButtonId,
  setSelectedButtonId,
  handleAddButton,
  handleUpdateButton,
  handleDeleteButton,
  allStoryScenarios,
  setAssetPickerConfig,
}: StaticScreenButtonsSectionProps) {
  return (
    <div className="space-y-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Buttons & Placement</span>
        </span>
        <button
          onClick={handleAddButton}
          className="text-xs px-2.5 py-1 rounded-lg border border-[var(--accent)] bg-[var(--accent-surface)] text-[var(--accent)] hover:opacity-80 font-bold transition-all cursor-pointer"
        >
          + Add Button
        </button>
      </div>

      {/* Layout Mode (Stacked vs Free Positioning) */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        <span className="text-[11px] font-bold text-[var(--text)]">Layout Mode:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const resetButtons = (config.buttons || []).map((b) => ({
                ...b,
                xPercent: undefined,
                yPercent: undefined,
                rotation: 0,
                scale: 1,
              }));
              updateConfig({ buttonsLayout: 'stacked', buttons: resetButtons });
            }}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              config.buttonsLayout !== 'free'
                ? 'bg-[var(--accent)] text-white shadow'
                : 'bg-[var(--btn-bg)] text-[var(--muted)]'
            }`}
          >
            Centered Stack
          </button>
          <button
            type="button"
            onClick={() => {
              const total = config.buttons?.length || 1;
              const freeButtons = (config.buttons || []).map((b, idx) => ({
                ...b,
                xPercent: b.xPercent ?? 50,
                yPercent: b.yPercent ?? Math.round((70 + (idx - (total - 1) / 2) * 11) * 10) / 10,
              }));
              updateConfig({ buttonsLayout: 'free', buttons: freeButtons });
            }}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              config.buttonsLayout === 'free'
                ? 'bg-[var(--accent)] text-white shadow'
                : 'bg-[var(--btn-bg)] text-[var(--muted)]'
            }`}
          >
            Free Canvas (Drag)
          </button>
        </div>
      </div>

      {config.buttonsLayout === 'free' && (
        <p className="text-[10px] text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 p-2 rounded-lg leading-relaxed flex items-start gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span><strong>Free Positioning Active:</strong> You can click and drag any button directly on the live preview screen to position it anywhere!</span>
        </p>
      )}

      {/* Buttons List */}
      <div className="space-y-2">
        {(config.buttons || []).map((btn, idx) => {
          const isSelected = selectedButtonId === btn.id;
          return (
            <div
              key={btn.id}
              onClick={() => setSelectedButtonId(btn.id)}
              className={`p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-surface)] shadow-md'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border2)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-[var(--muted)]">#{idx + 1}</span>
                <input
                  type="text"
                  value={btn.label}
                  onChange={(e) => handleUpdateButton(btn.id, { label: e.target.value })}
                  className="flex-1 font-bold px-2 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] focus:outline-none"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteButton(btn.id);
                  }}
                  className="text-red-400 hover:text-red-300 p-1 cursor-pointer flex items-center justify-center"
                  title="Delete Button"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Button Properties Accordion for Selected Button */}
              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-[var(--border)] space-y-2 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-[var(--muted)] block mb-0.5">Action</label>
                      <select
                        value={btn.action}
                        onChange={(e) => handleUpdateButton(btn.id, { action: e.target.value as any })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px] cursor-pointer"
                      >
                        <option value="next_scene">Next Scenario / Continue</option>
                        <option value="retry_previous">Retry Previous (Smart)</option>
                        <option value="load_game">Open Load Game</option>
                        <option value="main_menu">Return to Title</option>
                        <option value="jump_scene">Jump to Scene</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-[var(--muted)] block mb-0.5">Style</label>
                      <select
                        value={btn.style || 'ghost'}
                        onChange={(e) => handleUpdateButton(btn.id, { style: e.target.value as any })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px] cursor-pointer"
                      >
                        <option value="danger">Danger (Red Glow)</option>
                        <option value="primary">Accent (Violet Glow)</option>
                        <option value="glass">Frosted Glass</option>
                        <option value="retro">Retro Phosphor</option>
                        <option value="ghost">Ghost Dark</option>
                      </select>
                    </div>
                  </div>

                  {/* Size and Font */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-[var(--muted)] block mb-0.5">Button Scale / Size</label>
                      <select
                        value={btn.size || 'md'}
                        onChange={(e) => handleUpdateButton(btn.id, { size: e.target.value as any })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px] cursor-pointer"
                      >
                        <option value="sm">Small Compact</option>
                        <option value="md">Medium Standard</option>
                        <option value="lg">Large Prominent</option>
                        <option value="xl">Extra Large (Hero)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Custom Font</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAssetPickerConfig({
                              filterType: 'font',
                              title: 'Select Button Font from Gallery',
                              initialFontSample: btn.label || 'BUTTON TEXT',
                              onSelect: (asset) => {
                                handleUpdateButton(btn.id, { fontFamily: asset.url });
                                ensureGoogleFontLoaded(asset.url);
                              },
                            });
                          }}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)] hover:bg-[var(--accent-surface)] text-left flex items-center justify-between transition-all cursor-pointer shadow-sm group min-w-0"
                          title="Click to choose button font from Gallery"
                        >
                          <span
                            className="text-[11px] text-[var(--text)] font-bold truncate group-hover:text-[var(--accent)] flex items-center gap-1.5"
                            style={{ fontFamily: btn.fontFamily || undefined }}
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3 h-3 text-[var(--accent)] shrink-0" />
                            <span>{VN_FONT_CATALOG.find((f) => f.id === btn.fontFamily)?.name || 'Inherit Story'}</span>
                          </span>
                          <span className="text-[9px] text-[var(--accent)] font-bold shrink-0 flex items-center gap-1">
                            <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-2.5 h-2.5" />
                            <span>Gallery</span>
                          </span>
                        </button>
                        {btn.fontFamily && (
                          <button
                            type="button"
                            onClick={() => handleUpdateButton(btn.id, { fontFamily: undefined })}
                            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-red-500/20 text-red-400 cursor-pointer transition-colors text-xs shrink-0 flex items-center justify-center"
                            title="Reset font to inherit"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect & Container Visibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[var(--border)]">
                    <div>
                      <label className="text-[9px] text-[var(--muted)] font-bold uppercase block mb-1">Text Hover Effect</label>
                      <select
                        value={btn.hoverEffect || 'none'}
                        onChange={(e) => handleUpdateButton(btn.id, { hoverEffect: e.target.value as any })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px] cursor-pointer"
                      >
                        {getAllButtonHoverEffects().map((eff) => (
                          <option key={eff.id} value={eff.id}>
                            {eff.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] cursor-pointer text-[11px] font-bold text-[var(--text)] select-none">
                        <input
                          type="checkbox"
                          checked={!!btn.hideContainer}
                          onChange={(e) => handleUpdateButton(btn.id, { hideContainer: e.target.checked })}
                          className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                        />
                        <span>No Container (Floating Text)</span>
                      </label>
                    </div>
                  </div>

                  {/* Direct Canvas Manipulation Badge */}
                  <div className="p-2.5 rounded-lg border border-[#D17BF8]/40 bg-[#D17BF8]/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D17BF8] flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.transform} className="w-3.5 h-3.5" />
                        <span>Direct Canvas Transform</span>
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        Interactive Mode
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                      Click & drag this button directly on the screen to reposition. Drag the 6 handles to scale width interactively.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-[var(--surface)] text-gray-300 border border-[var(--border)]">
                        X: <strong>{btn.xPercent ?? 50}%</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[var(--surface)] text-gray-300 border border-[var(--border)]">
                        Y: <strong>{btn.yPercent ?? 75}%</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[var(--surface)] text-cyan-300 border border-[var(--border)]">
                        W: <strong>{btn.widthPercent || (btn.size === 'xl' ? 68 : btn.size === 'lg' ? 52 : btn.size === 'sm' ? 26 : 38)}%</strong>
                      </span>
                    </div>
                  </div>

                  {btn.action === 'jump_scene' && (
                    <div>
                      <label className="text-[9px] text-[var(--muted)] block mb-0.5">Target Scenario</label>
                      <select
                        value={btn.targetSceneId || ''}
                        onChange={(e) => handleUpdateButton(btn.id, { targetSceneId: e.target.value })}
                        className="w-full px-1.5 py-1 rounded border border-[var(--border)] bg-[var(--btn-bg)] text-[var(--text)] text-[11px] cursor-pointer"
                      >
                        <option value="">-- Select Scenario --</option>
                        {allStoryScenarios.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
