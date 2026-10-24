"use client";
import React, { useState, useEffect, useRef } from 'react';
import { VNScene, VNStaticScreenConfig, VNStaticScreenButton } from '@/types/vn';
import { VNScreenFxOverlay } from './VNScreenFxOverlay';
import { ScreenFxSvgDefs, getSceneElementFxFilter } from './screenfx';
import { playSfx } from '@/lib/audioSettings';
import { ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import { getButtonHoverEffectClass } from '@/lib/vn/buttonHoverEffects';
import { VNTextEffectRenderer } from '@/lib/vn/textEffects';
import { VNCursorLayer } from './cursors';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { VNUniversalTransformGizmo } from './transform';
import VNUniversalButton from './ui/VNUniversalButton';
import { isVideoMedia } from './cinematic/layers/CinematicVisualLayer';
import { getProxiedImageUrl } from '@/lib/vn/mediaUtils';

interface StaticScreenViewProps {
  scene: VNScene;
  isInteractive?: boolean; // true in VNPlayer, false in VNMaker editor preview
  selectedButtonId?: string | null;
  selectedTarget?: 'title' | 'subtitle' | string | null;
  showGuides?: boolean;
  snapToGuides?: boolean;
  onSelectTarget?: (target: 'title' | 'subtitle' | string | null) => void;
  onSelectButton?: (btnId: string) => void;
  onDragButton?: (btnId: string, xPercent: number, yPercent: number) => void;
  onTransformButton?: (btnId: string, patch: Partial<VNStaticScreenButton>) => void;
  onTransformText?: (
    target: 'title' | 'subtitle',
    patch: {
      xPercent?: number;
      yPercent?: number;
      scale?: number;
      rotation?: number;
      locked?: boolean;
      text?: string;
    }
  ) => void;
  onRetry?: () => void;
  onNextScene?: () => void;
  onLoadGame?: () => void;
  onMainMenu?: () => void;
  onJumpScene?: (targetSceneId: string) => void;
}

export const DEFAULT_DEATH_CONFIG: VNStaticScreenConfig = {
  purpose: 'death',
  title: 'SIGNAL TERMINATED',
  subtitle: 'Biological and neurological signatures have ceased. No response detected.',
  titleColor: '#ef4444',
  subtitleColor: '#d1d5db',
  titleAnimation: 'pulse',
  titleFontSize: '2xl',
  subtitleFontSize: 'base',
  bgOverlayColor: 'rgba(10, 2, 4, 0.85)',
  screenFx: 'vignette',
  fxIntensity: 'heavy',
  sfxUrl: '/assets/sfx/ERROR RING.mp3',
  buttonsLayout: 'free',
  buttons: [
    {
      id: 'btn-retry',
      label: 'RETRY FROM LAST CHECKPOINT',
      action: 'retry_previous',
      style: 'danger',
      size: 'md',
      xPercent: 50,
      yPercent: 70,
    },
    {
      id: 'btn-load',
      label: 'LOAD SAVED GAME',
      action: 'load_game',
      style: 'primary',
      size: 'md',
      xPercent: 50,
      yPercent: 78,
    },
    {
      id: 'btn-title',
      label: 'RETURN TO MAIN MENU',
      action: 'main_menu',
      style: 'ghost',
      size: 'md',
      xPercent: 50,
      yPercent: 86,
    },
  ],
};

export const DEFAULT_ENDING_CONFIG: VNStaticScreenConfig = {
  purpose: 'ending',
  title: 'THE END',
  subtitle: 'Thank you for experiencing this story.',
  titleColor: '#D17BF8',
  subtitleColor: '#e5e7eb',
  titleAnimation: 'fade_in',
  titleFontSize: '3xl',
  subtitleFontSize: 'lg',
  bgOverlayColor: 'rgba(5, 5, 12, 0.8)',
  screenFx: 'cinema_grain',
  fxIntensity: 'light',
  sfxUrl: '/assets/sfx/success.mp3',
  buttonsLayout: 'free',
  buttons: [
    {
      id: 'btn-retry',
      label: 'REPLAY PREVIOUS SCENARIO',
      action: 'retry_previous',
      style: 'primary',
      size: 'lg',
      xPercent: 50,
      yPercent: 75,
    },
    {
      id: 'btn-title',
      label: 'MAIN MENU',
      action: 'main_menu',
      style: 'ghost',
      size: 'md',
      xPercent: 50,
      yPercent: 84,
    },
  ],
};

export const DEFAULT_INTRO_CONFIG: VNStaticScreenConfig = {
  purpose: 'intro',
  title: 'ACT I: THE AWAKENING',
  subtitle: 'Location: Unknown Facility — Timestamp: Redacted',
  titleColor: '#38bdf8',
  subtitleColor: '#94a3b8',
  titleAnimation: 'glitch',
  titleFontSize: '2xl',
  subtitleFontSize: 'base',
  bgOverlayColor: 'rgba(2, 6, 23, 0.85)',
  screenFx: 'cctv_monitor',
  fxIntensity: 'medium',
  sfxUrl: '/assets/sfx/start after click intro.mp3',
  buttonsLayout: 'free',
  buttons: [
    {
      id: 'btn-begin',
      label: 'ENTER SCENARIO',
      action: 'next_scene',
      style: 'primary',
      size: 'lg',
      xPercent: 50,
      yPercent: 80,
    },
  ],
};

export const DEFAULT_TITLE_CONFIG: VNStaticScreenConfig = {
  purpose: 'title',
  title: 'LEAF VISUAL NOVEL',
  subtitle: 'An interactive story created with Leaf VN Studio',
  titleColor: '#ffffff',
  subtitleColor: '#d4d4d8',
  titleAnimation: 'glow',
  titleFontSize: '3xl',
  subtitleFontSize: 'base',
  bgOverlayColor: 'rgba(0, 0, 0, 0.40)',
  screenFx: 'cinema_grain',
  fxIntensity: 'light',
  sfxUrl: '/assets/sfx/start after click intro.mp3',
  buttonsLayout: 'free',
  buttons: [
    {
      id: 'btn-new-game',
      label: 'NEW GAME',
      action: 'next_scene',
      style: 'cyber',
      size: 'lg',
      xPercent: 50,
      yPercent: 62,
    },
    {
      id: 'btn-load-game',
      label: 'LOAD GAME',
      action: 'load_game',
      style: 'glass',
      size: 'md',
      xPercent: 50,
      yPercent: 72,
    },
    {
      id: 'btn-credits',
      label: 'CREDITS',
      action: 'main_menu',
      style: 'ghost',
      size: 'sm',
      xPercent: 50,
      yPercent: 82,
    },
  ],
};

export default function StaticScreenView({
  scene,
  isInteractive = true,
  selectedButtonId,
  selectedTarget,
  showGuides = false,
  snapToGuides = true,
  onSelectTarget,
  onSelectButton,
  onDragButton,
  onTransformButton,
  onTransformText,
  onRetry,
  onNextScene,
  onLoadGame,
  onMainMenu,
  onJumpScene,
}: StaticScreenViewProps) {
  const config: VNStaticScreenConfig = scene.staticScreenConfig || DEFAULT_DEATH_CONFIG;
  const stageRef = useRef<HTMLDivElement>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);

  useEffect(() => {
    setEditingButtonId(null);
  }, [selectedButtonId, selectedTarget, scene.id]);

  // Load custom fonts into DOM if defined
  useEffect(() => {
    if (config.titleFontFamily) ensureGoogleFontLoaded(config.titleFontFamily);
    if (config.subtitleFontFamily) ensureGoogleFontLoaded(config.subtitleFontFamily);
    (config.buttons || []).forEach((b) => {
      if (b.fontFamily) ensureGoogleFontLoaded(b.fontFamily);
    });
  }, [config.titleFontFamily, config.subtitleFontFamily, config.buttons]);

  // Entrance SFX
  useEffect(() => {
    if (config.sfxUrl && isInteractive) {
      playSfx(config.sfxUrl, false, 0.8);
    }
  }, [scene.id, config.sfxUrl, isInteractive]);

  const unloadBgm = () => {
    if (bgmAudioRef.current) {
      try {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.removeAttribute('src');
        bgmAudioRef.current.load();
      } catch {}
      bgmAudioRef.current = null;
    }
  };

  // Loop BGM
  useEffect(() => {
    if (config.bgmUrl && isInteractive) {
      try {
        const audio = new Audio(config.bgmUrl);
        audio.loop = true;
        audio.volume = 0.5;
        audio.play().catch(() => {});
        bgmAudioRef.current = audio;
      } catch (e) {}
    }

    return () => {
      unloadBgm();
    };
  }, [config.bgmUrl, isInteractive]);

  const handleButtonClick = (button: VNStaticScreenButton) => {
    if (button.sfxUrl) {
      playSfx(button.sfxUrl, true, 0.5);
    } else {
      playSfx('/assets/sfx/click intro.mp3', true, 0.4);
    }

    if (!isInteractive) {
      if (onSelectButton) onSelectButton(button.id);
      return;
    }

    switch (button.action) {
      case 'next_scene':
        unloadBgm();
        if (onNextScene) onNextScene();
        else if (onRetry) onRetry();
        break;
      case 'retry_previous':
        unloadBgm();
        if (onRetry) onRetry();
        break;
      case 'load_game':
        if (onLoadGame) onLoadGame();
        break;
      case 'main_menu':
        unloadBgm();
        if (onMainMenu) onMainMenu();
        break;
      case 'jump_scene':
        unloadBgm();
        if (button.targetSceneId && onJumpScene) {
          onJumpScene(button.targetSceneId);
        }
        break;
    }
  };

  const getTitleSizeClass = (size?: string) => {
    switch (size) {
      case 'sm':
        return 'text-xl sm:text-2xl';
      case 'base':
        return 'text-2xl sm:text-3xl';
      case 'lg':
        return 'text-3xl sm:text-4xl';
      case 'xl':
        return 'text-4xl sm:text-5xl';
      case '2xl':
        return 'text-4xl sm:text-6xl md:text-7xl';
      case '3xl':
        return 'text-5xl sm:text-7xl md:text-8xl';
      default:
        return 'text-3xl sm:text-5xl md:text-6xl';
    }
  };

  const getSubtitleSizeClass = (size?: string) => {
    switch (size) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-xs sm:text-sm';
      case 'base':
        return 'text-sm sm:text-base';
      case 'lg':
        return 'text-base sm:text-lg';
      case 'xl':
        return 'text-lg sm:text-xl';
      default:
        return 'text-sm sm:text-base md:text-lg';
    }
  };

  // Transforms are handled cleanly by VNUniversalTransformGizmo

  const isFreeLayout = config.buttonsLayout !== 'stacked';
  const isTitleSelected = !isInteractive && selectedTarget === 'title';
  const isSubtitleSelected = !isInteractive && selectedTarget === 'subtitle';

  const staticScreenFxFilter = getSceneElementFxFilter({
    fxType: config.screenFx,
    intensity: config.fxIntensity || 'heavy',
  });

  return (
    <div
      ref={stageRef}
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none ${
        config.cursorType && config.cursorType !== 'default' ? 'cursor-none' : ''
      }`}
    >
      {/* SVG Filter Definitions for Static Screen Camera FX */}
      <ScreenFxSvgDefs activeFx={{ fxType: config.screenFx, intensity: config.fxIntensity || 'heavy' }} />

      {/* Custom Engine Cursor */}
      <VNCursorLayer cursorType={config.cursorType} containerRef={stageRef} />

      {/* Background photo with custom overlay color & video support */}
      {(() => {
        const bgUrl = scene.backgroundUrl;
        const isVideo = isVideoMedia(bgUrl);
        return (
          <div className="absolute inset-0 bg-cover bg-center overflow-hidden transition-all duration-700">
            {isVideo && bgUrl ? (
              <video
                src={getProxiedImageUrl(bgUrl)}
                crossOrigin="anonymous"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                style={{ filter: staticScreenFxFilter }}
              />
            ) : bgUrl ? (
              <img
                src={getProxiedImageUrl(bgUrl)}
                crossOrigin="anonymous"
                alt="Static Background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                style={{ filter: staticScreenFxFilter }}
              />
            ) : null}
          </div>
        );
      })()}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundColor: config.bgOverlayColor || 'rgba(5, 5, 12, 0.85)',
        }}
      />

      {/* Screen FX overlay if configured */}
      {config.screenFx && (
        <VNScreenFxOverlay
          fxType={config.screenFx}
          intensity={config.fxIntensity || 'heavy'}
          fadeInSeconds={0.4}
          fadeOutSeconds={0.4}
        />
      )}


      {/* Title with customizable typography, size, animation & canvas transform */}
      {config.title && (() => {
        const titleX = typeof config.titleXPercent === 'number' && Number.isFinite(config.titleXPercent) ? config.titleXPercent : 50;
        const titleY = typeof config.titleYPercent === 'number' && Number.isFinite(config.titleYPercent) ? config.titleYPercent : 28;
        const titleRot = typeof config.titleRotation === 'number' && Number.isFinite(config.titleRotation) ? config.titleRotation : 0;
        const titleScale = typeof config.titleScale === 'number' && Number.isFinite(config.titleScale) ? config.titleScale : 1;

        return (
          <div
            onPointerDown={(e) => {
              if (!isInteractive && onSelectTarget) {
                e.stopPropagation();
                onSelectTarget('title');
              }
            }}
            style={{
              position: 'absolute',
              left: `${titleX}%`,
              top: `${titleY}%`,
              transform: `translate(-50%, -50%) rotate(${titleRot}deg) scale(${titleScale})`,
              transformOrigin: 'center center',
              zIndex: 35,
            }}
            className={`pointer-events-auto ${!isInteractive ? 'cursor-pointer select-none' : ''}`}
          >
          <div className="relative px-4 py-2 rounded-xl">
            <h1
              className={`font-black tracking-wider uppercase drop-shadow-[0_5px_25px_rgba(0,0,0,0.9)] text-center ${getTitleSizeClass(
                config.titleFontSize
              )}`}
            >
              <VNTextEffectRenderer
                effectId={config.titleAnimation}
                text={config.title}
                color={config.titleColor || '#ef4444'}
                fontFamily={config.titleFontFamily}
              />
            </h1>
          </div>

          {/* Universal Gizmo attached to Title */}
          {isTitleSelected && !isInteractive && (
            <VNUniversalTransformGizmo
              target={{
                id: 'static-screen-title',
                xPercent: config.titleXPercent ?? 50,
                yPercent: config.titleYPercent ?? 28,
                scale: config.titleScale ?? 1,
                rotation: config.titleRotation ?? 0,
                locked: config.titleLocked ?? false,
                isText: true,
                text: config.title,
                textColor: config.titleColor,
                fontFamily: config.titleFontFamily,
              }}
              stageRef={stageRef}
              onUpdate={(patch) => {
                if (onTransformText) {
                  onTransformText('title', {
                    xPercent: patch.xPercent,
                    yPercent: patch.yPercent,
                    scale: patch.scale,
                    rotation: patch.rotation,
                    locked: patch.locked,
                  });
                }
              }}
              onCommitText={(newText) => {
                if (onTransformText) {
                  onTransformText('title', { text: newText });
                }
              }}
              capabilities={{
                allowCrop: false,
                allow3D: false,
                allowPivot: false,
                allowNonUniformScale: false,
              }}
              isEditor={!isInteractive}
            />
          )}
          </div>
        );
      })()}

      {/* Subtitle with customizable typography, size & canvas transform */}
      {config.subtitle && (() => {
        const subX = typeof config.subtitleXPercent === 'number' && Number.isFinite(config.subtitleXPercent) ? config.subtitleXPercent : 50;
        const subY = typeof config.subtitleYPercent === 'number' && Number.isFinite(config.subtitleYPercent) ? config.subtitleYPercent : 40;
        const subRot = typeof config.subtitleRotation === 'number' && Number.isFinite(config.subtitleRotation) ? config.subtitleRotation : 0;
        const subScale = typeof config.subtitleScale === 'number' && Number.isFinite(config.subtitleScale) ? config.subtitleScale : 1;

        return (
          <div
            onPointerDown={(e) => {
              if (!isInteractive && onSelectTarget) {
                e.stopPropagation();
                onSelectTarget('subtitle');
              }
            }}
            style={{
              position: 'absolute',
              left: `${subX}%`,
              top: `${subY}%`,
              transform: `translate(-50%, -50%) rotate(${subRot}deg) scale(${subScale})`,
              transformOrigin: 'center center',
              zIndex: 34,
            }}
            className={`pointer-events-auto ${!isInteractive ? 'cursor-pointer select-none' : ''}`}
          >
            <div className="relative px-4 py-2 rounded-xl">
              <p
                className={`max-w-xl text-gray-300 font-medium tracking-wide leading-relaxed drop-shadow-md text-center whitespace-pre-wrap ${getSubtitleSizeClass(
                  config.subtitleFontSize
                )}`}
                style={{
                  color: config.subtitleColor || '#d1d5db',
                  fontFamily: config.subtitleFontFamily
                    ? `var(--font-${config.subtitleFontFamily}), ${config.subtitleFontFamily}, sans-serif`
                    : undefined,
                }}
              >
                {config.subtitle}
              </p>
            </div>

            {/* Universal Gizmo attached to Subtitle */}
            {isSubtitleSelected && !isInteractive && (
              <VNUniversalTransformGizmo
                target={{
                  id: 'static-screen-subtitle',
                  xPercent: subX,
                  yPercent: subY,
                  scale: subScale,
                  rotation: subRot,
                  locked: config.subtitleLocked ?? false,
                  isText: true,
                  text: config.subtitle,
                  textColor: config.subtitleColor,
                  fontFamily: config.subtitleFontFamily,
                }}
                stageRef={stageRef}
                onUpdate={(patch) => {
                  if (onTransformText) {
                    onTransformText('subtitle', {
                      xPercent: patch.xPercent,
                      yPercent: patch.yPercent,
                      scale: patch.scale,
                      rotation: patch.rotation,
                      locked: patch.locked,
                    });
                  }
                }}
                onCommitText={(newText) => {
                  if (onTransformText) {
                    onTransformText('subtitle', { text: newText });
                  }
                }}
                capabilities={{
                  allowCrop: false,
                  allow3D: false,
                  allowPivot: false,
                  allowNonUniformScale: false,
                }}
                isEditor={!isInteractive}
              />
            )}
          </div>
        );
      })()}

      {/* Unified Engine Buttons (Static Screen Actions) */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {(config.buttons || []).map((btn, idx) => {
          const total = (config.buttons || []).length || 1;
          const defaultY = Math.round((70 + (idx - (total - 1) / 2) * 11) * 10) / 10;
          const x = typeof btn.xPercent === 'number' && Number.isFinite(btn.xPercent) ? btn.xPercent : 50;
          const y = typeof btn.yPercent === 'number' && Number.isFinite(btn.yPercent) ? btn.yPercent : defaultY;
          const scale = typeof btn.scale === 'number' && Number.isFinite(btn.scale) ? btn.scale : 1;
          const rotation = typeof btn.rotation === 'number' && Number.isFinite(btn.rotation) ? btn.rotation : 0;
          const isSelected = !isInteractive && (selectedTarget === btn.id || selectedButtonId === btn.id);

          return (
            <VNUniversalButton
              key={btn.id}
              id={btn.id}
              label={btn.label}
              style={btn.style || 'ghost'}
              size={btn.size || 'md'}
              hoverEffect={btn.hoverEffect}
              hideContainer={btn.hideContainer}
              fontFamily={btn.fontFamily}
              isSelected={isSelected}
              isEditingText={!isInteractive && editingButtonId === btn.id}
              onStartEditText={() => setEditingButtonId(btn.id)}
              onCommitText={(newText) => {
                if (onTransformButton) {
                  onTransformButton(btn.id, { label: newText });
                }
                setEditingButtonId(null);
              }}
              onCancelEditText={() => setEditingButtonId(null)}
              isInteractive={isInteractive}
              xPercent={x}
              yPercent={y}
              widthPercent={btn.widthPercent}
              scale={scale}
              scaleX={btn.scaleX}
              scaleY={btn.scaleY}
              rotation={rotation}
              onPointerDown={(e) => {
                if (!isInteractive && onSelectButton) {
                  e.stopPropagation();
                  onSelectButton(btn.id);
                }
              }}
              onClick={(e) => {
                if (!isInteractive && onSelectButton) {
                  e.stopPropagation();
                  if (editingButtonId !== btn.id) {
                    setEditingButtonId(null);
                  }
                  onSelectButton(btn.id);
                } else {
                  handleButtonClick(btn);
                }
              }}
            >
              {isSelected && !isInteractive && editingButtonId !== btn.id && (
                <VNUniversalTransformGizmo
                  target={{
                    id: btn.id,
                    xPercent: x,
                    yPercent: y,
                    scale: scale,
                    scaleX: btn.scaleX ?? 1,
                    scaleY: btn.scaleY ?? 1,
                    rotation: rotation,
                    locked: btn.locked ?? false,
                    widthPercent: btn.widthPercent,
                    isText: true,
                    text: btn.label,
                  }}
                  stageRef={stageRef}
                  onUpdate={(patch) => {
                    if (onTransformButton) {
                      const btnPatch: Partial<VNStaticScreenButton> = {};
                      if (patch.xPercent !== undefined) btnPatch.xPercent = patch.xPercent;
                      if (patch.yPercent !== undefined) btnPatch.yPercent = patch.yPercent;
                      if (patch.scale !== undefined) btnPatch.scale = patch.scale;
                      if (patch.scaleX !== undefined) btnPatch.scaleX = patch.scaleX;
                      if (patch.scaleY !== undefined) btnPatch.scaleY = patch.scaleY;
                      if (patch.rotation !== undefined) btnPatch.rotation = patch.rotation;
                      if (patch.locked !== undefined) btnPatch.locked = patch.locked;
                      if (patch.widthPercent !== undefined) btnPatch.widthPercent = patch.widthPercent;
                      onTransformButton(btn.id, btnPatch);
                    }
                  }}
                  onCommitText={(newText) => {
                    if (onTransformButton) {
                      onTransformButton(btn.id, { label: newText });
                    }
                  }}
                  capabilities={{
                    allowCrop: false,
                    allow3D: false,
                    allowPivot: false,
                    allowFlip: false,
                    allowLock: true,
                    allowRotate: true,
                    allowNonUniformScale: true,
                  }}
                  snapTargets={[
                    ...(config.title ? [{
                      id: 'static-screen-title',
                      xPercent: config.titleXPercent ?? 50,
                      yPercent: config.titleYPercent ?? 28,
                      widthPercent: 60,
                      heightPercent: 12,
                    }] : []),
                    ...(config.subtitle ? [{
                      id: 'static-screen-subtitle',
                      xPercent: config.subtitleXPercent ?? 50,
                      yPercent: config.subtitleYPercent ?? 40,
                      widthPercent: 40,
                      heightPercent: 8,
                    }] : []),
                    ...(config.buttons || [])
                      .filter((other) => other.id !== btn.id)
                      .map((other, oIdx) => ({
                        id: other.id,
                        xPercent: other.xPercent ?? 50,
                        yPercent: other.yPercent ?? (55 + oIdx * 10),
                        widthPercent: other.widthPercent ?? 45,
                        heightPercent: 8,
                        disableSnap: other.locked,
                      })),
                  ]}
                  isEditor={!isInteractive}
                />
              )}
            </VNUniversalButton>
          );
        })}
      </div>

      {/* Smart Alignment & Snapping Guides Overlay */}
      {!isInteractive && (
        <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
          {/* Static Reference Guides (Visible when showGuides is ON) */}
          {showGuides && (
            <>
              {/* Vertical Center Axis */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] border-l border-dashed border-cyan-400/30" />

              {/* Horizontal Center Axis */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] border-t border-dashed border-cyan-400/30" />

              {/* Subtle Rule of Thirds */}
              <div className="absolute top-0 bottom-0 left-1/3 -translate-x-1/2 w-[1px] border-l border-dotted border-white/10" />
              <div className="absolute top-0 bottom-0 left-2/3 -translate-x-1/2 w-[1px] border-l border-dotted border-white/10" />
              <div className="absolute left-0 right-0 top-1/3 -translate-y-1/2 h-[1px] border-t border-dotted border-white/10" />
              <div className="absolute left-0 right-0 top-2/3 -translate-y-1/2 h-[1px] border-t border-dotted border-white/10" />

              {/* Safe Margins (8%) */}
              <div className="absolute inset-[8%] border border-dashed border-cyan-500/15 rounded-xl" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
