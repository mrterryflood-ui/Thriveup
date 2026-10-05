---
name: Preview viewport evidence
description: Local captures and external development previews can have different usable viewport insets.
---

An external development preview may add a platform banner that is absent from a local app screenshot. Passing local first-viewport geometry is not sufficient proof for the proxied surface.

**Why:** A phone entry layout appeared to fit locally, but independent browser verification through the development domain showed the platform banner pushing actions under fixed bottom navigation.

**How to apply:** Check actionable element bounds and hit-testing against the actual header, bottom navigation and preview insets. Preserve the banner during development-domain verification; do not dismiss it or alter fixtures just to make layout assertions pass.