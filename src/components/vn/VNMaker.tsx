"use client";
import React from 'react';
import { VNStory } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VNMakerContext, VNMakerActionsContext, VNMakerStateContext } from './VNMakerContext';
import { useVNMakerState } from '@/lib/vn/useVNMakerState';
import VNMakerHeader from './VNMakerHeader';
import VNMakerSceneTabs from './VNMakerSceneTabs';
import VNMakerTimeline from './VNMakerTimeline';
import VNMakerStage from './VNMakerStage';
import EventInspector from './EventInspector';
import VNMakerModals from './VNMakerModals';
import StaticScreenStudio from './StaticScreenStudio';
import CinematicSequencerStudio from './CinematicSequencerStudio';
import ProjectHubView from './hub/ProjectHubView';
import GalleryAssetsWorkspaceView from './gallery/GalleryAssetsWorkspaceView';
import ProjectSettingsWorkspaceView from './settings/ProjectSettingsWorkspaceView';
import MenuGameToolModal from './menu/MenuGameToolModal';
import { saveActiveStory } from '@/lib/vn/storage';

interface VNMakerProps {
  initialStory: VNStory;
  onPlayStory: (story: VNStory) => void;
  onExit: () => void;
  onSaveStory?: (story: VNStory) => void;
}

export default function VNMaker({ initialStory, onPlayStory, onExit, onSaveStory }: VNMakerProps) {
  const contextValue = useVNMakerState(initialStory, onPlayStory, onExit, onSaveStory);
  const {
    story,
    setStory,
    currentWorkspace,
    setCurrentWorkspace,
    editorTheme,
    handleSelectTheme,
    currentChapter,
    currentScene,
    currentLine,
    activeGlobalModal,
    setActiveGlobalModal,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleManualSave,
    handleExport,
    handleReset,
    showHelpGuide,
    setShowHelpGuide,
    isFullscreenWorkspace,
    feedbackMsg,
    notify,
    handleSelectScene,
    handlePatchCurrentScene,
    handleUpdateStoryCustomAssets,
  } = contextValue;

  return (
    <VNMakerActionsContext.Provider value={contextValue}>
      <VNMakerStateContext.Provider value={contextValue}>
        <VNMakerContext.Provider value={contextValue}>
      <div
        data-vn-engine="true"
        data-vn-theme={editorTheme}
        className={`vn-engine-root h-screen w-screen flex flex-col overflow-hidden select-none transition-colors duration-150 ${
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

        {/* 1. GLOBAL HEADER BAR (Hidden in Fullscreen Workspace Mode) */}
        {!isFullscreenWorkspace && (
          <VNMakerHeader
            story={story}
            currentChapter={currentChapter}
            currentWorkspace={currentWorkspace}
            setCurrentWorkspace={setCurrentWorkspace}
            activeGlobalModal={activeGlobalModal}
            setActiveGlobalModal={setActiveGlobalModal}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onManualSave={handleManualSave}
            onExport={handleExport}
            onReset={handleReset}
            onPlayStory={onPlayStory}
            onExit={onExit}
            showHelpGuide={showHelpGuide}
            setShowHelpGuide={setShowHelpGuide}
            feedbackMsg={feedbackMsg}
            onNotify={notify}
            editorTheme={editorTheme}
            onSelectTheme={handleSelectTheme}
          />
        )}

        {/* 2. WORKSPACE CONTENT ROUTER */}
        {currentWorkspace === 'hub' && (
          <ProjectHubView onPlayStory={onPlayStory} onExit={onExit} />
        )}

        {currentWorkspace === 'menu_tool' && (
          <div className="flex-1 w-full h-full relative overflow-hidden">
            <MenuGameToolModal
              story={story}
              onUpdateStory={(updated) => {
                setStory(updated);
                saveActiveStory(updated);
              }}
              onSelectScene={(sceneId) => {
                handleSelectScene(sceneId);
                setCurrentWorkspace('story_tool');
              }}
              onClose={() => setCurrentWorkspace('hub')}
              notify={notify}
            />
          </div>
        )}

        {currentWorkspace === 'gallery_assets' && (
          <GalleryAssetsWorkspaceView />
        )}

        {currentWorkspace === 'project_settings' && (
          <ProjectSettingsWorkspaceView />
        )}

        {currentWorkspace === 'story_tool' && (
          <>
            {/* INTERACTIVE 3-STEP USER GUIDE (Hidden in Fullscreen Workspace Mode) */}
            {!isFullscreenWorkspace && showHelpGuide && (
              <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between text-xs text-[var(--text)] shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-6 flex-wrap">
                  <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.general.lightBulb} className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>HOW TO EDIT YOUR STORY?</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-[var(--accent)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Click directly in the on-screen <b>text box</b> to write.</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-[var(--accent)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Click the <b>character avatar</b> to change who speaks or their emotion.</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-[var(--accent)] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Click <b>'PLAY LINE'</b> below to see live animation.</span>
                  </span>
                </div>

                <button
                  onClick={() => setShowHelpGuide(false)}
                  className="text-[var(--muted2)] hover:text-[var(--text)] cursor-pointer"
                  title="Close guide"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* SCENARIO TABS BAR */}
            <VNMakerSceneTabs />

            {/* MAIN STORY WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">
              {currentScene?.sceneType === 'event' && currentScene?.eventSubtype === 'cinematic' ? (
                <CinematicSequencerStudio
                  scene={currentScene}
                  story={story}
                  onUpdateScene={handlePatchCurrentScene}
                  onUpdateStoryCustomAssets={handleUpdateStoryCustomAssets}
                  onSave={handleManualSave}
                  editorTheme={editorTheme}
                />
              ) : currentScene?.sceneType === 'event' && currentScene?.eventSubtype === 'static' ? (
                <StaticScreenStudio
                  scene={currentScene}
                  story={story}
                  onUpdateScene={handlePatchCurrentScene}
                  onUpdateStoryCustomAssets={handleUpdateStoryCustomAssets}
                  editorTheme={editorTheme}
                />
              ) : (
                <>
                  {/* TIMELINE EDITOR */}
                  <VNMakerTimeline />

                  {/* WYSIWYG STAGE CANVAS & DETAILED INSPECTOR */}
                  <div className="flex-1 min-w-0 flex flex-col overflow-y-auto p-4 xl:pr-20 space-y-4 bg-transparent">
                    <VNMakerStage />

                    {currentLine && currentChapter && currentScene && (
                      <EventInspector />
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* GLOBAL MODALS OVERLAY */}
        <VNMakerModals />
      </div>
        </VNMakerContext.Provider>
      </VNMakerStateContext.Provider>
    </VNMakerActionsContext.Provider>
  );
}
