"use client";
import React from 'react';
import { playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface CinematicTitlesTabProps {
  onAddTextClip: (preset?: {
    text: string;
    style?: string;
    effect?: string;
    speaker?: string;
    avatarUrl?: string;
    speakerColor?: string;
    speakerBadge?: string;
  }) => void;
}

export const CinematicTitlesTab: React.FC<CinematicTitlesTabProps> = ({
  onAddTextClip,
}) => {
  const titleTemplates = [
    {
      title: 'Dramatic Chapter Title',
      desc: 'Slow cinematic dissolve for chapter headings',
      badge: 'Cinematic',
      preset: { text: 'ACT I: THE AWAKENING', style: 'dramatics' },
    },
    {
      title: 'Digital Cyber Glitch',
      desc: 'Distorted matrix interference style',
      badge: 'Glitch FX',
      preset: { text: 'BREACH IN SECTOR 4', effect: 'glitch' },
    },
    {
      title: 'Typewriter Note',
      desc: 'Character-by-character reveal for logs and files',
      badge: 'Typewriter',
      preset: { text: 'CLASSIFIED INTEL REPORT...', effect: 'typewriter' },
    },
    {
      title: 'Location & Time',
      desc: 'Formal cinematic location and timestamp marker',
      badge: 'Header',
      preset: { text: 'TOKYO - 23:42 HRS', style: 'dramatics' },
    },
    {
      title: 'Horror Dripping (Blood FX)',
      desc: 'Trembling horror style with dark crimson dripping',
      badge: 'Horror',
      preset: { text: 'THERE IS NO ESCAPE...', effect: 'blood' },
    },
    {
      title: 'Radiant Shimmer',
      desc: 'Glowing pulse wave for mystical discoveries',
      badge: 'Mystic',
      preset: { text: 'THE POWER OF THE RELIC', effect: 'shimmer' },
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Cinematic Title Presets
        </span>
        <span className="text-[9px] text-[#E21345] font-mono">Drag or add to Media</span>
      </div>

      <div className="space-y-2.5">
        {titleTemplates.map((tmpl, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => {
              const payload = {
                type: 'text',
                text: tmpl.preset.text,
                effect: tmpl.preset.effect,
                section: 'media',
              };
              e.dataTransfer.setData('application/json', JSON.stringify(payload));
            }}
            className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all flex flex-col justify-between group shadow-sm cursor-grab active:cursor-grabbing"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[var(--text)] group-hover:text-[var(--accent)]">
                  {tmpl.title}
                </span>
                <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--border)] uppercase font-bold">
                  {tmpl.badge}
                </span>
              </div>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                {tmpl.desc}
              </p>
              <div className="p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] font-mono text-[11px] text-center text-[var(--text)] truncate">
                {tmpl.preset.text}
              </div>
            </div>

            <div className="pt-2.5 mt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  onAddTextClip(tmpl.preset);
                  playUiSound('open', 0.35);
                }}
                className="w-full py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-2.5 h-2.5" />
                <span>Add to Media</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
