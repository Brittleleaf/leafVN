"use client";
import React, { useState } from 'react';
import { VNStory, VNChapter } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VNEditorTheme, VN_THEMES } from '@/lib/vn/themeManager';

interface VNMakerHeaderProps {
  story: VNStory;
  currentChapter: VNChapter | undefined;
  activeGlobalModal: 'characters' | 'variables' | 'chapter' | 'textbox' | 'scenes' | 'scene_map' | 'assets' | 'projects' | 'doctor' | null;
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
          <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs px-3.5 py-1 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.35)] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md">
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
          className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] active:scale-95 transition-all cursor-pointer border border-[var(--border)] hover:border-[var(--border2)] shrink-0 shadow-sm"
          title="Return to Home / Projects"
          aria-label="Return to Home / Projects"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.home} className="w-4 h-4 text-[var(--accent)]" />
        </button>

        <div className="h-4 w-[1px] bg-[var(--border2)]" />

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)] animate-pulse" />
          <span className="text-xs md:text-sm font-extrabold tracking-widest text-[var(--accent)] font-mono hidden sm:inline">
            VN STUDIO
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border2)] hidden sm:block" />

        {/* Project Selector */}
        <button
          onClick={() => setActiveGlobalModal('projects')}
          className="flex items-center gap-1.5 text-xs text-[var(--text)] max-w-[120px] md:max-w-[180px] xl:max-w-xs truncate cursor-pointer bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border)] hover:border-[var(--border2)] transition-all shadow-sm"
          title="Open Project Manager"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-[var(--muted2)] font-mono text-[10px] uppercase font-bold hidden md:inline">PROJECT:</span>
          <span className="font-semibold text-[var(--text)] truncate">{story.title}</span>
        </button>

        {/* UNDO / REDO BUTTONS */}
        <div className="flex items-center gap-0.5 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-0.5 backdrop-blur-sm">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-mono font-bold transition-colors ${
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
            className={`h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-mono font-bold transition-colors ${
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

      {/* ZONA CENTRAL: DOCK UNIFICADO DE ESTUDIOS */}
      <div className="flex items-center gap-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-2xl p-1 shadow-sm overflow-x-auto max-w-full backdrop-blur-sm">
        {/* Capítulos */}
        <button
          onClick={() => setActiveGlobalModal('chapter')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'chapter'
              ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-md ring-1 ring-[var(--accent)]/40 font-bold'
              : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)]'
          }`}
          title="Chapter Studio and Manager"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 opacity-80" />
          <span>Chapters</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)]">
            {story.chapters.length}
          </span>
        </button>

        {/* Escenarios */}
        <button
          onClick={() => setActiveGlobalModal('scenes')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'scenes'
              ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-md ring-1 ring-[var(--accent)]/40 font-bold'
              : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)]'
          }`}
          title="Scenario Studio and Library"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5 opacity-80" />
          <span>Scenarios</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)]">
            {currentChapter?.scenes.length || 0}
          </span>
        </button>


        {/* Personajes */}
        <button
          onClick={() => setActiveGlobalModal('characters')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'characters'
              ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-md ring-1 ring-[var(--accent)]/40 font-bold'
              : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)]'
          }`}
          title="Character and Expression Studio"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5 opacity-80" />
          <span>Characters</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)]">
            {story.characters.length}
          </span>
        </button>

        {/* Variables */}
        <button
          onClick={() => setActiveGlobalModal('variables')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'variables'
              ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/40 font-bold'
              : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-amber-300 hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)]'
          }`}
          title="Global Variables and Branching Logic"
        >
          <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-3.5 h-3.5 text-amber-400" />
          <span>Variables</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--btn-bg)] border border-[var(--border)] text-[var(--muted)]">
            {story.variables?.length || 0}
          </span>
        </button>

        {/* Galería Assets */}
        <button
          onClick={() => setActiveGlobalModal('assets')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'assets'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md ring-1 ring-emerald-500/40 font-bold'
              : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-emerald-300 hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)]'
          }`}
          title="Central Asset Gallery (SFX, BGM, Backgrounds, Sprites, Icons)"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-emerald-400" />
          <span>Assets</span>
        </button>

        {/* Textbox */}
        <button
          onClick={() => setActiveGlobalModal('textbox')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'textbox'
              ? 'bg-[var(--accent-surface)] border-[var(--accent)] text-[var(--text)] shadow-md ring-1 ring-[var(--accent)]/40 font-bold'
              : 'bg-[var(--btn-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)]'
          }`}
          title="Global Text Box Design and Style"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-3.5 h-3.5 opacity-80" />
          <span>Text Box</span>
        </button>

        {/* Project Doctor */}
        <button
          onClick={() => setActiveGlobalModal('doctor')}
          className={`h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border backdrop-blur-md shadow-sm ${
            activeGlobalModal === 'doctor'
              ? 'bg-emerald-500/25 border-emerald-500 text-emerald-800 dark:text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.35)] font-bold'
              : 'bg-[var(--btn-bg)] border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-100 hover:bg-emerald-500/15 hover:border-emerald-500/60'
          }`}
          title="Run project health diagnostic & broken link audit"
        >
          <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Doctor</span>
        </button>
      </div>

      {/* ZONA DERECHA: ACCIONES Y MENÚ DE ARCHIVO */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Selector de Tema UI & Motor */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="h-8 px-2.5 rounded-xl text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-[var(--text)] shadow-sm backdrop-blur-sm"
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
                <div className="flex items-center justify-between px-3.5 py-1.5 rounded-t-xl vn-dossier-tab text-[10px] font-bold tracking-wider uppercase text-[var(--accent)]">
                  <span className="flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>DOSSIER // THEME SELECTOR</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--muted2)]">CLASSIFIED</span>
                </div>

                {/* Cuerpo redondeado estilo carpeta */}
                <div className="rounded-b-2xl rounded-tl-2xl p-2.5 vn-dossier-card flex flex-col gap-1.5">
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
                        className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all cursor-pointer border backdrop-blur-md ${
                          isCurrent
                            ? 'bg-[var(--accent-surface)] border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/40 font-bold'
                            : 'bg-[var(--btn-bg)] border-[var(--border)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg mt-0.5 shrink-0 border flex items-center justify-center shadow-inner"
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
          className={`h-8 w-8 flex items-center justify-center rounded-xl text-xs cursor-pointer border transition-colors ${
            showHelpGuide
              ? 'bg-amber-950/60 border-amber-600 text-amber-300 shadow-[0_0_8px_rgba(217,119,6,0.3)]'
              : 'border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)]'
          }`}
          title={showHelpGuide ? "Hide quick help guide" : "Show quick help guide"}
        >
          <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Botón Probar Historia */}
        <button
          onClick={() => onPlayStory(story)}
          className="h-8 px-3.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(209,123,248,0.45)] flex items-center gap-1.5 shrink-0"
          title="Play and test story in visual player"
        >
          <GuiIconRenderer icon={GUI_ICONS.state.play} className="w-3.5 h-3.5 text-[#0F0503]" />
          <span className="hidden sm:inline">TEST</span>
        </button>

        {/* Botón Guardar */}
        <button
          onClick={onManualSave}
          className="h-8 px-3 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--border2)] text-[var(--text)] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
          title="Save project changes (Ctrl+S)"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="hidden md:inline">Save</span>
        </button>

        {/* Menú Desplegable Archivo / Proyecto (Estilo Carpeta Redondeada) */}
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu(!showProjectMenu)}
            className="h-8 px-2.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-[var(--border2)] text-[var(--text)] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all shadow-sm"
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
                <div className="flex items-center justify-between px-3.5 py-1.5 rounded-t-xl vn-dossier-tab text-[10px] font-bold tracking-wider uppercase text-[var(--accent)]">
                  <span className="flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>DOSSIER // ARCHIVE & FILE</span>
                  </span>
                  <span className="text-[9px] font-mono text-[var(--muted2)]">CLASSIFIED</span>
                </div>

                {/* Cuerpo redondeado estilo carpeta */}
                <div
                  className="rounded-b-2xl rounded-tl-2xl p-2 vn-dossier-card space-y-1 text-xs font-sans"
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
