# Stateful media hardening

## Intent

Make asynchronous media work safe across workspace switches and consistent across provider adapters.

## Scope

- Preserve the initiating workspace for late results.
- Expose batch cancellation and validate deliverable URLs.
- Clear transient media drafts whenever workspace identity changes.
- Normalize provider aborts to `OperationCancelled`.

## Constraints

- Drafts and cached selections are workspace-local.
- Provider error classes must not escape the adapter.
- Correct first-round fixes must remain covered by regression tests.

## Acceptance

- Late results persist only to their initiating workspace.
- Active batches expose a synchronous cancel operation.
- Only credential-free HTTP(S) media URLs are deliverable.
- A workspace switch clears the previous draft before consumers observe the new identity.
- Pre-abort and provider abort both reject with `OperationCancelled`.

## Verification

- `node --test test/*.test.mjs`

## Out of Scope

- Authenticated provider smoke testing.
