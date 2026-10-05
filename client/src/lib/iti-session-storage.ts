import {
  clearEphemeralSessionValue,
  readEphemeralSessionEntryWithStatus,
  writeEphemeralSessionValue,
  type EphemeralSessionReadResult,
} from "./ephemeral-session";

export const ITI_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export type ItiSessionValueKind = "token" | "id";

export function getItiSessionStorageKey(kind: ItiSessionValueKind, surface: string, context: string | undefined): string {
  return `iti-${kind}:v2:${JSON.stringify([surface, context ?? null])}`;
}

function getLegacySessionStorageKey(kind: ItiSessionValueKind, surface: string, context: string | undefined): string {
  return `iti-${kind}:${surface}:${context ?? "default"}`;
}

function hasAmbiguousLegacyContext(context: string | undefined): boolean {
  return context === undefined || context === "default";
}

export function readItiSessionEntry(
  kind: ItiSessionValueKind,
  surface: string,
  context: string | undefined,
): EphemeralSessionReadResult {
  const key = getItiSessionStorageKey(kind, surface, context);
  const current = readEphemeralSessionEntryWithStatus(key, ITI_TOKEN_MAX_AGE_MS);
  if (current.entry || current.expired || hasAmbiguousLegacyContext(context)) return current;

  // Preserve the old entry's 24-hour lifetime. The legacy "default" key is
  // shared by omitted and literal-default contexts, so neither may migrate it.
  const legacyKey = getLegacySessionStorageKey(kind, surface, context);
  const legacy = readEphemeralSessionEntryWithStatus(legacyKey, ITI_TOKEN_MAX_AGE_MS);
  if (legacy.entry && writeEphemeralSessionValue(key, legacy.entry.value, legacy.entry.storedAt)) {
    clearEphemeralSessionValue(legacyKey);
  }
  return legacy;
}

export function writeItiSessionValue(
  kind: ItiSessionValueKind,
  surface: string,
  context: string | undefined,
  value: string,
): boolean {
  const key = getItiSessionStorageKey(kind, surface, context);
  if (!hasAmbiguousLegacyContext(context)) {
    clearEphemeralSessionValue(getLegacySessionStorageKey(kind, surface, context));
  }
  return writeEphemeralSessionValue(key, value);
}

export function clearItiSessionValue(
  kind: ItiSessionValueKind,
  surface: string,
  context: string | undefined,
): void {
  clearEphemeralSessionValue(getItiSessionStorageKey(kind, surface, context));
  if (!hasAmbiguousLegacyContext(context)) {
    clearEphemeralSessionValue(getLegacySessionStorageKey(kind, surface, context));
  }
}
