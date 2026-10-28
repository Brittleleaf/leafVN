"use client";
import React, { useState } from 'react';
import { VNAssetItem, VNAssetType } from '@/types/vn';
import { playAudioPreview, playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicAudioTabProps {
  audioAssets: VNAssetItem[];
  searchQuery: string;
  currentPreviewUrl: string | null;
  onAddAudioClip: (asset: { url: string; name?: string; isBgm?: boolean }) => void;
  onOpenAssetStudio?: (filterType?: VNAssetType) => void;
}

export const CinematicAudioTab: React.FC<CinematicAudioTabProps> = ({
  audioAssets,
  searchQuery,
  currentPreviewUrl,
  onAddAudioClip,
  onOpenAssetStudio,
}) => {
  const [audioCategory, setAudioCategory] = useState<'all' | 'bgm' | 'sfx' | 'voice'>('all');

  const filteredAudio = audioAssets.filter((item) => {
    if (audioCategory === 'bgm' && item.type !== 'bgm') return false;
    if (audioCategory === 'sfx' && item.type !== 'sfx') return false;
    if (audioCategory === 'voice' && item.type !== 'voice') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Audio Category Filter Pills */}
      <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Audio', count: audioAssets.length },
          { id: 'bgm', label: 'BGM (Music)', count: audioAssets.filter((a) => a.type === 'bgm').length },
          { id: 'sfx', label: 'SFX (Effects)', count: audioAssets.filter((a) => a.type === 'sfx').length },
          { id: 'voice', label: 'Voices', count: audioAssets.filter((a) => a.type === 'voice').length },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setAudioCategory(cat.id as any)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shrink-0 border ${
              audioCategory === cat.id
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)]'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {filteredAudio.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)] text-xs space-y-2">
          <GuiIconRenderer icon={GUI_ICONS.general.sound} className="w-8 h-8 mx-auto text-[var(--muted2)]" />
          <p>No audio files found in this category.</p>
          {onOpenAssetStudio && (
            <button
              type="button"
              onClick={() => onOpenAssetStudio('sfx')}
              className="px-3 py-1.5 rounded-md bg-[var(--accent)] hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow"
            >
              Upload New Audio
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAudio.map((aud) => {
            const isPlayingThis = currentPreviewUrl === aud.url;
            const isBgm = aud.type === 'bgm';

            return (
              <div
                key={aud.id}
                draggable
                onDragStart={(e) => {
                  const payload = {
                    type: 'audio',
                    url: aud.url,
                    name: aud.name,
                    isBgm,
                    section: 'audio',
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(payload));
                }}
                className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all flex flex-col gap-2 group cursor-grab active:cursor-grabbing shadow-sm"
              >
                {/* Header: Name, Type & Origin Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GuiIconRenderer
                      icon={isBgm ? GUI_ICONS.media.volume : GUI_ICONS.general.sound}
                      className="w-4 h-4 text-[var(--accent)] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[var(--text)] group-hover:text-[var(--accent)] truncate block">
                        {aud.name}
                      </span>
                      {aud.category && (
                        <span className="text-[10px] text-[var(--muted)] truncate block">
                          {aud.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--btn-bg)] text-[var(--muted)] border border-[var(--border)] font-bold">
                      {aud.origin === 'system' ? 'SYSTEM' : 'PROJECT'}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--border)] font-bold uppercase">
                      {aud.type}
                    </span>
                  </div>
                </div>

                {/* Preview Player & Add to Timeline Button */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => playAudioPreview(aud.url, 0.75)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      isPlayingThis
                        ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(209,123,248,0.35)] animate-pulse'
                        : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)]'
                    }`}
                    title={isPlayingThis ? 'Stop audition' : 'Audition sound'}
                  >
                    <GuiIconRenderer
                      icon={isPlayingThis ? GUI_ICONS.state.pause : GUI_ICONS.state.play}
                      className="w-3 h-3"
                    />
                    <span>{isPlayingThis ? 'Playing...' : 'Preview'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddAudioClip({ url: aud.url, name: aud.name, isBgm });
                      playUiSound('open', 0.35);
                    }}
                    className="px-3.5 py-1 rounded-md bg-[var(--accent)] hover:opacity-90 text-white font-extrabold text-[10px] flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95"
                    title="Add clip to audio track at playhead"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                    <span>Add to Audio</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
