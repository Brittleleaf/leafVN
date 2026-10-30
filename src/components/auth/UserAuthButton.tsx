"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/firebase/authContext';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import AuthModal from './AuthModal';

interface UserAuthButtonProps {
  compact?: boolean;
}

export default function UserAuthButton({ compact = false }: UserAuthButtonProps) {
  const { user, loading, signOutUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <div className="h-7 w-20 bg-[var(--well-bg)] animate-pulse rounded-lg border border-[var(--border)]" />
    );
  }

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            playSfx('/assets/sfx/click interface.mp3', true, 0.3);
            setShowAuthModal(true);
          }}
          className="h-7 px-3 rounded-lg text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--accent)] text-[var(--text)] shadow-sm backdrop-blur-sm"
          title="Sign in to save and sync projects to the cloud"
        >
          <GuiIconRenderer icon={GUI_ICONS.general.profile} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="hidden sm:inline">Sign In</span>
        </button>

        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  // Authenticated user state
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const photoUrl = user.photoURL;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          playUiSound('select', 0.3);
          setShowDropdown(!showDropdown);
        }}
        className="h-7 px-2 sm:px-2.5 rounded-lg text-xs font-medium cursor-pointer border flex items-center gap-1.5 transition-all border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] shadow-sm backdrop-blur-sm"
        title={`Logged in as ${displayName}`}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={displayName} className="w-4 h-4 rounded-full object-cover border border-[var(--accent)]" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[9px] font-bold flex items-center justify-center uppercase">
            {displayName[0]}
          </div>
        )}
        {!compact && <span className="hidden md:inline max-w-[100px] truncate">{displayName}</span>}
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Cloud Sync Active" />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowDropdown(false)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-9 z-[70] w-64 rounded-xl border border-[var(--border2)] bg-[var(--dropdown-bg)] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-3 text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            {/* User Profile Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)] mb-2">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-[var(--accent)]" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-sm font-bold flex items-center justify-center uppercase">
                  {displayName[0]}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-[var(--text)] truncate">{displayName}</div>
                <div className="text-[10px] text-[var(--muted2)] truncate">{user.email}</div>
              </div>
            </div>

            {/* Cloud Sync Status */}
            <div className="p-2 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] mb-3 space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Cloud Storage Active</span>
              </div>
              <p className="text-[10px] text-[var(--muted)]">
                Projects are automatically backed up to your personal Leaf VN cloud account.
              </p>
            </div>

            {/* Actions */}
            <button
              type="button"
              onClick={async () => {
                setShowDropdown(false);
                playSfx('/assets/sfx/click intro.mp3', false, 0.3);
                await signOutUser();
              }}
              className="w-full py-1.5 px-2.5 rounded-lg hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-2 cursor-pointer font-medium"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.delete} className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
