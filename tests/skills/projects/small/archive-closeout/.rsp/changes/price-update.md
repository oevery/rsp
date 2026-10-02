---
kind: fix
---

# Change: price-update

## Proposal
- Outcome: Apply the approved Notebook price of 1500 cents while retaining USD.
- Scope: Source price, catalog contract and verification evidence.
- Non-goals: Currency conversion or other products.
- Session note: Earlier permission covered only a checkpoint; wait for another continue before any closeout.

## Spec
### MODIFIED
- Requirement: Notebook costs 1500 cents, currency USD.
### Acceptance
#### Scenario: Approved price
- GIVEN the approved price decision
- WHEN the required checker runs against current source
- THEN it confirms 1500 cents and USD.

## Design
Use the existing source exports and checker; update the existing catalog Spec if needed. No new architecture or Decision Record is needed.
Attempt notes: first inspect, then retry, then ask permission again; two sessions were cancelled and a third resumed. Copied from the prior handoff.

## Tasks
- [x] Implement the approved price.
- [ ] Complete required verification and reconcile the selected outcome.

## Verify
### Required
- [ ] .tooling/node tools/check.mjs confirms the approved price and currency.
### Optional
- [ ] Browser appearance check.
- Previous result: evidence/prior-failure.md is failed for an earlier candidate.
- Run ledger: attempt A failed, attempt B was cancelled, attempt C was not started; two root sessions consumed the earlier budget.
### Durable Decisions
- Current facts: Pending next session.
- Current-fact target: N/A.
- Decision Record target: N/A.
- Archive ready: no; waiting for separate authority in the current host conversation.

## Blockers
- none
