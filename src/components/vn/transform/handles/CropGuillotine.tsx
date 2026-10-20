"use client";
import React from 'react';
import { VNTransformCrop, VNTransformHandleType } from '../types';

export interface CropGuillotineProps {
  crop: VNTransformCrop;
  containerRef: React.RefObject<HTMLDivElement | null>;
  startTransform: (e: React.PointerEvent, handle: VNTransformHandleType, el: HTMLElement) => void;
}

/**
 * Crop Guillotine:
 * Renders darkened cutoff masks, active crop frame with rule of thirds grid,
 * and guillotine corner & edge drag handles.
 */
export const CropGuillotine: React.FC<CropGuillotineProps> = ({
  crop,
  containerRef,
  startTransform,
}) => {
  return (
    <>
      {/* 1. Darkened Cut-off Masks */}
      <div className="absolute inset-0 pointer-events-none">
        {crop.top > 0 && (
          <div
            style={{ height: `${crop.top}%` }}
            className="absolute top-0 inset-x-0 bg-black/60 border-b border-amber-400/40"
          />
        )}
        {crop.bottom > 0 && (
          <div
            style={{ height: `${crop.bottom}%` }}
            className="absolute bottom-0 inset-x-0 bg-black/60 border-t border-amber-400/40"
          />
        )}
        {crop.left > 0 && (
          <div
            style={{
              top: `${crop.top}%`,
              bottom: `${crop.bottom}%`,
              width: `${crop.left}%`,
            }}
            className="absolute left-0 bg-black/60 border-r border-amber-400/40"
          />
        )}
        {crop.right > 0 && (
          <div
            style={{
              top: `${crop.top}%`,
              bottom: `${crop.bottom}%`,
              width: `${crop.right}%`,
            }}
            className="absolute right-0 bg-black/60 border-l border-amber-400/40"
          />
        )}

        {/* 2. Active Crop Frame Border with Rule of Thirds Grid */}
        <div
          style={{
            top: `${crop.top}%`,
            right: `${crop.right}%`,
            bottom: `${crop.bottom}%`,
            left: `${crop.left}%`,
          }}
          className="absolute border border-amber-400/90 pointer-events-none"
        >
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
            <div className="border-r border-amber-300" />
            <div className="border-r border-amber-300" />
            <div />
            <div className="border-r border-amber-300 border-t" />
            <div className="border-r border-amber-300 border-t" />
            <div className="border-t border-amber-300" />
            <div className="border-r border-amber-300 border-t" />
            <div className="border-r border-amber-300 border-t" />
            <div className="border-t border-amber-300" />
          </div>
        </div>
      </div>

      {/* 3. Crop Corner Handles */}
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-tl', containerRef.current)}
        style={{
          top: `${crop.top}%`,
          left: `${crop.left}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute w-5 h-5 border-t-4 border-l-4 border-amber-400 cursor-nwse-resize pointer-events-auto z-40 touch-none shadow-md"
        title="Crop Top-Left"
      />
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-tr', containerRef.current)}
        style={{
          top: `${crop.top}%`,
          left: `${100 - crop.right}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute w-5 h-5 border-t-4 border-r-4 border-amber-400 cursor-nesw-resize pointer-events-auto z-40 touch-none shadow-md"
        title="Crop Top-Right"
      />
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-bl', containerRef.current)}
        style={{
          top: `${100 - crop.bottom}%`,
          left: `${crop.left}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute w-5 h-5 border-b-4 border-l-4 border-amber-400 cursor-nesw-resize pointer-events-auto z-40 touch-none shadow-md"
        title="Crop Bottom-Left"
      />
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-br', containerRef.current)}
        style={{
          top: `${100 - crop.bottom}%`,
          left: `${100 - crop.right}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute w-5 h-5 border-b-4 border-r-4 border-amber-400 cursor-nwse-resize pointer-events-auto z-40 touch-none shadow-md"
        title="Crop Bottom-Right"
      />

      {/* 4. Crop Edge Bars */}
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-t', containerRef.current)}
        style={{
          top: `${crop.top}%`,
          left: `${crop.left}%`,
          right: `${crop.right}%`,
          transform: 'translateY(-50%)',
        }}
        className="absolute h-2.5 bg-amber-400/90 cursor-ns-resize pointer-events-auto rounded z-40 touch-none shadow-sm hover:h-3.5 transition-all"
        title="Crop Top Edge"
      />
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-b', containerRef.current)}
        style={{
          top: `${100 - crop.bottom}%`,
          left: `${crop.left}%`,
          right: `${crop.right}%`,
          transform: 'translateY(-50%)',
        }}
        className="absolute h-2.5 bg-amber-400/90 cursor-ns-resize pointer-events-auto rounded z-40 touch-none shadow-sm hover:h-3.5 transition-all"
        title="Crop Bottom Edge"
      />
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-l', containerRef.current)}
        style={{
          left: `${crop.left}%`,
          top: `${crop.top}%`,
          bottom: `${crop.bottom}%`,
          transform: 'translateX(-50%)',
        }}
        className="absolute w-2.5 bg-amber-400/90 cursor-ew-resize pointer-events-auto rounded z-40 touch-none shadow-sm hover:w-3.5 transition-all"
        title="Crop Left Edge"
      />
      <div
        onPointerDown={(e) => containerRef.current && startTransform(e, 'crop-r', containerRef.current)}
        style={{
          left: `${100 - crop.right}%`,
          top: `${crop.top}%`,
          bottom: `${crop.bottom}%`,
          transform: 'translateX(-50%)',
        }}
        className="absolute w-2.5 bg-amber-400/90 cursor-ew-resize pointer-events-auto rounded z-40 touch-none shadow-sm hover:w-3.5 transition-all"
        title="Crop Right Edge"
      />
    </>
  );
};
