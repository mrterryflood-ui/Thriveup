---
name: Navigator prefill failure states
description: Durable rules for distinguishing unavailable Navigator prefill from empty context and safely clearing async-owned form values.
---

Navigator prefill must treat non-success or malformed responses as an explicit unavailable state, while a valid empty-context response stays quiet. Navigator-owned form values may be cleared only when the user has not edited them.

**Why:** A fallback that turns an outage into “no context” hides service failures, while clearing a mutable ownership ref before React executes a queued state updater leaves stale personal context in the form.

**How to apply:** Keep the response discriminator strict, expose an authenticated retry/sign-in path without blocking manual screening, and snapshot ownership and edit sets before passing them into functional state updates.