export interface EphemeralSessionValue {
  value: string;
  storedAt: number;
}

export interface EphemeralSessionReadResult {
  entry: EphemeralSessionValue | null;
  expired: boolean;
}

export function readEphemeralSessionEntryWithStatus(key: string, maxAgeMs: number): EphemeralSessionReadResult {
  if (typeof window === "undefined") return { entry: null, expired: false };
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return { entry: null, expired: false };
    const stored = JSON.parse(raw) as Partial<EphemeralSessionValue>;
    const age = Date.now() - (stored.storedAt ?? Number.NaN);
    if (typeof stored.value !== "string" || !Number.isFinite(stored.storedAt) || age < 0 || age >= maxAgeMs) {
      window.sessionStorage.removeItem(key);
      return { entry: null, expired: Number.isFinite(stored.storedAt) && age >= maxAgeMs };
    }
    return { entry: { value: stored.value, storedAt: stored.storedAt! }, expired: false };
  } catch {
    try { window.sessionStorage.removeItem(key); } catch {}
    return { entry: null, expired: false };
  }
}

export function readEphemeralSessionEntry(key: string, maxAgeMs: number): EphemeralSessionValue | null {
  return readEphemeralSessionEntryWithStatus(key, maxAgeMs).entry;
}

export function readEphemeralSessionValue(key: string, maxAgeMs: number): string | null {
  return readEphemeralSessionEntry(key, maxAgeMs)?.value ?? null;
}

export function writeEphemeralSessionValue(key: string, value: string, storedAt = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  if (!Number.isFinite(storedAt) || storedAt < 0) return false;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ value, storedAt } satisfies EphemeralSessionValue));
    return true;
  } catch {
    return false;
  }
}

export function clearEphemeralSessionValue(key: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(key); } catch {}
}