/**
 * Audience is CONTEXT, not navigation: it narrows which registry rows are shown
 * under each outcome. Stored locally only; never sent to the server; never
 * used for authorization (access comes from the registry floor + session).
 */
import { useSyncExternalStore } from "react";
import { isValidAudience, type Audience } from "@shared/route-nav";

const KEY = "thriveup.audience";
const listeners = new Set<() => void>();

function read(): Audience | null {
  try { const v = window.localStorage.getItem(KEY); return isValidAudience(v) ? v : null; } catch { return null; }
}
function write(a: Audience | null) {
  try { a ? window.localStorage.setItem(KEY, a) : window.localStorage.removeItem(KEY); } catch { /* storage unavailable: preference lives for this render only */ }
  listeners.forEach(l => l());
}
const subscribe = (l: () => void) => { listeners.add(l); window.addEventListener("storage", l); return () => { listeners.delete(l); window.removeEventListener("storage", l); }; };

export function useAudience(): [Audience | null, (a: Audience | null) => void] {
  const audience = useSyncExternalStore(subscribe, read, () => null);
  return [audience, write];
}
