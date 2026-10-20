"use client";
import React from 'react';

interface AudioWaveformVisualizerProps {
  peaks?: number[];
  color?: string;
  className?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  peaks = [],
  color = 'rgba(251, 191, 36, 0.55)', // warm amber
  className = '',
}) => {
  if (!peaks || peaks.length === 0) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-around pointer-events-none px-1 overflow-hidden opacity-75 ${className}`}>
      {peaks.map((peak, idx) => (
        <div
          key={idx}
          style={{
            height: `${Math.max(15, Math.min(95, peak * 100))}%`,
            backgroundColor: color,
          }}
          className="w-[2px] rounded-full mx-[0.5px] transition-all"
        />
      ))}
    </div>
  );
};
