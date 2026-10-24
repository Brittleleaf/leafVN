"use client";
import React, { useState, useEffect, useRef } from 'react';
import { VNAssetItem } from '@/types/vn';
import { VN_TRANSITIONS_CATALOG, VNTransitionDefinition, getTransition } from '../transitions';
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
  const [selectedTransitionId, setSelectedTransitionId] = useState<string>('fade_black');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeScene, setActiveScene] = useState<'A' | 'B'>('A');
  const [isTransitionActive, setIsTransitionActive] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubProgress, setScrubProgress] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 0.5x (fast), 1.0x (normal), 1.6x (cinematic)
  const [autoCycle, setAutoCycle] = useState<boolean>(false);

  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveBgA = previewBackgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';
  const selectedDef = getTransition(selectedTransitionId);
  const effectiveDuration = (selectedDef.defaultDurationSec * speedMultiplier);

  // Play transition animation between Scene A and Scene B
  const triggerTransition = (targetId?: string) => {
    const nextId = targetId || selectedTransitionId;
    if (nextId !== selectedTransitionId) {
      setSelectedTransitionId(nextId);
    }

    // Cancel existing timers
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (sceneSwitchTimerRef.current) clearTimeout(sceneSwitchTimerRef.current);

    setIsScrubbing(false);
    setIsTransitionActive(true);
    playSfx('/assets/sfx/click intro.mp3', false, 0.25);

    const durMs = Math.max(250, effectiveDuration * 1000);

    // Swap scenes halfway through the transition
    sceneSwitchTimerRef.current = setTimeout(() => {
      setActiveScene((prev) => (prev === 'A' ? 'B' : 'A'));
    }, durMs * 0.48);

    // End transition
    transitionTimerRef.current = setTimeout(() => {
      setIsTransitionActive(false);
    }, durMs);
  };

  // Auto-cycle loop effect
  useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      triggerTransition();
    }, (effectiveDuration + 2.5) * 1000);

    return () => clearInterval(interval);
  }, [autoCycle, selectedTransitionId, speedMultiplier, effectiveDuration]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (sceneSwitchTimerRef.current) clearTimeout(sceneSwitchTimerRef.current);
    };
  }, []);

  // Filter transitions
  const filteredTransitions = VN_TRANSITIONS_CATALOG.filter((t) => {
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'all' ||
      t.category === activeCategory ||
      (activeCategory === 'wipe' && (t.id.includes('wipe') || t.id.includes('slide'))) ||
      (activeCategory === 'fade' && (t.id.includes('fade') || t.id.includes('dissolve')));

    return matchesSearch && matchesCategory;
  });

  // Calculate current scene to display based on scrub or activeScene
  const displayedScene = isScrubbing
    ? scrubProgress < 0.5
      ? 'A'
      : 'B'
    : activeScene;

  return (
    <div className="space-y-4">
      {/* 1. CINEMATIC TRANSITION AUDITION ARENA (HERO PREVIEW) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--well-bg)] border border-[var(--border)] space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[var(--accent-surface)] border border-[var(--accent)]/40 text-[var(--accent)] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>Real-Time Transition Audition Arena</span>
            </div>
            <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-2">
              <span>Active Effect:</span>
              <span className="text-[var(--accent)]">{selectedDef.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)]">
                {selectedDef.tag || 'TRANSITION'}
              </span>
            </h3>
          </div>

          {/* Quick Arena Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Speed Presets */}
            <div className="flex items-center bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--border)] text-[10px] font-mono">
              <span className="px-2 text-[var(--muted2)] font-bold uppercase">Speed:</span>
              {[
                { label: 'Fast (0.4s)', value: 0.5 },
                { label: 'Normal (0.8s)', value: 1.0 },
                { label: 'Cinematic (1.4s)', value: 1.75 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSpeedMultiplier(s.value)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    speedMultiplier === s.value
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {s.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Auto Cycle Toggle */}
            <button
              type="button"
              onClick={() => setAutoCycle(!autoCycle)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                autoCycle
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-[var(--card-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
              title="Automatically trigger transition in loop"
            >
              <GuiIconRenderer icon={GUI_ICONS.state.play} size={12} className={autoCycle ? 'animate-spin' : ''} />
              <span>Auto-Loop</span>
            </button>
          </div>
        </div>

        {/* 16:9 Interactive Transition Viewport */}
        <div className="relative w-full aspect-video max-h-[340px] bg-black rounded-xl overflow-hidden border-2 border-[var(--border2)] shadow-2xl select-none mx-auto">
          {/* SCENE A CONTENT */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              displayedScene === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${effectiveBgA})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Scene A HUD Elements */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-500/50 rounded text-[10px] font-mono font-bold text-rose-300 tracking-wider">
                [ SCENE A // SECTOR 04 ]
              </span>
              <span className="text-[10px] text-gray-300 font-mono tracking-widest hidden sm:inline">
                RECON DISCOVERY
              </span>
            </div>

            <div className="absolute bottom-4 inset-x-4 p-3 bg-black/75 backdrop-blur-md rounded-xl border border-rose-500/40 max-w-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  OPERATIVE CARTER
                </span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed font-sans">
                "The archive room has been breached. All terminal records point towards the lower sublevels."
              </p>
            </div>
          </div>

          {/* SCENE B CONTENT */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              displayedScene === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Dark cyberpunk/sci-fi command atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c1829] via-[#09101f] to-[#040810]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] pointer-events-none" />

            {/* Scene B HUD Elements */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-500/50 rounded text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
                [ SCENE B // SUBLEVEL 09 ]
              </span>
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest hidden sm:inline">
                CENTRAL MAINFRAME
              </span>
            </div>

            <div className="absolute bottom-4 inset-x-4 p-3 bg-black/75 backdrop-blur-md rounded-xl border border-cyan-500/40 max-w-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  SYSTEM OVERSEER
                </span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed font-sans">
                "Authorization granted. Commencing high-security sequence transfer now."
              </p>
            </div>
          </div>

          {/* TRANSITION OVERLAY RENDERER */}
          <VNTransitionOverlay
            transitionId={selectedTransitionId}
            isActive={isTransitionActive}
            progress={isScrubbing ? scrubProgress : undefined}
            durationSec={effectiveDuration}
          />

          {/* Current Scene Watermark Indicator */}
          <div className="absolute top-3 right-3 z-40 bg-black/80 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border border-white/20 text-white flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>DISPLAYING SCENE {displayedScene}</span>
          </div>
        </div>

        {/* Viewport Playback & Scrubber Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Play / Trigger Button */}
          <button
            type="button"
            onClick={() => triggerTransition()}
            className="w-full sm:w-auto px-5 py-2.5 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all shrink-0"
          >
            <GuiIconRenderer icon={GUI_ICONS.state.play} size={14} />
            <span>Trigger {selectedDef.name}</span>
          </button>

          {/* Manual Timeline Scrubber Slider */}
          <div className="flex-1 w-full flex items-center gap-3 bg-[var(--card-bg)] px-3 py-2 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] font-mono text-[var(--muted)] font-bold uppercase shrink-0">
              Scrub Frame:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isScrubbing ? scrubProgress : 0}
              onMouseDown={() => setIsScrubbing(true)}
              onTouchStart={() => setIsScrubbing(true)}
              onChange={(e) => {
                setIsScrubbing(true);
                setScrubProgress(parseFloat(e.target.value));
              }}
              className="flex-1 accent-[var(--accent)] cursor-ew-resize h-1.5 bg-[var(--well-bg)] rounded-lg"
            />
            <span className="text-[10px] font-mono text-[var(--accent)] font-bold shrink-0 min-w-[3rem] text-right">
              {isScrubbing ? `${Math.round(scrubProgress * 100)}%` : 'LIVE'}
            </span>
            {isScrubbing && (
              <button
                type="button"
                onClick={() => setIsScrubbing(false)}
                className="text-[10px] text-red-400 hover:underline cursor-pointer shrink-0 font-mono"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
          Filter:
        </span>
        {[
          { id: 'all', label: 'All Transitions' },
          { id: 'fade', label: 'Fades & Dissolves' },
          { id: 'wipe', label: 'Wipes & Slides' },
          { id: 'glitch', label: 'Cyber & Glitch' },
          { id: 'artistic', label: 'Artistic & Iris' },
          { id: 'retro', label: 'Retro Pixel' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 rounded-xl font-medium text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
              activeCategory === cat.id
                ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] font-bold shadow-sm'
                : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. TRANSITION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTransitions.map((t) => {
          const isSelected = selectedTransitionId === t.id;
          return (
            <div
              key={t.id}
              onClick={() => triggerTransition(t.id)}
              className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer shadow-sm group ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-surface)] ring-1 ring-[var(--accent)]/50'
                  : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border2)] hover:bg-[var(--card-bg)]/90'
              }`}
            >
              <div className="space-y-2">
                {/* Header: Icon, Name & Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border shadow-sm ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                          : 'bg-[var(--well-bg)] text-[var(--accent)] border-[var(--border)] group-hover:scale-105 transition-transform'
                      }`}
                    >
                      <GuiIconRenderer icon={t.icon} size={14} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text)]">{t.name}</h4>
                      <span className="text-[10px] text-[var(--muted2)] font-mono">
                        Key: <code className="text-[var(--accent)] font-semibold">{t.id}</code>
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)]">
                    {t.tag || t.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  {t.description}
                </p>
              </div>

              {/* Footer: Duration badge & Select button */}
              <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-[var(--muted2)] flex items-center gap-1">
                  <GuiIconRenderer icon={GUI_ICONS.state.play} size={10} />
                  <span>{t.defaultDurationSec}s Default</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerTransition(t.id);
                    }}
                    className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg text-[10px] font-bold text-[var(--text)] transition-colors flex items-center gap-1"
                    title="Test this transition in the upper arena"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.state.play} size={10} className="text-[var(--accent)]" />
                    <span>Test</span>
                  </button>

                  {onSelectAsset && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                      className="px-3 py-1 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] text-[#0F0503] font-black rounded-lg text-[10px] uppercase tracking-wider cursor-pointer shadow hover:opacity-90 transition-all flex items-center gap-1"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.check} size={11} />
                      <span>Select</span>
                    </button>
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
