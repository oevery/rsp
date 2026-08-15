---
kind: "fix"
---

# Change: fix-managed-controller-fixture-lifecycle

## Proposal
- Outcome: Keep deterministic managed-controller contract fixtures valid after their originating Change is archived.
- Why:
  - `host-capability-downgrade.yaml` names an open Change as a contract source, so archiving that Change makes the repository-wide suite fail before the durable product contract is evaluated.
  - Contract fixtures must depend on current Specs and authored Skills rather than lifecycle-transient planning artifacts.
- Scope:
  - Move the two host-capability assertions used only from the archived Change into the current Skill Control Model.
  - Remove the fixture's dependency on `.rsp/changes/refine-managed-execution-recovery-model.md`.
  - Reject future deterministic fixture sources under `.rsp/changes/` and cover that boundary with a regression test.
- Non-goals:
  - Do not change managed execution behavior, routing, authority, or host integration.
  - Do not rewrite historical archives or alter upstream research, acceptance state, Git history, or publication state.

## Spec
### MODIFIED
- Requirement: deterministic managed-controller fixtures use durable contract owners
  - Fixture sources may use current Specs, authored Skills, and other stable repository artifacts, but not open Change files whose paths disappear at archive.
  - Host-neutral capability downgrade rules remain explicit in the current Skill Control Model.

### Acceptance
#### Scenario: a source Change is archived
- GIVEN a deterministic fixture verifies behavior first introduced by an RSP Change
- WHEN that Change is archived and removed from `.rsp/changes/`
- THEN the fixture continues to load and evaluate the same contract from durable current owners

#### Scenario: a fixture names an open Change
- GIVEN a deterministic fixture source points under `.rsp/changes/`
- WHEN the controller contract loader validates the fixture
- THEN loading fails closed with a lifecycle-source error before evaluation

## Design
- Approach:
  - Add the missing host-neutral capability rule beside the existing managed worker and capability requirements in `.rsp/specs/skill-control-model.md`.
  - Remove the transient source from `host-capability-downgrade.yaml`.
  - Enforce the source-lifecycle boundary in `contractSources` and test it with an isolated temporary fixture tree.
- Boundaries:
  - Preserve existing path containment, regular-file, duplicate-source, and source-content checks.
  - Keep archived Changes as history rather than executable product contract dependencies.
- Affected areas:
  - `.rsp/specs/skill-control-model.md`
  - `scripts/managed-controller-eval.mjs`
  - `test/managed-controller/fixtures/host-capability-downgrade.yaml`
  - `test/managed-controller-contract.test.ts`
- Constraints:
  - Preserve the unrelated dirty upstream-research worktree.
  - Do not edit product Skill wording unless verification proves the current durable owners remain insufficient.

## Tasks
- [x] Move the host-capability downgrade contract into the current Skill Control Model and remove the fixture's transient Change source.
- [x] Reject `.rsp/changes/` fixture sources and add a focused regression test.
- [x] Run focused controller contracts and the repository build, lint, and full test suite.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts` — passed 2 files / 74 tests; proves: deterministic fixtures load after archive, transient Change sources fail closed, and the beta composition remains valid.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed; the complete suite passed 71 files / 781 tests, proving package output, static checks, and repository regression remain valid.
### Optional
- Manual or environment:
  - [x] None; this is a deterministic local contract boundary.
- Coverage:
  - Covers current fixture loading and archive-safe source ownership; does not change or validate external host lifecycle APIs.

## Blockers
- none
