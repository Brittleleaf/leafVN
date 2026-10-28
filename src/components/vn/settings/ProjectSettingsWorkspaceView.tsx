"use client";
import React, { useState } from 'react';
import { useVNMaker } from '../VNMakerContext';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import VariableStudioModal from '../VariableStudioModal';
import GlobalTextBoxModal from '../GlobalTextBoxModal';
import ProjectDoctorModal from '../ProjectDoctorModal';

export default function ProjectSettingsWorkspaceView() {
  const {
    story,
    setStory,
    setCurrentWorkspace,
    setSelectedChapterId,
    setSelectedSceneId,
    setSelectedLineIndex,
    notify,
  } = useVNMaker();

  const [activeTab, setActiveTab] = useState<'variables' | 'textbox' | 'doctor' | 'general'>('variables');

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-transparent select-none overflow-hidden relative z-10">
      {/* HEADER / TOOLBAR */}
      <div className="h-14 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playSfx('/assets/sfx/click intro.mp3', false, 0.25);
              setCurrentWorkspace('hub');
            }}
            className="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-xs font-bold text-[var(--accent)] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            title="Return to Master Hub"
          >
            <GuiIconRenderer icon={GUI_ICONS.navigation.arrowLeft} className="w-3.5 h-3.5" />
            <span>Hub</span>
          </button>

          <div className="h-4 w-[1px] bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
              <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wide uppercase text-[var(--text)]">
                Project Settings & Logic
              </h2>
              <span className="text-[10px] text-[var(--muted)] font-mono">
                Branching variables, global textbox style and project health audit
              </span>
            </div>
          </div>
        </div>

        {/* WORKSPACE SEGMENTED SUB-TABS */}
        <div className="flex items-center gap-1 bg-[var(--well-bg)] border border-[var(--border)] p-0.5 rounded-lg shadow-inner">
          <button
            onClick={() => {
              setActiveTab('variables');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'variables' ? 'bg-[var(--btn-bg)] border border-[var(--border2)] text-[var(--text)] font-semibold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-3.5 h-3.5" />
            <span>Variables & Logic ({story.variables?.length || 0})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('textbox');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'textbox' ? 'bg-[var(--btn-bg)] border border-[var(--border2)] text-[var(--text)] font-semibold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-3.5 h-3.5" />
            <span>Global Text Box Style</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('doctor');
              playUiSound('select', 0.4);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'doctor' ? 'bg-[var(--btn-bg)] border border-[var(--border2)] text-[var(--text)] font-semibold shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5" />
            <span>Project Doctor (Audit)</span>
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'variables' && (
          <div className="w-full h-full relative">
            <VariableStudioModal
              story={story}
              onUpdateStory={(updated) => setStory(updated)}
              onClose={() => setCurrentWorkspace('hub')}
              notify={notify}
              isWorkspaceView={true}
            />
          </div>
        )}

        {activeTab === 'textbox' && (
          <div className="w-full h-full relative">
            <GlobalTextBoxModal
              story={story}
              onUpdateStory={(updated) => setStory(updated)}
              onOpenCharacterStudio={() => setCurrentWorkspace('gallery_assets')}
              onClose={() => setCurrentWorkspace('hub')}
              isWorkspaceView={true}
            />
          </div>
        )}

        {activeTab === 'doctor' && (
          <div className="w-full h-full relative">
            <ProjectDoctorModal
              story={story}
              onNavigateToIssue={(chapterId, sceneId, lineIndex) => {
                setSelectedChapterId(chapterId);
                setSelectedSceneId(sceneId);
                if (typeof lineIndex === 'number') {
                  setSelectedLineIndex(lineIndex);
                }
                setCurrentWorkspace('story_tool');
                notify('Navigating to scene reported by Project Doctor');
              }}
              onClose={() => setCurrentWorkspace('hub')}
              isWorkspaceView={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
