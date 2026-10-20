"use client";
import React, { useState } from 'react';
import { VNAssetType } from '@/types/vn';
import { playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { MediaCatalogItem } from './types';

interface CinematicMediaTabProps {
  mediaItems: MediaCatalogItem[];
  searchQuery: string;
  onAddMediaClip: (asset: {
    url: string;
    name?: string;
    type: 'image' | 'video';
    section?: 'media' | 'background';
  }) => void;
  onOpenAssetStudio?: (filterType?: VNAssetType) => void;
}

export const CinematicMediaTab: React.FC<CinematicMediaTabProps> = ({
  mediaItems,
  searchQuery,
  onAddMediaClip,
  onOpenAssetStudio,
}) => {
  const [mediaCategory, setMediaCategory] = useState<'all' | 'backgrounds' | 'characters' | 'scenarios' | 'icons'>('all');

  const filteredMedia = mediaItems.filter((item) => {
    if (mediaCategory === 'backgrounds' && item.tag !== 'Background') return false;
    if (mediaCategory === 'characters' && item.tag !== 'Character') return false;
    if (mediaCategory === 'scenarios' && item.tag !== 'Scenario') return false;
    if (mediaCategory === 'icons' && item.tag !== 'Icon') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 px-1 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All', count: mediaItems.length },
          { id: 'backgrounds', label: 'Backgrounds', count: mediaItems.filter((m) => m.tag === 'Background').length },
          { id: 'characters', label: 'Characters', count: mediaItems.filter((m) => m.tag === 'Character').length },
          { id: 'scenarios', label: 'Scenarios', count: mediaItems.filter((m) => m.tag === 'Scenario').length },
          { id: 'icons', label: 'Icons', count: mediaItems.filter((m) => m.tag === 'Icon').length },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setMediaCategory(cat.id as any)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer shrink-0 border ${
              mediaCategory === cat.id
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-sm'
                : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--text)]'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {filteredMedia.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)] text-xs space-y-2">
          <GuiIconRenderer icon={GUI_ICONS.general.image} className="w-8 h-8 mx-auto text-[var(--muted2)]" />
          <p>No visual media found in this category.</p>
          {onOpenAssetStudio && (
            <button
              type="button"
              onClick={() => onOpenAssetStudio('background')}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow"
            >
              Upload New Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                const payload = {
                  type: 'media',
                  url: item.url,
                  name: item.name,
                  mediaType: 'image',
                  section: item.tag === 'Background' || item.tag === 'Scenario' ? 'background' : 'media',
                };
                e.dataTransfer.setData('application/json', JSON.stringify(payload));
              }}
              className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-bg)] group shadow-md hover:border-[var(--accent)] transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing"
            >
              {/* Central Preview matching General Gallery card */}
              <div className="aspect-video w-full overflow-hidden bg-black/50 relative flex items-center justify-center">
                {item.tag === 'Icon' ? (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <GuiIconRenderer icon={item.url} className="w-10 h-10 object-contain text-white transition-transform group-hover:scale-110" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}

                {/* Origin Badge */}
                <span className="absolute top-1.5 left-1.5 text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-black/75 border border-white/20 text-gray-300 backdrop-blur-md">
                  {item.origin === 'system' ? 'SYSTEM' : item.tag === 'Scenario' ? 'SCENARIO' : 'PROJECT'}
                </span>

                {/* Tag Badge */}
                <span className="absolute top-1.5 right-1.5 text-[8px] font-mono px-2 py-0.5 rounded-full bg-black/75 border border-white/20 text-white backdrop-blur-md uppercase">
                  {item.tag}
                </span>
              </div>

              {/* Card Meta & Action buttons */}
              <div className="p-2 space-y-1.5 bg-[var(--well-bg)] border-t border-[var(--border)]">
                <div className="font-bold text-[11px] truncate text-[var(--text)]" title={item.name}>
                  {item.name}
                </div>
                {item.category && (
                  <div className="text-[9px] text-[var(--muted)] truncate">
                    {item.category}
                  </div>
                )}

                <div className="flex gap-1.5 pt-1">
                  {item.tag === 'Background' || item.tag === 'Scenario' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onAddMediaClip({ url: item.url, name: item.name, type: 'image', section: 'background' });
                          playUiSound('open', 0.35);
                        }}
                        className="flex-1 py-1 rounded-lg bg-[#E21345] hover:bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow active:scale-95"
                        title="Add as backdrop to Background track"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.background} className="w-2.5 h-2.5" />
                        <span>+ BG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddMediaClip({ url: item.url, name: item.name, type: 'image', section: 'media' });
                          playUiSound('open', 0.35);
                        }}
                        className="flex-1 py-1 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow active:scale-95"
                        title="Add as overlay clip to Media track"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                        <span>+ Layer</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onAddMediaClip({ url: item.url, name: item.name, type: 'image', section: 'media' });
                        playUiSound('open', 0.35);
                      }}
                      className="w-full py-1 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow active:scale-95"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                      <span>+ Add to Media</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
