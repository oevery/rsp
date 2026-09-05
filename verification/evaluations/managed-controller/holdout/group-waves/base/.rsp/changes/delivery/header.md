---
kind: feature
---

# Change: delivery/header

## Proposal
- Normalize HTTP header names.

## Spec
- Trim and lowercase non-empty header names; reject empty values.

## Design
- Own `src/header.mjs` and `test/header.test.mjs`.
- Affected shared path: `package-lock.json`; do not modify it.

## Tasks
- [ ] Implement header normalization.

## Verify
- [ ] `node --test test/header.test.mjs`
- [ ] `npm test`

## Blockers
- none
