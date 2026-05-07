import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { translations, type Language, LANGUAGES } from "./translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  aiTranslate: boolean;
  setAiTranslate: (on: boolean) => void;
  t: (key: string) => string;
  isTranslating: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_KEY = "learning-academy-language";
const AI_KEY = "learning-academy-ai-translate";
const CACHE_KEY = "learning-academy-ai-cache";

const VALID_LANGS = new Set<string>(LANGUAGES.map(l => l.code));
const HUMAN_LANGS = new Set<string>(["en", "es"]);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      if (stored && VALID_LANGS.has(stored)) return stored as Language;
    } catch {}
    return "en";
  });

  const [aiTranslate, setAiTranslateState] = useState<boolean>(() => {
    try { return localStorage.getItem(AI_KEY) === "true"; } catch { return false; }
  });

  const [aiCache, setAiCache] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => { try { localStorage.setItem(LANG_KEY, language); } catch {} }, [language]);
  useEffect(() => { try { localStorage.setItem(AI_KEY, aiTranslate ? "true" : "false"); } catch {} }, [aiTranslate]);
  useEffect(() => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(aiCache)); } catch {}
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
      return translations[language][key] ?? enText;
    }
    if (aiTranslate) {
      const cached = aiCache[language]?.[enText];
      if (cached) return cached;
    }
    return enText;
  }, [language, aiTranslate, aiCache]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, aiTranslate, setAiTranslate, t, isTranslating }}>
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
