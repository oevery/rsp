---
kind: "feature"
---

# Change: skill-evaluation-observability

## Proposal
- Outcome: Managed Skill candidate evidence reports Trigger, Compliance, Boundary, and task result as independent observations instead of one aggregate pass/fail result.
- Why:
  - Current retained evaluation summaries expose completion, output-contract, worktree, time, and tool-call evidence, but they do not provide a shared attributable schema for routing, procedure, restraint, and task outcome.
  - `research/models/skill-quality-and-governance.md` Q1 identifies this as the first promotion-evaluation candidate after the accepted upstream baseline.
- Scope:
  - Add one deterministic, reusable observability projection for Skill evaluation runs.
  - Apply it to the existing managed-controller beta summary without changing how runs execute or how promotion decisions are made.
  - Preserve unavailable corrections and token measurements explicitly rather than fabricating values.
- Non-goals:
  - Deterministic catalog routing or description-collision tests (Q2).
  - Holdout/no-regression promotion policy (Q3), Skill security scanning (Q4), or capability lookup (Q5).
  - Provider matrices, numeric promotion thresholds, activation, release, push, or publication.

## Spec
### ADDED
- Requirement: Skill evaluation summaries expose attributable dimensions.
  - Each evaluated run records `trigger`, `compliance`, `boundary`, and `task_result` independently.
  - Each dimension records an explicit `passed`, `failed`, or `not-observed` status and the bounded evidence used to derive it.
  - Missing trigger evidence remains `not-observed`; successful task execution must not be treated as proof that routing was observed.
- Requirement: Cost and correction observations remain independent from behavior dimensions.
  - Corrections, tool calls, elapsed time, and input/output/total tokens use stable fields.
  - Unavailable measurements are `null` and produce truthful omissions rather than inferred zeros.
- Requirement: Existing evaluation and authority boundaries remain unchanged.
  - The projection consumes retained run metadata only and does not invoke a provider, edit a Skill, select a candidate, or authorize promotion.

### Acceptance
#### Scenario: Attribute a successful run without inventing routing evidence
- GIVEN a completed run whose required output and worktree boundaries passed but whose Skill invocation was not observed
- WHEN the run is projected into the shared observability schema
- THEN compliance, boundary, and task result are reported independently as passed, trigger is `not-observed`, and available cost measurements are retained

#### Scenario: Preserve unavailable measurements
- GIVEN a run without correction or token observations
- WHEN the run is projected
- THEN those fields are `null`, the omissions name the unavailable evidence, and no zero or success value is fabricated

#### Scenario: Attribute failures to their owning dimension
- GIVEN missing required output, a forbidden output or unauthorized path, or a failed task result
- WHEN the run is projected
- THEN compliance, boundary, and task result fail independently without changing unrelated dimension results

## Design
- Approach:
  - Introduce a small pure projection module under `scripts/` with a stable result schema and fail-closed status derivation.
  - Build the managed-controller beta run summary first, then attach the projection from existing bounded metadata.
  - Keep raw provider identity, prompts, traces, and sensitive content outside the summary.
- Boundaries:
  - The schema is evaluation evidence, not persisted RSP workflow state or a promotion verdict.
  - Trigger is observed only from an explicit trigger observation supplied by a harness; current managed-controller runs therefore report it as unavailable.
  - Compliance derives only from required-output evidence; Boundary derives only from forbidden-output and unauthorized-path evidence; task result derives only from run outcome.
- Affected areas:
  - `scripts/skill-evaluation-observability.mjs`
  - `scripts/managed-controller-beta.mjs`
  - `test/skill-evaluation-observability.test.ts`
  - `test/managed-controller-beta-contract.test.ts`
  - `.rsp/specs/distribution.md`
- Constraints:
  - Independent reimplementation informed by `research/models/skill-quality-and-governance.md` Q1 and its cited source reports.
  - Do not copy Skill-Use-Bench assets or introduce a runtime/package dependency.
  - Keep existing retained evaluation artifacts immutable.

## Tasks
- [x] Add and test the pure Skill evaluation observability projection.
- [x] Integrate the projection into newly generated managed-controller beta summaries.
- [x] Verify focused behavior, type/lint/build compatibility, and project regression coverage.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-evaluation-observability.test.ts test/managed-controller-beta-contract.test.ts` — passed 2 files / 16 tests; proves: independent dimensions, truthful unavailable measurements, explicit trigger evidence, and beta-summary integration.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed; full suite passed 72 files / 785 tests, proving package output, static checks, and repository regression compatibility.
  - [x] `git diff --check` — passed; proves the scoped patch has no whitespace errors.
### Optional
- Manual or environment:
  - [ ] Generate a fresh real-provider beta report — not run; optional because schema behavior is deterministic and provider execution is a separate environment/cost boundary.
- Coverage:
  - Deterministic projection and summary integration are required; broader host/provider evidence remains a release-candidate concern.

## Blockers
- none
