"use client";
import React, { useState } from 'react';
import { VNStory, VNScene, VNCharacter } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playUiSound } from '@/lib/audioSettings';
import { getProxiedImageUrl } from '@/lib/vn/mediaUtils';
import CinematicPlayerView from '../../CinematicPlayerView';

interface StaticScreenGalleryWidgetProps {
  story?: VNStory;
  isInteractive?: boolean;
  initialTab?: 'cinematics' | 'scenarios' | 'characters';
}

export function StaticScreenGalleryWidget({
  story,
  isInteractive = false,
  initialTab = 'cinematics',
}: StaticScreenGalleryWidgetProps) {
  const [activeTab, setActiveTab] = useState<'cinematics' | 'scenarios' | 'characters'>(initialTab);
  const [activeCinematicScene, setActiveCinematicScene] = useState<VNScene | null>(null);
  const [activePreviewScenario, setActivePreviewScenario] = useState<{ name: string; url: string; chapterName?: string } | null>(null);
  const [selectedCharExpr, setSelectedCharExpr] = useState<Record<string, string>>({});

  // Collect all cinematics grouped by chapter
  const chaptersWithCinematics = (story?.chapters || []).map((ch) => ({
    chapterTitle: ch.title,
    chapterNumber: ch.number,
    cinematics: ch.scenes.filter((s) => s.sceneType === 'event' && s.eventSubtype === 'cinematic'),
  })).filter((group) => group.cinematics.length > 0);

  // If no cinematics found in story, create mock cards for editor preview
  const fallbackCinematics = chaptersWithCinematics.length > 0 ? chaptersWithCinematics : [
    {
      chapterTitle: 'Act I: The Initiation',
      chapterNumber: 1,
      cinematics: [
        {
          id: 'mock-cine-1',
          name: 'The Awakening Sequence',
          backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          sceneType: 'event' as const,
          eventSubtype: 'cinematic' as const,
          cinematicConfig: { durationSec: 15 },
        } as any,
        {
          id: 'mock-cine-2',
          name: 'Midnight Chase at the Docks',
          backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          sceneType: 'event' as const,
          eventSubtype: 'cinematic' as const,
          cinematicConfig: { durationSec: 24 },
        } as any,
      ],
    },
  ];

  // Collect all unique scenarios from story
  const allScenarios: { name: string; url: string; chapterName: string }[] = [];
  const seenUrls = new Set<string>();
  (story?.chapters || []).forEach((ch) => {
    ch.scenes.forEach((sc) => {
      const url = sc.backgroundUrl;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        allScenarios.push({
          name: sc.name,
          url,
          chapterName: ch.title,
        });
      }
    });
  });

  const characters: VNCharacter[] = story?.characters?.length
    ? story.characters
    : [
        {
          id: 'char-1',
          name: 'Elena Rostova',
          color: '#38bdf8',
          badgeTitle: 'FIELD INVESTIGATOR',
          avatarUrl: '/assets/image/characters/default-avatar.png',
          description: 'Special operative trained in cognitive anomaly containment and counter-espionage.',
          expressions: { neutral: '', focused: '', alarmed: '' },
        },
        {
          id: 'char-2',
          name: 'Kaelen Vance',
          color: '#f59e0b',
          badgeTitle: 'SYSTEM ARCHITECT',
          avatarUrl: '/assets/image/characters/default-avatar.png',
          description: 'Chief programmer of the neural link interface. Distrustful of corporate oversight.',
          expressions: { neutral: '', smile: '', serious: '' },
        },
      ];

  return (
    <div className="w-full max-w-4xl px-4 py-1 z-30 pointer-events-auto flex flex-col items-center select-none">
      {/* Gallery Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-md bg-[var(--well-bg)] border border-[var(--border)] backdrop-blur-md mb-2 shadow-sm">
        <button
          type="button"
          onClick={() => { setActiveTab('cinematics'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'cinematics'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3.5 h-3.5" />
          <span>Cinematics</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('scenarios'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'scenarios'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5" />
          <span>Scenarios</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('characters'); playUiSound('click', 0.2); }}
          className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'characters'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
          }`}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5" />
          <span>Characters</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 backdrop-blur-md shadow-lg min-h-[240px] max-h-[310px] overflow-y-auto custom-scrollbar">
        {/* 1. CINEMATICS TAB */}
        {activeTab === 'cinematics' && (
          <div className="space-y-4">
            {fallbackCinematics.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-[var(--border)]">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest">
                    [ CHAPTER {group.chapterNumber < 10 ? `0${group.chapterNumber}` : group.chapterNumber} ]
                  </span>
                  <span className="text-xs font-bold text-[var(--text)]">{group.chapterTitle}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {group.cinematics.map((cine) => {
                    const bg = cine.backgroundUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg';
                    const dur = cine.cinematicConfig?.durationSec || 15;

                    return (
                      <div
                        key={cine.id}
                        onClick={() => {
                          if (isInteractive) {
                            setActiveCinematicScene(cine);
                            playUiSound('select', 0.4);
                          }
                        }}
                        className="group relative rounded-md border border-[var(--border)] hover:border-purple-400/80 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] p-2 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] flex flex-col justify-between"
                      >
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-black/80 relative mb-1.5 border border-[var(--border)]">
                          <img
                            src={getProxiedImageUrl(bg)}
                            alt={cine.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 border border-white/20 text-[9px] font-mono text-purple-300 font-bold">
                            {dur}s
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <div className="w-8 h-8 rounded-full bg-purple-500/90 text-white flex items-center justify-center shadow-lg">
                              <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-4 h-4 ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-bold text-[var(--text)] truncate group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors">
                          {cine.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. SCENARIOS TAB */}
        {activeTab === 'scenarios' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {(allScenarios.length > 0
              ? allScenarios
              : [
                  { name: 'City Overlook', url: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg', chapterName: 'Act I' },
                  { name: 'Neon Alley', url: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg', chapterName: 'Act I' },
                  { name: 'Underground Lab', url: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg', chapterName: 'Act II' },
                ]
            ).map((sc, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActivePreviewScenario(sc);
                  playUiSound('select', 0.3);
                }}
                className="group relative rounded-md border border-[var(--border)] hover:border-cyan-400/80 bg-[var(--well-bg)] hover:bg-[var(--btn-hover-bg)] p-1.5 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
              >
                <div className="w-full h-16 rounded-lg overflow-hidden bg-black relative mb-1 border border-[var(--border)]">
                  <img
                    src={getProxiedImageUrl(sc.url)}
                    alt={sc.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="text-[11px] font-bold text-[var(--text)] truncate group-hover:text-cyan-500 dark:group-hover:text-cyan-300">
                  {sc.name}
                </div>
                <div className="text-[9px] font-mono text-[var(--muted2)] truncate">{sc.chapterName}</div>
              </div>
            ))}
          </div>
        )}

        {/* 3. CHARACTERS TAB */}
        {activeTab === 'characters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {characters.map((char) => {
              const activeExpr = selectedCharExpr[char.id];
              const displayAvatar =
                (activeExpr && char.expressions?.[activeExpr]) || char.avatarUrl || '/assets/image/characters/default-avatar.png';

              return (
                <div
                  key={char.id}
                  className="rounded-md border border-[var(--border)] bg-[var(--well-bg)] p-3 flex gap-3 backdrop-blur-sm shadow-sm"
                >
                  <div className="w-20 h-24 rounded-lg overflow-hidden bg-black/80 border border-[var(--border)] shrink-0 relative">
                    <img
                      src={getProxiedImageUrl(displayAvatar)}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: char.color || '#38bdf8' }}
                        />
                        <span className="font-bold text-xs text-[var(--text)] truncate">{char.name}</span>
                      </div>

                      {char.badgeTitle && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[8px] font-mono uppercase font-bold tracking-wider bg-white/10 text-cyan-300 border border-white/15 mb-1">
                          {char.badgeTitle}
                        </span>
                      )}

                      <p className="text-[10px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                        {char.description || 'No biographical records available for this operative.'}
                      </p>
                    </div>

                    {/* Expressions Pills */}
                    {char.expressions && Object.keys(char.expressions).length > 0 && (
                      <div className="flex items-center gap-1 pt-1 border-t border-[var(--border)] overflow-x-auto custom-scrollbar">
                        <span className="text-[8px] font-mono text-[var(--muted2)] uppercase">Faces:</span>
                        {Object.keys(char.expressions).map((expr) => (
                          <button
                            key={expr}
                            type="button"
                            onClick={() => {
                              setSelectedCharExpr((prev) => ({ ...prev, [char.id]: expr }));
                              playUiSound('click', 0.2);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                              (activeExpr || 'neutral') === expr
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)]'
                            }`}
                          >
                            {expr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Cinematic Player Overlay */}
      {activeCinematicScene && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full max-w-7xl max-h-[85vh] aspect-video">
            <CinematicPlayerView
              scene={activeCinematicScene}
              isInteractive={true}
              onComplete={() => setActiveCinematicScene(null)}
              onSkip={() => setActiveCinematicScene(null)}
            />
            <button
              type="button"
              onClick={() => setActiveCinematicScene(null)}
              className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-md bg-black/80 hover:bg-black border border-white/30 text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-2xl backdrop-blur-md"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
              <span>Close Cinematic</span>
            </button>
          </div>
        </div>
      )}

      {/* Scenario Art Lightbox Preview */}
      {activePreviewScenario && (
        <div
          onClick={() => setActivePreviewScenario(null)}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 cursor-pointer backdrop-blur-md"
        >
          <div className="max-w-4xl max-h-[80vh] rounded-lg overflow-hidden border border-white/20 shadow-2xl relative">
            <img
              src={getProxiedImageUrl(activePreviewScenario.url)}
              alt={activePreviewScenario.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold text-sm">{activePreviewScenario.name}</h4>
                <p className="text-gray-400 text-xs font-mono">{activePreviewScenario.chapterName}</p>
              </div>
              <span className="text-xs text-cyan-300 font-mono">[ CLICK ANYWHERE TO CLOSE ]</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
