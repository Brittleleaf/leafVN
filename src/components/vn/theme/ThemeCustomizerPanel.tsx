"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  VNEditorTheme,
  VN_THEMES,
  ACCENT_PRESETS,
  applyCustomAccent,
  getStoredCustomAccent,
  getStoredBgPreferences,
  applyBgPreferences,
  VNBgPreferences,
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

// Client-side image compressor: scales down large images to fit in localStorage safely
function compressImageToDataUrl(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background preferences state
  const [bgPrefs, setBgPrefs] = useState<VNBgPreferences>({
    showDots: true,
    customImage: null,
    customOpacity: 0.35,
  });
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [showUrlField, setShowUrlField] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tone' | 'background'>('tone');

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

    const currentBgPrefs = getStoredBgPreferences();
    setBgPrefs(currentBgPrefs);
    if (currentBgPrefs.customImage && currentBgPrefs.customImage.startsWith('http')) {
      setImageUrlInput(currentBgPrefs.customImage);
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

  // Background dots toggle
  const handleToggleDots = () => {
    const newShowDots = !bgPrefs.showDots;
    const updated = { ...bgPrefs, showDots: newShowDots };
    setBgPrefs(updated);
    applyBgPreferences(updated);
  };

  // File upload for background
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageToDataUrl(file);
      const updated = { ...bgPrefs, customImage: compressedDataUrl };
      setBgPrefs(updated);
      applyBgPreferences(updated);
    } catch (err) {
      console.error('Failed to load custom background image:', err);
    }
  };

  // URL input for background
  const handleApplyUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    const updated = { ...bgPrefs, customImage: url };
    setBgPrefs(updated);
    applyBgPreferences(updated);
    setShowUrlField(false);
  };

  // Remove background image
  const handleRemoveBgImage = () => {
    const updated = { ...bgPrefs, customImage: null };
    setBgPrefs(updated);
    applyBgPreferences(updated);
    setImageUrlInput('');
  };

  // Opacity change
  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value);
    const updated = { ...bgPrefs, customOpacity: newOpacity };
    setBgPrefs(updated);
    applyBgPreferences(updated);
  };

  // Quick Opacity preset
  const handleSetQuickOpacity = (op: number) => {
    const updated = { ...bgPrefs, customOpacity: op };
    setBgPrefs(updated);
    applyBgPreferences(updated);
  };

  const activeDisplayHex = customAccent || (currentTheme === 'rotp' ? '#DC2626' : currentTheme === 'default_light' ? '#6851DF' : '#D17BF8');

  return (
    <div
      className={`flex flex-col text-[var(--text)] select-none ${
        compact ? 'w-full' : 'w-88 max-w-[92vw]'
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
          <span className="text-xs font-semibold tracking-wide text-[var(--text)]">Appearance & Background</span>
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

      <div className="p-3 flex flex-col gap-3.5 max-h-[82vh] overflow-y-auto">
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

        {/* SECTION TABS: TONE vs BACKGROUND */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('tone')}
            className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
              activeTab === 'tone'
                ? 'bg-[var(--surface-strong)] text-[var(--text)] font-bold shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Accent Tone (Matiz)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('background')}
            className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'background'
                ? 'bg-[var(--surface-strong)] text-[var(--text)] font-bold shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Background</span>
            {bgPrefs.customImage && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </button>
        </div>

        {/* TAB CONTENT 1: ACCENT TONE (HUE & HEX) */}
        {activeTab === 'tone' && (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <span>Color Spectrum</span>
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
            <div className="flex items-center gap-2 mt-0.5">
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
            <div className="flex flex-col gap-1.5 mt-0.5">
              <span className="text-[10px] text-[var(--muted2)]">Harmonic Presets</span>
              <div className="grid grid-cols-5 gap-1.5">
                {ACCENT_PRESETS.map((p) => {
                  const isActive = activeDisplayHex.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => handleSelectPreset(p.hex, p.hue)}
                      className={`h-7 px-1 rounded-md border flex items-center justify-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'border-[var(--accent)] bg-[var(--surface-strong)] font-semibold shadow-xs'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)]'
                      }`}
                      title={`${p.name} (${p.hex})`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs border border-[var(--border2)]"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="truncate text-[9px]">{p.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: BACKGROUND CUSTOMIZER */}
        {activeTab === 'background' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* 1. TOGGLE DOTS (Puntos del fondo) */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.general.circle} className="w-3 h-3 text-[var(--accent)]" />
                  <span>Ambient Grid Dots</span>
                </span>
                <span className="text-[10px] text-[var(--muted2)]">
                  {bgPrefs.showDots ? 'Subtle dot-matrix texture active' : 'Clean solid background (dots hidden)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleDots}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex items-center px-0.5 ${
                  bgPrefs.showDots ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
                title="Toggle background grid dots"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                    bgPrefs.showDots ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. PERSONALIZED BACKGROUND IMAGE */}
            <div className="flex flex-col gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Personalized Background</span>
                </span>
                {bgPrefs.customImage && (
                  <button
                    type="button"
                    onClick={handleRemoveBgImage}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    title="Remove custom background"
                  >
                    Remove
                  </button>
                )}
              </div>

              {bgPrefs.customImage ? (
                /* Active image preview & controls */
                <div className="flex flex-col gap-2.5">
                  <div
                    className="w-full h-24 rounded-lg border border-[var(--border2)] relative overflow-hidden bg-cover bg-center shadow-inner flex items-end p-2"
                    style={{ backgroundImage: `url('${bgPrefs.customImage}')` }}
                  >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono text-white/90 drop-shadow">
                        Opacity: {Math.round(bgPrefs.customOpacity * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-0.5 text-[10px] font-medium bg-black/60 hover:bg-black/80 text-white rounded border border-white/20 transition-colors cursor-pointer backdrop-blur-sm"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Opacity slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                      <span>Image Opacity</span>
                      <span className="font-mono">{Math.round(bgPrefs.customOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={bgPrefs.customOpacity}
                      onChange={handleOpacityChange}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer outline-none bg-[var(--well-bg)]"
                    />

                    {/* Quick preset buttons */}
                    <div className="flex items-center gap-1 mt-1">
                      {[0.15, 0.30, 0.50, 0.75, 1.0].map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => handleSetQuickOpacity(op)}
                          className={`flex-1 py-0.5 rounded text-[9px] font-mono border transition-colors cursor-pointer ${
                            Math.abs(bgPrefs.customOpacity - op) < 0.04
                              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] font-bold'
                              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          {Math.round(op * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state: upload or URL buttons */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-[var(--accent-contrast)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlField(!showUrlField)}
                      className="py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] text-xs font-medium cursor-pointer transition-colors"
                      title="Paste image URL"
                    >
                      URL
                    </button>
                  </div>

                  {/* Expandable URL field */}
                  {showUrlField && (
                    <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/wallpaper.jpg"
                        className="flex-1 h-7 px-2 text-xs rounded border border-[var(--border)] bg-[var(--well-bg)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        disabled={!imageUrlInput.trim()}
                        className="h-7 px-2.5 text-xs font-semibold rounded bg-[var(--accent)] text-[var(--accent-contrast)] disabled:opacity-40 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-[var(--muted2)] leading-tight">
                    Upload a local image or paste a link. It will be layered behind the UI with customizable opacity.
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
          </div>
        )}

        {/* Informative footer */}
        <div className="text-[9px] text-[var(--muted2)] leading-tight pt-2 border-t border-[var(--border)]">
          Preferences are automatically saved to your browser and persist across sessions.
        </div>
      </div>
    </div>
  );
}
