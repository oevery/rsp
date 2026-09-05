---
kind: "refactor"
---

# Change: agent-evaluation-suite/verification-orchestration-report-rebuild

## Proposal
- Outcome: Make the unified verification commands execute and report test, evaluation, acceptance, fake-provider, simulated, unavailable, and unverified layers without conflating them.
- Why:
  - verify:local currently reports simulated campaigns and fake-provider usage but does not run the deterministic test suite or disposable acceptance runner.
  - The report schema requires only a few fields and permits arbitrary properties, so token usage, errors, omissions, AI findings, and execution provenance are not enforced contractually.
- Scope:
  - Rebuild the aggregate runner around planned scenarios, actual run records, coverage dispositions, errors, omissions, evidence references, usage, and final verdicts.
  - Make verify:local explicitly compose the allowed local layers and expose skipped/unavailable boundaries.
  - Add report validation and cross-layer consistency tests.
- Non-goals:
  - Do not enable real provider execution, credentials, remote acceptance, publication, or release.
  - Do not make AI analysis override deterministic failure or missing evidence.

## Spec
### MODIFIED
- Requirement: Every aggregate report MUST identify each planned layer and scenario with execution mode, disposition, errors, omissions, evidence references, and verdict.
  - Simulated and unverified runs MUST remain distinguishable from verified runs; acceptance coverage MUST require an actual disposable boundary.
- Requirement: verify:local MUST execute deterministic tests, local evaluations, fake-provider checks, and the configured disposable acceptance boundary, or record each omitted layer explicitly.
  - A pass MUST be impossible when a required layer is skipped, unavailable, unverified, or failed.
- Requirement: Report schemas MUST require usage fields when available, AI analysis provenance, deterministic findings, and boundary declarations while rejecting contradictory records.

### Acceptance
#### Scenario: Aggregate local verification includes every required layer
- GIVEN the local verification configuration and canonical scenario indexes
- WHEN verify:local runs
- THEN the report contains deterministic test, simulated/fake evaluation, fake-provider, and disposable acceptance records with independent dispositions and no hidden omission

#### Scenario: A skipped required layer cannot pass
- GIVEN a required acceptance or deterministic-test layer that was not executed
- WHEN the aggregate report is built
- THEN the final verdict is incomplete or failed and the omission names the missing layer

#### Scenario: Reports preserve process truth
- GIVEN command errors, unavailable capabilities, token usage, deterministic findings, and AI findings
- WHEN the report is validated and rendered
- THEN those fields remain attributable to their run evidence, sensitive values are sanitized, and AI output cannot erase host failures

## Design
- Approach:
  - Define one normalized run record and one aggregate reducer shared by test/evaluation/acceptance commands.
  - Validate reports against a strict schema before rendering Markdown or JSON artifacts.
  - Keep AI judge output advisory and evidence-referenced.
- Boundaries:
  - Orchestration owns composition and coverage truth; individual runners own their execution receipts and deterministic oracles.
  - Real provider and external acceptance remain explicit unavailable boundaries.
- Affected areas:
  - scripts/verification-local.mjs, agent-evaluation-suite.mjs, verification-platform.mjs, and report schemas.
  - verification/tests/evaluation and command-level integration tests.
- Constraints:
  - No hidden provider/network calls, no credential reads, and no report generation from verdict-only summaries.
  - Preserve compatibility aliases only where they delegate to the canonical verification root.

## Tasks
- [x] Define strict run and aggregate report contracts for all verification layers.
- [x] Compose verify:test, local evaluation, fake provider, and disposable acceptance in verify:local with explicit dispositions.
- [x] Add consistency checks for planned/executed/verified counts, omissions, evidence, usage, and verdicts.
- [x] Render JSON and Markdown reports from run records and retain sanitized artifact references.
- [x] Add regression tests for skipped, unavailable, simulated, failed, and contradictory records.
- [x] Record final aggregate evidence and remaining real-provider boundary in this Change.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/verification-platform.test.ts verification/tests/evaluation/agent-evaluation-suite.test.ts verification/tests/evaluation/verification-orchestration-report-rebuild.test.ts --no-file-parallelism — passed; report paths are repository-relative and compact evaluation summaries omit duplicated normalized traces.
  - [x] `mise exec -- pnpm run verify:local` — executed; exit 1 is the required incomplete verdict for 55 unverified semantic/runtime cases, while 63/63 runs were recorded with 8 verified runs, 0 failed runs, 26 total fake-provider tokens, a 785,700-byte sanitized JSON report, and an 826-byte Markdown report. All six disposable project acceptance categories are verified, including invocation-scoped output roots, report timestamp ownership, output-root symlink rejection, artifact path binding, malformed-report handling, and recovery when the acceptance JSON pointer is truncated from stdout; 428 evidence records have unique IDs and observed provenance, aggregate AI analysis has no findings, and real provider execution remains disabled.
  - [x] mise exec -- pnpm run verify:accept — passed; the disposable release acceptance command completed with exit 0 and no provider access.
  - [x] git diff --check — passed.
  - [x] `mise exec -- pnpm exec vitest run verification/tests/release/clean-install-check.test.ts verification/tests/evaluation/verification-runtime-evidence-harness.test.ts verification/tests/evaluation/verification-orchestration-report-rebuild.test.ts --no-file-parallelism` — 27 tests passed; dangling artifact symlink rejection, Unicode-safe workspace parsing, nested host artifact observation, normalized run validation, omission/provenance consistency, strict project-category evidence, output-root boundary checks, report ownership, malformed-report handling, truncated acceptance-report recovery, passed-aggregate step-status consistency, aligned AI propagation, Markdown findings, and no-duplicate orchestration paths remain green.
  - [x] `mise exec -- pnpm run verify:test` — 103 files and 949 tests passed; no real provider was invoked.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run build` — all passed after the correction.
### Optional
- Manual or environment:
  - [x] No manual or environment-only check is required for this local-only Change.
- Coverage:
  - Real provider analysis and external production acceptance remain unavailable and outside this local-only implementation.

## Blockers
- aggregate remains incomplete until an authorized agent semantic runtime and host worker adapter can provide observed Skill/Core/worker evidence; real provider execution remains disabled.

## Review Resolution
- [x] Accepted P1 acceptance-plan completeness finding: a current acceptance report must contain the exact ordered `RELEASE_ACCEPTANCE_STEPS` ID set; a passed report that omits security, metadata, documentation, typecheck, lint, tests, build, or package execution cannot verify any project acceptance category.
- [x] Follow-up P1 resolution: acceptance reports reject duplicate or malformed steps, and a passed report requires every step to be passed; package/build artifact categories also require their owning step status.
- [x] Accepted P1 acceptance oracle finding: aggregate acceptance categories now require the current project catalog, exact fixture identity/coverage, and required project checks.
- [x] Accepted P1 path-boundary finding: report recovery rejects symlinked output roots and report files whose real paths leave the repository/output boundary.
- [x] Accepted P1 report-ownership finding: local acceptance writes to an invocation-scoped output root and recovery validates report timestamps against the host receipt.
- [x] Accepted P2 malformed-report finding: malformed report JSON is ignored as unverified input and no longer throws from category extraction.
- [x] Accepted P1 artifact-binding finding: `package-build` and `generated-artifacts` require package identity plus a matching host-observed artifact path, bytes, and SHA-256; directory snapshots now include nested files, closing the arbitrary-hash verification gap.
- [x] Accepted P2 artifact-output boundary finding: artifact output uses atomic exclusive creation and rejects existing or dangling symlink targets, so the package copy cannot follow a symlink outside the repository.
- Fresh verification: `CI=true mise exec -- pnpm exec vitest run verification/tests/release/clean-install-check.test.ts verification/tests/evaluation/verification-runtime-evidence-harness.test.ts verification/tests/evaluation/verification-orchestration-report-rebuild.test.ts --no-file-parallelism` (27 passed); `CI=true mise exec -- pnpm run verify:test` (103 files, 949 passed); typecheck, lint, build, and `git diff --check` completed successfully. `CI=true mise exec -- pnpm run verify:local` completed with the expected local `incomplete` result: 63/63 scenarios executed, 8 verified, 0 failed, 55 unverified, 6 acceptance categories verified, 428 host-observed evidence records, 785,700-byte JSON and 826-byte Markdown reports, 26 fake-provider tokens, and real provider execution disabled. The package artifact binding was independently checked at `.cache/verification-acceptance/66551/1787811728379/20260827T062208546Z-32dae495f2-73408/artifacts/package.tgz`: 166,644 bytes and SHA-256 `389358e2faf31aa7ff25e42a59f3bcc0814a5f077e015f6f76fa37456647f499` matched both report and host receipt. The new dangling-symlink reproducer leaves the external target absent. The prior two-step `build`/`package` reproducer remains rejected for all six acceptance categories.
