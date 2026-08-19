---
kind: "refactor"
---

# Change: refresh-status-guidance

## Proposal
- Outcome: Present ready status consistently across the authoritative Spec, product status card, paired public guidance, and verification.
- Scope: Update the named status surfaces under one shared terminology contract.
- Non-goals: Lifecycle closeout, Git delivery, publication, or unrelated status behavior.

## Spec
### MODIFIED
- Requirement: Ready state is presented as `Status: Ready`.
- Requirement: English and Chinese guidance preserve the same canonical product label.

## Design
- One writer updates the shared terminology sequentially because partial surface updates would leave the product contract inconsistent.

## Tasks
- [ ] Update the authoritative status-presentation Spec.
- [ ] Update the product status card.
- [ ] Align paired English and Chinese public guidance.
- [ ] Run focused product and documentation synchronization verification.

## Verify
- Automated:
  - [ ] `node --test test/status-card.test.mjs`
  - [ ] `node --test test/docs-sync.test.mjs`
  - [ ] `npm test`
- Coverage:
  - Product presentation and paired public guidance.

## Blockers
- none
