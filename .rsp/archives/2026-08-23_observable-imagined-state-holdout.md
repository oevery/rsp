---
kind: "fix"
---

# Change: observable-imagined-state-holdout

## Proposal
- Outcome: Make the imagined-state release holdout accept equivalent observable ready-record timestamp implementations instead of requiring one variable name and object literal form.
- Why:
  - A Sunday, 2026-08-23 provider run correctly injected a clock, persisted its value as `savedAt`, extended the existing production-path test, and avoided unreachable-state handling, but the holdout failed because it required the source substring `savedAt: now`.
- Scope:
  - Replace the implementation-detail requirement with production and existing-test signals that compose with the scenario's successful `npm test` result.
- Non-goals:
  - Weakening the missing-status prohibitions, accepting an added narrow test file, or changing campaign run counts and provider policy.

## Spec
### MODIFIED
- Requirement: The holdout recognizes equivalent timestamp implementations by their observable production path and passing existing test rather than a fixed local identifier.
  - Production must write `savedAt`; the existing test must exercise `produceReady` through `saveReady` and assert the timestamp field.

### Acceptance
#### Scenario: Injected clock implementation
- GIVEN production emits only ready records and `saveReady(record, clock)` persists `clock()` as `savedAt`
- WHEN the existing `test.mjs` validates a produced ready record and `npm test` passes
- THEN the behavior dimension passes while missing-status fallback code and a new missing-status test remain forbidden

## Design
- Approach:
  - Require `savedAt` in `src/save.mjs` and the stable `produceReady(`, `saveReady(`, and `savedAt` signals in `test.mjs`.
- Boundaries:
  - Runtime verification remains owned by `npm test`; source surfaces enforce only composition and negative boundaries.
- Affected areas:
  - `evaluation/managed-controller/holdout/release-imagined-state-restraint/case.yaml`
  - `test/release/release-behavior-acceptance.test.ts`
- Constraints:
  - Preserve exact candidate Skill composition and all other scenario contracts.

## Tasks
- [x] Replace the narrow source-string gate with observable production/test signals.
- [x] Add deterministic manifest coverage and complete local harness verification.

## Verify
### Required
- Automated:
  - [x] Focused release behavior tests — 14 tests passed after the new manifest assertion first failed against `savedAt: now`.
  - [x] Repository lint and tests — lint passed; 88 test files and 873 tests passed.
### Optional
- Manual or environment:
  - [ ] `imagined-state-test-restraint` provider rerun.
- Coverage:
  - The retained failed report is diagnostic evidence; only a fresh report against the revised contract can satisfy provider acceptance.

## Blockers
- none

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: The release holdout manifest and deterministic test own this evaluator boundary.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none
- Archive ready: yes
