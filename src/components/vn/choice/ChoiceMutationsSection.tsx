"use client";
import React, { useState } from 'react';
import { VNStory, VNChoiceOption, VNVariableMutation } from '@/types/vn';
import { playSfx } from '@/lib/audioSettings';
import { GuiIconRenderer, GUI_ICONS } from '@/lib/vn/guiIcons';

export interface ChoiceMutationsSectionProps {
  activeOption: VNChoiceOption;
  selectedOptIndex: number;
  story: VNStory;
  handleUpdateChoiceOption: (index: number, patch: Partial<VNChoiceOption>) => void;
  notify: (msg: string) => void;
}

export function ChoiceMutationsSection({
  activeOption,
  selectedOptIndex,
  story,
  handleUpdateChoiceOption,
  notify,
}: ChoiceMutationsSectionProps) {
  const [showAddMutation, setShowAddMutation] = useState<boolean>(false);
  const [mutVarKey, setMutVarKey] = useState<string>(story.variables?.[0]?.key || '');
  const [mutOp, setMutOp] = useState<'set' | 'add' | 'subtract'>('set');
  const [mutVal, setMutVal] = useState<string>('true');

  return (
    <div className="bg-[var(--well-bg)] border border-[var(--border)] rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
          <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Modify Variables on Choosing this Option (Effects):</span>
        </span>
        <button
          type="button"
          onClick={() => setShowAddMutation(!showAddMutation)}
          className="text-xs text-[var(--accent)] font-bold flex items-center gap-1 cursor-pointer bg-[var(--accent-surface)] hover:bg-[var(--panel-hover)] px-2.5 py-1 rounded-lg border border-[var(--border2)] hover:border-[var(--accent)] transition-colors"
        >
          <span>+</span> Add Variable
        </button>
      </div>

      {/* List of configured mutations */}
      <div className="space-y-1.5">
        {activeOption.mutations && activeOption.mutations.length > 0 ? (
          activeOption.mutations.map((mut, mIdx) => (
            <div
              key={mIdx}
              className="flex items-center justify-between p-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg text-xs"
            >
              <div className="flex items-center gap-2 font-mono">
                <GuiIconRenderer icon={GUI_ICONS.general.files} className="w-3 h-3 text-[var(--accent)] opacity-70" />
                <span className="text-[var(--accent)] font-bold">{mut.key}</span>
                <span className="text-[var(--muted)]">
                  {mut.operation === 'set' ? '=' : mut.operation === 'add' ? '+=' : '-='}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{String(mut.value)}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const filtered = activeOption.mutations!.filter((_, i) => i !== mIdx);
                  handleUpdateChoiceOption(selectedOptIndex, { mutations: filtered });
                }}
                className="text-red-500 hover:text-red-600 text-xs cursor-pointer p-1 hover:bg-red-500/10 rounded flex items-center justify-center transition-colors"
                title="Delete variable"
              >
                <GuiIconRenderer icon={GUI_ICONS.action.cancel} className="w-3 h-3" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-[var(--muted2)] italic">
            No variable mutations configured for this option.
          </p>
        )}
      </div>

      {/* Quick form to add variable */}
      {showAddMutation && (
        <div className="p-2.5 bg-[var(--panel)] border border-[var(--border2)] rounded-xl space-y-2 text-xs animate-fade-in shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-0.5">
              <label className="text-[9px] text-[var(--muted)] uppercase font-semibold">Variable:</label>
              {story.variables && story.variables.length > 0 ? (
                <select
                  value={mutVarKey}
                  onChange={(e) => setMutVarKey(e.target.value)}
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-1 text-xs text-[var(--text)] font-mono outline-none"
                >
                  {story.variables.map((v) => (
                    <option key={v.id} value={v.key}>
                      {v.label} ({v.key})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="variable_key"
                  value={mutVarKey}
                  onChange={(e) => setMutVarKey(e.target.value)}
                  className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-1 text-xs text-[var(--text)] font-mono outline-none"
                />
              )}
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-[var(--muted)] uppercase font-semibold">Operation:</label>
              <select
                value={mutOp}
                onChange={(e) => setMutOp(e.target.value as any)}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-1 text-xs text-[var(--text)] outline-none"
              >
                <option value="set">= Assign (set)</option>
                <option value="add">+= Add (add)</option>
                <option value="subtract">-= Subtract (sub)</option>
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[9px] text-[var(--muted)] uppercase font-semibold">Value:</label>
              <input
                type="text"
                value={mutVal}
                onChange={(e) => setMutVal(e.target.value)}
                placeholder="true, 10, 'yes'..."
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] rounded-lg p-1 text-xs text-[var(--text)] font-mono outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddMutation(false)}
              className="px-2 py-0.5 text-[10px] text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const key = mutVarKey.trim() || story.variables?.[0]?.key;
                if (!key) {
                  playSfx('/assets/sfx/corrupt file.mp3', false, 0.4);
                  notify('You must specify a variable key.');
                  return;
                }
                const varDef = story.variables?.find((v) => v.key === key);
                let parsed: boolean | number | string = mutVal.trim();
                if (varDef?.type === 'string') {
                  parsed = mutVal;
                } else if (varDef?.type === 'number') {
                  const n = Number(parsed);
                  parsed = Number.isFinite(n) ? n : 0;
                } else if (varDef?.type === 'boolean') {
                  parsed = parsed === 'true';
                } else {
                  if (parsed === 'true') parsed = true;
                  else if (parsed === 'false') parsed = false;
                  else if (!isNaN(Number(parsed)) && parsed !== '') parsed = Number(parsed);
                }

                const newMut: VNVariableMutation = {
                  key,
                  operation: mutOp,
                  value: parsed,
                };
                const updated = [...(activeOption.mutations || []), newMut];
                handleUpdateChoiceOption(selectedOptIndex, { mutations: updated });
                setShowAddMutation(false);
                notify(`Variable '${key}' assigned`);
              }}
              className="px-3 py-1 bg-gradient-to-r from-[#D17BF8] to-[#B15BE4] hover:opacity-90 text-[#0F0503] font-bold rounded-lg text-xs uppercase cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            >
              <GuiIconRenderer icon={GUI_ICONS.action.check} className="w-3.5 h-3.5" />
              <span>Save Variable</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
