---
kind: fix
---
# Change: checkout-correction
## Proposal
Correct checkout totals before external acceptance.
## Spec
Round each line to nearest cent. Free shipping starts at discounted subtotal >= 2000 cents.
## Design
src/pricing.mjs owns rounding; src/checkout.mjs owns shipping.
## Tasks
- [x] Correct shipping.
- [ ] Correct rounding.
## Verify
### Required
- [ ] node tools/check.mjs
- [ ] node tools/external-check.mjs (exit 78 means unavailable provider fixture).
## Blockers
- External tax acceptance cannot be provisioned by this task.
