"use client";
import React, { useState } from 'react';
import { VNStory, VNChapter, VNWorkspaceView } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VNEditorTheme, VN_THEMES } from '@/lib/vn/themeManager';

interface VNMakerHeaderProps {
  story: VNStory;
  currentChapter: VNChapter | undefined;
  currentWorkspace?: VNWorkspaceView;
  setCurrentWorkspace?: (ws: VNWorkspaceView) => void;
  activeGlobalModal: 'characters' | 'variables' | 'chapter' | 'textbox' | 'scenes' | 'scene_map' | 'assets' | 'projects' | 'doctor' | 'menu_tool' | null;
  setActiveGlobalModal: (modal: any) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onManualSave: () => void;
  onExport: () => void;
  onReset: () => void;
  onPlayStory: (story: VNStory) => void;
  onExit: () => void;
  showHelpGuide: boolean;
  setShowHelpGuide: (show: boolean | ((prev: boolean) => boolean)) => void;
  feedbackMsg: string;
  editorTheme?: VNEditorTheme;
  onSelectTheme?: (theme: VNEditorTheme) => void;
}

export default function VNMakerHeader({
  story,
  currentChapter,
  currentWorkspace = 'hub',
  setCurrentWorkspace,
  activeGlobalModal,
  setActiveGlobalModal,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onManualSave,
  onExport,
  onReset,
  onPlayStory,
  onExit,
  showHelpGuide,
  setShowHelpGuide,
  feedbackMsg,
  editorTheme = 'default_dark',
  onSelectTheme,
}: VNMakerHeaderProps) {
  const [showProjectMenu, setShowProjectMenu] = useState<boolean>(false);
  const [showThemeMenu, setShowThemeMenu] = useState<boolean>(false);

  return (
    <header className="h-14 border-b vn-glass-header px-3 md:px-5 flex items-center justify-between gap-3 shrink-0 z-50 relative select-none">
      
      {/* Toast Notification flotante */}
      {feedbackMsg && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div className="bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 text-xs px-3.5 py-1 rounded-md shadow-lg font-mono font-bold flex items-center gap-1.5 backdrop-blur-md">
            <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        </div>
      )}

      {/* ZONA IZQUIERDA: HOME (PHOTOSHOP STYLE) & MARCA & EXPEDIENTE + UNDO/REDO */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
        {/* Photoshop-style Home button to return to Launcher */}
        <button
          onClick={onExit}
          className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] active:scale-95 transition-all cursor-pointer border border-[var(--border)] hover:border-[var(--border2)] shrink-0 shadow-sm"
          title="Return to Home / Projects"
          aria-label="Return to Home / Projects"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.home} className="w-4 h-4 text-[var(--accent)]" />
        </button>

        <div className="h-4 w-[1px] bg-[var(--border2)]" />

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" />
          <span className="text-xs md:text-sm font-extrabold tracking-wider text-[var(--accent)] font-mono hidden sm:inline">
            VN STUDIO
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border2)] hidden sm:block" />

        {/* Project Selector */}
        <button
          onClick={() => setActiveGlobalModal('projects')}
          className="flex items-center gap-1.5 text-xs text-[var(--text)] max-w-[120px] md:max-w-[180px] xl:max-w-xs truncate cursor-pointer bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] px-2.5 py-1.5 rounded-md border border-[var(--border)] hover:border-[var(--border2)] transition-all shadow-sm"
          title="Open Project Manager"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-[var(--muted2)] font-mono text-[10px] uppercase font-bold hidden md:inline">PROJECT:</span>
          <span className="font-semibold text-[var(--text)] truncate">{story.title}</span>
        </button>

        {/* UNDO / REDO BUTTONS */}
        <div className="flex items-center gap-0.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-md p-0.5 backdrop-blur-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`h-7 px-2 rounded flex items-center gap-1 text-xs font-mono font-bold transition-colors ${
              canUndo
                ? 'text-[var(--text)] hover:bg-[var(--btn-hover-bg)] cursor-pointer'
                : 'text-[var(--muted2)] cursor-not-allowed opacity-40'
            }`}
            title="Undo last change (Ctrl+Z)"
          >
            <span className="text-sm">↶</span>
            <span className="hidden xl:inline text-[10px]">Undo</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`h-7 px-2 rounded flex items-center gap-1 text-xs font-mono font-bold transition-colors ${
              canRedo
                ? 'text-[var(--text)] hover:bg-[var(--btn-hover-bg)] cursor-pointer'
                : 'text-[var(--muted2)] cursor-not-allowed opacity-40'
            }`}
            title="Redo last change (Ctrl+Y)"
          >
            <span className="text-sm">↷</span>
            <span className="hidden xl:inline text-[10px]">Redo</span>
          </button>
        </div>
      </div>

      {/* ZONA CENTRAL: WORKSPACE SWITCHER (SOBER PHOTOSHOP STYLE) */}
      <nav className="flex items-center gap-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-0.5 shadow-sm overflow-x-auto max-w-full" aria-label="Workspaces">
        {/* 1. Hub */}
        <button
          onClick={() => setCurrentWorkspace?.('hub')}
          className={`h-7.5 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
            currentWorkspace === 'hub'
              ? 'bg-[#232838] border-[#3e4660] text-white font-semibold shadow-sm'
              : 'bg-transparent border-transparent text-[#94a3b8] hover:text-white hover:bg-[#1b1f2d]'
          }`}
          title="Master Hub — Project overview and control center"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 opacity-90" />
          <span>Hub</span>
        </button>

        {/* 2. Menu Tool */}
        <button
          onClick={() => setCurrentWorkspace?.('menu_tool')}
          className={`h-7.5 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
            currentWorkspace === 'menu_tool'
              ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-200 font-semibold shadow-sm'
              : 'bg-transparent border-transparent text-[#94a3b8] hover:text-emerald-300 hover:bg-[#1b1f2d]'
          }`}
          title="Menu Tool — Title screen, intro sequence & menu system flow map"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gameMenu} className="w-3.5 h-3.5 text-emerald-400" />
          <span>Menu Tool</span>
        </button>

        {/* 3. Story Tool */}
        <button
          onClick={() => setCurrentWorkspace?.('story_tool')}
          className={`h-7.5 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
            currentWorkspace === 'story_tool'
              ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 font-semibold shadow-sm'
              : 'bg-transparent border-transparent text-[#94a3b8] hover:text-purple-300 hover:bg-[#1b1f2d]'
          }`}
          title="Story Tool — Script editor, timeline, characters and cinematics"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3.5 h-3.5 text-purple-400" />
          <span>Story Tool</span>
        </button>

        {/* 4. Gallery & Assets */}
        <button
          onClick={() => setCurrentWorkspace?.('gallery_assets')}
          className={`h-7.5 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
            currentWorkspace === 'gallery_assets'
              ? 'bg-amber-950/70 border-amber-500/80 text-amber-200 font-semibold shadow-sm'
              : 'bg-transparent border-transparent text-[#94a3b8] hover:text-amber-300 hover:bg-[#1b1f2d]'
          }`}
          title="Gallery & Assets — Character rosters, media library and game extras"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5 text-amber-400" />
          <span>Gallery & Assets</span>
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => setCurrentWorkspace?.('project_settings')}
          className={`h-7.5 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
            currentWorkspace === 'project_settings'
              ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 font-semibold shadow-sm'
              : 'bg-transparent border-transparent text-[#94a3b8] hover:text-cyan-300 hover:bg-[#1b1f2d]'
          }`}
          title="Settings — Variables, logic, global text box design and Project Doctor"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-3.5 h-3.5 text-cyan-400" />
          <span>Settings</span>
        </button>
      </nav>

      {/* ZONA DERECHA: ACCIONES Y MENÚ DE ARCHIVO */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Selector de Tema UI & Motor */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="h-8 px-2.5 rounded-md text-xs font-medium cursor-pointer border flex items-center gap-1.5 transition-all border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-[var(--text)] shadow-sm"
            title="Change Engine UI Theme (Modern Dark / Light / ROTP Theme)"
          >
            <GuiIconRenderer
              icon={
                editorTheme === 'default_light'
                  ? GUI_ICONS.general.lightBulb
                  : editorTheme === 'rotp'
                  ? GUI_ICONS.general.hazard
                  : GUI_ICONS.general.circle
              }
              className="w-3.5 h-3.5"
            />
            <span className="hidden xl:inline text-[11px] font-mono font-medium">
              {editorTheme === 'default_light' ? 'Light' : editorTheme === 'rotp' ? 'ROTP' : 'Dark'}
            </span>
            <span className="text-[9px] text-[var(--muted2)]">▼</span>
          </button>

          {showThemeMenu && (
            <>
              <div
                className="fixed inset-0 z-[60]"
                onClick={() => setShowThemeMenu(false)}
              />
              <div
                className="absolute right-0 top-10 w-84 z-[70] flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none drop-shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pestaña superior estilo carpeta / expediente */}
                <div className="flex items-center justify-between px-3.5 py-1.5 rounded-t-lg vn-dossier-tab text-[10px] font-bold tracking-wider uppercase text-[var(--accent)]">
                  <span className="flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>DOSSIER // THEME SELECTOR</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--muted2)]">CLASSIFIED</span>
                </div>

                {/* Cuerpo redondeado estilo carpeta */}
                <div className="rounded-b-lg rounded-tl-lg p-2.5 vn-dossier-card flex flex-col gap-1.5 border border-[var(--border)]">
                  <div className="px-2 py-0.5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center justify-between border-b border-[var(--border)]">
                    <span>SELECT APPEARANCE</span>
                    <span className="text-[var(--muted2)] font-mono text-[9px]">ENGINE & FONTS</span>
                  </div>
                  {VN_THEMES.map((th) => {
                    const isCurrent = editorTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => {
                          onSelectTheme?.(th.id);
                          setShowThemeMenu(false);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all cursor-pointer border backdrop-blur-md ${
                          isCurrent
                            ? 'bg-[var(--accent-surface)] border-[var(--accent)] shadow-sm font-bold'
                            : 'bg-[var(--btn-bg)] border-[var(--border)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded mt-0.5 shrink-0 border flex items-center justify-center shadow-inner"
                          style={{
                            backgroundColor: th.previewBg,
                            borderColor: th.previewBorder,
                            color: th.previewAccent,
                          }}
                        >
                          <GuiIconRenderer
                            icon={
                              th.id === 'default_light'
                                ? GUI_ICONS.general.lightBulb
                                : th.id === 'rotp'
                                ? GUI_ICONS.general.hazard
                                : GUI_ICONS.general.circle
                            }
                            className="w-3.5 h-3.5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold ${isCurrent ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
                              {th.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[var(--well-bg)] text-[var(--text)] border border-[var(--border)]">
                              {th.fontName}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--muted2)] line-clamp-2 mt-0.5 leading-snug">
                            {th.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botón Ayuda Rápida */}
        <button
          onClick={() => setShowHelpGuide((prev) => !prev)}
          className={`h-8 w-8 flex items-center justify-center rounded-md text-xs cursor-pointer border transition-colors ${
            showHelpGuide
              ? 'bg-amber-950/60 border-amber-600 text-amber-300 shadow-sm'
              : 'border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          title={showHelpGuide ? "Hide quick help guide" : "Show quick help guide"}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Botón Probar Historia */}
        <button
          onClick={() => onPlayStory(story)}
          className="h-8 px-3.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-bold rounded-md text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0"
          title="Play and test story in visual player"
        >
          <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3.5 h-3.5 text-[#0F0503]" />
          <span className="hidden sm:inline">TEST</span>
        </button>

        {/* Botón Guardar */}
        <button
          onClick={onManualSave}
          className="h-8 px-3 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--border2)] text-[var(--text)] rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
          title="Save project changes (Ctrl+S)"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="hidden md:inline">Save</span>
        </button>

        {/* Menú Desplegable Archivo / Proyecto */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="h-8 px-2.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--border2)] text-[var(--text)] rounded-md text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all shadow-sm"
            title="File and project options"
          >
            <span>File</span>
            <span className="text-[10px] text-[var(--muted2)]">▼</span>
          </button>

          {showProjectMenu && (
            <>
              <div
                className="fixed inset-0 z-[60]"
                onClick={() => setShowProjectMenu(false)}
              />
              <div
                className="absolute right-0 top-10 w-64 z-[70] flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none drop-shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Pestaña superior estilo carpeta */}
                <div className="flex items-center justify-between px-3.5 py-1.5 rounded-t-lg vn-dossier-tab text-[10px] font-bold tracking-wider uppercase text-[var(--accent)]">
                  <span className="flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>DOSSIER // ARCHIVE & FILE</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--muted2)]">CLASSIFIED</span>
                </div>

                {/* Cuerpo redondeado estilo carpeta */}
                <div
                  className="rounded-b-lg rounded-tl-lg p-2 vn-dossier-card space-y-1 text-xs font-sans border border-[var(--border)]"
                  onClick={() => setShowProjectMenu(false)}
                >
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      setActiveGlobalModal('projects');
                    }}
                    className="w-full px-2.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--border2)] rounded-xl text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 flex items-center gap-2 cursor-pointer transition-colors text-left font-semibold backdrop-blur-md"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Project Manager</span>
                  </button>


                  <button
                    onClick={onExport}
                    className="w-full px-2.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--border2)] rounded-xl text-[var(--text)] flex items-center gap-2 cursor-pointer transition-colors text-left font-medium backdrop-blur-md"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.download} className="w-3.5 h-3.5 text-sky-500" />
                    <span>Export Story (JSON)</span>
                  </button>

                  <div className="h-[1px] bg-[var(--border)] my-1" />

                  <button
                    onClick={onReset}
                    className="w-full px-2.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-red-500/50 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer transition-colors text-left font-medium backdrop-blur-md"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-3.5 h-3.5" />
                    <span>Reset to Sample Story</span>
                  </button>

                  <button
                    onClick={onExit}
                    className="w-full px-2.5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-red-500/50 rounded-xl text-[var(--muted)] hover:text-red-500 flex items-center gap-2 cursor-pointer transition-colors text-left backdrop-blur-md"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.action.exitDoor} className="w-3.5 h-3.5 text-red-500" />
                    <span>Exit Editor</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
