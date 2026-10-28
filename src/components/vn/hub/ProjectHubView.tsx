"use client";
import React from 'react';
import { useVNMaker } from '../VNMakerContext';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import { VNStory } from '@/types/vn';

interface ProjectHubViewProps {
  onPlayStory: (story: VNStory) => void;
  onExit: () => void;
}

export default function ProjectHubView({ onPlayStory, onExit }: ProjectHubViewProps) {
  const {
    story,
    setStory,
    setCurrentWorkspace,
    setProjectSettingsTab,
    setActiveGlobalModal,
    handleManualSave,
    handleExport,
    currentChapter,
    currentScene,
    notify,
  } = useVNMaker();

  const menuConfig = story.menuSystemConfig || {};
  const isMenuEnabled = menuConfig.enabled !== false;

  // Compute statistics
  const totalChapters = story.chapters.length;
  const totalScenes = story.chapters.reduce((acc, ch) => acc + ch.scenes.length, 0) + (story.scenarios?.length || 0);
  const totalCharacters = story.characters.length;
  const totalVariables = story.variables?.length || 0;
  const totalAssets = (story.customAssets?.length || 0);

  // Check menu configured screens count
  const menuConfiguredCount = [
    menuConfig.introSceneId,
    menuConfig.mainMenuSceneId,
    menuConfig.loadGameSceneId,
    menuConfig.settingsSceneId,
    menuConfig.gallerySceneId,
    menuConfig.playStartSceneId,
  ].filter(Boolean).length;

  const handleToggleMenuEnabled = () => {
    const nextState = !isMenuEnabled;
    setStory((prev) => ({
      ...prev,
      menuSystemConfig: {
        ...(prev.menuSystemConfig || {}),
        enabled: nextState,
      },
    }));
    playUiSound('select', 0.5);
    notify(
      nextState
        ? 'Menu System Enabled on Startup'
        : 'Menu System Bypassed (Direct start at Chapter 1)'
    );
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-transparent text-[var(--text)] select-none custom-scrollbar p-4 md:p-8 flex flex-col justify-between relative z-10">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* TOP HERO BANNER: PROJECT DOSSIER */}
        <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--panel)] backdrop-blur-md p-6 shadow-xl">
          {/* Subtle Cyber Grid Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(209, 123, 248, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-[var(--accent-surface)] border border-[var(--accent-border)] text-[var(--accent)]">
                  PROJECT DOSSIER // MASTER HUB
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">v{story.version || '1.0.0'}</span>
                <span className="text-xs text-[var(--muted2)]">•</span>
                <span className="text-xs font-mono text-[var(--muted)]">ID: {story.id}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase text-[var(--text)]">
                {story.title || 'Untitled Visual Novel'}
              </h1>

              <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed">
                {story.description || 'No description provided. Manage all pillars of your visual novel project from this unified command center.'}
              </p>

              <div className="flex items-center gap-4 text-xs font-mono text-[var(--muted2)] pt-1 flex-wrap">
                <span>Author: <strong className="text-[var(--text)] font-semibold">{story.author || 'Leaf VN Creator'}</strong></span>
                <span>•</span>
                <span>Updated: <strong className="text-[var(--text)] font-semibold">{new Date(story.updatedAt).toLocaleDateString()}</strong></span>
              </div>
            </div>

            {/* Quick Actions Action Block (Photoshop Pro Style) */}
            <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  playSfx('/assets/sfx/start after click intro.mp3', false, 0.4);
                  onPlayStory(story);
                }}
                className="px-4 py-2.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                title="Launch and play full story in live player"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3.5 h-3.5 text-white" />
                <span>Playtest Story</span>
              </button>

              <button
                onClick={handleManualSave}
                className="px-3.5 py-2.5 rounded-md border border-[#2d3346] bg-[#181c28] hover:bg-[#202536] text-xs font-semibold text-gray-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Save project changes (Ctrl+S)"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save</span>
              </button>

              <button
                onClick={handleExport}
                className="px-3.5 py-2.5 rounded-md border border-[#2d3346] bg-[#181c28] hover:bg-[#202536] text-xs font-semibold text-gray-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Export project bundle (.leafvn / .json)"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-purple-400" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 CORE PILLAR WORKSPACE CARDS */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-[var(--muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>CORE WORKSPACES</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--muted2)]">Click any workspace pillar to begin creating</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* 1. MENU GAME TOOL PILLAR */}
            <div
              onClick={() => setCurrentWorkspace('menu_tool')}
              className="group relative rounded-xl border border-emerald-500/30 bg-[var(--panel)] backdrop-blur-md hover:border-emerald-500/70 p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
                    <GuiIconRenderer icon={GUI_ICONS.general.gameMenu} className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/50 border border-emerald-600/40 text-emerald-300">
                    {menuConfiguredCount}/6 Screens
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--text)] group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors tracking-wide">
                    Menu Game Tool
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Design title screen, startup intro sequence, save/load screen, settings & screen gallery flow map.
                  </p>
                </div>

                {/* Status */}
                <div className="pt-2 border-t border-emerald-900/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Game Startup:</span>
                  <span className={isMenuEnabled ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                    {isMenuEnabled ? '● Menu Active' : '○ Direct to Scene 1'}
                  </span>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-2 px-3.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 group-hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Open Menu Designer</span>
                  <span className="group-hover:translate-x-1 transition-transform text-[11px]">➜</span>
                </button>
              </div>
            </div>

            {/* 2. VISUAL NOVEL STORY STUDIO PILLAR */}
            <div
              onClick={() => setCurrentWorkspace('story_tool')}
              className="group relative rounded-xl border border-purple-500/30 bg-[var(--panel)] backdrop-blur-md hover:border-purple-500/70 p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
                    <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/50 border border-purple-600/40 text-purple-300">
                    {totalChapters} Chapters • {totalScenes} Scenarios
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--text)] group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors tracking-wide">
                    Story / Visual Novel Tool
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Core interactive narrative: Dialogue script, event timeline, branching choices, WYSIWYG stage and multitrack cinematics.
                  </p>
                </div>

                {/* Status */}
                <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Current Scenario:</span>
                  <span className="text-purple-300 font-bold truncate max-w-[150px]">
                    {currentScene?.name || 'Scenario 1'}
                  </span>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-2 px-3.5 rounded-md border border-purple-500/40 bg-purple-500/10 group-hover:bg-purple-600 text-purple-700 dark:text-purple-300 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Continue Script & Scenarios</span>
                  <span className="group-hover:translate-x-1 transition-transform text-[11px]">➜</span>
                </button>
              </div>
            </div>

            {/* 3. GALLERY & ASSETS PILLAR */}
            <div
              onClick={() => setCurrentWorkspace('gallery_assets')}
              className="group relative rounded-xl border border-amber-500/30 bg-[var(--panel)] backdrop-blur-md hover:border-amber-500/70 p-5 transition-all duration-150 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-md"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-105 transition-transform">
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/50 border border-amber-600/40 text-amber-300">
                    {totalCharacters} Characters • {totalAssets} Assets
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--text)] group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors tracking-wide">
                    Gallery & Assets
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Asset and character management: Character expressions, background music, SFX audio library and in-game gallery simulation.
                  </p>
                </div>

                {/* Status */}
                <div className="pt-2 border-t border-amber-900/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Extras Gallery:</span>
                  <span className="text-amber-300 font-bold">
                    Cinematics & Scenarios
                  </span>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  className="w-full py-2 px-3.5 rounded-md border border-amber-500/40 bg-amber-500/10 group-hover:bg-amber-600 text-amber-700 dark:text-amber-300 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Explore Gallery & Assets</span>
                  <span className="group-hover:translate-x-1 transition-transform text-[11px]">➜</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SECTION: PROJECT LOGIC & GLOBAL SETTINGS */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/70 backdrop-blur-md p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-4 h-4 text-cyan-400" />
              <span>GLOBAL SETTINGS, LOGIC & AUDIT</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--muted2)]">
              Variables: {totalVariables} active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1 sm:gap-2">
            {/* 1. Variables & Flags */}
            <button
              type="button"
              onClick={() => {
                setProjectSettingsTab('variables');
                setCurrentWorkspace('project_settings');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="flex-1 flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-strong)] transition-all cursor-pointer group text-left"
              title="Open Variables & Flags logic"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform shrink-0">
                <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[var(--text)] group-hover:text-amber-500 transition-colors">
                  Variables & Flags
                </h4>
                <p className="text-[10px] text-[var(--muted)] truncate">Branching logic & conditions</p>
              </div>
            </button>

            <div className="hidden sm:block h-7 w-[1px] bg-[var(--border)] shrink-0" />

            {/* 2. Global Text Box */}
            <button
              type="button"
              onClick={() => {
                setProjectSettingsTab('textbox');
                setCurrentWorkspace('project_settings');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="flex-1 flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-strong)] transition-all cursor-pointer group text-left"
              title="Open Global Text Box typography & style"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:scale-105 transition-transform shrink-0">
                <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[var(--text)] group-hover:text-cyan-500 transition-colors">
                  Global Text Box
                </h4>
                <p className="text-[10px] text-[var(--muted)] truncate">Dialogue style & typography</p>
              </div>
            </button>

            <div className="hidden sm:block h-7 w-[1px] bg-[var(--border)] shrink-0" />

            {/* 3. Project Doctor */}
            <button
              type="button"
              onClick={() => {
                setProjectSettingsTab('doctor');
                setCurrentWorkspace('project_settings');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="flex-1 flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-strong)] transition-all cursor-pointer group text-left"
              title="Open Project Doctor diagnostics"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform shrink-0">
                <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[var(--text)] group-hover:text-emerald-500 transition-colors">
                  Project Doctor
                </h4>
                <p className="text-[10px] text-[var(--muted)] truncate">Health audit & diagnostics</p>
              </div>
            </button>

            <div className="hidden sm:block h-7 w-[1px] bg-[var(--border)] shrink-0" />

            {/* 4. Narrative Map */}
            <button
              type="button"
              onClick={() => {
                setActiveGlobalModal('scene_map');
                playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              }}
              className="flex-1 flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-strong)] transition-all cursor-pointer group text-left"
              title="Open full scene narrative map"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-105 transition-transform shrink-0">
                <GuiIconRenderer icon={GUI_ICONS.general.map} className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[var(--text)] group-hover:text-purple-500 transition-colors">
                  Narrative Map
                </h4>
                <p className="text-[10px] text-[var(--muted)] truncate">Full scene graph & flow</p>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER BAR */}
      <div className="max-w-7xl mx-auto w-full pt-6 flex items-center justify-between text-xs text-[var(--muted2)] border-t border-[var(--border)] mt-6">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
        >
          <span>← Return to Projects List</span>
        </button>
        <span className="font-mono text-[11px]">
          Leaf Visual Novel Engine • Next-Gen Interactive Studio
        </span>
      </div>
    </div>
  );
}
