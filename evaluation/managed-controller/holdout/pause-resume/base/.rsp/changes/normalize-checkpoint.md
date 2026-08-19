---
kind: fix
---

# Change: normalize-checkpoint

## Proposal
- Normalize checkpoint identifiers before receiver use.

## Spec
### MODIFIED
- Requirement: Checkpoint identifiers are trimmed and uppercased.

## Design
- Keep normalization in `src/checkpoint.mjs`.

## Tasks
- [ ] Trim and uppercase checkpoint identifiers.

## Verify
- Automated: `npm test`
- Manual: receiver-device acceptance remains required.

## Blockers
- none
