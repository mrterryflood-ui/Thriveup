export const ITI_ACCESS_TTL_MS = 24 * 60 * 60 * 1000;

export function isItiAccessWithinWindow(createdAt: Date | string | number, now = Date.now()): boolean {
  const createdAtMs = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  const ageMs = now - createdAtMs;
  return Number.isFinite(createdAtMs) && Number.isFinite(now) &&
    ageMs >= 0 && ageMs < ITI_ACCESS_TTL_MS;
}
