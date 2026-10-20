"use client";
import React, { useMemo } from 'react';
import { VNScreenFxType } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { SCREEN_FX_REGISTRY, VNScreenFxOverlay } from './index';

export const DEFAULT_POPULAR_FX: VNScreenFxType[] = ['digital_glitch', 'red_alert', 'cinema_grain'];

export interface VNScreenFxPickerGridProps {
  /** The currently selected screen FX key, or undefined */
  activeFx?: VNScreenFxType;
  /** Simulation intensity for the live cards */
  intensity?: 'light' | 'medium' | 'heavy';
  /** Scenario or screen background URL to preview the FX over */
  previewBackgroundUrl?: string;
  /** Custom list of top popular FX to display (defaults to DEFAULT_POPULAR_FX) */
  popularFx?: VNScreenFxType[];
  /** Layout columns: 4 for wide inspectors, 2 for sidebar panels */
  columns?: 2 | 4;
  /** Color theme for active rings, badges and hover states */
  accentColor?: 'rose' | 'purple';
  /** Callback fired when a card is selected */
  onSelectFx: (fxKey: VNScreenFxType) => void;
  /** Callback fired when clicking the 4th "View More..." card to open full gallery */
  onOpenGallery: () => void;
}

/**
 * Centralized, reusable 3+1 Screen FX selector grid.
 * Displays the 3 top most relevant FX with real-time viewport simulation over
 * the current scene background, plus a 4th "View More..." gateway card.
 */
export const VNScreenFxPickerGrid: React.FC<VNScreenFxPickerGridProps> = ({
  activeFx,
  intensity = 'medium',
  previewBackgroundUrl,
  popularFx = DEFAULT_POPULAR_FX,
  columns = 4,
  accentColor = 'purple',
  onSelectFx,
  onOpenGallery,
}) => {
  const effectiveBg = previewBackgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';

  const displayFxKeys: VNScreenFxType[] = useMemo(() => {
    if (!activeFx || popularFx.includes(activeFx)) {
      return popularFx.slice(0, 3);
    }
    const remaining = popularFx.filter((k) => k !== activeFx);
    return [activeFx, ...remaining.slice(0, 2)];
  }, [activeFx, popularFx]);

  // Accent styling mappings
  const themeStyles = {
    rose: {
      selectedBorder: 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.35)] ring-2 ring-rose-500',
      hoverBorder: 'hover:border-rose-400/60',
      activeBadge: 'bg-rose-950/90 border border-rose-400 text-rose-200',
      activeText: 'text-rose-600 dark:text-rose-300',
      activeIcon: 'text-rose-500',
      viewMoreHover: 'hover:border-rose-400 hover:bg-rose-500/5',
      viewMoreBg: 'from-rose-950/30 via-black to-purple-950/30',
      viewMoreIconBorder: 'group-hover:border-rose-400/60 group-hover:bg-rose-500/20',
      viewMoreIcon: 'text-rose-400',
      viewMoreText: 'text-rose-400 group-hover:text-rose-300',
    },
    purple: {
      selectedBorder: 'border-purple-500 bg-purple-500/15 shadow-[0_0_18px_rgba(168,85,247,0.35)] ring-2 ring-purple-500',
      hoverBorder: 'hover:border-purple-400/60',
      activeBadge: 'bg-purple-950/90 border border-purple-400 text-purple-200',
      activeText: 'text-purple-400',
      activeIcon: 'text-purple-400',
      viewMoreHover: 'hover:border-purple-400 hover:bg-purple-500/5',
      viewMoreBg: 'from-purple-950/30 via-black to-indigo-950/30',
      viewMoreIconBorder: 'group-hover:border-purple-400/60 group-hover:bg-purple-500/20',
      viewMoreIcon: 'text-purple-400',
      viewMoreText: 'text-purple-400 group-hover:text-purple-300',
    },
  }[accentColor];

  const gridColsClass = columns === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridColsClass} gap-2.5`}>
      {displayFxKeys.map((fxKey) => {
        const cfg = SCREEN_FX_REGISTRY[fxKey];
        if (!cfg) return null;
        const isSelected = activeFx === fxKey;

        return (
          <button
            key={fxKey}
            type="button"
            onClick={() => onSelectFx(fxKey)}
            className={`rounded-xl border overflow-hidden shadow transition-all flex flex-col text-left group cursor-pointer ${
              isSelected ? themeStyles.selectedBorder : `border-[var(--border)] bg-[var(--surface)] ${themeStyles.hoverBorder}`
            }`}
          >
            {/* 16:9 Live Preview Viewport over Effective Scene Background */}
            <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-[var(--border)]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${effectiveBg})` }}
              />
              {/* Live FX Overlay Animation */}
              <VNScreenFxOverlay
                fxType={fxKey}
                intensity={intensity}
                fadeInSeconds={0.2}
                fadeOutSeconds={0.2}
              />

              {/* Top Badge */}
              <div className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-mono tracking-wider font-bold bg-black/75 backdrop-blur-md border border-white/20 text-white shadow">
                <GuiIconRenderer icon={cfg.icon} className="w-2.5 h-2.5" />
                <span className="uppercase truncate max-w-[95px]">{cfg.label}</span>
              </div>

              {/* Active Indicator */}
              {isSelected && (
                <div className={`absolute bottom-1.5 right-1.5 z-30 ${themeStyles.activeBadge} px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold flex items-center gap-1 shadow`}>
                  <GuiIconRenderer icon={GUI_ICONS.general.check} className={`w-2.5 h-2.5 ${themeStyles.activeIcon}`} />
                  <span>ACTIVE</span>
                </div>
              )}
            </div>

            {/* Card Details */}
            <div className="p-2 flex-1 flex flex-col justify-between text-xs">
              <div>
                <h4 className={`font-bold text-[11px] flex items-center gap-1 truncate ${
                  isSelected ? themeStyles.activeText : 'text-[var(--text)]'
                }`}>
                  <GuiIconRenderer
                    icon={cfg.icon}
                    className={`w-3 h-3 shrink-0 ${isSelected ? themeStyles.activeIcon : 'text-[var(--muted)]'}`}
                  />
                  <span className="truncate">{cfg.label}</span>
                </h4>
                <p className="text-[9px] text-[var(--muted2)] line-clamp-1 leading-normal mt-0.5">
                  {cfg.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}

      {/* 4th Card: View More Gateway to Gallery */}
      <button
        type="button"
        onClick={onOpenGallery}
        className={`rounded-xl border border-dashed border-[var(--border)] ${themeStyles.viewMoreHover} bg-[var(--surface)] overflow-hidden shadow transition-all flex flex-col text-left group cursor-pointer`}
      >
        <div className={`relative w-full aspect-video bg-gradient-to-br ${themeStyles.viewMoreBg} border-b border-[var(--border)] flex flex-col items-center justify-center gap-1 text-[var(--muted)] group-hover:text-white transition-colors`}>
          <div className={`w-7 h-7 rounded-full bg-white/5 border border-white/10 ${themeStyles.viewMoreIconBorder} flex items-center justify-center transition-all shadow`}>
            <GuiIconRenderer icon={GUI_ICONS.action.sparkles} className={`w-3.5 h-3.5 ${themeStyles.viewMoreIcon} group-hover:scale-110 transition-transform`} />
          </div>
          <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${themeStyles.viewMoreText}`}>
            Full Catalog
          </span>
        </div>

        <div className="p-2 flex-1 flex flex-col justify-between text-xs">
          <div>
            <h4 className={`font-bold text-[11px] text-[var(--text)] group-hover:${themeStyles.activeText} transition-colors flex items-center justify-between`}>
              <span>View More...</span>
              <span className={`text-[10px] ${themeStyles.viewMoreIcon} font-bold group-hover:translate-x-0.5 transition-transform`}>➔</span>
            </h4>
            <p className="text-[9px] text-[var(--muted2)] line-clamp-1 leading-normal mt-0.5">
              Explore all 13 atmosphere presets in gallery.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default VNScreenFxPickerGrid;
