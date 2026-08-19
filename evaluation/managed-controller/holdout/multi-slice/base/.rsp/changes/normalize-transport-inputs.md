---
kind: implementation
---

# Change: normalize-transport-inputs

## Proposal
- Normalize independent HTTP header and retry-policy inputs.

## Spec
- Header names are trimmed and lowercased; empty names are rejected.
- Retry counts are integers from zero through five; other inputs are rejected.

## Design
- `src/header.mjs` and `src/retry.mjs` are independent public seams with separate focused tests.

## Tasks
- [ ] Implement and verify header normalization.
- [ ] Implement and verify retry-count normalization.

## Verify
- [ ] `node --test test/header.test.mjs`
- [ ] `node --test test/retry.test.mjs`
- [ ] `npm test`

## Blockers
- none
