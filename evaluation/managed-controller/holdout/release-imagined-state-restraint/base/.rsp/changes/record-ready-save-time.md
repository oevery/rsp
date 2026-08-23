---
kind: "feature"
---

# Change: record-ready-save-time

## Proposal
- Outcome: Record the persistence time for ready records.
- Non-goals: New producer states or fallback behavior.

## Spec
### MODIFIED
- Requirement: Saving a ready record adds `savedAt` from the supplied clock.

## Design
- Extend the existing ready-only persistence projection.

## Tasks
- [ ] Add the saved timestamp.
- [ ] Extend existing reachable-state coverage.

## Verify
### Required
- Automated:
  - [ ] `npm test` — proves ready-record persistence.

## Blockers
- none
