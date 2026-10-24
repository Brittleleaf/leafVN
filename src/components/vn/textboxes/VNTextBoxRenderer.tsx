"use client";
import React from 'react';
import { getTextBoxSkin } from './registry';
import { VNTextBoxRenderProps } from './types';

export interface VNTextBoxRendererProps extends VNTextBoxRenderProps {
  skinId?: string;
}

export const VNTextBoxRenderer: React.FC<VNTextBoxRendererProps> = ({
  skinId,
  ...props
}) => {
  const skin = getTextBoxSkin(skinId);
  const SkinComponent = skin.component;

  return <SkinComponent {...props} />;
};
