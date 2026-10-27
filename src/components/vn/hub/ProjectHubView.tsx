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
        ? 'Sistema de Menú Activado al arrancar el juego'
        : 'Sistema de Menú Omitido (Arranque directo en Capítulo 1)'
    );
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#0a0c13] text-[var(--text)] select-none custom-scrollbar p-4 md:p-8 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* TOP HERO BANNER: PROJECT DOSSIER */}
        <div className="relative rounded-3xl overflow-hidden border border-[var(--border)] bg-[#121622]/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          {/* Subtle Cyber Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(209, 123, 248, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#D17BF8]/15 border border-[#D17BF8]/40 text-[#D17BF8]">
                  PROJECT DOSSIER // MASTER HUB
                </span>
                <span className="text-xs font-mono text-[var(--muted)]">v{story.version || '1.0.0'}</span>
                <span className="text-xs text-[var(--muted2)]">•</span>
                <span className="text-xs font-mono text-[var(--muted)]">ID: {story.id}</span>
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold tracking-wide uppercase text-white drop-shadow-md">
                {story.title || 'Untitled Visual Novel'}
              </h1>

              <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed">
                {story.description || 'Sin descripción. Gestiona todos los pilares de tu novela visual desde este centro de mando unificado.'}
              </p>

              <div className="flex items-center gap-4 text-xs font-mono text-[var(--muted2)] pt-1 flex-wrap">
                <span>Autor: <strong className="text-gray-200">{story.author || 'Creador Leaf VN'}</strong></span>
                <span>•</span>
                <span>Actualizado: <strong className="text-gray-200">{new Date(story.updatedAt).toLocaleDateString()}</strong></span>
              </div>
            </div>

            {/* Quick Actions Action Block */}
            <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  playSfx('/assets/sfx/start after click intro.mp3', false, 0.4);
                  onPlayStory(story);
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                title="Lanzar el juego completo en el reproductor en vivo"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-4 h-4 text-white" />
                <span>Probar Juego</span>
              </button>

              <button
                onClick={handleManualSave}
                className="px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] text-xs font-bold text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Guardar cambios del proyecto en disco y almacenamiento local"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-4 h-4 text-cyan-400" />
                <span>Guardar</span>
              </button>

              <button
                onClick={handleExport}
                className="px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] text-xs font-bold text-gray-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                title="Exportar archivo de proyecto .leafvn / .json"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-4 h-4 text-purple-400" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 CORE PILLAR WORKSPACE CARDS */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-[var(--muted)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span>ESPACIOS DE TRABAJO PRINCIPALES</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--muted2)]">Haz clic en cualquier pilar para comenzar a crear</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. MENU GAME TOOL PILLAR */}
            <div
              onClick={() => setCurrentWorkspace('menu_tool')}
              className="group relative rounded-3xl border border-emerald-500/30 bg-[#101719]/90 hover:border-emerald-500/80 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer backdrop-blur-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                    <GuiIconRenderer icon={GUI_ICONS.general.gameMenu} className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950/50 border border-emerald-600/40 text-emerald-300">
                    {menuConfiguredCount}/6 Pantallas
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors tracking-wide">
                    Menu Game Tool
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Diseño y arquitectura del flujo de arranque: Pantalla de Intro, Menú Principal, Carga de Partidas, Ajustes de Audio y Pantalla.
                  </p>
                </div>

                {/* Status Pills */}
                <div className="pt-2 border-t border-emerald-900/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Arranque del juego:</span>
                  <span className={isMenuEnabled ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                    {isMenuEnabled ? '● Menú Activo' : '○ Directo a Escena 1'}
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/50 bg-emerald-950/40 group-hover:bg-emerald-600 text-emerald-300 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Abrir Diseñador de Menús</span>
                  <span className="group-hover:translate-x-1 transition-transform">➜</span>
                </button>
              </div>
            </div>

            {/* 2. VISUAL NOVEL STORY STUDIO PILLAR */}
            <div
              onClick={() => setCurrentWorkspace('story_tool')}
              className="group relative rounded-3xl border border-purple-500/30 bg-[#151122]/90 hover:border-purple-500/80 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer backdrop-blur-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                    <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/50 border border-purple-600/40 text-purple-300">
                    {totalChapters} Capítulos • {totalScenes} Escenas
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors tracking-wide">
                    Visual Novel Tool
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    El corazón narrativo: Guion interactivo, timeline de eventos, decisiones ramificadas, stage visual WYSIWYG y cinemáticas multitrack.
                  </p>
                </div>

                {/* Status Pills */}
                <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Escenario actual:</span>
                  <span className="text-purple-300 font-bold truncate max-w-[150px]">
                    {currentScene?.name || 'Escenario 1'}
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl border border-purple-500/50 bg-purple-950/40 group-hover:bg-purple-600 text-purple-300 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Continuar Guion & Escenas</span>
                  <span className="group-hover:translate-x-1 transition-transform">➜</span>
                </button>
              </div>
            </div>

            {/* 3. GALLERY & ASSETS PILLAR */}
            <div
              onClick={() => setCurrentWorkspace('gallery_assets')}
              className="group relative rounded-3xl border border-amber-500/30 bg-[#1a150e]/90 hover:border-amber-500/80 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer backdrop-blur-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
                    <GuiIconRenderer icon={GUI_ICONS.general.gallery} className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950/50 border border-amber-600/40 text-amber-300">
                    {totalCharacters} Personajes • {totalAssets} Assets
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors tracking-wide">
                    Gallery & Assets
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                    Gestión integral de recursos: Dossiers de personajes y expresiones, biblioteca de música BGM, SFX, fondos y visor de extras.
                  </p>
                </div>

                {/* Status Pills */}
                <div className="pt-2 border-t border-amber-900/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[var(--muted)]">Galería de Extras:</span>
                  <span className="text-amber-300 font-bold">
                    Cinemáticas & Escenarios
                  </span>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl border border-amber-500/50 bg-amber-950/40 group-hover:bg-amber-600 text-amber-300 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explorar Galería & Recursos</span>
                  <span className="group-hover:translate-x-1 transition-transform">➜</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SECTION: PROJECT LOGIC & GLOBAL SETTINGS */}
        <div className="rounded-3xl border border-[var(--border)] bg-[#121622]/80 backdrop-blur-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-4 h-4 text-cyan-400" />
              <span>AJUSTES GLOBALES, LÓGICA & AUDITORÍA</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--muted2)]">
              Variables: {totalVariables} activas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            <button
              onClick={() => setActiveGlobalModal('variables')}
              className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] hover:border-amber-500/50 text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300">Variables & Flags</h4>
                <p className="text-[10px] text-[var(--muted)]">Lógica de bifurcaciones</p>
              </div>
            </button>

            <button
              onClick={() => setActiveGlobalModal('textbox')}
              className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] hover:border-cyan-500/50 text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">Global Text Box</h4>
                <p className="text-[10px] text-[var(--muted)]">Estilo y tipografía de diálogo</p>
              </div>
            </button>

            <button
              onClick={() => setActiveGlobalModal('doctor')}
              className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Project Doctor</h4>
                <p className="text-[10px] text-[var(--muted)]">Auditoría y enlaces rotos</p>
              </div>
            </button>

            <button
              onClick={() => setActiveGlobalModal('scene_map')}
              className="p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--btn-hover-bg)] hover:border-purple-500/50 text-left transition-all cursor-pointer group flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <GuiIconRenderer icon={GUI_ICONS.general.map} className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300">Mapa Narrativo</h4>
                <p className="text-[10px] text-[var(--muted)]">Grafo de escenas completo</p>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* FOOTER BAR */}
      <div className="max-w-7xl mx-auto w-full pt-6 flex items-center justify-between text-xs text-[var(--muted2)] border-t border-[var(--border)] mt-6">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
        >
          <span>← Volver a la lista de proyectos</span>
        </button>
        <span className="font-mono text-[11px]">
          Leaf Visual Novel Engine • Next-Gen Interactive Studio
        </span>
      </div>
    </div>
  );
}
