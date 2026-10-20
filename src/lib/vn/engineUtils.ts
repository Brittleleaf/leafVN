import { VNCondition, VNVariableMutation, VNCharacter, VNEvent, VNStory, VNScene } from '@/types/vn';

/**
 * Normaliza valores de cualquier tipo (strings de formulario, booleans, números, undefined)
 * a representaciones consistentes para comparaciones lógicas exactas.
 */
function normalizeLogicalValue(val: any): {
  type: 'boolean' | 'number' | 'string' | 'empty';
  raw: any;
  bool: boolean;
  num: number;
  str: string;
} {
  if (val === undefined || val === null || val === '') {
    return { type: 'empty', raw: undefined, bool: false, num: 0, str: '' };
  }
  if (typeof val === 'boolean') {
    return { type: 'boolean', raw: val, bool: val, num: val ? 1 : 0, str: String(val) };
  }
  if (typeof val === 'number') {
    const safeNum = isNaN(val) ? 0 : val;
    return { type: 'number', raw: safeNum, bool: safeNum !== 0, num: safeNum, str: String(safeNum) };
  }

  const trimmed = String(val).trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'true') {
    return { type: 'boolean', raw: true, bool: true, num: 1, str: 'true' };
  }
  if (lower === 'false') {
    return { type: 'boolean', raw: false, bool: false, num: 0, str: 'false' };
  }
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    const parsedNum = Number(trimmed);
    return { type: 'number', raw: parsedNum, bool: parsedNum !== 0, num: parsedNum, str: trimmed };
  }

  return { type: 'string', raw: trimmed, bool: trimmed.length > 0, num: 0, str: trimmed };
}

/**
 * Evalúa si una condición simple o compuesta se cumple con el estado actual de variables.
 * Soporta:
 * - Coerción inteligente de tipos (evita fallos entre 'true' y true, o '10' y 10).
 * - Condiciones compuestas (AND / OR) mediante el campo conditions o arrays.
 * - Operadores extendidos ('truthy', 'falsy', 'contains').
 * - Variables no inicializadas con fallback seguro.
 */
export function evaluateCondition(
  condition: VNCondition | VNCondition[] | undefined,
  variablesState: Record<string, boolean | string | number> = {}
): boolean {
  if (!condition) return true;
  const safeState = variablesState || {};

  // Soporte directo para listas de condiciones (AND por defecto)
  if (Array.isArray(condition)) {
    const valid = condition.filter(Boolean);
    if (valid.length === 0) return true;
    return valid.every((c) => evaluateCondition(c, safeState));
  }

  // Soporte para condiciones compuestas anidadas (AND / OR)
  if (condition.conditions && Array.isArray(condition.conditions) && condition.conditions.length > 0) {
    const validNested = condition.conditions.filter(Boolean);
    if (validNested.length === 0) return true;
    if (condition.logic === 'or') {
      return validNested.some((c) => evaluateCondition(c, safeState));
    }
    return validNested.every((c) => evaluateCondition(c, safeState));
  }

  if (!condition.variableKey) return true;

  const currentRaw = safeState[condition.variableKey];
  const cur = normalizeLogicalValue(currentRaw);
  const target = normalizeLogicalValue(condition.value);

  const op = condition.operator || (condition.value !== undefined ? '==' : 'truthy');

  switch (op) {
    case 'truthy':
      return cur.bool;
    case 'falsy':
      return !cur.bool;
    case 'contains':
      return cur.str.toLowerCase().includes(target.str.toLowerCase());
    case '==': {
      if (cur.type === 'boolean' || target.type === 'boolean') {
        return cur.bool === target.bool;
      }
      if (cur.type === 'number' || target.type === 'number') {
        return cur.num === target.num;
      }
      return cur.str.toLowerCase() === target.str.toLowerCase();
    }
    case '!=': {
      if (cur.type === 'boolean' || target.type === 'boolean') {
        return cur.bool !== target.bool;
      }
      if (cur.type === 'number' || target.type === 'number') {
        return cur.num !== target.num;
      }
      return cur.str.toLowerCase() !== target.str.toLowerCase();
    }
    case '>':
      return cur.num > target.num;
    case '<':
      return cur.num < target.num;
    case '>=':
      return cur.num >= target.num;
    case '<=':
      return cur.num <= target.num;
    default:
      return cur.str === target.str;
  }
}

/**
 * Aplica una mutación de variable (set, add, subtract, toggle) y devuelve el nuevo estado inmutable.
 * Limpia y normaliza tipos automáticamente (p. ej. 'true' a boolean true, '25' a número 25).
 */
export function applyVariableMutation(
  mutation: VNVariableMutation,
  currentState: Record<string, boolean | string | number> = {}
): Record<string, boolean | string | number> {
  if (!mutation || !mutation.key || typeof mutation.key !== 'string') {
    return currentState;
  }
  const newState = { ...currentState };
  const currentVal = newState[mutation.key];
  const normalizedInput = normalizeLogicalValue(mutation.value);

  switch (mutation.operation) {
    case 'set':
      newState[mutation.key] = normalizedInput.raw !== undefined ? normalizedInput.raw : mutation.value;
      break;
    case 'add': {
      if (typeof currentVal === 'string' && isNaN(Number(currentVal))) {
        newState[mutation.key] = currentVal + String(mutation.value ?? '');
      } else if (normalizedInput.type === 'string' && isNaN(Number(mutation.value))) {
        newState[mutation.key] = (currentVal !== undefined && currentVal !== null ? String(currentVal) : '') + String(mutation.value ?? '');
      } else {
        const curNum = normalizeLogicalValue(currentVal).num;
        const resultNum = curNum + normalizedInput.num;
        newState[mutation.key] = Number.isFinite(resultNum) ? Math.round(resultNum * 1000) / 1000 : curNum;
      }
      break;
    }
    case 'subtract': {
      const curNum = normalizeLogicalValue(currentVal).num;
      const resultNum = curNum - normalizedInput.num;
      newState[mutation.key] = Number.isFinite(resultNum) ? Math.round(resultNum * 1000) / 1000 : curNum;
      break;
    }
    case 'toggle': {
      const curBool = normalizeLogicalValue(currentVal).bool;
      newState[mutation.key] = !curBool;
      break;
    }
  }

  return newState;
}

/**
 * Convierte un archivo de imagen local a Data URL (Base64) con validación de tipo de archivo
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid file provided for base64 conversion'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene la imagen correspondiente según la emoción del personaje
 */
export function getCharacterAvatar(
  character: VNCharacter | undefined,
  emotion?: string
): string | undefined {
  if (!character) return undefined;
  if (emotion && character.expressions && character.expressions[emotion]) {
    return character.expressions[emotion];
  }
  return character.avatarUrl;
}

/**
 * Interpola variables en el texto reemplazando {variable} o {variable|default} por su valor actual.
 * Ejemplos:
 * - "Hola {jugador}, tienes {creditos} créditos." -> "Hola Justin, tienes 50 créditos."
 * - "Bienvenido {agente|Recluta}." -> Si 'agente' está indefinido, devuelve "Bienvenido Recluta."
 * Protegido contra estados nulos/indefinidos y evita que aparezca el texto literal "undefined".
 * Soporta caracteres Unicode/acentuados en los nombres de variables (p. ej. {energía}, {misión}).
 */
export function interpolateText(
  text: string | undefined,
  variablesState: Record<string, boolean | string | number> = {}
): string {
  if (!text) return '';
  const safeStr = typeof text === 'string' ? text : String(text);
  const safeState = variablesState || {};
  return safeStr.replace(/\{([^\s|}]+)(?:\|([^}]+))?\}/gu, (match, key, fallback) => {
    if (key in safeState) {
      const val = safeState[key];
      if (val !== undefined && val !== null) {
        return String(val);
      }
    }
    return fallback !== undefined ? fallback : match;
  });
}

/**
 * Sincroniza y repara automáticamente los saltos de opciones de decisión (Choice)
 * y referencias internas tras operaciones en la línea temporal (inserciones, eliminaciones, duplicaciones o reordenamientos).
 * - Mantiene `jumpToEventIndex` alineado con `targetEventId` si las líneas se desplazan.
 * - Si la línea de destino fue eliminada, limpia referencias huérfanas de forma segura (rejoinEventId, targetEventId, etc.).
 */
export function syncChoiceJumpsInTimeline(
  updatedTimeline: VNEvent[],
  previousTimeline?: VNEvent[]
): VNEvent[] {
  const existingIds = new Set(updatedTimeline.map((e) => e.id));

  return updatedTimeline.map((ev) => {
    let modified = false;
    const nextEv: VNEvent = { ...ev };

    // Sanitizar rejoinEventId huérfano si la línea destino ya no existe en el timeline
    if (nextEv.rejoinEventId && !existingIds.has(nextEv.rejoinEventId)) {
      nextEv.rejoinEventId = undefined;
      modified = true;
    }

    // Sanitizar targetEventId de salto lineal intra-escenario
    if (nextEv.targetEventId && !existingIds.has(nextEv.targetEventId)) {
      nextEv.targetEventId = undefined;
      modified = true;
    }

    // Sanitizar saltos intra-escenario en ramas condicionales
    if (nextEv.conditionalTargetEventId && !existingIds.has(nextEv.conditionalTargetEventId)) {
      nextEv.conditionalTargetEventId = undefined;
      modified = true;
    }
    if (nextEv.elseTargetEventId && !existingIds.has(nextEv.elseTargetEventId)) {
      nextEv.elseTargetEventId = undefined;
      modified = true;
    }

    // Sanitizar y sincronizar opciones de menú de decisión (choice)
    if (nextEv.type === 'choice' && nextEv.options && Array.isArray(nextEv.options)) {
      const updatedOptions = nextEv.options.map((opt) => {
        // Caso 1: La opción tiene un ID de evento de destino
        if (opt.targetEventId) {
          const foundIdx = updatedTimeline.findIndex((e) => e.id === opt.targetEventId);
          if (foundIdx !== -1) {
            return { ...opt, jumpToEventIndex: foundIdx };
          } else {
            // El evento de destino fue eliminado de la escena: limpiar salto huérfano
            return { ...opt, targetEventId: undefined, jumpToEventIndex: undefined };
          }
        }
        // Caso 2: La opción solo tenía un índice numérico previo
        if (typeof opt.jumpToEventIndex === 'number' && Number.isFinite(opt.jumpToEventIndex)) {
          if (previousTimeline && previousTimeline[opt.jumpToEventIndex]) {
            const oldTargetId = previousTimeline[opt.jumpToEventIndex].id;
            const foundIdx = updatedTimeline.findIndex((e) => e.id === oldTargetId);
            if (foundIdx !== -1) {
              return { ...opt, targetEventId: oldTargetId, jumpToEventIndex: foundIdx };
            } else {
              return { ...opt, targetEventId: undefined, jumpToEventIndex: undefined };
            }
          }
          if (opt.jumpToEventIndex >= updatedTimeline.length || opt.jumpToEventIndex < 0) {
            return { ...opt, jumpToEventIndex: undefined };
          }
        }
        return opt;
      });
      nextEv.options = updatedOptions;
      modified = true;
    }

    return modified ? nextEv : ev;
  });
}

/**
 * Limpia referencias huérfanas a un escenario eliminado en toda la historia
 * (saltos de eventos, decisiones, ramas condicionales, hotspots, cinemáticas y pantallas estáticas).
 */
export function cleanOrphanSceneReferences(story: VNStory, deletedSceneId: string): VNStory {
  if (!story || !deletedSceneId) return story;

  const sanitizeScene = (sc: VNScene): VNScene => {
    let modified = false;

    // 1. Cinemática
    let cinematicConfig = sc.cinematicConfig;
    if (cinematicConfig && cinematicConfig.targetSceneIdOnEnd === deletedSceneId) {
      cinematicConfig = { ...cinematicConfig, targetSceneIdOnEnd: undefined };
      modified = true;
    }

    // 2. Pantalla estática
    let staticScreenConfig = sc.staticScreenConfig;
    if (staticScreenConfig?.buttons && staticScreenConfig.buttons.some((b) => b.targetSceneId === deletedSceneId)) {
      staticScreenConfig = {
        ...staticScreenConfig,
        buttons: staticScreenConfig.buttons.map((b) =>
          b.targetSceneId === deletedSceneId ? { ...b, targetSceneId: undefined } : b
        ),
      };
      modified = true;
    }

    // 3. Hotspots
    let hotspots = sc.hotspots;
    if (hotspots && hotspots.some((h) => h.targetSceneId === deletedSceneId)) {
      hotspots = hotspots.map((h) =>
        h.targetSceneId === deletedSceneId ? { ...h, targetSceneId: undefined } : h
      );
      modified = true;
    }

    // 4. Línea de tiempo
    let timeline = sc.timeline;
    if (timeline) {
      let timelineChanged = false;
      const cleanTimeline = timeline.map((ev) => {
        let evChanged = false;
        const newEv: VNEvent = { ...ev };

        if (newEv.targetSceneId === deletedSceneId) {
          newEv.targetSceneId = undefined;
          evChanged = true;
        }
        if (newEv.conditionalTargetSceneId === deletedSceneId) {
          newEv.conditionalTargetSceneId = undefined;
          evChanged = true;
        }
        if (newEv.elseTargetSceneId === deletedSceneId) {
          newEv.elseTargetSceneId = undefined;
          evChanged = true;
        }
        if (newEv.options && Array.isArray(newEv.options)) {
          const optChanged = newEv.options.some((o) => o.targetSceneId === deletedSceneId);
          if (optChanged) {
            newEv.options = newEv.options.map((o) =>
              o.targetSceneId === deletedSceneId ? { ...o, targetSceneId: undefined } : o
            );
            evChanged = true;
          }
        }
        if (evChanged) {
          timelineChanged = true;
          return newEv;
        }
        return ev;
      });
      if (timelineChanged) {
        timeline = cleanTimeline;
        modified = true;
      }
    }

    if (!modified) return sc;
    return {
      ...sc,
      cinematicConfig,
      staticScreenConfig,
      hotspots,
      timeline,
    };
  };

  return {
    ...story,
    scenarios: (story.scenarios || []).map(sanitizeScene),
    chapters: (story.chapters || []).map((ch) => ({
      ...ch,
      scenes: (ch.scenes || []).map(sanitizeScene),
    })),
  };
}
