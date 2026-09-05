# Stateful media generation

## Intent

Allow a user to generate media for several lesson segments and deliver only safe, completed media from the workspace that requested it.

## Scope

- Coordinate provider generation and workspace-scoped persistence.
- Expose cancellation for an active batch.
- Gate delivery using normalized, credential-free HTTP(S) URLs.

## Constraints

- A workspace switch must not redirect an in-flight result into the new workspace.
- Persisted records are untrusted and must be validated at the delivery boundary.
- Provider and storage implementations remain injected ports.

## Acceptance

- A result is stored under the workspace captured when generation starts.
- A caller can cancel an active batch without waiting for another segment.
- Empty, malformed, non-HTTP(S), and credential-bearing URLs cannot be delivered.
- Regression tests cover identity changes, cancellation, and persisted URL validation.

## Verification

- `node --test test/*.test.mjs`

## Out of Scope

- Provider-specific authentication UI.
