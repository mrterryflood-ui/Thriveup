import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getItiWithdrawalStorageKey,
  containsItiWithdrawalCapability,
  getItiWithdrawalToken,
  readItiWithdrawalCapabilities,
  removeItiWithdrawalCapability,
  saveItiWithdrawalCapability,
  type ItiWithdrawalCapability,
} from "./iti-withdrawal-storage";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  private values = new Map<string, string>();
  writes = 0;

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.writes += 1;
    this.values.set(key, String(value));
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function withBrowserStorage<T>(run: (storage: MemoryStorage) => T): T {
  const storage = new MemoryStorage();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage } as unknown as Window,
  });
  try {
    return run(storage);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else delete (globalThis as unknown as { window?: unknown }).window;
  }
}

function capability(invitationId: string, fill: string): ItiWithdrawalCapability {
  return { invitationId, token: fill.repeat(64) };
}

test("withdrawal storage keeps missing and literal default contexts separate", () => {
  withBrowserStorage(() => {
    const omitted = capability("omitted-context", "a");
    const literalDefault = capability("literal-default", "b");
    assert.notEqual(
      getItiWithdrawalStorageKey("community-gravity", undefined),
      getItiWithdrawalStorageKey("community-gravity", "default"),
    );
    assert.equal(saveItiWithdrawalCapability("community-gravity", undefined, omitted), true);
    assert.equal(saveItiWithdrawalCapability("community-gravity", "default", literalDefault), true);
    assert.equal(getItiWithdrawalToken("community-gravity", undefined, omitted.invitationId), omitted.token);
    assert.equal(getItiWithdrawalToken("community-gravity", "default", literalDefault.invitationId), literalDefault.token);
    assert.equal(getItiWithdrawalToken("community-gravity", undefined, literalDefault.invitationId), null);
  });
});

test("removing a withdrawn capability sanitizes malformed sibling entries", () => {
  withBrowserStorage((storage) => {
    const key = getItiWithdrawalStorageKey("community-gravity", "directory");
    const remaining = capability("remaining-invitation", "c");
    storage.setItem(key, JSON.stringify({
      version: 2,
      entries: [capability("withdrawn-invitation", "d"), { invitationId: "broken", token: "invalid" }, remaining],
    }));

    const before = readItiWithdrawalCapabilities("community-gravity", "directory");
    assert.equal(before.available, false);
    assert.equal(before.parseable, true);
    assert.equal(before.entries.length, 2);
    assert.equal(removeItiWithdrawalCapability("community-gravity", "directory", "withdrawn-invitation"), true);

    const after = readItiWithdrawalCapabilities("community-gravity", "directory");
    assert.equal(after.available, true);
    assert.deepEqual(after.entries, [remaining]);
  });
});

test("unparseable withdrawal storage is reported and left untouched", () => {
  withBrowserStorage((storage) => {
    const key = getItiWithdrawalStorageKey("community-gravity", "directory");
    storage.setItem(key, "{not-json");
    const result = readItiWithdrawalCapabilities("community-gravity", "directory");
    assert.equal(result.available, false);
    assert.equal(result.parseable, false);
    assert.equal(removeItiWithdrawalCapability("community-gravity", "directory", "anything"), false);
    assert.equal(storage.getItem(key), "{not-json");
  });
});

test("unambiguous v1 withdrawal storage migrates to v2 for an expired-session recovery", () => {
  withBrowserStorage((storage) => {
    const legacyKey = "iti-withdrawal:v1:community-gravity:community-directory";
    const currentKey = getItiWithdrawalStorageKey("community-gravity", "community-directory");
    const entry = capability("legacy-invitation", "e");
    storage.setItem(legacyKey, JSON.stringify({ version: 1, entries: [entry] }));

    const restored = readItiWithdrawalCapabilities("community-gravity", "community-directory");
    assert.deepEqual(restored.entries, [entry]);
    assert.equal(restored.available, true);
    assert.equal(storage.getItem(legacyKey), null);
    assert.deepEqual(JSON.parse(storage.getItem(currentKey) ?? "null"), { version: 2, entries: [entry] });
  });
});

test("ambiguous v1 default withdrawal storage is never assigned to either context", () => {
  withBrowserStorage((storage) => {
    const legacyKey = "iti-withdrawal:v1:community-gravity:default";
    const raw = JSON.stringify({ version: 1, entries: [capability("ambiguous-invitation", "f")] });
    storage.setItem(legacyKey, raw);

    assert.deepEqual(readItiWithdrawalCapabilities("community-gravity", undefined).entries, []);
    assert.deepEqual(readItiWithdrawalCapabilities("community-gravity", "default").entries, []);
    assert.equal(storage.getItem(legacyKey), raw);
  });
});

test("saving an unchanged withdrawal capability does not rewrite localStorage", () => {
  withBrowserStorage((storage) => {
    const key = getItiWithdrawalStorageKey("community-gravity", "directory");
    const entry = capability("stable-invitation", "a");
    storage.setItem(key, JSON.stringify({ version: 2, entries: [entry] }));
    const initialWrites = storage.writes;
    const initialRaw = storage.getItem(key);

    assert.equal(saveItiWithdrawalCapability("community-gravity", "directory", entry), true);
    assert.equal(storage.writes, initialWrites);
    assert.equal(storage.getItem(key), initialRaw);
  });
});

test("storage-event membership recognizes only valid v2 withdrawal entries", () => {
  const entry = capability("event-invitation", "b");
  const current = JSON.stringify({ version: 2, entries: [entry] });
  assert.equal(containsItiWithdrawalCapability(current, entry.invitationId), true);
  assert.equal(containsItiWithdrawalCapability(current, "other-invitation"), false);
  assert.equal(containsItiWithdrawalCapability(JSON.stringify({ version: 1, entries: [entry] }), entry.invitationId), false);
  assert.equal(containsItiWithdrawalCapability("{malformed", entry.invitationId), false);
});
