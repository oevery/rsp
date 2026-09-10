---
kind: feature
---

# Change: delivery-bootstrap

## Proposal
- Establish the delivery protocol marker before normalizing its envelope.

## Spec
- `deliveryProtocol()` returns `delivery-v1`.

## Design
- Own `src/bootstrap.mjs` and `test/bootstrap.test.mjs`.
- After acceptance, inspect `requirements.md`; its independent outcomes are inside the explicit managed goal but intentionally lack owners.

## Tasks
- [ ] Implement the delivery protocol marker.

## Verify
- [ ] `node --test test/bootstrap.test.mjs`
- [ ] `npm test`

## Blockers
- none
