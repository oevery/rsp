---
kind: fix
---
# Change: value-change

## Proposal
- Outcome: Deliver value 2 for the existing consumer. One acceptance boundary.

## Spec
### MODIFIED
- Export value 2.
### Acceptance
#### Scenario: Value
- GIVEN the prepared module
- WHEN imported
- THEN value is 2

## Design
Change the exported constant. CONTEXT.md already owns the correct contract.
No stable knowledge delta or lasting decision remains to write back.

## Tasks
- [x] Export value 2.

## Verify
### Required
- [x] node tools/check.mjs — executed by fixture setup after preparing the source;
  evidence.json contains the actual output and SHA-256 of relevant inputs.
### Optional
- [ ] Additional environment coverage is outside this bounded delivery.

## Blockers
- none
