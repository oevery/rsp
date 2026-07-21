---
kind: feature
---

# Change: compact-truncated-label

## Proposal
- Summary: Make truncated labels visibly distinct within the existing width limit.
- Why:
  - Silent truncation makes shortened labels indistinguishable from complete labels.
- Scope:
  - `src/compact-label.mjs`
  - `test/compact-label.test.mjs`
- Non-goals:
  - No Unicode display-width engine, review, Git, or publication work.

## Spec
### MODIFIED
- Requirement: compact label
  - Preserve a label whose length is within the limit.
  - For a longer label, return a string whose total length equals the limit and whose final character is `…`.

### Acceptance
#### Scenario: long label is visibly truncated
- GIVEN `abcdefghij` and a limit of `8`
- WHEN the label is compacted
- THEN the result is `abcdefg…`

## Design
- Approach:
  - Establish the missing behavior with one focused failing test before production mutation.
- Affected areas:
  - label compaction and its focused test
- Constraints:
  - Keep the public function signature and preserve short labels.

## Tasks
- [ ] Add focused red-green-refactor evidence for visible truncation.

## Verify
- Automated:
  - [ ] `npm test`
- Manual:
  - [ ] Confirm the final result stays within the requested limit.
- Durable updates:
  - [ ] No durable update is expected for this fixture-only behavior.

## Blockers
- none
