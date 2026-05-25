// Tracks which workspace the user is currently acting as. Persisted in
// localStorage so the choice survives reloads. Mutating the selection
// updates localStorage and clears the react-query cache so all org-scoped
// queries refetch under the new x-org-id header (set in queryClient.ts).

import { useCallback, useEffect, useState } from "react";
import { queryClient, CURRENT_ORG_LS_KEY } from "@/lib/queryClient";

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(CURRENT_ORG_LS_KEY); } catch { return null; }
}

export function useCurrentOrgId() {
  const [orgId, setOrgIdState] = useState<string | null>(() => readStored());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CURRENT_ORG_LS_KEY) setOrgIdState(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setOrgId = useCallback((next: string | null) => {
    try {
      if (next) window.localStorage.setItem(CURRENT_ORG_LS_KEY, next);
      else window.localStorage.removeItem(CURRENT_ORG_LS_KEY);
    } catch { /* localStorage disabled */ }
    setOrgIdState(next);
    // Force every org-scoped query to refetch under the new header.
    queryClient.clear();
  }, []);

  return { orgId, setOrgId };
}
