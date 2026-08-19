---
kind: "feature"
---

# Change: add-greeting-format

## Proposal
- Outcome: Normalize human names at the greeting boundary and reject missing names.
- Scope: Update the greeting formatter and its observable tests.
- Non-goals: Localization, persistence, and remote delivery.

## Spec
### MODIFIED
- Requirement: `formatGreeting(name)` trims surrounding whitespace and returns `Hello, <name>!`.
- Requirement: An empty or whitespace-only name throws `TypeError`.

## Design
- Normalize and validate at the exported function boundary before formatting.

## Tasks
- [ ] Implement trimmed-name formatting and empty-name rejection.
- [ ] Cover both observable behaviors with focused tests.

## Verify
- Automated:
  - [ ] `npm test` — proves formatting, normalization, and rejection behavior.
- Coverage:
  - Localization and remote delivery are outside this Change.

## Blockers
- none
