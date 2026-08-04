---
kind: "research"
---

# Change: manage-orchestration-beta/beta-evaluation

## Proposal
- Outcome: Extend the existing managed-controller contract suite and evaluation harness with deterministic safety fixtures plus one immutable beta holdout that records outcome evidence against a direct baseline without turning runtime measurements into dispatch limits or release authority.
- Why:
  - The routing and execution changes are architectural: behavior and authority constraints must be made regression-resistant before empirical beta observations are interpreted.
  - A small holdout can expose omissions and operational behavior, but it cannot justify automatic promotion, broaden authority, or establish a universal routing threshold.
- Scope:
  - Extend `test/managed-controller/**`, `test/managed-controller-contract.test.ts`, and `scripts/managed-controller-eval.mjs` rather than replacing them.
  - Add deterministic fixtures for Intake activation/outcomes, specialist bypasses, frontier stops, lane isolation, single writer, corrective retry, review convergence, and absence of durable controller artifacts.
  - Define one immutable beta holdout and a direct baseline comparison that records aggregate outcome, worker or tool dispatch count where observable, verification rounds, elapsed time, human intervention, and explicit omissions.
  - For the reopened evaluation, lock and retain the exact installed product Skill composition that is evaluated after the canonical control-model changes, and write a new evidence generation without overwriting the prior retained run.
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
  - The reopened product plan records the exact installed Skill names and their aggregate source composition hash before execution. The retained summary repeats that hash so evidence cannot be attributed to a later or different product composition.
  - A reopened run writes a new retained evidence generation. Earlier retained reports and summaries remain unchanged historical evidence.
  - The holdout reports only observed values: completion/outcome, first-fix result when applicable, worker or tool dispatch count, verification rounds, elapsed time, and human-intervention outcome.
  - Token usage and token cost are not part of the beta plan, run summary, retained report, routing model, completion state, or acceptance criteria.
  - Missing capability, unavailable environment, or incomplete observation is recorded as a bounded omission and does not silently become a passing result.
- Requirement: empirical evidence does not grant promotion authority
  - Fixture success and beta observations inform a later owner decision only. They do not modify `manage.activation`, create a release, archive work, commit, publish, or establish a stable Decision Record.

### Acceptance
#### Scenario: a regression cannot hide behind a successful holdout
- GIVEN a beta holdout succeeds but a deterministic routing, authority, or fallback fixture fails
- WHEN the evaluation is assessed
- THEN the fixture failure remains the decisive blocker and no beta conclusion claims the architectural contract is validated

#### Scenario: baseline comparison remains evidence rather than policy
- GIVEN the immutable holdout reports different elapsed time or outcome values for direct and managed routes
- WHEN the evaluation report is produced
- THEN it records observed aggregates and omissions without deriving a numeric promotion threshold, activation change, release action, or automatic rollout decision

#### Scenario: unavailable evidence is truthful
- GIVEN a required environment, worker capability, or measurement is unavailable
- WHEN the bounded evaluation runs
- THEN it records the missing observation, preserves deterministic fixture results separately, and stops any conclusion that requires the unavailable evidence

#### Scenario: an unrun product comparison is incomplete
- GIVEN the baseline run is unavailable or otherwise prevents the product variant from running
- WHEN the beta summary and report are produced
- THEN product remains `not-run` and the comparison remains incomplete; deterministic fixture success cannot mark the product holdout or Group acceptance complete

#### Scenario: retained evidence identifies the evaluated product
- GIVEN the canonical control model changes Core and Manage after the earlier beta run
- WHEN the reopened baseline/product evaluation is retained
- THEN the plan and summary identify the exact installed product Skill composition hash, report the current deterministic fixture count, and preserve the earlier evidence generation unchanged

## Design
- Approach:
  - Treat deterministic fixtures as the contract gate and the holdout as a deliberately limited observation layer.
  - Reuse the existing managed-controller harness and report shape. Keep holdout identity and raw operational process outside durable controller state; retain only decisive aggregate evidence and explicit omissions in the selected evaluation artifact.
  - Compare the new route to the current direct baseline on the same immutable cases, with no optimization feedback loop during the run.
- Boundaries:
  - Tests and evaluation harness own executable evidence. Routing and frontier Changes own implementation. Core/Manage retain authority behavior; this Change must not introduce policy or architecture outside evidence needs.
  - A future promotion or stable architectural rationale is a separate owner decision and, if accepted, may create a Decision Record; beta evaluation itself creates none.
- Affected areas:
  - `test/managed-controller-contract.test.ts`, `test/managed-controller/**`, `scripts/managed-controller-eval.mjs`, and `scripts/managed-controller-beta.mjs`
  - A new immutable evidence generation under `research/evaluations/rsp-manage/`
- Constraints:
  - Preserve current tests and harness entrypoints; extend rather than replace them.
  - No secrets, provider/session details, or hidden runtime identifiers enter committed fixtures or retained evaluation evidence.
  - Execute the reopened baseline/product run with `--model ocx/gpt-5.6-terra`; do not substitute a native OpenAI model.
  - Do not claim statistical generality from one holdout; the final report must state omissions, coverage boundaries, and unobserved measurements.

## Tasks
- [x] Map current managed-controller fixtures and harness outputs to the Intake and execution contracts; add only missing observable cases.
- [x] Add deterministic fixtures for route exceptions, four Intake returns, Shape requalification, frontier stop precedence, lane isolation, mutation/verification boundaries, ceilings, and no durable controller state.
- [x] Remove token usage and token cost from the beta plan, runner summary schema, contract tests, and retained evidence; add the missing runner declaration contract.
- [x] Run the hash-locked baseline and product variants with `ocx/gpt-5.6-terra`, then retain a concise aggregate report that keeps unavailable or unrun evidence incomplete.
- [x] Run focused contracts, typecheck, package validation, and fallback synchronization without promotion or release action.

- [x] Lock the exact installed product Skill composition as `rsp`, `rsp-manage`, and `rsp-implement` with aggregate hash `ee2e26aee295ea182add2102d928f016e58685cd3e53d3447d92f13268688b76`, without token or numeric routing controls.
- [x] Add regression coverage that fails closed on installed-Skill, composition, or prior-evidence drift, derives the current 19-case identity, and preserves the earlier report and summary hashes.
- [x] Retain the passed `ocx/gpt-5.6-terra` baseline/product comparison as the new immutable `2026-08-04-manage-orchestration-beta-control-model` evidence generation, reconciled to the canonical control model without overwriting prior evidence.

## Verify
- Automated:
  - [x] `node scripts/managed-controller-eval.mjs contract`, `node scripts/managed-controller-beta.mjs contract`, focused managed-controller tests, and `mise exec -- pnpm run typecheck` — all 17 deterministic fixtures, 55 focused tests, the hash-locked beta plan, token-free summary typing, and runner declarations passed.
  - [x] A regression fixture proves that ordinary command output containing historical `model ... unavailable` text cannot be mistaken for a capability failure; only structured failed-turn or error-item messages can mark a run unavailable.
  - [x] `mise exec -- pnpm run build`, `node dist/cli.mjs update`, fallback byte comparison, `mise exec -- pnpm run docs:check`, `mise exec -- pnpm run docs:build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test`, and `git diff --check` — all passed; the aggregate suite completed 55 files / 645 tests.
- Manual or environment:
  - [x] `node scripts/managed-controller-beta.mjs run --model ocx/gpt-5.6-terra --effort high --timeout-ms 600000 --output-root <temporary-path>` ran both hash-locked variants. Baseline and product each returned exit code 0 without timeout, passed fixture, output, and recovery contracts, preserved stable Skill composition, changed only allowed paths, and recorded no unauthorized path.
  - [x] The retained summary is byte-identical to the successful temporary aggregate: baseline used 5 aggregate tool calls and 1 agent-observed verification round; product used 7 aggregate tool calls and 3 agent-observed verification rounds. Both stopped truthfully at receiver-device acceptance, and the comparison is complete only for this one holdout.
  - [x] A Verify worker with identity distinct from the beta Fix worker independently compared the implementation, temporary metadata/finals, and retained evidence and returned `pass`.
- Coverage:
  - Does not prove provider independence, real-host reliability, automatic release safety, universal runtime thresholds, or authorization to promote from beta.

- [x] Composition-lock and immutable-generation contracts passed in the beta-focused 2 files / 59 tests; the beta runner contract and all 19 / 19 current controller fixtures passed with composition hash `ee2e26aee295ea182add2102d928f016e58685cd3e53d3447d92f13268688b76`. The earlier report and summary remained at SHA-256 `4c4d7ff94bbdfbfc6988e9d264cff05de89a37f6dcc9e19f555536ba02011dc1` and `2cbbde60883e17dd0bee50c0214c3a13cc6626d04b2dc5d26ed89dd1f498de8e`.
- [x] The retained summary is byte-identical to the passed temporary aggregate at SHA-256 `058666619aef4511399a9b2822e60fab8f5565069adfeff78a4406617f1d3838`: baseline passed with 7 aggregate tool calls, 2 agent-observed verification rounds, and 176774 ms; product passed with 11 calls, 3 rounds, and 501178 ms. Both passed output, recovery, harness, and allowed-path boundaries, stopped truthfully at unavailable receiver-device acceptance, and support comparison only for this one holdout.
- [x] Build, fallback synchronization, docs checks/build, typecheck, lint, full tests, and diff hygiene passed after the path-boundary correction; the aggregate suite completed 55 files / 654 tests. Independent Verify with a distinct worker identity passed, and fixed-scope code/document review plus the accepted symlink-boundary re-review found no unresolved finding.

## Blockers
- requires `manage-orchestration-beta/managed-intake-routing`: Beta routing fixtures require the Intake contract and requalification path.
- requires `manage-orchestration-beta/evidence-frontier-execution`: Beta frontier fixtures and holdout require the bounded lane and receipt contract.
