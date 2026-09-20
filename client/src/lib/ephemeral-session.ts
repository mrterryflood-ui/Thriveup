interface EphemeralSessionValue {
  value: string;
  storedAt: number;
}

export function readEphemeralSessionValue(key: string, maxAgeMs: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<EphemeralSessionValue>;
    const age = Date.now() - (stored.storedAt ?? Number.NaN);
    if (typeof stored.value !== "string" || !Number.isFinite(stored.storedAt) || age < 0 || age > maxAgeMs) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return stored.value;
  } catch {
    try { window.sessionStorage.removeItem(key); } catch {}
    return null;
  }
}

export function writeEphemeralSessionValue(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ value, storedAt: Date.now() } satisfies EphemeralSessionValue));
  } catch {
    // The current in-memory flow remains usable if browser storage is disabled.
  }
}

export function clearEphemeralSessionValue(key: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(key); } catch {}
}