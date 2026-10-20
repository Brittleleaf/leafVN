import { useEffect, useRef } from 'react';
import { VNCinematicTrack, VNCinematicClip } from '@/types/vn';
import { stopAudioPreview } from '@/lib/audioSettings';

interface UseCinematicAudioProps {
  tracks: VNCinematicTrack[];
  currentTimeSec: number;
  isPlaying: boolean;
  enabled?: boolean;
  isScrubbing?: boolean;
}

interface ManagedAudioInstance {
  element: HTMLAudioElement;
  clipId: string;
  audioUrl: string;
  stopTimer: ReturnType<typeof setTimeout> | null;
  cleanup?: () => void;
}

// Global cache for detected audio durations so we don't wait for metadata on each frame
export const audioDurationCache = new Map<string, number>();

export function getAudioDuration(url?: string): number | null {
  if (!url) return null;
  return audioDurationCache.get(url) || null;
}

/**
 * Robust Multitrack Audio Synchronization Engine
 * Handles:
 * - Truncation at clip.endSec: Stops immediately when right trim boundary is reached.
 * - Auto-looping: If clip duration on timeline is stretched beyond the audio file's duration,
 *   it automatically loops seamlessly and wraps offset calculation (modulo file duration).
 * - Drift correction: Resynchronizes if audio drifts from playhead.
 * - Track muting, volume control, and scrub silencing.
 */
export function useCinematicAudio({
  tracks,
  currentTimeSec,
  isPlaying,
  enabled = true,
  isScrubbing = false,
}: UseCinematicAudioProps) {
  const audioInstancesRef = useRef<Map<string, ManagedAudioInstance>>(new Map());

  // Stop any active preview audition whenever timeline plays
  useEffect(() => {
    if (isPlaying) {
      stopAudioPreview();
    }
  }, [isPlaying]);

  // Synchronize audio state, looping, drift, volume envelope (fade in/out & de-click), and boundary stop
  const syncAudioInstance = (
    instance: ManagedAudioInstance,
    clip: VNCinematicClip,
    baseVolume: number,
    clipDuration: number,
    elapsedInClip: number,
    currentSec: number
  ) => {
    const audio = instance.element;

    // Retrieve file natural duration from element or global cache
    const detectedDuration =
      (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : audioDurationCache.get(clip.audioUrl || clip.sfx || '') || null;

    // Equal-power fade in/out curves and 25ms de-click micro-ramp
    const validCurrentSec = Number.isFinite(currentSec) ? currentSec : 0;
    const validEnd = Number.isFinite(clip.endSec) ? clip.endSec : validCurrentSec + 1;
    const remainingInClip = Math.max(0, validEnd - validCurrentSec);
    let envelope = 1;
    const declickWindow = 0.025; // 25ms de-click micro-ramp

    const fadeInDuration = Math.max(Number.isFinite(clip.fadeInSec) ? (clip.fadeInSec as number) : 0, declickWindow);
    if (fadeInDuration > 0 && elapsedInClip < fadeInDuration) {
      const ratio = Math.max(0, Math.min(1, elapsedInClip / fadeInDuration));
      envelope = Math.min(envelope, Math.sin((ratio * Math.PI) / 2));
    }

    const fadeOutDuration = Math.max(Number.isFinite(clip.fadeOutSec) ? (clip.fadeOutSec as number) : 0, declickWindow);
    if (fadeOutDuration > 0 && remainingInClip < fadeOutDuration) {
      const ratio = Math.max(0, Math.min(1, remainingInClip / fadeOutDuration));
      envelope = Math.min(envelope, Math.sin((ratio * Math.PI) / 2));
    }

    const effectiveVolume = Math.max(0, Math.min(1, baseVolume * envelope));

    // Auto-loop if clip duration on timeline is stretched beyond audio file's duration
    const isStretchedBeyond = detectedDuration ? (clipDuration > detectedDuration + 0.05) : false;
    const shouldLoop = Boolean(clip.loop) || isStretchedBeyond;

    if (audio.loop !== shouldLoop) {
      audio.loop = shouldLoop;
    }

    // Update volume
    if (Math.abs(audio.volume - effectiveVolume) > 0.01) {
      audio.volume = effectiveVolume;
    }

    // Effective playback offset inside the source media (slip trim)
    const sourceOffset = Number.isFinite(clip.sourceOffsetSec) ? (clip.sourceOffsetSec as number) : 0;
    const effectiveElapsed = sourceOffset + (Number.isFinite(elapsedInClip) ? elapsedInClip : 0);

    // If NOT looping, and playhead has moved past the file's natural end:
    // Audio has finished its full single run, so pause it and do not loop!
    if (!shouldLoop && detectedDuration && effectiveElapsed >= detectedDuration) {
      if (instance.stopTimer) clearTimeout(instance.stopTimer);
      audio.pause();
      return;
    }

    // Calculate target offset: In loop mode, wrap around with modulo: effectiveElapsed % detectedDuration
    let targetOffset = effectiveElapsed;
    if (shouldLoop && detectedDuration && detectedDuration > 0) {
      targetOffset = effectiveElapsed % detectedDuration;
    }

    // Drift correction: Resync if off by > 0.20s
    const currentAudioTime = audio.currentTime;
    const drift = Math.abs(currentAudioTime - targetOffset);
    if (Number.isFinite(targetOffset) && drift > 0.2) {
      try {
        audio.currentTime = targetOffset;
      } catch {
        // Audio might be buffering
      }
    }

    // Safety hard-stop timer: precisely pause when playhead reaches clip.endSec
    if (instance.stopTimer) {
      clearTimeout(instance.stopTimer);
      instance.stopTimer = null;
    }
    const msUntilEnd = Math.min(2147483647, Math.max(0, Math.round((validEnd - validCurrentSec) * 1000)));
    instance.stopTimer = setTimeout(() => {
      try {
        audio.pause();
      } catch {}
    }, msUntilEnd);

    // Play if paused, within bounds, and audible
    if (audio.paused && effectiveVolume > 0 && validCurrentSec < validEnd) {
      audio.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (!enabled || !isPlaying || isScrubbing) {
      // Pause all audio when not playing or when actively scrubbing ruler
      audioInstancesRef.current.forEach((instance) => {
        if (instance.stopTimer) clearTimeout(instance.stopTimer);
        instance.element.pause();
      });
      return;
    }

    // 1. Identify all active audio clips within current playhead range [clip.startSec, clip.endSec)
    const activeAudioClips: Array<{ clip: VNCinematicClip; isMuted: boolean }> = [];

    tracks.forEach((track) => {
      if (track.visible === false) return;
      const isMuted = Boolean(track.muted);

      track.clips.forEach((clip) => {
        const audioSrc = clip.audioUrl || clip.sfx;
        const startSec = Number.isFinite(clip.startSec) ? clip.startSec : 0;
        const endSec = Number.isFinite(clip.endSec) ? clip.endSec : startSec + 1;
        if (
          audioSrc &&
          currentTimeSec >= startSec &&
          currentTimeSec < endSec
        ) {
          activeAudioClips.push({ clip: { ...clip, startSec, endSec, audioUrl: audioSrc }, isMuted });
        }
      });
    });

    const activeClipIds = new Set(activeAudioClips.map((item) => item.clip.id));

    // 2. Stop and prune audio instances for clips that are no longer active
    audioInstancesRef.current.forEach((instance, clipId) => {
      if (!activeClipIds.has(clipId)) {
        instance.cleanup?.();
        audioInstancesRef.current.delete(clipId);
      }
    });

    // 3. Play or update audio instances for active clips
    activeAudioClips.forEach(({ clip, isMuted }) => {
      const baseVolume = isMuted ? 0 : Math.max(0, Math.min(1, Number.isFinite(clip.volume) ? (clip.volume as number) : 0.8));
      const clipDuration = Math.max(0.05, clip.endSec - clip.startSec);
      const elapsedInClip = Math.max(0, currentTimeSec - clip.startSec);

      // Verify we are strictly within bounds [startSec, endSec)
      if (currentTimeSec >= clip.endSec || elapsedInClip < 0) {
        const existing = audioInstancesRef.current.get(clip.id);
        if (existing) {
          if (existing.stopTimer) clearTimeout(existing.stopTimer);
          existing.element.pause();
        }
        return;
      }

      let instance = audioInstancesRef.current.get(clip.id);

      if (!instance || instance.audioUrl !== clip.audioUrl) {
        if (instance) {
          instance.cleanup?.();
        }

        try {
          const audioEl = new Audio(clip.audioUrl);
          audioEl.volume = baseVolume;

          const handleMetadata = () => {
            if (audioEl.duration && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
              audioDurationCache.set(clip.audioUrl!, audioEl.duration);
              syncAudioInstance(newInstance, clip, baseVolume, clipDuration, elapsedInClip, currentTimeSec);
            }
          };

          audioEl.addEventListener('loadedmetadata', handleMetadata);
          audioEl.addEventListener('durationchange', handleMetadata);

          const cleanup = () => {
            audioEl.removeEventListener('loadedmetadata', handleMetadata);
            audioEl.removeEventListener('durationchange', handleMetadata);
            if (newInstance.stopTimer) {
              clearTimeout(newInstance.stopTimer);
              newInstance.stopTimer = null;
            }
            try {
              audioEl.pause();
              audioEl.removeAttribute('src');
              audioEl.load();
            } catch {}
          };

          const newInstance: ManagedAudioInstance = {
            element: audioEl,
            clipId: clip.id,
            audioUrl: clip.audioUrl!,
            stopTimer: null,
            cleanup,
          };

          audioInstancesRef.current.set(clip.id, newInstance);
          instance = newInstance;

          syncAudioInstance(newInstance, clip, baseVolume, clipDuration, elapsedInClip, currentTimeSec);
        } catch {
          // Audio load error ignored gracefully
        }
      } else {
        syncAudioInstance(instance, clip, baseVolume, clipDuration, elapsedInClip, currentTimeSec);
      }
    });
  }, [currentTimeSec, isPlaying, tracks, enabled, isScrubbing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioInstancesRef.current.forEach((instance) => {
        instance.cleanup?.();
      });
      audioInstancesRef.current.clear();
    };
  }, []);

  const pauseAll = () => {
    audioInstancesRef.current.forEach((instance) => {
      if (instance.stopTimer) clearTimeout(instance.stopTimer);
      instance.element.pause();
    });
  };

  const clearAll = () => {
    audioInstancesRef.current.forEach((instance) => {
      instance.cleanup?.();
    });
    audioInstancesRef.current.clear();
  };

  return { pauseAll, clearAll };
}
