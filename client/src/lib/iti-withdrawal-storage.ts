export interface ItiWithdrawalCapability {
  invitationId: string;
  token: string;
}

export interface ItiWithdrawalStorageRead {
  entries: ItiWithdrawalCapability[];
  available: boolean;
  parseable: boolean;
}

export function getItiWithdrawalStorageKey(surface: string, context: string | undefined): string {
  return `iti-withdrawal:v2:${JSON.stringify([surface, context ?? null])}`;
}

export function getLegacyItiWithdrawalStorageKey(surface: string, context: string | undefined): string {
  return `iti-withdrawal:v1:${surface}:${context ?? "default"}`;
}

export function containsItiWithdrawalCapability(raw: string | null, invitationId: string): boolean {
  if (raw === null) return false;
  try {
    return parseEntries(raw, 2).entries.some((entry) => entry.invitationId === invitationId);
  } catch {
    return false;
  }
}

function hasAmbiguousLegacyContext(context: string | undefined): boolean {
  return context === undefined || context === "default";
}

function isCapability(value: unknown): value is ItiWithdrawalCapability {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.invitationId === "string" &&
    /^[A-Za-z0-9_-]{1,100}$/.test(entry.invitationId) &&
    typeof entry.token === "string" &&
    /^[a-f0-9]{64}$/i.test(entry.token);
}

function parseEntries(raw: string, version: 1 | 2): ItiWithdrawalStorageRead {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return { entries: [], available: false, parseable: false };
  const data = parsed as { version?: unknown; entries?: unknown };
  if (data.version !== version || !Array.isArray(data.entries)) return { entries: [], available: false, parseable: false };
  const entries: ItiWithdrawalCapability[] = [];
  let valid = true;
  for (const entry of data.entries) {
    if (!isCapability(entry)) {
      valid = false;
      continue;
    }
    entries.push(entry);
  }
  return { entries, available: valid, parseable: true };
}

export function readItiWithdrawalCapabilities(surface: string, context?: string): ItiWithdrawalStorageRead {
  if (typeof window === "undefined") return { entries: [], available: false, parseable: false };
  try {
    const currentKey = getItiWithdrawalStorageKey(surface, context);
    const currentRaw = window.localStorage.getItem(currentKey);
    if (currentRaw !== null) return parseEntries(currentRaw, 2);
    if (hasAmbiguousLegacyContext(context)) return { entries: [], available: true, parseable: true };

    const legacyKey = getLegacyItiWithdrawalStorageKey(surface, context);
    const legacyRaw = window.localStorage.getItem(legacyKey);
    if (legacyRaw === null) return { entries: [], available: true, parseable: true };
    const legacy = parseEntries(legacyRaw, 1);
    if (!legacy.parseable) return legacy;

    // Legacy context strings other than the shared "default" sentinel are
    // unambiguous. Copy valid entries; remove the old key only after v2 persists.
    window.localStorage.setItem(currentKey, JSON.stringify({ version: 2, entries: legacy.entries }));
    window.localStorage.removeItem(legacyKey);
    return { entries: legacy.entries, available: true, parseable: true };
  } catch {
    return { entries: [], available: false, parseable: false };
  }
}

export function saveItiWithdrawalCapability(
  surface: string,
  context: string | undefined,
  capability: ItiWithdrawalCapability,
): boolean {
  if (typeof window === "undefined" || !isCapability(capability)) return false;
  const current = readItiWithdrawalCapabilities(surface, context);
  if (!current.available) return false;
  const existing = current.entries.find((entry) => entry.invitationId === capability.invitationId);
  if (existing?.token === capability.token) return true;
  const entries = [...current.entries.filter((entry) => entry.invitationId !== capability.invitationId), capability]
    .sort((a, b) => a.invitationId.localeCompare(b.invitationId));
  try {
    window.localStorage.setItem(getItiWithdrawalStorageKey(surface, context), JSON.stringify({ version: 2, entries }));
    return true;
  } catch {
    return false;
  }
}

export function getItiWithdrawalToken(
  surface: string,
  context: string | undefined,
  invitationId: string,
): string | null {
  const result = readItiWithdrawalCapabilities(surface, context);
  return result.entries.find((entry) => entry.invitationId === invitationId)?.token ?? null;
}

export function removeItiWithdrawalCapability(
  surface: string,
  context: string | undefined,
  invitationId: string,
): boolean {
  if (typeof window === "undefined") return false;
  const current = readItiWithdrawalCapabilities(surface, context);
  if (!current.parseable) return false;
  try {
    const entries = current.entries.filter((entry) => entry.invitationId !== invitationId);
    if (entries.length === 0) window.localStorage.removeItem(getItiWithdrawalStorageKey(surface, context));
    else window.localStorage.setItem(getItiWithdrawalStorageKey(surface, context), JSON.stringify({ version: 2, entries }));
    return true;
  } catch {
    return false;
  }
}
