---
kind: "refactor"
---

# Change: agent-evaluation-suite/verification-runtime-evidence-harness

## Proposal
- Outcome: Make local evaluation runs execute real repository-local entry points and derive receipts from host-observed evidence instead of preconstructed traces.
- Why:
  - Current campaigns construct fake events, artifacts, routes, worker counts, and handoffs before scoring them.
  - A passing score can therefore prove only the scorer contract, not that the Skill, router, worker adapter, or disposable project actually ran.
- Scope:
  - Add a bounded local execution adapter for deterministic CLI/Skill fixtures, disposable workspaces, command results, artifacts, and lifecycle observations.
  - Separate scenario input, execution receipt, deterministic oracle, and optional semantic analysis.
  - Preserve fake-provider and real-provider fail-closed boundaries.
- Non-goals:
  - Do not enable real provider requests, read credentials, or alter product routing or worker runtime semantics.
  - Do not replace existing unit, CLI, release, or security tests that already own observable product behavior.

## Spec
### MODIFIED
- Requirement: A local evaluation run MUST execute a declared local entry point or disposable boundary before it can claim execution evidence.
  - Scenario builders MUST declare inputs and expected oracle data but MUST NOT populate host-observed results.
- Requirement: Host receipts MUST record command status, errors, omissions, artifacts, lifecycle observations, and sanitized provenance independently from agent self-report.
  - A deterministic failure or missing required observation MUST remain authoritative over semantic analysis.
- Requirement: Fake-provider execution MUST remain explicitly marked fake-provider or simulated, and real-provider execution MUST fail closed.

### Acceptance
#### Scenario: Local Skill execution produces an observed receipt
- GIVEN a Skill fixture with a declared prompt, workspace, command boundary, and expected oracle
- WHEN the local harness executes the actual repository entry point and captures stdout, stderr, exit status, changed paths, artifacts, and handoff
- THEN the receipt contains only observed evidence, separates self-report from host evidence, and the oracle can fail when the implementation omits or violates a boundary

#### Scenario: Synthetic traces cannot claim execution
- GIVEN a scenario containing only a preconstructed event list without an executable entry point
- WHEN the local runner receives it
- THEN the run is rejected or marked simulated/unverified and cannot contribute to executed or acceptance coverage

#### Scenario: Provider and lifecycle boundaries remain fail-closed
- GIVEN a real-provider or unavailable-worker request
- WHEN the harness is asked to execute it locally
- THEN no credential or external request is attempted and the result records unavailable or blocked evidence truthfully

## Design
- Approach:
  - Introduce an execution receipt adapter with explicit local command, disposable project, and fake-provider modes.
  - Keep deterministic collection before semantic judging; expose a narrow adapter contract for future host worker receipts.
- Boundaries:
  - The harness owns observation and sanitization, not product routing, Skill semantics, worker lifecycle control, or provider configuration.
  - Disposable fixtures own their internal projects; the repository harness owns only the outer workspace and receipt.
- Affected areas:
  - scripts/agent-evaluation-campaigns.mjs and new local execution/receipt helpers.
  - verification contracts, fake fixtures, and focused harness tests.
- Constraints:
  - No real provider, credentials, publication, Git delivery, or destructive workspace operation.
  - Preserve unrelated dirty-worktree changes and keep generated reports under ignored artifacts.

## Tasks
- [x] Define the local execution receipt schema and adapter boundary in verification/harness/local-execution.mjs.
- [x] Replace preconstructed host traces with observed receipts for local command and disposable fixture runs.
- [x] Add negative tests for command failures, leakage, unavailable capabilities, and synthetic-run rejection.
- [x] Keep fake-provider mode explicit and verify real-provider rejection.
- [x] Make host-deterministic failures authoritative for the final run result while retaining product_result independently.
- [x] Parse settled worker receipts from both wait and release host lifecycle events.
- [x] Require isolated user context for real provider entrypoints and pass only explicit auth, base URL, and model catalog inputs.
- [x] Return a non-zero CLI exit code when a `run` result is adjudicated as failed, with an isolated fake-Codex regression.
- [x] Give managed-controller fixtures an explicit `node __RSP_CLI_MJS__` command boundary, rewritten to the current compiled `dist/cli.mjs` path instead of relying on global `rsp` or historical `npx` resolution.
- [x] Reject worker verification claims that report a command as passed when host evidence records the same command as failed.
- [x] Reconcile the provider-beta base snapshot hash after the fixture command-boundary correction.
- [x] Record final execution evidence in this Change.
- [x] Materialize a complete candidate Skill composition by preserving candidate-authored files and filling only missing `references/**` files from the matching product baseline.
- [x] Bind composition hashes and `expected_resources` checks to the effective variant composition installed in the disposable workspace.
- [x] Add regressions for candidate reference materialization, regular-file enforcement, composition-hash coverage, and fail-closed custom source omission.

## Verify
### Required
- Automated:
  - [x] `CI=true mise exec -- pnpm exec vitest run verification/tests/evaluation/managed-controller-contract.test.ts verification/tests/evaluation/managed-controller-beta-contract.test.ts verification/tests/release/release-provider-comparison.test.ts --no-file-parallelism` — 3 files and 94 tests passed; default candidate composition includes `rsp-manage/references/delegation.md`, candidate `SKILL.md` remains unchanged, and incomplete custom source fails closed.
  - [x] `CI=true mise exec -- pnpm run verify:test` — 103 files and 959 tests passed; no real provider was invoked.
  - [x] `CI=true mise exec -- pnpm run typecheck`, `CI=true mise exec -- pnpm run lint`, `CI=true mise exec -- pnpm run build`, `git diff --check` — all passed after candidate composition repair.
  - [x] `CI=true mise exec -- pnpm run verify:provider:fake` — passed; fake-provider accounting is explicit and `real_provider=false`.
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/agent-evaluation-platform.test.ts verification/tests/evaluation/agent-evaluation-suite.test.ts verification/tests/evaluation/verification-runtime-evidence-harness.test.ts --no-file-parallelism — passed; receipts come from processes, deterministic failures dominate, synthetic verified runs are rejected, and content changes to pre-existing dirty tracked paths are observed in workspace delta.
  - [x] `mise exec -- pnpm exec vitest run verification/tests/evaluation/verification-runtime-evidence-harness.test.ts verification/tests/evaluation/verification-orchestration-report-rebuild.test.ts --no-file-parallelism` — 2 files and 23 tests passed after resolving the review findings; ASCII and Unicode dirty-content regressions, nested host artifact snapshots, strict aggregate rejection, category-specific acceptance evidence, output-root symlink rejection, stale/malformed report rejection, truncated acceptance-report recovery, passed-aggregate step-status consistency, and AI/report projections are covered.
  - [x] `CI=true mise exec -- pnpm run verify:test` — 103 files and 956 tests passed; no real provider was invoked.
  - [x] `CI=true mise exec -- pnpm exec vitest run verification/tests/release/clean-install-check.test.ts verification/tests/evaluation/verification-orchestration-report-rebuild.test.ts verification/tests/evaluation/verification-runtime-evidence-harness.test.ts --no-file-parallelism` — 3 files and 27 tests passed; package artifact output rejects dangling symlinks, nested host artifacts remain observable, and package/build/generated-artifact oracle binding remains green.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run build`, and `git diff --check` — all passed after the correction.
  - [x] mise exec -- pnpm run verify:provider:fake — passed; fake-provider accounting is explicit and real_provider=false.
  - [x] git diff --check — passed.
### Optional
- Manual or environment:
  - [x] No manual or environment-only check is required for this local-only Change.
- Coverage:
  - Full provider acceptance remains outside this Change; one explicitly authorized Terra medium worker pilot was used only to validate runtime evidence ingestion and final-result adjudication.

## Blockers
- The runtime adapters are available, and non-isolated real provider execution is now fail-closed. The prior Terra medium pilot remains invalid for verified coverage because it was run before this composition repair and observed the then-missing candidate Skill reference; it must be rerun separately if fresh provider evidence is needed.
- The complete 55-scenario semantic campaign has not been run; provider cost and the unresolved runtime findings make a broad campaign premature.

## Review Resolution
- [x] Accepted P1 acceptance-plan completeness finding: acceptance report steps are bound to the exact ordered `RELEASE_ACCEPTANCE_STEPS` ID set before any project category can be verified; omitted required execution is now fail-closed.
- [x] Follow-up P1 resolution: acceptance reports reject duplicate or malformed steps, and a passed report requires every step to be passed; package/build artifact categories also require their owning step status.
- [x] Accepted P1 acceptance oracle finding: acceptance project identity, fixture metadata, coverage, and required checks are matched against the repository project catalog before category verification.
- [x] Accepted P1 path-boundary finding: acceptance output roots and report paths require realpath containment within the repository and output root.
- [x] Accepted P1 report-ownership finding: each local acceptance run uses an invocation-scoped output root and report timestamps must fall within the host receipt window.
- [x] Accepted P2 malformed-report finding: invalid JSON shape is treated as unverified evidence and cannot abort aggregate report generation.
- [x] Accepted P1 artifact-binding finding: `package-build` and `generated-artifacts` now require the package evidence identity, path, bytes, and SHA-256 to match a host-observed artifact; nested files under an observed output directory are recorded with their own bytes/hash, so an arbitrary 64-character hash cannot claim verification.
- [x] Accepted P2 artifact-output boundary finding: the final package artifact destination is atomically created with `wx`; existing and dangling symlink targets are rejected before any copy can escape the repository.
- [x] Accepted P1 runtime evidence finding: worker receipts are collected from both wait and release settlement events, while host deterministic failures remain authoritative over product self-report.
- Fresh verification: `CI=true mise exec -- pnpm exec vitest run verification/tests/release/clean-install-check.test.ts verification/tests/evaluation/verification-orchestration-report-rebuild.test.ts verification/tests/evaluation/verification-runtime-evidence-harness.test.ts --no-file-parallelism` (27 passed); `CI=true mise exec -- pnpm run verify:test` (103 files, 949 passed); typecheck, lint, build, and `git diff --check` passed. `CI=true mise exec -- pnpm run verify:local` produced the expected local `incomplete` result: 63/63 executed, 8 verified, 0 failed, 55 unverified, all 6 acceptance categories verified, 428 host-observed evidence records, 785,700-byte JSON and 826-byte Markdown reports, 26 fake-provider tokens, and real provider disabled. The acceptance report recorded `@oevery/rsp@3.3.0` package artifact `.cache/verification-acceptance/66551/1787811728379/20260827T062208546Z-32dae495f2-73408/artifacts/package.tgz`; host observation and package evidence both reported 166,644 bytes and SHA-256 `389358e2faf31aa7ff25e42a59f3bcc0814a5f077e015f6f76fa37456647f499`. The new dangling-symlink reproducer rejects the path and leaves the external target absent. The incomplete-step reproducer remains rejected for every acceptance category.
- Fresh runtime verification: CI=true mise exec -- node scripts/managed-controller-eval.mjs run managed-coordinated-parallel candidate --model AI-HUB/gpt-5.6-terra --effort medium --timeout-ms 300000 completed on August 27, 2026 with product_result: passed and final result: failed. Host evidence recorded one user-memory-read, missing rsp-manage/references/delegation.md, two dispatches, two releases, and aggregate npm test passed. The original projection exposed that one valid worker receipt arrived with close_agent rather than wait; after the release-receipt adapter fix, replaying the retained JSONL recovered both receipts, worker compliance passed with zero rejections or violations, and the final result correctly remained failed because contamination and the required-reference miss are authoritative. Usage was input 554,840 (cached 288,768; uncached 266,072), output 4,895, reasoning 879, total 559,735; no provider-capacity retry, push, publication, force-push, or unauthorized path was observed. This run is retained as failure/blocker evidence, not as verified coverage.
- Latest fresh verification after the runtime adjudication and release-receipt fixes: 103 test files and 952 tests passed; the focused managed-controller contract, beta contract, and observability checks passed; build, typecheck, lint, and git diff --check passed. No real provider was invoked by this regression suite.
- Latest isolation verification: the managed-controller contract suite passed 29 tests, including CLI and runner rejection before provider startup; fake codex execution paths remain covered separately. The full suite passed 103 test files and 954 tests; build, typecheck, lint, and git diff --check also passed. No real provider was invoked by this fix verification.
- Latest continuation verification: `CI=true mise exec -- pnpm exec vitest run verification/tests/evaluation/managed-controller-contract.test.ts verification/tests/evaluation/verification-runtime-evidence-harness.test.ts --no-file-parallelism` passed 2 files and 38 tests; the failed-run CLI exit code, compiled-CLI path substitution, host-vs-worker verification conflict, release-settlement receipt recovery, isolation guards, and sanitization checks are covered. `CI=true mise exec -- pnpm run verify:test` passed 103 files and 957 tests; `CI=true mise exec -- pnpm run typecheck`, `CI=true mise exec -- pnpm run lint`, `CI=true mise exec -- pnpm run build`, and `git diff --check` passed. No real provider was invoked.
- Fresh isolated Terra medium pilot: `managed-coordinated-parallel / candidate` ran once on August 27, 2026 with no provider retry, no capacity failure, no context contamination, no command failure, two host dispatches, two settlements, two release events, two parsed worker receipts, and passing aggregate `npm test`. Product result and worker compliance passed, but final result was `failed` because required `rsp-manage/references/delegation.md` was not host-observed; model-invocation telemetry remained unavailable. Usage was input 267,841 (cached 118,272; uncached 149,569), output 4,394, reasoning 736, total 272,235. The run is valid failure evidence, not passing coverage.
