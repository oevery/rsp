---
kind: fix
---

# Change: normalize-label

## Proposal
- Normalize delivery labels according to accepted fixed-scope review findings.

## Spec
- `normalizeLabel(value)` satisfies every accepted finding in the numbered review sequence.

## Design
- Own `src/normalize.mjs`; preserve tests and fixed review reports.

## Tasks
- [ ] Resolve accepted in-scope review findings and converge to a clean re-review.

## Verify
- [ ] Run each finding's named focused test after its correction.
- [ ] `npm test`

## Blockers
- none
