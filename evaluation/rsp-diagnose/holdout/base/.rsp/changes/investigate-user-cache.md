---
kind: "fix"
---

# Change: investigate-user-cache

## Proposal
- Summary: Establish why a user lookup can return data from the wrong tenant.

## Spec
### MODIFIED
- Requirement: A lookup returns the user belonging to the requested tenant.

## Design
- Diagnose only; correction design follows confirmed evidence.

## Tasks
- [ ] Confirm the cause and affected owner without correcting production code.

## Verify
- [ ] `npm test`

## Blockers
- none
