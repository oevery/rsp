---
kind: "feature"
---

# Change: agent-artifact-hygiene/downstream-test-value

## Proposal
- Outcome: Demonstrate and improve how agents using installed RSP choose permanent tests in downstream repositories, reducing narrow and low-value coverage without losing independent production confidence.
- Why:
  - Existing Skills contain test-admission rules, but prior candidate evidence used only three small cases where current and candidate behavior both passed, so no real downstream improvement has been demonstrated.
- Scope:
  - Extend the real-project-derived restraint suite with unseen business-repository cases that pressure touched-file, wrapper-hop, shared-constant, source-string, imagined-state, and duplicate-test behavior; compare current and candidate before any Skill revision.
- Non-goals:
  - Minimizing test count, imposing coverage quotas, mandatory TDD, repository-wide mutation testing, deleting tests with independent consequences, or changing downstream product contracts to satisfy tests.

## Spec
### ADDED
- Requirement: Every retained permanent test identifies a reachable production seam, observable consequence, distinct plausible regression, missing existing evidence, and proportionate maintenance cost.
  - A test may be a temporary diagnostic or RED probe without becoming a permanent artifact.
- Requirement: Evaluation distinguishes overtesting from correct multiple-test retention.
  - It rejects file-corresponding, forwarding-hop, shared-constant, source-string, test-only-consumer, and unreachable-state tests while retaining tests that protect independent user-visible or side-effect consequences.
- Requirement: Published Skill prose changes only when baseline provider behavior fails the frozen acceptance contract and the candidate fixes that failure without regression.
  - If current behavior passes, retain the current Skills and land only evaluation coverage or a documented no-change result.

### Acceptance
#### Scenario: Small downstream fix does not accumulate narrow tests
- GIVEN an existing broader behavior test or static owner already protects the changed risk
- WHEN an agent implements a small downstream fix under installed RSP
- THEN it reuses the decisive evidence and does not add tests for each touched file, wrapper, forwarding hop, branch, or shared constant

#### Scenario: Independent consequences remain protected
- GIVEN two nearby tests exercise the same branch but one protects user-visible behavior and the other protects a production side effect
- WHEN the agent simplifies or reviews the change
- THEN both tests remain and the result does not treat fewer tests as inherently better

## Design
- Approach:
  - Reuse `evaluation/skill-restraint-eval` and its hash-bound adjudication schema; add independently reimplemented real cases and current-versus-candidate provider runs only after deterministic fixture validation.
- Boundaries:
  - Evaluation fixtures own expected changed paths and failure reasons; `rsp-implement`, `rsp-tdd`, and `rsp-review` remain the only possible runtime owners.
- Affected areas:
  - `evaluation/skill-restraint-eval/`, `scripts/skill-restraint-eval.mjs`, and focused tests
  - Existing published Skill sources only when comparison evidence selects a bounded delta
- Constraints:
  - Keep fixtures synthetic and independently rewritten from real project patterns; never include proprietary code, credentials, or raw session logs.

## Tasks
- [x] Define a fixed case matrix and acceptance taxonomy for low-value and independently valuable tests.
- [x] Add deterministic real-project-derived fixtures and scorer coverage.
- [x] Run current installed composition on unseen cases and classify actual misses.
- [x] Compare the independently changed final-surface candidate on the identical cases and confirm no test-selection regression; no test-value Skill delta was justified.
- [x] Retain the evaluation-only result and leave the current implementation, TDD, and review test-value wording unchanged.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/skill-restraint-eval.test.ts` — passed 1 file / 9 tests; proves the six-case taxonomy, fixture provenance, containment, expected paths, independent consequences, and hash-bound adjudication.
  - [x] Fresh current-versus-candidate workers on `shared-channel-forwarding-tests` and `imagined-state-fallback` — both identities passed task, boundary, and test-value acceptance; `research/evaluations/rsp-skill-restraint/2026-08-23-downstream-test-value/report.md` records the bounded comparison and excluded invalid diagnostic.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed build, lint, 87 test files, and 858 tests; proves the expanded evaluation remains repository-compatible.
  - [x] `git diff --check` — passed; proves changed artifacts are syntactically clean.
### Optional
- Manual or environment:
  - [ ] Broader provider or host matrix after candidate selection; omitted for an evaluation-only result.
- Coverage:
  - Two fresh worker comparisons and six deterministic categories do not establish universal test quality and do not replace project-specific acceptance.

## Blockers
- none

## Durable Decisions
- Keep the six-category fixture taxonomy as evaluation evidence: speculative wrapper, duplicate forwarding, independent consequences, shared-constant forwarding, source-string, and imagined state.
- Retain current `rsp-implement`, `rsp-tdd`, and `rsp-review` permanent-test wording because fresh workers passed the new shared-channel and imagined-state pressure cases; evaluation breadth improved without an unsupported runtime prose delta.
