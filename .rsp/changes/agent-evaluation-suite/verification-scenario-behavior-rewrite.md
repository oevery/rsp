---
kind: "refactor"
---

# Change: agent-evaluation-suite/verification-scenario-behavior-rewrite

## Proposal
- Outcome: Replace generic count-based evaluation matrices with scenario-owned behavioral cases that exercise distinct Skill, Core routing, worker, recovery, artifact, and project boundaries.
- Why:
  - The current 65 Skill cases are a 13 by 5 template expansion with identical required events and generic goals.
  - Routing and worker cases also predeclare the expected host observations, so coverage cardinality is stronger than behavioral discrimination.
- Scope:
  - Define per-owner manifests with positive, near-miss, negative, authority, artifact/handoff, and recovery cases.
  - Rewrite Skill, Core routing, worker, and project evaluation tests to assert observable consequences and independent oracle outcomes.
  - Keep portable/package contract tests separate from behavior execution tests.
- Non-goals:
  - Do not delete valid unit, CLI, integration, release, or packaging tests merely to reduce test count.
  - Do not run a real provider or change Skill/product semantics as part of test restructuring.

## Spec
### MODIFIED
- Requirement: Every required Skill evaluation MUST contain owner-specific trigger, authority, boundary, artifact/handoff, and recovery expectations.
  - A shared case kind may define shape, but its inputs, expected consequence, and oracle MUST be independently declared per owner where behavior differs.
- Requirement: Routing and worker scenarios MUST observe the actual selected owner, stop reason, dispatch, lifecycle, serialization, and recovery outcome.
  - A test MUST fail when the implementation returns the wrong owner or performs an unauthorized transition even if the generic event count is correct.
- Requirement: Fixture existence and scenario count MUST NOT be accepted as behavioral verification.

### Acceptance
#### Scenario: A Skill near-miss does not trigger the Skill
- GIVEN an owner-specific near-miss prompt and competing Skill context
- WHEN the actual local routing/execution adapter handles the request
- THEN the expected owner remains unselected, the stop or alternate route is observed, and the case is not passed from fixture presence alone

#### Scenario: A boundary violation is detected
- GIVEN a fixture that attempts unauthorized mutation, Git delivery, publication, or acceptance claim
- WHEN the target executes
- THEN the host oracle records the violation and fails the case independently of the final prose

#### Scenario: Recovery preserves the selected owner and evidence
- GIVEN an interrupted or unavailable phase with a declared resume rule
- WHEN the run resumes through the supported local boundary
- THEN ownership, changed paths, evidence delta, and final handoff match the case oracle

## Design
- Approach:
  - Create scenario manifests as the source of truth and use shared harness adapters only for execution and evidence normalization.
  - Keep contract/static tests for package shape; move semantic behavior assertions to actual entry-point and disposable-fixture runs.
- Boundaries:
  - Scenario authors define intent and expected observable consequences; deterministic oracles judge host evidence; AI analysis remains advisory.
  - The test suite does not invent worker receipts or promote simulated traces to acceptance.
- Affected areas:
  - verification/evaluations scenario manifests and fixtures.
  - verification/tests/evaluation/* and agent-evaluation-campaigns.mjs.
- Constraints:
  - Keep each permanent case tied to one distinct regression and a real owner boundary.
  - Preserve fake/local-only execution and sanitized evidence.

## Tasks
- [x] Inventory existing cases by observable consequence and remove duplicate template-only assertions.
- [x] Define 39 per-Skill owner-specific cases plus routing, worker, and project manifests.
- [x] Rewrite routing and worker scenario tests against observed execution receipts.
- [x] Keep project categories tied to the declared disposable acceptance command; plan-only inspection remains unverified.
- [x] Retain package/static contract tests as a separate evidence class.
- [x] Record final scenario coverage and omissions in this Change.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/skill-real-evaluation.test.ts verification/tests/evaluation/rsp-routing-evaluation.test.ts verification/tests/evaluation/worker-routing-evaluation.test.ts verification/tests/evaluation/project-acceptance-evaluation.test.ts verification/tests/evaluation/verification-scenario-behavior-rewrite.test.ts --no-file-parallelism — passed; owner-specific inputs execute and semantic/runtime gaps stay unverified.
  - [x] mise exec -- pnpm run verify:evaluate — executed; exit 1 is expected because 55 required semantic/routing/worker cases are explicitly unverified, with zero command errors.
  - [x] git diff --check — passed.
### Optional
- Manual or environment:
  - [x] No manual or environment-only check is required for this local-only Change.
- Coverage:
  - Real provider behavior and production host worker lifecycle remain outside this Change.

## Blockers
- no local agent/provider runtime or host worker adapter is available; package/fixture receipts do not satisfy semantic Skill, Core routing, or worker lifecycle verification.
