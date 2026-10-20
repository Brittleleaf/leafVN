"use client";
import React from 'react';
import { TextEffectProps } from './types';
import { TEXT_EFFECTS_REGISTRY } from './registry';

export interface VNTextEffectRendererProps extends TextEffectProps {
  effectId?: string;
}

export const VNTextEffectRenderer: React.FC<VNTextEffectRendererProps> = ({
  effectId,
  text,
  color,
  fontFamily,
  className = '',
  style = {},
  keySeed,
  progress,
}) => {
  if (effectId && TEXT_EFFECTS_REGISTRY[effectId]) {
    const Component = TEXT_EFFECTS_REGISTRY[effectId].component;
    return (
      <Component
        text={text}
        color={color}
        fontFamily={fontFamily}
        className={className}
        style={style}
        keySeed={keySeed}
        progress={progress}
      />
    );
  }

  const fontStyle = fontFamily
    ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
    : undefined;

  return (
    <span
      className={className}
      style={{
        fontFamily: fontStyle,
        color: color || 'inherit',
        ...style,
      }}
    >
      {text}
    </span>
  );
};
