import { ScreenFxDefinition } from './types';
import { redAlertFx } from './RedAlertFx';
import { whiteStrobeFx } from './WhiteStrobeFx';
import { blackVignetteFx } from './BlackVignetteFx';
import { digitalGlitchFx } from './DigitalGlitchFx';
import { heartbeatFx } from './HeartbeatFx';
import { screenRumbleFx } from './ScreenRumbleFx';
import { warmGoldenFx } from './WarmGoldenFx';
import { cinemaGrainFx } from './CinemaGrainFx';
import { oldCrtTvFx } from './OldCrtTvFx';
import { monitorFx } from './MonitorFx';
import { vignetteFx } from './VignetteFx';
import { flashlightFx } from './FlashlightFx';
import { codeFlythroughFx } from './CodeFlythroughFx';

export const SCREEN_FX_REGISTRY: Record<string, ScreenFxDefinition> = {
  red_alert: redAlertFx,
  white_strobe: whiteStrobeFx,
  black_vignette: blackVignetteFx,
  digital_glitch: digitalGlitchFx,
  heartbeat: heartbeatFx,
  screen_rumble: screenRumbleFx,
  warm_golden: warmGoldenFx,
  cinema_grain: cinemaGrainFx,
  crt_tv: oldCrtTvFx,
  cctv_monitor: monitorFx,
  vignette: vignetteFx,
  flashlight: flashlightFx,
  code_flythrough: codeFlythroughFx,
};

// Config metadata compatibility map (same shape as previously exported SCREEN_FX_CONFIGS)
export const SCREEN_FX_CONFIGS = SCREEN_FX_REGISTRY;

/**
 * Dynamically register a new screen effect plugin at runtime.
 */
export function registerScreenFx(def: ScreenFxDefinition): void {
  SCREEN_FX_REGISTRY[def.id] = def;
}

/**
 * Unregister a screen effect plugin by ID.
 */
export function unregisterScreenFx(id: string): void {
  delete SCREEN_FX_REGISTRY[id];
}

/**
 * Safely get a screen effect definition by ID, returning undefined if missing.
 */
export function getScreenFx(id?: string): ScreenFxDefinition | undefined {
  if (!id) return undefined;
  return SCREEN_FX_REGISTRY[id];
}

/**
 * Return all registered screen effects as an array.
 */
export function getAllScreenFx(): ScreenFxDefinition[] {
  return Object.values(SCREEN_FX_REGISTRY);
}
