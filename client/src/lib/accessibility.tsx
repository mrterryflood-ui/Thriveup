import { createContext, useState, useEffect, useContext, useCallback } from "react";

interface AccessibilitySettings {
  dyslexiaFont: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  focusMode: boolean;
  largeText: boolean;
  lineSpacing: "normal" | "relaxed" | "loose";
  colorOverlay: "none" | "warm" | "cool" | "yellow";
  simplifiedLayout: boolean;
  screenReaderOptimized: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  activeCount: number;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  dyslexiaFont: false,
  highContrast: false,
  reducedMotion: false,
  focusMode: false,
  largeText: false,
  lineSpacing: "normal",
  colorOverlay: "none",
  simplifiedLayout: false,
  screenReaderOptimized: false,
};

const STORAGE_KEY = "txea-accessibility-settings";

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle("dyslexia-font", settings.dyslexiaFont);
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduced-motion", settings.reducedMotion);
    root.classList.toggle("focus-mode", settings.focusMode);
    root.classList.toggle("large-text", settings.largeText);
    root.classList.toggle("simplified-layout", settings.simplifiedLayout);

    root.classList.remove("line-spacing-relaxed", "line-spacing-loose");
    if (settings.lineSpacing === "relaxed") root.classList.add("line-spacing-relaxed");
    if (settings.lineSpacing === "loose") root.classList.add("line-spacing-loose");

    root.classList.remove("overlay-warm", "overlay-cool", "overlay-yellow");
    if (settings.colorOverlay === "warm") root.classList.add("overlay-warm");
    if (settings.colorOverlay === "cool") root.classList.add("overlay-cool");
    if (settings.colorOverlay === "yellow") root.classList.add("overlay-yellow");

    if (settings.reducedMotion) {
      root.style.setProperty("--animation-duration", "0s");
    } else {
      root.style.removeProperty("--animation-duration");
    }

    if (settings.screenReaderOptimized) {
      body.setAttribute("role", "application");
    } else {
      body.removeAttribute("role");
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const activeCount = Object.entries(settings).filter(([key, value]) => {
    if (key === "lineSpacing") return value !== "normal";
    if (key === "colorOverlay") return value !== "none";
    return value === true;
  }).length;

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings, activeCount }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
