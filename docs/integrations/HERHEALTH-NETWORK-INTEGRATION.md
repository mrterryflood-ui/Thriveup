# Network Federation Integration Spec

**Audience:** Maintainers of HerHealth Network (`herhealthmatters2.com`), Bible Study Buddies (`biblestudybuddies.net`), The Healthy Black Man, Your Health Birthright, and any future ecosystem platform.

**Goal:** Each platform stays standalone with its own auth, branding, and data. ThriveUp Academy receives signed events so admins can see a unified roster and activity across the ecosystem — without ever logging into the source platforms.

---

## What ThriveUp gets from you

A small stream of signed POSTs to one endpoint. That's it.

```
POST https://<thriveup>/api/network/events
Content-Type: application/json
X-Network-Platform: herhealth
X-Network-Timestamp: <unix seconds>
X-Network-Signature: sha256=<hex digest>
```

**Replay protection:** the timestamp must be within ±300 seconds of server time, and the signature is computed over `${timestamp}.${body}` (not the body alone). Old captured requests are rejected.

Body — either a single event or `{ "events": [...] }`:

```json
{
  "events": [
    {
      "externalUserId": "u_abc123",
      "eventType": "signup",
      "occurredAt": "2026-04-17T19:30:00Z",
      "email": "jane@example.com",
      "displayName": "Jane Doe",
      "role": "member",
      "zip": "78701",
      "county": "Travis",
      "conditions": ["breast_cancer", "hypertension"],
      "metadata": { "source": "homepage_cta" }
    }
  ]
}
```

### Required event fields
| Field | Required | Notes |
|---|---|---|
| `externalUserId` | yes | Stable opaque ID from your DB. Never an email. |
| `eventType` | yes | See list below. |
| `occurredAt` | recommended | ISO 8601. Defaults to receive time. |

### Optional fields (sent when known)
`email`, `displayName`, `role` (`member` or `admin`), `zip`, `county`, `conditions[]`, `metadata{}`

### Event types ThriveUp understands
- `signup` — new account created
- `login` (or `user.login`) — increments `loginCount`, sets `lastLoginAt`
- `navigator_engaged` (or `nia.engaged`) — flips `navigatorEngaged = true`
- `appointment_booked` (or `appointment.booked`) — increments `appointmentsBooked`
- `role_changed` — pass new `role` field
- Any other type is stored verbatim in the event log; member fields just get refreshed

---

## HMAC signature (the only auth)

Compute `HMAC-SHA256(secret, "<timestamp>." + raw_body_bytes)` and put the lowercase hex digest in `X-Network-Signature` prefixed with `sha256=`. Put the same `<timestamp>` in `X-Network-Timestamp`.

The shared secret lives in ThriveUp's environment as `NETWORK_SECRET_HERHEALTH` (or `NETWORK_SECRET_BIBLESTUDY`, etc.). Generate a 32-byte random hex string (`openssl rand -hex 32`) and put the same value in **both** platforms' env.

### Node.js sender (drop-in)

```js
import crypto from "crypto";

const NETWORK_URL = process.env.NETWORK_URL; // e.g. https://thriveup.example.com
const NETWORK_PLATFORM = "herhealth";
const NETWORK_SECRET = process.env.NETWORK_SECRET; // shared with ThriveUp

export async function sendNetworkEvent(event) {
  const raw = Buffer.from(JSON.stringify({ events: [event] }));
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto
    .createHmac("sha256", NETWORK_SECRET)
    .update(Buffer.concat([Buffer.from(`${ts}.`), raw]))
    .digest("hex");
  const r = await fetch(`${NETWORK_URL}/api/network/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Network-Platform": NETWORK_PLATFORM,
      "X-Network-Timestamp": ts,
      "X-Network-Signature": `sha256=${sig}`,
    },
    body: raw,
  });
  if (!r.ok) console.error("[network] post failed", r.status, await r.text());
}
```

### Where to call it

Drop one call into each lifecycle hook in HerHealth:

```js
// On registration
await sendNetworkEvent({
  externalUserId: user.id,
  eventType: "signup",
  email: user.email,
  displayName: user.displayName,
  zip: user.zip,
  county: user.county,
});

// On login
await sendNetworkEvent({ externalUserId: user.id, eventType: "login" });

// On Nia engagement
await sendNetworkEvent({ externalUserId: user.id, eventType: "navigator_engaged" });

// On appointment booked
await sendNetworkEvent({
  externalUserId: user.id,
  eventType: "appointment_booked",
  metadata: { provider: provider.name, conditionFocus: appt.conditionFocus },
});
```

Send fire-and-forget — failures are logged and don't block the user.

---

## Verifying your code matches ThriveUp's

Once you have the secret in both places, an admin in ThriveUp can call:

```
POST /api/network/test-sign
{ "platform": "herhealth", "body": { "events": [{ "externalUserId": "test", "eventType": "signup" }] } }
```

It returns the exact headers your sender should produce for that body. Compare against your output.

---

## What admins see in ThriveUp

- `/network/members` — unified roster across all federated platforms; filter by platform, role, or search by email/name; click any member to deep-link back into the source platform
- `/network/members/:id/events` — full event timeline per member
- `/network/summary` — per-platform tiles: total members, admins, 7-day active, secret configured (Y/N)

Members are filtered server-side and never leave ThriveUp — they're a mirror, not a copy of your auth.

---

## Privacy & data minimization

- Send only what an admin needs to see. Skip clinical detail.
- `conditions[]` is a free-form list of slugs, not diagnoses. Send `["breast_cancer"]` only if it's already public on the user's profile in your platform.
- `email` is optional. If your platform doesn't expose emails to admins, don't send them.
- All transport is HTTPS. ThriveUp stores no credentials from your platform.

---

## Quickstart checklist for a new platform

1. ThriveUp admin generates a 32-byte hex secret: `openssl rand -hex 32`
2. Set `NETWORK_SECRET_<PLATFORM>` in both ThriveUp's and your platform's environment
3. Add the row to `network_platforms` (HerHealth + 3 sister platforms are seeded automatically)
4. Drop the four hooks (`signup`, `login`, `navigator_engaged`, `appointment_booked`) into your codebase
5. Verify with `/api/network/test-sign`
6. Watch `/network/members` light up
