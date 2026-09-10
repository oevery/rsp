---
kind: "feature"
---

# Change: coalesce-avatar-loads

## Proposal
- Outcome: Share one active avatar load per user while preserving later refreshes.
- Non-goals: Persistent caching or cross-user scheduling.

## Spec
### MODIFIED
- Requirement: Concurrent calls for one user share the same active load; a call after settlement starts a new load.

## Design
- Keep only active promises keyed by user ID and remove each entry on settlement.

## Tasks
- [ ] Implement active-load coalescing.
- [ ] Cover concurrent sharing and post-settlement refresh.

## Verify
### Required
- Automated:
  - [ ] `npm test` — proves concurrent sharing and later refresh behavior.

## Blockers
- none
