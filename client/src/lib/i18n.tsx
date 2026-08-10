import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { translations, type Language, LANGUAGES } from "./translations";
import { getVersioned, setVersioned, safeRemove } from "./safe-storage";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  aiTranslate: boolean;
  setAiTranslate: (on: boolean) => void;
  t: (key: string) => string;
  isTranslating: boolean;
  /** True when the active language is non-English but some UI is falling back
   *  to English because a translation is unavailable (cache miss / fetch fail). */
  translationFellBack: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_KEY = "learning-academy-language";
const AI_KEY = "learning-academy-ai-translate";
const CACHE_KEY = "learning-academy-ai-cache";
// Bump when the cache shape changes so old, unversioned/mis-shaped data is
// dropped on read instead of being trusted.
const CACHE_VERSION = 2;
// Bounds so the cache can't grow unbounded across long-lived sessions.
const CACHE_MAX_ENTRIES = 4000; // total src->translation pairs across langs
const CACHE_MAX_BYTES = 512 * 1024; // ~512KB serialized ceiling

type AiCache = Record<string, Record<string, string>>;

// Prune the cache to fit within entry + byte bounds. Drops whole language
// buckets oldest-first (insertion order of object keys), then trims entries
// within the remaining buckets. Simple, deterministic, no LRU bookkeeping.
function pruneCache(cache: AiCache): AiCache {
  let entries = 0;
  for (const lang of Object.keys(cache)) entries += Object.keys(cache[lang]).length;

  const withinBytes = (c: AiCache): boolean => {
    try { return JSON.stringify(c).length <= CACHE_MAX_BYTES; }
    catch { return false; }
  };

  if (entries <= CACHE_MAX_ENTRIES && withinBytes(cache)) return cache;

  const next: AiCache = { ...cache };
  const langOrder = Object.keys(next);
  // Trim entries within each bucket first (drop oldest keys), then drop whole
  // buckets if still over budget.
  for (const lang of langOrder) {
    let count = 0;
    for (const l of Object.keys(next)) count += Object.keys(next[l]).length;
    if (count <= CACHE_MAX_ENTRIES && withinBytes(next)) break;
    const keys = Object.keys(next[lang]);
    const bucket = { ...next[lang] };
    // Remove up to half the bucket oldest-first per pass.
    let removed = 0;
    for (const k of keys) {
      if (count - removed <= CACHE_MAX_ENTRIES && withinBytes({ ...next, [lang]: bucket })) break;
      delete bucket[k];
      removed++;
    }
    if (Object.keys(bucket).length === 0) delete next[lang];
    else next[lang] = bucket;
  }
  return next;
}

const VALID_LANGS = new Set<string>(LANGUAGES.map(l => l.code));
const HUMAN_LANGS = new Set<string>(["en", "es"]);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      if (stored && VALID_LANGS.has(stored)) return stored as Language;
    } catch (err) {
      console.warn("[i18n] localStorage read failed (LANG_KEY)", err);
    }
    return "en";
  });

  const [aiTranslate, setAiTranslateState] = useState<boolean>(() => {
    try { return localStorage.getItem(AI_KEY) === "true"; }
    catch (err) {
      console.warn("[i18n] localStorage read failed (AI_KEY)", err);
      return false;
    }
  });

  const [aiCache, setAiCache] = useState<AiCache>(() => {
    const stored = getVersioned<AiCache>(
      CACHE_KEY,
      { version: CACHE_VERSION },
      (v): v is AiCache => !!v && typeof v === "object" && !Array.isArray(v),
    );
    return stored ?? {};
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const inFlight = useRef<Set<string>>(new Set());

  // Honest, non-blocking notice: when the active language is non-English but a
  // translation is missing, t() shows English — we surface that instead of
  // silently pretending the UI is translated. `fellBackRef` is written during
  // render by t(); `translationFellBack` is the reconciled, dismissible state.
  const fellBackRef = useRef(false);
  const [translationFellBack, setTranslationFellBack] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, language); }
    catch (err) { console.warn("[i18n] localStorage write failed (LANG_KEY)", err); }
  }, [language]);
  useEffect(() => {
    try { localStorage.setItem(AI_KEY, aiTranslate ? "true" : "false"); }
    catch (err) { console.warn("[i18n] localStorage write failed (AI_KEY)", err); }
  }, [aiTranslate]);
  useEffect(() => {
    const bounded = pruneCache(aiCache);
    // setVersioned handles QuotaExceededError by pruning nominated keys and
    // retrying once; if it still fails, drop the persisted cache so a corrupt
    // /oversized entry can't wedge future writes (in-memory state is unaffected).
    const ok = setVersioned<AiCache>(CACHE_KEY, bounded, {
      version: CACHE_VERSION,
      pruneKeys: [CACHE_KEY],
    });
    if (!ok) {
      console.warn("[i18n] translation cache could not be persisted (quota/private mode); keeping in-memory only");
      safeRemove(CACHE_KEY);
    }
  }, [aiCache]);

  // Set RTL on <html> for Arabic
  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === language);
    if (lang) {
      document.documentElement.dir = lang.rtl ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  // Auto-prefetch dictionary translation when user picks an AI language with toggle on
  useEffect(() => {
    if (HUMAN_LANGS.has(language)) return;
    if (!aiTranslate) return;
    if (inFlight.current.has(language)) return;

    const enDict = translations.en;
    const cached = aiCache[language] || {};
    const missing: string[] = [];
    for (const val of Object.values(enDict)) {
      if (val && !cached[val] && !missing.includes(val)) missing.push(val);
    }
    if (missing.length === 0) return;

    inFlight.current.add(language);
    setIsTranslating(true);

    // Batch into chunks of 80 to keep prompt size reasonable
    const CHUNK = 80;
    const chunks: string[][] = [];
    for (let i = 0; i < missing.length; i += CHUNK) {
      chunks.push(missing.slice(i, i + CHUNK));
    }

    Promise.all(
      chunks.map(chunk =>
        fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: chunk, target: language }),
        }).then(r => r.json())
         .then((data: { translations?: string[] }) => ({ chunk, results: data.translations || [] }))
         .catch(err => { console.warn("[i18n] chunk failed", err); return { chunk, results: [] as string[] }; })
      )
    ).then(all => {
      setAiCache(prev => {
        const next = { ...prev };
        const langCache = { ...(next[language] || {}) };
        for (const { chunk, results } of all) {
          chunk.forEach((src, i) => {
            const t = results[i];
            if (t && t.trim()) langCache[src] = t;
          });
        }
        next[language] = langCache;
        return next;
      });
    }).finally(() => {
      inFlight.current.delete(language);
      setIsTranslating(false);
    });
  }, [language, aiTranslate, aiCache]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);
  const setAiTranslate = useCallback((on: boolean) => setAiTranslateState(on), []);

  const t = useCallback((key: string): string => {
    const enText = translations.en[key] ?? key;
    if (HUMAN_LANGS.has(language)) {
      const translated = translations[language][key];
      if (translated == null) fellBackRef.current = true;
      return translated ?? enText;
    }
    if (aiTranslate) {
      const cached = aiCache[language]?.[enText];
      if (cached) return cached;
    }
    // Non-English language active but no translation available — English shown.
    fellBackRef.current = true;
    return enText;
  }, [language, aiTranslate, aiCache]);

  // Reset the fallback flag whenever the language/cache/toggle changes so the
  // notice re-evaluates against the new state rather than sticking on forever.
  useEffect(() => {
    fellBackRef.current = false;
    setTranslationFellBack(false);
    setNoticeDismissed(false);
  }, [language, aiTranslate, aiCache]);

  // After each commit, reconcile what t() observed during render into state.
  useEffect(() => {
    if (HUMAN_LANGS.has(language) && language === "en") return;
    if (fellBackRef.current && !translationFellBack) {
      setTranslationFellBack(true);
    }
  });

  const showNotice =
    translationFellBack && !noticeDismissed && language !== "en";

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, aiTranslate, setAiTranslate, t, isTranslating, translationFellBack }}
    >
      {showNotice && (
        <div
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 max-w-[92vw] rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-md dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
          role="status"
          aria-live="polite"
          data-testid="notice-translation-fallback"
        >
          <span className="truncate">Showing English — translation unavailable</span>
          <button
            type="button"
            onClick={() => setNoticeDismissed(true)}
            className="shrink-0 rounded-full p-0.5 hover:bg-amber-200/60 dark:hover:bg-amber-800/60 transition-colors"
            aria-label="Dismiss translation notice"
            data-testid="button-dismiss-translation-notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export { translations, LANGUAGES };
