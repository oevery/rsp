---
kind: "fix"
---

# Change: calibrate-provider-comparison-sampling

## Proposal
- Outcome: Require three candidate samples per release scenario while keeping baseline comparison diagnostic, reusable, and cheap to complete
- Why:
  - The current release matrix gives five scenarios only one pair, so provider-path variance can dominate token, tool-call, and elapsed-time percentages.
  - The report compares tagged and candidate Skill compositions under the current CLI and evaluation harness, but its presentation can be misread as a complete release-to-release package benchmark.
  - A genuine `v3.2.0` model failure currently stops later candidate samples and makes release evidence depend on old-model compliance rather than candidate correctness.
  - Re-running all six provider scenarios after every change spends substantial time and tokens even when exact-identity reports already cover five scenarios.
- Scope:
  - Configure every fixed release provider scenario for three candidate samples and up to three eligible baseline/candidate comparisons.
  - Make candidate correctness the release gate; retain baseline failures as diagnostic comparison evidence.
  - Reuse exact-identity scenario reports and allow targeted `--case` execution to fill only missing scenarios.
  - Prefer deterministic and fake-provider checks during development, with real provider execution after candidate Skill identity freezes.
  - Make sanitized Markdown reports state the exact comparison boundary, evidence mode, and diagnostic-only efficiency interpretation.
  - Keep structured and host-observed behavior strict while treating preferred final-response wording as diagnostic narrative coverage.
  - Update the durable distribution contract, release-acceptance Skill, and deterministic comparison/evidence tests.
  - Reinterpret the retained August 22 campaign under the revised candidate-centered policy; do not spend provider tokens during this implementation.
- Non-goals:
  - Building a dual-package or dual-CLI historical execution system.
  - Defining a numeric token, latency, or promotion threshold.
  - Aggregating efficiency across scenarios with different workloads.
  - Selecting a release version, publishing, pushing, tagging, or approving a release.

## Spec
### MODIFIED
- Requirement: Release provider comparisons use enough paired observations to expose trajectory variance.
  - Each of the six fixed routing/topology scenarios requires exactly three eligible candidate samples by default and attempts the corresponding baseline observations.
  - The matrix plans eighteen serial pair opportunities, retains alternating pair order, and preserves bounded infrastructure replacement without retrying model failures.
  - A baseline model failure is retained, not retried, and does not stop the remaining candidate samples; candidate hard failures and harness failures still fail fast.
- Requirement: Candidate evidence and comparison evidence have separate completion rules.
  - Candidate correctness passes only when all configured candidate samples are eligible, exact-identity, and correctness-passing.
  - Baseline model failures or missing eligible pairs make comparison partial or unavailable and efficiency non-conclusive without failing a complete candidate gate.
  - Candidate validation accepts one matching candidate-gate-passed report per scenario, including an exact single-case report used to fill that scenario.
- Requirement: Reports identify what is and is not isolated by the comparison.
  - Markdown states that baseline and candidate differ by Skill composition while the current CLI, evaluation harness, and scenario fixture are shared.
  - Markdown labels execution evidence as `fresh-provider` or `deterministic-replay` and states that the result is not a full-package release-to-release benchmark.
  - Efficiency remains diagnostic and scenario-local; repeated-pair median, minimum, maximum, and range remain visible.

### Acceptance
#### Scenario: Complete matrix plans three pairs per scenario
- GIVEN the six fixed release provider scenarios
- WHEN the matrix plan is built without a repetition override
- THEN every scenario has three repetitions and the matrix has eighteen total pairs

#### Scenario: Fresh reports disclose their comparison boundary
- GIVEN a completed provider scenario without replay
- WHEN its sanitized Markdown report is rendered
- THEN it identifies `fresh-provider`, the shared current CLI/harness boundary, and the absence of a full-package benchmark claim

#### Scenario: Replay reports remain distinguishable
- GIVEN an otherwise valid retained scenario replay
- WHEN its sanitized Markdown report is rendered
- THEN it identifies `deterministic-replay` without presenting replayed measurements as a new provider execution

#### Scenario: Natural-language variation does not replace behavioral evidence
- GIVEN a provider run with passed host verification, valid structured evidence, and a paraphrased final response
- WHEN correctness is scored and the report is rendered
- THEN preferred wording gaps remain narrative warnings rather than model failures
- AND a prose success claim cannot override failed or missing host evidence

#### Scenario: Baseline failure does not discard candidate evidence
- GIVEN a baseline model failure in one target pair
- WHEN the provider scenario continues
- THEN the failed baseline is retained without retry
- AND all remaining candidate targets are sampled
- AND three passing candidate targets pass the candidate gate while comparison remains partial

#### Scenario: Missing scenario is completed without a full rerun
- GIVEN exact-identity reports already cover five matrix scenarios
- WHEN the missing scenario is run with `--case` and produces a candidate-gate-passed report
- THEN candidate validation reuses all six reports
- AND no already-covered scenario requires another provider execution

## Design
- Approach:
  - Change the canonical provider comparison catalog so all six entries use `repetitions: 3`; keep explicit single-case `--repetitions` overrides bounded to 3..10.
  - Derive report evidence mode from the existing replay metadata rather than adding another persisted lifecycle field.
  - Add a compact comparison-boundary section to Markdown from immutable plan/summary facts; keep the JSON identity and replay contracts backward compatible.
  - Split exact machine and host-observed contracts from optional `narrative_*` fragments; retain deterministic phrase diagnostics without using another model as a judge.
  - Count completed candidate targets independently from complete eligible pairs; project comparison as `complete | partial | unavailable`.
  - Keep replay restricted to complete clean raw campaigns whose per-run prompt, workspace, Skill installation, provider adapter, raw metadata, observability producer, contract, and fixture semantics remain unchanged; scheduling, aggregation, rendering, and evidence-policy changes may replay because every retained run is independently revalidated.
- Boundaries:
  - Three pairs improve visibility into provider trajectory variance but do not establish provider-general or model-general performance.
  - Baseline extraction remains limited to tagged Skills; current CLI and harness behavior is intentionally shared and must be disclosed.
  - Fresh execution and deterministic replay remain distinct evidence modes even when both satisfy exact identity reuse rules.
- Affected areas:
  - `evaluation/managed-controller/beta/manage-orchestration-beta.yaml` and `scripts/release-provider-comparison.mjs`.
  - `test/release/release-provider-comparison.test.ts` and provider evidence checks whose fixtures assume scenario repetition counts.
  - `.rsp/specs/distribution.md` and `.agents/skills/release-acceptance/SKILL.md`.
- Constraints:
  - Provider scenarios and arms remain strictly serial; candidate, harness, and identity failures fail fast, while baseline model failures do not stop candidate sampling.
  - Sanitized reports retain no provider settings, prompts, sessions, raw errors, or workspace paths.
  - Existing reports remain sufficient only when they contain all configured candidate targets and exact current identities.
  - Exact text remains mandatory only when the text itself is the product contract, such as machine schemas or commit trailers.

## Tasks
- [x] Update the canonical six-scenario catalog, durable Spec, and release-acceptance instructions from eight total pairs to eighteen.
- [x] Render explicit comparison-boundary and evidence-mode statements in sanitized Markdown and update focused contract tests.
- [x] Separate strict behavioral evidence from diagnostic natural-language coverage in all six provider scenarios and reports.
- [x] Separate candidate correctness from baseline comparison completeness and continue candidate sampling after baseline model failures.
- [x] Allow exact-identity single-case reports to fill missing matrix scenarios while reusing already-covered reports.
- [x] Document deterministic-first development and one final provider campaign after candidate identity freezes.
- [x] Run fresh deterministic verification for the revised policy; do not execute another provider campaign for this implementation.
- [x] Resolve review findings by separating execution completion from correctness eligibility, avoiding terminal-baseline retries, and defining the lightweight replay safety boundary.
- [x] Stop immediately when a baseline run is harness-failed or incomplete while retaining baseline model and structured-correctness failures as diagnostic continuation cases.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` — passed: 2 files, 51 tests; proves baseline model/correctness diagnostic continuation, baseline harness/incomplete fail-fast, structured candidate fail-fast, terminal-baseline replacement, correctness-qualified paired efficiency, candidate-centered verdicts, partial-comparison reporting, and candidate-only evidence reuse.
  - [x] `mise exec -- pnpm run typecheck` — passed; proves changed report and test contracts remain type-safe.
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/evaluation/managed-controller-beta-contract.test.ts test/evaluation/skill-evaluation-observability.test.ts test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` — passed: 5 files, 93 tests; proves paraphrases are diagnostic, host failures remain authoritative, provider manifests separate narrative fragments, reports disclose warnings without failing correctness, and evaluator prompts expose only lightweight worker payload examples rather than the full schema descriptor.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed: 87 files, 854 tests; proves repository-wide integration remains green.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs --root .` — passed diagnostics for 16 canonical packages with no new unreachable release-acceptance resource; counts remain diagnostic only.
  - [x] `git diff --check` and `node dist/cli.mjs check calibrate-provider-comparison-sampling --json` — passed with zero errors and zero warnings; proves patch and Change structure are valid.
  - [x] Fixed-scope read-only re-review of `runReleaseProviderComparison` through serial scheduling, summary projection, and evidence checking — clean for Code and Document findings; baseline model/structured failures remain diagnostic, baseline harness/incomplete failures stop, candidate failures stop, and contaminated replacement does not rerun a terminal baseline.
- Provider/environment:
  - [x] Retained August 22, 2026 campaign interpretation — five complete clean scenarios may be deterministically replayed under the current scheduling/aggregation policy because each retained run is independently revalidated and no per-run execution semantics changed. `managed-coordinated-parallel` contains only 2/3 candidate samples and cannot be replayed as complete; if provider evidence is required after candidate identity freezes, only that scenario needs a fresh authorized `--case managed-coordinated-parallel` run.
### Optional
- Manual or environment:
  - [x] Review the generated scenario reports as a Chinese comparison summary without cross-scenario efficiency aggregation. — Six fresh reports were inspected; five passed scenario distributions are conclusive for their own workloads, while the failed parallel scenario remains non-conclusive.
- Coverage:
  - Deterministic tests own catalog, rendering, replay, and reuse behavior; provider execution owns real trajectory distributions and fresh correctness evidence.

## Blockers
- none
