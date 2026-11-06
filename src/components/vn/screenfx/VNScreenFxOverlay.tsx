'use client';

import React from 'react';
import { VNScreenFxOverlayProps } from './types';
import { SCREEN_FX_REGISTRY } from './registry';
import { getGameSettings } from '@/lib/vn/gameSettings';

export const VNScreenFxOverlay: React.FC<VNScreenFxOverlayProps> = ({
  fxType = 'red_alert',
  intensity = 'medium',
  color,
  animation,
  flashlightMode,
  flashlightRadius,
  flashlightShutdown,
  flashlightHitsRequired,
  onFlashlightReactivated,
  fadeInSeconds = 1,
  fadeOutSeconds = 1,
  isFadingOut = false,
  customWords,
  params,
}) => {
  const [graphicsQuality, setGraphicsQuality] = React.useState<'high' | 'performance'>('high');

  React.useEffect(() => {
    const handleSync = () => {
      setGraphicsQuality(getGameSettings().graphicsQuality);
    };
    handleSync();
    window.addEventListener('vn_game_settings_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('vn_game_settings_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const baseMultiplier =
    typeof params?.intensityMultiplier === 'number'
      ? params.intensityMultiplier
      : intensity === 'light'
      ? 0.6
      : intensity === 'heavy'
      ? 1.3
      : 1.0;

  const intensityMultiplier = graphicsQuality === 'performance'
    ? Math.min(baseMultiplier * 0.75, 0.9)
    : baseMultiplier;

  const duration = isFadingOut ? fadeOutSeconds : fadeInSeconds;

  const fxDef = SCREEN_FX_REGISTRY[fxType];
  const Component = fxDef?.component;

  return (
    <div
      className={`absolute inset-0 overflow-hidden transition-opacity ${
        flashlightShutdown ? 'pointer-events-auto z-40' : 'pointer-events-none z-35'
      }`}
      style={{
        opacity: isFadingOut ? 0 : 1,
        transitionDuration: `${Math.max(0.1, duration)}s`,
        transitionTimingFunction: 'ease-in-out',
      }}
    >
      {Component && (
        <Component
          intensityMultiplier={intensityMultiplier}
          intensity={intensity}
          color={color}
          animation={animation}
          flashlightMode={flashlightMode}
          flashlightRadius={flashlightRadius}
          flashlightShutdown={flashlightShutdown}
          flashlightHitsRequired={flashlightHitsRequired}
          onFlashlightReactivated={onFlashlightReactivated}
          customWords={customWords}
          params={params}
        />
      )}
    </div>
  );
};
