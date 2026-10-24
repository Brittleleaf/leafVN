"use client";
import React from 'react';
import { getButtonHoverEffectClass, getButtonHoverContainerClass } from '@/lib/vn/buttonHoverEffects';
import { VNButtonHoverEffect } from '@/types/vn';

export type VNButtonStylePreset =
  | 'primary'
  | 'danger'
  | 'ghost'
  | 'retro'
  | 'glass'
  | 'cyber'
  | string;

export type VNButtonSizePreset = 'sm' | 'md' | 'lg' | 'xl';

export interface VNUniversalButtonProps {
  id?: string;
  label?: string;
  placeholder?: string;
  sublabel?: string | React.ReactNode;
  actionIcon?: React.ReactNode;
  style?: VNButtonStylePreset;
  size?: VNButtonSizePreset;
  hoverEffect?: VNButtonHoverEffect | string;
  hideContainer?: boolean;
  fontFamily?: string;
  disabled?: boolean;
  isSelected?: boolean;
  isInteractive?: boolean;

  // Spatial Coordinate & Transform System
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  zIndex?: number;
  className?: string;

  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children?: React.ReactNode; // e.g. VNUniversalTransformGizmo overlay

  // In-Place Text Editing System
  isEditingText?: boolean;
  onStartEditText?: () => void;
  onCommitText?: (newText: string) => void;
  onCancelEditText?: () => void;
}

/**
 * Returns container CSS classes for the given button style preset.
 */
export function getUniversalButtonStyleClass(
  style?: VNButtonStylePreset,
  hideContainer?: boolean,
  disabled?: boolean
): string {
  if (hideContainer) {
    return disabled
      ? 'bg-transparent border-transparent text-gray-500 cursor-not-allowed opacity-40 shadow-none'
      : 'bg-transparent border-transparent hover:bg-transparent hover:border-transparent text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] shadow-none';
  }

  if (disabled) {
    return 'bg-black/40 backdrop-blur-sm border border-gray-900 text-gray-500 cursor-not-allowed';
  }

  switch (style) {
    case 'danger':
      return 'bg-red-950/70 hover:bg-red-900 border-red-500/80 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.7)] hover:border-red-400 hover:brightness-110';
    case 'primary':
      return 'bg-[#2E1256]/80 hover:bg-[#6851DF]/80 border-[#D17BF8]/80 text-[#F5F2FF] shadow-[0_0_25px_rgba(209,123,248,0.35)] hover:shadow-[0_0_35px_rgba(209,123,248,0.65)] hover:border-[#D17BF8] hover:brightness-110';
    case 'retro':
      return 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-500/80 text-amber-200 font-mono tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:border-amber-400 hover:brightness-110';
    case 'glass':
      return 'bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-md shadow-lg hover:border-white/60 hover:brightness-110';
    case 'cyber':
    case 'choice':
      return 'bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 hover:border-purple-400 text-white shadow-xl hover:brightness-110';
    case 'ghost':
    default:
      return 'bg-black/50 hover:bg-black/80 border-white/20 text-gray-300 hover:text-white hover:border-white/50 backdrop-blur-sm hover:brightness-110';
  }
}

/**
 * Returns padding and font-size CSS classes for the given size preset.
 */
export function getUniversalButtonSizeClass(size?: VNButtonSizePreset): string {
  switch (size) {
    case 'sm':
      return 'py-2 px-3 text-[11px]';
    case 'lg':
      return 'py-4 px-8 text-base font-extrabold';
    case 'xl':
      return 'py-5 px-10 text-lg sm:text-xl font-black tracking-widest';
    case 'md':
    default:
      return 'py-3 px-6 text-xs sm:text-sm font-bold';
  }
}

/**
 * Centralized, universal button renderer for the VN Engine.
 * Used for Static Screens, Choice Options, Navigation and Action Buttons.
 * Supports free canvas transformations (scale, rotate, pan), typography customization,
 * hover text effects, frameless mode, and gizmo overlays.
 */
export const VNUniversalButton: React.FC<VNUniversalButtonProps> = ({
  id,
  label = '',
  placeholder,
  sublabel,
  actionIcon,
  style = 'ghost',
  size = 'md',
  hoverEffect,
  hideContainer = false,
  fontFamily,
  disabled = false,
  isSelected = false,
  isInteractive = true,
  xPercent,
  yPercent,
  widthPercent,
  scale = 1,
  scaleX = 1,
  scaleY = 1,
  rotation = 0,
  zIndex,
  className = '',
  onClick,
  onPointerDown,
  children,
  isEditingText = false,
  onStartEditText,
  onCommitText,
  onCancelEditText,
}) => {
  const [editText, setEditText] = React.useState<string>(label || '');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isEditingText) {
      setEditText(label || '');
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isEditingText, label]);

  const handleCommit = React.useCallback(() => {
    const finalVal = editText.trim();
    if (finalVal && onCommitText) {
      onCommitText(finalVal);
    } else if (onCancelEditText) {
      onCancelEditText();
    }
  }, [editText, onCommitText, onCancelEditText]);

  const handleCancel = React.useCallback(() => {
    setEditText(label || '');
    if (onCancelEditText) onCancelEditText();
  }, [label, onCancelEditText]);

  const hoverEffectClass = getButtonHoverEffectClass(hoverEffect);
  const containerStyleClass = getUniversalButtonStyleClass(style, hideContainer, disabled);
  const sizeClass = getUniversalButtonSizeClass(size);

  const isPositioned = typeof xPercent === 'number' || typeof yPercent === 'number';

  const safeScale = typeof scale === 'number' && Number.isFinite(scale) ? scale : 1;
  const safeScaleX = typeof scaleX === 'number' && Number.isFinite(scaleX) ? scaleX : 1;
  const safeScaleY = typeof scaleY === 'number' && Number.isFinite(scaleY) ? scaleY : 1;
  const safeRotation = typeof rotation === 'number' && Number.isFinite(rotation) ? rotation : 0;
  const safeX: number = typeof xPercent === 'number' && Number.isFinite(xPercent) ? xPercent : 50;
  const safeY: number = typeof yPercent === 'number' && Number.isFinite(yPercent) ? yPercent : 50;

  const isNearRightEdge = safeX > 75;

  const defaultWidth =
    size === 'xl'
      ? 'min(520px, 90%)'
      : size === 'lg'
      ? 'min(440px, 85%)'
      : size === 'sm'
      ? 'min(280px, 70%)'
      : 'min(384px, 85%)';

  const safeWidth = Number.isFinite(widthPercent) && (widthPercent as number) > 0 ? `${widthPercent}%` : defaultWidth;

  const effectiveScaleX = safeScale * safeScaleX;
  const effectiveScaleY = safeScale * safeScaleY;

  const containerHoverClass = hoverEffect && hoverEffect !== 'none' ? getButtonHoverContainerClass(hoverEffect) : '';

  const RootInteractive = (isEditingText ? 'div' : 'button') as React.ElementType;

  return (
    <div
      id={id ? `vn-btn-${id}` : undefined}
      onPointerDown={onPointerDown}
      style={{
        position: isPositioned ? 'absolute' : 'relative',
        left: isPositioned ? `${safeX}%` : undefined,
        top: isPositioned ? `${safeY}%` : undefined,
        transform: isPositioned
          ? `translate(-50%, -50%) rotate(${safeRotation}deg) scale(${effectiveScaleX}, ${effectiveScaleY})`
          : `rotate(${safeRotation}deg) scale(${effectiveScaleX}, ${effectiveScaleY})`,
        width: safeWidth,
        maxWidth: '92%',
        zIndex: zIndex ?? (isSelected ? 40 : 30),
        willChange: 'transform',
      }}
      className={`select-none transition-transform duration-75 ${
        isPositioned ? 'pointer-events-auto' : 'w-full'
      } ${className}`}
    >
      <RootInteractive
        {...(!isEditingText ? { type: 'button', disabled } : { role: 'group' })}
        onClick={(e: React.MouseEvent) => {
          if (isEditingText) {
            e.stopPropagation();
            return;
          }
          if (onClick) onClick(e as React.MouseEvent<HTMLButtonElement>);
        }}
        onDoubleClick={(e: React.MouseEvent) => {
          if (!isEditingText && onStartEditText) {
            e.stopPropagation();
            onStartEditText();
          }
        }}
        style={{
          fontFamily: fontFamily
            ? `var(--font-${fontFamily}), ${fontFamily}, sans-serif`
            : undefined,
        }}
        className={`w-full rounded-xl uppercase transition-all duration-200 border flex items-center justify-between gap-3 group relative ${
          isEditingText
            ? 'cursor-text ring-2 ring-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
            : isSelected
            ? 'cursor-pointer ring-2 ring-[var(--accent,#a855f7)] ring-offset-2 ring-offset-black/60 shadow-[0_0_25px_rgba(168,85,247,0.5)]'
            : 'cursor-pointer'
        } ${
          hideContainer ? '' : 'overflow-hidden'
        } ${containerStyleClass} ${sizeClass} ${containerHoverClass}`}
      >
        {/* Sublabel or Prefix (e.g. #1 or key shortcut) */}
        {sublabel ? (
          <span className="w-5 text-left text-[10px] text-gray-400 font-mono shrink-0">
            {sublabel}
          </span>
        ) : (
          <span className="w-2 shrink-0" />
        )}

        {/* Core Label (In-Place 100% Transparent Input with Zero Nested Containers) */}
        {isEditingText ? (
          <input
            ref={inputRef}
            data-raw-input="true"
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCommit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
              }
            }}
            onBlur={handleCommit}
            className="flex-1 text-center bg-transparent border-0 outline-none text-white font-inherit uppercase tracking-wider p-0 m-0 select-text cursor-text min-w-0 shadow-none ring-0"
            style={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              lineHeight: 'inherit',
              color: 'inherit',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
            placeholder={placeholder || 'Enter button text here...'}
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 text-center truncate ${hoverEffectClass} ${
              label ? '' : 'text-gray-400 italic'
            }`}
            title={label || placeholder || ''}
          >
            {label || placeholder || ''}
          </span>
        )}

        {/* Action Icon or Suffix Arrow */}
        {actionIcon ? (
          <span className="w-5 text-right shrink-0 flex items-center justify-end text-xs">
            {actionIcon}
          </span>
        ) : (
          <span className="w-2 shrink-0" />
        )}
      </RootInteractive>

      {/* Floating Edit / Done Button to the Right (or Left if near right edge) */}
      {isSelected && onStartEditText && (
        <div
          className={`absolute ${
            isNearRightEdge ? 'right-[calc(100%+12px)]' : 'left-[calc(100%+12px)]'
          } top-1/2 -translate-y-1/2 z-50 pointer-events-auto flex items-center shrink-0`}
          style={{
            transform: `translateY(-50%) scale(${1 / Math.max(0.1, effectiveScaleX)}, ${
              1 / Math.max(0.1, effectiveScaleY)
            })`,
            transformOrigin: isNearRightEdge ? 'right center' : 'left center',
          }}
        >
          {!isEditingText ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartEditText();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/95 hover:bg-cyan-900 border border-cyan-400/80 hover:border-cyan-300 text-cyan-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_25px_rgba(34,211,238,0.7)] cursor-pointer whitespace-nowrap transition-all group"
              title="Edit button text on screen (or press Enter / Double Click)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Edit Text</span>
              <span className="opacity-50 text-[9px] font-sans font-normal">(Enter)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCommit();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/95 hover:bg-emerald-900 border border-emerald-400/80 hover:border-emerald-300 text-emerald-200 hover:text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer whitespace-nowrap transition-all"
              title="Confirmar cambios (Enter)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Listo</span>
            </button>
          )}
        </div>
      )}

      {/* Embedded Transform Gizmo (Completely HIDDEN while editing text!) */}
      {!isEditingText && children}
    </div>
  );
};

export default VNUniversalButton;
