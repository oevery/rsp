---
kind: "research"
---

# Change: 3-0-skill-readiness/validate-assisted-engineering-loop

## Proposal
- Summary: Validate the tightened RSP 3.0 assisted engineering loop with eight repeatable, host-neutral scenarios after the routing and review-resolution slices land.
- Why:
  - The previous composition run proved the four-Skill manual happy path, but did not prove deterministic failure routing, review disposition and correction, or context recovery.
  - Release readiness needs a compact regression gate that distinguishes declared portable contracts from a real-host behavior holdout.
- Scope:
  - Add fixture-driven contract scenarios for shaping, ordinary implementation, diagnosis/TDD selection and fallback, review fix/re-review, handoff recovery, and authority restraint.
  - Record a truthful assisted-loop decision after both prerequisite capability Changes are archived.
- Non-goals:
  - Do not implement or revise canonical Skills in this Change.
  - Do not build a Managed Controller, persistent run state, provider matrix, or host-specific adapter.
  - Do not treat deterministic text-contract checks as evidence of real-model task quality.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: assisted-loop scenario gate
  - A committed host-neutral harness must exercise exactly eight representative scenarios spanning shaping, ordinary implementation, unexplained-failure diagnosis, test-first selection, missing-capability fallback, review correction and re-review, handoff recovery, and prohibited-action restraint.
  - Every scenario must name its evidence, expected one next action, returned owner, source contract, and prohibited actions.
  - The deterministic gate must fail when a required portable contract is missing and must not require a model, provider, network, proprietary host tool, or mutable repository state.
- Requirement: truthful release decision
  - The evaluation report must separate deterministic contract coverage from real-host behavior evidence and must not recommend resuming release until both prerequisite Changes are archived and all declared gates pass.

### Acceptance
#### Scenario: complete assisted loop is release-gated
- GIVEN the diagnosis/TDD routing and review-resolution/handoff Changes are archived
- WHEN the eight fixture scenarios and one bounded real-host holdout are evaluated against the installed suite
- THEN the report records each result, retained external boundaries, cost and coverage limitations, and one supported release recommendation

#### Scenario: prerequisite behavior is incomplete
- GIVEN either prerequisite Change is still open or a required contract is absent
- WHEN the deterministic gate runs
- THEN it reports the missing scenario contract and this Change remains incomplete without claiming 3.0 readiness

## Design
- Approach:
  - Store declarative YAML cases under `test/assisted-loop/fixtures/` and evaluate them with a small generic loader/checker.
  - Keep fixtures behavioral: they describe observable evidence, one next action, returned owner, allowed contract sources, and authority boundaries rather than fixed response prose.
  - Run the deterministic suite first; after prerequisites archive, run one bounded installed-package host holdout and retain its exact environment, hashes, outputs, and limitations in the evaluation report.
- Affected areas:
  - `test/assisted-loop/fixtures/`
  - `scripts/assisted-loop-eval.mjs`
  - `test/assisted-loop.test.ts`
  - `research/evaluations/rsp-assisted-loop/2026-07-21/report.md`
- Constraints:
  - Canonical Skill sources remain owned by the sibling capability Changes.
  - Fixture evaluation is read-only and source paths must remain inside published `skills/` packages.
  - No scenario may grant commit, push, publish, deploy, approval, deletion, or archive authority.

## Tasks
- [x] Finalize the proposal, spec, design, and exact prerequisite edges
- [x] Add and pass the eight fixture-driven deterministic assisted-loop scenarios
- [x] After both prerequisites archive, run and retain one bounded installed-package real-host holdout
- [x] Record the supported 3.0 recommendation and retained deferred boundaries
- [x] Verify the result and update required durable models/specs

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/assisted-loop.test.ts` (2/2 passed; eight fixtures covered)
  - [x] `mise exec -- pnpm run build` (passed)
  - [x] `mise exec -- pnpm run lint` (passed)
  - [x] `mise exec -- pnpm run test` (14 files, 276 tests passed)
- Manual:
  - [x] Inspected the installed-package holdout output; report separates deterministic coverage, three-turn real-host evidence, omissions, authority restraint, and the release recommendation
- Durable updates:
  - [x] Decided that the shipped five-Skill suite and assisted-loop boundaries are durable current product facts
  - [x] Updated `.rsp/specs/design.md` and reconciled `research/models/rsp-skill-system.md` plus `research/models/rsp-capability-coverage.md`; no scoped `AGENTS.md` change or Decision Record is needed

## Blockers
- requires `3-0-skill-readiness/integrate-diagnosis-tdd-routing`: final scenarios must evaluate the shipped routing and fallback contract, not a speculative fixture-only contract
- requires `3-0-skill-readiness/close-review-resolution-handoff`: final scenarios must evaluate the shipped disposition, re-review, and recovery contract, not a speculative fixture-only contract
