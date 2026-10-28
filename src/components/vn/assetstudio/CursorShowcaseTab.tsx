"use client";
import React, { useState, useRef } from 'react';
import { VNAssetItem } from '@/types/vn';
import { VN_CURSORS_CATALOG, VNCursorLayer } from '../cursors';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

interface CursorShowcaseTabProps {
  searchQuery: string;
  onSelectAsset?: (asset: VNAssetItem) => void;
  onClose: () => void;
}

export function CursorShowcaseTab({
  searchQuery,
  onSelectAsset,
  onClose,
}: CursorShowcaseTabProps) {
  const [auditionCursor, setAuditionCursor] = useState<string>('palimpsest_dot');
  const [cursorCategoryFilter, setCursorCategoryFilter] = useState<string>('all');
  const cursorPlaygroundRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      {/* Interactive Cursor Playground / Audition Arena */}
      <div
        ref={cursorPlaygroundRef}
        className={`relative w-full p-6 rounded-lg bg-black/80 border border-cyan-500/30 overflow-hidden shadow-2xl backdrop-blur-md select-none transition-all ${
          auditionCursor !== 'default' ? 'cursor-none' : ''
        }`}
      >
        {/* Custom Cursor Overlay for the Playground */}
        <VNCursorLayer
          cursorType={auditionCursor as any}
          containerRef={cursorPlaygroundRef}
        />

        {/* Ambient glow in background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950/60 border border-cyan-400/40 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Live Cursor Audition Arena</span>
            </div>
            <h3 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <span>Active Pointer:</span>
              <span className="text-cyan-400">
                {VN_CURSORS_CATALOG.find((c) => c.id === auditionCursor)?.name || auditionCursor}
              </span>
            </h3>
            <p className="text-xs text-gray-400 max-w-md">
              Move your mouse across this testing arena to experience real-time pointer tracking, interactive hover states, and click reactions.
            </p>
          </div>

          {/* Interactive Test Targets in the Arena */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => playSfx('/assets/sfx/click intro.mp3', false, 0.3)}
              className="px-3.5 py-2 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Hover & Click Me
            </button>
            <button
              type="button"
              onClick={() => playSfx('/assets/sfx/click interface.mp3', false, 0.3)}
              className="px-3.5 py-2 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/60 text-purple-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              Secondary Button
            </button>
            <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono">Interactive Pip</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-[var(--well-bg)] border border-[var(--border)]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1">
            Theme / Genre:
          </span>
          {[
            { id: 'all', label: 'All Cursors' },
            { id: 'artistic', label: 'Artistic & Poetic' },
            { id: 'cyberpunk', label: 'Cyberpunk & Sci-Fi' },
            { id: 'fantasy', label: 'RPG & Fantasy' },
            { id: 'noir', label: 'Noir & Mystery' },
            { id: 'classic', label: 'Classic' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCursorCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer border ${
                cursorCategoryFilter === cat.id
                  ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] font-bold shadow-sm'
                  : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-[var(--muted)] font-mono">
          {VN_CURSORS_CATALOG.length} Cursors Available
        </div>
      </div>

      {/* Grid of Cursor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {VN_CURSORS_CATALOG
          .filter((cur) => cursorCategoryFilter === 'all' || cur.category === cursorCategoryFilter)
          .filter(
            (cur) =>
              !searchQuery.trim() ||
              cur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              cur.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((cur) => {
            const isAuditioning = auditionCursor === cur.id;
            return (
              <div
                key={cur.id}
                className={`group relative p-4 rounded-lg border transition-all duration-300 flex flex-col justify-between shadow-md ${
                  isAuditioning
                    ? 'bg-cyan-950/20 border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                    : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--accent)] hover:shadow-xl'
                }`}
              >
                {/* Top Bar: Icon, Name & Category */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-md bg-black/40 border border-white/10 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform">
                      {cur.renderPreview()}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-white/5 border border-white/10 text-gray-400">
                      {cur.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[var(--text)] mb-1 group-hover:text-cyan-300 transition-colors">
                    {cur.name}
                  </h4>
                  <p className="text-xs text-[var(--muted)] leading-relaxed mb-4 line-clamp-2">
                    {cur.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuditionCursor(cur.id);
                      playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      isAuditioning
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border-[var(--border)] text-gray-300 hover:text-white'
                    }`}
                  >
                    {isAuditioning ? (
                      <span className="flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5" />
                        <span>In Arena</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <GuiIconRenderer icon={GUI_ICONS.general.viewShow} className="w-3.5 h-3.5" />
                        <span>Audition in Arena</span>
                      </span>
                    )}
                  </button>

                  {onSelectAsset ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectAsset({
                          id: `cursor-${cur.id}`,
                          name: cur.name,
                          type: 'cursor',
                          origin: 'system',
                          url: cur.id,
                          description: cur.description,
                        });
                        onClose();
                        playSfx('/assets/sfx/success.mp3', false, 0.4);
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 text-black font-black rounded-md text-xs uppercase tracking-wider cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5" />
                      <span>Use This Cursor</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-[var(--muted2)] font-mono px-1">
                      <span>ID:</span>
                      <code className="text-cyan-400 font-bold">{cur.id}</code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
