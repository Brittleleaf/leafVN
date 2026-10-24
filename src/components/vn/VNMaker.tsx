"use client";
import React from 'react';
import { VNStory } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VNMakerContext } from './VNMakerContext';
import { useVNMakerState } from '@/lib/vn/useVNMakerState';
import VNMakerHeader from './VNMakerHeader';
import VNMakerSceneTabs from './VNMakerSceneTabs';
import VNMakerTimeline from './VNMakerTimeline';
import VNMakerStage from './VNMakerStage';
import EventInspector from './EventInspector';
import VNMakerModals from './VNMakerModals';
import StaticScreenStudio from './StaticScreenStudio';
import CinematicSequencerStudio from './CinematicSequencerStudio';

interface VNMakerProps {
  initialStory: VNStory;
  onPlayStory: (story: VNStory) => void;
  onExit: () => void;
}

export default function VNMaker({ initialStory, onPlayStory, onExit }: VNMakerProps) {
  const contextValue = useVNMakerState(initialStory, onPlayStory, onExit);
  const {
    story,
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
    handlePatchCurrentScene,
    handleUpdateStoryCustomAssets,
  } = contextValue;

  return (
    <VNMakerContext.Provider value={contextValue}>
      <div
        data-vn-engine="true"
        data-vn-theme={editorTheme}
        className={`vn-engine-root h-screen w-screen flex flex-col overflow-hidden select-none transition-colors duration-150 ${
          editorTheme === 'rotp' ? 'font-typewriter' : 'font-barlow'
        }`}
      >
        {/* 1. GLOBAL HEADER BAR (Hidden in Fullscreen Workspace Mode) */}
        {!isFullscreenWorkspace && (
          <VNMakerHeader
            story={story}
            currentChapter={currentChapter}
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
            editorTheme={editorTheme}
            onSelectTheme={handleSelectTheme}
          />
        )}

        {/* 2. INTERACTIVE 3-STEP USER GUIDE (Hidden in Fullscreen Workspace Mode) */}
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

        {/* 3. SCENARIO TABS BAR */}
        <VNMakerSceneTabs />

        {/* 4. MAIN WORKSPACE */}
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

        {/* 5. GLOBAL MODALS OVERLAY */}
        <VNMakerModals />
      </div>
    </VNMakerContext.Provider>
  );
}
