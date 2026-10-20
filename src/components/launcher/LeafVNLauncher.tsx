"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VNStory } from '@/types/vn';
import { VNProjectSummary } from '@/lib/vn/projectFs';
import { playSfx } from '@/lib/audioSettings';
import { exportStoryToJson, importStoryFromJson } from '@/lib/vn/storage';
import { SAMPLE_STORY } from '@/lib/vn/sampleStory';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import VNMaker from '@/components/vn/VNMaker';
import VNPlayer from '@/components/vn/VNPlayer';

export default function LeafVNLauncher() {
  const [projects, setProjects] = useState<VNProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'scenes'>('updated');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'home' | 'templates'>('home');

  // Estado del editor/reproductor activo
  const [activeStory, setActiveStory] = useState<VNStory | null>(null);
  const [engineMode, setEngineMode] = useState<'launcher' | 'editor' | 'player'>('launcher');

  // Modal Nuevo Proyecto
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTemplate, setNewTemplate] = useState<'blank' | 'sample' | 'cinematic'>('sample');
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar lista de proyectos de disco + localStorage
  const fetchProjects = async () => {
    try {
      setLoading(true);
      let serverProjects: VNProjectSummary[] = [];

      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.projects)) {
            serverProjects = data.projects;
          }
        }
      } catch (apiErr) {
        console.warn('API de proyectos no disponible o en entorno serverless, recurriendo a local:', apiErr);
      }

      // Proyectos guardados en el navegador
      let localProjects: VNProjectSummary[] = [];
      try {
        const stored = localStorage.getItem('leafvn_local_projects_registry');
        if (stored) {
          localProjects = JSON.parse(stored);
        }
      } catch (localErr) {
        console.warn('Error leyendo registro local de proyectos:', localErr);
      }

      // Fusionar asegurando que no haya duplicados por id
      const mergedMap = new Map<string, VNProjectSummary>();
      serverProjects.forEach((p) => mergedMap.set(p.id, p));
      localProjects.forEach((p) => mergedMap.set(p.id, p));

      // Si no hay ninguno todavía, incluir al menos el sample story
      if (mergedMap.size === 0) {
        mergedMap.set(SAMPLE_STORY.id || 'el-renacer-del-pintor', {
          id: SAMPLE_STORY.id || 'el-renacer-del-pintor',
          title: SAMPLE_STORY.title || 'El Renacer del Pintor',
          author: SAMPLE_STORY.author || 'Justin',
          description: SAMPLE_STORY.description || 'Historia principal.',
          version: SAMPLE_STORY.version || '1.0.0',
          coverImageUrl: SAMPLE_STORY.coverImageUrl || '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
          updatedAt: SAMPLE_STORY.updatedAt || new Date().toISOString(),
          createdAt: SAMPLE_STORY.createdAt || new Date().toISOString(),
          chapterCount: SAMPLE_STORY.chapters.length,
          characterCount: SAMPLE_STORY.characters.length,
          scenarioCount: SAMPLE_STORY.scenarios?.length || 1,
          assetCount: 0,
        });
      }

      setProjects(Array.from(mergedMap.values()));
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Abrir proyecto por ID
  const handleOpenProject = async (id: string, mode: 'editor' | 'player' = 'editor') => {
    playSfx('/assets/sfx/open folder.mp3', false, 0.5);

    // 1. Intentar cargar desde API de disco
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.story) {
          setActiveStory(data.story);
          setEngineMode(mode);
          localStorage.setItem('leafvn_active_project_id', id);
          return;
        }
      }
    } catch (err) {
      console.warn('Fallo cargando de API, intentando localStorage:', err);
    }

    // 2. Intentar cargar desde localStorage
    try {
      const localData = localStorage.getItem(`leafvn_project_${id}`);
      if (localData) {
        const parsedStory = JSON.parse(localData);
        setActiveStory(parsedStory);
        setEngineMode(mode);
        localStorage.setItem('leafvn_active_project_id', id);
        return;
      }
    } catch (err) {
      console.warn('Error leyendo proyecto de localStorage:', err);
    }

    // 3. Fallback especial para historia muestra
    if (id === 'el-renacer-del-pintor' || id === SAMPLE_STORY.id) {
      setActiveStory(SAMPLE_STORY);
      setEngineMode(mode);
      localStorage.setItem('leafvn_active_project_id', id);
      return;
    }

    alert('No se pudo abrir el proyecto. Comprueba si fue exportado o eliminado.');
  };

  // Crear nuevo proyecto
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    playSfx('/assets/sfx/success.mp3', false, 0.5);

    const safeId =
      newTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `proyecto-${Date.now()}`;

    const newStory: VNStory = {
      ...SAMPLE_STORY,
      id: safeId,
      title: newTitle.trim(),
      author: newAuthor.trim() || 'Leaf VN Creator',
      description: newDescription.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chapters:
        newTemplate === 'sample'
          ? SAMPLE_STORY.chapters
          : [
              {
                id: `chap-01-${Date.now()}`,
                number: 1,
                title: 'Capítulo 1: Comienzo',
                summary: 'Inicio de la historia.',
                loadingScreen: { enabled: false, title: 'Capítulo 1' },
                startSceneId: `scene-01-${Date.now()}`,
                scenes: [
                  {
                    id: `scene-01-${Date.now()}`,
                    name: 'Escenario Inicial',
                    description: 'Primera escena del proyecto.',
                    backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
                    timeline: [
                      {
                        id: `ev-init-${Date.now()}`,
                        type: 'dialogue' as const,
                        customSpeakerName: 'Narrador',
                        text: 'La historia comienza aquí...',
                      },
                    ],
                  },
                ],
              },
            ],
    };

    const newSummary: VNProjectSummary = {
      id: safeId,
      title: newStory.title,
      author: newStory.author,
      description: newStory.description,
      version: '1.0.0',
      coverImageUrl: newStory.chapters[0]?.scenes[0]?.backgroundUrl,
      updatedAt: newStory.updatedAt,
      createdAt: newStory.createdAt,
      chapterCount: newStory.chapters.length,
      characterCount: newStory.characters.length,
      scenarioCount: newStory.scenarios?.length || 1,
      assetCount: 0,
    };

    // 1. Guardar inmediatamente en localStorage como capa de seguridad infalible
    try {
      const stored = localStorage.getItem('leafvn_local_projects_registry');
      const list: VNProjectSummary[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((p) => p.id !== safeId);
      filtered.unshift(newSummary);
      localStorage.setItem('leafvn_local_projects_registry', JSON.stringify(filtered));
      localStorage.setItem(`leafvn_project_${safeId}`, JSON.stringify(newStory));
    } catch (storageErr) {
      console.warn('Aviso guardando en localStorage:', storageErr);
    }

    // 2. Intentar guardar en disco vía API (si el filesystem es escribible en local)
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: safeId,
          title: newTitle.trim(),
          author: newAuthor.trim() || 'Leaf VN Creator',
          description: newDescription.trim(),
          template: newTemplate,
        }),
      });
    } catch {
      // Ignorar fallo de API en entornos read-only
    }

    setShowNewModal(false);
    setNewTitle('');
    setNewAuthor('');
    setNewDescription('');
    await fetchProjects();
    setActiveStory(newStory);
    setEngineMode('editor');
    setIsCreating(false);
  };

  // Importar archivo .json / .leafvn
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      playSfx('/assets/sfx/open folder.mp3', false, 0.5);
      const importedStory = await importStoryFromJson(file);

      // Guardar en localStorage
      try {
        const newSummary: VNProjectSummary = {
          id: importedStory.id,
          title: importedStory.title,
          author: importedStory.author,
          description: importedStory.description,
          version: importedStory.version || '1.0.0',
          coverImageUrl: importedStory.chapters[0]?.scenes[0]?.backgroundUrl,
          updatedAt: importedStory.updatedAt || new Date().toISOString(),
          createdAt: importedStory.createdAt || new Date().toISOString(),
          chapterCount: importedStory.chapters.length,
          characterCount: importedStory.characters.length,
          scenarioCount: importedStory.scenarios?.length || 1,
          assetCount: 0,
        };
        const stored = localStorage.getItem('leafvn_local_projects_registry');
        const list: VNProjectSummary[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((p) => p.id !== importedStory.id);
        filtered.unshift(newSummary);
        localStorage.setItem('leafvn_local_projects_registry', JSON.stringify(filtered));
        localStorage.setItem(`leafvn_project_${importedStory.id}`, JSON.stringify(importedStory));
      } catch (err) {
        console.warn('Error guardando importación en localStorage:', err);
      }

      // Intentar guardar en API
      try {
        await fetch(`/api/projects/${importedStory.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: importedStory }),
        });
      } catch {
        // En Vercel puede fallar silently
      }

      await fetchProjects();
      setActiveStory(importedStory);
      setEngineMode('editor');
      playSfx('/assets/sfx/success.mp3', false, 0.6);
    } catch (err: any) {
      alert(`Error importando proyecto: ${err?.message || err}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Eliminar proyecto
  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar definitivamente el proyecto "${title}"?\n\nEsta acción borrará sus datos.`)) {
      return;
    }
    playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);

    // Borrar de localStorage
    try {
      const stored = localStorage.getItem('leafvn_local_projects_registry');
      if (stored) {
        const list: VNProjectSummary[] = JSON.parse(stored);
        localStorage.setItem(
          'leafvn_local_projects_registry',
          JSON.stringify(list.filter((p) => p.id !== id))
        );
      }
      localStorage.removeItem(`leafvn_project_${id}`);
    } catch (e) {
      console.warn('Error eliminando de localStorage:', e);
    }

    // Intentar borrar de API
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Error eliminando en API:', err);
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Duplicar proyecto
  const handleDuplicateProject = async (id: string, originalTitle: string) => {
    try {
      let sourceStory: VNStory | null = null;

      // Buscar en API
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.story) sourceStory = data.story;
        }
      } catch {
        // Ignorar
      }

      // Si no, buscar en localStorage
      if (!sourceStory) {
        const local = localStorage.getItem(`leafvn_project_${id}`);
        if (local) sourceStory = JSON.parse(local);
      }

      if (!sourceStory && (id === 'el-renacer-del-pintor' || id === SAMPLE_STORY.id)) {
        sourceStory = SAMPLE_STORY;
      }

      if (sourceStory) {
        const cloneId = `${sourceStory.id}-copia-${Date.now().toString().slice(-4)}`;
        const cloneStory: VNStory = {
          ...sourceStory,
          id: cloneId,
          title: `${originalTitle} (Copia)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Guardar en localStorage
        try {
          const newSummary: VNProjectSummary = {
            id: cloneId,
            title: cloneStory.title,
            author: cloneStory.author,
            description: cloneStory.description,
            version: cloneStory.version || '1.0.0',
            coverImageUrl: cloneStory.chapters[0]?.scenes[0]?.backgroundUrl,
            updatedAt: cloneStory.updatedAt,
            createdAt: cloneStory.createdAt,
            chapterCount: cloneStory.chapters.length,
            characterCount: cloneStory.characters.length,
            scenarioCount: cloneStory.scenarios?.length || 1,
            assetCount: 0,
          };
          const stored = localStorage.getItem('leafvn_local_projects_registry');
          const list: VNProjectSummary[] = stored ? JSON.parse(stored) : [];
          list.unshift(newSummary);
          localStorage.setItem('leafvn_local_projects_registry', JSON.stringify(list));
          localStorage.setItem(`leafvn_project_${cloneId}`, JSON.stringify(cloneStory));
        } catch (e) {
          console.warn('Error guardando clon en local:', e);
        }

        // Guardar en API si es posible
        try {
          await fetch(`/api/projects/${cloneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: cloneStory }),
          });
        } catch {
          // Ignorar
        }

        await fetchProjects();
        playSfx('/assets/sfx/success.mp3', false, 0.5);
      }
    } catch (err) {
      console.error('Error al duplicar:', err);
    }
  };

  // Exportar proyecto a JSON
  const handleExportProject = async (id: string) => {
    try {
      let storyToExport: VNStory | null = null;

      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.story) storyToExport = data.story;
        }
      } catch {
        // Ignorar
      }

      if (!storyToExport) {
        const local = localStorage.getItem(`leafvn_project_${id}`);
        if (local) storyToExport = JSON.parse(local);
      }

      if (!storyToExport && (id === 'el-renacer-del-pintor' || id === SAMPLE_STORY.id)) {
        storyToExport = SAMPLE_STORY;
      }

      if (storyToExport) {
        exportStoryToJson(storyToExport);
        playSfx('/assets/sfx/success.mp3', false, 0.5);
      }
    } catch (err) {
      console.error('Error exportando:', err);
    }
  };

  // Guardado desde el editor hacia disco y localStorage
  const handleStoryUpdateFromEditor = (updatedStory: VNStory) => {
    setActiveStory(updatedStory);

    // Guardar en localStorage
    try {
      localStorage.setItem(`leafvn_project_${updatedStory.id}`, JSON.stringify(updatedStory));

      // Actualizar registro local de sumarios
      const stored = localStorage.getItem('leafvn_local_projects_registry');
      if (stored) {
        const list: VNProjectSummary[] = JSON.parse(stored);
        const idx = list.findIndex((p) => p.id === updatedStory.id);
        const updatedSummary: VNProjectSummary = {
          id: updatedStory.id,
          title: updatedStory.title,
          author: updatedStory.author,
          description: updatedStory.description,
          version: updatedStory.version || '1.0.0',
          coverImageUrl: updatedStory.coverImageUrl || updatedStory.chapters[0]?.scenes[0]?.backgroundUrl,
          updatedAt: new Date().toISOString(),
          createdAt: updatedStory.createdAt || new Date().toISOString(),
          chapterCount: updatedStory.chapters.length,
          characterCount: updatedStory.characters.length,
          scenarioCount: updatedStory.scenarios?.length || 1,
          assetCount: 0,
        };
        if (idx >= 0) {
          list[idx] = updatedSummary;
        } else {
          list.unshift(updatedSummary);
        }
        localStorage.setItem('leafvn_local_projects_registry', JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }

    // Asíncronamente intentar guardar en disco
    fetch(`/api/projects/${updatedStory.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story: updatedStory }),
    }).catch((err) => console.warn('Aviso guardando en disco (puede ser Vercel read-only):', err));
  };

  // Formato de fecha relativa estilo Photoshop ("hace 2 horas", "hace 3 días")
  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return 'Reciente';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Reciente';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'hace un momento';
      if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
      if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
      }
      return date.toLocaleDateString();
    } catch {
      return 'Reciente';
    }
  };

  // Filtrado y ordenación
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.author && p.author.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'scenes') {
        cmp = (a.scenarioCount || 0) - (b.scenarioCount || 0);
      } else {
        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        cmp = dateA - dateB;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [projects, searchQuery, sortBy, sortOrder]);

  // RENDER: MODO EDITOR (VNMaker)
  if (engineMode === 'editor' && activeStory) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#0a0a0f]">
        <VNMaker
          initialStory={activeStory}
          onPlayStory={(updated) => {
            handleStoryUpdateFromEditor(updated);
            setEngineMode('player');
          }}
          onExit={() => {
            fetchProjects();
            setEngineMode('launcher');
          }}
        />
      </div>
    );
  }

  // RENDER: MODO REPRODUCTOR (VNPlayer)
  if (engineMode === 'player' && activeStory) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-black">
        <VNPlayer
          story={activeStory}
          onExit={() => {
            setEngineMode('launcher');
          }}
          onOpenEditor={() => {
            setEngineMode('editor');
          }}
        />
      </div>
    );
  }

  // RENDER: PANTALLA PRINCIPAL DE INICIO (PHOTOSHOP STYLE)
  return (
    <div className="min-h-screen bg-[#1e1e1e] text-gray-200 flex flex-col font-sans select-none antialiased">
      {/* 1. BARRA SUPERIOR DE LA APLICACIÓN (MENU BAR) */}
      <header className="h-11 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between px-4 text-xs text-gray-300">
        <div className="flex items-center gap-4">
          {/* Logo Estilo Photoshop */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-md flex items-center justify-center font-bold text-white text-sm shadow-md">
              Lv
            </div>
            <span className="font-semibold text-gray-100 tracking-wide">Leaf VN Studio</span>
            <span className="text-[10px] text-gray-500 font-mono bg-[#282828] px-1.5 py-0.5 rounded">v2.1</span>
          </div>

          <nav className="hidden md:flex items-center gap-3 text-gray-400 pl-4 border-l border-[#333]">
            <span className="hover:text-gray-100 cursor-pointer transition-colors" onClick={() => setShowNewModal(true)}>
              Archivo
            </span>
            <span className="hover:text-gray-100 cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
              Abrir
            </span>
            <span className="hover:text-gray-100 cursor-pointer transition-colors" onClick={fetchProjects}>
              Actualizar
            </span>
            <span className="hover:text-gray-100 cursor-pointer transition-colors" onClick={() => setActiveTab(activeTab === 'home' ? 'templates' : 'home')}>
              {activeTab === 'home' ? 'Plantillas' : 'Inicio'}
            </span>
          </nav>
        </div>

        {/* Buscador Rápido y Acciones */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-gray-500 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#2a2a2a] hover:bg-[#323232] focus:bg-[#323232] text-xs text-gray-200 pl-7 pr-3 py-1 rounded-full border border-transparent focus:border-cyan-500/50 outline-none w-44 sm:w-56 transition-all"
            />
          </div>
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            title="Pantalla completa"
            className="w-7 h-7 rounded hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ⛶
          </button>
        </div>
      </header>

      {/* 2. CUERPO PRINCIPAL (SIDEBAR + MAIN CANVAS) */}
      <div className="flex-1 flex overflow-hidden">
        {/* BARRA LATERAL IZQUIERDA (PHOTOSHOP SIDEBAR) */}
        <aside className="w-56 bg-[#181818] border-r border-[#2d2d2d] flex flex-col justify-between p-4 flex-shrink-0">
          <div className="space-y-4">
            {/* Botón Píldora: Archivo nuevo */}
            <button
              onClick={() => {
                playSfx('/assets/sfx/click interface.mp3', false, 0.4);
                setShowNewModal(true);
              }}
              className="w-full py-2 px-4 bg-[#0d6efd] hover:bg-[#0b5ed7] active:bg-[#0a58ca] text-white font-medium text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-sm font-bold">+</span>
              <span>Archivo nuevo</span>
            </button>

            {/* Botón: Abrir */}
            <button
              onClick={() => {
                playSfx('/assets/sfx/click interface.mp3', false, 0.4);
                fileInputRef.current?.click();
              }}
              className="w-full py-2 px-4 bg-transparent hover:bg-[#282828] text-gray-300 hover:text-white font-medium text-xs rounded-full border border-gray-600 hover:border-gray-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Abrir</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.leafvn"
              onChange={handleImportFile}
              className="hidden"
            />

            {/* Navegación lateral */}
            <div className="pt-4 border-t border-[#2d2d2d] space-y-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-[#2b2b2b] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#222]'
                }`}
              >
                <span>🏠</span>
                <span>Inicio</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-[#2b2b2b] text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#222]'
                }`}
              >
                <span>🎨</span>
                <span>Plantillas</span>
              </button>
            </div>
          </div>

          {/* Información del sistema en la parte inferior */}
          <div className="text-[11px] text-gray-500 border-t border-[#2d2d2d] pt-3 space-y-1">
            <p className="font-semibold text-gray-400">Leaf VN Studio</p>
            <p className="truncate">Motor Autónomo de Visual Novels</p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Motor listo</span>
            </div>
          </div>
        </aside>

        {/* CONTENIDO CENTRAL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#1e1e1e]">
          {activeTab === 'home' ? (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Saludo de Bienvenida */}
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-light text-gray-100 tracking-tight">
                  Bienvenido a <span className="font-semibold text-emerald-400">Leaf VN</span>
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Gestiona tus proyectos, diseña guiones interactivos y produce novelas visuales sin límites.
                </p>
              </div>

              {/* Barra de Herramientas de Proyectos Recientes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2d2d2d] pb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-base font-semibold text-gray-100">Recientes</h2>

                  {/* Selector de Ordenación */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <label>Ordenar:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[#282828] text-gray-200 text-xs px-2 py-1 rounded border border-[#3a3a3a] outline-none cursor-pointer"
                    >
                      <option value="updated">Recientes</option>
                      <option value="title">Nombre</option>
                      <option value="scenes">Escenarios</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      title={sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}
                      className="p-1 hover:bg-[#282828] rounded text-gray-300 cursor-pointer"
                    >
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </button>
                  </div>
                </div>

                {/* Filtro y Conmutador de Vista */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filtrar archivos recientes"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-b border-gray-600 focus:border-cyan-400 text-xs text-gray-200 py-1 pr-6 pl-1 outline-none w-44 sm:w-52 transition-colors placeholder:text-gray-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-1 top-1 text-gray-500 hover:text-gray-300 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Iconos de conmutador de vista */}
                  <div className="flex items-center bg-[#282828] rounded p-0.5 border border-[#3a3a3a]">
                    <button
                      onClick={() => setViewMode('list')}
                      title="Vista de lista"
                      className={`p-1.5 rounded text-xs cursor-pointer ${
                        viewMode === 'list' ? 'bg-[#3a3a3a] text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      ≡
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Vista de cuadrícula"
                      className={`p-1.5 rounded text-xs cursor-pointer ${
                        viewMode === 'grid' ? 'bg-[#3a3a3a] text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      ⊞
                    </button>
                  </div>
                </div>
              </div>

              {/* LISTA / GRID DE PROYECTOS */}
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Cargando proyectos en disco...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-16 border-2 border-dashed border-[#2d2d2d] rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#282828] flex items-center justify-center text-2xl text-gray-500">
                    📂
                  </div>
                  <h3 className="text-sm font-semibold text-gray-300">No se encontraron proyectos</h3>
                  <p className="text-xs text-gray-500 max-w-sm">
                    {searchQuery
                      ? 'Ningún proyecto coincide con el filtro de búsqueda actual.'
                      : 'Crea tu primera novela visual o abre un archivo existente para comenzar.'}
                  </p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Crear Proyecto Nuevo
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* VISTA EN CUADRÍCULA ESTILO PHOTOSHOP */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="group bg-[#252525] hover:bg-[#2c2c2c] border border-[#333] hover:border-gray-500 rounded-lg overflow-hidden flex flex-col transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl relative"
                      onClick={() => handleOpenProject(proj.id, 'editor')}
                    >
                      {/* Miniatura Panorámica 16:9 */}
                      <div className="w-full aspect-video bg-[#181818] relative overflow-hidden flex items-center justify-center">
                        {proj.coverImageUrl ? (
                          <div
                            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url('${proj.coverImageUrl}')` }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1e1e24] to-[#121216] flex flex-col items-center justify-center text-gray-600 gap-1">
                            <span className="text-2xl opacity-60">🍃</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Leaf VN</span>
                          </div>
                        )}

                        {/* Overlay con botones rápidos al pasar el cursor */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(proj.id, 'editor');
                            }}
                            title="Editar en Studio"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium shadow transition-transform hover:scale-105 cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(proj.id, 'player');
                            }}
                            title="Probar Novela"
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium shadow transition-transform hover:scale-105 cursor-pointer"
                          >
                            Jugar ▶
                          </button>
                        </div>
                      </div>

                      {/* Información de la Tarjeta */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-200 truncate group-hover:text-emerald-400 transition-colors" title={proj.title}>
                            {proj.title}
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {formatRelativeDate(proj.updatedAt || proj.createdAt)}
                          </p>
                        </div>

                        {/* Metadatos y Menú de Opciones */}
                        <div className="mt-3 pt-2 border-t border-[#333] flex items-center justify-between text-[10px] text-gray-400">
                          <span>{proj.scenarioCount || 1} Escenas</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateProject(proj.id, proj.title);
                              }}
                              title="Duplicar"
                              className="p-1 hover:text-white hover:bg-[#383838] rounded"
                            >
                              📋
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportProject(proj.id);
                              }}
                              title="Exportar JSON para web"
                              className="p-1 hover:text-white hover:bg-[#383838] rounded"
                            >
                              ⬇️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(proj.id, proj.title);
                              }}
                              title="Eliminar"
                              className="p-1 hover:text-red-400 hover:bg-[#383838] rounded"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* VISTA DE LISTA COMPACTA */
                <div className="bg-[#252525] border border-[#333] rounded-lg overflow-hidden shadow">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#1c1c1c] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#333]">
                      <tr>
                        <th className="py-2.5 px-4">Nombre</th>
                        <th className="py-2.5 px-4 hidden sm:table-cell">Autor</th>
                        <th className="py-2.5 px-4">Última Modificación</th>
                        <th className="py-2.5 px-4 hidden md:table-cell">Escenas</th>
                        <th className="py-2.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                      {filteredProjects.map((proj) => (
                        <tr
                          key={proj.id}
                          className="hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                          onClick={() => handleOpenProject(proj.id, 'editor')}
                        >
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-10 h-6 bg-[#181818] rounded overflow-hidden flex-shrink-0">
                              {proj.coverImageUrl ? (
                                <div
                                  className="w-full h-full bg-cover bg-center"
                                  style={{ backgroundImage: `url('${proj.coverImageUrl}')` }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                                  🍃
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-100 hover:text-emerald-400 truncate max-w-xs">
                              {proj.title}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell text-gray-400 truncate">
                            {proj.author || 'Leaf VN'}
                          </td>
                          <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                            {formatRelativeDate(proj.updatedAt || proj.createdAt)}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-gray-400">
                            {proj.scenarioCount || 1}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenProject(proj.id, 'player')}
                                className="px-2 py-1 bg-sky-950/70 hover:bg-sky-700 text-sky-300 hover:text-white rounded text-[11px] font-medium"
                              >
                                Jugar ▶
                              </button>
                              <button
                                onClick={() => handleExportProject(proj.id)}
                                title="Exportar JSON"
                                className="p-1 hover:text-white hover:bg-[#333] rounded"
                              >
                                ⬇️
                              </button>
                              <button
                                onClick={() => handleDeleteProject(proj.id, proj.title)}
                                title="Eliminar"
                                className="p-1 hover:text-red-400 hover:bg-[#333] rounded"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* PESTAÑA DE PLANTILLAS */
            <div className="max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-light text-gray-100">Plantillas de Proyecto</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Comienza rápidamente con configuraciones preparadas para diversos géneros narrativos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plantilla 1: En Blanco */}
                <div
                  onClick={() => {
                    setNewTemplate('blank');
                    setShowNewModal(true);
                  }}
                  className="bg-[#252525] hover:bg-[#2a2a2a] border border-[#333] hover:border-emerald-500 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all group shadow"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      📄
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      Proyecto Limpio (En Blanco)
                    </h3>
                    <p className="text-xs text-gray-400">
                      Un lienzo vacío con un solo escenario inicial para estructurar tu historia desde cero.
                    </p>
                  </div>
                  <button className="mt-5 w-full py-1.5 bg-[#333] group-hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors">
                    Usar Plantilla
                  </button>
                </div>

                {/* Plantilla 2: Narrativa Completa */}
                <div
                  onClick={() => {
                    setNewTemplate('sample');
                    setShowNewModal(true);
                  }}
                  className="bg-[#252525] hover:bg-[#2a2a2a] border border-[#333] hover:border-purple-500 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all group shadow"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🎭
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                      Aventura Narrativa Completa
                    </h3>
                    <p className="text-xs text-gray-400">
                      Incluye personajes preconfigurados, emociones, efectos de pantalla, música de fondo y ramas de decisión.
                    </p>
                  </div>
                  <button className="mt-5 w-full py-1.5 bg-[#333] group-hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors">
                    Usar Plantilla
                  </button>
                </div>

                {/* Plantilla 3: Cinemática */}
                <div
                  onClick={() => {
                    setNewTemplate('cinematic');
                    setShowNewModal(true);
                  }}
                  className="bg-[#252525] hover:bg-[#2a2a2a] border border-[#333] hover:border-sky-500 rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all group shadow"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🎬
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                      Secuencia Cinemática / Tráiler
                    </h3>
                    <p className="text-xs text-gray-400">
                      Enfocada en pistas de video de fondo, subtítulos animados y transiciones de audio sincronizadas.
                    </p>
                  </div>
                  <button className="mt-5 w-full py-1.5 bg-[#333] group-hover:bg-sky-600 text-white rounded text-xs font-medium transition-colors">
                    Usar Plantilla
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. MODAL DE NUEVO PROYECTO (NEW DOCUMENT DIALOG) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#252525] border border-[#3a3a3a] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in flex flex-col">
            <div className="p-4 border-b border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">📄</span>
                <h3 className="text-sm font-semibold text-white">Nuevo Proyecto de Novela Visual</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Las Crónicas del Sector 4"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] focus:border-emerald-500 rounded-lg px-3 py-2 text-white outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Autor / Estudio</label>
                  <input
                    type="text"
                    placeholder="Tu nombre o estudio"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] focus:border-emerald-500 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-1">Plantilla Base</label>
                  <select
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value as any)}
                    className="w-full bg-[#1a1a1a] border border-[#3a3a3a] focus:border-emerald-500 rounded-lg px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="sample">Aventura Completa</option>
                    <option value="blank">Proyecto en Blanco</option>
                    <option value="cinematic">Cinemática</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Descripción Breve</label>
                <textarea
                  rows={2}
                  placeholder="Sinopsis o notas del proyecto..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#3a3a3a] focus:border-emerald-500 rounded-lg px-3 py-2 text-white outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#333] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-[#333] hover:bg-[#3d3d3d] text-gray-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-medium rounded-lg shadow transition-colors cursor-pointer"
                >
                  {isCreating ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
