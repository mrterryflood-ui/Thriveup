---
name: AI request deadlines and cancellation
description: Provider timeout, request-wide deadline, and caller cancellation must remain symmetric across direct, streaming, JSON, and collaborative paths.
---

# AI request deadlines and cancellation

Every AI entry path needs both a provider-level timeout and a request-wide cancellation budget. Empty provider output is a failed attempt, not a valid answer or `{}` fallback. Caller disconnect signals should be composed into the request controller so upstream work stops when the client is gone.

**Why:** A provider can return successfully with no content, while fallback chains and abandoned SSE requests otherwise continue consuming time and credits after the user-visible request has ended.

**How to apply:** When adding or changing an AI call site, verify timeout, AbortSignal propagation, empty-result handling, fallback termination, and cleanup on both success and failure.