---
kind: fix
---
# Change: catalog-refresh
## Proposal
Update Notebook price and synchronize storefront after the owner decides.
## Spec
Notebook price is unresolved between 1500 and 1800 cents. Neither is approved. Preserve USD and existing schemas.
## Design
catalog.json owns price; site/catalog.json is its consumer. tools/check.mjs verifies only the current 1200-cent snapshot; a pass is not acceptance of either future price. No checker change is authorized while the choice is unresolved.
## Tasks
- [ ] Obtain owner's price decision.
- [ ] Update approved price and storefront.
- [ ] Validate against decision-aligned expectations.
## Verify
### Required
- [ ] Verify the approved price with decision-aligned expectations; none exist yet.
## Blockers
- Owner must choose 1500 or 1800 cents before implementation or acceptance.
