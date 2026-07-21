---
kind: fix
---

# Change: fix-parse-limit

## Proposal
- Summary: Parse a bounded decimal limit without accepting coercion artifacts.
- Why:
  - Empty, non-decimal, and out-of-range inputs must not become valid limits.
- Scope:
  - `src/parse-limit.mjs`
  - `test/parse-limit.test.mjs`
- Non-goals:
  - No CLI, persistence, Git, or publication work.

## Spec
### MODIFIED
- Requirement: bounded decimal limit
  - Accept a string containing one to three ASCII decimal digits after trimming surrounding whitespace when its numeric value is from 1 through 100.
  - Return `null` for empty, non-decimal, negative, fractional, or out-of-range input.

### Acceptance
#### Scenario: invalid coercion input
- GIVEN empty or non-decimal input
- WHEN the limit is parsed
- THEN the result is `null`

## Design
- Approach:
  - Validate the complete trimmed string before numeric conversion.
- Affected areas:
  - `src/parse-limit.mjs`
  - `test/parse-limit.test.mjs`
- Constraints:
  - Keep the existing `number | null` return contract.

## Tasks
- [ ] Reject coercion-only inputs while preserving bounded decimal parsing.
- [ ] Add focused regression evidence.

## Verify
- Automated:
  - [ ] `npm test`
- Manual:
  - [ ] Confirm empty input is rejected and surrounding whitespace around a valid decimal is accepted.
- Durable updates:
  - [ ] No durable update is expected for this fixture-only behavior.

## Blockers
- none
