# Deterministic acceptance

Load this reference only before judging general release readiness.

Ordinary `pnpm test` is deterministic code verification only. It builds the CLI once and runs source, contract, and isolated CLI integration tests; it does not execute registered acceptance projects or produce a release report. Deterministic Skill and agent contracts under `test/evaluation/` may load reusable datasets from `evaluation/` during this code-verification step. This does not authorize or trigger provider-backed, token-bearing, retained-evidence, or baseline/candidate evaluation campaigns.

1. Preview with `node scripts/release-acceptance.mjs --plan`. Require `serial-fail-fast`, complete step and project coverage, sanitized scenario provenance, and no discovery errors. Counts are observations, not fixed gates.
2. Run `mise exec -- pnpm run release:acceptance`. Do not overlap another build, package, provider, Git-fixture, or PTY run.
3. Read the new `report.json` and `report.md` under `.cache/release-acceptance/`. Require `passed`, every planned step executed, complete coverage, dynamic project evidence, and no unexplained omission.

Registered projects under `acceptance/` remain read-only and outside Vitest discovery. The package result must prove isolated copies, declared-file and dirty-Git preservation, and unchanged registered fixture hashes. Keep raw logs and machine paths local. Reusable Skill fixtures, holdouts, beta plans, and fake-provider inputs remain under `evaluation/`; they are not release-project registrations.
