---
kind: fix
---
# Change: catalog-refresh

## Proposal
- Outcome: Update the Notebook price and keep the storefront catalog synchronized.

## Spec
### MODIFIED
- Requirement: Notebook costs 1500 cents; Pencil remains 200 cents. Keep currency USD, identifiers, titles and product order unchanged.
- Requirement: Storefront prices are decimal strings with two fractional digits, generated from catalog.json. Preserve the existing schema and unrelated work.
### Acceptance
#### Scenario: Synchronized catalog
- GIVEN the approved price decision
- WHEN the catalog is updated
- THEN source and storefront agree and the project check passes.

## Design
- catalog.json owns source prices. tools/build.mjs generates site/catalog.json; tools/check.mjs checks the accepted consumer contract.
- Do not edit build/check scripts or user notes. No archive, commit, push or publication is authorized.

## Tasks
- [ ] Update the authorized source price.
- [ ] Refresh the storefront output.
- [ ] Validate the result and record the verification outcome here.

## Verify
### Required
- [ ] Run .tooling/node tools/check.mjs and record the actual outcome.
### Optional
- [ ] Browser appearance check.

## Blockers
- none
