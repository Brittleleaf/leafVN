"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { playSfx } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          onClose();
        }
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans"
      style={{
        backgroundColor: 'rgba(2, 1, 6, 0.82)',
        backdropFilter: 'blur(28px) saturate(130%)',
        WebkitBackdropFilter: 'blur(28px) saturate(130%)',
      }}
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          onClose();
        }}
      />

      {/* Photoshop-inspired About Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl my-auto vn-modal-card rounded-2xl border border-[var(--border2)] shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10 text-[var(--text)] flex flex-col overflow-hidden"
        style={{
          background: 'var(--modal-bg, linear-gradient(180deg, rgba(35, 14, 60, 0.98), rgba(1, 1, 3, 0.99)))',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {/* Close Button in top right */}
        <button
          onClick={() => {
            playSfx('/assets/sfx/click intro.mp3', false, 0.2);
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)] rounded-lg transition-colors cursor-pointer z-20"
          title="Close"
        >
          <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header Section: Logo + App Name + Version */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src="/assets/logo/LeafVN.png"
                alt="Leaf VN Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl select-none pointer-events-none"
              />
            </div>

            <div className="pt-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)] flex items-center gap-2">
                Leaf VN Studio
              </h1>
              <p className="text-xs font-mono text-[var(--accent)] font-semibold mt-0.5">
                Version 2.1.0
              </p>
              <p className="text-[11px] text-[var(--muted2)] mt-1">
                Autonomous Visual Novel Creation Engine
              </p>
            </div>
          </div>

          {/* Credits & Contributors (Photoshop style text block) */}
          <div className="rounded-xl bg-[var(--well-bg)] border border-[var(--border)] p-4 text-[11px] leading-relaxed text-[var(--muted)] max-h-48 overflow-y-auto space-y-3 font-sans select-text scrollbar-thin">
            <p>
              <span className="font-semibold text-[var(--text)]">Core Architecture & Design: </span>
              Brittleleaf, Deep Creative AI Team, Leaf VN Open Contributors, Justin.
            </p>
            <p>
              <span className="font-semibold text-[var(--text)]">Engine Systems: </span>
              React 19 Canvas Sequencer, Turbopack Pipeline, Universal Screen FX Shaders, Dynamic Audio Director, Branching Graph Logic, Firebase Cloud Sync & Google Drive Integration.
            </p>
            <p>
              <span className="font-semibold text-[var(--text)]">Special Thanks: </span>
              The Visual Novel community, Ren&apos;Py & TyranoBuilder pioneers, indie storytellers, digital artists, and open-source audio engineers who inspired the next generation of storytelling.
            </p>
          </div>

          {/* Asset / Cover Art Attribution */}
          <div className="text-[11px] text-[var(--muted2)] border-t border-[var(--border)] pt-4">
            <p>
              Default characters, themes, visual effects & splash artwork by <span className="text-[var(--text)] font-medium">Leaf VN Studio</span>.
            </p>
            <a
              href="https://github.com/Brittleleaf/leafVN"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 mt-1 text-[11px]"
            >
              <span>github.com/Brittleleaf/leafVN</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Footer Section: Legal Copyright + Leaf VN Brand Mark */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] text-[var(--muted2)]">
            <div>
              <p>© 2026 Leaf VN Studio. All rights reserved.</p>
              <p className="text-[10px] text-[var(--muted2)] opacity-80 mt-0.5">
                Released under MIT Open Source License.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto opacity-90">
              <img
                src="/assets/logo/LeafVN.png"
                alt="Leaf VN"
                className="w-5 h-5 object-contain"
              />
              <span className="font-bold tracking-wider text-xs text-[var(--text)] font-mono">
                LEAF VN
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
