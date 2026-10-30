"use client";
import React, { useState } from 'react';
import { VNStory, VNChapter, VNWorkspaceView } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VNEditorTheme, VN_THEMES } from '@/lib/vn/themeManager';
import ThemeCustomizerPanel from './theme/ThemeCustomizerPanel';
import UserAuthButton from '@/components/auth/UserAuthButton';

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
          <img
            src="/assets/logo/LeafVN.png"
            alt="Leaf VN Logo"
            className="w-6 h-6 object-contain rounded-md filter drop-shadow-[0_0_6px_var(--accent-glow)] select-none pointer-events-none"
          />
          <span className="text-xs md:text-sm font-extrabold tracking-wider text-[var(--accent)] font-mono hidden sm:inline">
            LEAF VN
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
      <nav className="flex items-center gap-1 bg-[var(--well-bg)]/60 border border-[var(--border)] rounded-xl p-1 shadow-sm overflow-x-auto max-w-full" aria-label="Workspaces">
        {/* 1. Hub */}
        <button
          onClick={() => setCurrentWorkspace?.('hub')}
          className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            currentWorkspace === 'hub'
              ? 'bg-[var(--surface-strong)] text-[var(--accent)] font-semibold shadow-xs'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
          }`}
          title="Master Hub — Project overview and control center"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 opacity-90" />
          <span>Hub</span>
        </button>

        <div className="h-4 w-[1px] bg-[var(--border)]" />

        {/* 2. Menu Tool */}
        <button
          onClick={() => setCurrentWorkspace?.('menu_tool')}
          className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            currentWorkspace === 'menu_tool'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold shadow-xs'
              : 'text-[var(--muted)] hover:text-emerald-500 hover:bg-[var(--surface-strong)]'
          }`}
          title="Menu Tool — Title screen, intro sequence & menu system flow map"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.gameMenu} className="w-3.5 h-3.5 text-emerald-400" />
          <span>Menu Tool</span>
        </button>

        {/* 3. Story Tool */}
        <button
          onClick={() => setCurrentWorkspace?.('story_tool')}
          className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            currentWorkspace === 'story_tool'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold shadow-xs'
              : 'text-[var(--muted)] hover:text-purple-500 hover:bg-[var(--surface-strong)]'
          }`}
          title="Story Tool — Script editor, timeline, characters and cinematics"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.clapperboard} className="w-3.5 h-3.5 text-purple-400" />
          <span>Story Tool</span>
        </button>

        {/* 4. Gallery & Assets */}
        <button
          onClick={() => setCurrentWorkspace?.('gallery_assets')}
          className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            currentWorkspace === 'gallery_assets'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold shadow-xs'
              : 'text-[var(--muted)] hover:text-amber-500 hover:bg-[var(--surface-strong)]'
          }`}
          title="Gallery & Assets — Character rosters, media library and game extras"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5 text-amber-400" />
          <span>Gallery & Assets</span>
        </button>

        <div className="h-4 w-[1px] bg-[var(--border)]" />

        {/* 5. Settings */}
        <button
          onClick={() => setCurrentWorkspace?.('project_settings')}
          className={`h-7 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            currentWorkspace === 'project_settings'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-semibold shadow-xs'
              : 'text-[var(--muted)] hover:text-cyan-500 hover:bg-[var(--surface-strong)]'
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
                className="absolute right-0 top-10 z-[70] rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <ThemeCustomizerPanel
                  currentTheme={editorTheme}
                  onSelectTheme={(th) => onSelectTheme?.(th)}
                  onClose={() => setShowThemeMenu(false)}
                />
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

        {/* Botón Usuario / Auth */}
        <UserAuthButton compact />

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
                className="absolute right-0 top-10 w-60 z-[70] flex flex-col rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-150 select-none text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center justify-between border-b border-[var(--border)] mb-1">
                  <span>FILE & PROJECT</span>
                  <span className="text-[var(--muted2)] font-mono text-[9px]">{story.title}</span>
                </div>

                <div className="flex flex-col gap-0.5" onClick={() => setShowProjectMenu(false)}>
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      setActiveGlobalModal('projects');
                    }}
                    className="w-full px-3 py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-[var(--surface-strong)] flex items-center gap-2.5 cursor-pointer transition-colors text-left font-semibold"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Project Manager</span>
                  </button>

                  <button
                    onClick={onExport}
                    className="w-full px-3 py-2 rounded-lg text-[var(--text)] hover:bg-[var(--surface-strong)] flex items-center gap-2.5 cursor-pointer transition-colors text-left font-medium"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.download} className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Export Story (JSON)</span>
                  </button>

                  <div className="h-[1px] bg-[var(--border)] my-1" />

                  <button
                    onClick={onReset}
                    className="w-full px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 cursor-pointer transition-colors text-left font-medium"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Reset to Sample Story</span>
                  </button>

                  <button
                    onClick={onExit}
                    className="w-full px-3 py-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 cursor-pointer transition-colors text-left font-medium"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.action.exitDoor} className="w-4 h-4 text-red-500 shrink-0" />
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
