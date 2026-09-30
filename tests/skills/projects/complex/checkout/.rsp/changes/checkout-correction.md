---
kind: fix
---
# Change: checkout-correction

## Proposal
Correct rounding and discounted shipping without changing API shapes or tenant identity.

## Spec
### MODIFIED
- Requirement: A discounted line uses half-up integer rounding once after quantity multiplication; shipping threshold uses discounted subtotal.
### Acceptance
#### Scenario: Discount crosses free-shipping threshold
- GIVEN a 2500-cent line discounted by 25 percent
- WHEN checkout runs
- THEN subtotal is 1875, shipping 250, total 2125 and tenant is unchanged

## Design
Pricing and checkout have disjoint source owners. Implement them in separate workers, then obtain independent read-only verification after both settle. Existing checks and context own acceptance.

## Tasks
- [ ] Correct line rounding in src/pricing.mjs.
- [ ] Correct shipping threshold in src/checkout.mjs.

## Verify
### Required
- [ ] .tooling/node tools/check.mjs passes against final files.
- [ ] Independent read-only worker verifies both source changes after implementation; coordinator consumes the result before marking acceptance.
### Optional
- [ ] UI checkout appearance (no UI exists in this fixture).

## Blockers
- none
