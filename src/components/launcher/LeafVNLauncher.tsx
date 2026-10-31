"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VNStory } from '@/types/vn';
import type { VNProjectSummary } from '@/lib/vn/projectFs';
import { playSfx } from '@/lib/audioSettings';
import { exportStoryToJson, importStoryFromJson } from '@/lib/vn/storage';
import { unpackBundleInBrowser } from '@/lib/vn/bundleClient';
import { isFileSystemAccessSupported, openNativeLeafvnFile } from '@/lib/vn/fileSystemAccess';
import { SAMPLE_STORY } from '@/lib/vn/sampleStory';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { VNEditorTheme, VN_THEMES, getStoredTheme, setStoredTheme, initStoredThemeAndAccent } from '@/lib/vn/themeManager';
import ThemeCustomizerPanel from '@/components/vn/theme/ThemeCustomizerPanel';
import { useAuth } from '@/lib/firebase/authContext';
import { getCloudProjects, saveProjectToCloud, saveProjectToGoogleDrive } from '@/lib/firebase/cloudProjects';
import UserAuthButton from '@/components/auth/UserAuthButton';
import AboutModal from '@/components/common/AboutModal';
import { i18n, SUPPORTED_LANGS } from '@/lib/i18n';
import VNMaker from '@/components/vn/VNMaker';
import VNPlayer from '@/components/vn/VNPlayer';

interface LeafVNLauncherProps {
  initialTab?: 'home' | 'templates' | 'settings';
}

const LANGUAGE_LABELS: Record<string, { name: string; native: string }> = {
  en: { name: 'English', native: 'English (Default)' },
  es: { name: 'Spanish', native: 'Español' },
  pt: { name: 'Portuguese', native: 'Português' },
  fr: { name: 'French', native: 'Français' },
  de: { name: 'German', native: 'Deutsch' },
  it: { name: 'Italian', native: 'Italiano' },
  ja: { name: 'Japanese', native: '日本語' },
  id: { name: 'Indonesian', native: 'Bahasa Indonesia' },
};

export default function LeafVNLauncher({ initialTab = 'home' }: LeafVNLauncherProps) {
  const router = useRouter();
  const { user, googleAccessToken } = useAuth();

  const [projects, setProjects] = useState<VNProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'scenes'>('updated');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'settings'>(initialTab);

  // Sincronizar activeTab con initialTab si cambia por routing
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: 'home' | 'templates' | 'settings') => {
    setActiveTab(tab);
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
    if (tab === 'home') router.push('/');
    else if (tab === 'templates') router.push('/templates');
    else if (tab === 'settings') router.push('/settings');
  };

  // Idioma activo administrado por RTTS
  const [currentLang, setCurrentLang] = useState<string>('en');

  useEffect(() => {
    const lang = i18n.getCurrentLang() || (typeof window !== 'undefined' ? localStorage.getItem('leafvn_language_preference') : 'en') || 'en';
    setCurrentLang(lang);
  }, []);

  const handleSwitchLanguage = async (code: string) => {
    setCurrentLang(code);
    playSfx('/assets/sfx/click intro.mp3', false, 0.4);
    try {
      await i18n.setLanguage(code);
    } catch (err) {
      console.warn('Error cambiando idioma con RTTS:', err);
    }
  };

  // Tema visual del motor (Modern Dark, Modern Light, ROTP)
  const [editorTheme, setEditorTheme] = useState<VNEditorTheme>(() => getStoredTheme());
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const { theme } = initStoredThemeAndAccent();
    setEditorTheme(theme);
  }, []);

  const handleSelectTheme = (theme: VNEditorTheme) => {
    setEditorTheme(theme);
    setStoredTheme(theme);
    playSfx('/assets/sfx/click intro.mp3', false, 0.4);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Estado del editor/reproductor activo en modo launcher directo
  const [activeStory, setActiveStory] = useState<VNStory | null>(null);
  const [engineMode, setEngineMode] = useState<'launcher' | 'editor' | 'player'>('launcher');

  // Modal Nuevo Proyecto
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTemplate, setNewTemplate] = useState<'blank' | 'sample' | 'cinematic'>('sample');
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notificaciones Toast del Launcher
  const [launcherToast, setLauncherToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setLauncherToast({ message, type });
    setTimeout(() => {
      setLauncherToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

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

      // Proyectos en la nube de Firebase si el usuario está autenticado
      let cloudProjects: VNProjectSummary[] = [];
      if (user?.uid) {
        try {
          cloudProjects = await getCloudProjects(user.uid);
        } catch (cloudErr) {
          console.warn('Aviso cargando proyectos de la nube:', cloudErr);
        }
      }

      const mergedMap = new Map<string, VNProjectSummary>();
      serverProjects.forEach((p) => mergedMap.set(p.id, p));
      localProjects.forEach((p) => mergedMap.set(p.id, p));
      cloudProjects.forEach((p) => mergedMap.set(p.id, p));

      setProjects(Array.from(mergedMap.values()));
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Abrir proyecto por ID
  const handleOpenProject = async (id: string, mode: 'editor' | 'player' = 'editor') => {
    playSfx('/assets/sfx/open folder.mp3', false, 0.5);
    localStorage.setItem('leafvn_active_project_id', id);

    // Navegar directamente a la URL dedicada de ruta
    if (mode === 'editor') {
      router.push(`/editor?id=${id}`);
      return;
    } else {
      router.push(`/player?id=${id}`);
      return;
    }
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
        .replace(/^-|-$/g, '') || `project-${Date.now()}`;

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
                title: 'Chapter 1: Start',
                summary: 'Beginning of the story.',
                loadingScreen: { enabled: false, title: 'Chapter 1' },
                startSceneId: `scene-01-${Date.now()}`,
                scenes: [
                  {
                    id: `scene-01-${Date.now()}`,
                    name: 'Initial Scene',
                    description: 'First scene of the project.',
                    backgroundUrl: '/assets/image/scenarios/SCENARIO-TEMPLATE.jpg',
                    timeline: [
                      {
                        id: `ev-init-${Date.now()}`,
                        type: 'dialogue' as const,
                        customSpeakerName: 'Narrator',
                        text: '',
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

    // 1. Guardar en localStorage
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

    // 2. Intentar guardar en disco vía API
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

    if (user?.uid) {
      try {
        await saveProjectToCloud(user.uid, newStory);
      } catch (cloudSaveErr) {
        console.warn('Aviso guardando en nube:', cloudSaveErr);
      }
    }
    setShowNewModal(false);
    setNewTitle('');
    setNewAuthor('');
    setNewDescription('');
    localStorage.setItem('leafvn_active_project_id', safeId);
    router.push(`/editor?id=${safeId}`);
  };

  // Importar archivo .leafvn (paquete completo con assets) o .json
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      playSfx('/assets/sfx/open folder.mp3', false, 0.5);
      let importedStory: VNStory;

      const isLeafvnPackage =
        file.name.toLowerCase().endsWith('.leafvn') ||
        file.name.toLowerCase().endsWith('.zip') ||
        file.type.includes('zip');

      if (isLeafvnPackage) {
        setLauncherToast({
          type: 'success',
          message: `Unpacking complete project "${file.name}"...`,
        });

        // 1. Intento de desempaquetado inmediato en cliente (fallback ultra-rápido y robusto)
        let clientStory: VNStory | null = null;
        try {
          clientStory = await unpackBundleInBrowser(file);
        } catch (clientErr) {
          console.warn('Aviso al pre-desempaquetar paquete en navegador:', clientErr);
        }

        // 2. Enviar al endpoint para extraer assets binarios a public/projects/[id]/
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/projects/import-bundle', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            importedStory = data.story;
          } else if (clientStory) {
            importedStory = clientStory;
          } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to unpack .leafvn bundle');
          }
        } catch (serverErr) {
          if (clientStory) {
            importedStory = clientStory;
          } else {
            throw serverErr;
          }
        }
      } else {
        importedStory = await importStoryFromJson(file);
      }

      try {
        const coverImg = importedStory.coverImageUrl || importedStory.chapters[0]?.scenes[0]?.backgroundUrl;
        const safeCover = coverImg && coverImg.length > 2000 && coverImg.startsWith('data:') ? undefined : coverImg;

        const newSummary: VNProjectSummary = {
          id: importedStory.id,
          title: importedStory.title,
          author: importedStory.author,
          description: importedStory.description,
          version: importedStory.version || '1.0.0',
          coverImageUrl: safeCover,
          updatedAt: importedStory.updatedAt || new Date().toISOString(),
          createdAt: importedStory.createdAt || new Date().toISOString(),
          chapterCount: importedStory.chapters.length,
          characterCount: importedStory.characters.length,
          scenarioCount: importedStory.scenarios?.length || 1,
          assetCount: importedStory.customAssets?.length || 0,
        };
        const stored = localStorage.getItem('leafvn_local_projects_registry');
        const list: VNProjectSummary[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((p) => p.id !== importedStory.id);
        filtered.unshift(newSummary);
        localStorage.setItem('leafvn_local_projects_registry', JSON.stringify(filtered));
        localStorage.setItem(`leafvn_project_${importedStory.id}`, JSON.stringify(importedStory));
      } catch (err) {
        console.warn('Error saving import to localStorage:', err);
      }

      try {
        await fetch(`/api/projects/${importedStory.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story: importedStory }),
        });
      } catch {}

      if (user?.uid) {
        try {
          await saveProjectToCloud(user.uid, importedStory);
        } catch (_) {}
      }
      localStorage.setItem('leafvn_active_project_id', importedStory.id);
      playSfx('/assets/sfx/success.mp3', false, 0.6);
      await fetchProjects();
      router.push(`/editor?id=${importedStory.id}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err || 'Unknown error');
      setLauncherToast({
        type: 'error',
        message: `Error importing project: ${errMsg}`,
      });
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Eliminar proyecto
  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Permanently delete project "${title}"?\n\nThis action will erase its data.`)) {
      return;
    }
    playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);

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

      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.story) sourceStory = data.story;
        }
      } catch {}

      if (!sourceStory) {
        const local = localStorage.getItem(`leafvn_project_${id}`);
        if (local) sourceStory = JSON.parse(local);
      }

      if (!sourceStory && (id === 'el-renacer-del-pintor' || id === SAMPLE_STORY.id)) {
        sourceStory = SAMPLE_STORY;
      }

      if (sourceStory) {
        const cloneId = `${sourceStory.id}-copy-${Date.now().toString().slice(-4)}`;
        const cloneStory: VNStory = {
          ...sourceStory,
          id: cloneId,
          title: `${originalTitle} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

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

        try {
          await fetch(`/api/projects/${cloneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: cloneStory }),
          });
        } catch {}

        await fetchProjects();
        playSfx('/assets/sfx/success.mp3', false, 0.5);
      }
    } catch (err) {
      console.error('Error al duplicar:', err);
    }
  };

  // Exportar paquete completo .leafvn (con audios, imágenes y escenas)
  const handleExportProject = async (id: string, title?: string) => {
    try {
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      const cleanTitle = (title || id).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = `/api/projects/${id}/bundle`;
      downloadAnchor.download = `${cleanTitle}.leafvn`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => downloadAnchor.remove(), 200);
      setLauncherToast({
        type: 'success',
        message: `Exportado paquete completo "${cleanTitle}.leafvn" con todos sus assets.`,
      });
    } catch (err) {
      console.error('Error exportando paquete .leafvn:', err);
    }
  };

  // Guardar / Backup de proyecto en Google Drive
  const handleBackupToGoogleDrive = async (id: string, title: string) => {
    let token = googleAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem('vn_gdrive_token') : null);
    if (!token) {
      setLauncherToast({
        type: 'error',
        message: 'Please sign in with Google (Sign In button) to backup projects directly to Google Drive.',
      });
      return;
    }

    try {
      setLauncherToast({
        type: 'success',
        message: `Backing up "${title}" to Google Drive...`,
      });

      let storyToBackup: VNStory | null = null;
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.story) storyToBackup = data.story;
        }
      } catch {}

      if (!storyToBackup) {
        const local = localStorage.getItem(`leafvn_project_${id}`);
        if (local) storyToBackup = JSON.parse(local);
      }

      if (!storyToBackup && (id === 'el-renacer-del-pintor' || id === SAMPLE_STORY.id)) {
        storyToBackup = SAMPLE_STORY;
      }

      if (!storyToBackup) {
        throw new Error('Project data could not be loaded.');
      }

      await saveProjectToGoogleDrive(token, storyToBackup);
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      setLauncherToast({
        type: 'success',
        message: `Saved to Google Drive: "LeafVN/projects/${storyToBackup.title}.leafvn"!`,
      });
    } catch (err: any) {
      console.error('Google Drive backup error:', err);
      setLauncherToast({
        type: 'error',
        message: 'Google Drive error: ' + (err?.message || 'Check permissions'),
      });
    }
  };

  // Guardar proyecto editado desde VNMaker
  const handleStoryUpdateFromEditor = (updatedStory: VNStory) => {
    setActiveStory(updatedStory);

    try {
      const summary: VNProjectSummary = {
        id: updatedStory.id,
        title: updatedStory.title,
        author: updatedStory.author,
        description: updatedStory.description,
        version: updatedStory.version || '1.0.0',
        coverImageUrl: updatedStory.chapters[0]?.scenes[0]?.backgroundUrl,
        updatedAt: new Date().toISOString(),
        createdAt: updatedStory.createdAt || new Date().toISOString(),
        chapterCount: updatedStory.chapters.length,
        characterCount: updatedStory.characters.length,
        scenarioCount: updatedStory.scenarios?.length || 1,
        assetCount: 0,
      };

      const stored = localStorage.getItem('leafvn_local_projects_registry');
      const list: VNProjectSummary[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((p) => p.id !== updatedStory.id);
      filtered.unshift(summary);
      localStorage.setItem('leafvn_local_projects_registry', JSON.stringify(filtered));
      localStorage.setItem(`leafvn_project_${updatedStory.id}`, JSON.stringify(updatedStory));
    } catch (e) {
      console.warn('Aviso guardando en localStorage:', e);
    }

    fetch(`/api/projects/${updatedStory.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story: updatedStory }),
    }).catch((err) => console.warn('Aviso guardando en disco:', err));
  };

  // Formato de fecha relativa
  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recent';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks}w ago`;
      }
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
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
      <div className="w-screen h-screen overflow-hidden">
        <VNMaker
          initialStory={activeStory}
          onSaveStory={handleStoryUpdateFromEditor}
          onPlayStory={(updated) => {
            handleStoryUpdateFromEditor(updated);
            setEngineMode('player');
          }}
          onExit={() => {
            setEditorTheme(getStoredTheme());
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

  // RENDER: PANTALLA PRINCIPAL DE INICIO
  return (
    <div
      data-vn-engine="true"
      data-vn-theme={editorTheme}
      className={`vn-engine-root relative min-h-screen flex flex-col select-none antialiased transition-colors duration-200 text-[var(--text)] overflow-hidden ${
        editorTheme === 'rotp' ? 'font-typewriter' : 'font-barlow'
      }`}
    >
      {/* AMBIENT BACKGROUND GLOW (Indigo / Violet / Cyan Mesh) */}
      <div className="vn-bg-glow pointer-events-none select-none" aria-hidden="true">
        <div className="vn-glow-circle vn-glow-c1" />
        <div className="vn-glow-circle vn-glow-c2" />
        <div className="vn-glow-circle vn-glow-c3" />
      </div>

      {/* PERSONALIZED CUSTOM BACKGROUND LAYER */}
      <div className="vn-custom-bg-layer" aria-hidden="true" />
      {/* 1. BARRA SUPERIOR DE LA APLICACIÓN (MENU BAR AUTÉNTICO SIN BOTONES REPETIDOS) */}
      <header className="h-11 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md flex items-center justify-between px-4 text-xs shadow-sm z-30">
        <div className="flex items-center gap-4">
          {/* Logo Estilo Photoshop Adaptativo */}
          <div className="flex items-center gap-2">
            <img
              src="/assets/logo/LeafVN.png"
              alt="Leaf VN Logo"
              className="w-7 h-7 object-contain rounded-md select-none pointer-events-none"
            />
            <span className="font-semibold tracking-wide text-[var(--text)]">Leaf VN Studio</span>
          </div>

          {/* Menú de Archivo / Acciones (Sin duplicar las pestañas principales de la barra lateral) */}
          <nav className="hidden md:flex items-center gap-3 text-[var(--muted)] pl-4 border-l border-[var(--border)]">
            <button
              onClick={() => setShowNewModal(true)}
              className="hover:text-[var(--text)] cursor-pointer transition-colors bg-transparent border-0 p-0 text-xs font-inherit text-inherit"
            >
              New Project
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-[var(--text)] cursor-pointer transition-colors bg-transparent border-0 p-0 text-xs font-inherit text-inherit"
            >
              Import File
            </button>
            <button
              onClick={fetchProjects}
              className="hover:text-[var(--text)] cursor-pointer transition-colors bg-transparent border-0 p-0 text-xs font-inherit text-inherit"
            >
              Refresh
            </button>

            {/* Menú de Ayuda / Help Menu */}
            <div className="relative">
              <button
                onClick={() => setShowHelpMenu((prev) => !prev)}
                className="hover:text-[var(--text)] cursor-pointer transition-colors bg-transparent border-0 p-0 text-xs font-inherit text-inherit flex items-center gap-1"
                title="Help and engine information"
              >
                <span>Help</span>
                <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showHelpMenu && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setShowHelpMenu(false)} />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-6 z-[70] w-48 rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
                  >
                    <button
                      onClick={() => {
                        playSfx('/assets/sfx/click interface.mp3', true, 0.3);
                        setShowHelpMenu(false);
                        setShowAboutModal(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] text-[var(--text)] transition-colors cursor-pointer flex items-center justify-between font-medium"
                    >
                      <span>About Leaf VN...</span>
                    </button>
                    <div className="my-1 border-t border-[var(--border)]" />
                    <a
                      href="https://github.com/Brittleleaf/leafVN"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowHelpMenu(false)}
                      className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>Documentation</span>
                      <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Buscador Rápido, Selector de Tema y Pantalla Completa */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-[var(--muted2)]">
              <GuiIconRenderer icon={GUI_ICONS.action.search} className="w-3.5 h-3.5 text-[var(--muted2)]" />
            </span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[var(--well-bg)] hover:bg-[var(--well-focus-bg)] text-xs text-[var(--text)] pl-8 pr-3 py-1 rounded-full border border-[var(--border)] focus:border-[var(--accent)] outline-none w-44 sm:w-56 transition-all placeholder:text-[var(--muted2)]"
            />
          </div>

          {/* Selector de Tema UI & Motor */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border-hover)] text-[var(--text)] shadow-sm backdrop-blur-sm"
              title="Change visual theme (Modern Dark / Light / ROTP Theme)"
            >
              <GuiIconRenderer
                icon={
                  editorTheme === 'default_light'
                    ? GUI_ICONS.general.lightBulb
                    : editorTheme === 'rotp'
                    ? GUI_ICONS.general.hazard
                    : GUI_ICONS.general.circle
                }
                className="w-3.5 h-3.5 text-[var(--accent)]"
              />
              <span className="hidden sm:inline text-[11px] font-mono font-medium">
                {editorTheme === 'default_light' ? 'Light' : editorTheme === 'rotp' ? 'ROTP' : 'Dark'}
              </span>
            </button>

            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowThemeMenu(false)} />
                <div
                  className="absolute right-0 top-9 z-[70] rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ThemeCustomizerPanel
                    currentTheme={editorTheme}
                    onSelectTheme={handleSelectTheme}
                    onClose={() => setShowThemeMenu(false)}
                  />
                </div>
              </>
            )}
          </div>

          {/* User Authentication Button */}
          <UserAuthButton />

          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="w-7 h-7 rounded hover:bg-[var(--btn-hover-bg)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <GuiIconRenderer
              icon={isFullscreen ? GUI_ICONS.general.exitFullscreen : GUI_ICONS.general.fullscreen}
              className="w-3.5 h-3.5"
            />
          </button>
        </div>
      </header>

      {/* 2. CUERPO PRINCIPAL (SIDEBAR + MAIN CANVAS) */}
      <div className="flex-1 flex overflow-hidden">
        {/* BARRA LATERAL IZQUIERDA (PHOTOSHOP SIDEBAR TEMATIZADA CON ICONOS SVG) */}
        <aside className="w-56 bg-[var(--panel)] border-r border-[var(--border)] backdrop-blur-md flex flex-col justify-between p-4 flex-shrink-0 relative z-10">
          <div className="space-y-4">
            {/* Botón Píldora: Nuevo Proyecto */}
            <button
              onClick={() => {
                playSfx('/assets/sfx/click interface.mp3', false, 0.4);
                setShowNewModal(true);
              }}
              className="w-full py-2 px-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] hover:brightness-105 active:brightness-95 text-[var(--accent-contrast)] font-bold text-xs rounded-full shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-3.5 h-3.5 text-[var(--accent-contrast)]" />
              <span>New Project</span>
            </button>

            {/* Botón: Abrir Archivo (Nativo File System API estilo Photopea con fallback) */}
            <button
              onClick={async () => {
                playSfx('/assets/sfx/click interface.mp3', false, 0.4);
                if (isFileSystemAccessSupported()) {
                  try {
                    const res = await openNativeLeafvnFile();
                    if (res) {
                      localStorage.setItem('leafvn_active_project_id', res.story.id);
                      localStorage.setItem(`leafvn_project_${res.story.id}`, JSON.stringify(res.story));
                      playSfx('/assets/sfx/success.mp3', false, 0.6);
                      router.push(`/editor?id=${res.story.id}`);
                      return;
                    }
                  } catch (e: any) {
                    if (e?.name !== 'AbortError') {
                      fileInputRef.current?.click();
                    }
                    return;
                  }
                }
                fileInputRef.current?.click();
              }}
              className="w-full py-2 px-4 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] font-medium text-xs rounded-full border border-[var(--border)] hover:border-[var(--border-hover)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Open a .leafvn project file directly from your PC"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span>Open File (.leafvn)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.leafvn"
              onChange={handleImportFile}
              className="hidden"
            />

            {/* PESTAÑAS PRINCIPALES EXCLUSIVAS (HOME, TEMPLATES, SETTINGS) */}
            <div className="pt-4 border-t border-[var(--border)] space-y-1">
              <button
                onClick={() => handleTabChange('home')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'home'
                    ? 'bg-[var(--surface-strong)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
                }`}
              >
                <GuiIconRenderer icon={GUI_ICONS.general.home} className="w-4 h-4 text-[var(--accent)]" />
                <span>Home</span>
              </button>

              <button
                onClick={() => handleTabChange('templates')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-[var(--surface-strong)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
                }`}
              >
                <GuiIconRenderer icon={GUI_ICONS.general.palette} className="w-4 h-4 text-[var(--accent)]" />
                <span>Templates</span>
              </button>

              <button
                onClick={() => handleTabChange('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-[var(--surface-strong)] text-[var(--accent)] font-semibold shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]'
                }`}
              >
                <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-4 h-4 text-[var(--accent)]" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO CENTRAL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10">
          {activeTab === 'home' ? (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Saludo de Bienvenida */}
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-light text-[var(--text)] tracking-tight">
                  Welcome to <span className="font-semibold text-[var(--accent)]">Leaf VN</span>
                </h1>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Manage your projects, craft interactive stories, and produce visual novels without limits.
                </p>
              </div>

              {/* Barra de Herramientas de Proyectos Recientes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-base font-semibold text-[var(--text)]">Recent</h2>

                  {/* Selector de Ordenación */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <label>Sort:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-[var(--btn-bg)] text-[var(--text)] text-xs px-2 py-1 rounded-lg border border-[var(--border)] outline-none cursor-pointer"
                    >
                      <option value="updated">Recent</option>
                      <option value="title">Title</option>
                      <option value="scenes">Scenes</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                      className="p-1 hover:bg-[var(--btn-hover-bg)] rounded text-[var(--text)] cursor-pointer"
                    >
                      <GuiIconRenderer
                        icon={sortOrder === 'desc' ? GUI_ICONS.navigation.arrowDown : GUI_ICONS.navigation.arrowUp}
                        className="w-3.5 h-3.5"
                      />
                    </button>
                  </div>
                </div>

                {/* Filtro y Conmutador de Vista */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter recent files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] text-xs text-[var(--text)] py-1 pr-6 pl-1 outline-none w-44 sm:w-52 transition-colors placeholder:text-[var(--muted2)]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-1 top-1 text-[var(--muted2)] hover:text-[var(--text)] text-xs cursor-pointer"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Iconos de conmutador de vista */}
                  <div className="flex items-center bg-[var(--well-bg)] rounded-lg p-0.5 border border-[var(--border)]">
                    <button
                      onClick={() => setViewMode('list')}
                      title="List View"
                      className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        viewMode === 'list'
                          ? 'bg-[var(--accent-surface)] text-[var(--accent)] font-bold shadow-sm'
                          : 'text-[var(--muted2)] hover:text-[var(--text)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.layoutList} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                      className={`p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-[var(--accent-surface)] text-[var(--accent)] font-bold shadow-sm'
                          : 'text-[var(--muted2)] hover:text-[var(--text)]'
                      }`}
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.layoutBlocks} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* LISTA / GRID DE PROYECTOS */}
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-[var(--muted)] gap-3">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Loading projects...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-16 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[var(--panel)]">
                  <div className="w-12 h-12 rounded-full bg-[var(--btn-bg)] flex items-center justify-center text-2xl text-[var(--muted)]">
                    <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-6 h-6 text-[var(--muted)]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">No projects found</h3>
                  <p className="text-xs text-[var(--muted)] max-w-sm">
                    {searchQuery ? 'No projects match your current search filter.' : 'Create your first visual novel or open an existing file to get started.'}
                  </p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-2 px-4 py-2 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-contrast)] text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.plus} className="w-3 h-3 text-[var(--accent-contrast)]" />
                    <span>Create New Project</span>
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                /* VISTA EN CUADRÍCULA ESTILO PHOTOSHOP ADAPTADA AL TEMA */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="group bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-[var(--accent-glow)] relative backdrop-blur-sm"
                      onClick={() => handleOpenProject(proj.id, 'editor')}
                    >
                      {/* Miniatura Panorámica 16:9 */}
                      <div className="w-full aspect-video bg-[var(--well-bg)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border)]/50">
                        {proj.coverImageUrl ? (
                          <div
                            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                            style={{ backgroundImage: `url('${proj.coverImageUrl}')` }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--well-bg)] to-[var(--panel)] flex flex-col items-center justify-center text-[var(--muted2)] gap-1">
                            <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-6 h-6 text-[var(--muted2)]" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted2)]">Leaf VN</span>
                          </div>
                        )}

                        {/* Overlay con botones rápidos al pasar el cursor */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(proj.id, 'editor');
                            }}
                            title="Edit Project"
                            className="px-2.5 py-1 bg-[var(--accent)] hover:brightness-110 text-[var(--accent-contrast)] rounded text-[11px] font-bold shadow transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.pencil} className="w-3 h-3 text-[var(--accent-contrast)]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(proj.id, 'player');
                            }}
                            title="Play Story"
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-medium shadow transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3 h-3 text-white" />
                            <span>Play</span>
                          </button>
                        </div>
                      </div>

                      {/* Información de la Tarjeta */}
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors" title={proj.title}>
                            {proj.title}
                          </h3>
                          <p className="text-[11px] text-[var(--muted2)] mt-0.5 truncate">
                            {formatRelativeDate(proj.updatedAt || proj.createdAt)}
                          </p>
                        </div>

                        {/* Metadatos y Menú de Opciones */}
                        <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--muted)]">
                          <span>{proj.scenarioCount || 1} scenes</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateProject(proj.id, proj.title);
                              }}
                              title="Duplicate"
                              className="p-1 hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBackupToGoogleDrive(proj.id, proj.title);
                              }}
                              title="Backup to Google Drive"
                              className="p-1 hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.upload} className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportProject(proj.id, proj.title);
                              }}
                              title="Export .leafvn Package"
                              className="p-1 hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.download} className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProject(proj.id, proj.title);
                              }}
                              title="Delete"
                              className="p-1 hover:text-red-400 hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                            >
                              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* VISTA DE LISTA COMPACTA ADAPTADA AL TEMA */
                <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl overflow-hidden shadow backdrop-blur-md">
                  <table className="w-full text-left text-xs text-[var(--text)]">
                    <thead className="bg-[var(--panel2)] text-[var(--muted2)] uppercase text-[10px] tracking-wider border-b border-[var(--border)]">
                      <tr>
                        <th className="py-2.5 px-4">Project</th>
                        <th className="py-2.5 px-4 hidden sm:table-cell">Author</th>
                        <th className="py-2.5 px-4">Last Modified</th>
                        <th className="py-2.5 px-4 hidden md:table-cell">Scenes</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/60">
                      {filteredProjects.map((proj) => (
                        <tr
                          key={proj.id}
                          className="hover:bg-[var(--panel-hover)] transition-colors cursor-pointer"
                          onClick={() => handleOpenProject(proj.id, 'editor')}
                        >
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-10 h-6 bg-[var(--well-bg)] rounded overflow-hidden flex-shrink-0 border border-[var(--border)]">
                              {proj.coverImageUrl ? (
                                <div
                                  className="w-full h-full bg-cover bg-center"
                                  style={{ backgroundImage: `url('${proj.coverImageUrl}')` }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted2)]">
                                  <GuiIconRenderer icon={GUI_ICONS.general.scenario} className="w-3.5 h-3.5 text-[var(--muted2)]" />
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-[var(--text)] hover:text-[var(--accent)] truncate max-w-xs">
                              {proj.title}
                            </span>
                          </td>
                          <td className="py-3 px-4 hidden sm:table-cell text-[var(--muted)] truncate">
                            {proj.author || 'Leaf VN'}
                          </td>
                          <td className="py-3 px-4 text-[var(--muted)] whitespace-nowrap">
                            {formatRelativeDate(proj.updatedAt || proj.createdAt)}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell text-[var(--muted)]">
                            {proj.scenarioCount || 1}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenProject(proj.id, 'player')}
                                className="px-2 py-1 bg-sky-950/70 hover:bg-sky-700 text-sky-300 hover:text-white rounded text-[11px] font-medium cursor-pointer flex items-center gap-1"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.action.play} className="w-3 h-3" />
                                <span>Play</span>
                              </button>
                              <button
                                onClick={() => handleBackupToGoogleDrive(proj.id, proj.title)}
                                title="Backup to Google Drive"
                                className="p-1 hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.general.upload} className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleExportProject(proj.id, proj.title)}
                                title="Export .leafvn Package"
                                className="p-1 hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.general.download} className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProject(proj.id, proj.title)}
                                title="Delete"
                                className="p-1 hover:text-red-400 hover:bg-[var(--btn-hover-bg)] rounded cursor-pointer"
                              >
                                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
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
          ) : activeTab === 'templates' ? (
            /* PESTAÑA DE PLANTILLAS ADAPTADA AL TEMA (ICONOS SVG PUROS, CERO EMOJIS) */
            <div className="max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-light text-[var(--text)]">Project Templates</h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Start quickly with pre-configured setups for different narrative genres.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plantilla 1: En Blanco */}
                <div
                  onClick={() => {
                    setNewTemplate('blank');
                    setShowNewModal(true);
                  }}
                  className="bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all group shadow-md backdrop-blur-md"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-surface)] border border-[var(--accent-border)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GuiIconRenderer icon={GUI_ICONS.general.fileText} className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      Blank Project
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      An empty canvas with a single initial scene to structure your story from scratch.
                    </p>
                  </div>
                  <button className="mt-5 w-full py-2 bg-[var(--btn-bg)] group-hover:bg-[var(--accent)] text-[var(--text)] group-hover:text-[var(--accent-contrast)] rounded-lg text-xs font-medium transition-colors border border-[var(--border)] cursor-pointer">
                    Use Template
                  </button>
                </div>

                {/* Plantilla 2: Narrativa Completa */}
                <div
                  onClick={() => {
                    setNewTemplate('sample');
                    setShowNewModal(true);
                  }}
                  className="bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all group shadow-md backdrop-blur-md"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-surface)] border border-[var(--accent-border)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      Complete Narrative Adventure
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Includes pre-configured characters, emotions, screen effects, background music, and decision branches.
                    </p>
                  </div>
                  <button className="mt-5 w-full py-2 bg-[var(--btn-bg)] group-hover:bg-[var(--accent)] text-[var(--text)] group-hover:text-[var(--accent-contrast)] rounded-lg text-xs font-medium transition-colors border border-[var(--border)] cursor-pointer">
                    Use Template
                  </button>
                </div>

                {/* Plantilla 3: Cinemática */}
                <div
                  onClick={() => {
                    setNewTemplate('cinematic');
                    setShowNewModal(true);
                  }}
                  className="bg-[var(--panel)] hover:bg-[var(--panel-hover)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all group shadow-md backdrop-blur-md"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-surface)] border border-[var(--accent-border)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GuiIconRenderer icon={GUI_ICONS.general.film} className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      Cinematic Sequence / Trailer
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Focused on background video tracks, animated subtitles, and synchronized audio transitions.
                    </p>
                  </div>
                  <button className="mt-5 w-full py-2 bg-[var(--btn-bg)] group-hover:bg-[var(--accent)] text-[var(--text)] group-hover:text-[var(--accent-contrast)] rounded-lg text-xs font-medium transition-colors border border-[var(--border)] cursor-pointer">
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PESTAÑA DE AJUSTES: DISEÑO LIMPIO CON SEPARADORES EN LUGAR DE CAJAS/MODALES ENORMES */
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-light text-[var(--text)] tracking-tight">
                  Studio Settings
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Configure your workspace language, visual theme, and engine preferences.
                </p>
              </div>

              <div className="h-[1px] bg-[var(--border)]" />

              {/* 1. SECTOR DE IDIOMA POTENCIADO POR REALTIME TRANSLATION SYSTEM (RTTS) */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <GuiIconRenderer icon={GUI_ICONS.general.map} className="w-4 h-4 text-[var(--accent)]" />
                    <span>Interface Language (RTTS Realtime Translation)</span>
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Universal Realtime Translation System automatically translates all engine screens, modals, placeholders, and buttons into your selected language.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUPPORTED_LANGS.map((code) => {
                    const isSelected = currentLang === code;
                    const meta = LANGUAGE_LABELS[code] || { name: code.toUpperCase(), native: code.toUpperCase() };

                    return (
                      <button
                        key={code}
                        onClick={() => handleSwitchLanguage(code)}
                        className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-[var(--surface-strong)] text-[var(--text)] font-semibold shadow-xs'
                            : 'hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--well-bg)] font-bold text-[var(--accent)]">
                            {code.toUpperCase()}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[var(--text)]">{meta.name}</div>
                          <div className="text-[10px] text-[var(--muted2)] truncate">{meta.native}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-[1px] bg-[var(--border)]" />

              {/* 2. SECTOR DE TEMA VISUAL */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <GuiIconRenderer icon={GUI_ICONS.general.palette} className="w-4 h-4 text-[var(--accent)]" />
                    <span>Engine Appearance & Visual Theme</span>
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Switch design system tokens, colors, and typography across the editor and launcher.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2">
                  <ThemeCustomizerPanel
                    compact={true}
                    currentTheme={editorTheme}
                    onSelectTheme={handleSelectTheme}
                  />
                </div>
              </div>

              <div className="h-[1px] bg-[var(--border)]" />             {/* 3. SECTOR DE INFORMACIÓN Y ALMACENAMIENTO */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <GuiIconRenderer icon={GUI_ICONS.general.screenFx} className="w-4 h-4 text-[var(--accent)]" />
                    <span>Engine Architecture & URL Routes</span>
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Separated Next.js App Router navigation links and storage status.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl hover:bg-[var(--surface-strong)] transition-colors space-y-1">
                    <div className="text-[10px] font-mono uppercase text-[var(--muted2)]">Engine Version</div>
                    <div className="flex items-center gap-2">
                      <img src="/assets/logo/LeafVN.png" alt="Leaf VN Logo" className="w-5 h-5 object-contain rounded-sm" />
                      <div className="font-bold text-[var(--text)]">Leaf VN Studio v2.1 (Standalone)</div>
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium flex items-center gap-1.5 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Operational / Local & Disk Engine</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl hover:bg-[var(--surface-strong)] transition-colors space-y-1">
                    <div className="text-[10px] font-mono uppercase text-[var(--muted2)]">Route Links</div>
                    <div className="font-mono text-[11px] text-[var(--accent)] space-y-0.5">
                      <div>/ (Home)</div>
                      <div>/templates (Templates)</div>
                      <div>/settings (Settings)</div>
                      <div>/editor?id=[id] (Visual Novel Maker)</div>
                      <div>/player?id=[id] (Visual Novel Player)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. MODAL DE NUEVO PROYECTO TEMATIZADO (ICONOS SVG PUROS, CERO EMOJIS) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 vn-modal-backdrop flex items-center justify-center p-4">
          <div className="bg-[var(--modal-bg)] border border-[var(--border2)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col backdrop-blur-xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GuiIconRenderer icon={GUI_ICONS.general.fileText} className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--text)]">New Visual Novel Project</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-[var(--muted2)] hover:text-[var(--text)] text-xs p-1 rounded cursor-pointer"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text)] font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter project name here..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-[var(--text)] outline-none placeholder:text-[var(--muted2)]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text)] font-medium mb-1">Author / Studio</label>
                  <input
                    type="text"
                    placeholder="Enter author name here..."
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-[var(--text)] outline-none placeholder:text-[var(--muted2)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text)] font-medium mb-1">Base Template</label>
                  <select
                    value={newTemplate}
                    onChange={(e) => setNewTemplate(e.target.value as any)}
                    className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-[var(--text)] outline-none cursor-pointer"
                  >
                    <option value="sample">Complete Narrative Adventure</option>
                    <option value="blank">Blank Project</option>
                    <option value="cinematic">Cinematic Sequence / Trailer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text)] font-medium mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter description here..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-[var(--text)] outline-none resize-none placeholder:text-[var(--muted2)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] hover:brightness-110 disabled:opacity-50 text-[var(--accent-contrast)] font-bold rounded-lg shadow-[0_0_15px_var(--accent-glow)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Leaf VN Modal (Photoshop Style) */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {launcherToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl shadow-2xl transition-all duration-200">
          <div className={`p-1.5 rounded-lg ${launcherToast.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
            <GuiIconRenderer icon={launcherToast.type === 'error' ? GUI_ICONS.action.danger : GUI_ICONS.action.check} className="w-5 h-5" />
          </div>
          <div className="text-sm font-medium text-[var(--text)] max-w-sm break-words">
            {launcherToast.message}
          </div>
          <button
            type="button"
            onClick={() => setLauncherToast(null)}
            className="p-1 hover:bg-[var(--btn-hover-bg)] text-[var(--muted)] hover:text-[var(--text)] rounded-lg transition-colors cursor-pointer"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}