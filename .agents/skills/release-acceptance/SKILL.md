---
name: release-acceptance
description: Plan, execute, and interpret this repository's serial pre-release acceptance campaign, including dynamic project scenarios and generated reports. Use before selecting or validating an exact RSP release candidate; do not use it to publish, tag, push, or approve a release.
---

# Release Acceptance

Choose the narrowest mode that matches the release decision. Run modes serially: they share build, package, provider, or terminal resources. Scripts own mechanics and report generation; this Skill owns sequencing, evidence interpretation, and authority stops.

## 1. Deterministic acceptance

Use before judging general release readiness.
Ordinary `pnpm test` is deterministic code verification only. It builds the CLI once and runs source, contract, and isolated CLI integration tests; it does not execute registered acceptance projects or produce a release report.
Deterministic Skill and agent contracts under `test/evaluation/` may load reusable datasets from `evaluation/` during this code-verification step. This does not authorize or trigger provider-backed, token-bearing, retained-evidence, or baseline/candidate evaluation campaigns.

1. Preview with `node scripts/release-acceptance.mjs --plan`. Require `serial-fail-fast`, complete step and project coverage, sanitized scenario provenance, and no discovery errors. Counts are observations, not fixed gates.
2. Run `mise exec -- pnpm run release:acceptance`. Do not overlap another build, package, provider, Git-fixture, or PTY run.
3. Read the new `report.json` and `report.md` under `.cache/release-acceptance/`. Require `passed`, every planned step executed, complete coverage, dynamic project evidence, and no unexplained omission.

Registered projects under `acceptance/` remain read-only and outside Vitest discovery. The package result must prove isolated copies, declared-file and dirty-Git preservation, and unchanged registered fixture hashes. Keep raw logs and machine paths local.
Reusable Skill fixtures, holdouts, beta plans, and fake-provider inputs remain under `evaluation/`; they are not release-project registrations.

## 2. Provider behavior acceptance

Use when release-relevant Skill behavior changed and provider cost is authorized. This is the default provider-backed release gate. It is deliberately short and correctness-first: ten candidate runs plus two baseline calibration runs cover final-artifact residue, commit or release surface residue, required negative facts, shared-channel and imagined-state test restraint, and one direct-routing smoke.

1. Preview with `mise exec -- pnpm run release:behavior-check -- --plan --json --baseline-ref v<previous-version> --model <model> --effort <effort> --provider <provider>`. Require exactly ten candidate runs, two baseline calibration runs, serial fail-fast execution, exact Skill, fixture, contract, and harness identities, and the intended model settings.
2. Run the same command without `--plan` only after provider cost is authorized and the candidate Skill composition is frozen. Candidate hard failures stop the campaign. A baseline model or behavior failure remains diagnostic and does not stop candidate sampling; a harness failure stops because it invalidates the observation.
3. Require every candidate run to pass task result, compliance, boundary, scenario behavior, and applicable structured-route dimensions. Treat token usage, elapsed time, tool calls, baseline outcomes, and all baseline/candidate deltas as diagnostics only; they never change the verdict.
4. Retain only sanitized aggregate JSON and Markdown reports. Raw prompts, sessions, events, workspaces, and machine paths remain local diagnostics. Reuse exact matching scenario evidence; rerun only missing or stale scenarios with `--case <case>`.

The scenario contracts use concrete observable surfaces and host evidence. Scenario-specific text checks protect known leakage and required-fact boundaries, but do not claim universal semantic detection or model generality.

## 3. Provider routing comparison

Use only when compared Skill behavior changed or an explicit release evaluation requires old and new correctness and efficiency evidence, and provider cost is authorized. It does not replace deterministic acceptance. During development, prefer focused Vitest, typecheck, and fake-provider checks; run real provider evidence after the candidate Skill composition is frozen. Ordinary sanitized-project acceptance validates only the current candidate against stable contracts and does not require a historical arm.
The comparison may consume cases and fake-provider support under `evaluation/`, but its selected baseline, candidate, contract, fixture, and harness identities must still be explicit and immutable for the run.

1. Preview the complete release matrix with `mise exec -- pnpm run release:provider-compare -- --plan --matrix --json --baseline-ref v<previous-version>`. Require six fixed scenarios with three baseline/candidate pairs each, eighteen total: direct integrated verification; managed solo without workers; one delegated primary worker with integrated verification; one implementation worker plus an independent verifier; coordinated sequential workers; and one coordinated parallel wave. Every scenario must bind distinct contract and fixture hashes while sharing exact baseline/candidate Skill compositions, harness, model, effort, and provider settings.
2. Run the same command without `--plan`, adding the authorized model, effort, provider, and isolation options. Scenarios and paired arms run serially; candidate hard failures, candidate identity drift, harness failures, and incomplete execution fail fast. A baseline model failure is retained as diagnostic evidence, is not retried, and does not stop the remaining candidate samples. Do not overlap another acceptance or provider run.
3. Require every candidate sample to pass host-observed execution, strict machine contracts, boundary, task-result, and structured routing-topology checks. Treat baseline correctness and eligible baseline/candidate pair count as comparison diagnostics: incomplete pairing makes comparison `partial` or `unavailable` and efficiency `not-conclusive`, but does not override a complete candidate gate. Treat final-response wording coverage as diagnostic only: a paraphrase or omitted preferred phrase cannot override passed host verification and structured evidence, while a prose success claim cannot override failed or missing host evidence. Do not aggregate efficiency across scenarios with different workloads. Token reduction alone has no release threshold.

Treat the generated comparison as a Skill-composition comparison, not a full package or CLI release-to-release benchmark. Both arms use the current CLI, evaluation harness, and scenario fixture; the isolated difference is the tagged baseline versus candidate Skill composition. Require every Markdown report to label `fresh-provider` or `deterministic-replay` evidence explicitly, disclose this comparison boundary, and separate diagnostic narrative coverage from correctness before interpreting efficiency.

Retain one candidate-gate-passed sanitized report per scenario for exact-identity reuse. Final version, changelog, release-note, and migration-only changes do not require another provider execution while every declared scenario remains covered and its baseline and candidate Skill-composition hashes plus contract, fixture, and harness hashes remain exact. Recompute those identities through the matrix plan path only; candidate commit and whole-source fingerprint remain provenance rather than a release-surface invalidation key. Reuse every still-matching scenario report. For each missing scenario, run only `mise exec -- pnpm run release:provider-compare -- --case <case> --baseline-ref v<previous-version> ...`; an exact-identity single-case report satisfies that scenario but never substitutes for another missing case. Use `--matrix` only when all scenarios are missing or a deliberate full refresh is authorized.

Replay a prior complete clean scenario when the changed harness behavior is limited to scheduling, aggregate scoring, report rendering, or release-evidence policy and does not alter one run's prompt, workspace preparation, Skill installation, provider adapter, raw metadata, observability producer, contract, or fixture. Each retained run must be independently revalidated with `mise exec -- pnpm run release:provider-compare -- --replay-report <prior-report.json> --baseline-ref v<previous-version> --case <case>`; omit `--repetitions` so the immutable catalog supplies that scenario's configured pair count. Replay requires exactly the configured clean pairs with no contamination, replacement, failure, incomplete pair, or Skill, baseline, contract, and fixture drift. Require a new non-overwriting candidate-gate-passed scenario report bound to the current harness. Any change to per-run execution semantics, or missing or mismatched raw metadata, events, final response, observability, receipt, composition, or hashes, fails closed and requires a fresh explicitly authorized provider comparison. Replaying one scenario never substitutes for missing reports elsewhere in the matrix.

Retain only the sanitized aggregate report. Provider settings, prompts, sessions, events, and workspaces remain local diagnostics.

Keep the full `release:provider-compare` matrix as an optional deeper campaign when routing topology, Manage dispatch, worker composition, or comparison research changed. It is not the default candidate gate for final-artifact and test-restraint changes.

## 4. Exact candidate

Use only after version identity and release surfaces are final and the intended release commit has a clean worktree. Run `mise exec -- pnpm run release:candidate-check`. It checks exact candidate identity first, deterministically verifies that release behavior evidence is either unnecessary or covered by matching retained scenario reports, then runs deterministic acceptance. Candidate validation never invokes a provider; missing or stale behavior evidence stops with an explicit single-case `release:behavior-check` handoff. Run the optional full routing comparison separately when its deeper topology boundary applies.

Re-run deterministic acceptance after any source, package inventory, generated output, release metadata, or required-scenario change. Run required PTY, Windows, or provider evidence serially and record unavailable environments as incomplete, never passed.

A passing plan, report, comparison, or candidate check grants no archive, commit, push, tag, npm publication, hosted release, deployment, approval, or human-acceptance authority. Stop at the next action not explicitly authorized.

## Failure handling

- Diagnose the first failed step from its retained log and current source; do not skip it or continue later shared-resource steps.
- A provider arm failure must still produce a sanitized aggregate report naming the failed arm and bounded failure category. Absence of that report is a runner defect, not an unavailable pass.
- Correct only the selected Change scope, then create a fresh run rather than editing or merging an old report.
- If project coverage is missing, add or repair a realistic isolated fixture; do not lower required coverage or assert a fixed total.
- If a real project would require network access, credentials, or mutation of its source checkout, report it as unavailable until an isolated authorized fixture or checkout exists.
