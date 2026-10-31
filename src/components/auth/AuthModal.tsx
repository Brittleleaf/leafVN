"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/firebase/authContext';
import { playSfx, playUiSound } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signInWithGoogle, signInWithGithub, signInWithFacebook, signInWithEmail, signUpWithEmail } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      playUiSound('select', 0.4);
      await signInWithGoogle();
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(e?.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      playUiSound('select', 0.4);
      await signInWithGithub();
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(e?.message || 'Failed to sign in with GitHub.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      playUiSound('select', 0.4);
      await signInWithFacebook();
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(e?.message || 'Failed to sign in with Facebook.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      setErrorMsg(null);
      setLoading(true);
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'auth/user-not-found' || e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        setErrorMsg('Incorrect email or password.');
      } else if (e?.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists.');
      } else if (e?.code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters long.');
      } else {
        setErrorMsg(e?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          onClose();
        }
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans"
      style={{
        backgroundColor: 'rgba(2, 1, 6, 0.82)',
        backdropFilter: 'blur(28px) saturate(130%)',
        WebkitBackdropFilter: 'blur(28px) saturate(130%)',
      }}
    >
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          playSfx('/assets/sfx/click intro.mp3', false, 0.2);
          onClose();
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md my-auto max-h-[92vh] overflow-y-auto vn-modal-card rounded-2xl border border-[var(--border2)] shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10 text-[var(--text)] flex flex-col"
        style={{
          background: 'var(--modal-bg, linear-gradient(180deg, rgba(35, 14, 60, 0.98), rgba(1, 1, 3, 0.99)))',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {/* Encabezado con Logo Centrado */}
        <div className="relative pt-7 pb-5 px-6 border-b border-[var(--border)] vn-glass-header flex flex-col items-center text-center">
          <button
            onClick={() => {
              playSfx('/assets/sfx/click intro.mp3', false, 0.2);
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)] rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-4 h-4" />
          </button>

          <img
            src="/assets/logo/LeafVN.png"
            alt="Leaf VN"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-3 rounded-2xl transition-transform hover:scale-105 duration-200 select-none pointer-events-none"
          />

          <h2 className="text-base font-bold text-[var(--text)] tracking-wide">
            {mode === 'signin' ? 'Sign In to Leaf VN' : 'Create Leaf VN Account'}
          </h2>
          <p className="text-xs text-[var(--muted2)] mt-1 max-w-xs">
            Save your visual novels to the cloud and access them anywhere.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <GuiIconRenderer icon={GUI_ICONS.action.danger} className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* OAuth Provider Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-xs font-semibold text-[var(--text)] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Sign in with Google"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* GitHub Button */}
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-xs font-semibold text-[var(--text)] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Sign in with GitHub"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>

            {/* Facebook Button */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] hover:border-[var(--border2)] text-xs font-semibold text-[var(--text)] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Sign in with Facebook"
            >
              <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="w-full border-t border-[var(--border)]" />
            <span
              className="absolute px-3 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider text-[var(--muted2)] border border-[var(--border)]"
              style={{ background: 'var(--header-bg, rgba(20, 8, 40, 0.95))' }}
            >
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmitEmail} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">Author Name or Alias</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your author name"
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted2)]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="author@leafvn.com"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted2)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--muted)] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg px-3 py-2 text-xs text-[var(--text)] outline-none transition-colors placeholder:text-[var(--muted2)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] hover:brightness-110 text-[var(--accent-contrast)] font-bold rounded-xl text-xs shadow-[0_0_15px_var(--accent-glow)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'signin' ? (
                <span>Sign In</span>
              ) : (
                <span>Create Free Account</span>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="pt-2 text-center text-xs text-[var(--muted)]">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setMode('signup');
                  }}
                  className="text-[var(--accent)] font-semibold hover:underline cursor-pointer"
                >
                  Sign up here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setMode('signin');
                  }}
                  className="text-[var(--accent)] font-semibold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
