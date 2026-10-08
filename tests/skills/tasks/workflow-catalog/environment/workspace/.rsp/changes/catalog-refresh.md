---
kind: fix
---
# Change: catalog-refresh
## Proposal
Synchronize the approved Notebook price with the storefront.
## Spec
Notebook is 1500 cents, Pencil is 200 cents, currency USD. Keep identifiers, titles and order. Storefront prices are two-place decimal strings.
## Design
catalog.json owns source prices; tools/build.mjs generates site/catalog.json. Preserve the staged source bytes and index. Only storefront and this Change Tasks/Verify may change.
## Tasks
- [x] Set approved source price (already staged).
- [ ] Generate storefront.
- [ ] Verify synchronized output.
## Verify
### Required
- [ ] node tools/check.mjs
### Optional
- [ ] Browser appearance check.
## Blockers
- none
