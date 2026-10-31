// Full Data Schema for Visual Novel Engine with Conditionals & Staging

export type VNTransitionType =
  | 'fade'
  | 'fade_black'
  | 'fade_white'
  | 'dissolve'
  | 'cross_dissolve'
  | 'glitch'
  | 'slide_left'
  | 'slide_right'
  | 'iris_circle'
  | 'shutter_wipe'
  | 'pixelate'
  | 'instant'
  | (string & {});

export type VNPosition = 'left' | 'center' | 'right';

export type VNActiveGlobalModal =
  | 'characters'
  | 'variables'
  | 'chapter'
  | 'textbox'
  | 'scenes'
  | 'scene_map'
  | 'assets'
  | 'projects'
  | 'doctor'
  | 'menu_tool'
  | null;

export type VNConditionOperator =
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'truthy'
  | 'falsy'
  | 'contains';

export interface VNCondition {
  variableKey?: string;
  operator?: VNConditionOperator;
  value?: boolean | string | number;
  logic?: 'and' | 'or';
  conditions?: VNCondition[];
}

export interface VNVariableDefinition {
  id: string;
  key: string;
  label: string;
  type: 'boolean' | 'number' | 'string';
  defaultValue: boolean | string | number;
}

export interface VNVariableMutation {
  key: string;
  operation: 'set' | 'add' | 'subtract' | 'toggle';
  value: boolean | string | number;
}

export interface VNCharacter {
  id: string;
  name: string;
  color: string; // Hex color for nameplate and borders
  badgeTitle?: string; // e.g. "LEAD INVESTIGATOR", "FIELD AGENT"
  avatarUrl?: string; // Default bust image (URL or Base64 data URL)
  description?: string; // Lore / Character backstory / Notes for writer & creator
  shortcut?: string; // Shortcut key (e.g. "1", "2") for quick keyboard reference
  expressions?: Record<string, string>; // emotion name (e.g. 'neutral', 'happy', 'angry', 'surprised') -> URL/Base64
  side?: VNPosition;
  blipSound?: string;
  fontFamily?: string; // Custom font for this character's dialogues (e.g. 'cinzel', 'caveat', 'barlow')
  textBoxConfig?: Partial<VNTextBoxConfig>; // Custom per-character textbox styling!
  defaultScale?: number; // Universal default scale for this character
}

export type VNHotspotStyle = 'arrow' | 'door' | 'terminal' | 'button' | 'radar' | 'inspect';

export interface VNHotspot {
  id: string;
  label: string;
  style: VNHotspotStyle;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  widthPercent?: number; // Optional custom width
  heightPercent?: number; // Optional custom height
  scale?: number; // Scale factor (e.g. 1.0)
  rotation?: number; // Rotation in degrees (-180 to 180)
  flipX?: boolean; // Flip horizontally (mirror)
  locked?: boolean; // Freeze element to prevent accidental movement
  disableSnap?: boolean; // When true, neither attracts nor is attracted by magnetic snapping
  icon?: string; // Emoji or symbol
  iconSize?: number; // Tamaño del SVG en px (ej: 32 a 128px, por defecto 64)
  actionType: 'jump_scene' | 'inspect' | 'trigger_dialogue';
  targetSceneId?: string;
  inspectText?: string;
  dialogueCharacterId?: string;
  dialogueEmotion?: string;
  condition?: VNCondition; // Only shows or enables if condition is met
  mutation?: VNVariableMutation; // Mutates variable when clicked (e.g. collects item)
  sfxUrl?: string; // Sound played when clicked (e.g. door open, terminal beep)
  interactionLimit?: 'permanent' | 'once'; // 'permanent' (disponible siempre) | 'once' (solo una vez)
}

export interface VNChoiceReaction {
  characterId?: string;
  speakerName?: string;
  text: string;
  emotion?: string;
  sfx?: string;
}

export type VNButtonHoverEffect =
  | 'none'
  | 'underline'
  | 'box'
  | 'shine'
  | 'vector_trace'
  | 'tracking_lines'
  | 'tactile'
  | 'flare'
  | 'aura'
  | (string & {});

export interface VNChoiceOption {
  id: string;
  label: string;
  condition?: VNCondition; // Optional condition to reveal/enable choice
  reaction?: VNChoiceReaction; // Immediate dialogue line executed upon selecting this option
  targetSceneId?: string; // Jump to scene
  jumpToEventIndex?: number; // Jump to timeline event index
  targetEventId?: string; // Jump directly to specific event ID (robust against timeline reordering)
  mutations?: VNVariableMutation[]; // Modify story variables (e.g., flag = true, affection += 1)
  hoverEffect?: VNButtonHoverEffect; // Option-level hover text effect override ('underline', 'box', 'shine')
  hideContainer?: boolean; // If true, removes the container box / background, rendering pure floating text
  style?: 'primary' | 'danger' | 'ghost' | 'retro' | 'glass' | 'cyber' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: string;
  // Free Transform & Spatial Properties
  xPercent?: number; // 0 to 100% position on canvas
  yPercent?: number; // 0 to 100% position on canvas
  widthPercent?: number; // width in percent of stage
  scale?: number; // 0.1 to 5.0 uniform scale
  scaleX?: number; // non-uniform horizontal scale
  scaleY?: number; // non-uniform vertical scale
  rotation?: number; // -360 to 360 degrees
  locked?: boolean; // Lock transform edits
  disableSnap?: boolean; // When true, neither attracts nor is attracted by magnetic snapping
}

export type VNScreenFxType =
  | 'red_alert'
  | 'white_strobe'
  | 'black_vignette'
  | 'digital_glitch'
  | 'heartbeat'
  | 'screen_rumble'
  | 'warm_golden'
  | 'cinema_grain'
  | 'crt_tv'
  | 'cctv_monitor'
  | 'vignette'
  | 'flashlight'
  | 'code_flythrough'
  | 'liquid_distortion'
  | 'retro_pixelate'
  | 'rainy_screen'
  | 'rain_1'
  | 'rainy_screen_2'
  | 'rain_2'
  | (string & {});

export type VNCursorType =
  | 'default'
  | 'palimpsest_dot'
  | 'cyber_reticle'
  | 'fantasy_gauntlet'
  | 'quill_pen'
  | 'magic_wand'
  | 'detective_lens'
  | (string & {});

export type VNEventType =
  | 'dialogue'
  | 'choice'
  | 'bg_change'
  | 'hotspot_mode'
  | 'character_enter'
  | 'character_exit'
  | 'sfx'
  | 'bgm'
  | 'shake'
  | 'flash'
  | 'fx_start'
  | 'fx_end'
  | 'cursor_change'
  | 'loading_screen'
  | 'jump_scene'
  | 'mutate_variable'
  | 'conditional_branch';

export interface VNEvent {
  id: string;
  type: VNEventType;
  condition?: VNCondition; // Optional condition for this event to execute

  // Dialogue
  characterId?: string;
  customSpeakerName?: string;
  text?: string;
  emotion?: string; // Key in character's expressions
  characterPosition?: VNPosition;
  characterXPercent?: number;
  characterYPercent?: number;
  characterScale?: number;
  characterRotation?: number;
  characterFlipX?: boolean;
  characterLocked?: boolean;
  characterDisableSnap?: boolean; // When true, character does not magnetically snap to guides or siblings
  fontFamily?: string; // Custom font override for this specific dialogue event
  sfx?: string;

  // Choice
  prompt?: string;
  promptXPercent?: number;
  promptYPercent?: number;
  promptScale?: number;
  promptRotation?: number;
  promptLocked?: boolean;
  promptWidthPercent?: number;
  options?: VNChoiceOption[];
  choiceHoverEffect?: VNButtonHoverEffect; // Global choice hover effect ('underline', 'box', 'shine')
  choiceHideContainer?: boolean; // If true, removes background box/border from choice buttons (frameless floating text)
  choiceLayout?: 'stacked' | 'free'; // 'stacked' (classic centered) or 'free' (free positioning & transformable)

  // Background change
  backgroundUrl?: string;
  transition?: VNTransitionType;

  // Audio
  audioUrl?: string;
  audioVolume?: number;

  // Screen effects
  shakeIntensity?: 'light' | 'medium' | 'heavy';
  flashColor?: 'red' | 'white' | 'black';

  // Screen FX Range (fx_start / fx_end)
  fxPairId?: string;
  fxType?: VNScreenFxType;
  fxParams?: Record<string, any>; // Generic isolated parameter bag for self-contained effects
  fxFadeInSeconds?: number;
  fxFadeOutSeconds?: number;
  fxLoopAudioUrl?: string;
  fxLoopAudioVolume?: number;
  fxIntensity?: 'light' | 'medium' | 'heavy';
  fxColor?: string; // Custom color for effects (e.g. vignette, etc.)
  fxAnimation?: 'none' | 'flicker' | 'heartbeat' | 'breathe'; // Animation behavior inside effect
  flashlightMode?: 'normal' | 'broken'; // 'broken' adds random flickering
  flashlightRadius?: number; // e.g. 100, 180, 260
  flashlightShutdown?: boolean; // Causes flashlight to die until player hits/clicks to reactivate
  flashlightHitsRequired?: number; // Default 3 clicks
  fxCustomWords?: string[]; // Custom words or syntax fragments for code_flythrough FX

  // Cursor Override
  cursorType?: VNCursorType;
  cursorMode?: 'persistent' | 'dialogue_only'; // 'persistent' (persists through following lines) | 'dialogue_only' (active only for this beat)

  // Loading screen / intermission
  loadingTitle?: string;
  loadingSubtitle?: string;
  loadingTip?: string;
  durationMs?: number;

  // Navigation
  targetSceneId?: string;
  targetEventId?: string; // Optional: jump to a specific event in this scene after this event
  rejoinEventId?: string; // Optional: for choices, specific merge event where branches rejoin

  // Variable mutation
  variableMutation?: VNVariableMutation;

  // Conditional Branching (If / Else automatically without manual choice button)
  conditionalTargetSceneId?: string;
  elseTargetSceneId?: string;
  conditionalTargetEventId?: string;
  elseTargetEventId?: string;
}

export type VNSceneType = 'standard' | 'event';
export type VNEventSubtype = 'cinematic' | 'static';

export interface VNStaticScreenButton {
  id: string;
  label: string;
  action:
    | 'retry_previous'
    | 'next_scene'
    | 'load_game'
    | 'jump_scene'
    | 'main_menu'
    | 'start_game'
    | 'open_settings'
    | 'open_gallery'
    | 'exit_to_intro';
  targetSceneId?: string;
  style?: 'danger' | 'primary' | 'ghost' | 'retro' | 'glass' | 'cyber';
  sfxUrl?: string;
  xPercent?: number; // 0 to 100% position on screen (optional)
  yPercent?: number;
  widthPercent?: number; // 10 to 100% width or custom width scale
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily?: string;
  hoverEffect?: VNButtonHoverEffect;
  hideContainer?: boolean;
  locked?: boolean;
}

export interface VNStaticScreenConfig {
  purpose: 'death' | 'ending' | 'intro' | 'title' | 'custom' | 'load_game' | 'settings' | 'gallery';
  galleryTab?: 'cinematics' | 'scenarios' | 'characters';
  title?: string;
  subtitle?: string;
  titleColor?: string;
  subtitleColor?: string;
  titleFontFamily?: string;
  subtitleFontFamily?: string;
  titleFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  subtitleFontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  titleAnimation?: 'palimpsest' | 'pulse' | 'glitch' | 'clean_glitch' | 'scramble' | 'fade_in' | 'shake' | 'smoky' | 'neon' | 'blood' | 'shimmer' | 'typewriter' | 'none' | string;
  subtitleAnimation?: string;
  titleXPercent?: number;
  titleYPercent?: number;
  titleScale?: number;
  titleRotation?: number;
  titleLocked?: boolean;
  subtitleXPercent?: number;
  subtitleYPercent?: number;
  subtitleScale?: number;
  subtitleRotation?: number;
  subtitleLocked?: boolean;
  bgOverlayColor?: string;
  bgmUrl?: string;
  sfxUrl?: string; // One-shot impact sfx when screen loads
  screenFx?: VNScreenFxType;
  fxIntensity?: 'light' | 'medium' | 'heavy';
  screenFxParams?: Record<string, any>;
  cursorType?: VNCursorType;
  buttonsLayout?: 'stacked' | 'free'; // 'stacked' (centered vertical stack) | 'free' (draggable xPercent / yPercent)
  buttons: VNStaticScreenButton[];
}

export type VNCinematicSection = 'media' | 'audio' | 'background' | 'dialog';
export type VNCinematicTrackKind = 'visual' | 'text' | 'audio' | 'fx';

export interface VNCinematicClip {
  id: string;
  trackId: string;
  name?: string;
  startSec: number;
  endSec: number;

  // Visual / Media properties (Backgrounds, Videos, Overlays, Floating images)
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  xPercent?: number; // 0-100% position on canvas
  yPercent?: number; // 0-100% position on canvas
  widthPercent?: number; // width size scale
  scale?: number; // 0.1 - 5.0 uniform scale
  scaleX?: number; // Independent horizontal scale (1.0 default)
  scaleY?: number; // Independent vertical scale (1.0 default)
  rotation?: number; // 2D rotation in degrees (-360 to 360)
  rotateX?: number; // 3D pitch rotation in degrees (-180 to 180)
  rotateY?: number; // 3D yaw rotation in degrees (-180 to 180)
  pivotX?: number; // Pivot/anchor origin X percent (0-100, default 50)
  pivotY?: number; // Pivot/anchor origin Y percent (0-100, default 50)
  flipX?: boolean; // Flip horizontally
  flipY?: boolean; // Flip vertically
  crop?: { top: number; right: number; bottom: number; left: number }; // Inset crop percentages (0-100)
  isPerspective3D?: boolean; // Toggle 3D perspective mode
  opacity?: number; // 0 - 1.0
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'lighten';
  transition?: 'cut' | 'fade' | 'zoom' | 'slide' | 'glitch';
  fit?: 'cover' | 'contain' | 'custom';
  isCover?: boolean;
  locked?: boolean; // Prevents accidental dragging or transform changes

  // Text / Dialogue properties
  text?: string;
  speaker?: string;
  speakerAvatar?: string;
  speakerColor?: string;
  speakerBadge?: string;
  characterId?: string;
  emotion?: string;
  sfx?: string; // Speaking voice or sound effect triggered on dialogue
  cursorType?: VNCursorType;
  dialogueStyle?: 'classic_vn' | 'subtitle' | 'narration_card';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  textColor?: string;
  fontFamily?: string;
  textEffect?: string;
  textPosition?: 'center' | 'bottom' | 'top' | 'custom';

  // Audio properties
  audioUrl?: string;
  volume?: number;
  loop?: boolean;
  sourceOffsetSec?: number; // In-point offset inside original audio/video file (slip trim)
  fadeInSec?: number; // Fade in duration in seconds
  fadeOutSec?: number; // Fade out duration in seconds
  transitionDuration?: number; // Duration of visual transition in seconds (default 0.5s)
  waveform?: number[]; // Audio peak amplitudes for waveform visualization

  // Screen FX properties
  fxType?: VNScreenFxType;
  fxIntensity?: 'light' | 'medium' | 'heavy';
}

export interface VNCinematicTrack {
  id: string;
  section: VNCinematicSection;
  index: number;
  name?: string;
  kind?: VNCinematicTrackKind;
  visible?: boolean;
  muted?: boolean;
  locked?: boolean;
  clips: VNCinematicClip[];
}

export interface VNCinematicTrackBackground {
  id: string;
  url: string;
  startSec: number;
  endSec: number;
  transition?: 'cut' | 'fade' | 'zoom' | 'glitch';
}

export interface VNCinematicTrackText {
  id: string;
  text: string;
  speaker?: string;
  startSec: number;
  endSec: number;
  position?: 'center' | 'bottom' | 'top' | 'custom';
  xPercent?: number;
  yPercent?: number;
  scale?: number;
  fontFamily?: string;
  textEffect?: string;
  style?: 'cinematic_subtitle' | 'narration_card' | 'dramatics';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  textColor?: string;
}

export interface VNCinematicTrackAudio {
  id: string;
  name?: string;
  url: string;
  startSec: number;
  endSec: number;
  volume?: number;
  loop?: boolean;
}

export interface VNCinematicTrackFx {
  id: string;
  fxType: VNScreenFxType;
  startSec: number;
  endSec: number;
  intensity?: 'light' | 'medium' | 'heavy';
}

export interface VNCinematicTrackCursor {
  id: string;
  cursorType: VNCursorType;
  startSec: number;
  endSec: number;
}

export interface VNCinematicConfig {
  durationSeconds: number;
  autoAdvanceOnEnd?: boolean;
  targetSceneIdOnEnd?: string;
  // Modern dynamic multitrack layer architecture (CapCut style)
  tracks?: VNCinematicTrack[];

  // Legacy arrays kept for backward compatibility
  backgroundTracks?: VNCinematicTrackBackground[];
  textTracks?: VNCinematicTrackText[];
  audioTracks?: VNCinematicTrackAudio[];
  fxTracks?: VNCinematicTrackFx[];
  cursorTracks?: VNCinematicTrackCursor[];
}

export interface VNScene {
  id: string;
  name: string;
  description?: string;
  backgroundUrl: string;
  bgmUrl?: string;
  ambientSfxUrl?: string;
  entrySfxUrl?: string; // Sound effect played upon entering scene (e.g. door open, footsteps, alarm)
  cursorType?: VNCursorType; // Scenario cursor override
  enableHotspots?: boolean;
  hotspotsDisplayMode?: 'always' | 'after_timeline'; // 'always' (constantes en pantalla durante lectura) | 'after_timeline'
  hotspots?: VNHotspot[];
  timeline: VNEvent[];
  mapPosition?: { x: number; y: number };
  colorTag?: string; // Hex or theme color for node header
  sceneType?: VNSceneType; // 'standard' | 'event' (default: 'standard')
  eventSubtype?: VNEventSubtype; // 'cinematic' | 'static' (when sceneType === 'event')
  staticScreenConfig?: VNStaticScreenConfig; // Config for Static Screen (Death, Ending, Intro)
  cinematicConfig?: VNCinematicConfig; // Config for Cinematic Sequencer
}

export interface VNLoadingScreenConfig {
  enabled: boolean;
  title: string;
  subtitle?: string;
  loreTip?: string;
  bgImageUrl?: string;
  durationMs?: number;
  sceneId?: string; // Optional: Link to an existing static screen in the project
  staticConfig?: VNStaticScreenConfig; // Full customizable static screen (title, subtitle, buttons, fx, etc.)
}

export interface VNChapterScreenConfig {
  enabled: boolean;
  sceneId?: string; // Optional: Link to an existing static screen scene in the project
  staticConfig?: VNStaticScreenConfig; // Full customizable static screen (title, subtitle, buttons, fx, etc.)
  backgroundUrl?: string;
}

export interface VNChapter {
  id: string;
  number: number;
  title: string;
  summary?: string;
  loadingScreen: VNLoadingScreenConfig;
  introScreen?: VNChapterScreenConfig; // Episode Intro Screen
  endScreen?: VNChapterScreenConfig;   // Episode End Screen
  startSceneId: string;
  scenes: VNScene[];
}

export interface VNTextBoxConfig {
  theme: 'classified' | 'neon' | 'cyberpunk' | 'minimal';
  opacity: number; // 0.2 to 1
  borderColor: string;
  fontSize: 'sm' | 'base' | 'lg';
  typewriterSpeedMs: number; // 15 to 60 ms
  autoSpeedMs?: number; // 1000 to 5000 ms (default 2000)
  showAvatar: boolean;
  soundBlipEnabled: boolean;
  position: 'bottom' | 'middle';
  backgroundColor?: string;
  textColor?: string;
  nameplateColor?: string;
  fontFamily?: string; // Global textbox font family
}

export interface VNStory {
  id: string;
  version: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  defaultFontFamily?: string; // Default project/story font family
  editorTheme?: 'default_dark' | 'default_light' | 'rotp'; // Preferred UI theme for this project
  textBoxConfig: VNTextBoxConfig;
  variables: VNVariableDefinition[]; // Defined story flags & variables
  characters: VNCharacter[];
  chapters: VNChapter[];
  scenarios?: VNScene[]; // Biblioteca global de escenarios del proyecto (independiente del timeline)
  customAssets?: VNAssetItem[]; // Assets creados o subidos por el usuario para este proyecto
  menuSystemConfig?: VNMenuSystemConfig;
}

export interface VNMenuSystemConfig {
  enabled?: boolean;
  introSceneId?: string;
  mainMenuSceneId?: string;
  loadGameSceneId?: string;
  settingsSceneId?: string;
  gallerySceneId?: string;
  playStartSceneId?: string;
  nodePositions?: Record<string, { x: number; y: number }>;
}

export type VNWorkspaceView =
  | 'hub'               // Project Hub Dashboard / Main project command center
  | 'menu_tool'         // Menu Game Tool (startup architecture, title and navigation flow)
  | 'story_tool'        // Visual Novel Tool (script, timeline, stage WYSIWYG, cinematics)
  | 'gallery_assets'    // Gallery & Assets Studio (characters, media, profiles, extras)
  | 'project_settings'; // Project settings, variables, textbox and diagnostics;

export type VNAssetType = 'sfx' | 'bgm' | 'voice' | 'background' | 'character' | 'icon' | 'font' | 'fx' | 'text_effect' | 'cursor' | 'transition';
export type VNAssetOrigin = 'system' | 'user';

export interface VNAssetItem {
  id: string;
  name: string;
  type: VNAssetType;
  origin: VNAssetOrigin;
  url: string;
  category?: string;
  description?: string;
  projectName?: string; // Nombre del proyecto en el que fue creado
  filePath?: string; // Ruta relativa dentro de public/assets/projects/[projectName]/
  tags?: string[];
  isProtected?: boolean; // True si es del sistema (no eliminable)
  createdAt?: string;
  extra?: Record<string, any>;
}

// Runtime player state
export interface VNGameState {
  currentChapterId: string;
  currentSceneId: string;
  eventIndex: number;
  variablesState: Record<string, boolean | string | number>;
  history: {
    speaker: string;
    speakerColor: string;
    text: string;
  }[];
  activeCharacters: {
    characterId: string;
    position: VNPosition;
    emotion?: string;
  }[];
  isHotspotMode: boolean;
  pendingReaction?: VNChoiceReaction | null;
  consumedHotspots?: string[];
  customSceneBg?: string | null;
  persistentCursor?: VNCursorType;
  activeScreenFx?: {
    pairId?: string;
    fxType: VNScreenFxType;
    intensity?: 'light' | 'medium' | 'heavy';
    color?: string;
    animation?: 'none' | 'flicker' | 'heartbeat' | 'breathe';
    customWords?: string[];
    flashlightMode?: 'normal' | 'broken';
    flashlightRadius?: number;
    flashlightShutdown?: boolean;
    flashlightHitsRequired?: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
    isFadingOut?: boolean;
    sfxUrl?: string;
    params?: Record<string, any>;
  } | null;
  currentBgmUrl?: string | null;
  currentBgmVolume?: number;
}

// Save slot
export interface VNSaveSlot {
  id: string;
  storyId?: string;
  slotNumber: number;
  savedAt: string;
  storyTitle: string;
  chapterTitle: string;
  sceneName: string;
  previewBg?: string;
  gameState: VNGameState;
}
