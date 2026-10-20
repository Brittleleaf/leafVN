"use client";
import React, { useMemo } from 'react';
import { VNStory, VNScene } from '@/types/vn';
import { GUI_ICONS, GuiIconRenderer } from '@/lib/vn/guiIcons';
import { playSfx } from '@/lib/audioSettings';

export interface ScriptIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'Branching' | 'Navigation' | 'Audio/Visual' | 'Structure';
  title: string;
  description: string;
  chapterId?: string;
  sceneId?: string;
  lineIndex?: number;
}

interface ProjectDoctorModalProps {
  story: VNStory;
  onNavigateToIssue: (chapterId: string, sceneId: string, lineIndex?: number) => void;
  onClose: () => void;
}

export default function ProjectDoctorModal({
  story,
  onNavigateToIssue,
  onClose,
}: ProjectDoctorModalProps) {
  // Analyze the story for broken links, missing assets, and logical inconsistencies
  const issues: ScriptIssue[] = useMemo(() => {
    const list: ScriptIssue[] = [];

    // Map of all known scene IDs, character IDs, and variable keys
    const allSceneIds = new Set<string>();
    story.chapters.forEach((ch) => {
      ch.scenes.forEach((sc) => allSceneIds.add(sc.id));
    });
    story.scenarios?.forEach((sc) => allSceneIds.add(sc.id));
    const allCharIds = new Set(story.characters.map((c) => c.id));
    const allVarKeys = new Set(story.variables?.map((v) => v.key) || []);
    const auditScene = (sc: VNScene, chId: string, isLibrary = false) => {
      const prefix = isLibrary ? 'lib-' : '';
      const scLabel = isLibrary ? `Library Scenario "${sc.name}"` : `"${sc.name}"`;

      // 1. Check empty scene
      if (!sc.timeline || sc.timeline.length === 0) {
        list.push({
          id: `${prefix}empty-scene-${sc.id}`,
          severity: 'warning',
          category: 'Structure',
          title: `Empty Scenario: ${scLabel}`,
          description: `Scenario has no dialogues or events in its script timeline.`,
          chapterId: chId,
          sceneId: sc.id,
        });
      }

      // 2. Check hotspots jump_scene, character, and variables
      sc.hotspots?.forEach((hs) => {
        if (hs.actionType === 'jump_scene' && hs.targetSceneId) {
          if (!allSceneIds.has(hs.targetSceneId)) {
            list.push({
              id: `${prefix}hs-broken-target-${hs.id}`,
              severity: 'error',
              category: 'Navigation',
              title: `Broken Door/Button Target in ${scLabel}`,
              description: `Button "${hs.label}" jumps to scene ID "${hs.targetSceneId}", which does not exist in any chapter.`,
              chapterId: chId,
              sceneId: sc.id,
            });
          }
        }
        if (hs.actionType === 'trigger_dialogue' && hs.dialogueCharacterId && !allCharIds.has(hs.dialogueCharacterId)) {
          list.push({
            id: `${prefix}hs-missing-char-${hs.id}`,
            severity: 'warning',
            category: 'Audio/Visual',
            title: `Unknown Character Assigned in Button "${hs.label}"`,
            description: `Interaction is assigned to character ID "${hs.dialogueCharacterId}", which is not registered in the character catalog.`,
            chapterId: chId,
            sceneId: sc.id,
          });
        }
        if (hs.condition?.variableKey && !allVarKeys.has(hs.condition.variableKey)) {
          list.push({
            id: `${prefix}hs-missing-var-${hs.id}`,
            severity: 'warning',
            category: 'Branching',
            title: `Missing Variable in Button "${hs.label}" Condition`,
            description: `Condition checks variable "${hs.condition.variableKey}", which is not registered in Variables Studio.`,
            chapterId: chId,
            sceneId: sc.id,
          });
        }
        if (hs.mutation?.key && !allVarKeys.has(hs.mutation.key)) {
          list.push({
            id: `${prefix}hs-missing-mut-var-${hs.id}`,
            severity: 'warning',
            category: 'Branching',
            title: `Missing Variable in Button "${hs.label}" Mutation`,
            description: `Button mutates variable "${hs.mutation.key}", which is not registered in Variables Studio.`,
            chapterId: chId,
            sceneId: sc.id,
          });
        }
      });

      // 2.1 Check static screen button jump targets
      if (sc.sceneType === 'event' && sc.eventSubtype === 'static' && sc.staticScreenConfig?.buttons) {
        sc.staticScreenConfig.buttons.forEach((btn) => {
          if (btn.action === 'jump_scene' && btn.targetSceneId && !allSceneIds.has(btn.targetSceneId)) {
            list.push({
              id: `${prefix}static-btn-broken-target-${btn.id}`,
              severity: 'error',
              category: 'Navigation',
              title: `Broken Button Target in Static Screen ${scLabel}`,
              description: `Button "${btn.label}" jumps to scene ID "${btn.targetSceneId}", which does not exist in any chapter.`,
              chapterId: chId,
              sceneId: sc.id,
            });
          }
        });
      }

      // 2.2 Check cinematic end scene target
      if (sc.sceneType === 'event' && sc.eventSubtype === 'cinematic' && sc.cinematicConfig?.targetSceneIdOnEnd) {
        if (!allSceneIds.has(sc.cinematicConfig.targetSceneIdOnEnd)) {
          list.push({
            id: `${prefix}cinematic-broken-target-${sc.id}`,
            severity: 'error',
            category: 'Navigation',
            title: `Broken End Target in Cinematic ${scLabel}`,
            description: `Cinematic sequence ends jumping to scene ID "${sc.cinematicConfig.targetSceneIdOnEnd}", which does not exist in any chapter.`,
            chapterId: chId,
            sceneId: sc.id,
          });
        }
      }

      // 3. Check timeline events
      const sceneEventIds = new Set(sc.timeline?.map((ev) => ev.id) || []);
      let activeFxStart: string | null = null;

      sc.timeline?.forEach((ev, idx) => {
        // Choice target validations
        if (ev.type === 'choice' && ev.options) {
          ev.options.forEach((opt, optIdx) => {
            if (opt.targetSceneId) {
              if (!allSceneIds.has(opt.targetSceneId)) {
                list.push({
                  id: `${prefix}choice-broken-scene-${ev.id}-${opt.id}`,
                  severity: 'error',
                  category: 'Navigation',
                  title: `Invalid Choice Target Scene in ${scLabel} (Line #${idx + 1})`,
                  description: `Option #${optIdx + 1} ("${opt.label}") jumps to scene ID "${opt.targetSceneId}", which does not exist in any chapter.`,
                  chapterId: chId,
                  sceneId: sc.id,
                  lineIndex: idx,
                });
              }
            } else if (opt.targetEventId) {
              if (!sceneEventIds.has(opt.targetEventId)) {
                list.push({
                  id: `${prefix}choice-broken-id-${ev.id}-${opt.id}`,
                  severity: 'error',
                  category: 'Branching',
                  title: `Broken Choice Branch in ${scLabel} (Line #${idx + 1})`,
                  description: `Option #${optIdx + 1} ("${opt.label}") jumps to a line ID that was removed or does not exist.`,
                  chapterId: chId,
                  sceneId: sc.id,
                  lineIndex: idx,
                });
              }
            } else if (typeof opt.jumpToEventIndex === 'number') {
              if (!Number.isFinite(opt.jumpToEventIndex) || opt.jumpToEventIndex < 0 || opt.jumpToEventIndex >= sc.timeline.length) {
                list.push({
                  id: `${prefix}choice-out-of-bounds-${ev.id}-${opt.id}`,
                  severity: 'error',
                  category: 'Branching',
                  title: `Out-of-Bounds Jump in ${scLabel} (Line #${idx + 1})`,
                  description: `Option #${optIdx + 1} ("${opt.label}") jumps to line index #${opt.jumpToEventIndex + 1}, but this scene only has ${sc.timeline.length} lines.`,
                  chapterId: chId,
                  sceneId: sc.id,
                  lineIndex: idx,
                });
              }
            }

            // Choice reaction character check
            if (opt.reaction?.characterId && !allCharIds.has(opt.reaction.characterId)) {
              list.push({
                id: `${prefix}choice-reaction-missing-char-${ev.id}-${opt.id}`,
                severity: 'warning',
                category: 'Audio/Visual',
                title: `Unknown Reaction Character in ${scLabel} (Line #${idx + 1})`,
                description: `Option #${optIdx + 1} ("${opt.label}") reaction is assigned to character ID "${opt.reaction.characterId}", which is not registered in the character catalog.`,
                chapterId: chId,
                sceneId: sc.id,
                lineIndex: idx,
              });
            }

            // Choice option condition check
            if (opt.condition?.variableKey && !allVarKeys.has(opt.condition.variableKey)) {
              list.push({
                id: `${prefix}choice-opt-missing-cond-${ev.id}-${opt.id}`,
                severity: 'warning',
                category: 'Branching',
                title: `Missing Variable in Option Condition in ${scLabel} (Line #${idx + 1})`,
                description: `Option #${optIdx + 1} ("${opt.label}") condition checks variable "${opt.condition.variableKey}", which is not registered in Variables Studio.`,
                chapterId: chId,
                sceneId: sc.id,
                lineIndex: idx,
              });
            }

            // Choice option mutations check
            if (opt.mutations) {
              opt.mutations.forEach((mut) => {
                if (mut.key && !allVarKeys.has(mut.key)) {
                  list.push({
                    id: `${prefix}choice-opt-missing-mut-${ev.id}-${opt.id}-${mut.key}`,
                    severity: 'warning',
                    category: 'Branching',
                    title: `Missing Variable in Option Mutation in ${scLabel} (Line #${idx + 1})`,
                    description: `Option #${optIdx + 1} ("${opt.label}") mutates variable "${mut.key}", which is not registered in Variables Studio.`,
                    chapterId: chId,
                    sceneId: sc.id,
                    lineIndex: idx,
                  });
                }
              });
            }
          });
        }

        // Conditional branch target validations
        if (ev.type === 'conditional_branch') {
          if (ev.conditionalTargetSceneId && !allSceneIds.has(ev.conditionalTargetSceneId)) {
            list.push({
              id: `${prefix}branch-target-broken-${ev.id}`,
              severity: 'error',
              category: 'Branching',
              title: `Invalid Conditional Target Scene in ${scLabel} (Line #${idx + 1})`,
              description: `Conditional branch points to non-existent scene ID "${ev.conditionalTargetSceneId}".`,
              chapterId: chId,
              sceneId: sc.id,
              lineIndex: idx,
            });
          }
          if (ev.elseTargetSceneId && !allSceneIds.has(ev.elseTargetSceneId)) {
            list.push({
              id: `${prefix}else-target-broken-${ev.id}`,
              severity: 'error',
              category: 'Branching',
              title: `Invalid "Else" Target Scene in ${scLabel} (Line #${idx + 1})`,
              description: `Conditional branch "else" points to non-existent scene ID "${ev.elseTargetSceneId}".`,
              chapterId: chId,
              sceneId: sc.id,
              lineIndex: idx,
            });
          }
          if (ev.conditionalTargetEventId && !sceneEventIds.has(ev.conditionalTargetEventId)) {
            list.push({
              id: `${prefix}branch-target-event-broken-${ev.id}`,
              severity: 'error',
              category: 'Branching',
              title: `Broken Conditional Line Target in ${scLabel} (Line #${idx + 1})`,
              description: `Conditional branch points to line ID "${ev.conditionalTargetEventId}", which no longer exists in this timeline.`,
              chapterId: chId,
              sceneId: sc.id,
              lineIndex: idx,
            });
          }
          if (ev.elseTargetEventId && !sceneEventIds.has(ev.elseTargetEventId)) {
            list.push({
              id: `${prefix}else-target-event-broken-${ev.id}`,
              severity: 'error',
              category: 'Branching',
              title: `Broken "Else" Line Target in ${scLabel} (Line #${idx + 1})`,
              description: `Conditional branch "else" points to line ID "${ev.elseTargetEventId}", which no longer exists in this timeline.`,
              chapterId: chId,
              sceneId: sc.id,
              lineIndex: idx,
            });
          }
        }

        // In-scene explicit jump target validation for any event
        if (ev.targetEventId && !sceneEventIds.has(ev.targetEventId)) {
          list.push({
            id: `${prefix}event-broken-target-${ev.id}`,
            severity: 'error',
            category: 'Branching',
            title: `Broken Destination Line in ${scLabel} (Line #${idx + 1})`,
            description: `Event specifies a jump to line ID "${ev.targetEventId}", which does not exist in this timeline.`,
            chapterId: chId,
            sceneId: sc.id,
            lineIndex: idx,
          });
        }

        // Jump scenario event target validation
        if (ev.type === 'jump_scene') {
          if (!ev.targetSceneId || !allSceneIds.has(ev.targetSceneId)) {
            list.push({
              id: `${prefix}jump-scene-broken-${ev.id}`,
              severity: 'error',
              category: 'Navigation',
              title: `Broken Jump Scenario in ${scLabel} (Line #${idx + 1})`,
              description: `Jump event points to ${ev.targetSceneId ? `non-existent scene ID "${ev.targetSceneId}"` : 'an empty or unselected scenario'}.`,
              chapterId: chId,
              sceneId: sc.id,
              lineIndex: idx,
            });
          }
        }

        // Dialogue and stage character validation
        if (ev.type === 'dialogue' && ev.characterId && !allCharIds.has(ev.characterId)) {
          list.push({
            id: `${prefix}dialogue-missing-char-${ev.id}`,
            severity: 'warning',
            category: 'Audio/Visual',
            title: `Unknown Character Assigned in ${scLabel} (Line #${idx + 1})`,
            description: `Dialogue is assigned to character ID "${ev.characterId}", which does not exist in the character catalog.`,
            chapterId: chId,
            sceneId: sc.id,
            lineIndex: idx,
          });
        }

        if ((ev.type === 'character_enter' || ev.type === 'character_exit') && ev.characterId && !allCharIds.has(ev.characterId)) {
          list.push({
            id: `${prefix}char-stage-missing-${ev.id}`,
            severity: 'warning',
            category: 'Audio/Visual',
            title: `Unknown Character in Stage Event in ${scLabel} (Line #${idx + 1})`,
            description: `Event "${ev.type === 'character_enter' ? 'Character Enter' : 'Character Exit'}" specifies ID "${ev.characterId}", which does not exist in the character catalog.`,
            chapterId: chId,
            sceneId: sc.id,
            lineIndex: idx,
          });
        }

        // Variable existence validations
        if (ev.type === 'conditional_branch' && ev.condition?.variableKey && !allVarKeys.has(ev.condition.variableKey)) {
          list.push({
            id: `${prefix}cond-missing-var-${ev.id}`,
            severity: 'warning',
            category: 'Branching',
            title: `Missing Variable in Condition in ${scLabel} (Line #${idx + 1})`,
            description: `Condition checks variable "${ev.condition.variableKey}", which is not registered in Variables Studio.`,
            chapterId: chId,
            sceneId: sc.id,
            lineIndex: idx,
          });
        }

        if (ev.type === 'mutate_variable' && ev.variableMutation?.key && !allVarKeys.has(ev.variableMutation.key)) {
          list.push({
            id: `${prefix}mutate-missing-var-${ev.id}`,
            severity: 'warning',
            category: 'Branching',
            title: `Missing Variable in Mutation in ${scLabel} (Line #${idx + 1})`,
            description: `Event mutates variable "${ev.variableMutation.key}", which is not registered in Variables Studio.`,
            chapterId: chId,
            sceneId: sc.id,
            lineIndex: idx,
          });
        }

        // Screen FX pairing check
        if (ev.type === 'fx_start') {
          activeFxStart = ev.id;
        } else if (ev.type === 'fx_end') {
          activeFxStart = null;
        }
      });

      if (activeFxStart) {
        list.push({
          id: `${prefix}fx-unclosed-${activeFxStart}`,
          severity: 'info',
          category: 'Audio/Visual',
          title: `Open Screen FX in ${scLabel}`,
          description: `An FX Start event was opened in this scenario without an FX End event before the scene finishes. The effect will remain active until the end of the scene.`,
          chapterId: chId,
          sceneId: sc.id,
        });
      }
    };

    // Check each chapter and scene
    story.chapters.forEach((ch) => {
      if (ch.scenes.length === 0) {
        list.push({
          id: `empty-chap-${ch.id}`,
          severity: 'warning',
          category: 'Structure',
          title: `Empty Chapter: "${ch.title}"`,
          description: `Chapter #${ch.number} contains zero scenarios. Readers will have nothing to view.`,
          chapterId: ch.id,
        });
      }
      ch.scenes.forEach((sc) => auditScene(sc, ch.id, false));
    });

    // 4. Validate unplaced reserve scenarios in library
    const fallbackChapterId = story.chapters[0]?.id || '';
    const placedSceneIds = new Set<string>();
    story.chapters.forEach((ch) => ch.scenes.forEach((sc) => placedSceneIds.add(sc.id)));
    const unplacedScenarios = (story.scenarios || []).filter((sc) => !placedSceneIds.has(sc.id));
    unplacedScenarios.forEach((sc) => auditScene(sc, fallbackChapterId, true));

    return list;
  }, [story]);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const healthScore = Math.max(0, 100 - errorCount * 25 - warningCount * 10);

  return (
    <div className="fixed inset-0 z-50 vn-modal-backdrop p-4 md:p-8 flex items-center justify-center animate-fade-in font-sans">
      <div className="max-w-3xl w-full vn-modal-card flex flex-col max-h-[85vh] overflow-hidden text-[var(--text)]">
        
        {/* HEADER */}
        <div className="p-4 md:px-6 border-b vn-glass-header flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-sm">
              <GuiIconRenderer icon={GUI_ICONS.general.briefcase} className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <span>PROJECT DOCTOR & DIAGNOSTICS</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                  healthScore === 100
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-800 dark:text-emerald-300'
                    : healthScore >= 70
                    ? 'bg-amber-500/20 border border-amber-500 text-amber-800 dark:text-amber-300'
                    : 'bg-red-500/20 border border-red-500 text-red-800 dark:text-red-300'
                }`}>
                  Health: {healthScore}%
                </span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Automated check for broken branching links, target scenes, and story integrity.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <GuiIconRenderer icon={GUI_ICONS.general.cancel} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* STATUS SUMMARY STATS */}
        <div className="px-6 py-3 bg-[var(--well-bg)] border-b border-[var(--border)] flex items-center gap-4 text-xs shrink-0 flex-wrap">
          <span className="text-[var(--muted)] uppercase font-bold text-[11px]">Audit Results:</span>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 font-mono">
            <span className="font-bold">{errorCount}</span>
            <span>Errors</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-mono">
            <span className="font-bold">{warningCount}</span>
            <span>Warnings</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-300 font-mono">
            <span className="font-bold">{infoCount}</span>
            <span>Notes</span>
          </div>

          <div className="ml-auto text-[var(--muted2)] font-mono text-[11px]">
            {story.chapters.length} Chapters • {story.chapters.reduce((acc, c) => acc + c.scenes.length, 0)} Scenarios
          </div>
        </div>

        {/* ISSUES LIST */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {issues.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <GuiIconRenderer icon={GUI_ICONS.general.badgeCheck} className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-widest">
                All Checks Passed! Perfect Story Integrity
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
                No broken links, orphaned jump targets, or missing branches detected in your project.
              </p>
            </div>
          ) : (
            issues.map((issue) => {
              const isError = issue.severity === 'error';
              const isWarning = issue.severity === 'warning';

              return (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isError
                      ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/60'
                      : isWarning
                      ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
                      : 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/60'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                        isError
                          ? 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/40'
                      }`}>
                        {issue.severity}
                      </span>

                      <span className="text-[10px] text-[var(--muted2)] uppercase font-semibold">
                        [{issue.category}]
                      </span>

                      <h4 className="text-xs font-bold text-[var(--text)] truncate">
                        {issue.title}
                      </h4>
                    </div>

                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {issue.sceneId && (
                    <button
                      onClick={() => {
                        playSfx('/assets/sfx/click intro.mp3', false, 0.2);
                        onNavigateToIssue(issue.chapterId || story.chapters[0]?.id, issue.sceneId!, issue.lineIndex);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] border border-[var(--border)] hover:border-emerald-500 text-[var(--text)] rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                    >
                      <GuiIconRenderer icon={GUI_ICONS.action.target} className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Jump to Issue</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3.5 bg-[var(--well-bg)] border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)] text-[var(--text)] border border-[var(--border)] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
