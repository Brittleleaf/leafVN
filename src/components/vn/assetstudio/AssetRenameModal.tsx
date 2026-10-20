"use client";
import React, { useState, useEffect } from 'react';
import { VNAssetItem } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';

interface AssetRenameModalProps {
  asset: VNAssetItem | null;
  projectId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  notify: (msg: string) => void;
}

export function AssetRenameModal({
  asset,
  projectId,
  onClose,
  onSuccess,
  notify,
}: AssetRenameModalProps) {
  const [renameInputName, setRenameInputName] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  useEffect(() => {
    if (asset) {
      setRenameInputName(asset.name);
    }
  }, [asset]);

  if (!asset) return null;

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !renameInputName.trim()) return;

    setIsRenaming(true);
    try {
      const isWeb = asset.url.startsWith('http://') || asset.url.startsWith('https://');
      const filePath = asset.filePath || (isWeb ? asset.url : asset.url.replace(`/projects/${projectId}/assets/`, ''));
      const res = await fetch(`/api/projects/${projectId}/assets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldFilePath: filePath,
          newName: renameInputName.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'Could not rename file');
      }

      await onSuccess();
      playSfx('/assets/sfx/success.mp3', false, 0.4);
      notify('Asset renamed successfully.');
      onClose();
    } catch (err: any) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error renaming asset: ${err?.message || err}`);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="p-4 bg-[var(--well-bg)] border-b border-amber-500/40 shrink-0 animate-fade-in backdrop-blur-md">
      <form onSubmit={handleConfirmRename} className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GuiIconRenderer icon={GUI_ICONS.general.paintbrush} className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
            Rename physical file: <code className="text-[var(--text)] font-mono">{asset.name}</code>
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={renameInputName}
            onChange={(e) => setRenameInputName(e.target.value)}
            placeholder="New file name"
            className="bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs text-[var(--text)] outline-none focus:border-amber-400 w-full sm:w-64"
          />
          <button
            type="submit"
            disabled={isRenaming || !renameInputName.trim()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
          >
            {isRenaming ? 'Renaming...' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] rounded-xl text-xs cursor-pointer border border-[var(--border)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
