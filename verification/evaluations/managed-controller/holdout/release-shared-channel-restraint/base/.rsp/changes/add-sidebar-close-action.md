---
kind: "feature"
---

# Change: add-sidebar-close-action

## Proposal
- Outcome: Expose a page-owned action for the existing sidebar close bridge.
- Non-goals: Changing channel ownership or forwarding behavior.

## Spec
### ADDED
- Requirement: The page action invokes the existing bridge and the observable message reaches the main boundary.

## Design
- Add the action at the page boundary and extend the existing chain test.

## Tasks
- [ ] Implement the page action.
- [ ] Extend existing observable-chain coverage.

## Verify
### Required
- Automated:
  - [ ] `npm test` — proves the observable close message.

## Blockers
- none
