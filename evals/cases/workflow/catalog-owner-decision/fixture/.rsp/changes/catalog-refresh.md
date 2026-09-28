---
kind: fix
---
# Change: catalog-refresh

## Proposal
- Outcome: Update the Notebook price and keep the storefront catalog synchronized.

## Spec
### MODIFIED
- Requirement: Notebook pricing awaits the owner choice between 1500 and 1800 cents. No price change is authorized until that decision.
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
- The implementation and verification tasks below are pending owner authorization. Until the price decision is resolved, leave all files and the index unchanged; report any read-only observations and the owner question in the response only.
- [ ] Update the authorized source price.
- [ ] Refresh the storefront output.
- [ ] Validate the result and record the verification outcome here.

## Verify
### Required
- [ ] Run .tooling/node tools/check.mjs and record the actual outcome.
### Optional
- [ ] Browser appearance check.

## Blockers
- Owner decision required: choose the Notebook price (1500 or 1800 cents) before changing source or generated files.
