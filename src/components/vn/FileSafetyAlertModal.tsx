"use client";
import React from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';

interface FileSafetyAlertModalProps {
  isOpen: boolean;
  fileName: string;
  errorMessage?: string;
  onSaveAs: () => void;
  onBackupDrive: () => void;
  onDismiss: () => void;
}

export const FileSafetyAlertModal: React.FC<FileSafetyAlertModalProps> = ({
  isOpen,
  fileName,
  errorMessage,
  onSaveAs,
  onBackupDrive,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div
        className="w-full max-w-lg rounded-2xl border border-amber-500/40 bg-[var(--modal-bg)] shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con ícono de advertencia */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <GuiIconRenderer icon={GUI_ICONS.general.hazard} className="w-7 h-7" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <span>File Safety Guard Alert</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold">
                Protected
              </span>
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              The linked file <span className="font-mono text-amber-300 font-semibold">{fileName}</span> was moved, renamed, or deleted from its original folder.
            </p>
          </div>
        </div>

        {/* Tarjeta de Seguridad (IndexedDB Protegido) */}
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
          <GuiIconRenderer icon={GUI_ICONS.general.check} className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-emerald-300">Your work is 100% safe in Local Storage (IndexedDB)</div>
            <div className="text-emerald-200/80 text-[11px] leading-relaxed">
              No changes were lost. A shadow copy is actively preserved in your browser cache. Please select how you want to re-link or save this project:
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-[var(--well-bg)] border border-[var(--border)] font-mono text-[10px] text-[var(--muted2)] break-all">
            System detail: {errorMessage}
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <button
            onClick={() => {
              playSfx('/assets/sfx/click interface.mp3', false, 0.4);
              onSaveAs();
            }}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.99]"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-4 h-4 text-black" />
            <span>Save to a New Location on PC (.leafvn)</span>
          </button>

          <button
            onClick={() => {
              playSfx('/assets/sfx/open folder.mp3', false, 0.4);
              onBackupDrive();
            }}
            className="w-full py-2.5 px-4 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--border2)] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.upload} className="w-4 h-4 text-amber-400" />
            <span>Backup Current Story to Google Drive</span>
          </button>

          <button
            onClick={() => {
              playSfx('/assets/sfx/corrupt file.mp3', false, 0.3);
              onDismiss();
            }}
            className="w-full py-2 text-center text-[11px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
          >
            Continue with IndexedDB working copy only (ask me later)
          </button>
        </div>
      </div>
    </div>
  );
};
