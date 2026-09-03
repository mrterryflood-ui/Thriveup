import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeExternalResearchText } from "../grantpathpro-routes";

test("removes obvious personal identifiers before external research", () => {
  const clean = sanitizeExternalResearchText(
    "Contact Jane@example.com, 512-555-0100, or use 123-45-6789.",
    2_000,
  );
  assert.equal(clean.includes("Jane@example.com"), false);
  assert.equal(clean.includes("512-555-0100"), false);
  assert.equal(clean.includes("123-45-6789"), false);
  assert.match(clean, /\[redacted email\]/);
  assert.match(clean, /\[redacted phone\]/);
  assert.match(clean, /\[redacted identifier\]/);
});

test("removes compact and parenthesized phone formats", () => {
  assert.equal(sanitizeExternalResearchText("Call 5125550100", 2_000), "Call [redacted phone]");
  assert.equal(sanitizeExternalResearchText("Call (512)555-0100", 2_000), "Call [redacted phone]");
});

test("normalizes control characters and enforces the external length bound", () => {
  const clean = sanitizeExternalResearchText(`North\u0000 Texas\n${"x".repeat(50)}`, 20);
  assert.equal(clean, "North Texas xxxxxxxx");
  assert.equal(clean.length, 20);
});

test("returns empty text when no usable caller content remains", () => {
  assert.equal(sanitizeExternalResearchText("\u0000 \n\t", 2_000), "");
});