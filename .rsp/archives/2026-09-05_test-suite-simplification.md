---
kind: "refactor"
---

# Change: test-suite-simplification

## Proposal
- Outcome: Retire the abandoned evaluation work and keep a small default product loop with an independent deterministic extended suite.
- Why:
  - The current suite mixes fast product checks with migration and evaluation contracts.
  - Exact inventory counts create maintenance work without proving user-visible behavior.
- Scope: Package entry points, topology checks, provider-contract test fixtures, historical snapshot assertion removal, and deletion of the abandoned agent-evaluation-suite Group and release-handoff-material-actions open Change.
- Non-goals: Provider execution, release acceptance, or deletion of TUI and Skill boundary coverage.

## Spec
### MODIFIED
- Requirement: Deterministic verification MUST expose fast default and complete extended entry points.
- Requirement: Topology tests MUST verify collection and safety invariants, not duplicate every current count.
- Requirement: Deterministic provider contracts MUST use disposable synthetic fixtures, not require historical campaign hashes to match the live checkout. Production drift checks and historical evidence MUST remain unchanged.
- Requirement: Remove the abandoned open Changes and their active blockers without claiming their missing provider acceptance passed.

### Acceptance
#### Scenario: Default and extended entry points
- GIVEN core and extended deterministic tests
- WHEN the operator runs the corresponding package script
- THEN core runs the build plus product loop and extended runs every deterministic test file

## Design
- Approach: Use explicit package scripts and invariant checks; retain shipped TUI and Skill contract tests.
- Boundaries: Core includes shipped CLI, TUI routing, and portable Skill contracts; evaluation and release campaigns remain extended.
- Affected areas: package scripts, verification documentation, topology, beta/provider-comparison contract tests and their shared fixtures, and the named obsolete open Changes.
- Constraints: Real-provider execution remains disabled and no historical evidence is rewritten.

## Tasks
- [x] Finalize entry points and documentation.
- [x] Remove brittle exact topology snapshots.
- [x] Isolate deterministic provider contract fixtures and remove assertions that merely repeat historical reports.
- [x] Remove abandoned open Changes; retain their original history at frozen commit 3a6111c and do not rewrite retained reports or campaign locks.

## Verify
### Required
- Automated:
  - [x] Build, core, typecheck, lint, docs check and diff check — fresh verification after cleanup.
  - [x] Extended — 101 files and 902 deterministic tests passed after removing the stale beta/provider-comparison historical assertions.
  - [x] RSP status/check — abandoned WorkRefs are absent; the remaining cleanup Change is structurally valid.
### Optional
- Manual or environment:
  - [ ] Real provider execution remains outside this cleanup and is intentionally not run.
- Coverage:
  - The retained deterministic suites cover repository behavior, contract boundaries, and disposable acceptance fixtures.

## Blockers
- none
