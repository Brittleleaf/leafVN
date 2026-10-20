"use client";
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseCinematicClockProps {
  totalDuration: number;
  initialTime?: number;
  onTimeUpdate?: (timeSec: number) => void;
  onEnded?: () => void;
}

export interface CinematicClock {
  currentTimeSec: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (newTimeSec: number) => void;
  stepForward: (deltaSec?: number) => void;
  stepBackward: (deltaSec?: number) => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
}

/**
 * High-precision playback clock using requestAnimationFrame and performance.now()
 * Eliminates JavaScript setInterval timer drift for frame-accurate NLE synchronization.
 */
export function useCinematicClock({
  totalDuration,
  initialTime = 0,
  onTimeUpdate,
  onEnded,
}: UseCinematicClockProps): CinematicClock {
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(initialTime);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // References for requestAnimationFrame tracking
  const lastTimestampRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(initialTime);
  const totalDurationRef = useRef<number>(totalDuration);
  const isPlayingRef = useRef<boolean>(false);

  totalDurationRef.current = totalDuration;
  currentTimeRef.current = currentTimeSec;
  isPlayingRef.current = isPlaying;

  const seek = useCallback(
    (newTimeSec: number) => {
      const safeTotalDur = Math.max(0.1, Number.isFinite(totalDurationRef.current) ? totalDurationRef.current : 10);
      const safeTime = Number.isFinite(newTimeSec) ? newTimeSec : 0;
      const clamped = Math.max(0, Math.min(safeTotalDur, Number(safeTime.toFixed(2))));
      currentTimeRef.current = clamped;
      setCurrentTimeSec(clamped);
      if (onTimeUpdate) onTimeUpdate(clamped);
    },
    [onTimeUpdate]
  );

  const pause = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    lastTimestampRef.current = null;
  }, []);

  const play = useCallback(() => {
    // If reached end, restart from beginning
    if (currentTimeRef.current >= totalDurationRef.current) {
      seek(0);
    }
    setIsPlaying(true);
    isPlayingRef.current = true;
    lastTimestampRef.current = null;
  }, [seek]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const stepForward = useCallback(
    (deltaSec: number = 0.1) => {
      seek(currentTimeRef.current + deltaSec);
    },
    [seek]
  );

  const stepBackward = useCallback(
    (deltaSec: number = 0.1) => {
      seek(currentTimeRef.current - deltaSec);
    },
    [seek]
  );

  const jumpToStart = useCallback(() => {
    seek(0);
  }, [seek]);

  const jumpToEnd = useCallback(() => {
    seek(totalDurationRef.current);
  }, [seek]);

  // Main 60fps Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = now;
      }

      const elapsedSec = Math.min(0.2, Math.max(0, (now - lastTimestampRef.current) / 1000));
      lastTimestampRef.current = now;

      const nextTime = currentTimeRef.current + elapsedSec;

      if (nextTime >= totalDurationRef.current) {
        currentTimeRef.current = totalDurationRef.current;
        setCurrentTimeSec(totalDurationRef.current);
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (onTimeUpdate) onTimeUpdate(totalDurationRef.current);
        if (onEnded) onEnded();
        return;
      }

      currentTimeRef.current = nextTime;
      setCurrentTimeSec(nextTime);
      if (onTimeUpdate) onTimeUpdate(nextTime);

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, onTimeUpdate, onEnded]);

  return {
    currentTimeSec,
    isPlaying,
    play,
    pause,
    togglePlay,
    seek,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
  };
}
