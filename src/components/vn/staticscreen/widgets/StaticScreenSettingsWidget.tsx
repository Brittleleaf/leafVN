"use client";
import React, { useState, useEffect } from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { getAudioSettings, AUDIO_KEYS, playSfx, playUiSound } from '@/lib/audioSettings';

interface StaticScreenSettingsWidgetProps {
  isInteractive?: boolean;
}

export function StaticScreenSettingsWidget({
  isInteractive = false,
}: StaticScreenSettingsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'display' | 'text' | 'language'>('audio');

  // Audio state
  const [masterVolume, setMasterVolume] = useState<number>(80);
  const [bgmVolume, setBgmVolume] = useState<number>(75);
  const [sfxVolume, setSfxVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Display state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio169, setAspectRatio169] = useState<boolean>(true);

  // Text state
  const [typewriterSpeedMs, setTypewriterSpeedMs] = useState<number>(25);
  const [autoAdvanceSpeedMs, setAutoAdvanceSpeedMs] = useState<number>(2500);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en' | 'ja'>('es');

  // Load existing audio settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const settings = getAudioSettings();
    setMasterVolume(settings.volume);
    setIsMuted(settings.muteAll);

    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleUpdateMasterVolume = (val: number) => {
    setMasterVolume(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUDIO_KEYS.VOLUME, String(val));
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUDIO_KEYS.MUTE_ALL, next ? 'true' : 'false');
    }
    playUiSound(next ? 'open' : 'select', 0.4);
  };

  const handleToggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    playUiSound('click', 0.3);
  };

  return (
    <div className="w-full max-w-3xl px-4 py-2 z-30 pointer-events-auto flex flex-col items-center select-none">
      {/* Settings Sub-Nav Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-md bg-black/60 border border-white/15 backdrop-blur-md mb-3 shadow-lg">
        <button
          type="button"
          onClick={() => { setActiveTab('audio'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-3.5 h-3.5" />
          <span>Sound</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('display'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'display'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-3.5 h-3.5" />
          <span>Display</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('text'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5" />
          <span>Text & Speed</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('language'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'language'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.action.talk} className="w-3.5 h-3.5" />
          <span>Language</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="w-full bg-black/60 border border-white/15 rounded-lg p-4 backdrop-blur-md shadow-2xl min-h-[220px] max-h-[300px] overflow-y-auto custom-scrollbar">
        {/* AUDIO PANEL */}
        {activeTab === 'audio' && (
          <div className="space-y-3.5">
            {/* Master Volume */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.general.soundOn} className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Master Volume</span>
                </span>
                <span className="font-mono text-cyan-300 text-xs font-bold">{masterVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={masterVolume}
                onChange={(e) => handleUpdateMasterVolume(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
            </div>

            {/* BGM Volume */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.media.audio} className="w-3.5 h-3.5 text-purple-400" />
                  <span>Music / BGM</span>
                </span>
                <span className="font-mono text-purple-300 text-xs font-bold">{bgmVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseInt(e.target.value, 10))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
            </div>

            {/* SFX Volume */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sound Effects (SFX)</span>
                </span>
                <span className="font-mono text-amber-300 text-xs font-bold">{sfxVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sfxVolume}
                onChange={(e) => setSfxVolume(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
            </div>

            {/* Mute Toggle */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">Mute All Audio</span>
              <button
                type="button"
                onClick={handleToggleMute}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                }`}
              >
                <GuiIconRenderer icon={isMuted ? GUI_ICONS.general.cancel : GUI_ICONS.general.soundOn} className="w-3.5 h-3.5" />
                <span>{isMuted ? 'MUTED' : 'UNMUTED'}</span>
              </button>
            </div>
          </div>
        )}

        {/* DISPLAY PANEL */}
        {activeTab === 'display' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2.5 rounded-md border border-white/10 bg-white/5">
              <div>
                <span className="text-xs font-bold text-white block uppercase tracking-wider">Fullscreen Mode</span>
                <span className="text-[11px] text-gray-400">Expand story presentation to occupy full monitor view</span>
              </div>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isFullscreen
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                }`}
              >
                <span>{isFullscreen ? 'FULLSCREEN [ON]' : 'WINDOWED [OFF]'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md border border-white/10 bg-white/5">
              <div>
                <span className="text-xs font-bold text-white block uppercase tracking-wider">Aspect Ratio Locking</span>
                <span className="text-[11px] text-gray-400">Fixed 16:9 cinematic proportional scaling</span>
              </div>
              <button
                type="button"
                onClick={() => setAspectRatio169(!aspectRatio169)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  aspectRatio169
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:text-white'
                }`}
              >
                <span>16:9 CINEMATIC</span>
              </button>
            </div>
          </div>
        )}

        {/* TEXT PANEL */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.general.fontFx} className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Typewriter Character Speed</span>
                </span>
                <span className="font-mono text-cyan-300 text-xs font-bold">{typewriterSpeedMs} ms/char</span>
              </div>
              <input
                type="range"
                min={5}
                max={75}
                value={typewriterSpeedMs}
                onChange={(e) => setTypewriterSpeedMs(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>Fast (5ms)</span>
                <span>Normal (25ms)</span>
                <span>Slow (75ms)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Auto-Mode Pause Interval</span>
                </span>
                <span className="font-mono text-emerald-300 text-xs font-bold">{(autoAdvanceSpeedMs / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={1000}
                max={6000}
                step={500}
                value={autoAdvanceSpeedMs}
                onChange={(e) => setAutoAdvanceSpeedMs(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                <span>1.0s</span>
                <span>2.5s</span>
                <span>6.0s</span>
              </div>
            </div>
          </div>
        )}

        {/* LANGUAGE PANEL */}
        {activeTab === 'language' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'es', label: 'Español', desc: 'Spanish Translation' },
              { id: 'en', label: 'English', desc: 'English Localization' },
              { id: 'ja', label: '日本語', desc: 'Japanese Localization' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => { setSelectedLanguage(lang.id as any); playUiSound('select', 0.4); }}
                className={`p-3 rounded-md border text-left transition-all cursor-pointer backdrop-blur-sm ${
                  selectedLanguage === lang.id
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                <div className="text-sm font-bold text-white mb-0.5">{lang.label}</div>
                <div className="text-[10px] text-gray-400 font-mono">{lang.desc}</div>
                {selectedLanguage === lang.id && (
                  <div className="mt-2 text-[9px] font-mono font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                    <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3 h-3 text-cyan-400" />
                    <span>Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
