---
kind: fix
---

# Change: fix-empty-mode

## Proposal
- Summary: Treat an empty application-mode setting as absent configuration.
- Why:
  - An empty deployed setting currently causes focused verification to fail, but the owning layer and cause have not been established.
- Scope:
  - `src/normalize-mode.mjs`
  - `test/normalize-mode.test.mjs`
- Non-goals:
  - No production correction, TDD, Git, or publication work during diagnosis.

## Spec
### MODIFIED
- Requirement: application mode normalization
  - Normalize an explicit non-empty mode by trimming and lowercasing it.
  - Use `safe` when the setting is absent, empty, or whitespace-only.

### Acceptance
#### Scenario: empty deployed setting
- GIVEN an empty application-mode setting
- WHEN the setting is normalized
- THEN the result is `safe`

## Design
- Approach:
  - Diagnose the current failure before selecting a correction.
- Affected areas:
  - configuration input and mode normalization
- Constraints:
  - Preserve explicit non-empty mode normalization.

## Tasks
- [ ] Confirm the cause and affected owner without production mutation.

## Verify
- Automated:
  - [ ] `npm test`
- Manual:
  - [ ] Record the smallest discriminating check and its observed result.
- Durable updates:
  - [ ] No durable update is expected for this fixture-only behavior.

## Blockers
- none
