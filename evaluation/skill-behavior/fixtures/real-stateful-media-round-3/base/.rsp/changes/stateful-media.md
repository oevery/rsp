# Stateful media hardening

## Intent

Complete safe workspace-local media generation while preserving an honest boundary between local verification and authenticated provider acceptance.

## Scope

- Keep prior late-result, batch cancellation, and URL validation fixes.
- Clear transient drafts on workspace identity changes.
- Normalize provider aborts to `OperationCancelled`.
- Add local regressions and retain a separately runnable authenticated check.

## Constraints

- Drafts are workspace-local and cannot survive an identity change.
- Provider-specific errors cannot escape the adapter.
- Persistence accepts the operation signal and must not commit a record when cancellation wins during save.
- Missing provider credentials mean unavailable verification, not failed behavior.

## Acceptance

- Workspace changes synchronously clear transient drafts.
- Pre-abort, standard abort, and provider-specific abort reject with `OperationCancelled`.
- Cancellation during persistence rejects with `OperationCancelled` without committing or returning a ready record.
- Local regressions pass.
- Authenticated generation is verified separately when credentials and network access are available.

## Verification

- Local: `node --test test/*.test.mjs`
- Authenticated: `RSP_FIXTURE_RUN_AUTHENTICATED=1 node --test e2e/*.test.mjs` (also requires the generic provider endpoint, credential, and network access; unavailable in the isolated evaluation environment)

## Out of Scope

- Credential provisioning and provider account management.
