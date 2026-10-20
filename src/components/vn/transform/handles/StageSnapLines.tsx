"use client";
import React from 'react';
import { createPortal } from 'react-dom';

export interface StageSnapLinesProps {
  stageRef: React.RefObject<HTMLDivElement | null>;
  snapGuideX: boolean;
  snapGuideY: boolean;
  snapGuideXPercent?: number;
  snapGuideYPercent?: number;
}

/**
 * Stage-wide laser alignment crosshairs rendered directly into stage via React Portal.
 */
export const StageSnapLines: React.FC<StageSnapLinesProps> = ({
  stageRef,
  snapGuideX,
  snapGuideY,
  snapGuideXPercent = 50,
  snapGuideYPercent = 50,
}: StageSnapLinesProps) => {
  if (
    typeof window === 'undefined' ||
    !stageRef?.current ||
    (!snapGuideX && !snapGuideY)
  ) {
    return null;
  }

  return createPortal(
    <div className="absolute inset-0 pointer-events-none z-[75]">
      {snapGuideX && (
        <div
          className="absolute top-0 bottom-0 w-[1.5px] -translate-x-1/2 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.95)]"
          style={{ left: `${snapGuideXPercent}%` }}
        />
      )}
      {snapGuideY && (
        <div
          className="absolute left-0 right-0 h-[1.5px] -translate-y-1/2 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.95)]"
          style={{ top: `${snapGuideYPercent}%` }}
        />
      )}
    </div>,
    stageRef.current
  );
};
