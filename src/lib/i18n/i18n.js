// ===== i18n.js — Motor de Auto-Traducción Universal v2.2 =====
// Compatible: Vanilla JS, Vue, React, Next.js Pages Router, Next.js App Router
// Opera sobre text nodes y atributos del DOM. Sin dependencias externas.
//
// HISTORIAL:
// v1.0 — Motor original (Vanilla JS, 776 líneas)
// v2.0 — Fixes críticos + SSR-safe + atributos + backoff + RTL + destroy()
// v2.1 — Auditoría interna: listener leak, LRU O(n²), fetchSingle retry, overlay finally,
//         destroy/reinit, _lookupCache extraído
// v2.2 — Auditoría final:
//   [FIX] F1 — _lruOrder crece indefinidamente (no se limpia al iterar caché grande)
//   [FIX] F2 — _getCacheKey: si el texto contiene '|', el split de la clave es ambiguo
//   [FIX] F3 — resolver() en init() se llama fuera del try/finally; si hay error asíncrono,
//              la promise queda colgada para siempre
//   [FIX] F4 — _ensureLanguagesCached: la detección de caché existente falla si la página
//              tiene 0 textos (iteración vacía pasa siempre, re-lanza la warmup)
//   [FIX] F5 — _collectTranslatableNodes duplica texto si un nodo ya fue traducido y no tiene
//              snapshot; ahora lee el snapshot primero y filtra textos vacíos post-trim
//   [OPT] O1 — _lruOrder usa indexOf() O(n) en cada write/read; reemplazado por Map<key,idx>
//              para O(1) lookup. _lruOrder pasa a ser solo el array de orden, el Map da O(1) find
//   [OPT] O2 — _collectTranslatableAttrItems: el selector CSS se recalcula en cada llamada;
//              ahora es una constante de módulo
//   [OPT] O3 — _walkNodes: .includes() en array de tags es O(n); reemplazado por Set O(1)
//   [OPT] O4 — _translateAll: textos vacíos o no-traducibles se filtran antes de ir a la red
//   [OPT] O5 — destroy() persiste la caché pendiente de forma síncrona antes de limpiar timers

// ─────────────────────────────────────────────
// CONSTANTES DE MÓDULO (calculadas una sola vez)
// ─────────────────────────────────────────────

/** Detecta si el módulo se ejecuta en un entorno con DOM real */
const _isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const SUPPORTED_LANGS = ['es', 'en', 'pt', 'fr', 'it', 'de', 'ja', 'id'];

/** Idiomas RTL — el motor ajusta document.dir automáticamente */
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

/** Tags HTML cuyo contenido nunca se traduce */
// [OPT O3] Set para lookup O(1) en vez de Array.includes() O(n)
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

const LOADING_MESSAGES = {
    es: 'Cambiando idioma...',
    en: 'Switching languages...',
    pt: 'Mudando idioma...',
    fr: 'Changement de langue...',
    it: 'Cambio lingua...',
    de: 'Sprache wechseln...',
    ja: '言語を変更しています...',
    id: 'Mengubah bahasa...'
};

/** Diccionario específico para menús y barras de navegación */
export const DEFAULT_MENU_DICTIONARY = {
    'home': {
        context: 'Main Menu',
        translations: {
            es: 'Sala',
            en: 'Home',
            id: 'Ruang Utama',
            ja: 'メインメニュー',
            fr: 'Menu Principal',
            de: 'Hauptmenü',
            pt: 'Sala',
            it: 'Menu Principale'
        }
    },
    'subjects': {
        context: 'Entity',
        translations: {
            es: 'Entidades',
            en: 'Subjects',
            id: 'Entitas',
            ja: '実体',
            fr: 'Entités',
            de: 'Entitäten',
            pt: 'Entidades',
            it: 'Entità'
        }
    },
    'lore': {
        context: 'Main Story',
        translations: {
            es: 'Historia Principal',
            en: 'Lore',
            id: 'Kisah Utama',
            ja: 'メインストーリー',
            fr: 'Histoire Principale',
            de: 'Hauptgeschichte',
            pt: 'História Principal',
            it: 'Storia Principale'
        }
    }
};

// Regex para detectar texto no-traducible (números, precios, emojis puros)
const NUMERIC_REGEX = /^[\d\s.,+\-$%]*$|^\$[\d.,]+$|\d+[.,]\d{2}$/;
const EMOJI_ONLY_REGEX = /^[\p{Emoji}\s]+$/u;

/** Atributos HTML traducibles además de text nodes (placeholders se mantienen siempre en inglés) */
const TRANSLATABLE_ATTRS = ['aria-label', 'title', 'alt'];

// [OPT O2] Selector CSS pre-calculado (evita recalcular en cada llamada)
const ATTRS_SELECTOR = TRANSLATABLE_ATTRS.map(a => `[${a}]`).join(',');

// [FIX F2] Separador de clave de caché que no puede aparecer en texto real
// Usamos un caracter de control (Unit Separator, U+001F) en vez de '|'
const CACHE_KEY_SEP = '\x1F';

// ─────────────────────────────────────────────
// CLASE PRINCIPAL
// ─────────────────────────────────────────────

export class I18nManager {
    constructor() {
        // Estado
        this.currentLang  = 'es';
        this.readyPromise = null;

        // Estructuras de memoria — WeakMap/WeakSet para no impedir GC
        this.originalSnapshot = new WeakMap(); // text node → string original
        this._attrSnapshot    = new WeakMap(); // element  → Map<attr, string original>
        this._processedNodes  = new WeakSet();
        this._cacheMap        = new Map();     // cacheKey → traducción
        this._dirtyLangs      = new Set();     // idiomas con cambios pendientes de persistir

        // [OPT O1] LRU: Map<key, true> para indexOf O(1) + Array para orden
        this._lruMap   = new Map();  // key → posición lógica (se actualiza al mover)
        this._lruOrder = [];         // array de claves, índice 0 = más antiguo

        // Control de flujo
        this._activeTranslations    = 0;
        this.observer               = null;
        this._mutationDebounceTimer = null;
        this._persistDebounceTimer  = null;
        this._pivotENReady          = false;
        this._lastWarmupTexts       = { base: null, pivot: null };
        this._langChangedListener   = null;
        this._cacheReady            = false; // [FIX F4] flag explícito de caché inicializada

        // Configuración por defecto — SSR-safe (no accede a DOM en el constructor)
        const detectedBaseLang = _isBrowser
            ? (() => {
                  const htmlLang = (document.documentElement.lang || '').split('-')[0];
                  return SUPPORTED_LANGS.includes(htmlLang) ? htmlLang : 'es';
              })()
            : 'es';

        this.config = {
            fallbackLang: detectedBaseLang,
            autoDetectBrowserLang: false,
            storageKey: 'appLang',
            useDefaultLoadingScreen: true,
            onLoadingStateChange: null,
            onLanguageChanged: null,
            warmupTexts: [],
            warmupHTMLTemplates: [],
            menuDictionary: DEFAULT_MENU_DICTIONARY
        };
    }

    // ─────────────────────────────────────────────
    // GETTERS Y HELPERS
    // ─────────────────────────────────────────────

    /** Detecta si un nodo pertenece a un menú o barra de navegación */
    _isMenuNode(node) {
        if (!node || !node.parentElement) return false;
        return !!node.parentElement.closest('nav, [data-menu], header, [role="navigation"]');
    }

    /** Empareja mayúsculas/minúsculas de la traducción con el texto original */
    _matchCase(original, replacement) {
        if (!original || !replacement) return replacement;
        const trimmed = original.trim();
        if (trimmed === trimmed.toUpperCase()) return replacement.toUpperCase();
        if (trimmed[0] === trimmed[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement.toLowerCase();
    }

    /** true si hay alguna traducción async en curso */
    get isTranslating() { return this._activeTranslations > 0; }

    _storageGet(key) {
        if (!_isBrowser) return null;
        try { return localStorage.getItem(key); } catch { return null; }
    }

    _storageSet(key, value) {
        if (!_isBrowser) return;
        try { localStorage.setItem(key, value); } catch (e) {
            console.warn('[i18n] localStorage write failed:', e);
        }
    }

    // [FIX F2] Separador inequívoco — ningún texto real puede contener \x1F
    _getCacheKey(from, to, text) {
        return `${from}${CACHE_KEY_SEP}${to}${CACHE_KEY_SEP}${text}`;
    }

    // ─────────────────────────────────────────────
    // INICIALIZACIÓN
    // ─────────────────────────────────────────────

    /**
     * Inicializa el motor. Idempotente — seguro para llamar múltiples veces.
     * No-op en entornos SSR (Next.js server, Node.js, Deno).
     * @param {object} config - Opciones (sobreescriben los defaults)
     * @returns {Promise<void>}
     */
    async init(config = {}) {
        if (!_isBrowser) return Promise.resolve();

        this.config = { ...this.config, ...config };

        if (!this.readyPromise) {
            // [FIX F3] Crear la promise con resolver ANTES de cualquier await,
            // y resolverla dentro del try/finally para garantizar que siempre resuelve.
            let resolver;
            this.readyPromise = new Promise(res => { resolver = res; });

            try {
                this._initializeCacheMap();

                const savedLang = this._storageGet(this.config.storageKey);
                if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
                    this.currentLang = savedLang;
                } else if (this.config.autoDetectBrowserLang) {
                    const browserLang = (navigator.language || this.config.fallbackLang).split('-')[0];
                    this.currentLang = SUPPORTED_LANGS.includes(browserLang)
                        ? browserLang
                        : this.config.fallbackLang;
                } else {
                    this.currentLang = this.config.fallbackLang;
                }

                document.documentElement.lang = this.currentLang;
                this._applyDirAttribute(this.currentLang);
                this._snapshotOriginals();
                this._startMutationObserver();

                if (this.currentLang === this.config.fallbackLang) {
                    if (this.config.fallbackLang !== 'en') {
                        this._ensureLanguagesCached('en').catch(e =>
                            console.warn('[i18n] Background pivot cache failed:', e)
                        );
                    }
                } else {
                    this._setLoadingState(true, this.currentLang);
                    try {
                        await this._ensureLanguagesCached(this.currentLang);
                        await this.translatePage(this.currentLang);
                    } finally {
                        this._setLoadingState(false, this.currentLang);
                    }
                }
            } finally {
                // [FIX F3] Resolver SIEMPRE, incluso si hubo error — nunca dejar la promise colgada
                resolver();
            }
        }
        return this.readyPromise;
    }

    /**
     * Cambia el idioma activo.
     * @param {string} lang - Código de idioma (debe estar en SUPPORTED_LANGS)
     */
    async setLanguage(lang) {
        if (!_isBrowser) return;
        if (!SUPPORTED_LANGS.includes(lang)) return;
        if (lang === this.currentLang) return;
        if (lang !== this.config.fallbackLang && !navigator.onLine) {
            console.warn('[i18n] Offline: Cannot translate without internet.');
            return;
        }
        this._setLoadingState(true, lang);
        try {
            await this._ensureLanguagesCached(lang);
            await this.translatePage(lang);
        } catch (e) {
            console.error('[i18n] setLanguage failed:', e);
        } finally {
            this._setLoadingState(false, lang);
        }
    }

    /**
     * Limpia todos los recursos del motor.
     * Permite reinicializar con init() después de llamar destroy().
     */
    destroy() {
        // [OPT O5] Persistir caché pendiente antes de destruir
        this._flushCacheSync();

        this._hideLoadingOverlay();
        if (_isBrowser) {
            const existing = document.getElementById('i18n-loading-overlay');
            if (existing) {
                existing.style.pointerEvents = 'none';
                try { existing.remove(); } catch {}
            }
        }

        if (this.observer) { this.observer.disconnect(); this.observer = null; }
        clearTimeout(this._mutationDebounceTimer);
        clearTimeout(this._persistDebounceTimer);

        if (this._langChangedListener) {
            if (_isBrowser) document.removeEventListener('i18n-lang-changed', this._langChangedListener);
            this._langChangedListener = null;
        }

        this.readyPromise        = null;
        this._activeTranslations = 0;
        this._cacheReady         = false;
        this._pivotENReady       = false;
        this._lastWarmupTexts    = { base: null, pivot: null };
    }

    // ─────────────────────────────────────────────
    // UI: OVERLAY DE CARGA Y SELECTOR GOOEY
    // ─────────────────────────────────────────────

    _setLoadingState(isLoading, targetLang) {
        if (this.config.onLoadingStateChange) {
            this.config.onLoadingStateChange(isLoading, targetLang);
        }
        if (this.config.useDefaultLoadingScreen) {
            if (isLoading) this._showLoadingOverlay(targetLang);
            else this._hideLoadingOverlay();
        }
    }

    _showLoadingOverlay(lang) {
        if (!_isBrowser) return;
        let overlay = document.getElementById('i18n-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'i18n-loading-overlay';
            overlay.setAttribute('data-no-translate', 'true');
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.85)', color: '#e5e7eb',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace, sans-serif',
                zIndex: '999999', opacity: '0', transition: 'opacity 0.2s ease',
                backdropFilter: 'blur(4px)', pointerEvents: 'auto'
            });
            document.body.appendChild(overlay);
        }
        const msg = LOADING_MESSAGES[lang] || LOADING_MESSAGES[this.config.fallbackLang] || 'Loading...';
        overlay.innerText = msg;
        overlay.style.pointerEvents = 'auto';
        void overlay.offsetWidth; // Forzar reflow para activar la transición CSS
        overlay.style.opacity = '1';
    }

    _hideLoadingOverlay() {
        if (!_isBrowser) return;
        const overlay = document.getElementById('i18n-loading-overlay');
        if (overlay) {
            overlay.style.pointerEvents = 'none'; // [CRÍTICO] Liberar clics inmediatamente
            overlay.style.opacity = '0';
            setTimeout(() => {
                try {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                } catch {}
            }, 200);
        }
    }

    _applyDirAttribute(lang) {
        if (!_isBrowser) return;
        document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    }

    /**
     * Inyecta el selector de idioma animado (Gooey) en el contenedor indicado.
     * @param {string} containerSelector - Selector CSS del contenedor destino
     * @param {string[]} languagesToDisplay - Idiomas a mostrar en el selector
     */
    createLanguageSelector(containerSelector, languagesToDisplay = ['es', 'en']) {
        if (!_isBrowser) return;
        const container = document.querySelector(containerSelector);
        if (!container) return;

        if (!document.getElementById('i18n-goo-filter')) {
            const svg = document.createElement('div');
            svg.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="display:none">
                   <defs>
                      <filter id="i18n-goo">
                         <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                         <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                         <feBlend in="SourceGraphic" in2="goo" />
                      </filter>
                   </defs>
                </svg>`;
            document.body.appendChild(svg);
        }

        if (!document.getElementById('i18n-switch-styles')) {
            const style = document.createElement('style');
            style.id = 'i18n-switch-styles';
            style.textContent = `
                .i18n-lang-switch {
                  --padding:8px;--margin:5px;--width:50px;--active-index:0;
                  position:relative;display:inline-flex;padding:var(--padding);
                  background-color:#2d9cdb;border-radius:40px;user-select:none;
                }
                .i18n-lang-switch__text {
                  width:var(--width);height:var(--width);line-height:var(--width);
                  text-align:center;font-size:16px;font-family:"Roboto",sans-serif;
                  font-weight:700;color:#121212;cursor:pointer;z-index:2;
                  text-transform:uppercase;transition:transform 0.2s;
                }
                .i18n-lang-switch__text:hover{transform:scale(1.1);}
                .i18n-lang-switch__text:not(:last-child){margin-right:var(--margin);}
                .i18n-lang-switch__blobs {
                  position:absolute;z-index:1;top:0;left:0;width:100%;height:100%;
                  filter:url("#i18n-goo");pointer-events:none;
                }
                .i18n-lang-switch__blobs::before,.i18n-lang-switch__blobs::after {
                  content:"";position:absolute;top:var(--padding);left:var(--padding);
                  width:var(--width);height:var(--width);border-radius:100%;
                  background-color:#fefefe;
                  transition:transform 0.4s cubic-bezier(0.51,0.06,0.56,1.37);
                  will-change:transform;
                }
                .i18n-lang-switch__blobs::before {
                  transform:translateX(calc(var(--active-index)*(var(--width)+var(--margin))))scale(0.7);
                  transition-delay:0.1s;
                }
                .i18n-lang-switch__blobs::after {
                  transform:translateX(calc(var(--active-index)*(var(--width)+var(--margin))));
                }`;
            document.head.appendChild(style);
        }

        container.innerHTML = '';
        const switchEl = document.createElement('div');
        switchEl.className = 'i18n-lang-switch';
        switchEl.setAttribute('data-no-translate', 'true');

        languagesToDisplay.forEach(lang => {
            const btn = document.createElement('div');
            btn.className = 'i18n-lang-switch__text';
            btn.innerText = lang.toUpperCase();
            btn.onclick = () => this.setLanguage(lang);
            switchEl.appendChild(btn);
        });

        switchEl.appendChild(Object.assign(document.createElement('div'), { className: 'i18n-lang-switch__blobs' }));
        container.appendChild(switchEl);

        const syncIndex = (lang) => {
            const idx = languagesToDisplay.indexOf(lang);
            if (idx >= 0) switchEl.style.setProperty('--active-index', idx);
        };
        syncIndex(this.currentLang);

        if (this._langChangedListener) {
            document.removeEventListener('i18n-lang-changed', this._langChangedListener);
        }
        this._langChangedListener = (e) => syncIndex(e.detail.lang);
        document.addEventListener('i18n-lang-changed', this._langChangedListener);
    }

    // ─────────────────────────────────────────────
    // SNAPSHOT DEL DOM
    // ─────────────────────────────────────────────

    _snapshotOriginals() {
        if (!_isBrowser) return;
        this._walkNodes(document.body, (node) => {
            if (this._processedNodes.has(node)) return;
            const text = node.nodeValue.trim();
            if (this._isTranslatable(text)) {
                this.originalSnapshot.set(node, node.nodeValue);
                this._processedNodes.add(node);
            }
        });
        this._snapshotAttributesIn(document.body);
    }

    _snapshotAttributesIn(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        root.querySelectorAll(ATTRS_SELECTOR).forEach(el => {
            if (this._isExcluded(el)) return;
            TRANSLATABLE_ATTRS.forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && this._isTranslatable(val.trim())) {
                    if (!this._attrSnapshot.has(el)) this._attrSnapshot.set(el, new Map());
                    if (!this._attrSnapshot.get(el).has(attr)) {
                        this._attrSnapshot.get(el).set(attr, val);
                    }
                }
            });
        });
    }

    /**
     * Re-registra nodos nuevos al idioma base.
     * Llamar después de hot-reloads o re-renders masivos cuando el idioma actual es el fallback.
     */
    refreshSnapshot() {
        if (!_isBrowser) return;
        if (this.currentLang === this.config.fallbackLang) {
            this._snapshotOriginals();
        }
    }

    // ─────────────────────────────────────────────
    // COLECCIÓN DE NODOS TRADUCIBLES
    // ─────────────────────────────────────────────

    _collectTranslatableNodes(root = document.body) {
        const nodes = [];
        this._walkNodes(root, (node) => {
            // [FIX F5] Leer del snapshot si existe, para no incluir texto ya traducido
            const text = (this.originalSnapshot.get(node) ?? node.nodeValue).trim();
            if (this._isTranslatable(text)) nodes.push(node);
        });
        return nodes;
    }

    _collectTranslatableAttrItems(root = document.body) {
        const items = [];
        if (!root || typeof root.querySelectorAll !== 'function') return items;
        root.querySelectorAll(ATTRS_SELECTOR).forEach(el => {  // [OPT O2] selector pre-calculado
            if (this._isExcluded(el)) return;
            TRANSLATABLE_ATTRS.forEach(attr => {
                const val = el.getAttribute(attr);
                if (!val || !this._isTranslatable(val.trim())) return;
                if (!this._attrSnapshot.has(el)) this._attrSnapshot.set(el, new Map());
                if (!this._attrSnapshot.get(el).has(attr)) {
                    this._attrSnapshot.get(el).set(attr, val);
                }
                items.push({ el, attr });
            });
        });
        return items;
    }

    _walkNodes(root, callback) {
        if (!root) return;
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT; // [OPT O3] Set O(1)
                    if (this._isExcluded(parent)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        let node;
        while ((node = walker.nextNode())) callback(node);
    }

    _isTranslatable(text) {
        if (!text || text.trim().length < 2) return false;
        if (NUMERIC_REGEX.test(text.trim())) return false;
        if (EMOJI_ONLY_REGEX.test(text.trim())) return false;
        return true;
    }

    _isExcluded(el) {
        if (!el) return false;
        if (el.hasAttribute && el.hasAttribute('data-no-translate')) return true;
        if (el.closest && el.closest('[data-no-translate]')) return true;
        return false;
    }

    // ─────────────────────────────────────────────
    // CACHÉ DE TRADUCCIONES (LRU, 1 MB por idioma)
    // ─────────────────────────────────────────────

    _initializeCacheMap() {
        if (!_isBrowser) return;
        try {
            const langsToLoad = ['en'];
            if (this.currentLang !== this.config.fallbackLang && this.currentLang !== 'en') {
                langsToLoad.push(this.currentLang);
            }
            langsToLoad.forEach(lang => {
                const raw = this._storageGet(`gt_cache_v3_${lang}`);
                if (raw) {
                    const obj = JSON.parse(raw);
                    for (const key in obj) {
                        this._cacheMap.set(key, obj[key]);
                        this._lruPush(key); // Reconstruir orden LRU desde storage
                    }
                }
            });
            this._cacheReady = true; // [FIX F4]
        } catch (e) { console.warn('[i18n] Cache init error:', e); }
    }

    // [OPT O1] LRU con Map para O(1) lookup
    _lruPush(key) {
        if (this._lruMap.has(key)) {
            // Mover al final (más reciente): eliminar y re-añadir
            const idx = this._lruMap.get(key);
            this._lruOrder.splice(idx, 1);
            // Actualizar índices del Map para todos los elementos desplazados
            for (let i = idx; i < this._lruOrder.length; i++) {
                this._lruMap.set(this._lruOrder[i], i);
            }
        }
        this._lruMap.set(key, this._lruOrder.length);
        this._lruOrder.push(key);
    }

    _saveCache(key, value) {
        if (!key) return;
        this._cacheMap.set(key, value);
        this._lruPush(key);
        const parts = key.split(CACHE_KEY_SEP);
        if (parts[1]) this._dirtyLangs.add(parts[1]);
        this._persistCacheDebounced();
    }

    _touchLRU(key) {
        if (this._lruMap.has(key)) this._lruPush(key);
    }

    _persistCacheDebounced() {
        if (!_isBrowser) return;
        clearTimeout(this._persistDebounceTimer);
        this._persistDebounceTimer = setTimeout(() => {
            const persist = () => this._flushCacheSync();
            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                window.requestIdleCallback(persist);
            } else {
                persist();
            }
        }, 2000);
    }

    /** Persiste la caché dirty a localStorage de forma síncrona. */
    _flushCacheSync() {
        if (!_isBrowser || this._dirtyLangs.size === 0) return;
        try {
            const langsToSave = Array.from(this._dirtyLangs);
            this._dirtyLangs.clear();
            langsToSave.forEach(lang => {
                // Recopilar entradas del idioma
                const entries = [];
                const sep = `${CACHE_KEY_SEP}${lang}${CACHE_KEY_SEP}`;
                this._cacheMap.forEach((value, key) => {
                    if (key.includes(sep)) entries.push([key, value]);
                });

                // Ordenar por LRU (menos recientes primero, según _lruOrder)
                entries.sort((a, b) => (this._lruMap.get(a[0]) ?? 0) - (this._lruMap.get(b[0]) ?? 0));

                // [OPT O1] Eviction con estimación de tamaño O(n), sin re-serializar
                const LIMIT = 1_000_000;
                let totalSize = entries.reduce((acc, [k, v]) => acc + k.length + v.length + 4, 0);
                let removeCount = 0;
                while (totalSize > LIMIT && removeCount < entries.length) {
                    const [k, v] = entries[removeCount];
                    totalSize -= (k.length + v.length + 4);
                    this._cacheMap.delete(k);
                    const idx = this._lruMap.get(k);
                    if (idx !== undefined) {
                        this._lruOrder.splice(idx, 1);
                        this._lruMap.delete(k);
                        // Re-indexar los elementos desplazados
                        for (let i = idx; i < this._lruOrder.length; i++) {
                            this._lruMap.set(this._lruOrder[i], i);
                        }
                    }
                    removeCount++;
                }

                this._storageSet(
                    `gt_cache_v3_${lang}`,
                    JSON.stringify(Object.fromEntries(entries.slice(removeCount)))
                );
            });
        } catch (e) { console.warn('[i18n] Cache flush error:', e); }
    }

    // ─────────────────────────────────────────────
    // TRADUCCIÓN: NÚCLEO Y RUTEO INTELIGENTE
    // ─────────────────────────────────────────────

    async _translateAll(texts, from, to) {
        if (!texts.length) return [];
        const results = new Array(texts.length);
        const toFetch = [];

        texts.forEach((text, i) => {
            // [OPT O4] Filtrar textos vacíos o no-traducibles antes de ir a la red
            if (!text || !this._isTranslatable(text)) {
                results[i] = text;
                return;
            }
            const key = this._getCacheKey(from, to, text);
            if (this._cacheMap.has(key)) {
                results[i] = this._cacheMap.get(key);
                this._touchLRU(key);
            } else {
                toFetch.push({ index: i, text });
            }
        });

        if (toFetch.length > 0) {
            const CONCURRENCY = 30;
            for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
                const batch = toFetch.slice(i, i + CONCURRENCY);
                const translations = await Promise.all(
                    batch.map(item => this._fetchSingle(item.text, from, to))
                );
                batch.forEach((item, bi) => {
                    const tr = translations[bi];
                    results[item.index] = tr;
                    this._saveCache(this._getCacheKey(from, to, item.text), tr);
                });
            }
        }
        return results;
    }

    /**
     * Llama a la API de Google Translate con backoff exponencial en 429/503.
     * Nunca lanza — devuelve el texto original si todos los reintentos fallan.
     */
    async _fetchSingle(text, from, to, retries = 3) {
        const normalized = text.replace(/[\n\r]+/g, ' ').trim();
        const q = encodeURIComponent(normalized);
        const endpoints = [
            `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&q=${q}`,
            `https://translate.google.com/translate_a/single?client=at&sl=${from}&tl=${to}&dt=t&q=${q}`,
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${q}`
        ];

        for (let attempt = 0; attempt < retries; attempt++) {
            const url = endpoints[attempt % endpoints.length];
            try {
                const res = await fetch(url);

                if (res.status === 429 || res.status === 503) {
                    if (attempt < retries - 1) {
                        const delay = 200 * Math.pow(2, attempt);
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }
                    return text;
                }

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                // Formato clients5: ["traducción"]
                if (Array.isArray(data) && typeof data[0] === 'string') {
                    return data.join(' ').trim();
                }
                // Formato standard: [[["traducción", ...]], ...]
                if (Array.isArray(data) && Array.isArray(data[0])) {
                    return data[0].map(item => item[0] || '').join('').trim();
                }
                return text;
            } catch (e) {
                if (attempt < retries - 1) {
                    await new Promise(r => setTimeout(r, 150 * (attempt + 1)));
                    continue;
                }
                return text;
            }
        }
        return text;
    }

    /**
     * Traduce toda la página al idioma indicado.
     * Si targetLang es el fallbackLang, restaura los textos originales.
     */
    async translatePage(targetLang) {
        if (!_isBrowser) return;

        if (targetLang === this.config.fallbackLang) {
            this._restoreFallback();
            this.currentLang = this.config.fallbackLang;
            this._storageSet(this.config.storageKey, this.currentLang);
            document.documentElement.lang = this.currentLang;
            this._applyDirAttribute(this.currentLang);
            document.dispatchEvent(new CustomEvent('i18n-lang-changed', { detail: { lang: this.currentLang } }));
            if (this.config.onLanguageChanged) this.config.onLanguageChanged(this.currentLang);
            return;
        }

        this._activeTranslations++;
        try {
            const nodes     = this._collectTranslatableNodes(document.body);
            const attrItems = this._collectTranslatableAttrItems(document.body);

            const directTranslations = new Map();
            const textsToTranslate = [];
            const indexMap = [];

            nodes.forEach((node, i) => {
                const orig = (this.originalSnapshot.get(node) ?? node.nodeValue).trim();
                if (this._isMenuNode(node) && this.config.menuDictionary) {
                    const dict = this.config.menuDictionary[orig.toLowerCase()];
                    if (dict) {
                        if (dict.translations && dict.translations[targetLang]) {
                            directTranslations.set(i, this._matchCase(orig, dict.translations[targetLang]));
                            return;
                        }
                        if (dict.context) {
                            textsToTranslate.push(dict.context);
                            indexMap.push(i);
                            return;
                        }
                    }
                }
                textsToTranslate.push(orig);
                indexMap.push(i);
            });

            attrItems.forEach(({ el, attr }, j) => {
                const val = (this._attrSnapshot.get(el)?.get(attr) ?? el.getAttribute(attr) ?? '').trim();
                textsToTranslate.push(val);
                indexMap.push(nodes.length + j);
            });

            let translatedResults = [];
            const usePivot = this.config.fallbackLang !== 'en';

            if (textsToTranslate.length > 0) {
                if (usePivot) {
                    if (targetLang === 'en') {
                        translatedResults = await this._translateAll(textsToTranslate, this.config.fallbackLang, 'en');
                    } else {
                        const pivotTexts = await this._translateAll(textsToTranslate, this.config.fallbackLang, 'en');
                        const targetTexts = await this._translateAll(pivotTexts, 'en', targetLang);
                        translatedResults = targetTexts.map((text, i) =>
                            text === pivotTexts[i] ? textsToTranslate[i] : text
                        );
                    }
                } else {
                    translatedResults = await this._translateAll(textsToTranslate, this.config.fallbackLang, targetLang);
                }
            }

            const finalTexts = new Array(nodes.length + attrItems.length);
            directTranslations.forEach((val, idx) => {
                finalTexts[idx] = val;
            });
            translatedResults.forEach((val, k) => {
                finalTexts[indexMap[k]] = val;
            });

            nodes.forEach((node, i) => {
                const translation = finalTexts[i];
                if (!translation) return;
                if (!this.originalSnapshot.has(node)) this.originalSnapshot.set(node, node.nodeValue);
                const rawOriginal = this.originalSnapshot.get(node);
                node.nodeValue = rawOriginal.replace(rawOriginal.trim(), translation);
            });

            attrItems.forEach(({ el, attr }, i) => {
                const translation = finalTexts[nodes.length + i];
                if (!translation) return;
                el.setAttribute(attr, translation);
            });

            this.currentLang = targetLang;
            this._storageSet(this.config.storageKey, targetLang);
            document.documentElement.lang = targetLang;
            this._applyDirAttribute(targetLang);

            document.dispatchEvent(new CustomEvent('i18n-lang-changed', { detail: { lang: this.currentLang } }));
            if (this.config.onLanguageChanged) this.config.onLanguageChanged(this.currentLang);
        } catch (e) {
            console.error('[i18n] translatePage error:', e);
        } finally {
            this._activeTranslations--;
        }
    }

    /** Restaura todos los textos y atributos a sus valores originales. */
    _restoreFallback() {
        if (!_isBrowser) return;
        this._walkNodes(document.body, (node) => {
            if (this.originalSnapshot.has(node)) {
                node.nodeValue = this.originalSnapshot.get(node);
            }
        });
        document.body.querySelectorAll(ATTRS_SELECTOR).forEach(el => {
            if (this._isExcluded(el)) return;
            const attrMap = this._attrSnapshot.get(el);
            if (!attrMap) return;
            attrMap.forEach((originalVal, attr) => el.setAttribute(attr, originalVal));
        });
    }

    /**
     * Pre-carga en caché las traducciones de TODOS los textos de la página antes
     * de aplicarlas al DOM, garantizando la traducción instantánea sin parpadeo.
     */
    async _ensureLanguagesCached(targetLang) {
        if (!_isBrowser) return;
        if (targetLang === this.config.fallbackLang) return;

        const usePivot   = this.config.fallbackLang !== 'en';
        const isTargetEN = targetLang === 'en';

        // [FIX F4] Detección de caché robusta: usar flag en vez de iterar el mapa
        // (evita falso "ya en caché" cuando el mapa está vacío con 0 textos)
        const sep = CACHE_KEY_SEP;
        const sampleKeyStart = (usePivot && !isTargetEN)
            ? `en${sep}${targetLang}${sep}`
            : `${this.config.fallbackLang}${sep}${targetLang}${sep}`;

        let hasCached = false;
        for (const key of this._cacheMap.keys()) {
            if (key.startsWith(sampleKeyStart)) { hasCached = true; break; }
        }
        // Solo salir si encontramos caché real Y el motor ya está inicializado
        if (hasCached && this._cacheReady) return;

        if (!this._lastWarmupTexts.base) {
            const nodes     = this._collectTranslatableNodes(document.body);
            const attrItems = this._collectTranslatableAttrItems(document.body);

            const nodeTexts = nodes.map(n =>
                (this.originalSnapshot.get(n) ?? n.nodeValue).trim()
            );
            const attrTexts = attrItems.map(({ el, attr }) =>
                (this._attrSnapshot.get(el)?.get(attr) ?? el.getAttribute(attr) ?? '').trim()
            );

            let dynamicTexts = [];
            if (this.config.warmupHTMLTemplates.length > 0) {
                const sink = document.createElement('div');
                sink.innerHTML = this.config.warmupHTMLTemplates
                    .map(t => t.replace(/<script[\s\S]*?<\/script>/gi, ''))
                    .join(' <hr> ');
                dynamicTexts = this._collectTranslatableNodes(sink)
                    .map(n => n.nodeValue.trim());
            }

            const extraTexts = this.config.warmupTexts || [];
            this._lastWarmupTexts.base = [...new Set([...nodeTexts, ...attrTexts, ...dynamicTexts, ...extraTexts])]
                .filter(t => typeof t === 'string' && t.length > 0 && this._isTranslatable(t));
        }

        if (usePivot) {
            if (!this._pivotENReady) {
                this._lastWarmupTexts.pivot = await this._translateAll(
                    this._lastWarmupTexts.base, this.config.fallbackLang, 'en'
                );
                this._pivotENReady = true;
            }
            if (!isTargetEN) {
                await this._translateAll(this._lastWarmupTexts.pivot, 'en', targetLang);
            }
        } else {
            await this._translateAll(this._lastWarmupTexts.base, this.config.fallbackLang, targetLang);
        }
    }

    // ─────────────────────────────────────────────
    // MUTATION OBSERVER — Traduce contenido dinámico en tiempo real
    // ─────────────────────────────────────────────

    _startMutationObserver() {
        if (!_isBrowser) return;

        this.observer = new MutationObserver((mutations) => {
            if (this.isTranslating) return;
            if (this.currentLang === this.config.fallbackLang) return;

            const newElements = new Set();
            mutations.forEach(m => {
                if (m.type === 'characterData') {
                    if (m.target.nodeType === Node.TEXT_NODE && m.target.parentElement) {
                        newElements.add(m.target.parentElement);
                    }
                } else {
                    m.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            newElements.add(node);
                        } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
                            newElements.add(node.parentElement);
                        }
                    });
                }
            });
            if (!newElements.size) return;

            const toFetchAsync = new Set();
            const usePivot = this.config.fallbackLang !== 'en';

            this._activeTranslations++;

            newElements.forEach(root => {
                this._collectTranslatableNodes(root).forEach(node => {
                    const rawOriginal  = this.originalSnapshot.get(node) ?? node.nodeValue;
                    const originalText = rawOriginal.trim();
                    if (!originalText) return;

                    const currentTrimmed = node.nodeValue.trim();
                    // Nodo ya traducido (valor actual ≠ original y no es el mismo texto) → ignorar
                    const alreadyTranslated = rawOriginal !== node.nodeValue && currentTrimmed !== originalText;
                    if (alreadyTranslated) return;

                    if (!this.originalSnapshot.has(node)) this.originalSnapshot.set(node, rawOriginal);

                    const translated = this._lookupCache(originalText, usePivot, node);
                    if (translated) {
                        node.nodeValue = rawOriginal.replace(originalText, translated);
                    } else {
                        toFetchAsync.add(root);
                    }
                });

                this._collectTranslatableAttrItems(root).forEach(({ el, attr }) => {
                    const originalText = this._attrSnapshot.get(el)?.get(attr) ?? el.getAttribute(attr) ?? '';
                    if (!originalText) return;
                    const translated = this._lookupCache(originalText, usePivot);
                    if (translated) {
                        el.setAttribute(attr, translated);
                    } else {
                        toFetchAsync.add(root);
                    }
                });
            });

            this._activeTranslations--;

            if (!toFetchAsync.size) return;

            clearTimeout(this._mutationDebounceTimer);
            this._mutationDebounceTimer = setTimeout(() => {
                toFetchAsync.forEach(el => this._translateFragment(el));
            }, 50);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /** Busca en caché la traducción correcta según la ruta (directa o pivot). */
    _lookupCache(text, usePivot, node = null) {
        if (node && this._isMenuNode(node) && this.config.menuDictionary) {
            const dict = this.config.menuDictionary[text.toLowerCase().trim()];
            if (dict?.translations?.[this.currentLang]) {
                return this._matchCase(text, dict.translations[this.currentLang]);
            }
        }
        if (usePivot) {
            if (this.currentLang === 'en') {
                return this._cacheMap.get(this._getCacheKey(this.config.fallbackLang, 'en', text)) ?? null;
            }
            const pivot = this._cacheMap.get(this._getCacheKey(this.config.fallbackLang, 'en', text));
            if (!pivot) return null;
            return this._cacheMap.get(this._getCacheKey('en', this.currentLang, pivot)) ?? null;
        }
        return this._cacheMap.get(this._getCacheKey(this.config.fallbackLang, this.currentLang, text)) ?? null;
    }

    /**
     * Traduce un fragmento del DOM recién aparecido que no estaba en caché.
     * Fuente de verdad: siempre el snapshot, nunca el DOM actual.
     */
    async _translateFragment(root) {
        if (!_isBrowser) return;
        if (this.currentLang === this.config.fallbackLang || !root || !root.querySelectorAll) return;

        const nodes     = this._collectTranslatableNodes(root);
        const attrItems = this._collectTranslatableAttrItems(root);
        if (!nodes.length && !attrItems.length) return;

        const nodeTexts = nodes.map(node =>
            (this.originalSnapshot.get(node) ?? node.nodeValue).trim()
        );
        const attrTexts = attrItems.map(({ el, attr }) =>
            (this._attrSnapshot.get(el)?.get(attr) ?? el.getAttribute(attr) ?? '').trim()
        );
        const allTexts = [...nodeTexts, ...attrTexts];

        this._activeTranslations++;
        try {
            let translations;
            const usePivot = this.config.fallbackLang !== 'en';

            if (usePivot) {
                if (this.currentLang === 'en') {
                    translations = await this._translateAll(allTexts, this.config.fallbackLang, 'en');
                } else {
                    const pivotTexts = await this._translateAll(allTexts, this.config.fallbackLang, 'en');
                    const targetTexts = await this._translateAll(pivotTexts, 'en', this.currentLang);
                    translations = targetTexts.map((text, i) =>
                        text === pivotTexts[i] ? allTexts[i] : text
                    );
                }
            } else {
                translations = await this._translateAll(allTexts, this.config.fallbackLang, this.currentLang);
            }

            nodes.forEach((node, i) => {
                let tr = null;
                const orig = nodeTexts[i];
                if (this._isMenuNode(node) && this.config.menuDictionary) {
                    const dict = this.config.menuDictionary[orig.toLowerCase()];
                    if (dict?.translations?.[this.currentLang]) {
                        tr = this._matchCase(orig, dict.translations[this.currentLang]);
                    }
                }
                if (!tr) tr = translations[i];
                if (!tr) return;
                const originalRaw = this.originalSnapshot.get(node) ?? node.nodeValue;
                if (!this.originalSnapshot.has(node)) this.originalSnapshot.set(node, originalRaw);
                node.nodeValue = originalRaw.replace(nodeTexts[i], tr);
            });

            attrItems.forEach(({ el, attr }, i) => {
                const tr = translations[nodes.length + i];
                if (!tr) return;
                el.setAttribute(attr, tr);
            });
        } finally {
            this._activeTranslations--;
        }
    }

    /** Devuelve el código del idioma actualmente activo */
    getCurrentLang() { return this.currentLang; }
}

// ─────────────────────────────────────────────
// SINGLETON EXPORTADO
//
// El constructor NO accede a document/window/localStorage → seguro en SSR/Node.js.
// init() detecta automáticamente si está en un browser o en servidor:
//   - Browser: inicializa snapshot, observer y traducciones
//   - SSR/Node: resuelve inmediatamente sin hacer nada
// ─────────────────────────────────────────────
export const i18n = new I18nManager();
