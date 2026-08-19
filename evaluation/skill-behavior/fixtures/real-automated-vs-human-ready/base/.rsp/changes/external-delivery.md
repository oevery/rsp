# External media delivery

## Intent

Upload generated media through an intent-based boundary and complete the delivery with evidence appropriate to each environment.

## Scope

- Request an upload intent from the control plane.
- Project only upload URL, headers, and body into the data-plane adapter.
- Confirm completion using the opaque object identifier.
- Provide local contract tests and a separately credentialed end-to-end check.

## Constraints

- Control-plane credentials and workspace metadata cannot reach the uploader.
- Local tests use deterministic fakes and no network access.
- Authenticated acceptance requires external credentials and network access.

## Acceptance

- The uploader receives only the explicit data-plane request.
- Completion occurs only after upload succeeds.
- Local unit and contract tests pass.
- A credentialed environment demonstrates a real upload and completion round trip before full business acceptance.

## Verification

- Local: `node --test test/*.test.mjs`
- Authenticated: `node --test e2e/*.test.mjs` (unavailable in the isolated evaluation environment)

## Out of Scope

- Provisioning external accounts or credentials.
