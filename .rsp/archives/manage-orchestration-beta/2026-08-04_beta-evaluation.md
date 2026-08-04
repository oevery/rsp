---
kind: "research"
---

# Change: manage-orchestration-beta/beta-evaluation

## Proposal
- Outcome: Extend the existing managed-controller contract suite and evaluation harness with deterministic safety fixtures plus one immutable beta holdout that records evidence against a direct baseline without making observed cost a release-authority gate.
- Why:
  - The routing and execution changes are architectural: behavior and authority constraints must be made regression-resistant before empirical beta observations are interpreted.
  - A small holdout can expose omissions and operational cost, but it cannot justify automatic promotion, broaden authority, or establish a universal routing threshold.
- Scope:
  - Extend `test/managed-controller/**`, `test/managed-controller-contract.test.ts`, and `scripts/managed-controller-eval.mjs` rather than replacing them.
  - Add deterministic fixtures for Intake activation/outcomes, specialist bypasses, frontier stops, lane isolation, single writer, corrective retry, review convergence, and absence of durable controller artifacts.
  - Define one immutable beta holdout and a direct baseline comparison that records aggregate outcome, worker count, token/time cost where observable, verification rounds, and human intervention.
- Non-goals:
  - Do not create an evaluation-driven automatic promotion, a numeric acceptance score, a provider matrix, a public benchmark promise, or beta publication.
  - Do not alter product behavior solely to improve evaluation metrics or treat passing fixtures as proof of real-host/general-provider safety.

## Spec
### ADDED
- Requirement: deterministic fixtures are hard compatibility gates
  - The existing managed-controller test suite gains focused fixtures covering `explicit` and `auto` activation, tiny/direct and specialist bypasses, all four Intake outcomes, Shape requalification, frontier precedence, evidence-only lanes, owner/fog/out-of-goal stops, one-writer mutation, independent Verify, worker/retry/review caps, and no persistent controller state.
  - Fixtures assert observable routing, authority, durable artifact, and fallback behavior. They do not require a particular internal implementation beyond the declared contracts.
- Requirement: beta evidence is bounded and immutable
  - A selected immutable holdout and its direct baseline are identified before the beta run. The evaluation records decisive aggregate facts and omissions without copying runtime chronology into a Change, Group Brief, Spec, or Decision Record.
  - The holdout reports only observed values: completion/outcome, first-fix result when applicable, worker dispatch count, verification rounds, elapsed/token cost where available, and human-intervention outcome.
  - Missing capability, unavailable environment, or incomplete observation is recorded as a bounded omission and does not silently become a passing result.
- Requirement: empirical evidence does not grant promotion authority
  - Fixture success and beta observations inform a later owner decision only. They do not modify `manage.activation`, create a release, archive work, commit, publish, or establish a stable Decision Record.

### Acceptance
#### Scenario: a regression cannot hide behind a successful holdout
- GIVEN a beta holdout succeeds but a deterministic routing, authority, or fallback fixture fails
- WHEN the evaluation is assessed
- THEN the fixture failure remains the decisive blocker and no beta conclusion claims the architectural contract is validated

#### Scenario: baseline comparison remains evidence rather than policy
- GIVEN the immutable holdout reports different cost or outcome values for direct and managed routes
- WHEN the evaluation report is produced
- THEN it records observed aggregates and omissions without deriving a numeric promotion threshold, activation change, release action, or automatic rollout decision

#### Scenario: unavailable evidence is truthful
- GIVEN a required environment, worker capability, or measurement is unavailable
- WHEN the bounded evaluation runs
- THEN it records the missing observation, preserves deterministic fixture results separately, and stops any conclusion that requires the unavailable evidence

## Design
- Approach:
  - Treat deterministic fixtures as the contract gate and the holdout as a deliberately limited observation layer.
  - Reuse the existing managed-controller harness and report shape. Keep holdout identity and raw operational process outside durable controller state; retain only decisive aggregate evidence and explicit omissions in the selected evaluation artifact.
  - Compare the new route to the current direct baseline on the same immutable cases, with no optimization feedback loop during the run.
- Boundaries:
  - Tests and evaluation harness own executable evidence. Routing and frontier Changes own implementation. Core/Manage retain authority behavior; this Change must not introduce policy or architecture outside evidence needs.
  - A future promotion or stable architectural rationale is a separate owner decision and, if accepted, may create a Decision Record; beta evaluation itself creates none.
- Affected areas:
  - `test/managed-controller-contract.test.ts`, `test/managed-controller/**`, and `scripts/managed-controller-eval.mjs`
  - Existing evaluation evidence location under `research/evaluations/` only if current repository conventions require a retained immutable result
- Constraints:
  - Preserve current tests and harness entrypoints; extend rather than replace them.
  - No secrets, provider/session details, or hidden runtime identifiers enter committed fixtures or retained evaluation evidence.
  - Do not claim statistical generality from one holdout; the final report must state omissions, coverage boundaries, and unobserved measurements.

## Tasks
- [x] Map current managed-controller fixtures and harness outputs to the Intake and execution contracts; add only missing observable cases.
- [x] Add deterministic fixtures for route exceptions, four Intake returns, Shape requalification, frontier stop precedence, lane isolation, mutation/verification boundaries, ceilings, and no durable controller state.
- [x] Define the immutable beta holdout and direct baseline before running either route; execute the bounded comparison and record decisive aggregates plus omissions.
- [x] Run focused contracts, package validation, and fallback synchronization; prepare a concise beta evidence report without promotion or release action.

## Verify
- Automated:
  - [x] `node scripts/managed-controller-eval.mjs contract`, `node scripts/managed-controller-beta.mjs contract`, and focused managed-controller tests — 17/17 deterministic fixtures and 51 focused tests passed; proves route/authority coverage, fail-closed multi-source fixture loading, and hash-locked beta planning.
  - [x] `mise exec -- pnpm run build`, `node dist/cli.mjs update`, fallback byte comparison, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test`, and `git diff --check` — build/update/lint/diff passed and all 55 files / 642 tests passed.
- Manual or environment:
  - [x] The hash-locked `pause-resume` baseline/product holdout was started on August 4, 2026. Baseline model execution became unavailable before any tool call or final response, so product was not repeated against the same unavailable capability; the sanitized aggregate records the incomplete comparison and omissions under `research/evaluations/rsp-manage/2026-08-04-manage-orchestration-beta/`.
- Coverage:
  - Does not prove provider independence, real-host reliability, automatic release safety, universal cost thresholds, or authorization to promote from beta.

## Blockers
- requires `manage-orchestration-beta/managed-intake-routing`: Beta routing fixtures require the Intake contract and requalification path.
- requires `manage-orchestration-beta/evidence-frontier-execution`: Beta frontier fixtures and holdout require the bounded lane and receipt contract.
