"use client";
import React, { useEffect, useRef } from 'react';
import { VNCinematicClip, VNCinematicTrack } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

export interface ContextMenuState {
  x: number;
  y: number;
  clip: VNCinematicClip | null;
  trackId?: string;
}

interface CinematicContextMenuProps {
  menu: ContextMenuState | null;
  hasClipboard: boolean;
  canSplit: boolean;
  onClose: () => void;
  onCut: (clip: VNCinematicClip) => void;
  onCopy: (clip: VNCinematicClip) => void;
  onPaste: () => void;
  onDuplicate: (clip: VNCinematicClip) => void;
  onSplit: () => void;
  onDelete: (clip: VNCinematicClip) => void;
  onRippleDelete?: (clip: VNCinematicClip) => void;
  tracks?: VNCinematicTrack[];
  onRenameTrack?: (trackId: string) => void;
  onDeleteTrack?: (trackId: string) => void;
  onToggleTrackMute?: (trackId: string) => void;
  onToggleTrackVisibility?: (trackId: string) => void;
}

export const CinematicContextMenu: React.FC<CinematicContextMenuProps> = ({
  menu,
  hasClipboard,
  canSplit,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onSplit,
  onDelete,
  onRippleDelete,
  tracks,
  onRenameTrack,
  onDeleteTrack,
  onToggleTrackMute,
  onToggleTrackVisibility,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('pointerdown', handlePointerDownOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  // Clamping safely within window dimensions (prevent negative or offscreen positioning)
  const winW = typeof window !== 'undefined' ? window.innerWidth : 800;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 600;
  const x = Math.max(8, Math.min(menu.x, winW - 210));
  const y = Math.max(8, Math.min(menu.y, winH - 260));

  return (
    <div
      ref={menuRef}
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 min-w-[190px] rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] text-[var(--text)] text-xs shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {menu.clip && (
        <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--muted2)] border-b border-[var(--border)] truncate max-w-[200px]">
          {menu.clip.name || menu.clip.text || 'Clip'}
        </div>
      )}

      {menu.clip ? (
        <>
          <button
            onClick={() => {
              onCut(menu.clip!);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.cut} className="w-3.5 h-3.5" />
              <span>Cut</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--muted2)]">Ctrl+X</span>
          </button>

          <button
            onClick={() => {
              onCopy(menu.clip!);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
              <span>Copy</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--muted2)]">Ctrl+C</span>
          </button>

          <button
            onClick={() => {
              onDuplicate(menu.clip!);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--muted2)]">Ctrl+D</span>
          </button>

          {canSplit && (
            <button
              onClick={() => {
                onSplit();
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-white/10 hover:text-cyan-300 transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2">
                <GuiIconRenderer icon={GUI_ICONS.general.split} className="w-3.5 h-3.5" />
                <span>Split at Playhead</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--muted2)]">S</span>
            </button>
          )}

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onDelete(menu.clip!);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-red-950/60 hover:text-red-300 text-red-400 transition-colors cursor-pointer text-left font-semibold"
          >
            <span className="flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
              <span>Delete</span>
            </span>
            <span className="text-[10px] font-mono text-red-400">Del</span>
          </button>

          {onRippleDelete && (
            <button
              onClick={() => {
                onRippleDelete(menu.clip!);
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-amber-950/60 hover:text-amber-200 text-amber-300 transition-colors cursor-pointer text-left font-semibold"
            >
              <span className="flex items-center gap-2">
                <GuiIconRenderer icon={GUI_ICONS.action.nextButton} className="w-3.5 h-3.5 rotate-180" />
                <span>Ripple Delete (Close Gap)</span>
              </span>
              <span className="text-[10px] font-mono text-amber-400">Shift+Del</span>
            </button>
          )}
        </>
      ) : null}

      {/* TRACK CONTEXT ACTIONS (When right-clicking lane/header without clip) */}
      {!menu.clip && menu.trackId && tracks && (
        <>
          {(() => {
            const track = tracks.find((t) => t.id === menu.trackId);
            if (!track) return null;
            return (
              <>
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--muted2)] border-b border-[var(--border)] flex items-center justify-between">
                  <span className="truncate max-w-[130px] text-[var(--text)]">{track.name || 'Track'}</span>
                  <span className="uppercase text-[9px] text-cyan-400 font-bold px-1 rounded bg-cyan-950/40">
                    {track.section}
                  </span>
                </div>

                {onRenameTrack && (
                  <button
                    onClick={() => {
                      onRenameTrack(track.id);
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <GuiIconRenderer icon={GUI_ICONS.general.pencil} className="w-3.5 h-3.5" />
                      <span>Rename Track</span>
                    </span>
                  </button>
                )}

                {track.section === 'audio' && onToggleTrackMute && (
                  <button
                    onClick={() => {
                      onToggleTrackMute(track.id);
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <GuiIconRenderer
                        icon={track.muted ? GUI_ICONS.general.speaker : GUI_ICONS.general.speakerOff}
                        className="w-3.5 h-3.5"
                      />
                      <span>{track.muted ? 'Unmute Track' : 'Mute Track'}</span>
                    </span>
                  </button>
                )}

                {onToggleTrackVisibility && (
                  <button
                    onClick={() => {
                      onToggleTrackVisibility(track.id);
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <GuiIconRenderer
                        icon={track.visible !== false ? GUI_ICONS.general.viewHide : GUI_ICONS.general.viewShow}
                        className="w-3.5 h-3.5"
                      />
                      <span>{track.visible !== false ? 'Hide Track' : 'Show Track'}</span>
                    </span>
                  </button>
                )}

                {onDeleteTrack && (
                  <button
                    onClick={() => {
                      onDeleteTrack(track.id);
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-red-950/60 hover:text-red-300 text-red-400 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                      <span>Delete Track</span>
                    </span>
                  </button>
                )}
              </>
            );
          })()}
        </>
      )}

      {hasClipboard && (
        <button
          onClick={() => {
            onPaste();
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)] transition-colors cursor-pointer text-left"
        >
          <span className="flex items-center gap-2">
            <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
            <span>Paste at Playhead</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--muted2)]">Ctrl+V</span>
        </button>
      )}
    </div>
  );
};
