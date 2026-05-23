import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * useAutosave — debounced background save for long-form editors.
 *
 * Pattern:
 *   1. On mount, fetches GET /api/me/editor-drafts/:kind/:scope. If a draft
 *      exists, calls onHydrate(content) ONCE so the page can rehydrate
 *      its local state. Sets `hydrated=true` either way.
 *   2. After hydration, watches `value`. When it changes, schedules a
 *      debounced (default 1500ms) PUT. Skips while user is signed out.
 *   3. Exposes `status` ('idle'|'saving'|'saved'|'error'|'signed-out') and
 *      `lastSavedAt` so the page can render a "Saved 3s ago" pill.
 *
 * Drafts are private per Replit Auth user. Anonymous users get
 * `status='signed-out'` and no save attempts are made — the editor
 * still functions, work just doesn't sync across devices.
 */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error" | "signed-out";

export interface UseAutosaveOptions<T> {
  editorKind: "rfp_writer" | "grant_narrative" | "loi_writer" | "org_settings";
  scopeKey?: string;
  value: T;
  enabled?: boolean;
  debounceMs?: number;
  onHydrate?: (content: T) => void;
  /**
   * Optional predicate: return false to skip saving (e.g. value is empty
   * shell and shouldn't overwrite a previously-saved draft).
   */
  shouldSave?: (value: T) => boolean;
}

export interface UseAutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  hydrated: boolean;
  hasDraft: boolean;
  clearDraft: () => Promise<void>;
}

export function useAutosave<T>(opts: UseAutosaveOptions<T>): UseAutosaveResult {
  const {
    editorKind,
    scopeKey = "default",
    value,
    enabled = true,
    debounceMs = 1500,
    onHydrate,
    shouldSave,
  } = opts;

  // Detect auth: if /api/auth/user returns a user, we can save server-side.
  const { data: authUser } = useQuery<{ id?: string } | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 60_000,
  });
  const isSignedIn = !!authUser?.id;

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<string | null>(null);
  const onHydrateRef = useRef(onHydrate);
  onHydrateRef.current = onHydrate;

  const draftUrl = `/api/me/editor-drafts/${encodeURIComponent(editorKind)}/${encodeURIComponent(scopeKey)}`;

  // 1. Hydrate on mount AND whenever scope/kind changes (so per-grant
  //    scoping in editors like grant-narrative works correctly: switching
  //    grants reloads that grant's draft instead of overwriting it).
  useEffect(() => {
    // Reset hydration + dedupe baseline so the save effect below doesn't
    // fire a stale write into the new scope before hydration completes.
    setHydrated(false);
    lastSerializedRef.current = null;
    if (!enabled) {
      setHydrated(true);
      return;
    }
    if (!isSignedIn) {
      setStatus("signed-out");
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(draftUrl, { credentials: "include" });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.content !== undefined) {
            setHasDraft(true);
            setLastSavedAt(data.updatedAt ? new Date(data.updatedAt) : null);
            setStatus("saved");
            lastSerializedRef.current = JSON.stringify(data.content);
            onHydrateRef.current?.(data.content as T);
          }
        } else if (res.status === 404) {
          // No draft yet; that's fine.
          setStatus("idle");
        } else if (res.status === 401) {
          setStatus("signed-out");
        } else {
          setStatus("error");
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[useAutosave] hydrate failed:", err);
          setStatus("error");
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorKind, scopeKey, enabled, isSignedIn]);

  // 2. Debounced save when value changes after hydration.
  useEffect(() => {
    if (!enabled || !hydrated || !isSignedIn) return;
    if (shouldSave && !shouldSave(value)) return;
    let serialized: string;
    try {
      serialized = JSON.stringify(value);
    } catch {
      return;
    }
    if (serialized === lastSerializedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const res = await fetch(draftUrl, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value }),
        });
        if (res.ok) {
          lastSerializedRef.current = serialized;
          setLastSavedAt(new Date());
          setStatus("saved");
          setHasDraft(true);
        } else if (res.status === 401) {
          setStatus("signed-out");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.warn("[useAutosave] save failed:", err);
        setStatus("error");
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hydrated, enabled, isSignedIn, debounceMs]);

  const clearDraft = async () => {
    if (!isSignedIn) return;
    try {
      await fetch(draftUrl, { method: "DELETE", credentials: "include" });
      setHasDraft(false);
      setLastSavedAt(null);
      setStatus("idle");
      lastSerializedRef.current = null;
    } catch (err) {
      console.warn("[useAutosave] clear failed:", err);
    }
  };

  return { status, lastSavedAt, hydrated, hasDraft, clearDraft };
}
