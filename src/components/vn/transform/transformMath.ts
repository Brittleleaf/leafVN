import {
  VNTransformDragSession,
  VNTransformStepResult,
  VNTransformCrop,
} from './types';

/**
 * Calculates screen-aligned resize cursors taking current object rotation into account (Figma/Photoshop standard).
 */
export const getRotatedCursor = (baseAngleDeg: number, rotationDeg: number = 0): string => {
  const total = (((baseAngleDeg + rotationDeg) % 360) + 360) % 360;
  if (total >= 22.5 && total < 67.5) return 'nesw-resize';
  if (total >= 67.5 && total < 112.5) return 'ew-resize';
  if (total >= 112.5 && total < 157.5) return 'nwse-resize';
  if (total >= 157.5 && total < 202.5) return 'ns-resize';
  if (total >= 202.5 && total < 247.5) return 'nesw-resize';
  if (total >= 247.5 && total < 292.5) return 'ew-resize';
  if (total >= 292.5 && total < 337.5) return 'nwse-resize';
  return 'ns-resize';
};

/**
 * 1. Panning / Staging Movement
 * Supports:
 * - Magnetic stage center snapping (50%, 50%)
 * - Shift Axis Lock (constrains movement to dominant horizontal or vertical axis)
 * - Offscreen staging boundaries [-40%, 140%]
 */
export function calcMove(
  session: VNTransformDragSession,
  clientX: number,
  clientY: number,
  shiftKey: boolean,
  altKey: boolean = false
): VNTransformStepResult {
  const deltaX = clientX - session.startX;
  const deltaY = clientY - session.startY;

  let effDeltaX = deltaX;
  let effDeltaY = deltaY;
  let axisLockLabel = '';

  if (shiftKey) {
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      effDeltaY = 0;
      axisLockLabel = ' [AXIS LOCK H]';
    } else {
      effDeltaX = 0;
      axisLockLabel = ' [AXIS LOCK V]';
    }
  }

  const stageW = session.stageRect.width || 1;
  const stageH = session.stageRect.height || 1;

  const deltaPctX = (effDeltaX / stageW) * 100;
  const deltaPctY = (effDeltaY / stageH) * 100;

  const isBottomPivot = session.initialTarget.pivotY === 100;
  const baseTargetX = session.initialTarget.xPercent ?? Math.round((((session.targetRect.left + session.targetRect.width / 2) - session.stageRect.left) / stageW) * 1000) / 10;
  const baseTargetY = session.initialTarget.yPercent ?? Math.round((((isBottomPivot ? session.targetRect.bottom : session.targetRect.top + session.targetRect.height / 2) - session.stageRect.top) / stageH) * 1000) / 10;

  let rawX = baseTargetX + deltaPctX;
  let rawY = baseTargetY + deltaPctY;

  let hitX = false;
  let hitY = false;
  let snapXCoord = 50;
  let snapYCoord = 50;
  let snapLabel = '';

  const isSnapSuspended = altKey || Boolean(session.disableSnapping);

  if (!isSnapSuspended) {
    // Current element half dimensions in percent
    const safeUnrotatedW = Number.isFinite(session.targetUnrotatedW) && session.targetUnrotatedW > 0 ? session.targetUnrotatedW : 1;
    const safeUnrotatedH = Number.isFinite(session.targetUnrotatedH) && session.targetUnrotatedH > 0 ? session.targetUnrotatedH : 1;
    const myHalfW = Math.max(2, Math.min(30, ((safeUnrotatedW / stageW) * 100) / 2));
    const myHalfH = Math.max(2, Math.min(30, ((safeUnrotatedH / stageH) * 100) / 2));

    // 1. Magnetic snap to stage center (50%, 50%)
    if (Math.abs(rawX - 50) <= 1.8) {
      rawX = 50;
      hitX = true;
      snapXCoord = 50;
      snapLabel = ' (CENTER)';
    }
    if (Math.abs(rawY - 50) <= 1.8) {
      rawY = 50;
      hitY = true;
      snapYCoord = 50;
      snapLabel = ' (CENTER)';
    }

    // 2. Magnetic snap to sibling elements (contact edge-to-edge & edge alignment)
    if (session.snapTargets && session.snapTargets.length > 0) {
      for (const t of session.snapTargets) {
        if (!t || t.id === session.initialTarget.id || t.disableSnap) continue;

        const tHalfW = Math.max(2, (t.widthPercent ?? (myHalfW * 2)) / 2);
        const tHalfH = Math.max(2, (t.heightPercent ?? (myHalfH * 2)) / 2);

        const tLeft = t.xPercent - tHalfW;
        const tRight = t.xPercent + tHalfW;
        const tTop = t.yPercent - tHalfH;
        const tBottom = t.yPercent + tHalfH;

        // --- X AXIS SNAPPING ---
        if (!hitX) {
          // A) Align center X
          if (Math.abs(rawX - t.xPercent) <= 1.8) {
            rawX = t.xPercent;
            hitX = true;
            snapXCoord = t.xPercent;
            snapLabel = ' [SNAP: ALIGN X]';
          }
          // B) Contact Right: Stick to Right edge of target (Side-by-Side)
          else if (Math.abs(rawX - (tRight + myHalfW)) <= 2.0) {
            rawX = tRight + myHalfW;
            hitX = true;
            snapXCoord = tRight;
            snapLabel = ' [SNAP: RIGHT EDGE]';
          }
          // C) Contact Left: Stick to Left edge of target (Side-by-Side)
          else if (Math.abs(rawX - (tLeft - myHalfW)) <= 2.0) {
            rawX = tLeft - myHalfW;
            hitX = true;
            snapXCoord = tLeft;
            snapLabel = ' [SNAP: LEFT EDGE]';
          }
          // D) Align Left-to-Left (Flush to Left Edge)
          else if (Math.abs(rawX - (session.initialTarget.pivotX === 0 ? tLeft : (tLeft + myHalfW))) <= 2.0) {
            rawX = session.initialTarget.pivotX === 0 ? tLeft : (tLeft + myHalfW);
            hitX = true;
            snapXCoord = tLeft;
            snapLabel = ' [SNAP: ALIGN LEFT]';
          }
          // E) Align Right-to-Right (Flush to Right Edge)
          else if (Math.abs(rawX - (session.initialTarget.pivotX === 100 ? tRight : (tRight - myHalfW))) <= 2.0) {
            rawX = session.initialTarget.pivotX === 100 ? tRight : (tRight - myHalfW);
            hitX = true;
            snapXCoord = tRight;
            snapLabel = ' [SNAP: ALIGN RIGHT]';
          }
        }

        // --- Y AXIS SNAPPING ---
        if (!hitY) {
          // A) Align center Y
          if (Math.abs(rawY - t.yPercent) <= 1.8) {
            rawY = t.yPercent;
            hitY = true;
            snapYCoord = t.yPercent;
            snapLabel = ' [SNAP: ALIGN Y]';
          }
          // B) Contact Bottom: Stack directly below target
          else if (Math.abs(rawY - (isBottomPivot ? (tBottom + myHalfH * 2) : (tBottom + myHalfH))) <= 2.0) {
            rawY = isBottomPivot ? (tBottom + myHalfH * 2) : (tBottom + myHalfH);
            hitY = true;
            snapYCoord = tBottom;
            snapLabel = ' [SNAP: BELOW]';
          }
          // C) Contact Top: Stack directly above target (Flush to Top Edge of Dialogue Box)
          else if (Math.abs(rawY - (isBottomPivot ? tTop : (tTop - myHalfH))) <= 2.2) {
            rawY = isBottomPivot ? tTop : (tTop - myHalfH);
            hitY = true;
            snapYCoord = tTop;
            snapLabel = isBottomPivot ? ' [SNAP: DIALOGUE TOP]' : ' [SNAP: ABOVE]';
          }
          // D) Align Top-to-Top
          else if (Math.abs((isBottomPivot ? rawY - myHalfH * 2 : rawY - myHalfH) - tTop) <= 1.8) {
            rawY = isBottomPivot ? (tTop + myHalfH * 2) : (tTop + myHalfH);
            hitY = true;
            snapYCoord = tTop;
            snapLabel = ' [SNAP: ALIGN TOP]';
          }
          // E) Align Bottom-to-Bottom
          else if (Math.abs((isBottomPivot ? rawY : rawY + myHalfH) - tBottom) <= 1.8) {
            rawY = isBottomPivot ? tBottom : (tBottom - myHalfH);
            hitY = true;
            snapYCoord = tBottom;
            snapLabel = ' [SNAP: ALIGN BOTTOM]';
          }
        }
      }
    }
  } else if (altKey) {
    snapLabel = ' [ALT: FREE MOVE]';
  }

  const finalX = Math.max(-40, Math.min(140, Math.round(rawX * 10) / 10));
  const finalY = Math.max(-40, Math.min(140, Math.round(rawY * 10) / 10));

  const snapSoundKey = hitX || hitY ? `move_snap_${finalX}_${finalY}` : undefined;

  return {
    patch: {
      xPercent: finalX,
      yPercent: finalY,
    },
    hudInfo: {
      label: 'POS',
      value: `X: ${finalX}% | Y: ${finalY}%${snapLabel}${axisLockLabel}`,
      color: hitX || hitY ? 'cyan' : 'amber',
    },
    snapGuideX: hitX,
    snapGuideY: hitY,
    snapGuideXPercent: hitX ? snapXCoord : undefined,
    snapGuideYPercent: hitY ? snapYCoord : undefined,
    snapSoundKey,
  };
}

/**
 * 2. Draggable Pivot Point (CAD Anchor Crosshair)
 * Mathematical Zero-Jump Position Compensation:
 * Moving the pivot changes the transform origin. To keep the visual element 100% frozen
 * in place on screen during drag, the stage coordinates (xPercent, yPercent) are compensated
 * in parallel, accounting for local rotation, scale, scaleX, scaleY, and flip axes.
 */
export function calcPivot(
  session: VNTransformDragSession,
  clientX: number,
  clientY: number
): VNTransformStepResult {
  const deltaX = clientX - session.startX;
  const deltaY = clientY - session.startY;

  const rotDeg = session.initialTarget.rotation ?? 0;
  const rotRad = (rotDeg * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const localDeltaX = deltaX * cosR + deltaY * sinR;
  const localDeltaY = -deltaX * sinR + deltaY * cosR;

  const baseW = Number.isFinite(session.targetUnrotatedW) && session.targetUnrotatedW > 0 ? session.targetUnrotatedW : 1;
  const baseH = Number.isFinite(session.targetUnrotatedH) && session.targetUnrotatedH > 0 ? session.targetUnrotatedH : 1;
  const safeScale = Math.max(0.01, Number.isFinite(session.initialTarget.scale) ? (session.initialTarget.scale as number) : 1);

  const targetW = Math.max(1, baseW * safeScale);
  const targetH = Math.max(1, baseH * safeScale);

  const currentPivotPxX = (targetW * (session.initialTarget.pivotX ?? 50)) / 100 + localDeltaX;
  const currentPivotPxY = (targetH * (session.initialTarget.pivotY ?? 50)) / 100 + localDeltaY;

  let newPivotX = Math.max(0, Math.min(100, Math.round((currentPivotPxX / targetW) * 100)));
  let newPivotY = Math.max(0, Math.min(100, Math.round((currentPivotPxY / targetH) * 100)));

  // Magnetic snap pivot to center (50%, 50%)
  if (Math.abs(newPivotX - 50) <= 3) newPivotX = 50;
  if (Math.abs(newPivotY - 50) <= 3) newPivotY = 50;

  // Zero-jump compensation: computes displacement in stage coordinates
  const dPivotNormX = (newPivotX - (session.initialTarget.pivotX ?? 50)) / 100;
  const dPivotNormY = (newPivotY - (session.initialTarget.pivotY ?? 50)) / 100;

  const actualWidthPx = baseW * safeScale * (session.initialTarget.scaleX ?? 1);
  const actualHeightPx = baseH * safeScale * (session.initialTarget.scaleY ?? 1);

  const dispLocalPxX = dPivotNormX * actualWidthPx * (session.initialTarget.flipX ? -1 : 1);
  const dispLocalPxY = dPivotNormY * actualHeightPx * (session.initialTarget.flipY ? -1 : 1);

  const dispStagePxX = dispLocalPxX * cosR - dispLocalPxY * sinR;
  const dispStagePxY = dispLocalPxX * sinR + dispLocalPxY * cosR;

  const stageW = session.stageRect.width || 1;
  const stageH = session.stageRect.height || 1;

  const compX = (session.initialTarget.xPercent ?? 50) + (dispStagePxX / stageW) * 100;
  const compY = (session.initialTarget.yPercent ?? 50) + (dispStagePxY / stageH) * 100;

  const isCenter = newPivotX === 50 && newPivotY === 50;

  return {
    patch: {
      pivotX: newPivotX,
      pivotY: newPivotY,
      xPercent: Math.max(-40, Math.min(140, Math.round(compX * 10) / 10)),
      yPercent: Math.max(-40, Math.min(140, Math.round(compY * 10) / 10)),
    },
    hudInfo: {
      label: 'PIVOT',
      value: `X: ${newPivotX}% | Y: ${newPivotY}%${isCenter ? ' (CENTER)' : ''}`,
      color: 'amber',
    },
    snapSoundKey: isCenter ? 'pivot_center' : undefined,
  };
}

/**
 * 3. 2D Angular Rotation
 * Features:
 * - 15° snap when holding Shift
 * - Magnetic cardinal auto-snap (0°, 90°, -90°, 180°) within 2.5° tolerance
 */
export function calcRotate(
  session: VNTransformDragSession,
  clientX: number,
  clientY: number,
  shiftKey: boolean
): VNTransformStepResult {
  const currentAngleRad = Math.atan2(
    clientY - session.initialCenterScreenY,
    clientX - session.initialCenterScreenX
  );
  const deltaRad = currentAngleRad - session.initialAngleRad;
  let deltaDeg = (deltaRad * 180) / Math.PI;

  let newRotation = (session.initialTarget.rotation ?? 0) + deltaDeg;

  while (newRotation > 180) newRotation -= 360;
  while (newRotation < -180) newRotation += 360;

  let isSnapped = false;
  let snapLabel = '';

  if (shiftKey) {
    newRotation = Math.round(newRotation / 15) * 15;
    isSnapped = true;
    snapLabel = ' (SNAP 15°)';
  } else {
    const cardinalAngles = [0, 90, -90, 180, -180];
    for (const cAngle of cardinalAngles) {
      if (Math.abs(newRotation - cAngle) <= 2.5) {
        newRotation = cAngle;
        isSnapped = true;
        snapLabel = cAngle === 0 ? ' (0° UPRIGHT)' : ` (${cAngle}°)`;
        break;
      }
    }
  }

  const finalRotation = Math.round(newRotation * 10) / 10;

  return {
    patch: { rotation: finalRotation },
    hudInfo: {
      label: 'ROTATE',
      value: `${finalRotation}°${snapLabel}`,
      color: 'cyan',
    },
    snapSoundKey: isSnapped ? `rot_${finalRotation}` : undefined,
  };
}

/**
 * 4. 3D Perspective Orbit (Pitch / Yaw)
 * Features:
 * - 15° snap with Shift
 * - Planar auto-snap to (0°, 0°) flat perspective
 */
export function calcRotate3D(
  session: VNTransformDragSession,
  clientX: number,
  clientY: number,
  shiftKey: boolean
): VNTransformStepResult {
  const deltaX = clientX - session.startX;
  const deltaY = clientY - session.startY;

  const yawSensitivity = 0.5;
  const pitchSensitivity = 0.5;

  let newYaw = (session.initialTarget.rotateY ?? 0) + deltaX * yawSensitivity;
  let newPitch = (session.initialTarget.rotateX ?? 0) - deltaY * pitchSensitivity;

  let snapSuffix = '';
  let hitYaw0 = false;
  let hitPitch0 = false;

  if (shiftKey) {
    newYaw = Math.round(newYaw / 15) * 15;
    newPitch = Math.round(newPitch / 15) * 15;
    snapSuffix = ' (SNAP 15°)';
  } else {
    if (Math.abs(newYaw) <= 2.5) {
      newYaw = 0;
      hitYaw0 = true;
    }
    if (Math.abs(newPitch) <= 2.5) {
      newPitch = 0;
      hitPitch0 = true;
    }

    if (hitYaw0 && hitPitch0) {
      snapSuffix = ' (FLAT 0°)';
    } else if (hitYaw0) {
      snapSuffix = ' (YAW 0°)';
    } else if (hitPitch0) {
      snapSuffix = ' (PITCH 0°)';
    }
  }

  newYaw = Math.max(-85, Math.min(85, Math.round(newYaw)));
  newPitch = Math.max(-85, Math.min(85, Math.round(newPitch)));

  return {
    patch: {
      rotateX: newPitch,
      rotateY: newYaw,
      isPerspective3D: true,
    },
    hudInfo: {
      label: '3D ORBIT',
      value: `PITCH: ${newPitch}° | YAW: ${newYaw}°${snapSuffix}`,
      color: 'purple',
    },
    snapSoundKey: hitYaw0 || hitPitch0 ? `orbit_${hitYaw0}_${hitPitch0}` : undefined,
  };
}

/**
 * 5. Uniform Corner Scaling (Radial distance from center)
 * 100% rotation-invariant with 100% Native size magnetic snap and division-by-zero protection.
 */
export function calcUniformScale(
  session: VNTransformDragSession,
  clientX: number,
  clientY: number
): VNTransformStepResult {
  const vStartX = session.startX - session.initialCenterScreenX;
  const vStartY = session.startY - session.initialCenterScreenY;
  const vCurX = clientX - session.initialCenterScreenX;
  const vCurY = clientY - session.initialCenterScreenY;

  const distStart = Math.max(20, Math.hypot(vStartX, vStartY));
  const distCur = Math.hypot(vCurX, vCurY);

  const dot = vStartX * vCurX + vStartY * vCurY;
  const factor = dot >= 0 ? Math.max(0.05, distCur / distStart) : 0.05;

  const baseScale = session.initialTarget.scale ?? 1;
  let newScale = Math.max(0.1, Math.min(6.0, Number((baseScale * factor).toFixed(2))));

  let snapSuffix = '';
  let isSnap100 = false;
  if (Math.abs(newScale - 1.0) <= 0.03) {
    newScale = 1.0;
    snapSuffix = ' (100% NATIVE)';
    isSnap100 = true;
  }

  return {
    patch: { scale: newScale },
    hudInfo: {
      label: 'SCALE',
      value: `${Math.round(newScale * 100)}%${snapSuffix}`,
      color: 'cyan',
    },
    snapSoundKey: isSnap100 ? 'scale_100' : undefined,
  };
}

/**
 * 6. Cardinal Edge Scaling (T, B, L, R)
 * Uses projected local deltas.
 * Supports:
 * - 100% magnetic snap
 * - Shift proportional aspect ratio preservation
 */
export function calcCardinalScale(
  session: VNTransformDragSession,
  handle: 't' | 'b' | 'l' | 'r',
  clientX: number,
  clientY: number,
  shiftKey: boolean
): VNTransformStepResult {
  const deltaX = clientX - session.startX;
  const deltaY = clientY - session.startY;

  const rotDeg = session.initialTarget.rotation ?? 0;
  const rotRad = (rotDeg * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  const localDeltaX = deltaX * cosR + deltaY * sinR;
  const localDeltaY = -deltaX * sinR + deltaY * cosR;

  const baseW = Number.isFinite(session.targetUnrotatedW) && session.targetUnrotatedW > 0 ? session.targetUnrotatedW : 1;
  const baseH = Number.isFinite(session.targetUnrotatedH) && session.targetUnrotatedH > 0 ? session.targetUnrotatedH : 1;
  const safeScale = Math.max(0.01, Number.isFinite(session.initialTarget.scale) ? (session.initialTarget.scale as number) : 1);
  const targetW = Math.max(1, baseW * safeScale);
  const targetH = Math.max(1, baseH * safeScale);

  if (handle === 'l' || handle === 'r') {
    let sign = handle === 'r' ? 1 : -1;
    if (session.initialTarget.flipX) sign *= -1;

    const scaleXDelta = (localDeltaX * sign) / (targetW / 2);
    const baseScaleX = session.initialTarget.scaleX ?? 1;
    let newScaleX = Math.max(0.1, Math.min(5.0, Number((baseScaleX + scaleXDelta).toFixed(2))));

    let snapSuffix = '';
    if (Math.abs(newScaleX - 1.0) <= 0.04) {
      newScaleX = 1.0;
      snapSuffix = ' (100%)';
    }

    let propScaleY = session.initialTarget.scaleY ?? 1;
    if (shiftKey) {
      const safeBaseScaleX = Math.max(0.01, Math.abs(baseScaleX || 1));
      const ratio = newScaleX / safeBaseScaleX;
      propScaleY = Math.max(0.1, Math.min(5.0, Number(((session.initialTarget.scaleY ?? 1) * ratio).toFixed(2))));
    }

    return {
      patch: shiftKey ? { scaleX: newScaleX, scaleY: propScaleY } : { scaleX: newScaleX },
      hudInfo: {
        label: 'WIDTH',
        value: `${Math.round(newScaleX * 100)}%${snapSuffix}${shiftKey ? ' (PROPORTIONAL)' : ''}`,
        color: 'cyan',
      },
      snapSoundKey: newScaleX === 1.0 ? 'scaleX_100' : undefined,
    };
  }

  // Vertical (t | b)
  let sign = handle === 'b' ? 1 : -1;
  if (session.initialTarget.flipY) sign *= -1;

  const scaleYDelta = (localDeltaY * sign) / (targetH / 2);
  const baseScaleY = session.initialTarget.scaleY ?? 1;
  let newScaleY = Math.max(0.1, Math.min(5.0, Number((baseScaleY + scaleYDelta).toFixed(2))));

  let snapSuffix = '';
  if (Math.abs(newScaleY - 1.0) <= 0.04) {
    newScaleY = 1.0;
    snapSuffix = ' (100%)';
  }

  let propScaleX = session.initialTarget.scaleX ?? 1;
  if (shiftKey) {
    const safeBaseScaleY = Math.max(0.01, Math.abs(baseScaleY || 1));
    const ratio = newScaleY / safeBaseScaleY;
    propScaleX = Math.max(0.1, Math.min(5.0, Number(((session.initialTarget.scaleX ?? 1) * ratio).toFixed(2))));
  }

  return {
    patch: shiftKey ? { scaleX: propScaleX, scaleY: newScaleY } : { scaleY: newScaleY },
    hudInfo: {
      label: 'HEIGHT',
      value: `${Math.round(newScaleY * 100)}%${snapSuffix}${shiftKey ? ' (PROPORTIONAL)' : ''}`,
      color: 'cyan',
    },
    snapSoundKey: newScaleY === 1.0 ? 'scaleY_100' : undefined,
  };
}

/**
 * 7. Crop Insets Guillotine
 * Features:
 * - Orientation projection & flip inversion
 * - Minimum size preservation (never collapses below 10%)
 * - Magnetic 0% uncrop snap
 */
export function calcCrop(
  session: VNTransformDragSession,
  handle: string,
  clientX: number,
  clientY: number
): VNTransformStepResult {
  const deltaX = clientX - session.startX;
  const deltaY = clientY - session.startY;

  const rotDeg = session.initialTarget.rotation ?? 0;
  const rotRad = (rotDeg * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);

  let modDeltaX = deltaX * cosR + deltaY * sinR;
  let modDeltaY = -deltaX * sinR + deltaY * cosR;
  if (session.initialTarget.flipX) modDeltaX *= -1;
  if (session.initialTarget.flipY) modDeltaY *= -1;

  const baseW = Number.isFinite(session.targetUnrotatedW) && session.targetUnrotatedW > 0 ? session.targetUnrotatedW : 1;
  const baseH = Number.isFinite(session.targetUnrotatedH) && session.targetUnrotatedH > 0 ? session.targetUnrotatedH : 1;
  const safeScale = Math.max(0.01, Number.isFinite(session.initialTarget.scale) ? (session.initialTarget.scale as number) : 1);
  const targetW = Math.max(1, baseW * safeScale);
  const targetH = Math.max(1, baseH * safeScale);

  const deltaPctCropX = (modDeltaX / targetW) * 100;
  const deltaPctCropY = (modDeltaY / targetH) * 100;

  const currentCrop: VNTransformCrop = session.initialTarget.crop || { top: 0, right: 0, bottom: 0, left: 0 };
  let nextTop = currentCrop.top;
  let nextBottom = currentCrop.bottom;
  let nextLeft = currentCrop.left;
  let nextRight = currentCrop.right;

  let snappedEdge = false;

  if (handle.includes('t')) {
    nextTop = Math.max(0, Math.min(90 - currentCrop.bottom, Math.round(currentCrop.top + deltaPctCropY)));
    if (nextTop <= 2) {
      nextTop = 0;
      snappedEdge = true;
    }
  }
  if (handle.includes('b')) {
    nextBottom = Math.max(0, Math.min(90 - currentCrop.top, Math.round(currentCrop.bottom - deltaPctCropY)));
    if (nextBottom <= 2) {
      nextBottom = 0;
      snappedEdge = true;
    }
  }
  if (handle.includes('l')) {
    nextLeft = Math.max(0, Math.min(90 - currentCrop.right, Math.round(currentCrop.left + deltaPctCropX)));
    if (nextLeft <= 2) {
      nextLeft = 0;
      snappedEdge = true;
    }
  }
  if (handle.includes('r')) {
    nextRight = Math.max(0, Math.min(90 - currentCrop.left, Math.round(currentCrop.right - deltaPctCropX)));
    if (nextRight <= 2) {
      nextRight = 0;
      snappedEdge = true;
    }
  }

  const hasCrop = nextTop > 0 || nextRight > 0 || nextBottom > 0 || nextLeft > 0;

  return {
    patch: {
      crop: hasCrop
        ? {
            top: nextTop,
            right: nextRight,
            bottom: nextBottom,
            left: nextLeft,
          }
        : undefined,
    },
    hudInfo: {
      label: 'CROP',
      value: hasCrop ? `T:${nextTop}% B:${nextBottom}% L:${nextLeft}% R:${nextRight}%` : 'UNCROPPED (100%)',
      color: 'amber',
    },
    snapSoundKey: snappedEdge ? 'crop_snap_0' : undefined,
  };
}

/**
 * Universal Transform Dispatcher:
 * Routes active handle drag events cleanly to the corresponding pure math engine.
 */
export function dispatchTransform(
  session: VNTransformDragSession,
  moveEv: PointerEvent
): VNTransformStepResult | null {
  const { handle } = session;
  const { clientX, clientY, shiftKey } = moveEv;

  if (handle === 'move') {
    return calcMove(session, clientX, clientY, shiftKey, moveEv.altKey);
  }
  if (handle === 'pivot') {
    return calcPivot(session, clientX, clientY);
  }
  if (handle === 'rotate') {
    return calcRotate(session, clientX, clientY, shiftKey);
  }
  if (handle === 'rotate3d') {
    return calcRotate3D(session, clientX, clientY, shiftKey);
  }
  if (['tl', 'tr', 'bl', 'br'].includes(handle)) {
    return calcUniformScale(session, clientX, clientY);
  }
  if (handle === 't' || handle === 'b' || handle === 'l' || handle === 'r') {
    return calcCardinalScale(session, handle, clientX, clientY, shiftKey);
  }
  if (handle.startsWith('crop-')) {
    return calcCrop(session, handle, clientX, clientY);
  }

  return null;
}
