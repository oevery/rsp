---
kind: "refactor"
---

# Change: agent-evaluation-suite/verification-architecture-rebuild

## Proposal
- Outcome: Rebuild the repository's verification architecture under one explicit `verification/` root while preserving distinct test, evaluation, and acceptance semantics.
- Why:
  - The former `test/`, `evaluation/`, and `acceptance/` surfaces scattered shared configuration, fixtures, runners, evidence, and reports.
  - Existing local campaigns are useful transition harnesses, but synthetic traces must not be mistaken for real Skill execution or project acceptance.
  - A single topology is needed to make scenario ownership, real execution boundaries, deterministic oracles, AI judges, artifact retention, and report dispositions auditable.
- Scope:
  - Establish `verification/config.yaml`, shared JSON/YAML contracts, canonical scenario metadata, fixture indexes, harness adapters, deterministic oracles, bounded AI-judge interfaces, and report/artifact policies.
  - Add explicit local command entry points for deterministic tests, evaluations, disposable-project acceptance, and fake-provider gates; retain `pnpm test` only as a compatibility alias for deterministic tests.
  - Migrate or wrap the current agent-evaluation platform and campaign runners so each report records `executed`, `verified`, `failed`, `skipped`, `unavailable`, `unverified`, and `simulated` distinctly.
  - Complete the physical migration of current test, evaluation, and acceptance inputs into the unified root and remove the old top-level directories.
- Non-goals:
  - Do not run a real provider, change provider configuration, add credentials, or claim real-provider acceptance.
  - Do not change RSP runtime routing, Skill semantics, worker lifecycle semantics, release authority, or publication behavior.
  - Do not delete historical `research/evaluations/` records or overwrite unrelated dirty-worktree changes.

## Spec
### MODIFIED
- Requirement: Verification layers MUST have one physical top-level root and separate semantic ownership.
  - `verification/tests/` owns fast deterministic unit/contract/integration/architecture checks; `verification/evaluations/` owns behavior and model-judged campaigns; `verification/acceptance/` owns disposable project/package/worktree/release-facing scenarios. Shared config, contracts, fixtures, harnesses, metrics, and artifacts MUST be reachable from the same root.
- Requirement: A scenario MUST declare a stable ID, layer, owner, execution mode, fixture references, required evidence, deterministic oracle, semantic rubric, artifact policy, and coverage policy.
  - A scenario marked `acceptance` MUST invoke a declared disposable project or package boundary; a synthetic trace-only run MUST be marked `simulated` and MUST NOT satisfy acceptance coverage.
- Requirement: The harness MUST separate host-observed evidence from agent self-report and AI interpretation.
  - Deterministic oracles own command failures, forbidden actions, missing evidence, artifact invariants, authority boundaries, lifecycle transitions, and unavailable capabilities. AI judges may interpret semantic goals only from sanitized catalogued evidence and cannot override deterministic failure or unavailable status.
- Requirement: Command entry points MUST make execution boundaries explicit.
  - `verify:test`, `verify:evaluate`, `verify:accept`, and `verify:provider:fake` MUST be local-only and must not invoke a real provider implicitly. `verify:provider:real` MUST exist only as an explicit, separately authorized boundary and MUST fail closed when not enabled.
- Requirement: Reports MUST expose execution truth rather than infer it from verdicts.
  - Every planned run has one coverage disposition; reports retain mode, provider class, attempt metadata, token usage when available, errors, omissions, deterministic findings, AI findings, artifact references, and final verdict. `unavailable`, `unverified`, `skipped`, and `simulated` remain distinct from `verified` and never become a product pass by inference.

### Acceptance
#### Scenario: The unified topology has one shared source of truth
- GIVEN the repository's verification configuration and scenario tree
- WHEN the topology validator loads them
- THEN shared contracts, metrics, fixture references, artifact surfaces, and command modes validate from `verification/` without duplicate semantic registries

#### Scenario: Test, evaluation, and acceptance remain distinct
- GIVEN one deterministic test scenario, one synthetic evaluation scenario, and one disposable-project acceptance scenario
- WHEN each runner executes locally
- THEN each report identifies its layer and execution mode, and a simulated evaluation cannot satisfy acceptance coverage

#### Scenario: Host evidence and AI analysis are bounded
- GIVEN a trace containing a command error, forbidden action, missing artifact, self-report conflict, and a fake AI finding
- WHEN the harness builds evidence and the report
- THEN deterministic failures and omissions remain authoritative, secrets and absolute paths are sanitized, AI references are catalogued, and the report names every error and unverified field

#### Scenario: Provider boundaries are explicit
- GIVEN the local command set
- WHEN `verify:local` or `verify:provider:fake` runs
- THEN only fake/local fixtures execute, usage accounting is retained where available, and no real provider request or provider configuration mutation occurs

## Design
- Approach:
  - Create a thin `verification/` control plane rather than duplicate every existing test immediately: canonical contracts and scenario manifests live there, while adapters call current scripts/tests until each slice is migrated.
  - Use a normalized run record: scenario → execution → sanitized evidence catalog → deterministic oracle → optional AI judge → report/artifact projection.
  - Classify execution modes as `deterministic`, `simulated`, `local`, `fake-provider`, `disposable-project`, and `real-provider`; only the last requires a separately authorized future campaign.
- Boundaries:
  - The verification root owns verification inputs and generated artifacts, not RSP lifecycle state, product source, credentials, or raw private traces.
  - Deterministic checks are fail-closed and precede semantic AI interpretation. AI output is advisory evidence, never an authority override.
  - Compatibility scripts may delegate into the root, but new scenarios must reference canonical IDs and shared contracts.
- Affected areas:
  - `verification/` shared config, contracts, scenarios, fixtures, harness, tests, evaluations, acceptance, and ignored artifacts.
  - `scripts/agent-evaluation-*.mjs`, provider-gate and acceptance adapters, package scripts, and focused topology/contract tests.
  - Historical path strings inside holdout projects and archived research remain data about those isolated projects; they are not repository verification roots.
- Constraints:
  - Preserve all existing dirty-worktree edits and avoid broad mechanical rewrites.
  - Local verification uses fake/local fixtures only; no network-backed provider or secret-bearing configuration is read or written.
  - Generated reports are ignored or explicitly classified as artifacts and are never used as RSP durable truth.

## Tasks
- [x] Create the `verification/` root, shared config, contracts, metric definitions, artifact policy, scenario schema, and report schema.
- [x] Add canonical scenario indexes for Skills, Core routing, worker routing, project acceptance, and fake-provider gate coverage.
- [x] Add harness adapters, deterministic oracle boundaries, sanitized evidence projection, optional AI-judge boundary, and explicit run/report dispositions.
- [x] Migrate the current agent-evaluation platform/campaign runners behind the unified root without changing their local fake behavior.
- [x] Add explicit package commands for deterministic tests, local evaluations, disposable acceptance, fake-provider gate, and aggregate local verification; keep `pnpm test` as a deterministic compatibility alias.
- [x] Add topology, contract, mode-separation, no-real-provider, report-completeness, and compatibility tests.
- [x] Run fresh local verification, update this Change and the Group Brief with final evidence, and record remaining real-provider/real-project boundaries truthfully.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run build` — passed; the repository build remains green.
  - [x] `mise exec -- pnpm run typecheck` — passed; shared scenario/run/report declarations remain consistent.
  - [x] `mise exec -- pnpm run lint` — passed; repository lint remains green.
  - [x] `mise exec -- pnpm exec vitest run verification/tests/architecture/verification-topology.test.ts verification/tests/evaluation/verification-platform.test.ts verification/tests/evaluation/agent-evaluation-platform.test.ts verification/tests/evaluation/agent-evaluation-suite.test.ts --no-file-parallelism` — post-migration rerun passed; 4 files and 28 tests prove all unified topology/platform paths resolve.
  - [x] `mise exec -- pnpm run verify:local` — passed; loaded 83 canonical scenarios (1 test, 81 evaluation, 1 acceptance), ran local simulated/fake campaigns, and reported real provider execution as disabled.
  - [x] `mise exec -- pnpm run verify:evaluate` — passed; Skill/routing/worker/project campaigns produced simulated local results and retained fake-provider usage fields.
  - [x] `mise exec -- pnpm run verify:provider:fake` — passed; baseline/candidate fake usage was retained as 12 and 14 total tokens, with `real_provider: false`.
  - [x] `mise exec -- pnpm run verify:provider:real` — failed closed with the expected disabled-boundary error; no real provider request was made.
  - [x] `mise exec -- pnpm test -- --no-file-parallelism` — post-migration rerun passed; 100 files and 923 tests remain green under `verification/tests/`.
  - [x] `git diff --check` — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Inspect the generated local aggregate report — topology, execution mode, campaign counts, fake-provider token usage, deterministic-oracle authority, simulated/acceptance separation, and real-provider boundary were visible.
- Coverage:
  - Real provider requests, live external credentials, and production-like remote acceptance remain explicitly unverified and outside this Change.

## Blockers
- none
