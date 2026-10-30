"use client";
import React, { useState, useEffect } from 'react';
import { VNStory } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';

interface ProjectSummary {
  id: string;
  title: string;
  author: string;
  description: string;
  version: string;
  coverImageUrl?: string;
  updatedAt: string;
  createdAt: string;
  chapterCount: number;
  characterCount: number;
  scenarioCount: number;
  assetCount: number;
}

interface ProjectStudioModalProps {
  currentStory: VNStory;
  onSelectProject: (loadedStory: VNStory) => void;
  onClose: () => void;
  notify?: (msg: string) => void;
}

export default function ProjectStudioModal({
  currentStory,
  onSelectProject,
  onClose,
  notify = () => {},
}: ProjectStudioModalProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Formulario nuevo proyecto
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState<'sample' | 'blank'>('blank');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        }
      }
    } catch (err) {
      console.error('Error al listar proyectos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLoadProject = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.story) {
          onSelectProject(data.story);
          playSfx('/assets/sfx/open folder.mp3', false, 0.5);
          notify(`Project "${data.story.title}" loaded from disk.`);
          onClose();
        }
      } else {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify('Could not load project from server.');
      }
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error loading project: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('Please enter a project title.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          author: newAuthor.trim() || 'Author',
          description: newDescription.trim(),
          template: newTemplate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'Error creating project on disk');
      }

      const data = await res.json();
      playSfx('/assets/sfx/success.mp3', false, 0.6);
      notify(`Project "${data.story.title}" created on disk.`);

      // Cargar automáticamente el nuevo proyecto
      onSelectProject(data.story);
      onClose();
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error creating project: ${err?.message || err}`);
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (projects.length <= 1) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('You cannot delete the only existing project in the system.');
      return;
    }

    const confirmMsg = `Permanently delete project "${projectTitle}"?\n\nThe folder "public/projects/${projectId}" and all its chapters, characters, scenarios, and assets will be deleted from disk.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify(`Project "${projectTitle}" deleted from disk.`);
        if (currentStory.id === projectId) {
          const remaining = projects.filter((p) => p.id !== projectId);
          if (remaining.length > 0) {
            handleLoadProject(remaining[0].id);
            return;
          }
        }
        fetchProjects();
      } else {
        const data = await res.json();
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify(data?.error || 'Error deleting project');
      }
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error deleting project: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
      <div className="w-full max-w-4xl max-h-[88vh] sm:max-h-[85vh] vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
        
        {/* ENCABEZADO */}
        <div className="p-4 vn-glass-header border-b flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center text-[var(--accent)]">
              <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-widest text-[var(--text)] uppercase">
                  Visual Novel Project Manager
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[var(--btn-bg)] text-[var(--accent)] border border-[var(--border)] font-bold">
                  {projects.length} on disk
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Physical location: <code className="text-emerald-500 font-mono">public/projects/[project_id]/</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-md text-xs font-extrabold uppercase tracking-wider transition-all shadow flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>New Project</span>
            </button>

            <button
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] px-2 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] rounded-md border border-[var(--border)] cursor-pointer flex items-center justify-center transition-colors"
              title="Close"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* FORMULARIO DE CREACIÓN */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateProject}
            className="p-4 bg-[var(--well-bg)] border-b border-[var(--border)] space-y-3 shrink-0 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Create New Project in Isolated Folder</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-[var(--muted2)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Project Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter project title here..."
                  className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Author / Creator:</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Enter author name here..."
                  className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Initial Template:</label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value as any)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text)] font-bold outline-none cursor-pointer"
                >
                  <option value="blank">Blank Project (Clean)</option>
                  <option value="sample">Copy Sample Project (Demo)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Short Synopsis:</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter story description here..."
                  className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={isCreating || !newTitle.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all shadow flex items-center gap-1.5"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Creating on disk...' : 'Create Project'}</span>
              </button>
            </div>
          </form>
        )}

        {/* LISTADO DE PROYECTOS */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-[var(--muted)] font-mono animate-pulse">
              Loading projects from disk...
            </div>
          ) : projects.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <p className="text-[var(--muted)] text-sm font-bold">No projects found on the server.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-3 py-1 bg-[var(--accent)] text-white rounded-lg text-xs font-bold"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {projects.map((proj) => {
                const isActive = proj.id === currentStory.id;

                return (
                  <div
                    key={proj.id}
                    className={`rounded-lg border p-4 flex flex-col justify-between gap-3 transition-all bg-[var(--well-bg)] shadow-sm ${
                      isActive
                        ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                        : 'border-[var(--border)] hover:border-[var(--border2)]'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-[var(--text)] line-clamp-1">{proj.title}</h3>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-tighter bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/50 shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--muted)] font-mono">
                            By: <strong className="text-[var(--text)]">{proj.author}</strong> &bull; v{proj.version}
                          </span>
                        </div>

                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id, proj.title)}
                            className="text-[var(--muted2)] hover:text-red-500 text-xs p-1 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Delete this project from disk"
                          >
                            <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                      )}

                      <div className="text-[10px] font-mono text-[var(--muted2)] truncate">
                        Folder: <code className="text-[var(--text)]">public/projects/{proj.id}/</code>
                      </div>

                      {/* Chips de contenido */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono pt-1">
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] shadow-xs">
                          {proj.chapterCount} Chapters
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] shadow-xs">
                          {proj.characterCount} Characters
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] shadow-xs">
                          {proj.scenarioCount} Scenarios
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] text-emerald-600 dark:text-emerald-300 shadow-xs">
                          {proj.assetCount} Folder Assets
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[var(--muted2)] font-mono">
                        Modified: {new Date(proj.updatedAt).toLocaleDateString()}
                      </span>

                      {isActive ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                          <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Open in Editor</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLoadProject(proj.id)}
                          className="px-3 py-1 bg-[var(--accent)] hover:brightness-110 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow flex items-center gap-1.5"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3 h-3" />
                          <span>Load Project</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA */}
        <div className="p-3.5 bg-[var(--well-bg)] border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
          <span>Each project is stored independently with its own folder for assets, chapters, and characters.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] rounded-md text-xs cursor-pointer font-bold transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
