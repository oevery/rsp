---
kind: "feature"
---

# Change: normalize-display-name

## Proposal
- Outcome: Normalize display-name whitespace at the formatting boundary.
- Non-goals: Localization or persistence.

## Spec
### MODIFIED
- Requirement: `formatDisplayName` trims surrounding whitespace and collapses internal runs to one space.

## Design
- Normalize once at the exported formatter boundary.

## Tasks
- [ ] Implement display-name normalization.
- [ ] Cover observable formatting behavior.

## Verify
### Required
- Automated:
  - [ ] `npm test` — proves display-name normalization.

## Blockers
- none
