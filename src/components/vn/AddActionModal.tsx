"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { VNStory, VNScene, VNEvent, VNScreenFxType } from '@/types/vn';
import { getAllScreenFx, SCREEN_FX_CONFIGS } from '@/components/vn/screenfx';
import { VN_CURSORS_CATALOG } from '@/components/vn/cursors';
import { getCharacterAvatar } from '@/lib/vn/engineUtils';
import { useVNMaker } from './VNMakerContext';
import { ScreenFxShowcaseTab } from './assetstudio/ScreenFxShowcaseTab';
import { CursorShowcaseTab } from './assetstudio/CursorShowcaseTab';
import { SYSTEM_ASSETS } from '@/lib/vn/systemAssets';
import { playAudioPreview, stopAudioPreview, subscribeAudioPreview, getCurrentlyPlayingPreviewUrl, playSfx } from '@/lib/audioSettings';

export type VNActionType =
  | 'dialogue'
  | 'choice'
  | 'shake'
  | 'fx_start'
  | 'conditional_branch'
  | 'mutate_variable'
  | 'bg_change'
  | 'bgm'
  | 'cursor_change'
  | 'jump_scene'
  | 'loading_screen';

interface AddActionModalProps {
  onInsertEvent: (type: VNActionType, payload?: Partial<VNEvent>) => void;
  onClose: () => void;
  story?: VNStory;
  currentScene?: VNScene;
}

interface ActionCardConfig {
  type: VNActionType;
  label: string;
  description: string;
  category: 'story' | 'fx' | 'logic' | 'media';
  icon: any;
  iconColor: string;
  badgeBg: string;
  hasPicker?: boolean;
}

const ACTION_CARDS: ActionCardConfig[] = [
  {
    type: 'dialogue',
    label: 'Dialogue Line',
    description: 'Select which character speaks or use text-only narrator voice.',
    category: 'story',
    icon: GUI_ICONS.general.conversation,
    iconColor: 'text-[var(--accent)]',
    badgeBg: 'bg-[var(--accent-surface)]',
    hasPicker: true,
  },
  {
    type: 'choice',
    label: 'Player Choice',
    description: 'Offers branches so the player can choose a narrative path.',
    category: 'story',
    icon: GUI_ICONS.general.question,
    iconColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/15',
  },
  {
    type: 'shake',
    label: 'Screen Shake (Instant)',
    description: 'One-shot camera tremor for sudden impact, hit, or explosion.',
    category: 'fx',
    icon: GUI_ICONS.general.transform,
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    hasPicker: true,
  },
  {
    type: 'fx_start',
    label: 'Screen Effect (Start / End)',
    description: 'Choose from 13 atmospheric loop FX (Red Alert, Glitch, CRT, Rain, etc.).',
    category: 'fx',
    icon: GUI_ICONS.general.hazard,
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    hasPicker: true,
  },
  {
    type: 'conditional_branch',
    label: 'Conditional Branch (If / Else)',
    description: 'Evaluates variables (inventory, affinity) and branches without asking player.',
    category: 'logic',
    icon: GUI_ICONS.action.select,
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
  },
  {
    type: 'mutate_variable',
    label: 'Mutate Variable',
    description: 'Adds points, activates keys/cards, or alters narrative story state.',
    category: 'logic',
    icon: GUI_ICONS.general.gear,
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15',
  },
  {
    type: 'bg_change',
    label: 'Change Background (BG)',
    description: 'Select a new scenario or background image during the scene.',
    category: 'media',
    icon: GUI_ICONS.general.scenario,
    iconColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/15',
    hasPicker: true,
  },
  {
    type: 'bgm',
    label: 'Background Music (BGM)',
    description: 'Select ambient loop track or background music.',
    category: 'media',
    icon: GUI_ICONS.general.soundOn,
    iconColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    hasPicker: true,
  },
  {
    type: 'cursor_change',
    label: 'Cursor Style',
    description: 'Choose custom in-game cursor (Cyber Reticle, Detective Lens, etc.).',
    category: 'fx',
    icon: GUI_ICONS.action.target,
    iconColor: 'text-pink-400',
    badgeBg: 'bg-pink-500/15',
    hasPicker: true,
  },
  {
    type: 'jump_scene',
    label: 'Jump Scenario',
    description: 'Select which scenario, cinematic, or static screen to transition to.',
    category: 'story',
    icon: GUI_ICONS.action.nextButton,
    iconColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/15',
    hasPicker: true,
  },
  {
    type: 'loading_screen',
    label: 'Loading Intermission',
    description: 'Displays a lore card, chapter title, or data loading intermission.',
    category: 'story',
    icon: GUI_ICONS.general.folder,
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
  },
];

export default function AddActionModal(props: AddActionModalProps) {
  let context: ReturnType<typeof useVNMaker> | null = null;
  try {
    context = useVNMaker();
  } catch {}

  const story = props.story || context?.story;
  const currentScene = props.currentScene || context?.currentScene;
  const { onInsertEvent, onClose } = props;

  // Navigation state: null = main grid, or active sub-step picker
  const [activeSubStep, setActiveSubStep] = useState<VNActionType | null>(null);

  // Search & filter for main grid
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'story' | 'fx' | 'logic' | 'media'>('all');

  // Search for sub-pickers
  const [subPickerSearch, setSubPickerSearch] = useState('');

  // Audio preview & volume states for BGM sub-picker
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(getCurrentlyPlayingPreviewUrl());
  const [bgmVolume, setBgmVolume] = useState<number>(0.5);

  // Background filter for bg_change sub-picker
  const [bgSourceFilter, setBgSourceFilter] = useState<'all' | 'scenarios' | 'assets'>('all');

  // Sync audio preview subscriber
  useEffect(() => {
    const unsub = subscribeAudioPreview(() => {
      setPlayingAudioUrl(getCurrentlyPlayingPreviewUrl());
    });
    return () => {
      unsub();
      stopAudioPreview();
    };
  }, []);

  // Handle ESC key hierarchically (first go back to main grid, then close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubStep !== null) {
          stopAudioPreview();
          setActiveSubStep(null);
          setSubPickerSearch('');
        } else {
          stopAudioPreview();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubStep, onClose]);

  // Main grid cards filter
  const filteredCards = useMemo(() => {
    return ACTION_CARDS.filter((card) => {
      if (activeCategory !== 'all' && card.category !== activeCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        card.label.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  // All scenarios across story
  const allScenarios = useMemo(() => {
    if (!story) return [];
    const scenesMap = new Map<string, VNScene & { chapterTitle?: string }>();
    (story.chapters || []).forEach((ch) => {
      (ch.scenes || []).forEach((s) => {
        scenesMap.set(s.id, { ...s, chapterTitle: ch.title });
      });
    });
    (story.scenarios || []).forEach((s) => {
      if (!scenesMap.has(s.id)) {
        scenesMap.set(s.id, { ...s, chapterTitle: 'Scenarios Library' });
      }
    });
    return Array.from(scenesMap.values());
  }, [story]);

  // Audio tracks combining system assets and story custom assets
  const availableBgmTracks = useMemo(() => {
    const systemBgm = SYSTEM_ASSETS.filter((a) => a.type === 'bgm');
    const customBgm = (story?.customAssets || []).filter((a) => a.type === 'bgm');
    const map = new Map<string, { id: string; name: string; url: string; description?: string; origin: string }>();
    systemBgm.forEach((a) => {
      map.set(a.url, { id: a.id, name: a.name, url: a.url, description: a.description, origin: 'system' });
    });
    customBgm.forEach((a) => {
      map.set(a.url, { id: a.id, name: a.name, url: a.url, description: a.description, origin: 'local' });
    });
    return Array.from(map.values());
  }, [story]);

  // Background library assets
  const availableBackgroundAssets = useMemo(() => {
    const systemBg = SYSTEM_ASSETS.filter((a) => a.type === 'background');
    const customBg = (story?.customAssets || []).filter((a) => a.type === 'background');
    const map = new Map<string, { id: string; name: string; url: string; description?: string; origin: 'system' | 'local' }>();
    systemBg.forEach((a) => {
      map.set(a.url, { id: a.id, name: a.name, url: a.url, description: a.description, origin: 'system' });
    });
    customBg.forEach((a) => {
      map.set(a.url, { id: a.id, name: a.name, url: a.url, description: a.description, origin: 'local' });
    });
    return Array.from(map.values());
  }, [story]);

  // Handle click on action card
  const handleCardClick = (card: ActionCardConfig) => {
    setSubPickerSearch('');
    if (card.hasPicker) {
      setActiveSubStep(card.type);
    } else {
      onInsertEvent(card.type);
    }
  };

  const modalMaxWidth =
    activeSubStep === 'fx_start' || activeSubStep === 'cursor_change'
      ? 'max-w-5xl'
      : activeSubStep === 'bgm' || activeSubStep === 'bg_change' || activeSubStep === 'jump_scene'
      ? 'max-w-4xl'
      : 'max-w-2xl';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopAudioPreview();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 vn-modal-backdrop p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans"
    >
      <div className={`w-full max-h-[88vh] sm:max-h-[85vh] vn-modal-card flex flex-col overflow-hidden text-[var(--text)] transition-all duration-200 ${modalMaxWidth}`}>
        
        {/* =========================================================
            HEADER: Adapts dynamically based on active sub-step
           ========================================================= */}
        <div className="p-4 sm:p-5 border-b vn-glass-header shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeSubStep !== null && (
              <button
                type="button"
                onClick={() => {
                  setActiveSubStep(null);
                  setSubPickerSearch('');
                }}
                className="w-8 h-8 rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Back to all actions"
              >
                ←
              </button>
            )}

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2 truncate">
                <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span className="truncate">
                  {activeSubStep === 'fx_start'
                    ? 'Select Screen Effect (Loop Range)'
                    : activeSubStep === 'dialogue'
                    ? 'Who is speaking? (Select Character)'
                    : activeSubStep === 'shake'
                    ? 'Screen Shake (Instant Tremor)'
                    : activeSubStep === 'cursor_change'
                    ? 'Choose In-Game Cursor'
                    : activeSubStep === 'jump_scene'
                    ? 'Select Destination Scenario'
                    : activeSubStep === 'bg_change'
                    ? 'Select New Background'
                    : activeSubStep === 'bgm'
                    ? 'Select Background Music (BGM)'
                    : 'What happens next in the story?'}
                </span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                {activeSubStep === 'fx_start'
                  ? 'Choose an atmospheric loop effect to wrap dialogues.'
                  : activeSubStep === 'dialogue'
                  ? 'Pick a character sprite or text-only narrator voice.'
                  : activeSubStep === 'shake'
                  ? 'Instant camera vibration for hits, gunshots, or impacts.'
                  : activeSubStep === 'cursor_change'
                  ? 'Select custom interactive in-game cursor.'
                  : activeSubStep === 'jump_scene'
                  ? 'Select which location to transition to.'
                  : activeSubStep === 'bg_change'
                  ? 'Switch background image mid-dialogue.'
                  : activeSubStep === 'bgm'
                  ? 'Choose ambient loop track or background music.'
                  : 'Select an event or action to insert into the scenario timeline.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer text-sm transition-colors shrink-0"
            title="Close modal (Esc)"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* =========================================================
            VIEW 1: MAIN ACTION CARDS GRID
           ========================================================= */}
        {activeSubStep === null && (
          <>
            {/* Quick Filter Bar */}
            <div className="px-4 py-2.5 sm:px-5 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[10px] font-bold uppercase tracking-wider">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'story', label: 'Story & Dialogue' },
                  { id: 'fx', label: 'Visual & FX' },
                  { id: 'logic', label: 'Logic & Vars' },
                  { id: 'media', label: 'Audio & Media' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-[var(--surface-strong)] text-[var(--accent)] font-semibold shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative shrink-0 sm:w-44">
                <input
                  type="text"
                  placeholder="Filter actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg pl-7 pr-2 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none transition-colors"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
                  <GuiIconRenderer icon={GUI_ICONS.action.search} className="w-3.5 h-3.5" />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer text-xs flex items-center justify-center"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Action Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              {filteredCards.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted)] text-xs space-y-2">
                  <p>No actions match your search query.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="text-[var(--accent)] hover:underline font-bold"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredCards.map((card) => (
                    <button
                      key={card.type}
                      onClick={() => handleCardClick(card)}
                      className="p-3 rounded-xl hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-all duration-150 group flex items-start gap-3.5"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg ${card.badgeBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5`}
                      >
                        <GuiIconRenderer icon={card.icon} className={`w-4 h-4 ${card.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-[var(--text)] uppercase group-hover:text-[var(--accent)] transition-colors truncate tracking-wide">
                            {card.label}
                          </span>
                          {card.hasPicker && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted2)] group-hover:text-[var(--accent)] shrink-0">
                              Options
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--text)] block leading-snug line-clamp-2 transition-colors">
                          {card.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* =========================================================
            SUB-VIEW A: SCREEN EFFECT PICKER (fx_start)
           ========================================================= */}
        {activeSubStep === 'fx_start' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search filter for effects */}
            <div className="px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Available Effects ({getAllScreenFx().length}):
              </span>
              <input
                type="text"
                placeholder="Search screen effects..."
                value={subPickerSearch}
                onChange={(e) => setSubPickerSearch(e.target.value)}
                className="w-56 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <ScreenFxShowcaseTab
                searchQuery={subPickerSearch}
                previewBackgroundUrl={currentScene?.backgroundUrl}
                onSelectAsset={(asset) => {
                  onInsertEvent('fx_start', {
                    fxType: asset.url as VNScreenFxType,
                    fxIntensity: asset.extra?.intensity || 'medium',
                    fxParams: asset.extra?.params,
                  });
                }}
                onClose={onClose}
              />
            </div>
          </div>
        )}

        {/* =========================================================
            SUB-VIEW B: CHARACTER PICKER FOR DIALOGUE (dialogue)
           ========================================================= */}
        {activeSubStep === 'dialogue' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Select Speaker:
              </span>
              <input
                type="text"
                placeholder="Filter character name..."
                value={subPickerSearch}
                onChange={(e) => setSubPickerSearch(e.target.value)}
                className="w-48 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-2.5">
              {/* Option 1: Text-only Narrator (No Character) */}
              <button
                type="button"
                onClick={() => onInsertEvent('dialogue', { characterId: undefined })}
                className="w-full p-3 rounded-xl hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-all duration-150 group flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-surface)] flex items-center justify-center shrink-0 group-hover:scale-105 text-[var(--accent)] transition-transform">
                  <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[var(--text)] block uppercase mb-0.5 group-hover:text-[var(--accent)] transition-colors">
                    Narrator (Voz en off)
                  </span>
                  <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--text)] block transition-colors">
                    Text-only line without displaying character sprite on canvas.
                  </span>
                </div>
              </button>

              {/* Characters List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {(story?.characters || [])
                  .filter((c) => {
                    if (!subPickerSearch.trim()) return true;
                    return c.name.toLowerCase().includes(subPickerSearch.toLowerCase());
                  })
                  .map((char) => {
                    const avatarUrl = getCharacterAvatar(char);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() =>
                          onInsertEvent('dialogue', {
                            characterId: char.id,
                            characterPosition: char.side || 'left',
                            characterScale: char.defaultScale ?? 1.0,
                          })
                        }
                        className="p-2.5 rounded-xl hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-all duration-150 group flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--well-bg)] shrink-0 group-hover:scale-105 transition-transform">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: char.color }}>
                              {char.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block truncate group-hover:underline" style={{ color: char.color }}>
                            {char.name}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] block truncate">
                            {char.badgeTitle || char.description || `Side: ${char.side || 'left'}`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SUB-VIEW C: SCREEN SHAKE (shake)
           ========================================================= */}
        {activeSubStep === 'shake' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-3">
            <div className="p-3 rounded-md bg-[var(--accent-surface)] border border-[var(--border2)] text-xs text-[var(--text)] leading-relaxed">
              <strong className="text-[var(--accent)] font-bold">Screen Shake vs Screen Effect:</strong>{' '}
              Screen Shake is a one-shot instant tremor (0.3s - 0.8s) for sudden hits, gunshots, or explosions. For prolonged continuous atmospheric loops (e.g. ambient earthquakes or alarms), use <strong>Screen Effect</strong>.
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider block">
                Select Shake Intensity:
              </span>
              {[
                {
                  id: 'light',
                  label: 'Light Tremor (Leve)',
                  duration: '0.3s',
                  desc: 'Subtle shudder for gentle collision, tension flinch, or footsteps.',
                  color: 'text-amber-300',
                },
                {
                  id: 'medium',
                  label: 'Medium Shake (Medio)',
                  duration: '0.5s',
                  desc: 'Standard impact vibration for punches, gunshots, or slamming doors.',
                  color: 'text-amber-400',
                },
                {
                  id: 'heavy',
                  label: 'Violent Earthquake (Fuerte)',
                  duration: '0.8s',
                  desc: 'Severe camera shake for explosions, destruction, or ceiling collapse.',
                  color: 'text-rose-400',
                },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onInsertEvent('shake', { shakeIntensity: lvl.id as any })}
                  className="w-full p-3 rounded-xl hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-all duration-150 group flex items-center justify-between gap-3"
                >
                  <div>
                    <span className={`text-xs font-bold uppercase block mb-0.5 group-hover:text-[var(--accent)] transition-colors ${lvl.color}`}>
                      {lvl.label}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--text)] block transition-colors">
                      {lvl.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted)] shrink-0">
                    {lvl.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            SUB-VIEW D: CURSOR STYLE PICKER (cursor_change)
           ========================================================= */}
        {activeSubStep === 'cursor_change' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Interactive Cursor Audition Showcase ({VN_CURSORS_CATALOG.length}):
              </span>
              <input
                type="text"
                placeholder="Search cursors..."
                value={subPickerSearch}
                onChange={(e) => setSubPickerSearch(e.target.value)}
                className="w-56 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <CursorShowcaseTab
                searchQuery={subPickerSearch}
                onSelectAsset={(asset) => {
                  onInsertEvent('cursor_change', { cursorType: asset.url as any, cursorMode: 'persistent' });
                }}
                onClose={onClose}
              />
            </div>
          </div>
        )}

        {/* =========================================================
            SUB-VIEW E: JUMP SCENARIO PICKER (jump_scene)
           ========================================================= */}
        {activeSubStep === 'jump_scene' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Select Destination ({allScenarios.length}):
              </span>
              <input
                type="text"
                placeholder="Search scenario name..."
                value={subPickerSearch}
                onChange={(e) => setSubPickerSearch(e.target.value)}
                className="w-48 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {allScenarios
                  .filter((sc) => {
                    if (!subPickerSearch.trim()) return true;
                    return sc.name.toLowerCase().includes(subPickerSearch.toLowerCase());
                  })
                  .map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => onInsertEvent('jump_scene', { targetSceneId: sc.id })}
                      className="p-2 rounded-xl hover:bg-[var(--surface-strong)] text-left cursor-pointer transition-all duration-150 group flex flex-col gap-1.5"
                    >
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-[var(--well-bg)] border border-[var(--border)]">
                        {sc.backgroundUrl ? (
                          <img src={sc.backgroundUrl} alt={sc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : null}
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text)] block truncate group-hover:text-[var(--accent)] transition-colors">
                        {sc.name}
                      </span>
                      {sc.chapterTitle && (
                        <span className="text-[9px] text-[var(--muted2)] truncate block">
                          {sc.chapterTitle}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SUB-VIEW F: CHANGE BACKGROUND PICKER (bg_change)
           ========================================================= */}
        {activeSubStep === 'bg_change' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold uppercase tracking-wider">
                {[
                  { id: 'all', label: 'All Backgrounds' },
                  { id: 'scenarios', label: `Scenarios (${allScenarios.filter((s) => s.backgroundUrl).length})` },
                  { id: 'assets', label: `Asset Library (${availableBackgroundAssets.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBgSourceFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors border ${
                      bgSourceFilter === tab.id
                        ? 'bg-[var(--accent-surface)] text-[var(--accent)] border-[var(--accent)] font-bold'
                        : 'bg-[var(--btn-bg)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search backgrounds..."
                  value={subPickerSearch}
                  onChange={(e) => setSubPickerSearch(e.target.value)}
                  className="w-44 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none"
                />
                {context?.openAssetPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      context.openAssetPicker('background', (url) => {
                        onInsertEvent('bg_change', { backgroundUrl: url });
                        onClose();
                      });
                    }}
                    className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                    title="Open Full Asset Studio"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="hidden sm:inline">Studio</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(bgSourceFilter === 'all' || bgSourceFilter === 'scenarios') &&
                  allScenarios
                    .filter((sc) => sc.backgroundUrl)
                    .filter((sc) => {
                      if (!subPickerSearch.trim()) return true;
                      return sc.name.toLowerCase().includes(subPickerSearch.toLowerCase());
                    })
                    .map((sc) => (
                      <button
                        key={`scene-${sc.id}`}
                        type="button"
                        onClick={() => onInsertEvent('bg_change', { backgroundUrl: sc.backgroundUrl })}
                        className="p-2.5 rounded-md border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--panel)] hover:bg-[var(--panel-hover)] text-left cursor-pointer transition-all duration-150 group shadow-sm flex flex-col gap-2"
                      >
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-[var(--well-bg)] border border-[var(--border)] relative">
                          <img src={sc.backgroundUrl} alt={sc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-black/70 text-gray-200 backdrop-blur-sm">
                            Scenario
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-[var(--text)] block truncate group-hover:text-[var(--accent)] transition-colors">
                            {sc.name}
                          </span>
                          {sc.chapterTitle && (
                            <span className="text-[9px] text-[var(--muted2)] truncate block">
                              {sc.chapterTitle}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}

                {(bgSourceFilter === 'all' || bgSourceFilter === 'assets') &&
                  availableBackgroundAssets
                    .filter((bg) => {
                      if (!subPickerSearch.trim()) return true;
                      const q = subPickerSearch.toLowerCase();
                      return bg.name.toLowerCase().includes(q) || (bg.description && bg.description.toLowerCase().includes(q));
                    })
                    .map((bg) => (
                      <button
                        key={`asset-${bg.id}`}
                        type="button"
                        onClick={() => onInsertEvent('bg_change', { backgroundUrl: bg.url })}
                        className="p-2.5 rounded-md border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--panel)] hover:bg-[var(--panel-hover)] text-left cursor-pointer transition-all duration-150 group shadow-sm flex flex-col gap-2"
                      >
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-[var(--well-bg)] border border-[var(--border)] relative">
                          <img src={bg.url} alt={bg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-sm">
                            {bg.origin === 'system' ? 'System' : 'Project'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-[var(--text)] block truncate group-hover:text-[var(--accent)] transition-colors">
                            {bg.name}
                          </span>
                          {bg.description && (
                            <span className="text-[9px] text-[var(--muted2)] truncate block">
                              {bg.description}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SUB-VIEW G: BACKGROUND MUSIC (BGM)
           ========================================================= */}
        {activeSubStep === 'bgm' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider">
                  BGM Library ({availableBgmTracks.length}):
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--muted2)] uppercase font-mono">Vol:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setBgmVolume(v);
                      if (playingAudioUrl) {
                        playAudioPreview(playingAudioUrl, v);
                      }
                    }}
                    className="w-20 accent-[var(--accent)] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[var(--text)] w-7 text-right">
                    {Math.round(bgmVolume * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter soundtrack..."
                  value={subPickerSearch}
                  onChange={(e) => setSubPickerSearch(e.target.value)}
                  className="w-48 bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none"
                />
                {context?.openAssetPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      context.openAssetPicker('bgm', (url) => {
                        onInsertEvent('bgm', { audioUrl: url, audioVolume: bgmVolume });
                        onClose();
                      });
                    }}
                    className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--text)] rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                    title="Open Full Audio Gallery"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.media.volume} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span className="hidden sm:inline">Audio Studio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Track List with Audition */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-2">
              {availableBgmTracks
                .filter((track) => {
                  if (!subPickerSearch.trim()) return true;
                  const q = subPickerSearch.toLowerCase();
                  return track.name.toLowerCase().includes(q) || (track.description && track.description.toLowerCase().includes(q));
                })
                .map((track) => {
                  const isPlaying = playingAudioUrl === track.url;
                  return (
                    <div
                      key={track.url}
                      className="p-3 rounded-md border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--panel)] hover:bg-[var(--panel-hover)] transition-all duration-150 flex items-center justify-between gap-3 shadow-sm group"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaying) {
                            stopAudioPreview();
                          } else {
                            playAudioPreview(track.url, bgmVolume);
                          }
                        }}
                        className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                          isPlaying
                            ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse shadow-md shadow-rose-500/20'
                            : 'bg-[var(--accent-surface)] border-[var(--border2)] text-[var(--accent)] hover:scale-105'
                        }`}
                        title={isPlaying ? 'Stop playback' : 'Audition preview'}
                      >
                        <GuiIconRenderer
                          icon={isPlaying ? GUI_ICONS.general.cancel : GUI_ICONS.media.play}
                          className="w-4 h-4"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-[var(--text)] block truncate group-hover:text-[var(--accent)] transition-colors">
                            {track.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-[var(--well-bg)] border border-[var(--border)] text-[var(--muted2)]">
                            {track.origin}
                          </span>
                        </div>
                        {track.description && (
                          <p className="text-[11px] text-[var(--muted)] truncate">
                            {track.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          stopAudioPreview();
                          onInsertEvent('bgm', { audioUrl: track.url, audioVolume: bgmVolume });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--btn-bg)] hover:bg-[var(--accent)] text-[var(--text)] hover:text-[var(--accent-contrast)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-bold uppercase cursor-pointer transition-all shrink-0 shadow-sm"
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =========================================================
            FOOTER: Quick helper / navigation hint
           ========================================================= */}
        <div className="px-4 py-2 sm:px-5 border-t border-[var(--border)] shrink-0 bg-[var(--well-bg)]/40 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span>
            {activeSubStep !== null
              ? 'Click any item to insert directly into timeline'
              : `${filteredCards.length} action types available`}
          </span>
          <span className="font-mono">
            {activeSubStep !== null ? 'ESC to go back' : 'ESC to cancel'}
          </span>
        </div>
      </div>
    </div>
  );
}
