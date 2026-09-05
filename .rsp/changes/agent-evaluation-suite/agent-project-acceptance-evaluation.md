---
kind: "feature"
---

# Change: agent-evaluation-suite/agent-project-acceptance-evaluation

## Proposal
- Outcome: Execute the required project-facing acceptance matrix across declared disposable real-project fixtures.
- Why:
  - Package-level or focused tests do not prove that the evaluation workflow works in supported project, worktree, install, and handoff contexts.
- Scope:
  - Define project categories and fixture contracts for repository checkout, package/build, install/upgrade, worktree, generated artifacts, and final handoff.
  - Run the declared project-fixture matrix locally, record environment limitations explicitly, and require verified evidence for every required project category.
- Non-goals:
  - Do not modify downstream projects as part of the evaluator.
  - Do not redefine foundation evidence/scoring or own provider release-gate decisions.

## Spec
### ADDED
- Requirement: Each declared project category MUST have an isolated fixture, setup/teardown boundary, expected artifacts, forbidden mutations, and acceptance handoff.
- Requirement: The project category set MUST be non-empty and cover repository checkout, package/build, install/upgrade, worktree, generated artifacts, and final handoff; each applicable category MUST have at least one declared fixture.
- Requirement: Project acceptance MUST verify package/build/install/worktree contracts at the project boundary, not infer acceptance from unit or type tests alone.
- Requirement: Missing project capability, dependency, or host observation MUST be reported as unavailable or unverified with the affected fixture and run key.
- Requirement: Every required project category MUST have at least one executed and verified fixture journey covering its declared package/build/install/worktree/artifact/handoff boundary; skipped or unverified required categories cannot satisfy this Change.

### Acceptance
#### Scenario: Project fixture reaches the intended boundary
- GIVEN a declared project fixture and its setup contract
- WHEN the acceptance journey runs
- THEN the report records checkout, package/build, install, worktree, artifact, and handoff observations for the applicable category

#### Scenario: Forbidden project mutation is detected
- GIVEN a fixture with an allowed mutation boundary
- WHEN the journey writes outside that boundary or leaves generated state inconsistent
- THEN deterministic boundary findings fail the run and AI analysis cannot override them

#### Scenario: Environment limits remain honest
- GIVEN a missing dependency, unavailable host capability, or skipped fixture
- WHEN the project campaign reports results
- THEN it distinguishes unavailable, unverified, skipped, and executed coverage without claiming project acceptance

## Design
- Approach:
  - Use explicit project adapters and disposable fixture roots, with host evidence for setup, commands, paths, artifacts, and final handoff.
  - Reuse existing repository/project acceptance helpers where they expose observable contracts; keep project-specific assertions in this child.
- Boundaries:
  - This Change owns project fixture definitions and acceptance assertions; it does not own downstream product changes or release approval.
- Affected areas:
  - verification/evaluations/project-acceptance/; verification/acceptance project fixture manifests; and verification/tests/evaluation/project-acceptance-evaluation.test.ts.
- Constraints:
  - No real provider execution is authorized by this Change; preserve external project state and private configuration.

## Tasks
- [x] Define the supported project categories and fixture lifecycle contracts.
- [x] Implement package/build/install/worktree and final-handoff adapters.
- [x] Add mutation-boundary, artifact, dependency-unavailable, and skipped-fixture cases.
- [x] Add project campaign aggregation and evidence-preserving resume behavior.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/project-acceptance-evaluation.test.ts --no-file-parallelism — 2 tests passed; proves six required project categories reach verified local fixture boundaries and reports omissions honestly.
  - [x] mise exec -- pnpm run typecheck — passed; project adapters and reports remain typed.
  - [x] git diff --check — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Review the generated report for every required project category — integrated local report retains all six categories and disposable-fixture boundary.
- Coverage:
  - Provider-specific project behavior and external deployment remain unverified.

## Blockers
- none
