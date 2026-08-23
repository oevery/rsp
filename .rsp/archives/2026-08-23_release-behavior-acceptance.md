---
kind: "feature"
---

# Change: release-behavior-acceptance

## Proposal
- Outcome: Add a short provider-backed release behavior campaign that gates the exact candidate on final-artifact hygiene, material-fact preservation, task correctness, boundary compliance, and downstream test restraint.
- Why:
  - The existing six-scenario provider comparison primarily measures routing topology and requires thirty-six provider arms; it does not directly prove the newly changed finalization and test-selection behavior.
  - Comparing small-context token totals with `3.2.0` is structurally biased by the candidate's larger Skill surface and does not establish whether the intended behavior improved.
- Scope:
  - Define a fixed short campaign with ten candidate runs and two baseline calibration runs across artifact residue, required negative facts, test restraint, and one routing smoke scenario.
  - Reuse the managed-controller provider runner in isolated workspaces with exact Skill, fixture, contract, harness, model, effort, and provider identities.
  - Produce sanitized JSON and Markdown evidence and make exact matching behavior evidence part of `release:candidate-check` without invoking a provider from the candidate check.
- Non-goals:
  - Replacing or deleting the existing full provider comparison, proving universal model behavior, minimizing token usage, making baseline correctness a release gate, or automatically running paid provider calls.
  - Changing package version, publishing, tagging, pushing, committing, archiving, or approving a release.

## Spec
### ADDED
- Requirement: The release behavior plan is fixed, serial, and bounded to ten required candidate runs plus two optional baseline-calibration runs.
  - Candidate hard failures fail fast; a baseline model failure remains diagnostic and does not block later candidate runs.
- Requirement: Candidate acceptance is based on observable correctness rather than efficiency.
  - Every required candidate run must pass task-result, compliance, boundary, authorized-path, semantic-residue, required-fact, forbidden-test or fallback, and applicable structured-route contracts.
  - Token usage, elapsed time, tool-call counts, baseline outcomes, and baseline/candidate deltas are reported only as diagnostics and never change the candidate verdict.
- Requirement: Retained behavior evidence is exact, sanitized, and reusable without another provider call only while all declared identities still match.
  - The evidence check rejects missing runs, failed hard dimensions, stale Skill composition, fixture, contract, harness, model, effort, or provider identity, and unsanitized or incomplete reports.
  - `release:candidate-check` verifies retained evidence and deterministic acceptance but never invokes the provider-backed campaign.

### Acceptance
#### Scenario: Candidate behavior is release-acceptable
- GIVEN an exact candidate Skill composition and a complete short behavior plan
- WHEN the provider-backed campaign executes all required candidate runs in fresh isolated sessions
- THEN every hard behavior dimension passes, reports contain no session or machine-path leakage, and efficiency observations do not affect the verdict

#### Scenario: Baseline calibration is unavailable
- GIVEN a required candidate run passes and its paired `3.2.0` calibration arm fails because of a model or provider outcome
- WHEN the campaign continues
- THEN the failure is retained as diagnostic evidence and does not fail or suppress remaining candidate coverage

#### Scenario: Exact evidence is reused by candidate check
- GIVEN a sanitized passing report whose declared identities still match the release candidate
- WHEN `release:candidate-check` runs
- THEN it revalidates the report without calling a provider; missing, incomplete, failed, or stale evidence stops with a precise single-case rerun handoff

## Design
- Approach:
  - Add a dedicated release-behavior manifest and runner over `runManagedControllerEvaluation`, separate from the beta topology matrix.
  - Cover correction-pressure final output with three candidate plus one baseline run, commit or release surface leakage with two candidate plus one baseline run, material negative facts with two candidate runs, shared-channel test restraint with one candidate run, imagined-state restraint with one candidate run, and direct routing smoke with one candidate run.
  - Add a deterministic evidence checker that recomputes exact identities from the current manifest and candidate source, then integrate it into the release candidate script chain.
- Boundaries:
  - Keep the existing full `release:provider-compare` command available for deeper routing or Manage changes; it is no longer the default evidence gate for this behavior-focused release path.
  - Use structural and host-observed signals as decisive evidence; keyword scanning may assist leakage detection but cannot independently establish semantic correctness.
  - Raw prompts, sessions, provider events, and workspaces remain local diagnostics; retained reports contain only sanitized evidence.
- Affected areas:
  - `evaluation/release-behavior/` and selected managed-controller holdout fixtures
  - `scripts/release-behavior-acceptance.mjs`, `scripts/release-behavior-evidence-check.mjs`, and shared evaluation helpers where required
  - `package.json`, release acceptance guidance, and focused release/evaluation tests
- Constraints:
  - Provider execution is serial and requires explicit model, effort, provider, baseline reference, and cost authority.
  - The runner must support plan-only inspection and single-case reruns so one hard failure does not require repeating the complete campaign.
  - Deterministic tests use fake providers or retained fixtures and must not make network or paid model calls.

## Tasks
- [x] Define the fixed release-behavior manifest and realistic isolated holdout contracts.
- [x] Implement plan, full campaign, single-case rerun, sanitization, fail-fast, and diagnostic aggregation behavior.
- [x] Implement exact retained-evidence validation and replace the default full-matrix evidence dependency in `release:candidate-check` while preserving the optional matrix command.
- [x] Add deterministic regression coverage for call counts, hard-failure handling, baseline diagnostics, non-gating efficiency, stale evidence, sanitization, and provider-free candidate checks.
- [x] Update release acceptance guidance and run focused plus repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts test/release/release-acceptance.test.ts test/release/release-candidate-check.test.ts` — passed 3 files / 29 tests; proves the twelve-run plan, correctness gates, evidence identity, sanitization, and no-provider reuse contract.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed build, lint, 88 test files, and 871 tests; proves package, authored Skills, evaluation fixtures, and release tooling remain repository-compatible.
  - [x] `node scripts/release-behavior-acceptance.mjs --plan --json --baseline-ref v3.2.0 --model gpt-5.6-sol --effort high --provider openai` — returned serial fail-fast coverage for ten candidate and two baseline runs with `efficiency_threshold: null`, without invoking a provider.
  - [x] `git diff --check` and `node dist/cli.mjs check --focused --json` — passed with zero errors and warnings; proves changed artifacts are syntactically clean and the selected Change remains valid.
### Optional
- Manual or environment:
  - [ ] Run the frozen provider-backed campaign after model, effort, provider, baseline reference, and cost are explicitly authorized; retain the sanitized report for exact candidate reuse.
- Coverage:
  - Deterministic verification proves orchestration, fixture, scoring, sanitization, and evidence-reuse contracts, not real-model efficacy; release behavior remains incomplete until an authorized fresh provider report passes for the exact candidate identity.

## Blockers
- none

## Durable Decisions
- Current facts: `.rsp/specs/distribution.md` now defines the short correctness-first behavior campaign as the default provider-backed candidate gate and preserves the full routing matrix as an optional deeper campaign.
- Lasting rationale: No Decision Record is needed; this is a proportionate release-evidence policy update within the existing distribution owner, with token and latency retained as diagnostics rather than acceptance thresholds.
