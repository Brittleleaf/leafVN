"use client";
import React, { useState } from 'react';
import { VNCharacter, VNStory } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';
import { ensureGoogleFontLoaded } from '@/lib/vn/fontCatalog';
import AssetStudioModal from './AssetStudioModal';
import {
  CharacterIdentityTab,
  CharacterAvatarTab,
  CharacterExpressionsTab,
  CharacterTextBoxTab,
  CharacterDossierSidebar,
} from './characterstudio';

interface CharacterStudioModalProps {
  story: VNStory;
  onUpdateStory: (updatedStory: VNStory) => void;
  onClose: () => void;
  notify: (msg: string) => void;
}

export default function CharacterStudioModal({
  story,
  onUpdateStory,
  onClose,
  notify,
}: CharacterStudioModalProps) {
  const [selectedCharId, setSelectedCharId] = useState<string | null>(story.characters[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'expressions' | 'textbox'>('profile');

  // Estado para creación/edición de nuevo humor
  const [newMoodName, setNewMoodName] = useState<string>('');
  const [newMoodUrl, setNewMoodUrl] = useState<string>('');
  const [showAvatarAssetPicker, setShowAvatarAssetPicker] = useState<boolean>(false);
  const [showMoodAssetPicker, setShowMoodAssetPicker] = useState<boolean>(false);
  const [showFontAssetPicker, setShowFontAssetPicker] = useState<boolean>(false);
  const [editingMoodKeyForAsset, setEditingMoodKeyForAsset] = useState<string | null>(null);

  // Filtrado de personajes por búsqueda
  const filteredChars = story.characters.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.badgeTitle && c.badgeTitle.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.shortcut && c.shortcut.toLowerCase().includes(q))
    );
  });

  const activeChar =
    story.characters.find((c) => c.id === selectedCharId) ||
    filteredChars[0] ||
    story.characters[0];

  const handleUpdateChar = (charId: string, patch: Partial<VNCharacter>) => {
    let finalPatch = { ...patch };
    // Sincronizar automáticamente la foto de perfil con el humor neutral del personaje
    if ('avatarUrl' in patch && patch.avatarUrl !== undefined) {
      const targetChar = story.characters.find((c) => c.id === charId);
      const existingExpressions = patch.expressions || targetChar?.expressions || {};
      finalPatch.expressions = {
        ...existingExpressions,
        neutral: patch.avatarUrl,
      };
    }
    const updated = story.characters.map((c) => (c.id === charId ? { ...c, ...finalPatch } : c));
    const updatedStory = { ...story, characters: updated };
    onUpdateStory(updatedStory);
  };

  const handleCreateNewChar = () => {
    const newId = `char-${Date.now()}`;
    const defaultTemplateUrl = '/assets/image/characters/SUBJECT-TEMPLATE.png';
    const newChar: VNCharacter = {
      id: newId,
      name: `Character #${story.characters.length + 1}`,
      color: '#38bdf8',
      badgeTitle: '',
      shortcut: `${story.characters.length + 1}`,
      description: '',
      avatarUrl: defaultTemplateUrl,
      expressions: {
        neutral: defaultTemplateUrl,
      },
    };
    const updated = [...story.characters, newChar];
    onUpdateStory({ ...story, characters: updated });
    setSelectedCharId(newId);
    setActiveTab('profile');
    playSfx('/assets/sfx/success.mp3', false, 0.4);
    notify(`Character '${newChar.name}' created with template`);
  };

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-2 md:p-6 flex items-center justify-center animate-fade-in">
      <div className="max-w-6xl w-full max-h-[88vh] sm:max-h-[85vh] h-full vn-modal-card flex flex-col overflow-hidden text-[var(--text)]">
        
        {/* MAIN HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b vn-glass-header px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center p-1.5 bg-[var(--accent-surface)] rounded-xl border border-[var(--border2)] text-[var(--accent)] shrink-0 shadow-sm">
              <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm text-[var(--text)] font-extrabold uppercase tracking-widest">
                  Character & Role Studio
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--btn-bg)] text-[var(--accent)] border border-[var(--border)]">
                  {story.characters.length} registered
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Identity, profile pictures, dialogue moods, and custom text box.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, lore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[var(--well-bg)] border border-[var(--border)] rounded-xl pl-7 pr-3 py-1.5 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)] transition-colors w-40 sm:w-52 font-sans"
              />
              <GuiIconRenderer icon={GUI_ICONS.general.search} className="absolute left-2 top-2 text-[var(--muted)] w-3.5 h-3.5 opacity-60" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Create Character Button */}
            <button
              type="button"
              onClick={handleCreateNewChar}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-xl text-xs uppercase font-extrabold cursor-pointer transition-all shadow flex items-center gap-1.5 shrink-0"
            >
              <span>+</span>
              <span>Create Character</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer p-1.5 hover:bg-[var(--btn-hover-bg)] rounded-xl border border-[var(--border)] transition-colors"
              title="Close window"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-4 h-4 opacity-75 hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* STUDIO BODY IN 3 COLUMNS */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* 1. LEFT COLUMN: CHARACTERS LIST */}
          <div className="w-full md:w-60 lg:w-64 border-r border-[var(--border)] flex flex-col bg-[var(--well-bg)] shrink-0">
            <div className="p-3 border-b border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted)] font-bold uppercase tracking-wider bg-[var(--header-bg)]">
              <span>Cast ({filteredChars.length})</span>
              <span className="text-[10px] text-[var(--muted2)] font-normal">Click to edit</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {filteredChars.map((ch) => {
                const isSelected = activeChar?.id === ch.id;
                const exprCount = Object.keys(ch.expressions || {}).length;

                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedCharId(ch.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 relative group ${
                      isSelected
                        ? 'bg-[var(--accent-surface)] border-[var(--accent)] shadow-md ring-1 ring-[var(--accent)]/40'
                        : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border2)] hover:bg-[var(--btn-hover-bg)]'
                    }`}
                  >
                    <img
                      src={ch.avatarUrl || '/assets/image/characters/SUBJECT-TEMPLATE.png'}
                      alt={ch.name}
                      className="w-10 h-10 object-cover rounded-xl border shrink-0 transition-transform group-hover:scale-105"
                      style={{ borderColor: ch.color || '#ef4444' }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="font-bold text-xs truncate uppercase tracking-tight"
                          style={{ color: ch.color || '#ef4444' }}
                        >
                          {ch.name}
                        </span>
                        {ch.shortcut && (
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-[var(--well-bg)] text-[var(--muted)] rounded border border-[var(--border)] shrink-0">
                            #{ch.shortcut}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] truncate mt-0.5">
                        <span className="truncate">{ch.badgeTitle || 'OPERATOR'}</span>
                        <span className="text-[var(--muted2)]">•</span>
                        <span className="text-[var(--accent)] font-mono font-semibold shrink-0">{exprCount} moods</span>
                      </div>
                    </div>

                    {/* Quick actions (Duplicate / Delete) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dupId = `char-${Date.now()}`;
                          const dupChar: VNCharacter = {
                            ...ch,
                            id: dupId,
                            name: `${ch.name} (Copy)`,
                            shortcut: `${story.characters.length + 1}`,
                          };
                          const updated = [...story.characters, dupChar];
                          onUpdateStory({ ...story, characters: updated });
                          setSelectedCharId(dupId);
                          notify('Character duplicated');
                        }}
                        className="p-1 hover:bg-[var(--btn-hover-bg)] rounded-lg text-[var(--muted)] hover:text-[var(--text)] text-xs cursor-pointer flex items-center justify-center transition-colors"
                        title="Duplicate character"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5" />
                      </button>

                      {story.characters.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete character '${ch.name}'?`)) {
                              const filtered = story.characters.filter((c) => c.id !== ch.id);
                              const fallbackId = filtered[0]?.id;
                              const updatedChapters = story.chapters.map((chapter) => ({
                                ...chapter,
                                scenes: chapter.scenes.map((sc) => ({
                                  ...sc,
                                  timeline: (sc.timeline || []).map((ev) =>
                                    ev.characterId === ch.id ? { ...ev, characterId: fallbackId } : ev
                                  ),
                                  hotspots: (sc.hotspots || []).map((hs) =>
                                    hs.dialogueCharacterId === ch.id ? { ...hs, dialogueCharacterId: fallbackId } : hs
                                  ),
                                })),
                              }));
                              const updatedScenarios = (story.scenarios || []).map((sc) => ({
                                ...sc,
                                timeline: (sc.timeline || []).map((ev) =>
                                  ev.characterId === ch.id ? { ...ev, characterId: fallbackId } : ev
                                ),
                                hotspots: (sc.hotspots || []).map((hs) =>
                                  hs.dialogueCharacterId === ch.id ? { ...hs, dialogueCharacterId: fallbackId } : hs
                                ),
                              }));
                              onUpdateStory({
                                ...story,
                                characters: filtered,
                                chapters: updatedChapters,
                                scenarios: updatedScenarios,
                              });
                              if (activeChar?.id === ch.id) {
                                setSelectedCharId(filtered[0]?.id || null);
                              }
                              notify('Character deleted');
                            }
                          }}
                          className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-500 hover:text-rose-600 text-xs cursor-pointer flex items-center justify-center transition-colors"
                          title="Delete character"
                        >
                          <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CENTER COLUMN: EDITING PANELS */}
          {activeChar ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--panel)]">
              
              {/* TABS DOCK */}
              <div className="border-b border-[var(--border)] px-4 py-2.5 bg-[var(--header-bg)] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
                <div className="flex items-center gap-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-1 shadow-inner text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'profile'
                        ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] border border-transparent'
                    }`}
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.idCard} className="w-3.5 h-3.5 opacity-90" />
                    <span>Identity & Lore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('avatar')}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'avatar'
                        ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] border border-transparent'
                    }`}
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-3.5 h-3.5 opacity-90" />
                    <span>Profile Picture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('expressions')}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'expressions'
                        ? 'bg-amber-500/20 border border-amber-500 text-amber-800 dark:text-amber-200 shadow-sm'
                        : 'text-[var(--muted)] hover:text-amber-500 hover:bg-[var(--btn-hover-bg)] border border-transparent'
                    }`}
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.masksMood} className="w-3.5 h-3.5 opacity-90" />
                    <span>Moods & Sprites</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-[var(--well-bg)] text-amber-500 rounded-full font-mono border border-[var(--border)]">
                      {Object.keys(activeChar.expressions || {}).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('textbox')}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'textbox'
                        ? 'bg-[var(--accent-surface)] border border-[var(--accent)] text-[var(--text)] shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)] border border-transparent'
                    }`}
                  >
                    <GuiIconRenderer icon={GUI_ICONS.general.conversation} className="w-3.5 h-3.5 opacity-90" />
                    <span>Text Box</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs px-2.5 py-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-xl shrink-0">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: activeChar.color || '#ef4444' }} />
                  <span className="text-[var(--muted2)] font-mono text-[10px] uppercase font-bold hidden sm:inline">EDITING:</span>
                  <span className="font-extrabold uppercase truncate" style={{ color: activeChar.color || '#ef4444' }}>
                    {activeChar.name}
                  </span>
                </div>
              </div>

              {/* CONTENIDO SCROLLEABLE DE LA PESTAÑA */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                
                {/* === TAB 1: IDENTITY & LORE === */}
                {activeTab === 'profile' && (
                  <CharacterIdentityTab
                    activeChar={activeChar}
                    story={story}
                    handleUpdateChar={handleUpdateChar}
                    onUpdateStory={onUpdateStory}
                    onOpenFontPicker={() => setShowFontAssetPicker(true)}
                    notify={notify}
                  />
                )}

                {/* === TAB 2: PROFILE PICTURE / AVATAR === */}
                {activeTab === 'avatar' && (
                  <CharacterAvatarTab
                    activeChar={activeChar}
                    handleUpdateChar={handleUpdateChar}
                    onOpenAvatarAssetPicker={() => setShowAvatarAssetPicker(true)}
                    notify={notify}
                  />
                )}


                {/* === TAB 3: MOODS & SPRITES === */}
                {activeTab === 'expressions' && (
                  <CharacterExpressionsTab
                    activeChar={activeChar}
                    newMoodName={newMoodName}
                    setNewMoodName={setNewMoodName}
                    newMoodUrl={newMoodUrl}
                    setNewMoodUrl={setNewMoodUrl}
                    handleUpdateChar={handleUpdateChar}
                    onOpenMoodAssetPicker={(key) => {
                      setEditingMoodKeyForAsset(key ?? null);
                      setShowMoodAssetPicker(true);
                    }}
                    notify={notify}
                  />
                )}

                {/* === TAB 4: CUSTOM TEXT BOX === */}
                {activeTab === 'textbox' && (
                  <CharacterTextBoxTab
                    activeChar={activeChar}
                    story={story}
                    handleUpdateChar={handleUpdateChar}
                    notify={notify}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[var(--muted)] space-y-3">
              <GuiIconRenderer icon={GUI_ICONS.general.masks} className="w-12 h-12 text-[var(--muted2)]" />
              <p className="text-sm">Select or create a character to edit.</p>
              <button
                type="button"
                onClick={handleCreateNewChar}
                className="px-4 py-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] text-[#0F0503] font-bold rounded-xl text-xs uppercase shadow"
              >
                Create Character
              </button>
            </div>
          )}

          {/* 3. RIGHT COLUMN: SUMMARY DOSSIER & LORE GUIDE */}
          {activeChar && <CharacterDossierSidebar activeChar={activeChar} />}

        </div>
      </div>

      {/* ASSET PICKER MODAL FOR MAIN AVATAR */}
      {showAvatarAssetPicker && activeChar && (
        <AssetStudioModal
          story={story}
          filterType="character"
          onSelectAsset={(asset) => {
            handleUpdateChar(activeChar.id, { avatarUrl: asset.url });
            setShowAvatarAssetPicker(false);
            playSfx('/assets/sfx/success.mp3', false, 0.4);
            notify(`Profile picture and neutral mood assigned: ${asset.name}`);
          }}
          onClose={() => setShowAvatarAssetPicker(false)}
          notify={notify}
        />
      )}

      {/* ASSET PICKER MODAL FOR MOODS & SPRITES */}
      {showMoodAssetPicker && activeChar && (
        <AssetStudioModal
          story={story}
          filterType="character"
          onSelectAsset={(asset) => {
            if (editingMoodKeyForAsset) {
              // Editing an existing mood
              const existing = activeChar.expressions || {};
              handleUpdateChar(activeChar.id, {
                expressions: {
                  ...existing,
                  [editingMoodKeyForAsset]: asset.url,
                },
              });
              notify(`Photo updated for '${editingMoodKeyForAsset}'`);
            } else {
              // Assigning to new mood form field
              setNewMoodUrl(asset.url);
              notify(`Photo selected for new expression`);
            }
            setShowMoodAssetPicker(false);
            setEditingMoodKeyForAsset(null);
            playSfx('/assets/sfx/success.mp3', false, 0.4);
          }}
          onClose={() => {
            setShowMoodAssetPicker(false);
            setEditingMoodKeyForAsset(null);
          }}
          notify={notify}
        />
      )}

      {/* ASSET PICKER MODAL FOR CHARACTER FONT */}
      {showFontAssetPicker && activeChar && (
        <AssetStudioModal
          story={story}
          filterType="font"
          initialFilterType="font"
          initialFontSample={`[${activeChar.name}]: All systems functional. Ready for assignment.`}
          onSelectAsset={(asset) => {
            ensureGoogleFontLoaded(asset.url);
            handleUpdateChar(activeChar.id, { fontFamily: asset.url });
            setShowFontAssetPicker(false);
            playSfx('/assets/sfx/success.mp3', false, 0.4);
            notify(`Font applied to ${activeChar.name}: ${asset.name}`);
          }}
          onClose={() => setShowFontAssetPicker(false)}
          notify={notify}
        />
      )}
    </div>
  );
}
