"use client";
import React, { useState } from 'react';
import { VNStory, VNVariableDefinition } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';

interface VariableStudioModalProps {
  story: VNStory;
  onUpdateStory: (updatedStory: VNStory) => void;
  onClose?: () => void;
  notify?: (msg: string) => void;
  isWorkspaceView?: boolean;
}

const VARIABLE_TEMPLATES = [
  { label: 'Key / Story Item', icon: GUI_ICONS.asset.badge, key: 'has_key', type: 'boolean' as const, defaultValue: false, desc: 'Boolean switch for item access' },
  { label: 'Affinity / Relationship', icon: GUI_ICONS.asset.heart, key: 'character_affinity', type: 'number' as const, defaultValue: 0, desc: 'Cumulative score of affection' },
  { label: 'Coins / Credits', icon: GUI_ICONS.asset.box, key: 'credits', type: 'number' as const, defaultValue: 100, desc: 'Numeric value for transactions' },
  { label: 'Protagonist Name', icon: GUI_ICONS.general.profile, key: 'player_name', type: 'string' as const, defaultValue: 'Justin', desc: 'Dynamic text insertable with {player_name}' },
  { label: 'Rank / Faction', icon: GUI_ICONS.asset.award, key: 'faction', type: 'string' as const, defaultValue: 'Investigator', desc: 'Story branch or identity' },
  { label: 'Alert Level', icon: GUI_ICONS.action.danger, key: 'security_alert', type: 'number' as const, defaultValue: 0, desc: 'Suspicion or danger counter' },
];

export default function VariableStudioModal({
  story,
  onUpdateStory,
  onClose,
  notify = () => {},
  isWorkspaceView = false,
}: VariableStudioModalProps) {
  const variables: VNVariableDefinition[] = story.variables || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVarId, setSelectedVarId] = useState<string | null>(variables[0]?.id || null);

  // Formulario de edición o creación
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<'boolean' | 'number' | 'string'>('boolean');
  const [formDefaultVal, setFormDefaultVal] = useState<any>(false);

  const activeVar = variables.find((v) => v.id === selectedVarId);

  const filteredVariables = variables.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.key.toLowerCase().includes(q) || v.label.toLowerCase().includes(q) || v.type.toLowerCase().includes(q);
  });

  const handleStartCreate = (template?: typeof VARIABLE_TEMPLATES[0]) => {
    setIsCreatingNew(true);
    setSelectedVarId(null);
    if (template) {
      setFormKey(template.key);
      setFormLabel(template.label.replace(/^[^\s]+\s/, ''));
      setFormType(template.type);
      setFormDefaultVal(template.defaultValue);
    } else {
      setFormKey(`var_${Date.now().toString().slice(-4)}`);
      setFormLabel('New Variable');
      setFormType('boolean');
      setFormDefaultVal(false);
    }
    playSfx('/assets/sfx/click intro.mp3', false, 0.3);
  };

  const handleSelectToEdit = (v: VNVariableDefinition) => {
    setIsCreatingNew(false);
    setSelectedVarId(v.id);
    setFormKey(v.key);
    setFormLabel(v.label);
    setFormType(v.type);
    setFormDefaultVal(v.defaultValue);
    playSfx('/assets/sfx/click interface.mp3', true, 0.2);
  };

  const handleSaveVariable = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = formKey.trim().replace(/\s+/g, '_').toLowerCase();
    if (!cleanKey) {
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
      notify('The identifier key cannot be empty.');
      return;
    }

    let parsedVal = formDefaultVal;
    if (formType === 'boolean') {
      parsedVal = Boolean(formDefaultVal);
    } else if (formType === 'number') {
      parsedVal = Number(formDefaultVal) || 0;
    } else {
      parsedVal = String(formDefaultVal);
    }

    if (isCreatingNew) {
      // Verificar unicidad de key
      if (variables.some((v) => v.key.toLowerCase() === cleanKey)) {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify(`A variable with the key '${cleanKey}' already exists. Use another name.`);
        return;
      }
      const newVar: VNVariableDefinition = {
        id: `var-${Date.now()}`,
        key: cleanKey,
        label: formLabel.trim() || cleanKey,
        type: formType,
        defaultValue: parsedVal,
      };
      const updated = [...variables, newVar];
      onUpdateStory({ ...story, variables: updated });
      setSelectedVarId(newVar.id);
      setIsCreatingNew(false);
      playSfx('/assets/sfx/success.mp3', false, 0.4);
      notify(`Variable '${newVar.key}' created`);
    } else if (activeVar) {
      // 1. Verificar unicidad contra otras variables
      if (variables.some((v) => v.id !== activeVar.id && v.key.toLowerCase() === cleanKey)) {
        playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
        notify(`Another variable with the key '${cleanKey}' already exists. Use a unique key.`);
        return;
      }

      const oldKey = activeVar.key;
      const keyChanged = oldKey !== cleanKey;

      const updatedVariables = variables.map((v) =>
        v.id === activeVar.id
          ? {
              ...v,
              key: cleanKey,
              label: formLabel.trim() || cleanKey,
              type: formType,
              defaultValue: parsedVal,
            }
          : v
      );

      // 2. Si el identificador cambió, actualizar en cascada todas las referencias en la historia
      let updatedStory = { ...story, variables: updatedVariables };

      if (keyChanged) {
        const cascadeScene = (sc: any) => {
          const updatedTimeline = (sc.timeline || []).map((ev: any) => {
            let modEv = { ...ev };
            if (modEv.condition && modEv.condition.variableKey === oldKey) {
              modEv.condition = { ...modEv.condition, variableKey: cleanKey };
            }
            if (modEv.variableMutation && modEv.variableMutation.key === oldKey) {
              modEv.variableMutation = { ...modEv.variableMutation, key: cleanKey };
            }
            if (modEv.text && typeof modEv.text === 'string' && modEv.text.includes(`{${oldKey}`)) {
              modEv.text = modEv.text.replace(new RegExp(`\\{${oldKey}(\\||\\})`, 'g'), `{${cleanKey}$1`);
            }
            if (modEv.prompt && typeof modEv.prompt === 'string' && modEv.prompt.includes(`{${oldKey}`)) {
              modEv.prompt = modEv.prompt.replace(new RegExp(`\\{${oldKey}(\\||\\})`, 'g'), `{${cleanKey}$1`);
            }
            if (modEv.type === 'choice' && modEv.options) {
              modEv.options = modEv.options.map((opt: any) => ({
                ...opt,
                label: typeof opt.label === 'string' && opt.label.includes(`{${oldKey}`)
                  ? opt.label.replace(new RegExp(`\\{${oldKey}(\\||\\})`, 'g'), `{${cleanKey}$1`)
                  : opt.label,
                condition: opt.condition?.variableKey === oldKey ? { ...opt.condition, variableKey: cleanKey } : opt.condition,
                mutations: opt.mutations?.map((m: any) => (m.key === oldKey ? { ...m, key: cleanKey } : m)),
              }));
            }
            return modEv;
          });

          const updatedHotspots = (sc.hotspots || []).map((hs: any) => {
            let modHs = { ...hs };
            if (modHs.label && typeof modHs.label === 'string' && modHs.label.includes(`{${oldKey}`)) {
              modHs.label = modHs.label.replace(new RegExp(`\\{${oldKey}(\\||\\})`, 'g'), `{${cleanKey}$1`);
            }
            if (modHs.inspectText && typeof modHs.inspectText === 'string' && modHs.inspectText.includes(`{${oldKey}`)) {
              modHs.inspectText = modHs.inspectText.replace(new RegExp(`\\{${oldKey}(\\||\\})`, 'g'), `{${cleanKey}$1`);
            }
            return {
              ...modHs,
              condition: modHs.condition?.variableKey === oldKey ? { ...modHs.condition, variableKey: cleanKey } : modHs.condition,
              mutation: modHs.mutation?.key === oldKey ? { ...modHs.mutation, key: cleanKey } : modHs.mutation,
            };
          });

          return {
            ...sc,
            timeline: updatedTimeline,
            hotspots: updatedHotspots,
          };
        };

        const updatedChapters = story.chapters.map((ch) => ({
          ...ch,
          scenes: ch.scenes.map(cascadeScene),
        }));

        const updatedScenarios = (story.scenarios || []).map(cascadeScene);

        updatedStory = {
          ...updatedStory,
          chapters: updatedChapters,
          scenarios: updatedScenarios,
        };
      }

      onUpdateStory(updatedStory);
      playSfx('/assets/sfx/success.mp3', false, 0.4);
      notify(keyChanged ? `Variable renamed to '${cleanKey}' & updated across script` : `Variable '${cleanKey}' updated`);
    }
  };

  const handleDeleteVariable = (id: string, keyName: string) => {
    if (confirm(`Delete variable '${keyName}'? Events or choices that depend on it will lose their condition.`)) {
      const filtered = variables.filter((v) => v.id !== id);

      const cleanupScene = (sc: any) => {
        const updatedTimeline = (sc.timeline || []).map((ev: any) => {
          let modEv = { ...ev };
          if (modEv.condition && modEv.condition.variableKey === keyName) {
            modEv.condition = undefined;
          }
          if (modEv.variableMutation && modEv.variableMutation.key === keyName) {
            modEv.variableMutation = undefined;
          }
          if (modEv.type === 'choice' && modEv.options) {
            modEv.options = modEv.options.map((opt: any) => ({
              ...opt,
              condition: opt.condition?.variableKey === keyName ? undefined : opt.condition,
              mutations: opt.mutations?.filter((m: any) => m.key !== keyName),
            }));
          }
          return modEv;
        });

        const updatedHotspots = (sc.hotspots || []).map((hs: any) => ({
          ...hs,
          condition: hs.condition?.variableKey === keyName ? undefined : hs.condition,
          mutation: hs.mutation?.key === keyName ? undefined : hs.mutation,
        }));

        return {
          ...sc,
          timeline: updatedTimeline,
          hotspots: updatedHotspots,
        };
      };

      const updatedChapters = story.chapters.map((ch) => ({
        ...ch,
        scenes: ch.scenes.map(cleanupScene),
      }));
      const updatedScenarios = (story.scenarios || []).map(cleanupScene);

      onUpdateStory({
        ...story,
        variables: filtered,
        chapters: updatedChapters,
        scenarios: updatedScenarios,
      });

      if (selectedVarId === id) {
        if (filtered.length > 0) {
          handleSelectToEdit(filtered[0]);
        } else {
          setSelectedVarId(null);
          setIsCreatingNew(false);
        }
      }
      playSfx('/assets/sfx/corrupt file.mp3', false, 0.3);
      notify(`Variable '${keyName}' deleted & dependencies cleared`);
    }
  };

  const innerCard = (
    <div className={`w-full h-full ${isWorkspaceView ? 'bg-[var(--surface)]' : 'max-w-4xl max-h-[88vh] sm:max-h-[85vh] vn-modal-card'} flex flex-col overflow-hidden text-[var(--text)]`}>
      
      {/* CABECERA */}
      <div className="p-3 vn-glass-header border-b flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--accent-surface)] border border-[var(--border2)] flex items-center justify-center p-1.5 shrink-0 text-[var(--accent)]">
            <GuiIconRenderer icon={GUI_ICONS.action.select} className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
              <span>VARIABLES, FLAGS & INTERPOLATION</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[var(--btn-bg)] text-[var(--accent)] border border-[var(--border)]">
                {variables.length} registered
              </span>
            </h3>
            <p className="text-[10px] text-[var(--muted)]">
              Create counters, flags, and items. Use <span className="text-[var(--accent)] font-mono font-bold">{`{variable_key}`}</span> in any dialogue.
            </p>
          </div>
        </div>
        {!isWorkspaceView && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
            title="Close"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

        {/* PLANTILLAS RÁPIDAS SUGERIDAS */}
        <div className="px-4 py-2.5 bg-[var(--well-bg)] border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider">
            Quick Templates:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {VARIABLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.key}
                type="button"
                onClick={() => handleStartCreate(tmpl)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-[var(--surface-strong)] text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
                title={tmpl.desc}
              >
                <GuiIconRenderer icon={tmpl.icon} size={12} className="text-[var(--accent)]" />
                <span>{tmpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CUERPO PRINCIPAL (2 COLUMNAS) */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 md:p-6 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: LISTA Y BUSCADOR */}
          <div className="w-full md:w-5/12 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-[var(--border)] pr-0 md:pr-4">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Search key or label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[var(--well-bg)] border border-[var(--border)] rounded-md px-2.5 py-1 text-xs text-[var(--text)] placeholder-[var(--muted2)] outline-none focus:border-[var(--accent)] font-mono"
              />
              <button
                type="button"
                onClick={() => handleStartCreate()}
                className="px-3 py-1 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-extrabold rounded-md text-xs uppercase cursor-pointer transition-colors shrink-0 shadow"
              >
                + Create
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredVariables.length === 0 ? (
                <div className="py-12 text-center space-y-3 my-auto">
                  <GuiIconRenderer icon={GUI_ICONS.general.folder} size={28} className="text-[var(--muted)] mx-auto block" />
                  <p className="text-xs text-[var(--muted)]">No variables found.</p>
                  <button
                    type="button"
                    onClick={() => handleStartCreate()}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-md text-xs font-extrabold cursor-pointer transition-all shadow"
                  >
                    + Create New Variable
                  </button>
                </div>
              ) : (
                filteredVariables.map((v) => {
                  const isSelected = v.id === selectedVarId && !isCreatingNew;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectToEdit(v)}
                      className={`p-2.5 rounded-md border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-surface)] ring-1 ring-[var(--accent)]/40 shadow-sm'
                          : 'border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border2)] hover:bg-[var(--panel-hover)]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[var(--accent)] truncate">
                            {`{${v.key}}`}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                            v.type === 'boolean' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' :
                            v.type === 'number' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30' :
                            'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {v.type}
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--muted)] block truncate mt-0.5">
                          {v.label}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[var(--text)] shrink-0 bg-[var(--well-bg)] px-2 py-0.5 rounded-lg border border-[var(--border)]">
                        {String(v.defaultValue)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO DE EDICIÓN / CREACIÓN */}
          <div className="flex-1 overflow-y-auto space-y-4 pl-0 md:pl-2">
            {(isCreatingNew || activeVar) ? (
              <form onSubmit={handleSaveVariable} className="space-y-4 text-xs">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                      {isCreatingNew ? '+ Register New Variable' : `Edit: {${activeVar?.key}}`}
                    </span>
                    {!isCreatingNew && activeVar && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVariable(activeVar.id, activeVar.key)}
                        className="text-[var(--muted2)] hover:text-rose-500 text-xs cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.trash} className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                      Identifier Key (Key) *:
                    </label>
                    <input
                      type="text"
                      required
                      value={formKey}
                      onChange={(e) => setFormKey(e.target.value)}
                      placeholder="Enter variable key here..."
                      className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2.5 text-xs text-[var(--accent)] font-mono font-bold outline-none transition-colors"
                    />
                    <p className="text-[10px] text-[var(--muted2)]">
                      Letters, numbers, and underscores only. Write it in dialogue as <code className="text-[var(--accent)] font-bold">{`{${formKey || 'key'}}`}</code> to display its live value.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                      Descriptive Label *:
                    </label>
                    <input
                      type="text"
                      required
                      value={formLabel}
                      onChange={(e) => setFormLabel(e.target.value)}
                      placeholder="Enter variable label here..."
                      className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none transition-colors"
                    />
                  </div>

                  {/* Tipo de dato */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                      Variable Type:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormType('boolean');
                          setFormDefaultVal(false);
                        }}
                        className={`p-2 rounded-md border text-center font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                          formType === 'boolean'
                            ? 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm'
                            : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                        }`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.circle} size={12} />
                        <span>Boolean (Yes / No)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormType('number');
                          setFormDefaultVal(0);
                        }}
                        className={`p-2 rounded-md border text-center font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                          formType === 'number'
                            ? 'bg-sky-500/20 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm'
                            : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                        }`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.folder} size={12} />
                        <span>Number (Points / Coins)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormType('string');
                          setFormDefaultVal('');
                        }}
                        className={`p-2 rounded-md border text-center font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                          formType === 'string'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                            : 'bg-[var(--well-bg)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--btn-hover-bg)]'
                        }`}
                      >
                        <GuiIconRenderer icon={GUI_ICONS.general.texts} size={12} />
                        <span>String (Text / State)</span>
                      </button>
                    </div>
                  </div>

                  {/* Valor Inicial Predeterminado */}
                  <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                    <label className="text-[10px] text-[var(--muted)] font-bold uppercase block">
                      Initial Default Value (When starting a new game):
                    </label>
                    {formType === 'boolean' ? (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer bg-[var(--well-bg)] px-3 py-2 rounded-md border border-[var(--border)] hover:border-[var(--border2)] transition-colors">
                          <input
                            type="radio"
                            name="defaultVal"
                            checked={formDefaultVal === true}
                            onChange={() => setFormDefaultVal(true)}
                            className="accent-[var(--accent)]"
                          />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">true (Enabled / Obtained)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer bg-[var(--well-bg)] px-3 py-2 rounded-md border border-[var(--border)] hover:border-[var(--border2)] transition-colors">
                          <input
                            type="radio"
                            name="defaultVal"
                            checked={formDefaultVal === false}
                            onChange={() => setFormDefaultVal(false)}
                            className="accent-[var(--accent)]"
                          />
                          <span className="text-rose-500 font-bold font-mono text-xs">false (Disabled / Not obtained)</span>
                        </label>
                      </div>
                    ) : formType === 'number' ? (
                      <input
                        type="number"
                        value={formDefaultVal}
                        onChange={(e) => setFormDefaultVal(Number(e.target.value))}
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2.5 text-xs text-[var(--accent)] font-mono outline-none transition-colors"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formDefaultVal}
                        onChange={(e) => setFormDefaultVal(e.target.value)}
                        placeholder="Enter initial value here..."
                        className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-md p-2.5 text-xs text-[var(--text)] outline-none transition-colors"
                      />
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] rounded-md text-xs font-extrabold uppercase cursor-pointer transition-all shadow flex items-center gap-1.5"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.general.save} className="w-3.5 h-3.5" />
                      <span>{isCreatingNew ? 'Save & Register' : 'Update Variable'}</span>
                    </button>
                  </div>
                </div>

                {/* Tarjeta de Guía Rápida de Uso */}
                <div className="p-3.5 bg-[var(--accent-surface)] border border-[var(--border2)] rounded-lg space-y-1.5 text-[var(--muted)] leading-relaxed text-[11px]">
                  <span className="text-[var(--accent)] font-bold uppercase flex items-center gap-1.5">
                    <GuiIconRenderer icon={GUI_ICONS.action.lightBulb} size={14} />
                    <span>How to use this variable in your story?</span>
                  </span>
                  <p>1. <b>In Dialogue:</b> Write <code className="text-[var(--accent)] bg-[var(--well-bg)] px-1.5 py-0.5 rounded border border-[var(--border)] font-bold">{`{${formKey || 'key'}}`}</code> in dialogue lines to dynamically show its live value.</p>
                  <p>2. <b>In Choices:</b> Lock options so they only unlock if this variable meets an equality or comparison check.</p>
                  <p>3. <b>In Timeline:</b> Add a <i>Modify Variable</i> or <i>Conditional Branch</i> event node to branch your story based on this value.</p>
                </div>
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--muted2)] text-xs">
                Select a variable from the left list to edit or click "+ Create".
              </div>
            )}
          </div>

        </div>

        {/* PIE DEL MODAL */}
        {!isWorkspaceView && onClose && (
          <div className="flex items-center justify-end pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] font-bold rounded-md text-xs uppercase cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.check} size={14} className="text-[var(--accent)]" />
              <span>Done / Return to Editor</span>
            </button>
          </div>
        )}

      </div>
  );

  if (isWorkspaceView) {
    return <div className="w-full h-full overflow-hidden flex flex-col">{innerCard}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-3 sm:p-6 flex items-center justify-center animate-fade-in font-sans">
      {innerCard}
    </div>
  );
}
