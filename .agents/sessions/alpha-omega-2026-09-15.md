# Alpha Omega — 2026-09-15 — Manor production identity handoff

## Alpha

- End-state: production retains the integration-owned City of Manor identity contract, and GrantPathPro can use the production organization ID returned by the existing idempotent bootstrap without a personal owner ID or secret.
- In-state evidence: development contains one `organizations` row with `external_key = manor-tx-city`, `is_integration_owned = true`, `user_id IS NULL`, and ID `3aeda19b-9719-4157-8e27-6d6c78444672`. Production contains the external-key column, nullable legacy owner column, integration-owned column, and the expected partial unique index, but no Manor row.
- Authority/boundaries: Replit Publish is the supported production schema path; production SQL is read-only to the agent. The staff-only bootstrap route is the application-authorized production data path. Do not publish, impersonate a staff user, write production data directly, or introduce a personal owner or credential.
- Plan and acceptance proofs: verify the source schema, migration receipts, bootstrap route, production endpoint protection, dev/prod organization rows, and unique-key index; run the focused Manor test, GrantPathPro guard, typecheck, memory health, preflight, and independent review; document the human-only Publish/bootstrap step.
- Unknowns/deferred decisions: the production organization ID does not exist until an authorized staff user runs the bootstrap after the current revision is published. It must not be guessed or copied into the record.

## Omega

- Diff scrimmage: no source diff is required. Existing schema and migration enforce nullable legacy ownership, integration-owned status, stable external-key uniqueness, and caller-independent bootstrap. The route fails closed on an existing conflicting key and does not reassign ownership.
- Proofs and gates: development and production schema queries passed; production migration receipts and unique index were verified; production bootstrap endpoint returned `401 Authentication required` without credentials; focused Manor taxonomy tests passed; the GrantPathPro lifecycle guard, zero-error typecheck, and integrated-flow foundation passed after the application workflow was restarted.
- Independent angle: an isolated review subagent confirmed that the implementation is already complete in source and that only authorized post-publish production provisioning remains; it specifically rejected production SQL, startup DDL, data overwrite, and copied development IDs.
- Outcome: source readiness and production schema promotion are verified. The production Manor row and production GrantPathPro ID remain a human-only post-publish operation, not an agent-completable database write.
- Residuals and reusable guard: after Publish, a verified staff user must POST an empty JSON body to `/api/staff/organizations/manor/bootstrap`, save the returned production `organization.id`, and use `externalKey = manor-tx-city`. A 409 conflict requires human identity review; never repurpose the row or change the stable key.