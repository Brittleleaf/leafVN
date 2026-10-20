import {
  VNCinematicConfig,
  VNCinematicTrack,
  VNCinematicClip,
  VNCinematicSection,
} from '@/types/vn';

/**
 * Procedural audio waveform generator: generates visual audio amplitude peaks
 * so sound clips show real waveform bars for surgical precision editing.
 */
export function generateWaveformPeaks(seedStr: string = '', count: number = 60): number[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const peaks: number[] = [];
  let currentVal = 0.5;

  for (let i = 0; i < count; i++) {
    const x = Math.sin((i + Math.abs(hash % 100)) * 0.45);
    const noise = Math.cos((i * 1.8 + Math.abs(hash % 50)) * 0.7);
    currentVal = Math.max(0.15, Math.min(1.0, 0.35 + 0.35 * Math.abs(x) + 0.3 * Math.abs(noise)));
    peaks.push(Number(currentVal.toFixed(2)));
  }

  return peaks;
}

/**
 * Normalizes any cinematic config into the 3 clean sections:
 * - Media (Visual layers / dialogues / text / overlays / stickers)
 * - Audio (BGM / SFX / voice tracks)
 * - Background (Base scenery / scenario backgrounds)
 */
export function normalizeCinematicTracks(
  config?: VNCinematicConfig,
  defaultBgUrl?: string
): VNCinematicTrack[] {
  if (config?.tracks && Array.isArray(config.tracks) && config.tracks.length > 0) {
    // Ensure all tracks have a valid section property (migrate 'dialog' to 'media')
    return config.tracks.map((t, idx) => ({
      ...t,
      section: (t.section === 'dialog' ? 'media' : t.section || (t.kind === 'audio' ? 'audio' : 'media')) as VNCinematicSection,
      index: t.index || idx + 1,
    }));
  }

  const duration = config?.durationSeconds || 12;

  // 1. Convert legacy background tracks into Background section
  const backgroundClips: VNCinematicClip[] = (config?.backgroundTracks || []).map((bg, idx) => ({
    id: bg.id || `clip-bg-${idx}-${Date.now()}`,
    trackId: 'track-bg-1',
    name: `Fondo ${idx + 1}`,
    startSec: bg.startSec ?? 0,
    endSec: bg.endSec ?? duration,
    mediaUrl: bg.url || defaultBgUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
    mediaType: 'image',
    xPercent: 50,
    yPercent: 50,
    scale: 1,
    opacity: 1,
    transition: bg.transition || 'fade',
  }));

  if (backgroundClips.length === 0) {
    backgroundClips.push({
      id: `clip-bg-default-${Date.now()}`,
      trackId: 'track-bg-1',
      name: 'Scene Background',
      startSec: 0,
      endSec: duration,
      mediaUrl: defaultBgUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
      mediaType: 'image',
      xPercent: 50,
      yPercent: 50,
      scale: 1,
      opacity: 1,
    });
  }

  // 2. Convert legacy text tracks into Media section
  const dialogClips: VNCinematicClip[] = (config?.textTracks || []).map((txt, idx) => ({
    id: txt.id || `clip-txt-${idx}-${Date.now()}`,
    trackId: 'track-media-2',
    name: txt.speaker ? `[${txt.speaker}]` : `Diálogo ${idx + 1}`,
    startSec: txt.startSec ?? 0,
    endSec: txt.endSec ?? Math.min(duration, 4),
    text: txt.text || '',
    speaker: txt.speaker || '',
    dialogueStyle: txt.speaker ? 'classic_vn' : 'subtitle',
    fontSize: txt.fontSize || 'xl',
    textColor: txt.textColor || '#ffffff',
    fontFamily: txt.fontFamily,
    textEffect: txt.textEffect,
    textPosition: txt.position || 'bottom',
    xPercent: txt.xPercent ?? 50,
    yPercent: txt.yPercent ?? (txt.position === 'top' ? 20 : txt.position === 'center' ? 50 : 82),
    scale: txt.scale ?? 1,
  }));

  // 3. Convert legacy audio tracks into Audio section with waveforms
  const audioClips: VNCinematicClip[] = (config?.audioTracks || []).map((aud, idx) => ({
    id: aud.id || `clip-aud-${idx}-${Date.now()}`,
    trackId: 'track-audio-1',
    name: aud.name || aud.url?.split('/').pop() || `Audio ${idx + 1}`,
    startSec: aud.startSec ?? 0,
    endSec: aud.endSec ?? Math.min(duration, 4),
    audioUrl: aud.url || '',
    volume: aud.volume ?? 0.8,
    loop: aud.loop ?? false,
    waveform: generateWaveformPeaks(aud.name || aud.url),
  }));

  return [
    // Media Section (Visual Overlays, Sprites, Dialogue Box): Top tracks render in front of bottom tracks
    {
      id: 'track-media-2',
      section: 'media',
      index: 2,
      name: 'Media 2',
      kind: 'visual',
      visible: true,
      clips: dialogClips,
    },
    {
      id: 'track-media-1',
      section: 'media',
      index: 1,
      name: 'Media 1',
      kind: 'visual',
      visible: true,
      clips: [],
    },
    // Audio Section
    {
      id: 'track-audio-1',
      section: 'audio',
      index: 1,
      name: 'Audio 1',
      kind: 'audio',
      muted: false,
      clips: audioClips,
    },
    // Background Section (Base Scenery)
    {
      id: 'track-bg-1',
      section: 'background',
      index: 1,
      name: 'Background 1',
      kind: 'visual',
      visible: true,
      clips: backgroundClips,
    },
  ];
}

/**
 * Trims start or end of a clip with strict collision prevention
 * ensuring no two clips overlap on the same track.
 */
export function trimClip(
  tracks: VNCinematicTrack[],
  clipId: string,
  edge: 'start' | 'end',
  newSec: number,
  maxDuration: number
): VNCinematicTrack[] {
  if (!Number.isFinite(newSec)) return tracks;
  const safeMaxDuration = Math.max(0.2, Number.isFinite(maxDuration) ? maxDuration : 10);

  return tracks.map((track) => {
    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) return track;

    // Find previous and next clip in time on the same track
    const otherClips = track.clips.filter((c) => c.id !== clipId).sort((a, b) => a.startSec - b.startSec);
    const prevClip = [...otherClips].reverse().find((c) => c.endSec <= clip.startSec + 0.05);
    const nextClip = otherClips.find((c) => c.startSec >= clip.endSec - 0.05);

    const minAllowedStart = prevClip ? prevClip.endSec : 0;
    const maxAllowedEnd = nextClip ? nextClip.startSec : safeMaxDuration;

    const updatedClips = track.clips.map((c) => {
      if (c.id !== clipId) return c;
      if (edge === 'start') {
        const clampedStart = Math.max(minAllowedStart, Math.min(newSec, c.endSec - 0.2));
        const delta = clampedStart - c.startSec;
        const newOffset = Math.max(0, (c.sourceOffsetSec || 0) + delta);
        return {
          ...c,
          startSec: Number(clampedStart.toFixed(2)),
          sourceOffsetSec: Number(newOffset.toFixed(2)),
        };
      } else {
        const clampedEnd = Math.max(c.startSec + 0.2, Math.min(newSec, maxAllowedEnd));
        return { ...c, endSec: Number(clampedEnd.toFixed(2)) };
      }
    });

    return {
      ...track,
      clips: updatedClips,
    };
  });
}

/**
 * Calculates a collision-free startSec for a clip on a given track.
 * Respects strict boundaries so clips never overlap on the same track.
 */
export function calculateValidClipStart(
  track: VNCinematicTrack,
  clipId: string,
  duration: number,
  desiredStartSec: number,
  initialStartSec: number,
  totalDuration: number
): number {
  const safeDuration = Math.max(0.1, Number.isFinite(duration) ? duration : 0.1);
  const safeTotalDuration = Math.max(safeDuration, Number.isFinite(totalDuration) ? totalDuration : safeDuration);
  const safeDesired = Number.isFinite(desiredStartSec) ? desiredStartSec : 0;
  const maxAllowedStart = Math.max(0, safeTotalDuration - safeDuration);
  const clampedDesired = Math.max(0, Math.min(maxAllowedStart, safeDesired));
  const candidateEnd = clampedDesired + safeDuration;

  // 2. Other clips on this track
  const otherClips = track.clips
    .filter((c) => c.id !== clipId)
    .sort((a, b) => a.startSec - b.startSec);

  if (otherClips.length === 0) {
    return Number(clampedDesired.toFixed(2));
  }

  // 3. Find if there is any collision
  const collision = otherClips.find(
    (c) => clampedDesired < c.endSec && candidateEnd > c.startSec
  );

  if (!collision) {
    return Number(clampedDesired.toFixed(2));
  }

  // 4. In case of collision, clamp to the obstacle's boundary based on movement direction
  const movingForward = clampedDesired >= (Number.isFinite(initialStartSec) ? initialStartSec : 0);

  if (movingForward) {
    const allowed = collision.startSec - safeDuration;
    const prevClip = [...otherClips].reverse().find((c) => c.endSec <= collision.startSec);
    const minBound = prevClip ? prevClip.endSec : 0;
    const finalStart = Math.max(minBound, Math.min(allowed, maxAllowedStart));
    return Number(finalStart.toFixed(2));
  } else {
    const allowed = collision.endSec;
    const nextClip = otherClips.find((c) => c.startSec >= collision.endSec);
    const maxBound = (nextClip ? nextClip.startSec : safeTotalDuration) - safeDuration;
    const finalStart = Math.max(0, Math.min(Math.max(0, maxBound), allowed));
    return Number(finalStart.toFixed(2));
  }
}

/**
 * Moves a clip within a track or across tracks from a frozen snapshot of tracks.
 * Completely eliminates compounding delta errors and drift.
 */
export function applyClipMoveToTracks(
  initialTracks: VNCinematicTrack[],
  clipId: string,
  sourceTrackId: string,
  targetTrackId: string,
  newStartSec: number,
  duration: number
): VNCinematicTrack[] {
  const sourceTrack = initialTracks.find((t) => t.id === sourceTrackId);
  const clip = sourceTrack?.clips.find((c) => c.id === clipId);
  if (!clip) return initialTracks;

  const movedClip: VNCinematicClip = {
    ...clip,
    trackId: targetTrackId,
    startSec: Number(newStartSec.toFixed(2)),
    endSec: Number((newStartSec + duration).toFixed(2)),
  };

  return initialTracks.map((t) => {
    if (t.id === sourceTrackId && t.id === targetTrackId) {
      return {
        ...t,
        clips: t.clips
          .map((c) => (c.id === clipId ? movedClip : c))
          .sort((a, b) => a.startSec - b.startSec),
      };
    }
    if (t.id === sourceTrackId) {
      return {
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      };
    }
    if (t.id === targetTrackId) {
      return {
        ...t,
        clips: [...t.clips.filter((c) => c.id !== clipId), movedClip].sort(
          (a, b) => a.startSec - b.startSec
        ),
      };
    }
    return t;
  });
}

/**
 * Moves clip in time with strict boundary stops, preventing overlapping on the same track.
 */
export function moveClipInTime(
  tracks: VNCinematicTrack[],
  clipId: string,
  newStartSec: number,
  maxDuration: number
): VNCinematicTrack[] {
  return tracks.map((track) => {
    const clip = track.clips.find((c) => c.id === clipId);
    if (!clip) return track;

    const duration = clip.endSec - clip.startSec;
    const finalStart = calculateValidClipStart(
      track,
      clipId,
      duration,
      newStartSec,
      clip.startSec,
      maxDuration
    );

    const updatedClips = track.clips
      .map((c) => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          startSec: finalStart,
          endSec: Number((finalStart + duration).toFixed(2)),
        };
      })
      .sort((a, b) => a.startSec - b.startSec);

    return {
      ...track,
      clips: updatedClips,
    };
  });
}

/**
 * Splits a clip at playhead position into two contiguous clips.
 */
export function splitClipAtTime(
  tracks: VNCinematicTrack[],
  clipId: string,
  splitSec: number
): VNCinematicTrack[] {
  if (!Number.isFinite(splitSec)) return tracks;
  return tracks.map((track) => {
    const clipIndex = track.clips.findIndex((c) => c.id === clipId);
    if (clipIndex === -1) return track;

    const clip = track.clips[clipIndex];
    if (splitSec <= clip.startSec + 0.15 || splitSec >= clip.endSec - 0.15) {
      return track;
    }

    const firstHalf: VNCinematicClip = {
      ...clip,
      endSec: Number(splitSec.toFixed(2)),
    };

    const secondHalf: VNCinematicClip = {
      ...clip,
      id: `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      startSec: Number(splitSec.toFixed(2)),
      sourceOffsetSec: Number(((clip.sourceOffsetSec || 0) + (splitSec - clip.startSec)).toFixed(2)),
      name: clip.name ? `${clip.name} (Part 2)` : undefined,
    };

    const newClips = [...track.clips];
    newClips.splice(clipIndex, 1, firstHalf, secondHalf);

    return {
      ...track,
      clips: newClips,
    };
  });
}

/**
 * Moves a clip from one track to another (cross-track dragging).
 * Verifies that the destination track does NOT have collisions at the clip's time range.
 */
export function moveClipToTrack(
  tracks: VNCinematicTrack[],
  clipId: string,
  targetTrackId: string
): VNCinematicTrack[] {
  let movingClip: VNCinematicClip | null = null;
  const sourceTrack = tracks.find((t) => t.clips.some((c) => c.id === clipId));
  if (!sourceTrack || sourceTrack.id === targetTrackId) return tracks;

  const targetTrack = tracks.find((t) => t.id === targetTrackId);
  if (!targetTrack) return tracks;

  movingClip = sourceTrack.clips.find((c) => c.id === clipId) || null;
  if (!movingClip) return tracks;

  // Collision check on destination track:
  const hasCollision = targetTrack.clips.some(
    (c) => movingClip!.startSec < c.endSec && movingClip!.endSec > c.startSec
  );

  if (hasCollision) {
    // Cannot drop where another clip exists in that track!
    return tracks;
  }

  // 1. Remove from source
  const updatedTracks = tracks.map((t) => {
    if (t.id === sourceTrack.id) {
      return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
    }
    if (t.id === targetTrackId) {
      return {
        ...t,
        clips: [...t.clips, { ...movingClip!, trackId: targetTrackId }].sort((a, b) => a.startSec - b.startSec),
      };
    }
    return t;
  });

  return updatedTracks;
}

/**
 * Reorders tracks within a section to change visual layer priority.
 */
export function reorderTracksWithinSection(
  tracks: VNCinematicTrack[],
  section: VNCinematicSection,
  fromIndex: number,
  toIndex: number
): VNCinematicTrack[] {
  const sectionTracks = tracks.filter((t) => t.section === section);
  if (toIndex < 0 || toIndex >= sectionTracks.length || fromIndex === toIndex) return tracks;

  const reorderedSection = [...sectionTracks];
  const [removed] = reorderedSection.splice(fromIndex, 1);
  reorderedSection.splice(toIndex, 0, removed);

  // Re-index cleanly
  const indexed = reorderedSection.map((t, idx) => ({
    ...t,
    index: reorderedSection.length - idx, // higher index on top
    name: `${section.charAt(0).toUpperCase() + section.slice(1)} ${reorderedSection.length - idx}`,
  }));

  // Reconstruct full tracks array preserving non-section tracks
  const otherTracks = tracks.filter((t) => t.section !== section);
  return [...indexed, ...otherTracks];
}

/**
 * Finds an existing track in the specified section that does NOT overlap with [startSec, endSec],
 * or automatically creates a new track in that section (CapCut behavior).
 */
export function findOrCreateFreeTrack(
  tracks: VNCinematicTrack[],
  section: VNCinematicSection,
  startSec: number,
  endSec: number
): { tracks: VNCinematicTrack[]; targetTrackId: string } {
  const sectionTracks = tracks.filter((t) => t.section === section);

  // Look for a track without collision
  const freeTrack = sectionTracks.find((t) => {
    return !t.clips.some((c) => startSec < c.endSec && endSec > c.startSec);
  });

  if (freeTrack) {
    return { tracks, targetTrackId: freeTrack.id };
  }

  // If all tracks in this section are occupied at that time, create a new track!
  const nextIndex = sectionTracks.length + 1;
  const kindMap: Record<VNCinematicSection, any> = {
    media: 'visual',
    audio: 'audio',
    background: 'visual',
    dialog: 'visual',
  };
  const sectionNameMap: Record<VNCinematicSection, string> = {
    media: 'Media',
    audio: 'Audio',
    background: 'Fondo',
    dialog: 'Media',
  };

  const newTrack: VNCinematicTrack = {
    id: `track-${section}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    section: section === 'dialog' ? 'media' : section,
    index: nextIndex,
    name: `${sectionNameMap[section]} ${nextIndex}`,
    kind: kindMap[section],
    visible: true,
    clips: [],
  };

  const updatedTracks = section === 'media' ? [newTrack, ...tracks] : [...tracks, newTrack];
  return { tracks: updatedTracks, targetTrackId: newTrack.id };
}

/**
 * Visual Theme definitions according to user specification:
 * - Media (Visual & Dialogue & Text layers): #6A41CC
 * - Audio: #A1FE10
 * - Background (Base scenery): #E21345
 * - Track Lane & Header background: #04020B at 65% opacity
 * - Track text: White (#ffffff)
 */
export const SECTION_THEMES: Record<VNCinematicSection, {
  key: VNCinematicSection;
  label: string;
  icon: string;
  color: string;
  bg: string;
  text: string;
  trackBg: string;
  trackTextColor: string;
  borderColor: string;
  activeGlow: string;
  clipBg: string;
  clipBorder: string;
}> = {
  media: {
    key: 'media',
    label: 'MEDIA',
    icon: '/assets/image/GUI%20ICONS/clapperboard.svg',
    color: '#6A41CC',
    bg: '#6A41CC',
    text: '#ffffff',
    trackBg: 'rgba(4, 2, 11, 0.65)',
    trackTextColor: '#ffffff',
    borderColor: 'rgba(106, 65, 204, 0.35)',
    activeGlow: 'rgba(106, 65, 204, 0.4)',
    clipBg: 'rgba(106, 65, 204, 0.85)',
    clipBorder: '#6A41CC',
  },
  audio: {
    key: 'audio',
    label: 'AUDIO',
    icon: '/assets/image/GUI%20ICONS/Sound.svg',
    color: '#A1FE10',
    bg: '#A1FE10',
    text: '#04020B',
    trackBg: 'rgba(4, 2, 11, 0.65)',
    trackTextColor: '#ffffff',
    borderColor: 'rgba(161, 254, 16, 0.35)',
    activeGlow: 'rgba(161, 254, 16, 0.4)',
    clipBg: 'rgba(161, 254, 16, 0.25)',
    clipBorder: '#A1FE10',
  },
  background: {
    key: 'background',
    label: 'BACKGROUND',
    icon: '/assets/image/GUI%20ICONS/Background.svg',
    color: '#E21345',
    bg: '#E21345',
    text: '#ffffff',
    trackBg: 'rgba(4, 2, 11, 0.65)',
    trackTextColor: '#ffffff',
    borderColor: 'rgba(226, 19, 69, 0.35)',
    activeGlow: 'rgba(226, 19, 69, 0.4)',
    clipBg: 'rgba(226, 19, 69, 0.85)',
    clipBorder: '#E21345',
  },
  dialog: {
    key: 'dialog',
    label: 'MEDIA',
    icon: '/assets/image/GUI%20ICONS/clapperboard.svg',
    color: '#6A41CC',
    bg: '#6A41CC',
    text: '#ffffff',
    trackBg: 'rgba(4, 2, 11, 0.65)',
    trackTextColor: '#ffffff',
    borderColor: 'rgba(106, 65, 204, 0.35)',
    activeGlow: 'rgba(106, 65, 204, 0.4)',
    clipBg: 'rgba(106, 65, 204, 0.85)',
    clipBorder: '#6A41CC',
  },
};

/**
 * Duplicates a clip placing it directly after the original (or in free space)
 */
export function duplicateClip(
  tracks: VNCinematicTrack[],
  clipId: string,
  totalDuration: number
): { tracks: VNCinematicTrack[]; newClipId: string | null } {
  let originalClip: VNCinematicClip | null = null;
  let sourceTrack: VNCinematicTrack | null = null;

  for (const t of tracks) {
    const c = t.clips.find((item) => item.id === clipId);
    if (c) {
      originalClip = c;
      sourceTrack = t;
      break;
    }
  }

  if (!originalClip || !sourceTrack) return { tracks, newClipId: null };

  const duration = originalClip.endSec - originalClip.startSec;
  const desiredStart = Number(originalClip.endSec.toFixed(1));
  const desiredEnd = Math.min(totalDuration, Number((desiredStart + duration).toFixed(1)));

  // Try to find or create free track in this section
  const { tracks: updatedTracks, targetTrackId } = findOrCreateFreeTrack(
    tracks,
    sourceTrack.section,
    desiredStart,
    desiredEnd
  );

  const newClip: VNCinematicClip = {
    ...originalClip,
    id: `clip-dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    trackId: targetTrackId,
    name: `${originalClip.name || 'Clip'} (Copy)`,
    startSec: desiredStart,
    endSec: desiredEnd,
  };

  const finalTracks = updatedTracks.map((t) =>
    t.id === targetTrackId
      ? { ...t, clips: [...t.clips, newClip].sort((a, b) => a.startSec - b.startSec) }
      : t
  );

  return { tracks: finalTracks, newClipId: newClip.id };
}

/**
 * Ripple deletes a clip from tracks:
 * Removes the clip and shifts all subsequent clips on the SAME track left by the deleted duration
 * so that no empty gap is left behind.
 */
export function rippleDeleteClip(
  tracks: VNCinematicTrack[],
  clipId: string
): VNCinematicTrack[] {
  let targetTrackId: string | null = null;
  let deletedStart = 0;
  let deletedDuration = 0;

  for (const t of tracks) {
    const c = t.clips.find((item) => item.id === clipId);
    if (c) {
      targetTrackId = t.id;
      deletedStart = c.startSec;
      deletedDuration = Math.max(0.1, Number((c.endSec - c.startSec).toFixed(2)));
      break;
    }
  }

  if (!targetTrackId) return tracks;

  return tracks.map((track) => {
    if (track.id !== targetTrackId) return track;

    const remainingClips = track.clips
      .filter((c) => c.id !== clipId)
      .sort((a, b) => a.startSec - b.startSec);

    let prevEnd = 0;
    const shiftedClips = remainingClips.map((c) => {
      if (c.startSec >= deletedStart) {
        const duration = Math.max(0.1, Number((c.endSec - c.startSec).toFixed(2)));
        const candidateStart = Math.max(prevEnd, Number((c.startSec - deletedDuration).toFixed(2)));
        const newEnd = Number((candidateStart + duration).toFixed(2));
        prevEnd = newEnd;
        return {
          ...c,
          startSec: candidateStart,
          endSec: newEnd,
        };
      }
      prevEnd = Math.max(prevEnd, c.endSec);
      return c;
    });

    return {
      ...track,
      clips: shiftedClips.sort((a, b) => a.startSec - b.startSec),
    };
  });
}

/**
 * Inserts a new track into its respective section so that section grouping
 * and zIndex rendering remain perfectly stable and contiguous.
 */
export function insertTrackIntoSection(
  tracks: VNCinematicTrack[],
  newTrack: VNCinematicTrack,
  targetSection: VNCinematicSection
): VNCinematicTrack[] {
  const sectionIndices: number[] = [];
  tracks.forEach((t, i) => {
    if (t.section === targetSection) sectionIndices.push(i);
  });

  if (sectionIndices.length === 0) {
    const sectionOrder: VNCinematicSection[] = ['media', 'audio', 'background'];
    const targetOrderIndex = sectionOrder.indexOf(targetSection);
    let insertAt = tracks.length;
    for (let i = 0; i < tracks.length; i++) {
      const order = sectionOrder.indexOf(tracks[i].section);
      if (order > targetOrderIndex) {
        insertAt = i;
        break;
      }
    }
    const copy = [...tracks];
    copy.splice(insertAt, 0, newTrack);
    return copy;
  }

  // Insert right after the last track of this section
  const lastIndex = sectionIndices[sectionIndices.length - 1];
  const copy = [...tracks];
  copy.splice(lastIndex + 1, 0, newTrack);
  return copy;
}

