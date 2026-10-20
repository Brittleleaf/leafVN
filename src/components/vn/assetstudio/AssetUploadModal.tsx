"use client";
import React, { useState, useRef, useEffect } from 'react';
import { VNAssetType } from '@/types/vn';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  initialFilterType?: VNAssetType;
  onSuccess: () => Promise<void>;
  notify: (msg: string) => void;
}

export function AssetUploadModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  initialFilterType,
  onSuccess,
  notify,
}: AssetUploadModalProps) {
  const [addAssetMode, setAddAssetMode] = useState<'link' | 'file'>('link');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
  const [newAssetUrl, setNewAssetUrl] = useState<string>('');
  const [urlPreviewStatus, setUrlPreviewStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [urlTestAudioPlaying, setUrlTestAudioPlaying] = useState<boolean>(false);
  const urlAudioTesterRef = useRef<HTMLAudioElement | null>(null);
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetType, setNewAssetType] = useState<VNAssetType>(initialFilterType || 'background');
  const [newAssetCategory, setNewAssetCategory] = useState<string>('Custom');

  // Stop audio tester if unmounting or modal closes
  useEffect(() => {
    return () => {
      if (urlAudioTesterRef.current) {
        urlAudioTesterRef.current.pause();
        urlAudioTesterRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewAssetFile(file);
    if (!newAssetName) {
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewAssetName(rawName);
    }

    // Auto-detect type from mime/name
    if (file.type.startsWith('audio/')) {
      if (file.name.toLowerCase().includes('bgm') || file.name.toLowerCase().includes('music') || file.size > 1024 * 1024) {
        setNewAssetType('bgm');
      } else {
        setNewAssetType('sfx');
      }
    } else if (file.type.startsWith('image/')) {
      if (file.name.toLowerCase().includes('icon') || file.name.endsWith('.svg')) {
        setNewAssetType('icon');
      } else if (file.name.toLowerCase().includes('char') || file.name.toLowerCase().includes('avatar')) {
        setNewAssetType('character');
      } else {
        setNewAssetType('background');
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setNewAssetUrl(url);
    setUrlPreviewStatus('idle');
    if (urlAudioTesterRef.current) {
      urlAudioTesterRef.current.pause();
      urlAudioTesterRef.current = null;
      setUrlTestAudioPlaying(false);
    }

    if (!url.trim()) return;

    if (!newAssetName.trim()) {
      try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment) {
          const rawName = decodeURIComponent(lastSegment)
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ');
          if (rawName) setNewAssetName(rawName);
        }
      } catch (_) {}
    }

    if (!initialFilterType) {
      const lower = url.toLowerCase();
      if (lower.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/)) {
        if (lower.includes('bgm') || lower.includes('music') || lower.includes('theme') || lower.includes('ambient')) {
          setNewAssetType('bgm');
        } else {
          setNewAssetType('sfx');
        }
      } else if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/)) {
        if (lower.includes('avatar') || lower.includes('char') || lower.includes('sprite')) {
          setNewAssetType('character');
        } else if (lower.includes('icon') || lower.endsWith('.svg')) {
          setNewAssetType('icon');
        } else {
          setNewAssetType('background');
        }
      }
    }
  };

  const handleToggleTestAudio = () => {
    if (urlTestAudioPlaying) {
      if (urlAudioTesterRef.current) {
        urlAudioTesterRef.current.pause();
        urlAudioTesterRef.current = null;
      }
      setUrlTestAudioPlaying(false);
      return;
    }

    if (!newAssetUrl.trim()) return;
    try {
      const audio = new Audio(newAssetUrl.trim());
      urlAudioTesterRef.current = audio;
      setUrlTestAudioPlaying(true);
      setUrlPreviewStatus('valid');
      audio.onended = () => {
        setUrlTestAudioPlaying(false);
        urlAudioTesterRef.current = null;
      };
      audio.onerror = () => {
        setUrlTestAudioPlaying(false);
        setUrlPreviewStatus('invalid');
        urlAudioTesterRef.current = null;
        notify('Could not play audio from this URL.');
      };
      audio.play().catch(() => {
        setUrlTestAudioPlaying(false);
        setUrlPreviewStatus('invalid');
      });
    } catch (_) {
      setUrlTestAudioPlaying(false);
      setUrlPreviewStatus('invalid');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl.trim() || !newAssetName.trim()) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('Please enter a valid URL and an asset name.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAssetName.trim(),
          url: newAssetUrl.trim(),
          assetType: newAssetType,
          category: newAssetCategory.trim() || 'Web Link',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'Error indexing external asset.');
      }

      await onSuccess();
      setIsUploading(false);
      setNewAssetUrl('');
      setNewAssetName('');
      setUrlPreviewStatus('idle');
      if (urlAudioTesterRef.current) {
        urlAudioTesterRef.current.pause();
        urlAudioTesterRef.current = null;
        setUrlTestAudioPlaying(false);
      }
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      notify(`Web asset "${newAssetName.trim()}" indexed to gallery!`);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error indexing web asset: ${err?.message || err}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetFile || !newAssetName.trim()) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('Please select a file and enter a name.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newAssetFile);
      formData.append('assetType', newAssetType);

      const res = await fetch(`/api/projects/${projectId}/assets`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || 'Error saving file to disk.');
      }

      await onSuccess();
      setIsUploading(false);
      setNewAssetFile(null);
      setNewAssetName('');
      playSfx('/assets/sfx/success.mp3', false, 0.5);
      notify(`Asset saved directly to "${projectName}" folder`);
      onClose();
    } catch (err: any) {
      setIsUploading(false);
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify(`Error uploading file: ${err?.message || err}`);
    }
  };

  return (
    <div className="p-4 bg-[var(--well-bg)] border-b border-[var(--border)] shrink-0 animate-fade-in space-y-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--btn-bg)] border border-[var(--border)] rounded-xl">
          <button
            type="button"
            onClick={() => setAddAssetMode('link')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              addAssetMode === 'link'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.link} size={12} className="text-cyan-400" />
            <span>Index External URL</span>
          </button>
          <button
            type="button"
            onClick={() => setAddAssetMode('file')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              addAssetMode === 'file'
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-3.5 h-3.5 text-emerald-500" />
            <span>Upload File (PC Storage)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
        >
          <span>Close</span>
          <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3 h-3" />
        </button>
      </div>

      {/* TAB CONTENT: WEB LINK INDEXING */}
      {addAssetMode === 'link' ? (
        <form onSubmit={handleLinkSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* URL Input */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] text-cyan-600 dark:text-cyan-300 uppercase font-bold block flex items-center gap-1">
                <span>External Resource URL:</span>
                <span className="text-[var(--muted2)] font-normal lowercase">(https://... or /assets/...)</span>
              </label>
              <input
                type="text"
                value={newAssetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste image or audio URL here..."
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Asset Type */}
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Asset Type:</label>
              <select
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value as VNAssetType)}
                disabled={Boolean(initialFilterType)}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2 py-1.5 text-xs text-cyan-600 dark:text-cyan-300 font-bold outline-none cursor-pointer disabled:opacity-75"
              >
                {initialFilterType ? (
                  <option value={initialFilterType}>
                    {initialFilterType === 'sfx'
                      ? 'Sound Effect (SFX)'
                      : initialFilterType === 'bgm'
                      ? 'Music / Ambient (BGM)'
                      : initialFilterType === 'voice'
                      ? 'Voice / Character Reaction'
                      : initialFilterType === 'background'
                      ? 'Scene Background'
                      : initialFilterType === 'character'
                      ? 'Character Sprite / Avatar'
                      : 'GUI Vector Icon'}
                  </option>
                ) : (
                  <>
                    <option value="background">Scene Background</option>
                    <option value="character">Character Sprite / Avatar</option>
                    <option value="sfx">Sound Effect (SFX)</option>
                    <option value="bgm">Music / Ambient (BGM)</option>
                    <option value="voice">Voice / Character Reaction</option>
                    <option value="icon">GUI Vector Icon</option>
                  </>
                )}
              </select>
            </div>

            {/* Asset Name */}
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Asset Display Name:</label>
              <input
                type="text"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="e.g. Cyberpunk Alley / Laser Blast"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs text-[var(--text)] outline-none focus:border-cyan-400"
              />
            </div>

            {/* Asset Category */}
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Category / Tag:</label>
              <input
                type="text"
                value={newAssetCategory}
                onChange={(e) => setNewAssetCategory(e.target.value)}
                placeholder="e.g. Scenery, Futuristic, Combat"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs text-[var(--text)] outline-none focus:border-cyan-400"
              />
            </div>

            {/* Quick Helper notice */}
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-2.5 py-1">
              <GuiIconRenderer icon={GUI_ICONS.action.lightBulb} size={12} className="text-cyan-400 shrink-0" />
              <span>Indexed links save disk space and are loaded directly from the web or CDN without downloading to disk.</span>
            </div>
          </div>

          {/* Live Preview Container for Link */}
          {newAssetUrl.trim() && (
            <div className="pt-2">
              {['background', 'character', 'icon'].includes(newAssetType) ? (
                <div className="flex items-center gap-3 p-2 bg-black/60 rounded-lg border border-gray-800">
                  <div className="w-16 h-16 rounded overflow-hidden bg-black/90 border border-gray-700 shrink-0 flex items-center justify-center relative">
                    <img
                      src={newAssetUrl}
                      alt="Live URL Preview"
                      className="w-full h-full object-cover"
                      onLoad={() => setUrlPreviewStatus('valid')}
                      onError={() => setUrlPreviewStatus('invalid')}
                    />
                  </div>
                  <div className="text-xs space-y-1 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-300">Live Preview:</span>
                      {urlPreviewStatus === 'valid' && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <GuiIconRenderer icon={GUI_ICONS.action.check} size={11} />
                          <span>Valid image link</span>
                        </span>
                      )}
                      {urlPreviewStatus === 'invalid' && (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <GuiIconRenderer icon={GUI_ICONS.action.alert} size={11} />
                          <span>Error loading image from URL</span>
                        </span>
                      )}
                      {urlPreviewStatus === 'idle' && (
                        <span className="text-yellow-400">Loading URL preview...</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono truncate max-w-xl">{newAssetUrl}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2 bg-black/60 rounded-lg border border-gray-800">
                  <button
                    type="button"
                    onClick={handleToggleTestAudio}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow ${
                      urlTestAudioPlaying
                        ? 'bg-amber-600 text-white animate-pulse'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    }`}
                  >
                    <GuiIconRenderer icon={urlTestAudioPlaying ? GUI_ICONS.state.pause : GUI_ICONS.state.play} className="w-3.5 h-3.5" />
                    <span>{urlTestAudioPlaying ? 'Pause Audio' : 'Audition Audio Link'}</span>
                  </button>
                  <div className="text-xs">
                    <span className="text-gray-300 font-mono text-[11px] flex items-center gap-1">
                      {urlPreviewStatus === 'invalid' ? (
                        <>
                          <GuiIconRenderer icon={GUI_ICONS.action.alert} size={11} className="text-amber-400" />
                          <span>Could not stream audio from URL</span>
                        </>
                      ) : (
                        'Click to preview audio stream before indexing'
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isUploading || !newAssetUrl.trim() || !newAssetName.trim()}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs uppercase tracking-wider cursor-pointer transition-all shadow flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.link} size={12} className="text-white" />
              <span>{isUploading ? 'Indexing...' : 'Index Web Asset to Gallery'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* TAB CONTENT: PHYSICAL PC FILE UPLOAD */
        <form onSubmit={handleUploadSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.folder} className="w-4 h-4 text-emerald-500" />
              <span>Save physical file to: <code className="text-[var(--text)] font-mono">public/projects/{projectId}/assets/</code></span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Select File (PC):</label>
              <input
                type="file"
                accept={
                  initialFilterType
                    ? ['sfx', 'bgm', 'voice'].includes(initialFilterType)
                      ? 'audio/*'
                      : 'image/*'
                    : 'audio/*,image/*'
                }
                onChange={handleFileChange}
                className="w-full text-xs text-[var(--text)] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-emerald-500/20 file:text-emerald-700 dark:file:text-emerald-300 file:border file:border-emerald-500/40 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Asset Name:</label>
              <input
                type="text"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="e.g. Metallic Slam / Dark Hallway"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2.5 py-1 text-xs text-[var(--text)] outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--muted)] uppercase font-bold block">Asset Type:</label>
              <select
                value={newAssetType}
                onChange={(e) => setNewAssetType(e.target.value as VNAssetType)}
                disabled={Boolean(initialFilterType)}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-xl px-2 py-1 text-xs text-emerald-700 dark:text-emerald-300 font-bold outline-none cursor-pointer disabled:opacity-75"
              >
                {initialFilterType ? (
                  <option value={initialFilterType}>
                    {initialFilterType === 'sfx'
                      ? 'Sound Effect (SFX)'
                      : initialFilterType === 'bgm'
                      ? 'Music / Ambient (BGM)'
                      : initialFilterType === 'voice'
                      ? 'Voice / Character Reaction'
                      : initialFilterType === 'background'
                      ? 'Scene Background'
                      : initialFilterType === 'character'
                      ? 'Character Sprite / Avatar'
                      : 'GUI Vector Icon'}
                  </option>
                ) : (
                  <>
                    <option value="sfx">Sound Effect (SFX)</option>
                    <option value="bgm">Music / Ambient (BGM)</option>
                    <option value="voice">Voice / Character Reaction</option>
                    <option value="background">Scene Background</option>
                    <option value="character">Character Sprite / Avatar</option>
                    <option value="icon">GUI Vector Icon</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isUploading || !newAssetFile}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all shadow flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Saving to disk...' : 'Save File to Folder'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
