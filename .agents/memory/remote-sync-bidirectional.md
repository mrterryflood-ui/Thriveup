---
name: Remote sync must diff the full tree both ways
description: When replaying workspace state to GitHub by API, local-only files are invisible if you iterate the remote tree.
---
Rule: when reconciling the workspace with a remote built by API (no shared history), compute the diff from the **union** of local tracked paths and remote tree paths — never by iterating only the remote tree.

**Why:** a sync that walked the remote tree pushed every modified file but silently skipped 13 local-only modules (new `*.ts` files imported by pushed code), leaving the remote tip uncompilable while local tsc passed. It surfaced only after `git reset --soft origin/<branch>` showed them as `A` in the index.

**How to apply:** after any API push, `git fetch` + `git reset --soft origin/<branch>` and inspect `git status`: anything still staged is content the remote lacks. Also grep imports of newly added files before declaring a push complete. Stacked PRs merge into their *declared base branch*, not the trunk; and GitHub's merge API can 409 on criss-cross ancestry even with zero overlapping paths — build the merge commit by hand after a three-way blob comparison.
