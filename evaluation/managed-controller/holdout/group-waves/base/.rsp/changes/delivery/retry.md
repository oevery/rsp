---
kind: feature
---

# Change: delivery/retry

## Proposal
- Normalize retry counts.

## Spec
- Accept only integer counts from zero through five.

## Design
- Own `src/retry.mjs` and `test/retry.test.mjs`.
- Affected shared path: `package-lock.json`; do not modify it.

## Tasks
- [ ] Implement retry normalization.

## Verify
- [ ] `node --test test/retry.test.mjs`
- [ ] `npm test`

## Blockers
- none
