"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { playSfx } from '@/lib/audioSettings';
import {
  VNTransformableTarget,
  VNTransformHandleType,
  VNTransformDragSession,
  VNTransformCapabilities,
  VNTransformHudInfo,
  DEFAULT_TRANSFORM_CAPABILITIES,
} from './types';
import { dispatchTransform } from './transformMath';

export interface UseUniversalTransformProps {
  target: VNTransformableTarget | null;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (patch: Partial<VNTransformableTarget>) => void;
  onTransformEnd?: (finalTarget: VNTransformableTarget) => void;
  capabilities?: VNTransformCapabilities;
  isEditor?: boolean;
  snapTargets?: import('./types').VNSnapTarget[];
  disableSnapping?: boolean;
}

export function useUniversalTransform({
  target,
  stageRef,
  onUpdate,
  onTransformEnd,
  capabilities = DEFAULT_TRANSFORM_CAPABILITIES,
  isEditor = true,
  snapTargets,
  disableSnapping,
}: UseUniversalTransformProps) {
  const mergedCaps = { ...DEFAULT_TRANSFORM_CAPABILITIES, ...capabilities };

  const [snapGuideX, setSnapGuideX] = useState<boolean>(false);
  const [snapGuideY, setSnapGuideY] = useState<boolean>(false);
  const [snapGuideXPercent, setSnapGuideXPercent] = useState<number>(50);
  const [snapGuideYPercent, setSnapGuideYPercent] = useState<number>(50);
  const [activeHandle, setActiveHandle] = useState<VNTransformHandleType | null>(null);
  const [isCropMode, setIsCropMode] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(target?.isPerspective3D ?? false);
  const [hudInfo, setHudInfo] = useState<VNTransformHudInfo | null>(null);

  const sessionRef = useRef<VNTransformDragSession | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const justTransformedRef = useRef<boolean>(false);
  const latestTargetRef = useRef<VNTransformableTarget | null>(target);
  const rafIdRef = useRef<number | null>(null);
  const pendingPatchRef = useRef<Partial<VNTransformableTarget> | null>(null);
  const lastSnapSoundRef = useRef<string>('');
  const cleanupSessionRef = useRef<(() => void) | null>(null);

  // Keep latest target reference up to date for onTransformEnd callbacks
  useEffect(() => {
    latestTargetRef.current = target;
  }, [target]);

  // Clean up pending animation frames and any active drag session listeners on unmount
  useEffect(() => {
    return () => {
      if (cleanupSessionRef.current) {
        cleanupSessionRef.current();
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  // Sync internal 3D state if target updates externally
  useEffect(() => {
    if (target?.isPerspective3D !== undefined) {
      setIs3DMode(target.isPerspective3D);
    }
  }, [target?.isPerspective3D]);

  // Flush batched update to parent component
  const flushPatch = useCallback(() => {
    if (pendingPatchRef.current) {
      onUpdate(pendingPatchRef.current);
      pendingPatchRef.current = null;
    }
    rafIdRef.current = null;
  }, [onUpdate]);

  // Batched RAF update for fluid 60/120/144fps screen responsiveness
  const queueUpdate = useCallback((patch: Partial<VNTransformableTarget>) => {
    pendingPatchRef.current = { ...(pendingPatchRef.current || {}), ...patch };
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(flushPatch);
    }
  }, [flushPatch]);

  // Start transformation drag session
  const startTransform = useCallback(
    (
      e: React.PointerEvent,
      handle: VNTransformHandleType,
      targetElement: HTMLElement
    ) => {
      // Primary button (0), touch, or pen only (preserves right-click for context menu)
      // Blocked if element is currently locked to prevent accidental manipulation
      if (!isEditor || !target || target.locked || !stageRef.current || e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const stageRect = stageRef.current.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const targetUnrotatedW = targetElement.offsetWidth || targetRect.width || 1;
      const targetUnrotatedH = targetElement.offsetHeight || targetRect.height || 1;

      // Pointer capture prevents dropping tracking during rapid flicks
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      const initialCenterScreenX =
        targetRect.width > 0
          ? targetRect.left + targetRect.width / 2
          : stageRect.left + (stageRect.width * (target.xPercent ?? 50)) / 100;
      const initialCenterScreenY =
        targetRect.height > 0
          ? targetRect.top + targetRect.height / 2
          : stageRect.top + (stageRect.height * (target.yPercent ?? 50)) / 100;

      const initialAngleRad = Math.atan2(
        e.clientY - initialCenterScreenY,
        e.clientX - initialCenterScreenX
      );

      hasMovedRef.current = false;
      setActiveHandle(handle);

      const session: VNTransformDragSession = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        targetRect,
        stageRect,
        targetUnrotatedW,
        targetUnrotatedH,
        initialTarget: { ...target },
        initialCenterScreenX,
        initialCenterScreenY,
        initialAngleRad,
        pointerId: e.pointerId,
        snapTargets,
        disableSnapping: Boolean(disableSnapping || target.disableSnap),
      };

      sessionRef.current = session;

      const onPointerMove = (moveEv: PointerEvent) => {
        const curSession = sessionRef.current;
        if (!curSession || !stageRef.current) return;

        const deltaX = moveEv.clientX - curSession.startX;
        const deltaY = moveEv.clientY - curSession.startY;

        // Apply a strict deadband threshold (4px) to distinguish intentional drags from clicks or trackpad jitters
        if (!hasMovedRef.current) {
          if (Math.hypot(deltaX, deltaY) < 4) {
            return;
          }
          hasMovedRef.current = true;
        }

        const result = dispatchTransform(curSession, moveEv);
        if (!result) return;

        // Sound trigger on magnetic snap changes
        if (result.snapSoundKey) {
          if (lastSnapSoundRef.current !== result.snapSoundKey) {
            lastSnapSoundRef.current = result.snapSoundKey;
            playSfx('/assets/sfx/click intro.mp3', false, 0.12);
          }
        } else {
          lastSnapSoundRef.current = '';
        }

        setSnapGuideX(Boolean(result.snapGuideX));
        setSnapGuideY(Boolean(result.snapGuideY));
        if (result.snapGuideXPercent !== undefined) setSnapGuideXPercent(result.snapGuideXPercent);
        if (result.snapGuideYPercent !== undefined) setSnapGuideYPercent(result.snapGuideYPercent);
        setHudInfo(result.hudInfo);
        queueUpdate(result.patch);
      };

      const onKeyDown = (keyEv: KeyboardEvent) => {
        // Pressing Escape during drag immediately cancels session and reverts changes
        if (keyEv.key === 'Escape' && sessionRef.current) {
          keyEv.preventDefault();
          if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          onUpdate(sessionRef.current.initialTarget);
          cleanupSession();
        }
      };

      const cleanupSession = () => {
        cleanupSessionRef.current = null;
        if (sessionRef.current?.pointerId !== undefined) {
          try {
            (e.target as HTMLElement).releasePointerCapture(sessionRef.current.pointerId);
          } catch {}
        }

        setActiveHandle(null);
        setSnapGuideX(false);
        setSnapGuideY(false);
        setHudInfo(null);
        sessionRef.current = null;

        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        window.removeEventListener('blur', onPointerUp);
        window.removeEventListener('keydown', onKeyDown);
      };

      cleanupSessionRef.current = cleanupSession;

      const onPointerUp = () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          flushPatch();
        }

        if (hasMovedRef.current) {
          justTransformedRef.current = true;
          setTimeout(() => {
            justTransformedRef.current = false;
          }, 150);

          if (onTransformEnd && latestTargetRef.current) {
            onTransformEnd(latestTargetRef.current);
          }
        }

        cleanupSession();
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { once: true });
      window.addEventListener('pointercancel', onPointerUp, { once: true });
      window.addEventListener('blur', onPointerUp, { once: true });
      window.addEventListener('keydown', onKeyDown);
    },
    [isEditor, target, stageRef, queueUpdate, flushPatch, onTransformEnd, snapTargets, disableSnapping]
  );

  // Keyboard Nudge Support (Arrow keys with 0.5% nudge, Shift + Arrow with 2.5%, staging bounds [-40%, 140%])
  useEffect(() => {
    if (!isEditor || !target || target.locked || !mergedCaps.allowKeyboardNudge) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement)?.isContentEditable)
      ) {
        return;
      }

      const step = e.shiftKey ? 2.5 : 0.5;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;

      e.preventDefault();
      const newX = Math.max(-40, Math.min(140, Math.round(((target.xPercent ?? 50) + dx) * 10) / 10));
      const newY = Math.max(-40, Math.min(140, Math.round(((target.yPercent ?? 50) + dy) * 10) / 10));

      onUpdate({ xPercent: newX, yPercent: newY });
      if (onTransformEnd) {
        onTransformEnd({ ...target, xPercent: newX, yPercent: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditor, target, mergedCaps.allowKeyboardNudge, onUpdate, onTransformEnd]);

  // Quick Action Utilities (Agnostic for any VN entity)
  const toggleLock = useCallback(() => {
    if (!target) return;
    const nextLocked = !target.locked;
    onUpdate({ locked: nextLocked });
    if (onTransformEnd) onTransformEnd({ ...target, locked: nextLocked });
    playSfx('/assets/sfx/click intro.mp3', false, 0.2);
  }, [target, onUpdate, onTransformEnd]);

  const toggleFlipX = useCallback(() => {
    if (!target) return;
    const nextFlipX = !target.flipX;
    onUpdate({ flipX: nextFlipX });
    if (onTransformEnd) onTransformEnd({ ...target, flipX: nextFlipX });
  }, [target, onUpdate, onTransformEnd]);

  const toggleFlipY = useCallback(() => {
    if (!target) return;
    const nextFlipY = !target.flipY;
    onUpdate({ flipY: nextFlipY });
    if (onTransformEnd) onTransformEnd({ ...target, flipY: nextFlipY });
  }, [target, onUpdate, onTransformEnd]);

  const toggle3DMode = useCallback(() => {
    setIs3DMode((prev) => {
      const next = !prev;
      const patch = {
        isPerspective3D: next,
        ...(next ? {} : { rotateX: 0, rotateY: 0 }),
      };
      onUpdate(patch);
      if (onTransformEnd && target) onTransformEnd({ ...target, ...patch });
      return next;
    });
  }, [onUpdate, onTransformEnd, target]);

  const toggleCropMode = useCallback(() => {
    setIsCropMode((prev) => !prev);
  }, []);

  const resetTransform = useCallback(() => {
    const patch = {
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      rotateX: 0,
      rotateY: 0,
      pivotX: mergedCaps.allowPivot ? 50 : (target?.pivotX ?? 50),
      pivotY: mergedCaps.allowPivot ? 50 : (target?.pivotY ?? 50),
      flipX: false,
      flipY: false,
      crop: undefined,
      isPerspective3D: false,
    };
    onUpdate(patch);
    if (onTransformEnd && target) onTransformEnd({ ...target, ...patch });
    setIsCropMode(false);
    setIs3DMode(false);
  }, [onUpdate, onTransformEnd, target, mergedCaps.allowPivot]);

  const centerOnScreen = useCallback(() => {
    const patch = { xPercent: 50, yPercent: 50 };
    onUpdate(patch);
    if (onTransformEnd && target) onTransformEnd({ ...target, ...patch });
  }, [onUpdate, onTransformEnd, target]);

  return {
    startTransform,
    activeHandle,
    snapGuideX,
    snapGuideY,
    snapGuideXPercent,
    snapGuideYPercent,
    isCropMode,
    is3DMode,
    hudInfo,
    justTransformed: justTransformedRef.current,
    toggleLock,
    toggleFlipX,
    toggleFlipY,
    toggle3DMode,
    toggleCropMode,
    resetTransform,
    centerOnScreen,
  };
}
