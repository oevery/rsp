---
kind: "refactor"
---

# Change: test-topology

## Proposal
- Outcome: Separate deterministic code verification, Skill evaluation datasets, and report-producing project acceptance
- Why:
  - The current verification tree mixes source-level contracts, CLI integration, Skill and agent evaluation datasets, release-runner contracts, sanitized project assets, and environment-backed comparison guidance. Ambiguous fixture ownership, a global build hook, and a shared integration harness hide execution boundaries and make targeted verification more expensive and less isolated than its evidence requires.
- Scope:
  - Make one code-verification entry point own the CLI build exactly once while preserving direct targeted Vitest execution after an explicit build.
  - Keep source unit, contract, and isolated CLI integration tests under test/, with only small test-local support data colocated beside its owning test.
  - Move reusable Skill and agent behavior fixtures, unseen holdouts, beta plans, and fake-provider inputs under a top-level evaluation/ boundary while keeping their deterministic contract tests under test/.
  - Move report-producing release project manifests and sanitized project fixtures under a top-level acceptance/ boundary and update every production consumer and contract test.
  - Split the aggregated integration entry into independently discoverable domain files and separate pure document builders from lifecycle hooks.
  - Split the mixed helper test file by production owner without changing its assertions or behavior.
  - Organize executable tests by their actual owner: mirror stable src/ module boundaries for source tests, and use explicit workflow directories for integration, Skill, evaluation, release, tooling, and architecture contracts.
  - Document when deterministic project acceptance and provider-backed old/new comparison run and which command owns each report.
- Non-goals:
  - Change product behavior, evaluation case content, acceptance coverage obligations, provider models, token thresholds, release authority, or publication flow.
  - Run real provider comparison for a test-topology-only change, make ordinary code tests depend on credentials, or make every project acceptance scenario a baseline/candidate benchmark.
  - Maximize parallelism, rewrite all test helpers, or add a new test framework.

## Spec
### MODIFIED
- Requirement: Verification topology
  - pnpm test runs deterministic code verification and owns any required CLI build exactly once; Vitest itself has no unconditional global build side effect during non-watch execution.
  - Code verification includes source-level unit and contract tests plus isolated CLI integration files. Small test-local support data may remain under test/, but reusable Skill and agent fixtures, holdouts, beta plans, and fake-provider inputs live under evaluation/ and are never collected as code tests by location.
  - Tests that directly exercise one stable src/ owner live under the matching test/<owner>/ directory. Cross-module and non-src contracts are grouped by their evidence owner rather than forced into a source mirror.
  - Deterministic evaluation contracts may run inside pnpm test, while provider-backed, token-bearing, or retained-evidence evaluation campaigns remain explicit environment-owned commands. Moving evaluation data never makes credentials or provider execution a dependency of ordinary code verification.
  - Report-producing real-project assets live under acceptance/; release acceptance copies them to temporary roots and never mutates their registered sources.
  - Release acceptance runs deterministic code verification serially against the already-built candidate, then packed installed-package and sanitized-project workflows, and emits the existing non-overwriting JSON and Markdown report.
  - Provider comparison remains a separate environment-owned baseline/candidate command, required when the compared Skill behavior or an explicit release evaluation needs token, tool-call, latency, and correctness evidence; ordinary project acceptance validates the candidate against stable contracts without requiring a historical arm.

### Acceptance
#### Scenario: A maintainer selects the evidence level for a change
- GIVEN deterministic code changes, reusable Skill evaluation datasets, report-producing sanitized projects, and optional provider-backed Skill evaluation
- WHEN the maintainer runs code verification, release acceptance, or provider comparison
- THEN each command executes only its owned evidence boundary, project fixtures are not discovered as Vitest tests, shared build and cwd state do not leak across owners, and report-producing commands retain truthful dynamic evidence

## Design
- Approach:
  - Replace the non-watch global build hook with an explicit code-test command that builds once, while a watch-only Vitest configuration retains rebuild-on-rerun behavior.
  - Keep Vitest as the code-test engine and prevent ordinary discovery from crossing into top-level evaluation/ or acceptance/ project data.
  - Move reusable behavior datasets by current capability owner into evaluation/<owner>/ while preserving fixtures, holdout, beta, base, changed, and case manifest semantics. Keep artifact-continuation and status oracle data under test/ because each is small and exclusively owned by one deterministic test contract.
  - Move release acceptance project assets to acceptance/fixtures and acceptance/projects; keep only genuinely test-local fixtures beside their owning tests.
  - Mirror the stable src/ owners core, commands, cli, history, specs, status, and tui under test/ where tests directly exercise those modules. Group remaining executable tests under integration, evaluation, skills, release, tooling, and architecture. Do not introduce a redundant unit/ layer or require one test file per source file.
  - Replace the single integration aggregator with one entry per current command domain. Each entry imports the shared lifecycle harness and exactly one behavior module, allowing Vitest worker isolation to bound process cwd state.
  - Extract pure Change and Group renderers from the integration harness before reusing them from source-level tests.
- Boundaries:
  - test/ owns executable deterministic code evidence and small single-owner support data; evaluation/ owns reusable Skill and agent evaluation inputs; acceptance/ owns project inputs used by report-producing release campaigns; scripts/release-acceptance.mjs owns serial campaign ordering and reports.
  - Directory placement follows the primary evidence owner. Direct source tests use the source module owner; workflow tests remain cohesive even when they cross multiple source modules.
  - Build output remains repository-global, but only the selected command owns when it is refreshed. Integration temporary repositories remain per test file and never become acceptance fixtures.
  - Release source identity must remain computable for large path-only migrations; Git diff capture uses a bounded enlarged buffer rather than silently degrading the dirty candidate fingerprint to null.
  - Provider comparison consumes explicit immutable baseline and candidate identities and remains outside pnpm test and deterministic release acceptance.
- Affected areas:
  - package.json, Vitest configuration and setup, integration entries/harness, mixed helper tests
  - evaluation/, evaluation dataset consumers and contracts, current maintainer guidance
  - acceptance/, release scenario discovery, clean-install compatibility fixtures, release acceptance contracts and distribution Spec
- Constraints:
  - Preserve existing public commands, all current assertions and required project coverage tags, evaluation and acceptance source immutability, dynamic counts, sanitized reports, and ordinary development concurrency.
  - Run migration serially and keep provider credentials, raw provider output, absolute project paths, and cache reports outside tracked files.

## Tasks
- [x] Establish explicit code-test and watch build ownership and remove the unconditional non-watch Vitest build hook.
- [x] Move release acceptance project manifests and fixtures to the acceptance boundary and update all consumers.
- [x] Replace manual fixture exclusions with structural collection rules and protect the boundary with focused contracts.
- [x] Split integration execution by domain and extract pure fixture builders from lifecycle setup.
- [x] Split mixed helper coverage by production owner while preserving assertions.
- [x] Update release guidance and durable distribution truth for the three execution modes.
- [x] Move reusable Skill and agent behavior datasets from test/ to evaluation/ without changing case content or fixtures-versus-holdout semantics.
- [x] Update every current evaluation script, deterministic contract, fake-provider reference, and maintainer contract to use the evaluation boundary.
- [x] Document the test/, evaluation/, and acceptance/ ownership contract and keep historical retained reports immutable.
- [x] Run focused topology checks, the complete deterministic code suite, deterministic evaluation contracts, and the serial release acceptance campaign.
- [x] Move root-level executable tests into source-owner and workflow-owner directories without changing assertions.
- [x] Move single-owner fixture and watch support beside their owning test surfaces and update every relative import, path contract, and configuration consumer.
- [x] Extend the topology contract and maintainer guidance to preserve the hybrid source-mirror/workflow layout.
- [x] Keep release source fingerprinting valid when the migration produces a Git diff larger than the process default buffer.
- [x] Re-run focused owner tests, the complete deterministic suite, static checks, and serial release acceptance after the executable-test migration.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/architecture test/core test/commands test/cli test/history test/specs test/integration test/evaluation test/skills test/release test/tooling --no-file-parallelism` — passed 69 files / 756 tests; proves every moved source-owner and workflow-owner test, local fixture, integration entry, evaluation loader, release contract, and large-diff provider fingerprint contract passes from its new path.
  - [x] `mise exec -- pnpm exec vitest --config vitest.watch.config.ts run test/architecture/watch-build-setup.test.ts` — passed 1 file / 1 test; proves the relocated watch-only setup remains configured and executable.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and Skill Creator `quick_validate.py .agents/skills/release-acceptance` — passed after migration.
  - [x] `mise exec -- pnpm test` — passed 85 files / 850 tests after one explicit CLI build; proves the complete deterministic suite passes through its public entry point with no executable tests at the test root.
  - [x] `mise exec -- pnpm run release:acceptance` — passed 9/9 serial steps, 85/85 files, 850/850 tests, all 5 projects, and all 6 required project categories; report `.cache/release-acceptance/20260819T062127907Z-c9de6fdaa7-92508/report.md` records source fingerprint `893ba6c5b2c9d5ad5df7d0eb6573017a2be031fa01ce1eaf7bdd7891f07cc6b7`.
### Optional
- Manual or environment:
  - [ ] Run release:provider-compare only when a compared Skill behavior or explicit release evaluation changes; this topology-only migration does not claim new provider evidence.
- Coverage:
  - Cross-platform Windows execution, registry reconciliation, publication, push, tag, and hosted release remain outside this Change.

## Blockers
- none
