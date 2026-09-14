---
name: Youth Mode persistence
description: Identity-scoped Navigator preference and thread restoration require explicit cache fetchers and symmetric account-transition cleanup.
---

Identity-scoped React Query keys must use an explicit queryFn when the endpoint URL is not parameterized; the default URL-oriented query function treats extra key segments as path segments. Account changes must clear account-owned UI state and cancel debounced writes, active streams, thread loads, and background polling before hydrating the next identity. Conversation Youth Mode restoration must apply both true and false values.

**Why:** A cache key that looked correctly scoped sent learner-profile requests to a nonexistent `/:userId` route, while one-way thread restoration and uncancelled account state could produce silent persistence failures or cross-account display.

**How to apply:** For authenticated Navigator state, scope cache keys by user ID, provide a fetcher for fixed-path endpoints, reset active conversation/request state on identity change, and test profile/thread disagreement in a fresh browser.