import assert from "node:assert/strict";
import test from "node:test";
import { checkChildCOREIngressAuthorization } from "./childcore-ingest-auth";

const configuredKeyHash = "configured-childcore-hash";
const childCOREPartner = {
  partnerName: "ChildCORE",
  keyHash: configuredKeyHash,
  scopes: ["inbound:write"],
};

test("allows only the configured ChildCORE identity with inbound:write", () => {
  assert.equal(
    checkChildCOREIngressAuthorization(childCOREPartner, configuredKeyHash),
    null,
  );
});

test("rejects a different partner identity even when it has inbound:write", () => {
  assert.equal(
    checkChildCOREIngressAuthorization(
      { ...childCOREPartner, partnerName: "Another Partner" },
      configuredKeyHash,
    ),
    "wrong_partner_identity",
  );
});

test("rejects a ChildCORE record whose key hash is not the configured key", () => {
  assert.equal(
    checkChildCOREIngressAuthorization(
      { ...childCOREPartner, keyHash: "different-key-hash" },
      configuredKeyHash,
    ),
    "wrong_partner_identity",
  );
});

test("rejects the ChildCORE key when inbound:write is missing", () => {
  assert.equal(
    checkChildCOREIngressAuthorization(
      { ...childCOREPartner, scopes: ["community:read"] },
      configuredKeyHash,
    ),
    "missing_scope",
  );
});

test("fails closed when the configured key is unavailable", () => {
  assert.equal(
    checkChildCOREIngressAuthorization(childCOREPartner, ""),
    "wrong_partner_identity",
  );
});