export interface I18nConfig {
  fallbackLang?: string;
  storageKey?: string;
  useDefaultLoadingScreen?: boolean;
  onLoadingStateChange?: ((isLoading: boolean, targetLang: string) => void) | null;
  onLanguageChanged?: ((lang: string) => void) | null;
  warmupTexts?: string[];
  warmupHTMLTemplates?: string[];
  menuDictionary?: Record<string, { context?: string; translations?: Record<string, string> }>;
}

export declare class I18nManager {
  currentLang: string;
  isTranslating: boolean;
  config: I18nConfig;
  init(config?: I18nConfig): Promise<void>;
  setLanguage(lang: string): Promise<void>;
  getCurrentLang(): string;
  refreshSnapshot(): void;
  createLanguageSelector(containerSelector: string, languagesToDisplay?: string[]): void;
  destroy(): void;
}

export declare const SUPPORTED_LANGS: string[];
export declare const DEFAULT_MENU_DICTIONARY: Record<string, { context?: string; translations?: Record<string, string> }>;
export declare const i18n: I18nManager;
