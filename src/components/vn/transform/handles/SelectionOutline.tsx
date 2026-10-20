"use client";
import React from 'react';

export interface SelectionOutlineProps {
  isCropMode: boolean;
  isMoving: boolean;
  is3DMode: boolean;
  isLocked?: boolean;
}

/**
 * SVG non-scaling crisp selection outline.
 * Always renders exactly 1.5px on screen regardless of object scale.
 */
export const SelectionOutline: React.FC<SelectionOutlineProps> = ({
  isCropMode,
  isMoving,
  is3DMode,
  isLocked = false,
}) => {
  const strokeColor = isLocked
    ? '#f59e0b'
    : isCropMode
    ? '#fbbf24'
    : isMoving
    ? '#22d3ee'
    : is3DMode
    ? '#c084fc'
    : '#22d3ee';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible rounded">
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx="4"
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeDasharray={isLocked ? '4 4' : isCropMode || isMoving ? '6 4' : 'none'}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
