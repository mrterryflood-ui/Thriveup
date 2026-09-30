import test from "node:test";
import assert from "node:assert/strict";
import { groundContacts, WITHHELD_PHONE } from "../contact-grounding";

const ctx = "RESOURCE: Travis County Reentry Center — (512) 854-0000 — https://www.traviscountytx.gov/reentry";

test("keeps numbers from retrieved resources, withholds invented ones", () => {
  const r = groundContacts("Call 512-854-0000 or the housing line at 512-555-0199.", ctx);
  assert.match(r.text, /512-854-0000/);
  assert.deepEqual(r.withheldPhones, ["512-555-0199"]);
  assert.ok(r.text.includes(WITHHELD_PHONE));
});
test("crisis N11 numbers are never withheld (they are not 10-digit numbers)", () => {
  const r = groundContacts("If you are in danger call 911. For crisis support call or text 988. For local services dial 211.", "");
  assert.deepEqual(r.withheldPhones, []);
});
test("links to domains not in the retrieved context get a verify note", () => {
  const r = groundContacts("Apply at https://traviscountytx.gov/reentry/apply and see https://example-benefits.org/snap", ctx);
  assert.deepEqual(r.unverifiedHosts, ["example-benefits.org"]);
  assert.match(r.text, /did not come from the resources retrieved/);
});
