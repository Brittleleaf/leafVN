"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  VNEditorTheme,
  VN_THEMES,
  ACCENT_PRESETS,
  applyCustomAccent,
  getStoredCustomAccent,
  hueToHex,
  hexToHue,
  hexToRgb,
} from '@/lib/vn/themeManager';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface ThemeCustomizerPanelProps {
  currentTheme: VNEditorTheme;
  onSelectTheme: (theme: VNEditorTheme) => void;
  onClose?: () => void;
  compact?: boolean;
}

export default function ThemeCustomizerPanel({
  currentTheme,
  onSelectTheme,
  onClose,
  compact = false,
}: ThemeCustomizerPanelProps) {
  const [customAccent, setCustomAccent] = useState<string | null>(null);
  const [hueValue, setHueValue] = useState<number>(281);
  const [hexInput, setHexInput] = useState<string>('#D17BF8');
  const [copied, setCopied] = useState<boolean>(false);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Initialize from storage or active theme
  useEffect(() => {
    const stored = getStoredCustomAccent();
    if (stored) {
      setCustomAccent(stored);
      setHexInput(stored);
      setHueValue(hexToHue(stored));
    } else {
      const defaultHex = currentTheme === 'rotp' ? '#DC2626' : currentTheme === 'default_light' ? '#6851DF' : '#D17BF8';
      setHexInput(defaultHex);
      setHueValue(hexToHue(defaultHex));
    }
  }, [currentTheme]);

  // Handle Hue Slider changes
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value, 10);
    setHueValue(newHue);
    const newHex = hueToHex(newHue);
    setHexInput(newHex);
    setCustomAccent(newHex);
    applyCustomAccent(newHex);
  };

  // Handle Hex manual typing / paste
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setHexInput(val);

    if (hexToRgb(val)) {
      setCustomAccent(val);
      setHueValue(hexToHue(val));
      applyCustomAccent(val);
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (hex: string, hue: number) => {
    setCustomAccent(hex);
    setHexInput(hex);
    setHueValue(hue);
    applyCustomAccent(hex);
  };

  // Reset to default theme colors
  const handleResetAccent = () => {
    setCustomAccent(null);
    applyCustomAccent(null);
    const defaultHex = currentTheme === 'rotp' ? '#DC2626' : currentTheme === 'default_light' ? '#6851DF' : '#D17BF8';
    setHexInput(defaultHex);
    setHueValue(hexToHue(defaultHex));
  };

  // Copy HEX to clipboard
  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // Trigger native color picker
  const handleOpenNativePicker = () => {
    colorPickerRef.current?.click();
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    setCustomAccent(val);
    setHueValue(hexToHue(val));
    applyCustomAccent(val);
  };

  const activeDisplayHex = customAccent || (currentTheme === 'rotp' ? '#DC2626' : currentTheme === 'default_light' ? '#6851DF' : '#D17BF8');

  return (
    <div
      className={`flex flex-col text-[var(--text)] select-none ${
        compact ? 'w-full' : 'w-84 max-w-[92vw]'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: activeDisplayHex, boxShadow: `0 0 10px ${activeDisplayHex}` }}
          />
          <span className="text-xs font-semibold tracking-wide text-[var(--text)]">Appearance & Color</span>
        </div>
        <div className="flex items-center gap-1.5">
          {customAccent && (
            <button
              onClick={handleResetAccent}
              className="px-2 py-0.5 text-[10px] font-medium rounded hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Reset accent to base theme default"
            >
              Reset
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Close panel"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3.5 max-h-[80vh] overflow-y-auto">
        {/* SECTION 1: BASE THEME SELECTOR */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
            Base Theme
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {VN_THEMES.map((th) => {
              const isCurrent = currentTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => onSelectTheme(th.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'border-[var(--accent)] bg-[var(--surface-strong)] font-semibold shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  title={th.description}
                >
                  <div
                    className="w-5 h-5 rounded-md border flex items-center justify-center mb-1 shadow-xs"
                    style={{
                      backgroundColor: th.previewBg,
                      borderColor: th.previewBorder,
                      color: th.previewAccent,
                    }}
                  >
                    <GuiIconRenderer
                      icon={
                        th.id === 'default_light'
                          ? GUI_ICONS.general.lightBulb
                          : th.id === 'rotp'
                          ? GUI_ICONS.general.hazard
                          : GUI_ICONS.general.circle
                      }
                      className="w-3 h-3"
                    />
                  </div>
                  <span className="text-[11px] truncate w-full">{th.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: COLOR TONE (HUE & HEX) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Accent Tone (Matiz)</span>
              {customAccent && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[var(--accent-surface)] text-[var(--accent)] font-mono font-medium">
                  Custom
                </span>
              )}
            </label>
            <span className="text-[10px] font-mono text-[var(--muted)]">{hueValue}°</span>
          </div>

          {/* HUE SPECTRUM SLIDER */}
          <div className="relative flex items-center w-full">
            <input
              type="range"
              min="0"
              max="360"
              value={hueValue}
              onChange={handleHueChange}
              className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none transition-all"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
            />
          </div>

          {/* HEX INPUT & LIVE COLOR SWATCH */}
          <div className="flex items-center gap-2 mt-1">
            {/* Color Swatch / Native Picker Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleOpenNativePicker}
                className="w-8 h-8 rounded-lg border border-[var(--border2)] cursor-pointer shadow-sm transition-transform active:scale-95 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: activeDisplayHex }}
                title="Click to open color picker"
              >
                <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
              </button>
              <input
                ref={colorPickerRef}
                type="color"
                value={activeDisplayHex.startsWith('#') && activeDisplayHex.length === 7 ? activeDisplayHex : '#D17BF8'}
                onChange={handleNativePickerChange}
                className="sr-only"
                tabIndex={-1}
              />
            </div>

            {/* HEX Input Field */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={hexInput}
                onChange={handleHexInputChange}
                placeholder="#D17BF8"
                maxLength={9}
                className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--well-bg)] text-xs font-mono text-[var(--text)] uppercase focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
              />
              <button
                type="button"
                onClick={handleCopyHex}
                className="absolute right-1.5 px-1.5 py-0.5 text-[9px] font-mono rounded bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Copy HEX to clipboard"
              >
                {copied ? '✓' : 'COPY'}
              </button>
            </div>
          </div>

          {/* QUICK PRESET CHIPS */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="text-[10px] text-[var(--muted2)]">Harmonic Presets</span>
            <div className="grid grid-cols-4 gap-1.5">
              {ACCENT_PRESETS.map((p) => {
                const isActive = activeDisplayHex.toLowerCase() === p.hex.toLowerCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => handleSelectPreset(p.hex, p.hue)}
                    className={`h-7 px-1.5 rounded-md border flex items-center gap-1.5 text-[10px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--surface-strong)] font-semibold shadow-xs'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                    title={`${p.name} (${p.hex})`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="truncate">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Informative footer */}
        <div className="text-[9px] text-[var(--muted2)] leading-tight pt-2 border-t border-[var(--border)]">
          The selected tone shifts brand accents, glowing meshes, button highlights, and borders automatically.
        </div>
      </div>
    </div>
  );
}
