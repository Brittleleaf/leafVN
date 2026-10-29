"use client";
import React from 'react';
import { useVNMaker } from './VNMakerContext';
import { playSfx } from '@/lib/audioSettings';
import { saveActiveStory } from '@/lib/vn/storage';

// Modales activos del editor
import QuickCharacterPickerModal from './QuickCharacterPickerModal';
import AddActionModal from './AddActionModal';
import SceneMapModal from './SceneMapModal';
import SceneStudioModal from './SceneStudioModal';
import AssetStudioModal from './AssetStudioModal';
import ProjectStudioModal from './ProjectStudioModal';
import HotspotStudioModal from './HotspotStudioModal';
import SceneAudioModal from './SceneAudioModal';
import MenuGameToolModal from './menu/MenuGameToolModal';

export default function VNMakerModals() {
  const {
    story,
    setStory,
    selectedChapterId,
    setSelectedChapterId,
    selectedSceneId,
    setSelectedSceneId,
    setSelectedLineIndex,
    currentChapter,
    currentScene,
    activeGlobalModal,
    setActiveGlobalModal,
    showCharacterPicker,
    setShowCharacterPicker,
    showAddActionModal,
    setShowAddActionModal,
    showHotspotStudio,
    setShowHotspotStudio,
    editingHotspotId,
    setEditingHotspotId,
    showSceneAudioModal,
    setShowSceneAudioModal,
    assetPickerConfig,
    setAssetPickerConfig,
    handlePatchCurrentLine,
    handleInsertEvent,
    handleUpdateCurrentScene,
    handlePatchCurrentScene,
    notify,
    handleSelectScene,
    setCurrentWorkspace,
  } = useVNMaker();

  return (
    <>
      {/* 1. SELECCIÓN RÁPIDA DE PERSONAJE Y EMOCIÓN */}
      {showCharacterPicker && (
        <QuickCharacterPickerModal
          characters={story.characters}
          onSelectCharacterEmotion={(charId, emotion, charName) => {
            handlePatchCurrentLine({ characterId: charId, emotion });
            setShowCharacterPicker(false);
            playSfx('/assets/sfx/click interface.mp3', true, 0.3);
            notify(`Selected: ${charName || 'Character'}`);
          }}
          onClose={() => setShowCharacterPicker(false)}
        />
      )}

      {/* 2. AGREGAR ACCIÓN A LA LÍNEA DE TIEMPO */}
      {showAddActionModal && (
        <AddActionModal
          story={story}
          currentScene={currentScene}
          onInsertEvent={(type, customPayload) => {
            handleInsertEvent(type, customPayload);
          }}
          onClose={() => setShowAddActionModal(false)}
        />
      )}

      {/* 3. MAPA NARRATIVO Y BIFURCACIONES */}
      {activeGlobalModal === 'scene_map' && (
        <SceneMapModal
          story={story}
          currentChapterId={selectedChapterId}
          selectedSceneId={selectedSceneId}
          onSelectScene={(sceneId) => {
            handleSelectScene(sceneId);
            setCurrentWorkspace('story_tool');
            setActiveGlobalModal(null);
          }}
          onUpdateStory={(updatedStory) => {
            setStory(updatedStory);
            saveActiveStory(updatedStory);
          }}
          onClose={() => {
            setCurrentWorkspace('story_tool');
            setActiveGlobalModal(null);
          }}
          notify={notify}
        />
      )}

      {/* 4. MENU GAME TOOL (SISTEMA DE PANTALLAS DE MENÚ) */}
      {activeGlobalModal === 'menu_tool' && (
        <MenuGameToolModal
          story={story}
          onSelectScene={(sceneId) => {
            handleSelectScene(sceneId);
            setCurrentWorkspace('story_tool');
            setActiveGlobalModal(null);
          }}
          onUpdateStory={(updatedStory) => {
            setStory(updatedStory);
            saveActiveStory(updatedStory);
          }}
          onClose={() => setActiveGlobalModal(null)}
          notify={notify}
        />
      )}

      {/* 5. STUDIO DE ESCENARIOS */}
      {activeGlobalModal === 'scenes' && currentChapter && (
        <SceneStudioModal
          story={story}
          currentChapterId={selectedChapterId}
          selectedSceneId={selectedSceneId}
          onSelectScene={(scId) => {
            setSelectedSceneId(scId);
            setSelectedLineIndex(0);
            setCurrentWorkspace('story_tool');
            setActiveGlobalModal(null);
          }}
          onUpdateStory={(updatedStory) => {
            setStory(updatedStory);
            saveActiveStory(updatedStory);
          }}
          onClose={() => setActiveGlobalModal(null)}
          notify={notify}
        />
      )}

      {/* 6. GESTOR DE PROYECTOS */}
      {activeGlobalModal === 'projects' && (
        <ProjectStudioModal
          currentStory={story}
          onSelectProject={(newStory) => {
            setStory(newStory);
            saveActiveStory(newStory);
            if (typeof window !== 'undefined' && newStory?.id) {
              localStorage.setItem('vn_active_project_id', newStory.id);
            }
            if (newStory.chapters && newStory.chapters.length > 0) {
              const firstChap = newStory.chapters[0];
              setSelectedChapterId(firstChap.id);
              if (firstChap.scenes && firstChap.scenes.length > 0) {
                setSelectedSceneId(firstChap.scenes[0].id);
                setSelectedLineIndex(0);
              }
            }
          }}
          onClose={() => setActiveGlobalModal(null)}
          notify={notify}
        />
      )}

      {/* 7. SELECTOR MODAL DE ASSET (MODO PICKER) */}
      {assetPickerConfig && (
        <AssetStudioModal
          story={story}
          filterType={assetPickerConfig.filterType}
          initialFontSample={assetPickerConfig.initialFontSample}
          previewBackgroundUrl={assetPickerConfig.previewBackgroundUrl}
          onSelectAsset={(asset) => {
            assetPickerConfig.onSelect(asset.url, asset.name);
            setStory((prev) => {
              const currentCustom = prev.customAssets || [];
              const exists = currentCustom.some((a) => a.url === asset.url);
              if (!exists && asset.origin === 'user') {
                const nextCustom = [...currentCustom, asset];
                const updated = { ...prev, customAssets: nextCustom };
                saveActiveStory(updated);
                return updated;
              }
              return prev;
            });
            setAssetPickerConfig(null);
            notify(asset.url ? `Asset assigned: ${asset.name}` : 'Asset unassigned');
          }}
          onUpdateStoryCustomAssets={(updatedAssets) => {
            const updatedStory = { ...story, customAssets: updatedAssets };
            setStory(updatedStory);
            saveActiveStory(updatedStory);
          }}
          onClose={() => setAssetPickerConfig(null)}
          notify={notify}
        />
      )}

      {/* 8. STUDIO DE BOTONES E INTERACCIONES (HOTSPOTS) */}
      {showHotspotStudio && currentChapter && currentScene && (
        <HotspotStudioModal
          story={story}
          currentChapter={currentChapter}
          currentScene={currentScene}
          initialHotspotId={editingHotspotId}
          onUpdateHotspots={(updatedHotspots) => {
            handleUpdateCurrentScene('hotspots', updatedHotspots);
            handleUpdateCurrentScene('enableHotspots', true);
          }}
          onUpdateSceneDisplayMode={(mode) => {
            handleUpdateCurrentScene('hotspotsDisplayMode', mode);
          }}
          onClose={() => {
            setShowHotspotStudio(false);
            setEditingHotspotId(null);
          }}
          notify={notify}
        />
      )}

      {/* 9. MODAL DE AUDIO DEL ESCENARIO */}
      {showSceneAudioModal && currentScene && (
        <SceneAudioModal
          scene={currentScene}
          story={story}
          onUpdateScene={handlePatchCurrentScene}
          onClose={() => setShowSceneAudioModal(false)}
          notify={notify}
        />
      )}
    </>
  );
}
