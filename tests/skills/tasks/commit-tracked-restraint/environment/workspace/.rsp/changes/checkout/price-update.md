---
kind: fix
---
# Change: checkout/price-update

## Proposal

Deliver the prepared 1500-cent price representation when separately authorized.

## Spec

### MODIFIED
- Source exports 1500 cents and storefront represents USD 15.00.

## Design

Only src/price.mjs and site/price.json belong to this Change.

## Tasks

- [x] Prepare the agreed source and storefront values.

## Verify

### Required
- [ ] node tools/check.mjs

## Blockers

- Delivery readiness must account for actual unrelated staging; it grants no authority to alter it.
