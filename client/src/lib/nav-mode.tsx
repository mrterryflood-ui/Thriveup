import { createContext, useContext, useState, ReactNode } from "react";

export type NavMode = "hub" | "classic";

interface NavModeContextValue {
  mode: NavMode;
  setMode: (m: NavMode) => void;
  toggle: () => void;
}

const NavModeContext = createContext<NavModeContextValue>({
  mode: "hub",
  setMode: () => {},
  toggle: () => {},
});

const KEY = "tcaf_nav_mode";

export function NavModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<NavMode>(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === "classic" ? "classic" : "hub";
    } catch {
      return "hub";
    }
  });

  const setMode = (m: NavMode) => {
    setModeRaw(m);
    try { localStorage.setItem(KEY, m); } catch {}
  };

  const toggle = () => setMode(mode === "hub" ? "classic" : "hub");

  return (
    <NavModeContext.Provider value={{ mode, setMode, toggle }}>
      {children}
    </NavModeContext.Provider>
  );
}

export const useNavMode = () => useContext(NavModeContext);
