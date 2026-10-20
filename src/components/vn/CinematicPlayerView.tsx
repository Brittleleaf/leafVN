"use client";
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { VNScene, VNCinematicConfig, VNCinematicClip, VNCinematicTrack } from '@/types/vn';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import { normalizeCinematicTracks } from './cinematic/cinematicUtils';
import { useCinematicAudio } from './cinematic/hooks/useCinematicAudio';
import { CinematicVisualLayer } from './cinematic/layers/CinematicVisualLayer';
import { CinematicSubtitleLayer } from './cinematic/layers/CinematicSubtitleLayer';
import { CinematicScreenFxLayer } from './cinematic/layers/CinematicScreenFxLayer';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface CinematicPlayerViewProps {
  scene: VNScene;
  isInteractive?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  currentTimeSec?: number;
  isPlaying?: boolean;
  onSeek?: (sec: number) => void;
  onTogglePlay?: () => void;
  isEditor?: boolean;
  selectedClipId?: string | null;
  onSelectClip?: (id: string | null) => void;
  onUpdateClip?: (id: string, patch: Partial<VNCinematicClip>) => void;
  onContextMenuClip?: (e: React.MouseEvent, clip: VNCinematicClip) => void;
  isScrubbing?: boolean;
}

export const CINEMATIC_REF_WIDTH = 960;
export const CINEMATIC_REF_HEIGHT = 540;

export const DEFAULT_CINEMATIC_CONFIG: VNCinematicConfig = {
  durationSeconds: 12,
  autoAdvanceOnEnd: true,
  backgroundTracks: [
    {
      id: 'bg-1',
      url: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      startSec: 0,
      endSec: 12,
      transition: 'fade',
    },
  ],
  textTracks: [
    {
      id: 'txt-1',
      text: 'In the stillness before the breach...',
      startSec: 1.0,
      endSec: 4.5,
      position: 'center',
      fontSize: 'xl',
      textColor: '#ffffff',
    },
    {
      id: 'txt-2',
      text: 'Nobody predicted what would emerge from Sector 4.',
      startSec: 5.5,
      endSec: 10.5,
      position: 'bottom',
      fontSize: 'lg',
      textColor: '#d17bf8',
    },
  ],
  audioTracks: [
    {
      id: 'aud-1',
      name: 'Cinematic Intro',
      url: '/assets/sfx/start after click intro.mp3',
      startSec: 0.5,
      endSec: 4.0,
      volume: 0.8,
    },
    {
      id: 'aud-2',
      name: 'Ambient Hum',
      url: '/assets/sfx/bg-tvnoise.mp3',
      startSec: 0.0,
      endSec: 12.0,
      volume: 0.3,
      loop: true,
    },
  ],
  fxTracks: [
    {
      id: 'fx-1',
      fxType: 'vignette',
      startSec: 0,
      endSec: 12,
      intensity: 'medium',
    },
    {
      id: 'fx-2',
      fxType: 'red_alert',
      startSec: 7.0,
      endSec: 11.5,
      intensity: 'heavy',
    },
  ],
};

export default function CinematicPlayerView({
  scene,
  isInteractive = true,
  onComplete,
  onSkip,
  currentTimeSec: controlledTime,
  isPlaying: controlledPlaying,
  onSeek: controlledSeek,
  onTogglePlay: controlledTogglePlay,
  isEditor = false,
  selectedClipId = null,
  onSelectClip,
  onUpdateClip,
  onContextMenuClip,
  isScrubbing = false,
}: CinematicPlayerViewProps) {
  const config: VNCinematicConfig = scene.cinematicConfig || DEFAULT_CINEMATIC_CONFIG;
  const duration = Math.max(1, config.durationSeconds || 10);

  // Normalize tracks to modern dynamic multicapa architecture
  const tracks: VNCinematicTrack[] = useMemo(
    () => normalizeCinematicTracks(config, scene.backgroundUrl),
    [config, scene.backgroundUrl]
  );

  // Internal time state if not controlled externally (e.g. In VN Story Player mode)
  const [internalTimeSec, setInternalTimeSec] = useState<number>(0);
  const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(true);

  const isControlled = typeof controlledTime === 'number';
  const currentTimeSec = isControlled ? controlledTime : internalTimeSec;
  const isPlaying = typeof controlledPlaying === 'boolean' ? controlledPlaying : internalIsPlaying;

  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const completionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [viewportScale, setViewportScale] = useState<number>(1);

  // Virtual Reference Resolution Scaling Hook (Calculates exact scale factor to keep 960x540 proportional on all screens/zooms)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth || CINEMATIC_REF_WIDTH;
      const h = el.clientHeight || CINEMATIC_REF_HEIGHT;
      const scaleX = w / CINEMATIC_REF_WIDTH;
      const scaleY = h / CINEMATIC_REF_HEIGHT;
      setViewportScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clear selection when clicking empty stage background
  const handleStageBackgroundClick = (e: React.MouseEvent) => {
    if (!isEditor) return;
    if (e.target === stageRef.current && onSelectClip) {
      onSelectClip(null);
    }
  };

  // Hook 2: Multitrack Audio Engine with drift tracking, track muting, and scrub silencing
  const { clearAll } = useCinematicAudio({
    tracks,
    currentTimeSec,
    isPlaying,
    enabled: isInteractive || isEditor,
    isScrubbing,
  });

  // Autonomous playback loop when NOT externally controlled (VNPlayer mode)
  useEffect(() => {
    if (isControlled || !isPlaying) {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    let hasCompleted = false;

    const loop = (now: number) => {
      if (hasCompleted) return;
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      let isDone = false;
      setInternalTimeSec((prev) => {
        const next = prev + deltaSec;
        if (next >= duration) {
          isDone = true;
          return duration;
        }
        return next;
      });

      if (isDone) {
        hasCompleted = true;
        setInternalIsPlaying(false);
        clearAll();
        if (isInteractive && onComplete) {
          if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
          completionTimerRef.current = setTimeout(onComplete, 400);
        }
        return;
      }

      if (!hasCompleted) {
        timerRef.current = requestAnimationFrame(loop);
      }
    };

    timerRef.current = requestAnimationFrame(loop);

    return () => {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      if (completionTimerRef.current) {
        clearTimeout(completionTimerRef.current);
        completionTimerRef.current = null;
      }
      clearAll();
    };
  }, [isPlaying, duration, isInteractive, onComplete, isControlled, clearAll]);

  const handleSeek = (newSec: number) => {
    const safeSec = Number.isFinite(newSec) ? newSec : 0;
    const clamped = Math.max(0, Math.min(duration, safeSec));
    if (controlledSeek) {
      controlledSeek(clamped);
    } else {
      setInternalTimeSec(clamped);
    }
  };

  const handleTogglePlay = () => {
    if (controlledTogglePlay) {
      controlledTogglePlay();
    } else {
      if (internalTimeSec >= duration) {
        handleSeek(0);
        setInternalIsPlaying(true);
      } else {
        setInternalIsPlaying(!internalIsPlaying);
      }
    }
    playUiSound('click', 0.25);
  };

  const formatTime = (sec: number) => {
    const safeSec = Number.isFinite(sec) && sec >= 0 ? sec : 0;
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Collect active background clips (base layer: z-index 1..9)
  const bgTracks = tracks.filter((t) => t.section === 'background' && t.visible !== false);
  const activeBgClips: { clip: VNCinematicClip; zIndex: number; isBackground: boolean }[] = [];
  bgTracks.forEach((track, idx) => {
    track.clips.forEach((clip) => {
      if (currentTimeSec >= clip.startSec && currentTimeSec < clip.endSec && clip.mediaUrl) {
        activeBgClips.push({ clip, zIndex: 1 + idx, isBackground: true });
      }
    });
  });

  // 2. Collect active Media clips (overlays, sprites, dialogues, text, FX)
  const mediaTracks = tracks.filter(
    (t) => (t.section === 'media' || t.kind === 'visual' || t.section === 'dialog' || t.kind === 'text') &&
      t.section !== 'background' &&
      t.section !== 'audio' &&
      t.visible !== false
  );
  const activeMediaClips: { clip: VNCinematicClip; zIndex: number; isBackground: boolean }[] = [];
  const activeTextClips: { clip: VNCinematicClip; zIndex: number }[] = [];

  mediaTracks.forEach((track, tIdx) => {
    const trackZIndex = 10 + (mediaTracks.length - tIdx) * 5;
    track.clips.forEach((clip) => {
      if (currentTimeSec >= clip.startSec && currentTimeSec < clip.endSec) {
        if (clip.mediaUrl) {
          activeMediaClips.push({ clip, zIndex: trackZIndex, isBackground: false });
        }
        if (clip.text) {
          activeTextClips.push({ clip, zIndex: trackZIndex + 2 });
        }
      }
    });
  });

  // Combine background + media visual clips for CinematicVisualLayer
  const allActiveVisualClips = [...activeBgClips, ...activeMediaClips];

  // 3. Collect active Screen FX clips
  const activeFxClips = tracks
    .filter((t) => (t.kind === 'fx' || t.section === 'media') && t.visible !== false)
    .flatMap((t) =>
      t.clips.filter((c) => c.fxType && currentTimeSec >= c.startSec && currentTimeSec < c.endSec)
    );



  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden select-none bg-black flex items-center justify-center"
    >
      {/* Virtual Reference Resolution Stage (960x540 strictly proportional across all screens & browser zooms) */}
      <div
        ref={stageRef}
        onClick={handleStageBackgroundClick}
        style={{
          width: `${CINEMATIC_REF_WIDTH}px`,
          height: `${CINEMATIC_REF_HEIGHT}px`,
          transform: `scale(${viewportScale})`,
          transformOrigin: 'center center',
        }}
        className="relative flex flex-col justify-between overflow-hidden select-none bg-black shrink-0 shadow-2xl"
      >
        {/* 1. MULTI-LAYER VISUAL COMPOSITING (Background + Media Layers) */}
        <CinematicVisualLayer
          activeClips={allActiveVisualClips}
          isEditor={isEditor}
          selectedClipId={selectedClipId}
          currentTimeSec={currentTimeSec}
          isPlaying={isPlaying}
          onSelectClip={onSelectClip}
          onUpdateClip={onUpdateClip}
          stageRef={stageRef}
          onContextMenuClip={onContextMenuClip}
        />

        {/* 2. AUTHENTIC VN DIALOGUE & FLOATING SUBTITLE LAYER */}
        <CinematicSubtitleLayer
          activeTextClips={activeTextClips}
          isEditor={isEditor}
          selectedClipId={selectedClipId}
          currentTimeSec={currentTimeSec}
          onSelectClip={onSelectClip}
          onUpdateClip={onUpdateClip}
          stageRef={stageRef}
          onContextMenuClip={onContextMenuClip}
        />

        {/* 3. SCREEN FX OVERLAYS */}
        <CinematicScreenFxLayer activeFxClips={activeFxClips} />

        {/* 4. TOP CINEMATIC BAR & SKIP BUTTON */}
        <div className="relative z-40 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-[#2E1256]/80 border border-[#D17BF8]/50 text-[#F5F2FF] flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3.5 h-3.5" />
              <span>CINEMATIC {isEditor ? 'STUDIO' : 'EVENT'}</span>
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {formatTime(currentTimeSec)} / {formatTime(duration)}
            </span>
          </div>

          {isInteractive && !isEditor && onSkip && (
            <button
              onClick={() => {
                playUiSound('select', 0.35);
                clearAll();
                onSkip();
              }}
              className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-black/60 hover:bg-black/90 border border-white/20 hover:border-white/50 text-gray-300 hover:text-white backdrop-blur-md cursor-pointer transition-all shadow-md active:scale-95"
            >
              SALTAR CINEMÁTICA »
            </button>
          )}
        </div>

        {/* 5. BOTTOM SCRUBBER (Only in pure Player Mode) */}
        {!isEditor && (
          <div className="relative z-40 p-3.5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2E1256] hover:bg-[#6851DF] border border-[#D17BF8]/60 text-[#F5F2FF] text-xs font-bold transition-all shadow cursor-pointer shrink-0"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <GuiIconRenderer icon={GUI_ICONS.state.pause} className="w-3.5 h-3.5" />
              ) : (
                <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTimeSec}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#D17BF8]"
              />
            </div>

            <button
              onClick={() => handleSeek(0)}
              className="px-2.5 py-1 rounded text-[11px] font-mono bg-black/50 hover:bg-black/80 border border-white/20 text-gray-300 hover:text-white cursor-pointer"
              title="Replay from start"
            >
              ↺ REPLAY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
