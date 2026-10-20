"use client";
import React, { useEffect, useRef, useState } from 'react';
import { VNCursorType } from '@/types/vn';
import { VN_CURSORS_MAP } from './catalog';

interface VNCursorLayerProps {
  cursorType?: VNCursorType;
  containerRef?: React.RefObject<HTMLElement | null>;
}

export const VNCursorLayer: React.FC<VNCursorLayerProps> = ({
  cursorType = 'default',
  containerRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isDown, setIsDown] = useState(false);
  const cursorNodeRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  const def = VN_CURSORS_MAP[cursorType];

  useEffect(() => {
    if (!def || cursorType === 'default') {
      setIsVisible(false);
      return;
    }

    const target = containerRef?.current || document.body;

    const updateCursor = () => {
      if (cursorNodeRef.current) {
        cursorNodeRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
      rafId.current = requestAnimationFrame(updateCursor);
    };
    rafId.current = requestAnimationFrame(updateCursor);

    const onPointerMove = (e: PointerEvent) => {
      setIsVisible(true);
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        posRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      } else {
        posRef.current = { x: e.clientX, y: e.clientY };
      }

      // Detect if hovering over clickable element
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const isClickable = !!elem?.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer');
      setIsPointer(isClickable);
    };

    const onPointerDown = () => setIsDown(true);
    const onPointerUp = () => setIsDown(false);
    const onPointerLeave = () => setIsVisible(false);
    const onPointerEnter = () => setIsVisible(true);

    target.addEventListener('pointermove', onPointerMove as EventListener, { passive: true });
    target.addEventListener('pointerdown', onPointerDown as EventListener, { passive: true });
    window.addEventListener('pointerup', onPointerUp as EventListener, { passive: true });
    target.addEventListener('pointerleave', onPointerLeave as EventListener, { passive: true });
    target.addEventListener('pointerenter', onPointerEnter as EventListener, { passive: true });

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      target.removeEventListener('pointermove', onPointerMove as EventListener);
      target.removeEventListener('pointerdown', onPointerDown as EventListener);
      window.removeEventListener('pointerup', onPointerUp as EventListener);
      target.removeEventListener('pointerleave', onPointerLeave as EventListener);
      target.removeEventListener('pointerenter', onPointerEnter as EventListener);
    };
  }, [cursorType, containerRef, def]);

  if (!def || cursorType === 'default') return null;

  return (
    <div
      ref={cursorNodeRef}
      aria-hidden="true"
      className="absolute top-0 left-0 pointer-events-none z-50 transition-opacity duration-300 will-change-transform"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      {def.renderCursor({ isPointer, isDown })}
    </div>
  );
};
