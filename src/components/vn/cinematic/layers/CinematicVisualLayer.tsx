"use client";
import React, { useRef, useEffect } from 'react';
import { VNCinematicClip } from '@/types/vn';
import { VNUniversalTransformGizmo } from '../../transform';

export interface VisualClipWithIndex {
  clip: VNCinematicClip;
  zIndex: number;
  isBackground?: boolean;
}

interface CinematicVisualLayerProps {
  activeClips: VisualClipWithIndex[];
  isEditor: boolean;
  selectedClipId: string | null;
  currentTimeSec?: number;
  isPlaying?: boolean;
  onSelectClip?: (id: string | null) => void;
  onUpdateClip?: (id: string, patch: Partial<VNCinematicClip>) => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  onPointerDownClip?: (e: React.PointerEvent, clip: VNCinematicClip, mode: 'move' | 'scale') => void;
  onContextMenuClip?: (e: React.MouseEvent, clip: VNCinematicClip) => void;
}

/**
 * Checks whether the given media URL or clip type represents a video.
 */
export const isVideoMedia = (url?: string, mediaType?: string): boolean => {
  if (!url) return false;
  if (mediaType === 'video') return true;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.mov') ||
    lower.startsWith('data:video/') ||
    lower.includes('video/mp4') ||
    lower.includes('video/webm')
  );
};

/**
 * Calculates smooth temporal crossfade opacity blending based on clip transitions and playhead time.
 */
const calculateClipOpacity = (
  clip: VNCinematicClip,
  currentTimeSec?: number
): number => {
  const baseOpacity = Number.isFinite(clip.opacity) ? Math.max(0, Math.min(1, clip.opacity!)) : 1;
  if (currentTimeSec === undefined || !Number.isFinite(currentTimeSec)) return baseOpacity;

  const transition = clip.transition || 'fade';
  if (transition !== 'fade') {
    return baseOpacity;
  }

  const transDuration = Math.max(0.08, Number.isFinite(clip.transitionDuration) ? clip.transitionDuration! : 0.5);
  const startSec = Number.isFinite(clip.startSec) ? clip.startSec : 0;
  const endSec = Number.isFinite(clip.endSec) ? clip.endSec : startSec + 1;
  const elapsed = currentTimeSec - startSec;
  const remaining = endSec - currentTimeSec;

  let factor = 1;
  if (elapsed >= 0 && elapsed < transDuration) {
    factor = Math.min(factor, elapsed / transDuration);
  }
  if (remaining >= 0 && remaining < transDuration) {
    factor = Math.min(factor, remaining / transDuration);
  }

  return Math.max(0, Math.min(1, baseOpacity * factor));
};

/**
 * Synchronized Video Element that matches timeline time, looping, play/pause, and slip trim offset.
 */
const CinematicVideoItem: React.FC<{
  clip: VNCinematicClip;
  currentTimeSec?: number;
  isPlaying?: boolean;
  className?: string;
  isCover?: boolean;
}> = ({ clip, currentTimeSec = 0, isPlaying = false, className = '', isCover = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sourceOffset = Number.isFinite(clip.sourceOffsetSec) ? clip.sourceOffsetSec! : 0;
    const startSec = Number.isFinite(clip.startSec) ? clip.startSec : 0;
    const currentSec = Number.isFinite(currentTimeSec) ? currentTimeSec : 0;
    const elapsed = Math.max(0, currentSec - startSec);
    let targetTime = sourceOffset + elapsed;

    if (video.duration && Number.isFinite(video.duration) && video.duration > 0) {
      if (clip.loop || targetTime >= video.duration) {
        targetTime = targetTime % video.duration;
      }
    }

    if (Number.isFinite(targetTime) && Math.abs(video.currentTime - targetTime) > 0.25) {
      try {
        video.currentTime = targetTime;
      } catch {}
    }

    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [currentTimeSec, isPlaying, clip.startSec, clip.sourceOffsetSec, clip.loop]);

  return (
    <video
      ref={videoRef}
      src={clip.mediaUrl}
      playsInline
      muted
      loop={Boolean(clip.loop)}
      className={className}
      draggable={false}
      style={{
        objectFit: isCover ? 'cover' : 'contain',
      }}
    />
  );
};

export const CinematicVisualLayer: React.FC<CinematicVisualLayerProps> = ({
  activeClips,
  isEditor,
  selectedClipId,
  currentTimeSec,
  isPlaying,
  onSelectClip,
  onUpdateClip,
  stageRef,
  onPointerDownClip,
  onContextMenuClip,
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {activeClips.map(({ clip, zIndex, isBackground }) => {
        const isSelected = isEditor && selectedClipId === clip.id;
        const isCover =
          Boolean(isBackground) ||
          Boolean(clip.isCover) ||
          clip.fit === 'cover';

        const isVideo = isVideoMedia(clip.mediaUrl, clip.mediaType);
        const effectiveOpacity = calculateClipOpacity(clip, currentTimeSec);

        // CSS Transition helper for slide / zoom
        const transitionClass =
          clip.transition === 'slide'
            ? 'animate-in slide-in-from-bottom-6 duration-500'
            : clip.transition === 'zoom'
            ? 'animate-in zoom-in-95 duration-500'
            : '';

        if (isCover) {
          const bgScale = Number.isFinite(clip.scale) ? (clip.scale as number) : 1;
          const bgX = Number.isFinite(clip.xPercent) ? (clip.xPercent as number) : 50;
          const bgY = Number.isFinite(clip.yPercent) ? (clip.yPercent as number) : 50;
          const bgRot = Number.isFinite(clip.rotation) ? (clip.rotation as number) : 0;

          // Full background / cover layer with pan & zoom capabilities
          return (
            <div
              key={clip.id}
              style={{
                zIndex,
                opacity: effectiveOpacity,
                mixBlendMode: clip.blendMode || 'normal',
              }}
              className={`absolute inset-0 overflow-hidden pointer-events-auto cursor-pointer ${transitionClass}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditor && onSelectClip) onSelectClip(clip.id);
              }}
              onContextMenu={(e) => {
                if (isEditor && onContextMenuClip) {
                  e.preventDefault();
                  e.stopPropagation();
                  onContextMenuClip(e, clip);
                }
              }}
            >
              {/* Scalable & Pannable Background Graphic */}
              <div
                style={{
                  position: 'absolute',
                  left: `${bgX}%`,
                  top: `${bgY}%`,
                  width: '100%',
                  height: '100%',
                  transform: `translate(-50%, -50%) rotate(${bgRot}deg) scale(${bgScale})`,
                  transformOrigin: '50% 50%',
                }}
                className={isSelected ? 'pointer-events-auto' : 'pointer-events-none'}
              >
                {isVideo ? (
                  <CinematicVideoItem
                    clip={clip}
                    currentTimeSec={currentTimeSec}
                    isPlaying={isPlaying}
                    isCover={true}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    style={{
                      backgroundImage: clip.mediaUrl ? `url("${clip.mediaUrl.replace(/"/g, '\\"')}")` : 'none',
                    }}
                    className="w-full h-full bg-cover bg-center"
                  />
                )}

                {/* Universal Transform Gizmo for Background Panning & Zooming */}
                {isSelected && isEditor && (
                  <VNUniversalTransformGizmo
                    target={{
                      id: clip.id,
                      xPercent: bgX,
                      yPercent: bgY,
                      scale: bgScale,
                      scaleX: 1,
                      scaleY: 1,
                      rotation: bgRot,
                      locked: clip.locked ?? false,
                    }}
                    stageRef={stageRef || { current: null }}
                    onUpdate={(patch) => {
                      if (onUpdateClip) onUpdateClip(clip.id, patch);
                    }}
                    capabilities={{
                      allowCrop: false,
                      allow3D: false,
                      allowPivot: false,
                      allowFlip: true,
                      allowLock: true,
                      allowRotate: true,
                      allowNonUniformScale: false,
                    }}
                  />
                )}
              </div>

              <div className="absolute inset-0 bg-black/25 pointer-events-none" />

              {/* Background Status & Reset Badge */}
              {isSelected && (
                <div className="absolute top-3 left-3 z-50 pointer-events-auto flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-black/85 border border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold shadow-lg">
                    BACKGROUND ({Math.round(bgScale * 100)}% ZOOM | POS: {Math.round(bgX)}%, {Math.round(bgY)}%)
                  </span>
                  {(bgScale !== 1 || bgX !== 50 || bgY !== 50 || bgRot !== 0) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateClip) {
                          onUpdateClip(clip.id, { scale: 1, xPercent: 50, yPercent: 50, rotation: 0 });
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-950/90 border border-cyan-500 text-cyan-200 text-[9px] font-bold uppercase hover:bg-cyan-900 transition-colors shadow-lg cursor-pointer"
                      title="Reset background to 100% full screen fit"
                    >
                      ↺ Reset Fit
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }

        // Floating media / overlay sticker (Transformable)
        const xPct = Number.isFinite(clip.xPercent) ? (clip.xPercent as number) : 50;
        const yPct = Number.isFinite(clip.yPercent) ? (clip.yPercent as number) : 50;
        const scale = Number.isFinite(clip.scale) ? (clip.scale as number) : 1;
        const scaleX = Number.isFinite(clip.scaleX) ? (clip.scaleX as number) : 1;
        const scaleY = Number.isFinite(clip.scaleY) ? (clip.scaleY as number) : 1;
        const pivotX = Number.isFinite(clip.pivotX) ? (clip.pivotX as number) : 50;
        const pivotY = Number.isFinite(clip.pivotY) ? (clip.pivotY as number) : 50;
        const rotation = Number.isFinite(clip.rotation) ? (clip.rotation as number) : 0;
        const rotateX = Number.isFinite(clip.rotateX) ? (clip.rotateX as number) : 0;
        const rotateY = Number.isFinite(clip.rotateY) ? (clip.rotateY as number) : 0;

        return (
          <div
            key={clip.id}
            id={`cinematic-clip-${clip.id}`}
            data-clip-id={clip.id}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditor && onSelectClip) onSelectClip(clip.id);
            }}
            onContextMenu={(e) => {
              if (isEditor && onContextMenuClip) {
                e.preventDefault();
                e.stopPropagation();
                onContextMenuClip(e, clip);
              }
            }}
            style={{
              position: 'absolute',
              left: `${xPct}%`,
              top: `${yPct}%`,
              transformOrigin: `${pivotX}% ${pivotY}%`,
              transform: `translate(-${pivotX}%, -${pivotY}%) rotate(${rotation}deg) ${
                clip.isPerspective3D ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : ''
              } scale(${scale * scaleX * (clip.flipX ? -1 : 1)}, ${scale * scaleY * (clip.flipY ? -1 : 1)})`,
              zIndex: isSelected ? 60 : zIndex,
              opacity: effectiveOpacity,
              mixBlendMode: clip.blendMode || 'normal',
            }}
            className={`pointer-events-auto select-none ${transitionClass} ${
              !isSelected && isEditor ? 'cursor-pointer hover:opacity-90' : ''
            }`}
          >
            <div className="relative w-fit h-fit select-none">
              <div
                style={{
                  clipPath: clip.crop
                    ? `inset(${clip.crop.top}% ${clip.crop.right}% ${clip.crop.bottom}% ${clip.crop.left}%)`
                    : undefined,
                }}
              >
                {isVideo ? (
                  <CinematicVideoItem
                    clip={clip}
                    currentTimeSec={currentTimeSec}
                    isPlaying={isPlaying}
                    className="max-w-[260px] md:max-w-[340px] max-h-[300px] object-contain pointer-events-none rounded"
                  />
                ) : (
                  <img
                    src={clip.mediaUrl}
                    alt={clip.name || 'Visual Media'}
                    className="max-w-[260px] md:max-w-[340px] max-h-[300px] object-contain pointer-events-none rounded"
                    draggable={false}
                  />
                )}
              </div>

              {/* UNIVERSAL ON-CANVAS TRANSFORM GIZMO (ONE SINGLE CONTAINER, FITTING EXACT OUTER PERIMETER) */}
              {isSelected && isEditor && (
                <VNUniversalTransformGizmo
                  target={{
                    id: clip.id,
                    xPercent: xPct,
                    yPercent: yPct,
                    scale,
                    scaleX,
                    scaleY,
                    rotation,
                    rotateX,
                    rotateY,
                    pivotX,
                    pivotY,
                    flipX: clip.flipX,
                    flipY: clip.flipY,
                    crop: clip.crop,
                    isPerspective3D: clip.isPerspective3D,
                    locked: clip.locked,
                  }}
                  stageRef={stageRef || { current: null }}
                  onUpdate={(patch) => onUpdateClip && onUpdateClip(clip.id, patch)}
                  isEditor={isEditor}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
