---
candidate: rsp-shape
candidate_version: "2026.07.20.8"
candidate_hash: sha256:fccb340978f42294204cb15ea24f1d70a59c768460df58808306d6a86aa7bef0
fixture_hash: sha256:723b572514c74b449084c7267f65575fdc95d9e53ee8345a2c23380ba0ed76b4
harness_hash: sha256:75cc628c0377b0ecdf14c5f3845b23a4b8b83a650390c6637b98c112e4d9d68e
config_fingerprint: sha256:c490ad87f14f910e722fa72b29244b71a68d61f08cea7426bf97cdd890e01107
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
date: 2026-07-20
status: superseded
recommendation: do-not-promote
---

# RSP Shape v8 Blocked Evaluation

> Historical diagnostic only. Candidate v8 remained blocked; the later v11 identity passed fresh gates and was promoted. See `../2026-07-20-v11-promotion/report.md`.

## Decision

**Do not promote.** Candidate `2026.07.20.8` passes static and deterministic local gates, but no valid real-provider behavior or context-cost evidence exists for this exact candidate hash. The configured `custom` provider returned an account-level usage-limit error on the preceding v7 diagnostics; v8 was repaired and verified offline without invoking any provider.

The candidate remains under `research/candidates/skills/rsp-shape/`. No copy was placed in `skills/rsp-shape/`, and no promotion-only product Spec or user documentation was changed.

## Frozen Identity and Isolation

- Candidate: `fccb340978f42294204cb15ea24f1d70a59c768460df58808306d6a86aa7bef0`
- Fixtures: `723b572514c74b449084c7267f65575fdc95d9e53ee8345a2c23380ba0ed76b4`
- Harness: `75cc628c0377b0ecdf14c5f3845b23a4b8b83a650390c6637b98c112e4d9d68e`
- Execution config: provider-only temporary `CODEX_HOME` snapshot, sanitized fingerprint `c490ad87f14f910e722fa72b29244b71a68d61f08cea7426bf97cdd890e01107`
- External integrations: omitted from the snapshot; no MCP, plugin, memory, rule, or app configuration was copied
- Snapshot handling: mode `0600`, transient under ignored `.cache/`, removed after the matrix; its contents and bearer value are not retained in tracked evidence

## Completed Gates

- `uvx --from skills-ref agentskills validate research/candidates/skills/rsp-shape`
- `mise exec -- pnpm exec vitest run test/rsp-shape-behavior.test.ts` — 10 tests passed
- `mise exec -- pnpm run build`
- `mise exec -- pnpm run typecheck`
- `mise exec -- pnpm run lint`
- `mise exec -- pnpm run test` — 13 test files and 284 tests passed
- `node dist/cli.mjs check --focused`
- `git diff --check`
- Deterministic gates cover expected outcome, required observations, prohibited actions, authorized mutation paths, candidate self-mutation, Git staging/commit, dirty/untracked preservation, baseline comparison, three-repetition calibration mechanics, config identity, and temporary provider-only snapshot cleanup

## Provider Blocker

One complete v7 attempt created all 30 expected runs for the 15 baseline/candidate pairs. A second targeted v7 matrix created four more fresh runs. All 34 processes exited `1`, retained no usage, and emitted the provider error `You've hit your usage limit. Try again later.` No process timed out and no candidate behavior was observed. These runs establish the provider blocker only and are not behavior evidence for the current v8 identity.

Because the same provider blocker prevents a valid full 15-case matrix, the required three fresh paired context-cost matrices were not started. Running them would only duplicate a known account-level failure.

## Discarded Diagnostic Evidence

- Runs from candidate versions before `2026.07.20.8` do not establish v8 quality.
- Runs whose fixture or harness hash differs from the frozen values above are not promotion evidence.
- Runs against official/ChatGPT providers were explicitly discarded; the user required the configured `custom` provider.
- Runs inheriting the mutable full user config were discarded after unrelated App rewrites changed its full-file hash between batches.
- Runs that failed during GPG-signed temporary fixture setup or invalid MCP overrides never executed the candidate.

## Required Resume Path

1. Restore quota for the configured `custom` provider without changing the frozen candidate, fixtures, harness, model, effort, timeout, or provider-only snapshot contract.
2. Rerun the complete 15-case paired matrix and require one candidate, fixture, harness, config, and settings identity with all candidate gates passing.
3. Run exactly three fresh complete paired matrices and apply the predeclared 30% aggregate and 50% per-case median input-overhead thresholds.
4. Only after both gates pass, move the exact candidate payload to `skills/rsp-shape/`, remove the candidate copy, and run package/install/full-project verification.

## Durable Decision

- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write:
  - none; the candidate remains research-only and published product behavior has not changed
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none; the provider blocker and resume path are evaluation evidence, not a lasting product decision
- Archive ready: no
