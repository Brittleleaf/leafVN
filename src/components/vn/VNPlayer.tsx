'use client';
import React, { useState, useEffect } from 'react';
import {
  VNStory,
  VNChapter,
  VNScene,
  VNEvent,
  VNGameState,
  VNHotspot,
  VNSaveSlot,
  VNChoiceOption,
  VNChoiceReaction,
  VNPosition,
  VNScreenFxType,
  VNCursorType,
} from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { evaluateCondition, getCharacterAvatar, interpolateText } from '@/lib/vn/engineUtils';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { VNScreenFxOverlay } from './VNScreenFxOverlay';
import { VNTransitionOverlay } from './transitions';
import { VNTextBoxRenderer } from './textboxes';
import { resolveEffectiveFontFamily } from '@/lib/vn/fontCatalog';
import { getButtonHoverEffectClass } from '@/lib/vn/buttonHoverEffects';
import StaticScreenView from './StaticScreenView';
import CinematicPlayerView from './CinematicPlayerView';
import { VNCursorLayer } from './cursors';
import { useVNPlayer } from '@/lib/vn/useVNPlayer';
import VNUniversalButton from './ui/VNUniversalButton';
import { isVideoMedia } from './cinematic/layers/CinematicVisualLayer';

interface VNPlayerProps {
  story: VNStory;
  initialSaveState?: VNGameState;
  onExit?: () => void;
  onOpenEditor?: () => void;
}

export default function VNPlayer({ story, initialSaveState, onExit, onOpenEditor }: VNPlayerProps) {
  const {
    currentChapterId,
    currentSceneId,
    eventIndex,
    variablesState,
    history,
    isHotspotMode,
    isStoryCompleted,
    pendingReaction,
    displayedText,
    isTyping,
    autoMode,
    skipMode,
    showHistoryModal,
    showSaveLoadModal,
    showVariablesHud,
    saveSlots,
    consumedHotspots,
    onStageCharacters,
    customSceneBg,
    inspectionBanner,
    activeInspection,
    isTextBoxVisible,
    loadingScreen,
    shakeClass,
    flashColor,
    isFlashlightShutdownActive,
    activeScreenFx,
    currentChapter,
    currentScene,
    currentEvent,
    currentSpeaker,
    activeReaction,
    activeEmotion,
    activeAvatarUrl,
    activeCursorType,
    advanceEvent,
    advanceToNextScene,
    jumpToScene,
    handleSelectChoice,
    handleHotspotClick,
    handleRetryPrevious,
    handleRestartStory,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleDeleteSlot,
    handleCloseTextBox,
    setAutoMode,
    setSkipMode,
    setShowHistoryModal,
    setShowSaveLoadModal,
    setShowVariablesHud,
    setIsTextBoxVisible,
    setIsFlashlightShutdownActive,
    playerContainerRef,
    historyBottomRef,
  } = useVNPlayer({ story, initialSaveState, onExit });

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Active Scene & Event Transition Animation
  const [activeTransition, setActiveTransition] = useState<string | null>(null);

  useEffect(() => {
    if (currentEvent?.transition && currentEvent.transition !== 'instant') {
      setActiveTransition(currentEvent.transition);
      const timer = setTimeout(() => {
        setActiveTransition(null);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [currentEvent?.id, currentScene?.id, currentEvent?.transition]);

  // Computed character staging & docking in player
  const isPlayerCustomPlaced =
    Number.isFinite(currentEvent?.characterXPercent) &&
    Number.isFinite(currentEvent?.characterYPercent);
  const playerSlot = currentEvent?.characterPosition || 'left';
  const isPlayerTextBoxRendered =
    !isStoryCompleted &&
    isTextBoxVisible &&
    (currentEvent?.type === 'dialogue' || Boolean(activeInspection) || Boolean(pendingReaction));

  return (
    <div ref={playerContainerRef} className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden select-none font-typewriter">
      {/* Dynamic Cursor Layer (StaticScreenView handles its own internal cursor layer) */}
      {(currentScene?.sceneType !== 'event' || currentScene?.eventSubtype !== 'static') && (
        <VNCursorLayer cursorType={activeCursorType} containerRef={playerContainerRef} />
      )}

      {/* 16:9 ASPECT-RATIO LOCKED GAME STAGE */}
      <div
        className="relative shadow-2xl overflow-hidden bg-black shrink-0"
        style={{
          width: 'min(100vw, calc(100vh * 16 / 9))',
          height: 'min(100vh, calc(100vw * 9 / 16))',
          aspectRatio: '16 / 9',
          containerType: 'size',
        }}
      >
        {/* EVENT SCENARIOS: STATIC SCREEN OR CINEMATIC SEQUENCER */}
        {currentScene?.sceneType === 'event' && currentScene?.eventSubtype === 'static' ? (
          <StaticScreenView
            scene={currentScene}
            isInteractive={true}
            onNextScene={advanceToNextScene}
            onRetry={handleRetryPrevious}
            onLoadGame={() => {
              setShowSaveLoadModal('load');
            }}
            onMainMenu={() => {
              if (onExit) onExit();
              else handleRestartStory();
            }}
            onJumpScene={(targetId) => {
              const jumped = jumpToScene(targetId, 0);
              if (!jumped) {
                console.warn(`[VNPlayer] StaticScreen jump failed for scene "${targetId}". Advancing to next scene.`);
                advanceToNextScene();
              }
            }}
          />
        ) : currentScene?.sceneType === 'event' && currentScene?.eventSubtype === 'cinematic' ? (
          <CinematicPlayerView
            scene={currentScene}
            isInteractive={true}
            onComplete={() => {
              if (currentScene.cinematicConfig?.targetSceneIdOnEnd) {
                const jumped = jumpToScene(currentScene.cinematicConfig.targetSceneIdOnEnd, 0);
                if (!jumped) advanceToNextScene();
              } else {
                advanceToNextScene();
              }
            }}
            onSkip={() => {
              if (currentScene.cinematicConfig?.targetSceneIdOnEnd) {
                const jumped = jumpToScene(currentScene.cinematicConfig.targetSceneIdOnEnd, 0);
                if (!jumped) advanceToNextScene();
              } else {
                advanceToNextScene();
              }
            }}
          />
        ) : (
          <>
            {/* 1. CAPA DE FONDO DEL ESCENARIO */}
            {(() => {
              const bgUrl = customSceneBg || currentScene?.backgroundUrl;
              const isVideo = isVideoMedia(bgUrl);
              return (
                <div
                  onClick={() => {
                    const activeHotspots = (currentScene?.hotspots || []).filter((hs) => !(hs.interactionLimit === 'once' && consumedHotspots.includes(hs.id)));
                    const canAdvanceExploration = isHotspotMode && activeHotspots.length === 0;
                    if ((!isHotspotMode || canAdvanceExploration) && currentEvent?.type !== 'choice' && (isTextBoxVisible || canAdvanceExploration)) {
                      advanceEvent();
                    }
                  }}
                  className={`absolute inset-0 bg-cover bg-center overflow-hidden transition-all duration-700 ${shakeClass} ${
                    (!isHotspotMode || (isHotspotMode && (currentScene?.hotspots || []).filter((hs) => !(hs.interactionLimit === 'once' && consumedHotspots.includes(hs.id))).length === 0)) && currentEvent?.type !== 'choice' && isTextBoxVisible ? 'cursor-pointer' : ''
                  }`}
                  style={{
                    backgroundImage: (!isVideo && bgUrl)
                      ? `url("${bgUrl.replace(/"/g, '\\"')}")`
                      : 'none',
                    filter:
                      activeScreenFx?.fxType === 'liquid_distortion'
                        ? 'url(#liquid)'
                        : activeScreenFx?.fxType === 'retro_pixelate'
                        ? (activeScreenFx?.params?.pixelSize === 0 ? 'url(#retro_pixelate_color)' : 'url(#retro_pixelate_tile)')
                        : undefined,
                  }}
                >
                  {isVideo && bgUrl && (
                    <video
                      src={bgUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50 pointer-events-none" />
                </div>
              );
            })()}

            {/* 1.1 CAPA DE TRANSICIÓN MODULAR DE ESCENA */}
            {activeTransition && (
              <VNTransitionOverlay
                transitionId={activeTransition}
                isActive={true}
              />
            )}

            {/* 2. CAPA DE EFECTOS DE FLASH / IMPACTO */}
            {flashColor && (
              <div
                className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-300"
          style={{ backgroundColor: flashColor }}
        />
      )}

      {/* 2.1 CAPA DE EFECTO AMBIENTAL CONTINUO EN BUCLE (SCREEN FX) */}
      {activeScreenFx && (
        <VNScreenFxOverlay
          fxType={activeScreenFx.fxType}
          intensity={activeScreenFx.intensity}
          color={activeScreenFx.color}
          animation={activeScreenFx.animation}
          customWords={activeScreenFx.customWords}
          flashlightMode={activeScreenFx.flashlightMode}
          flashlightRadius={activeScreenFx.flashlightRadius}
          flashlightShutdown={isFlashlightShutdownActive}
          flashlightHitsRequired={activeScreenFx.flashlightHitsRequired || 3}
          onFlashlightReactivated={() => {
            setIsFlashlightShutdownActive(false);
          }}
          fadeInSeconds={activeScreenFx.fadeInSeconds}
          fadeOutSeconds={activeScreenFx.fadeOutSeconds}
          isFadingOut={activeScreenFx.isFadingOut}
          params={activeScreenFx.params}
        />
      )}

      {/* 3. CAPA DE BOTONES DE NAVEGACIÓN Y HOTSPOTS */}
      {((isHotspotMode || currentScene?.hotspotsDisplayMode === 'always') && currentScene?.hotspots && !isStoryCompleted && currentEvent?.type !== 'choice') && (() => {
        const activeHotspots = currentScene.hotspots.filter((hs) => !(hs.interactionLimit === 'once' && consumedHotspots.includes(hs.id)));
        const allConsumed = isHotspotMode && activeHotspots.length === 0;

        return (
          <div className="absolute inset-0 z-20">
            {isHotspotMode && (
              <div
                onClick={allConsumed ? advanceEvent : undefined}
                className={`absolute top-16 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-xs uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all ${
                  allConsumed
                    ? 'bg-amber-950/85 border border-amber-500/60 text-amber-300 pointer-events-auto cursor-pointer animate-bounce hover:bg-amber-900/90'
                    : 'bg-black/85 border border-sky-500/60 text-sky-400 pointer-events-none animate-pulse'
                }`}
              >
                {allConsumed
                  ? '[ EXPLORATION COMPLETE: CLICK HERE OR ADVANCE TO CONTINUE ]'
                  : '[ EXPLORATION MODE ACTIVE: CLICK ON INTERACTION POINTS ]'}
              </div>
            )}

            {activeHotspots.map((hs) => {
            const isConditionMet = evaluateCondition(hs.condition, variablesState);
            const interpolatedLabel = interpolateText(hs.label, variablesState);
            const iconSize = hs.iconSize || 64;
            const iconUrl = hs.icon || (hs.style === 'door' ? GUI_ICONS.action.entryDoor : hs.style === 'terminal' ? GUI_ICONS.action.usable : GUI_ICONS.action.search);
            const hsX = Number.isFinite(hs.xPercent) ? (hs.xPercent as number) : 50;
            const hsY = Number.isFinite(hs.yPercent) ? (hs.yPercent as number) : 50;
            const hsRot = Number.isFinite(hs.rotation) ? (hs.rotation as number) : 0;
            const hsScale = Number.isFinite(hs.scale) ? (hs.scale as number) : 1;
            
            return (
              <button
                key={hs.id}
                onClick={() => handleHotspotClick(hs)}
                style={{
                  left: `${hsX}%`,
                  top: `${hsY}%`,
                  transform: `translate(-50%, -50%) rotate(${hsRot}deg) scale(${
                    hsScale * (hs.flipX ? -1 : 1)
                  }, ${hsScale})`,
                  transformOrigin: '50% 50%',
                }}
                className="absolute group flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 focus:outline-none z-20 select-none bg-transparent border-0 p-0"
              >
                {/* SVG Puro sin fondo ni contenedor */}
                <div
                  className={`relative flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-active:scale-95 ${
                    !isConditionMet
                      ? 'opacity-60 grayscale filter contrast-125'
                      : 'filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] group-hover:drop-shadow-[0_0_24px_rgba(56,189,248,0.9)]'
                  }`}
                  style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                  }}
                >
                  <GuiIconRenderer
                    icon={iconUrl}
                    className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  />

                  {/* Candado de seguridad discreto si está bloqueado */}
                  {!isConditionMet && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-950/90 border border-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-3.5 h-3.5 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Texto limpio sin fondo de caja */}
                <div className="mt-1 flex flex-col items-center pointer-events-none transition-all duration-200 opacity-90 group-hover:opacity-100 group-hover:scale-105">
                  <span className="text-[11px] font-bold tracking-wider text-white uppercase filter drop-shadow-[0_2px_6px_rgba(0,0,0,1)] group-hover:text-sky-300 transition-colors">
                    {interpolatedLabel}
                  </span>
                  {hs.condition && !isConditionMet && (
                    <span className="text-[9px] text-red-400 font-mono tracking-tighter mt-0.5 px-1 bg-black/80 rounded border border-red-900/60 shadow">
                      [REQ: {hs.condition.variableKey}]
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        );
      })()}

      {/* 4. CAPA DE ACTORES / PERSONAJES EN ESCENA (MULTI-STAGING & UNIVERSAL CONTINUOUS STAGING) */}
      {/* 4.1 Custom Free-Placed Character Sprite (ONLY when dialogue is active, textbox is rendered, and showAvatar is enabled) */}
      {isPlayerCustomPlaced && isPlayerTextBoxRendered && activeAvatarUrl && (story.textBoxConfig.showAvatar !== false) && (() => {
        const charX = Number.isFinite(currentEvent?.characterXPercent) ? currentEvent.characterXPercent! : 50;
        const charY = Number.isFinite(currentEvent?.characterYPercent) ? currentEvent.characterYPercent! : 80;
        const charRot = Number.isFinite(currentEvent?.characterRotation) ? currentEvent.characterRotation! : 0;
        const charScale = Number.isFinite(currentEvent?.characterScale)
          ? currentEvent.characterScale!
          : (Number.isFinite(currentSpeaker?.defaultScale) ? currentSpeaker!.defaultScale! : 1);

        return (
          <div className="absolute inset-0 pointer-events-none z-32 overflow-hidden">
            <div
              className="absolute flex flex-col items-center transition-all duration-300 select-none pointer-events-none"
              style={{
                left: `${charX}%`,
                top: `${charY}%`,
                transform: `translate(-50%, -100%) rotate(${charRot}deg) scale(${charScale})`,
                transformOrigin: '50% 100%',
              }}
            >
              <img
                src={activeAvatarUrl}
                alt={currentSpeaker?.name || 'Character'}
                style={{
                  borderColor: activeInspection?.speakerColor || currentSpeaker?.textBoxConfig?.borderColor || currentSpeaker?.color || '#ef4444',
                  transform: currentEvent?.characterFlipX ? 'scaleX(-1)' : undefined,
                }}
                className="h-[54cqh] max-h-[56cqh] aspect-[3/4] w-auto object-cover rounded-t-2xl border-2 shadow-[0_0_35px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>
        );
      })()}

      {/* 4.3 Multi-Character Staged Background Actors */}
      {Object.keys(onStageCharacters).length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-32 flex items-end justify-between px-16 pb-36">
          {/* Lado izquierdo */}
          <div className="flex items-end gap-4 min-w-[220px]">
            {Object.entries(onStageCharacters)
              .filter(([charId, data]) => data.position === 'left' && (charId !== currentSpeaker?.id || !isPlayerTextBoxRendered))
              .map(([charId, data]) => {
                const char = story.characters.find((c) => c.id === charId);
                if (!char) return null;
                const isSpeaking = currentSpeaker?.id === charId;
                const avatar = getCharacterAvatar(char, isSpeaking ? activeEmotion : data.emotion);
                if (!avatar) return null;
                return (
                  <div
                    key={charId}
                    className={`transition-all duration-300 flex flex-col items-center ${
                      isSpeaking
                        ? 'scale-105 opacity-100 z-20'
                        : 'scale-95 opacity-60 brightness-75 z-10'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={char.name}
                      style={{
                        borderColor: char.textBoxConfig?.borderColor || char.color || '#ef4444',
                        transform: char.defaultScale ? `scale(${char.defaultScale})` : undefined,
                        transformOrigin: '50% 100%',
                      }}
                      className="h-[54cqh] max-h-[56cqh] aspect-[3/4] w-auto object-cover rounded-t-2xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    />
                    {isSpeaking && (
                      <span className="mt-1 text-[10px] font-mono uppercase bg-black/85 border px-2 py-0.5 rounded shadow" style={{ borderColor: char.color || '#ef4444', color: char.color || '#ef4444' }}>
                        {char.name}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Centro */}
          <div className="flex items-end gap-4 mx-auto">
            {Object.entries(onStageCharacters)
              .filter(([charId, data]) => data.position === 'center' && (charId !== currentSpeaker?.id || !isPlayerTextBoxRendered))
              .map(([charId, data]) => {
                const char = story.characters.find((c) => c.id === charId);
                if (!char) return null;
                const isSpeaking = currentSpeaker?.id === charId;
                const avatar = getCharacterAvatar(char, isSpeaking ? activeEmotion : data.emotion);
                if (!avatar) return null;
                return (
                  <div
                    key={charId}
                    className={`transition-all duration-300 flex flex-col items-center ${
                      isSpeaking
                        ? 'scale-105 opacity-100 z-20'
                        : 'scale-95 opacity-60 brightness-75 z-10'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={char.name}
                      style={{
                        borderColor: char.textBoxConfig?.borderColor || char.color || '#a855f7',
                        transform: char.defaultScale ? `scale(${char.defaultScale})` : undefined,
                        transformOrigin: '50% 100%',
                      }}
                      className="h-[56cqh] max-h-[58cqh] aspect-[3/4] w-auto object-cover rounded-t-2xl border-2 shadow-[0_0_35px_rgba(0,0,0,0.5)]"
                    />
                    {isSpeaking && (
                      <span className="mt-1 text-[10px] font-mono uppercase bg-black/85 border px-2 py-0.5 rounded shadow" style={{ borderColor: char.color || '#a855f7', color: char.color || '#a855f7' }}>
                        {char.name}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Lado derecho */}
          <div className="flex items-end gap-4 min-w-[220px] justify-end">
            {Object.entries(onStageCharacters)
              .filter(([charId, data]) => data.position === 'right' && (charId !== currentSpeaker?.id || !isPlayerTextBoxRendered))
              .map(([charId, data]) => {
                const char = story.characters.find((c) => c.id === charId);
                if (!char) return null;
                const isSpeaking = currentSpeaker?.id === charId;
                const avatar = getCharacterAvatar(char, isSpeaking ? activeEmotion : data.emotion);
                if (!avatar) return null;
                return (
                  <div
                    key={charId}
                    className={`transition-all duration-300 flex flex-col items-center ${
                      isSpeaking
                        ? 'scale-105 opacity-100 z-20'
                        : 'scale-95 opacity-60 brightness-75 z-10'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={char.name}
                      style={{
                        borderColor: char.textBoxConfig?.borderColor || char.color || '#0284c7',
                        transform: char.defaultScale ? `scale(${char.defaultScale})` : undefined,
                        transformOrigin: '50% 100%',
                      }}
                      className="h-[54cqh] max-h-[56cqh] aspect-[3/4] w-auto object-cover rounded-t-2xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    />
                    {isSpeaking && (
                      <span className="mt-1 text-[10px] font-mono uppercase bg-black/85 border px-2 py-0.5 rounded shadow" style={{ borderColor: char.color || '#0284c7', color: char.color || '#0284c7' }}>
                        {char.name}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 5. BARRA SUPERIOR DE INFORMACIÓN Y CONTROL */}
      <header className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black via-black/80 to-transparent flex items-center justify-between text-xs tracking-widest text-gray-400">
        <div className="flex items-center gap-3">
          <span className="text-red-600 font-bold tracking-widest text-sm">[ {story.title} ]</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{currentChapter?.title}</span>
          <span className="text-gray-600">»</span>
          <span className="text-red-400/80">{currentScene?.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVariablesHud(!showVariablesHud)}
            className="px-2.5 py-1 bg-gray-900 border border-gray-700 text-amber-400 hover:text-white rounded text-xs uppercase cursor-pointer flex items-center gap-1.5"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.transform} className="w-3.5 h-3.5 text-amber-400" />
            <span>VARIABLES</span>
          </button>
          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="px-3 py-1 bg-red-950/40 hover:bg-red-900 border border-red-700 text-red-300 hover:text-white rounded transition-colors text-xs uppercase cursor-pointer flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.gear} className="w-3.5 h-3.5 text-red-400" />
              <span>EDITOR MODE</span>
            </button>
          )}
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                playerContainerRef.current?.requestFullscreen?.() || document.documentElement.requestFullscreen();
              }
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded transition-colors text-xs cursor-pointer flex items-center justify-center"
          >
            <GuiIconRenderer
              icon={isFullscreen ? GUI_ICONS.general.exitFullscreen : GUI_ICONS.general.fullscreen}
              className="w-3.5 h-3.5"
            />
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded transition-colors text-xs uppercase cursor-pointer"
            >
              [ EXIT ]
            </button>
          )}
        </div>
      </header>

      {/* HUD DE VARIABLES (FLOTANTE) */}
      {showVariablesHud && (
        <div className="absolute top-14 right-4 z-40 bg-black/90 border border-amber-600/60 p-4 rounded-lg shadow-2xl text-xs max-w-sm w-full">
          <div className="flex items-center justify-between border-b border-amber-900 pb-2 mb-3">
            <span className="font-bold text-amber-400 uppercase tracking-wider">Variables / Flags State</span>
            <button onClick={() => setShowVariablesHud(false)} className="text-gray-400 hover:text-white p-1 cursor-pointer">
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {Object.keys(variablesState).length === 0 ? (
              <p className="text-gray-500">No variables defined.</p>
            ) : (
              Object.entries(variablesState).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center bg-gray-950 p-2 rounded border border-gray-800">
                  <span className="text-gray-400 font-mono">{key}</span>
                  <span className={`font-bold font-mono ${val === true ? 'text-green-400' : val === false ? 'text-red-400' : 'text-sky-400'}`}>
                    {String(val)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. ELECCIONES CINEMÁTICAS / ROUTEVN STYLE FULL-WIDTH FLOATING BARS */}
      {!pendingReaction && currentEvent?.type === 'choice' && currentEvent.options && !isStoryCompleted && (() => {
        const isFreeLayout = currentEvent.choiceLayout === 'free' || currentEvent.options.some((opt) => opt.xPercent !== undefined);
        const allDisabled = currentEvent.options.length > 0 && currentEvent.options.every((opt) => !evaluateCondition(opt.condition, variablesState));

        const hasPromptTransform =
          currentEvent.promptXPercent !== undefined ||
          currentEvent.promptYPercent !== undefined ||
          currentEvent.promptScale !== undefined ||
          currentEvent.promptRotation !== undefined;
        const promptX = currentEvent.promptXPercent ?? 50;
        const promptY = currentEvent.promptYPercent ?? 12;
        const promptScale = currentEvent.promptScale ?? 1;
        const promptRot = currentEvent.promptRotation ?? 0;

        if (!isFreeLayout && !hasPromptTransform) {
          return (
            <div className="absolute inset-0 z-40 pointer-events-auto flex flex-col items-center justify-center p-6 animate-fade-in bg-black/40 backdrop-blur-[2px]">
              {/* Contenedor unificado para la pregunta y todas las opciones en columna */}
              <div className="flex flex-col items-center gap-3.5 w-full max-w-xl">
                {currentEvent.prompt && (
                  <div className="mb-2 px-6 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-center max-w-xl">
                    <span className="text-xs md:text-sm text-gray-200 font-medium tracking-wide">
                      {interpolateText(currentEvent.prompt, variablesState)}
                    </span>
                  </div>
                )}

                {currentEvent.options.map((option, idx) => {
                  const canSelect = evaluateCondition(option.condition, variablesState);
                  const hideContainer = option.hideContainer ?? currentEvent.choiceHideContainer ?? false;
                  const hoverEffect = option.hoverEffect || currentEvent.choiceHoverEffect || 'none';

                  return (
                    <VNUniversalButton
                      key={option.id}
                      id={option.id}
                      label={interpolateText(option.label, variablesState)}
                      sublabel={`[${idx + 1}]`}
                      style={option.style || 'cyber'}
                      size={option.size || 'md'}
                      fontFamily={option.fontFamily}
                      hoverEffect={hoverEffect}
                      hideContainer={hideContainer}
                      disabled={!canSelect}
                      widthPercent={option.widthPercent}
                      scale={option.scale ?? 1}
                      actionIcon={
                        !canSelect ? (
                          <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-3.5 h-3.5 text-gray-400" />
                        ) : undefined
                      }
                      onClick={() => handleSelectChoice(option)}
                    />
                  );
                })}

                {allDisabled && (
                  <div className="mt-4 flex flex-col items-center gap-1.5 animate-pulse">
                    <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest bg-amber-950/60 px-3 py-1 rounded border border-amber-500/30">
                      [NO OPTIONS CURRENTLY MEET CONDITIONS]
                    </span>
                    <VNUniversalButton
                      id="emergency-choice-bypass-btn"
                      label="Bypass Choice & Continue"
                      style="ghost"
                      size="sm"
                      onClick={() => {
                        handleSelectChoice({
                          id: 'auto-bypass',
                          label: 'Continue',
                          targetEventId: currentEvent.rejoinEventId,
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="absolute inset-0 z-40 pointer-events-auto animate-fade-in bg-black/40 backdrop-blur-[2px]">
            {/* Pregunta o dilema central */}
            {currentEvent.prompt && (
              <div
                style={{
                  position: 'absolute',
                  left: `${promptX}%`,
                  top: `${promptY}%`,
                  transform: `translate(-50%, -50%) rotate(${promptRot}deg) scale(${promptScale})`,
                }}
                className="z-40 px-6 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-center max-w-xl"
              >
                <span className="text-xs md:text-sm text-gray-200 font-medium tracking-wide">
                  {interpolateText(currentEvent.prompt, variablesState)}
                </span>
              </div>
            )}

            {/* Unified Choice Buttons Layout */}
            <div className="absolute inset-0 pointer-events-none">
              {currentEvent.options.map((option, idx) => {
                const canSelect = evaluateCondition(option.condition, variablesState);
                const hideContainer = option.hideContainer ?? currentEvent.choiceHideContainer ?? false;
                const hoverEffect = option.hoverEffect || currentEvent.choiceHoverEffect || 'none';

                const total = currentEvent.options?.length || 1;
                const defaultY = Math.round((50 + (idx - (total - 1) / 2) * 12) * 10) / 10;
                const x = typeof option.xPercent === 'number' && Number.isFinite(option.xPercent) ? option.xPercent : 50;
                const y = typeof option.yPercent === 'number' && Number.isFinite(option.yPercent) ? option.yPercent : defaultY;
                const rot = typeof option.rotation === 'number' && Number.isFinite(option.rotation) ? option.rotation : 0;
                const sc = typeof option.scale === 'number' && Number.isFinite(option.scale) ? option.scale : 1;

                return (
                  <VNUniversalButton
                    key={option.id}
                    id={option.id}
                    label={interpolateText(option.label, variablesState)}
                    sublabel={`[${idx + 1}]`}
                    style={option.style || 'cyber'}
                    size={option.size || 'md'}
                    fontFamily={option.fontFamily}
                    hoverEffect={hoverEffect}
                    hideContainer={hideContainer}
                    disabled={!canSelect}
                    xPercent={x}
                    yPercent={y}
                    widthPercent={option.widthPercent}
                    scale={sc}
                    scaleX={option.scaleX}
                    scaleY={option.scaleY}
                    rotation={rot}
                    actionIcon={
                      !canSelect ? (
                        <GuiIconRenderer icon={GUI_ICONS.security.lockClosed} className="w-3.5 h-3.5 text-gray-400" />
                      ) : undefined
                    }
                    onClick={() => handleSelectChoice(option)}
                  />
                );
              })}
            </div>

            {allDisabled && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-1.5 animate-pulse">
                <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest bg-amber-950/60 px-3 py-1 rounded border border-amber-500/30">
                  [NO OPTIONS CURRENTLY MEET CONDITIONS]
                </span>
                <VNUniversalButton
                  id="emergency-choice-bypass-btn-free"
                  label="Bypass Choice & Continue"
                  style="ghost"
                  size="sm"
                  onClick={() => {
                    handleSelectChoice({
                      id: 'auto-bypass',
                      label: 'Continue',
                      targetEventId: currentEvent.rejoinEventId,
                    });
                  }}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* 7. TEXT BOX ENGINE */}
      {isPlayerTextBoxRendered && (
        <div className={`absolute inset-x-[2cqw] z-30 animate-fade-in ${story.textBoxConfig.position === 'middle' ? 'top-1/2 -translate-y-1/2' : 'bottom-[2cqh]'}`}>
          {/* Docked Character Avatar pinned flush to top border of Dialogue Box */}
          {!isPlayerCustomPlaced && activeAvatarUrl && (story.textBoxConfig.showAvatar !== false) && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% - 2px)',
                left: playerSlot === 'left' ? '0px' : playerSlot === 'right' ? 'auto' : '50%',
                right: playerSlot === 'right' ? '0px' : 'auto',
                transform: `${playerSlot === 'center' ? 'translateX(-50%) ' : ''}rotate(${currentEvent?.characterRotation ?? 0}deg) scale(${
                  currentEvent?.characterScale ?? currentSpeaker?.defaultScale ?? 1
                })`,
                transformOrigin: playerSlot === 'left' ? '0% 100%' : playerSlot === 'right' ? '100% 100%' : '50% 100%',
                zIndex: 32,
              }}
              className="pointer-events-none select-none"
            >
              <img
                src={activeAvatarUrl}
                alt={currentSpeaker?.name || 'Character'}
                style={{
                  borderColor: activeInspection?.speakerColor || currentSpeaker?.textBoxConfig?.borderColor || currentSpeaker?.color || story.textBoxConfig.borderColor || '#ef4444',
                  transform: currentEvent?.characterFlipX ? 'scaleX(-1)' : undefined,
                }}
                className="h-[54cqh] max-h-[56cqh] aspect-[3/4] w-auto object-cover rounded-t-2xl border-2 shadow-[0_0_35px_rgba(0,0,0,0.5)]"
              />
            </div>
          )}

          {/* Active Modular Text Box Skin */}
          {(() => {
            const activeSkinId = currentSpeaker?.textBoxConfig?.theme || story.textBoxConfig.theme || 'classified';
            const effectiveFontSize = currentSpeaker?.textBoxConfig?.fontSize || story.textBoxConfig.fontSize || 'base';
            const fontSizeClass =
              effectiveFontSize === 'sm'
                ? 'text-xs'
                : effectiveFontSize === 'lg'
                ? 'text-sm sm:text-base'
                : 'text-xs sm:text-sm';
            const font = resolveEffectiveFontFamily({
              eventFont: currentEvent?.fontFamily,
              characterFont: currentSpeaker?.fontFamily,
              storyFont: story.defaultFontFamily,
              editorTheme: story.editorTheme,
            });

            const speakerTitle = interpolateText(
              activeInspection?.speaker || activeReaction?.speakerName || currentEvent?.customSpeakerName || currentSpeaker?.name || 'SYSTEM LOG',
              variablesState
            );

            return (
              <VNTextBoxRenderer
                skinId={activeSkinId}
                speakerName={speakerTitle}
                speakerColor={activeInspection?.speakerColor || currentSpeaker?.color || story.textBoxConfig.borderColor || '#ef4444'}
                borderColor={activeInspection?.speakerColor || currentSpeaker?.textBoxConfig?.borderColor || currentSpeaker?.color || story.textBoxConfig.borderColor || '#b91c1c'}
                backgroundColor={currentSpeaker?.textBoxConfig?.backgroundColor || story.textBoxConfig.backgroundColor || `rgba(8, 8, 12, ${currentSpeaker?.textBoxConfig?.opacity ?? story.textBoxConfig.opacity ?? 0.92})`}
                textColor={currentSpeaker?.textBoxConfig?.textColor || story.textBoxConfig.textColor || '#e5e7eb'}
                nameplateColor={activeInspection?.speakerColor || currentSpeaker?.textBoxConfig?.nameplateColor || currentSpeaker?.color || story.textBoxConfig.nameplateColor}
                badge={activeInspection?.badge || currentSpeaker?.badgeTitle}
                badgeColor={activeInspection?.speakerColor || currentSpeaker?.color}
                fontSizeClass={fontSizeClass}
                fontFamily={font}
                onAdvance={advanceEvent}
                onClose={handleCloseTextBox}
                dialogueText={
                  <span className="whitespace-pre-wrap">
                    {displayedText || (isHotspotMode ? 'Exploring area with navigation controls...' : '...')}
                  </span>
                }
              />
            );
          })()}

            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 pt-1.5 border-t border-gray-900/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  title="Toggle Auto Mode (Shortcut: A)"
                  className={`px-2 py-0.5 rounded border uppercase tracking-widest text-[10px] transition-colors cursor-pointer flex items-center gap-1 ${
                    autoMode
                      ? 'border-green-500 text-green-400 bg-green-950/30'
                      : 'border-gray-800 hover:text-white'
                  }`}
                >
                  <span>AUTO {autoMode ? 'ON' : 'OFF'}</span>
                  <span className="opacity-60 text-[8px] font-mono">[A]</span>
                </button>
                <button
                  onClick={() => setSkipMode(!skipMode)}
                  title="Toggle Skip Mode (Shortcut: Tab)"
                  className={`px-2 py-0.5 rounded border uppercase tracking-widest text-[10px] transition-colors cursor-pointer flex items-center gap-1 ${
                    skipMode
                      ? 'border-yellow-500 text-yellow-400 bg-yellow-950/30'
                      : 'border-gray-800 hover:text-white'
                  }`}
                >
                  <span>SKIP {skipMode ? 'ON' : 'OFF'}</span>
                  <span className="opacity-60 text-[8px] font-mono">[Tab]</span>
                </button>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  title="Open Dialogue History (Shortcut: H)"
                  className="px-2 py-0.5 rounded border border-gray-800 hover:text-white hover:border-gray-600 uppercase tracking-widest text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>LOG / HISTORY</span>
                  <span className="opacity-60 text-[8px] font-mono">[H]</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSaveLoadModal('save')}
                  className="px-2 py-0.5 bg-red-950/30 border border-red-900/60 hover:border-red-600 text-red-400 hover:text-white rounded uppercase tracking-widest text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3 h-3 text-red-400" />
                  <span>SAVE</span>
                </button>
                <button
                  onClick={() => setShowSaveLoadModal('load')}
                  className="px-2 py-0.5 bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white rounded uppercase tracking-widest text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3 h-3 text-gray-400" />
                  <span>LOAD</span>
                </button>
              </div>
            </div>
          </div>
      )}

      {/* Floating button to reopen dialogue if closed and story is still ongoing */}
      {!isStoryCompleted && !isTextBoxVisible && !isHotspotMode && (currentEvent?.type === 'dialogue' || Boolean(activeInspection) || Boolean(pendingReaction)) && (
        <button
          onClick={() => {
            setIsTextBoxVisible(true);
          }}
          className="absolute bottom-6 right-6 z-30 px-4 py-2.5 bg-black/85 hover:bg-black text-sky-400 hover:text-sky-300 border border-sky-500/50 hover:border-sky-400 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-300 flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer hover:scale-105"
        >
          <GuiIconRenderer icon={GUI_ICONS.action.talk} className="w-4 h-4" />
          <span>Show Dialogue</span>
        </button>
      )}
        </>
      )}
      </div>

      {/* 8. STORY COMPLETE SCREEN / DOSSIER COMPLETED */}
      {isStoryCompleted && (
        <div className="absolute inset-0 z-50 bg-[#060609]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center select-none animate-fade-in">
          <div className="max-w-xl space-y-6">
            <div className="border border-green-700/60 bg-green-950/20 px-4 py-1.5 inline-block rounded text-xs text-green-400 font-bold uppercase tracking-widest">
              [ DOSSIER COMPLETED // END OF STORY ]
            </div>

            <h2 className="text-3xl md:text-5xl text-white font-title tracking-widest drop-shadow-[0_0_25px_rgba(185,28,28,0.5)]">
              {story.title}
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed border-y border-gray-800 py-4">
              You have reached the end of all chapters recorded in this file.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleRestartStory}
                className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded uppercase tracking-widest text-xs cursor-pointer shadow-[0_0_20px_rgba(185,28,28,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <GuiIconRenderer icon={GUI_ICONS.general.refresh} className="w-4 h-4" />
                <span>RESTART FROM BEGINNING</span>
              </button>

              {onExit && (
                <button
                  onClick={onExit}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded uppercase tracking-widest text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <GuiIconRenderer icon={GUI_ICONS.action.exitDoor} className="w-4 h-4" />
                  <span>RETURN TO DOSSIER</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. LOADING SCREEN / INTERMISSION */}
      {loadingScreen?.active && (
        <div className="absolute inset-0 z-50 bg-[#060609] flex flex-col items-center justify-center p-8 select-none">
          {loadingScreen.bgUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-sm"
              style={{ backgroundImage: `url('${loadingScreen.bgUrl}')` }}
            />
          )}

          <div className="relative z-10 max-w-2xl text-center space-y-6">
            <div className="border border-red-700/50 bg-red-950/20 px-4 py-1 inline-block rounded text-xs text-red-500 font-bold uppercase tracking-widest animate-pulse">
              [ DECLASSIFICATION PROTOCOL IN PROGRESS ]
            </div>

            <h2 className="text-3xl md:text-5xl text-white font-title tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {loadingScreen.title}
            </h2>

            {loadingScreen.subtitle && (
              <p className="text-xs uppercase tracking-widest text-red-400 font-bold">
                {loadingScreen.subtitle}
              </p>
            )}

            <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-red-900/40 my-6">
              <div className="h-full bg-red-600 animate-[pulse_1.5s_infinite] w-full origin-left" />
            </div>

            {loadingScreen.loreTip && (
              <div className="border-t border-gray-800 pt-4 text-xs text-gray-400 italic">
                {loadingScreen.loreTip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. HISTORY MODAL */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-6 md:p-12 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-red-900 pb-4 mb-6">
            <h3 className="text-lg text-red-500 font-bold uppercase tracking-widest">
              [ COMMUNICATIONS LOG / HISTORY ]
            </h3>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="px-3 py-1 bg-red-900/40 hover:bg-red-800 text-white rounded text-xs uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
              <span>CLOSE</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-4">
            {history.length === 0 ? (
              <p className="text-gray-600 text-center py-12">No prior logs yet.</p>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="border-l-2 border-red-900/40 pl-4 py-1">
                  <span className="block text-xs font-bold uppercase tracking-widest mb-1" style={{ color: item.speakerColor }}>
                    {item.speaker}
                  </span>
                  <p className="text-gray-300 text-sm">{item.text}</p>
                </div>
              ))
            )}
            <div ref={historyBottomRef} />
          </div>
        </div>
      )}

      {/* 11. SAVE / LOAD MODAL WITH DELETE BUTTON */}
      {showSaveLoadModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-6 md:p-12 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-red-900 pb-4 mb-6">
            <h3 className="text-lg text-red-500 font-bold uppercase tracking-widest">
              [ {showSaveLoadModal === 'save' ? 'SAVE GAME' : 'LOAD GAME'} ]
            </h3>
            <button
              onClick={() => setShowSaveLoadModal(null)}
              className="px-3 py-1 bg-red-900/40 hover:bg-red-800 text-white rounded text-xs uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
              <span>CLOSE</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5, 6].map((slotNum) => {
              const existingSlot = saveSlots.find((s) => s.slotNumber === slotNum);
              return (
                <div
                  key={slotNum}
                  className="bg-[#0b0b10] border border-gray-800 hover:border-red-600 rounded-lg p-4 flex flex-col justify-between transition-colors relative"
                >
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-bold text-red-500">SLOT #{slotNum}</span>
                    <div className="flex items-center gap-2">
                      <span>{existingSlot ? existingSlot.savedAt : 'EMPTY'}</span>
                      {existingSlot && (
                        <button
                          onClick={() => handleDeleteSlot(slotNum)}
                          className="text-red-500 hover:text-red-300 p-1 cursor-pointer flex items-center justify-center"
                          title="Delete save"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {existingSlot ? (
                    <div className="space-y-2 mb-4">
                      {existingSlot.previewBg && (
                        <div
                          className="w-full h-24 bg-cover bg-center rounded border border-gray-800"
                          style={{ backgroundImage: `url('${existingSlot.previewBg}')` }}
                        />
                      )}
                      <p className="text-xs text-gray-300 font-bold truncate">{existingSlot.chapterTitle}</p>
                      <p className="text-[11px] text-gray-500 truncate">{existingSlot.sceneName}</p>
                    </div>
                  ) : (
                    <div className="w-full h-24 border border-dashed border-gray-800 rounded flex items-center justify-center text-xs text-gray-600 mb-4">
                      Empty slot
                    </div>
                  )}

                  <div>
                    {showSaveLoadModal === 'save' ? (
                      <button
                        onClick={() => handleSaveToSlot(slotNum)}
                        className="w-full py-2 bg-red-950/60 hover:bg-red-800 text-red-300 hover:text-white rounded text-xs uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        {existingSlot ? 'OVERWRITE' : 'SAVE HERE'}
                      </button>
                    ) : (
                      <button
                        onClick={() => existingSlot && handleLoadFromSlot(existingSlot)}
                        disabled={!existingSlot}
                        className={`w-full py-2 rounded text-xs uppercase tracking-widest transition-colors ${
                          existingSlot
                            ? 'bg-sky-950/60 hover:bg-sky-800 text-sky-300 hover:text-white cursor-pointer'
                            : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {existingSlot ? 'LOAD' : 'EMPTY'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
