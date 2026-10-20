"use client";
import React from 'react';
import { VNCinematicClip } from '@/types/vn';
import { VNTextEffectRenderer } from '@/lib/vn/textEffects';
import { VNUniversalTransformGizmo } from '../../transform';

interface ActiveTextClipItem {
  clip: VNCinematicClip;
  zIndex?: number;
}

interface CinematicSubtitleLayerProps {
  activeTextClips: (ActiveTextClipItem | VNCinematicClip)[];
  isEditor: boolean;
  selectedClipId: string | null;
  currentTimeSec?: number;
  onSelectClip?: (id: string | null) => void;
  onUpdateClip?: (id: string, patch: Partial<VNCinematicClip>) => void;
  stageRef?: React.RefObject<HTMLDivElement | null>;
  onPointerDownClip?: (e: React.PointerEvent, clip: VNCinematicClip, mode: 'move' | 'scale') => void;
  onContextMenuClip?: (e: React.MouseEvent, clip: VNCinematicClip) => void;
}

export const CinematicSubtitleLayer: React.FC<CinematicSubtitleLayerProps> = ({
  activeTextClips,
  isEditor,
  selectedClipId,
  currentTimeSec,
  onSelectClip,
  onUpdateClip,
  stageRef,
  onPointerDownClip,
  onContextMenuClip,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {activeTextClips.map((item) => {
        const clip: VNCinematicClip = 'clip' in item ? item.clip : item;
        const zIndex = 'zIndex' in item ? item.zIndex : 35;
        const isSelected = isEditor && selectedClipId === clip.id;

        // Dynamic typing progress synchronized to clip duration (types out over 75% of the clip duration)
        const validStart = Number.isFinite(clip.startSec) ? clip.startSec : 0;
        const validEnd = Number.isFinite(clip.endSec) ? clip.endSec : validStart + 1;
        const elapsed = currentTimeSec !== undefined && Number.isFinite(currentTimeSec) ? Math.max(0, currentTimeSec - validStart) : 0;
        const totalSpan = Math.max(0.2, validEnd - validStart);
        const typewriterProgress = currentTimeSec !== undefined && Number.isFinite(currentTimeSec)
          ? Math.max(0, Math.min(1, elapsed / (totalSpan * 0.75)))
          : undefined;

        // Check if this is an authentic VN Dialogue (has speaker, avatar, or classic_vn style)
        const isClassicDialogue =
          clip.dialogueStyle === 'classic_vn' || Boolean(clip.speaker) || Boolean(clip.speakerAvatar);

        if (isClassicDialogue) {
          const speakerColor = clip.speakerColor || '#ef4444';

          return (
            <div key={clip.id} style={{ zIndex }} className="absolute inset-0 pointer-events-none">
              {/* 1. Character Portrait ("con la foto al fondo") */}
              {clip.speakerAvatar && (
                <div
                  className="absolute bottom-[92px] left-8 z-20 flex flex-col items-center pointer-events-auto select-none"
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
                  title={isEditor ? "Click to select this dialogue" : undefined}
                >
                  {/* Badge at top of avatar */}
                  <div
                    className="mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shadow-2xl flex items-center gap-1.5 border"
                    style={{
                      backgroundColor: 'rgba(8, 8, 12, 0.95)',
                      borderColor: speakerColor,
                      color: speakerColor,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: speakerColor }} />
                    <span>{clip.speaker || 'Character'}</span>
                    {clip.speakerBadge && <span>[{clip.speakerBadge}]</span>}
                  </div>

                  {/* Character Standing Photo */}
                  <img
                    src={clip.speakerAvatar}
                    alt={clip.speaker || 'Avatar'}
                    className="w-40 h-56 object-cover rounded-t-2xl border-2 shadow-[0_0_35px_rgba(0,0,0,0.9)]"
                    style={{ borderColor: speakerColor }}
                  />
                </div>
              )}

              {/* 2. Cyberpunk VN Textbox in the middle-bottom ("el diálogo en medio") */}
              <div
                className="absolute bottom-3.5 inset-x-6 z-30 pointer-events-auto select-none"
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
                <div
                  className={`relative w-full border-2 rounded-xl p-3.5 shadow-[0_0_40px_rgba(0,0,0,0.95)] backdrop-blur-md transition-all ${
                    isSelected ? 'ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.7)]' : ''
                  }`}
                  style={{
                    borderColor: speakerColor,
                    backgroundColor: 'rgba(8, 8, 12, 0.92)',
                  }}
                >
                  {/* 4 Cyber Corners in Speaker Color */}
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: speakerColor }} />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: speakerColor }} />
                  <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: speakerColor }} />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: speakerColor }} />

                  {/* Header: Nameplate & Badge */}
                  <div className="flex items-center justify-between mb-1.5 border-b pb-1" style={{ borderColor: `${speakerColor}40` }}>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold tracking-widest uppercase text-xs drop-shadow"
                        style={{ color: speakerColor }}
                      >
                        {clip.speaker || 'SYSTEM LOG'}
                      </span>
                      {clip.speakerBadge && (
                        <span
                          className="px-1.5 py-0.2 border text-[9px] uppercase tracking-widest rounded-full font-bold"
                          style={{
                            backgroundColor: `${speakerColor}20`,
                            borderColor: `${speakerColor}60`,
                            color: speakerColor,
                          }}
                        >
                          {clip.speakerBadge}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      DIALOGUE
                    </span>
                  </div>

                  {/* Dialogue Text in the middle */}
                  <div className="min-h-[36px] flex items-center">
                    <div
                      className={`leading-relaxed tracking-wide text-white font-medium whitespace-pre-wrap drop-shadow ${
                        clip.fontSize === '2xl'
                          ? 'text-base'
                          : clip.fontSize === 'xl'
                          ? 'text-sm'
                          : 'text-xs'
                      }`}
                      style={{ color: clip.textColor || '#ffffff' }}
                    >
                      <VNTextEffectRenderer
                        effectId={clip.textEffect}
                        text={clip.text || ''}
                        color={clip.textColor || '#ffffff'}
                        fontFamily={clip.fontFamily}
                        progress={typewriterProgress}
                      />
                    </div>
                  </div>

                  {/* Editor Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-6 left-4 bg-cyan-500 text-black px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shadow">
                      Selected Dialogue
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // Floating Subtitle / Title Text Card (Transformable & Scalable)
        const xPct = Number.isFinite(clip.xPercent) ? (clip.xPercent as number) : 50;
        const defaultY = clip.textPosition === 'top' ? 20 : clip.textPosition === 'center' ? 50 : 82;
        const yPct = Number.isFinite(clip.yPercent) ? (clip.yPercent as number) : defaultY;
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
            }}
            className={`pointer-events-auto select-none ${
              !isSelected && isEditor ? 'cursor-pointer hover:opacity-90' : ''
            }`}
          >
            <div className="relative px-4 py-2 select-none">
              <div
                style={{
                  clipPath: clip.crop
                    ? `inset(${clip.crop.top}% ${clip.crop.right}% ${clip.crop.bottom}% ${clip.crop.left}%)`
                    : undefined,
                }}
                className="min-w-[80px] min-h-[36px] flex items-center justify-center"
              >
                <div
                  className={`font-semibold tracking-wide drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] leading-relaxed whitespace-pre-wrap ${
                    clip.fontSize === '3xl'
                      ? 'text-3xl sm:text-4xl'
                      : clip.fontSize === '2xl'
                      ? 'text-2xl sm:text-3xl'
                      : clip.fontSize === 'xl'
                      ? 'text-xl sm:text-2xl'
                      : clip.fontSize === 'lg'
                      ? 'text-lg sm:text-xl'
                      : 'text-sm sm:text-base'
                  }`}
                  style={{ color: clip.textColor || '#ffffff' }}
                >
                  {clip.text && clip.text.trim().length > 0 ? (
                    <VNTextEffectRenderer
                      effectId={clip.textEffect}
                      text={clip.text}
                      color={clip.textColor || '#ffffff'}
                      fontFamily={clip.fontFamily}
                      progress={typewriterProgress}
                    />
                  ) : (
                    <span className="opacity-40 italic text-sm font-mono">[Double-click to type text...]</span>
                  )}
                </div>
              </div>

              {/* UNIVERSAL ON-CANVAS TRANSFORM GIZMO (FITS EXACT OUTER PERIMETER OF TEXT CARD) */}
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
                    isText: true,
                    text: clip.text,
                    textColor: clip.textColor,
                    fontSize: clip.fontSize,
                  }}
                  stageRef={stageRef || { current: null }}
                  onUpdate={(patch) => onUpdateClip && onUpdateClip(clip.id, patch)}
                  onCommitText={(newText) => onUpdateClip && onUpdateClip(clip.id, { text: newText })}
                  capabilities={{ allowCrop: false }}
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
