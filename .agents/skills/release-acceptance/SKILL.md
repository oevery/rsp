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

## 2. Provider comparison

Use only when compared Skill behavior changed or an explicit release evaluation requires old/new correctness and efficiency evidence, and provider cost is authorized. It does not replace deterministic acceptance. Ordinary sanitized-project acceptance validates only the current candidate against stable contracts and does not require a historical arm.
The comparison may consume cases and fake-provider support under `evaluation/`, but its selected baseline, candidate, contract, fixture, and harness identities must still be explicit and immutable for the run.

1. Preview with `mise exec -- pnpm run release:provider-compare -- --plan --json --baseline-ref v<previous-version> --repetitions 3`. Require distinct fixed baseline/candidate composition identities plus fixed contract, fixture, harness, and candidate-source hashes; execution must be `serial-paired`.
2. Run the same command without `--plan`, adding the authorized model, effort, provider, and isolation options. Run at least three pairs and do not overlap another acceptance or provider run.
3. Require correctness, compliance, boundary, and task-result passes before interpreting token, tool-call, or elapsed-time medians, ranges, and deltas. Missing usage, unavailable runs, incomplete pairs, or identity drift never pass. Token reduction alone has no release threshold.

Retain only the sanitized aggregate report. Provider settings, prompts, sessions, events, and workspaces remain local diagnostics.

## 3. Exact candidate

Use only after version identity and release surfaces are final and the intended release commit has a clean worktree. Run `mise exec -- pnpm run release:candidate-check`. It checks exact candidate identity first, then runs deterministic acceptance.

Re-run deterministic acceptance after any source, package inventory, generated output, release metadata, or required-scenario change. Run required PTY, Windows, or provider evidence serially and record unavailable environments as incomplete, never passed.

A passing plan, report, comparison, or candidate check grants no archive, commit, push, tag, npm publication, hosted release, deployment, approval, or human-acceptance authority. Stop at the next action not explicitly authorized.

## Failure handling

- Diagnose the first failed step from its retained log and current source; do not skip it or continue later shared-resource steps.
- A provider arm failure must still produce a sanitized aggregate report naming the failed arm and bounded failure category. Absence of that report is a runner defect, not an unavailable pass.
- Correct only the selected Change scope, then create a fresh run rather than editing or merging an old report.
- If project coverage is missing, add or repair a realistic isolated fixture; do not lower required coverage or assert a fixed total.
- If a real project would require network access, credentials, or mutation of its source checkout, report it as unavailable until an isolated authorized fixture or checkout exists.
