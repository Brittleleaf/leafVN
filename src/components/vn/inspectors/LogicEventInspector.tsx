"use client";
import React from 'react';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { EventInspectorSubProps } from './types';

export const LogicEventInspector: React.FC<EventInspectorSubProps> = ({
  currentLine,
  story,
  currentChapter,
  onUpdateCurrentLine,
  onOpenGlobalModal,
}) => {
  return (
    <>
      {/* CASE: CONDITIONAL BRANCH (IF / ELSE) */}
      {currentLine.type === 'conditional_branch' && (
        <div className="space-y-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.track.branch} size={14} className="text-emerald-500" />
              <span>Conditional Branch Configuration</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenGlobalModal('variables')}
              className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
            >
              Open Variable Studio ➔
            </button>
          </div>

          {/* Condition to evaluate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">Variable to check:</label>
              <select
                value={currentLine.condition?.variableKey || (story.variables?.[0]?.key || '')}
                onChange={(e) => {
                  const varKey = e.target.value;
                  const selectedVar = story.variables?.find((v) => v.key === varKey);
                  onUpdateCurrentLine('condition', {
                    variableKey: varKey,
                    operator: currentLine.condition?.operator || '==',
                    value: currentLine.condition?.value !== undefined ? currentLine.condition.value : (selectedVar?.defaultValue ?? true),
                  });
                }}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
              >
                {(!story.variables || story.variables.length === 0) ? (
                  <option value="has_keycard">has_keycard (Default)</option>
                ) : (
                  story.variables.map((v) => (
                    <option key={v.id} value={v.key}>
                      {v.key} ({v.type})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">Operator:</label>
              <select
                value={currentLine.condition?.operator || '=='}
                onChange={(e) => {
                  onUpdateCurrentLine('condition', {
                    variableKey: currentLine.condition?.variableKey || (story.variables?.[0]?.key || 'has_keycard'),
                    operator: e.target.value as any,
                    value: currentLine.condition?.value ?? true,
                  });
                }}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
              >
                <option value="==">== (Equal to)</option>
                <option value="!=">!= (Not equal to)</option>
                <option value=">">&gt; (Greater than)</option>
                <option value="<">&lt; (Less than)</option>
                <option value=">=">&gt;= (Greater or equal)</option>
                <option value="<=">&lt;= (Less or equal)</option>
                <option value="truthy">truthy (Is Active / True)</option>
                <option value="falsy">falsy (Is Inactive / False)</option>
                <option value="contains">contains (Text contains)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">
                Required value {['truthy', 'falsy'].includes(currentLine.condition?.operator || '') ? '(Not needed)' : ''}:
              </label>
              <input
                type="text"
                value={String(currentLine.condition?.value ?? true)}
                onChange={(e) => {
                  let val: any = e.target.value;
                  if (val === 'true') val = true;
                  else if (val === 'false') val = false;
                  else if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val);
                  onUpdateCurrentLine('condition', {
                    variableKey: currentLine.condition?.variableKey || (story.variables?.[0]?.key || 'has_keycard'),
                    operator: currentLine.condition?.operator || '==',
                    value: val,
                  });
                }}
                placeholder="true / false / number"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
              />
            </div>
          </div>

          {/* Destinations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
            <div className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/30 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.action.check} size={12} />
                <span>If condition is met (TRUE):</span>
              </span>
              <select
                value={currentLine.conditionalTargetSceneId || ''}
                onChange={(e) => onUpdateCurrentLine('conditionalTargetSceneId', e.target.value || undefined)}
                className="w-full bg-[var(--well-bg)] border border-emerald-500/40 rounded-lg p-1.5 text-xs text-[var(--text)] outline-none"
              >
                <option value="">-- Continue to next line --</option>
                {story?.chapters && story.chapters.length > 1
                  ? story.chapters.map((ch) => (
                      <optgroup key={ch.id} label={`Chapter ${ch.number || ''}: ${ch.title}`}>
                        {ch.scenes.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            Jump to: {sc.name}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : currentChapter?.scenes.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        Jump to: {sc.name}
                      </option>
                    ))}
                {story?.scenarios && story.scenarios.length > 0 && (
                  <optgroup label="Library / Reserve Scenarios">
                    {story.scenarios
                      .filter((sc) => !story.chapters.some((ch) => ch.scenes.some((s) => s.id === sc.id)))
                      .map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          Jump to: {sc.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="p-2.5 bg-red-500/5 rounded-lg border border-red-500/30 space-y-1.5">
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-1.5">
                <GuiIconRenderer icon={GUI_ICONS.action.delete} size={12} />
                <span>If condition is not met (FALSE / ELSE):</span>
              </span>
              <select
                value={currentLine.elseTargetSceneId || ''}
                onChange={(e) => onUpdateCurrentLine('elseTargetSceneId', e.target.value || undefined)}
                className="w-full bg-[var(--well-bg)] border border-red-500/40 rounded-lg p-1.5 text-xs text-[var(--text)] outline-none"
              >
                <option value="">-- Continue to next line --</option>
                {story?.chapters && story.chapters.length > 1
                  ? story.chapters.map((ch) => (
                      <optgroup key={ch.id} label={`Chapter ${ch.number || ''}: ${ch.title}`}>
                        {ch.scenes.map((sc) => (
                          <option key={sc.id} value={sc.id}>
                            Jump to: {sc.name}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : currentChapter?.scenes.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        Jump to: {sc.name}
                      </option>
                    ))}
                {story?.scenarios && story.scenarios.length > 0 && (
                  <optgroup label="Library / Reserve Scenarios">
                    {story.scenarios
                      .filter((sc) => !story.chapters.some((ch) => ch.scenes.some((s) => s.id === sc.id)))
                      .map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          Jump to: {sc.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* CASE: MUTATE VARIABLE (MUTATE_VARIABLE) */}
      {currentLine.type === 'mutate_variable' && (
        <div className="space-y-3 p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <GuiIconRenderer icon={GUI_ICONS.general.folder} size={14} className="text-amber-500" />
              <span>Mutate Variable State</span>
            </span>
            <button
              type="button"
              onClick={() => onOpenGlobalModal('variables')}
              className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
            >
              Open Variable Studio ➔
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">Variable to mutate:</label>
              <select
                value={currentLine.variableMutation?.key || (story.variables?.[0]?.key || '')}
                onChange={(e) => {
                  const varKey = e.target.value;
                  const selectedVar = story.variables?.find((v) => v.key === varKey);
                  onUpdateCurrentLine('variableMutation', {
                    key: varKey,
                    operation: currentLine.variableMutation?.operation || 'set',
                    value: currentLine.variableMutation?.value !== undefined ? currentLine.variableMutation.value : (selectedVar?.defaultValue ?? true),
                  });
                }}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
              >
                {(!story.variables || story.variables.length === 0) ? (
                  <option value="has_keycard">has_keycard</option>
                ) : (
                  story.variables.map((v) => (
                    <option key={v.id} value={v.key}>
                      {v.key} ({v.type})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">Operation:</label>
              <select
                value={currentLine.variableMutation?.operation || 'set'}
                onChange={(e) => {
                  onUpdateCurrentLine('variableMutation', {
                    key: currentLine.variableMutation?.key || (story.variables?.[0]?.key || 'has_keycard'),
                    operation: e.target.value as any,
                    value: currentLine.variableMutation?.value ?? true,
                  });
                }}
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] outline-none"
              >
                <option value="set">set (Set exact value)</option>
                <option value="add">add (Add amount)</option>
                <option value="subtract">subtract (Subtract amount)</option>
                <option value="toggle">toggle (Invert boolean true/false)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[var(--muted)] uppercase block mb-1">Value to apply:</label>
              <input
                type="text"
                value={String(currentLine.variableMutation?.value ?? true)}
                onChange={(e) => {
                  let val: any = e.target.value;
                  if (val === 'true') val = true;
                  else if (val === 'false') val = false;
                  else if (!isNaN(Number(val)) && val.trim() !== '') val = Number(val);
                  onUpdateCurrentLine('variableMutation', {
                    key: currentLine.variableMutation?.key || (story.variables?.[0]?.key || 'has_keycard'),
                    operation: currentLine.variableMutation?.operation || 'set',
                    value: val,
                  });
                }}
                placeholder="true / false / number"
                className="w-full bg-[var(--well-bg)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-1.5 text-xs text-[var(--text)] font-mono outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
