const ANON_SESSION_KEY = "trade-sims-anon-session";

export function anonSessionId(): string {
  let id = localStorage.getItem(ANON_SESSION_KEY);
  if (!id) {
    // Cryptographically random — this id acts as a bearer credential for the
    // anon progress rows (and later account merge), so it must be unguessable.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    id = `anon_${rand}`;
    localStorage.setItem(ANON_SESSION_KEY, id);
  }
  return id;
}

/** Reads the stored anon session id without creating one. Returns null if absent. */
export function peekAnonSessionId(): string | null {
  return localStorage.getItem(ANON_SESSION_KEY);
}

/** Clears the stored anon session id (e.g. after merging into an account). */
export function clearAnonSessionId(): void {
  localStorage.removeItem(ANON_SESSION_KEY);
}
