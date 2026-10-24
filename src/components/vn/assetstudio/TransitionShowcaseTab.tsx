"use client";
import React, { useState, useRef } from 'react';
import { VNAssetItem } from '@/types/vn';
import { VN_TRANSITIONS_CATALOG, VNTransitionDefinition } from '../transitions';
import { VNTransitionOverlay } from '../transitions/VNTransitionOverlay';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface TransitionShowcaseTabProps {
  searchQuery: string;
  previewBackgroundUrl?: string;
  onSelectAsset?: (asset: VNAssetItem) => void;
  onClose: () => void;
}

export function TransitionShowcaseTab({
  searchQuery,
  previewBackgroundUrl,
  onSelectAsset,
  onClose,
}: TransitionShowcaseTabProps) {
  const [activeTransitions, setActiveTransitions] = useState<Record<string, boolean>>({});
  const [activeScenes, setActiveScenes] = useState<Record<string, 'A' | 'B'>>({});
  const [transitionSpeeds, setTransitionSpeeds] = useState<Record<string, number>>({});

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const swapTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const effectiveBg = previewBackgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';
  const isCustomSceneBg = Boolean(previewBackgroundUrl);

  const handlePlayTransition = (trans: VNTransitionDefinition) => {
    const id = trans.id;
    const durSec = transitionSpeeds[id] ?? trans.defaultDurationSec;
    const durMs = Math.max(250, durSec * 1000);

    // Clear any pending timers for this card
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    if (swapTimersRef.current[id]) clearTimeout(swapTimersRef.current[id]);

    setActiveTransitions((prev) => ({ ...prev, [id]: true }));
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);

    // Swap scene halfway through the transition
    swapTimersRef.current[id] = setTimeout(() => {
      setActiveScenes((prev) => ({
        ...prev,
        [id]: prev[id] === 'B' ? 'A' : 'B',
      }));
    }, durMs * 0.48);

    // End transition
    timersRef.current[id] = setTimeout(() => {
      setActiveTransitions((prev) => ({ ...prev, [id]: false }));
    }, durMs);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner - Matching ScreenFxShowcaseTab */}
      <div className="p-4 rounded-2xl bg-[var(--well-bg)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-4 h-4 text-[var(--accent)]" />
            <span>Scene Transitions & Camera Sequencing Engine</span>
          </h3>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            {isCustomSceneBg ? (
              <span>
                Real-time cinematic scene transitions simulated live over current scene background (<code className="font-mono text-emerald-400">{effectiveBg.split('/').pop()}</code>).
              </span>
            ) : (
              <span>
                Real-time cinematic scene transitions simulated live over the scenario template background (<code className="font-mono text-emerald-500">SCENARIO-TEMPLATE.jpg</code>).
              </span>
            )}
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--text)] font-bold">
          {VN_TRANSITIONS_CATALOG.length} Transition Presets
        </span>
      </div>

      {/* Grid of Transition Cards - Matching ScreenFxShowcaseTab Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VN_TRANSITIONS_CATALOG
          .filter(
            (t) =>
              !searchQuery.trim() ||
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.id.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((t) => {
            const isPlaying = Boolean(activeTransitions[t.id]);
            const currentScene = activeScenes[t.id] || 'A';
            const currentDuration = transitionSpeeds[t.id] ?? t.defaultDurationSec;

            return (
              <div
                key={t.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-lg hover:border-[var(--accent)] transition-all flex flex-col group"
              >
                {/* 16:9 Live Preview Viewport over Scenario Background */}
                <div
                  onClick={() => handlePlayTransition(t)}
                  className="relative w-full aspect-video bg-black overflow-hidden border-b border-[var(--border)] cursor-pointer select-none"
                  title="Click to trigger transition"
                >
                  {/* SCENE A */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      currentScene === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${effectiveBg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="absolute bottom-2 left-2.5 z-20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-mono font-bold text-rose-300 tracking-wider uppercase bg-black/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                        Scene A
                      </span>
                    </div>
                  </div>

                  {/* SCENE B */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      currentScene === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0c1829] via-[#09101f] to-[#040810]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] pointer-events-none" />
                    <div className="absolute bottom-2 left-2.5 z-20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider uppercase bg-black/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                        Scene B
                      </span>
                    </div>
                  </div>

                  {/* LIVE TRANSITION OVERLAY */}
                  <VNTransitionOverlay
                    transitionId={t.id}
                    isActive={isPlaying}
                    durationSec={currentDuration}
                  />

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-bold bg-black/75 backdrop-blur-md border border-white/20 text-white shadow">
                    <GuiIconRenderer icon={t.icon} className="w-3.5 h-3.5" />
                    <span className="uppercase">{t.name}</span>
                  </div>

                  {/* Duration Tag */}
                  <div className="absolute bottom-2 right-2 z-30 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                    {currentDuration}s
                  </div>
                </div>

                {/* Card Controls & Details */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                      <GuiIconRenderer icon={t.icon} className="w-4 h-4 text-[var(--accent)]" />
                      <span>{t.name}</span>
                    </h4>
                    <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-1">
                      {t.description}
                    </p>
                  </div>

                  {/* Controls: Speed / Duration Selector & Play Test Button */}
                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-[var(--muted)]">Speed / Timing:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: '0.4s', val: 0.4 },
                          { label: `${t.defaultDurationSec}s`, val: t.defaultDurationSec },
                          { label: '1.4s', val: 1.4 },
                        ].map((spd) => (
                          <button
                            key={spd.label}
                            type="button"
                            onClick={() => {
                              setTransitionSpeeds((prev) => ({ ...prev, [t.id]: spd.val }));
                              playSfx('/assets/sfx/click intro.mp3', false, 0.15);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
                              currentDuration === spd.val
                                ? 'bg-[var(--accent)] text-white shadow'
                                : 'bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            {spd.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--border)]">
                      <span className="text-[var(--muted)]">Preview Animation:</span>
                      <button
                        type="button"
                        onClick={() => handlePlayTransition(t)}
                        className={`px-2.5 py-1 rounded border font-mono text-[10px] cursor-pointer flex items-center gap-1.5 transition-all ${
                          isPlaying
                            ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 animate-pulse'
                            : 'border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] hover:border-[var(--accent)]'
                        }`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3 h-3 text-[var(--accent)]" />
                        <span>{isPlaying ? 'Playing...' : 'Play Transition'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Selection Button */}
                  <div className="pt-2">
                    {onSelectAsset ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAsset({
                            id: `transition-${t.id}`,
                            name: t.name,
                            type: 'transition',
                            origin: 'system',
                            url: t.id,
                            description: t.description,
                          });
                          onClose();
                          playSfx('/assets/sfx/success.mp3', false, 0.4);
                        }}
                        className="w-full py-2 px-3 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] text-[#0F0503] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5" />
                        <span>Select This Transition</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted2)] font-mono">
                        <span>Preset Key:</span>
                        <code className="text-cyan-400 font-bold">{t.id}</code>
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
