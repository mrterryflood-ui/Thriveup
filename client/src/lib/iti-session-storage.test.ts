import assert from "node:assert/strict";
import { test } from "node:test";
import { getItiSessionStorageKey, readItiSessionEntry } from "./iti-session-storage";

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function withSessionStorage<T>(run: (storage: MemoryStorage) => T): T {
  const storage = new MemoryStorage();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage: storage } as unknown as Window,
  });
  try {
    return run(storage);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else delete (globalThis as unknown as { window?: unknown }).window;
  }
}

test("unambiguous legacy ITI sessions migrate without extending their original lifetime", () => {
  withSessionStorage((storage) => {
    const storedAt = Date.now() - 60_000;
    const legacyKey = "iti-token:community-gravity:community-directory";
    const currentKey = getItiSessionStorageKey("token", "community-gravity", "community-directory");
    storage.setItem(legacyKey, JSON.stringify({ value: "legacy-access-token", storedAt }));

    const restored = readItiSessionEntry("token", "community-gravity", "community-directory");
    assert.deepEqual(restored.entry, { value: "legacy-access-token", storedAt });
    assert.equal(storage.getItem(legacyKey), null);
    assert.deepEqual(JSON.parse(storage.getItem(currentKey) ?? "null"), { value: "legacy-access-token", storedAt });
  });
});

test("ambiguous legacy default session keys are never assigned to either context", () => {
  withSessionStorage((storage) => {
    const legacyKey = "iti-token:community-gravity:default";
    const raw = JSON.stringify({ value: "ambiguous-access-token", storedAt: Date.now() - 60_000 });

    storage.setItem(legacyKey, raw);
    assert.equal(readItiSessionEntry("token", "community-gravity", undefined).entry, null);
    assert.equal(storage.getItem(legacyKey), raw);

    assert.equal(readItiSessionEntry("token", "community-gravity", "default").entry, null);
    assert.equal(storage.getItem(legacyKey), raw);
    assert.notEqual(
      getItiSessionStorageKey("token", "community-gravity", undefined),
      getItiSessionStorageKey("token", "community-gravity", "default"),
    );
  });
});
