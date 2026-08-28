// Tracks which workspace the user is currently acting as. Persisted in
// localStorage so the choice survives reloads. Mutating the selection
// updates localStorage and clears the react-query cache so all org-scoped
// queries refetch under the new x-org-id header (set in queryClient.ts).

import { useCallback, useEffect, useState } from "react";
import { queryClient, CURRENT_ORG_LS_KEY } from "@/lib/queryClient";

const CURRENT_ORG_CHANGED_EVENT = "thriveup:current-org-changed";

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(CURRENT_ORG_LS_KEY); } catch { return null; }
}

export function clearCurrentOrgSelection() {
  try { window.localStorage.removeItem(CURRENT_ORG_LS_KEY); } catch { /* localStorage disabled */ }
  window.dispatchEvent(new CustomEvent(CURRENT_ORG_CHANGED_EVENT, { detail: null }));
}

export function useCurrentOrgId() {
  const [orgId, setOrgIdState] = useState<string | null>(() => readStored());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CURRENT_ORG_LS_KEY) {
        setOrgIdState(e.newValue);
        queryClient.clear();
      }
    };
    const onCurrentOrgChanged = (e: Event) => {
      const next = (e as CustomEvent<string | null>).detail;
      setOrgIdState(next ?? readStored());
      queryClient.clear();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CURRENT_ORG_CHANGED_EVENT, onCurrentOrgChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CURRENT_ORG_CHANGED_EVENT, onCurrentOrgChanged);
    };
  }, []);

  const setOrgId = useCallback((next: string | null) => {
    try {
      if (next) window.localStorage.setItem(CURRENT_ORG_LS_KEY, next);
      else window.localStorage.removeItem(CURRENT_ORG_LS_KEY);
    } catch { /* localStorage disabled */ }
    // `storage` does not fire in the tab that wrote localStorage. Broadcast a
    // same-tab signal so every hook instance updates its cache key before its
    // next request can use the new organization header.
    window.dispatchEvent(new CustomEvent(CURRENT_ORG_CHANGED_EVENT, { detail: next }));
  }, []);

  return { orgId, setOrgId };
}
