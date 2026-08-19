---
kind: ops
---

# Change: release-acceptance-campaign

## Proposal
- Outcome: Provide a reusable serial release-acceptance runner that dynamically discovers project scenarios and emits one auditable report
- Why:
  - The strengthened campaign now covers the historical friction paths, but execution evidence remains split across package scripts, test output, the Change, and environment-specific cache artifacts. Future releases need one repeatable entry point whose scenario count may grow without weakening stable coverage obligations.
- Scope:
  - Make the decisive local release suite serial across test files and shared release resources.
  - Exercise the installed tarball through fresh-project, compatible-upgrade, lifecycle, recovery, Specs, Skill installation, configuration rejection, and exact local commit flows.
  - Execute fresh real-host managed-work and real-terminal acceptance against the current checkout, recording unavailable environment coverage truthfully.
  - Replace shell-only orchestration with a serial runner that supports plan mode, dynamic project-scenario discovery, immutable run directories, and JSON plus Markdown reports.
  - Exercise sanitized real-project shapes for complex existing RSP state, dirty Git worktrees, Unicode content, and nested monorepo files without retaining private source material.
  - Compare one explicit previous release with the current candidate through repeated serial provider runs, retaining correctness-first token and latency evidence without provider or session data.
  - Migrate release/package tests only where the runner or scenario catalog becomes the real owner; retain focused tests that protect independent failure contracts.
  - Reduce package scripts to operator-facing release workflows and route internal checks directly from the acceptance runner.
  - Condense the maintainer Skill around explicit mode selection, decisive evidence, and authority stops.
  - Fail closed with a sanitized report when a provider arm emits a malformed evaluation receipt or otherwise cannot produce structured metadata.
- Non-goals:
  - Select a new release version, write release notes, publish, push, tag, or deploy.
  - Remove bounded parallelism from ordinary development tests or replace focused unit and contract coverage.
  - Reintroduce Workspace, Broker, Runtime, Web, or another persisted execution system.
  - Treat a fixed test count as release authority, mutate registered source projects, or infer publication permission from a passing report.
  - Treat one provider sample, lower token use, or an uncalibrated percentage as release authority.

## Spec
### ADDED
- Requirement: Serial release acceptance
  - One version-neutral command runs Skill security, metadata, bilingual documentation, build, typecheck, lint, the complete Vitest suite without file parallelism, and the clean installed-package flow in a fixed fail-fast order.
  - The ordinary development test command retains bounded parallelism; controlled concurrency remains inside isolated tests that explicitly own that behavior.
- Requirement: Installed-package workflow coverage
  - The package gate uses the packed tarball and installed binary in temporary real filesystem and Git repositories rather than importing source implementation functions.
  - It covers fresh initialization and Skill discovery, direct Specs inspection, a complete Change lifecycle with Focus Capsule recovery, exact staged Commit behavior with unrelated dirty work, compatible 3.2.0 update, and fail-closed unsupported configuration.
  - Removed commands and package surfaces remain absent, and every temporary resource is cleaned after success or failure.
- Requirement: Environment acceptance remains truthful
  - Real host-agent and interactive-terminal checks run serially outside the deterministic package script because provider and PTY resources are environment-owned.
  - Missing provider, worker identity, PTY, or other required environment evidence remains an explicit incomplete gate rather than an inferred pass.
- Requirement: Previous-release provider comparison
  - One separate maintainer command binds an explicit previous `v*` release tag and the current candidate to exact source, Skill-composition, holdout-contract, fixture, and harness identities before provider execution.
  - It runs at least three baseline/candidate pairs serially with one shared model, effort, prompt, current CLI, fixture, and harness, then writes non-overwriting JSON and Markdown reports.
  - Correctness, compliance, boundary, and task-result evidence precede efficiency interpretation. Reports retain sanitized input, output, and total-token medians, tool-call and elapsed-time medians, candidate deltas, and each arm's range without provider settings, sessions, prompts, raw events, or workspace paths.
  - Correctness failure or identity drift fails the comparison. Missing usage, unavailable execution, or incomplete pairs remain incomplete or unavailable rather than passing; token and latency deltas have no implicit release threshold.
- Requirement: Dynamic acceptance plan and report
  - One Node.js runner discovers the current deterministic steps and registered project scenarios, validates stable coverage tags, and executes shared resources serially in a fixed fail-fast order.
  - `--plan` returns the exact discovered steps, project scenarios, coverage tags, and omissions without executing release checks.
  - Every executed run writes a new non-overwriting directory containing machine-readable JSON and a concise Markdown report with source identity, environment, per-step status and duration, dynamic counts, package evidence, coverage, omissions, and the final `passed`, `failed`, or `blocked` verdict.
  - Reports and logs remain ignored local evidence by default; the Change retains only sanitized decisive evidence.
- Requirement: Dynamic real-project coverage
  - Project scenarios are declared in a dedicated registry that references immutable or reusable repository fixtures, discovered in stable order, copied to isolated temporary roots, and never run against the registered source directory.
  - Scenario quantity is dynamic, while required coverage categories remain stable and fail closed when no registered scenario owns them.
  - Required project coverage includes an existing non-RSP repository adopting RSP, a frozen published-version repository upgrading through the installed candidate, complex existing RSP state, a staged plus unstaged plus untracked Git worktree, nested monorepo files, and Unicode content.
  - Every manifest records only an anonymous source category, sanitization version, and fixture SHA-256; discovery rejects fixture drift, and execution proves the registered source fixture remains unchanged.

### Acceptance
#### Scenario: A release candidate is evaluated through historical friction paths
- GIVEN a clean source checkout, its packed package, the frozen 3.2.0 compatibility fixture, a real Git executable, and the required host and terminal capabilities
- WHEN the release acceptance plan or campaign runs
- THEN discovery is deterministic, coverage obligations are explicit, execution remains serial, installed CLI and isolated project workflows prove their observable outcomes, and one report records dynamic counts and truthful omissions without silent skipping

## Design
- Approach:
  - Keep ordinary `test` behavior unchanged and make `release:acceptance` directly invoke the complete Vitest suite without file parallelism from the Node.js runner used by the exact candidate gate.
  - Extend the existing clean-install checker instead of adding a second pack/install implementation; project workflow scenarios reuse the one installed binary and distinct temporary roots.
  - Keep provider-backed and PTY checks as explicit Change verification because they cannot be deterministic package-manager lifecycle hooks.
  - Reuse the managed-controller holdout and observability producer, but permit an explicit immutable Skill-source directory so the previous release cannot silently resolve to current product Skills.
  - Keep deterministic step definitions and report generation in the runner, installed-package and project behavior in the clean-install checker, and workflow guidance in one repository-local maintainer Skill.
- Boundaries:
  - Release orchestration owns ordering only; Vitest tests own deterministic behavior, the package checker owns installed CLI/filesystem/Git evidence, and host/manual verification owns provider and terminal evidence.
  - Provider comparison isolates Skill-composition changes by sharing the current CLI and harness; it is not a full historical runtime benchmark or a provider-general productivity claim.
  - Suite-level serialization must not replace intentional lock, concurrent-replacement, cancellation, or resource-conflict scenarios.
  - Dynamic discovery changes scenario cardinality, not the required coverage contract; no random sampling or network checkout is part of the decisive local gate. Scenario metadata remains outside frozen compatibility snapshots so their published evidence stays byte-exact.
  - Sanitized fixtures preserve only the directory depth, file types, RSP state combinations, Git state combinations, and language characteristics needed to reproduce observed friction; credentials, private URLs, identities, production data, and source Git history remain excluded.
- Affected areas:
  - `package.json`, `scripts/release-acceptance.mjs`, `scripts/clean-install-check.mjs`, fixture scenario manifests, and release/package contract tests
  - `scripts/release-provider-comparison.mjs`, the managed-controller evaluation source seam, and provider-comparison contract tests
  - repository-local release-acceptance Skill guidance
  - `.rsp/specs/distribution.md` and this Change's final verification evidence
- Constraints:
  - Use `mise exec -- pnpm ...`, preserve npm 10 clean pack output, avoid credentials in retained output, and do not mutate the current repository through installed-package scenarios.
  - Run shared `dist`, package, Git, provider, and PTY resources sequentially.
  - Do not overwrite an existing report directory, include credentials or absolute registered-project paths in reports, or modify fixture source directories.

## Tasks
- [x] Add the serial release acceptance command composition without changing ordinary development-test concurrency.
- [x] Extend packed-install verification through fresh lifecycle, Focus Capsule, exact Commit, 3.2.0 migration, and unsupported-config flows.
- [x] Add focused regression coverage and update the distribution contract for the strengthened gate.
- [x] Execute deterministic, real-host, and real-terminal acceptance serially and retain only decisive evidence and real omissions.
- [x] Add the reusable serial runner with deterministic plan mode and immutable JSON/Markdown report output.
- [x] Add stable-tag dynamic project discovery with isolated fresh-adoption and published-upgrade scenarios.
- [x] Migrate release orchestration assertions and package acceptance checks to their smallest real owner while retaining independent failure-contract tests.
- [x] Add repository-local Skill guidance for plan, execution, report interpretation, exact-candidate follow-up, and authority stops.
- [x] Add sanitized complex-RSP, dirty-worktree, and Unicode-monorepo scenarios with anonymous provenance, fixture fingerprints, and source immutability checks.
- [x] Execute the expanded reusable campaign and replace prior evidence with the final report identity, dynamic counts, coverage, and omissions.
- [x] Add a repeated previous-release versus candidate provider comparison with fixed identities, correctness-first token aggregation, and sanitized non-overwriting reports.
- [x] Reduce package scripts to operator-facing release workflows and route internal checks directly from the runner.
- [x] Condense the release-acceptance Skill around mode selection, decisive evidence, and authority stops.
- [x] Harden the evaluation receipt prompt with one exact complete JSON shape and make provider-arm exceptions produce sanitized failed or unavailable reports.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/compatibility-migration.test.ts test/release-acceptance.test.ts test/release-candidate-check.test.ts test/clean-install-check.test.ts --no-file-parallelism` — passed 4 files / 31 tests; proves frozen fixture integrity, dynamic planning/reporting, source and fixture fingerprinting, manifest path safety, publication routing, installed project scenarios, package behavior, and cleanup
  - [x] `mise exec -- pnpm run release:acceptance` — passed 9/9 serial steps, 77/77 test files, 846/846 tests, all 5 dynamic project scenarios, and all 6 required project categories after provider-comparison integration; the fresh non-overwriting report under `.cache/release-acceptance/` owns its exact source fingerprint, fixture fingerprints, tarball SHA-256, timings, and omissions
  - [x] `mise exec -- pnpm exec vitest run test/release-provider-comparison.test.ts test/managed-controller-beta-contract.test.ts test/release-acceptance.test.ts --no-file-parallelism` — passed 3 files / 32 tests; proves explicit historical Skill-source installation, release-tag and identity pinning, three-pair minimum, correctness-first interpretation, token medians and ranges, sanitized reporting, unavailable usage handling, and deterministic-runner routing
  - [x] `mise exec -- pnpm exec vitest run test/release-acceptance.test.ts test/release-candidate-check.test.ts test/release-provider-comparison.test.ts --no-file-parallelism`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed 3 files / 23 tests plus typecheck and lint after reducing package scripts to the three operator-facing release workflows and routing metadata, serial Vitest, and package checks directly from the runner
  - [x] Skill Creator `quick_validate.py .agents/skills/release-acceptance` — passed using an existing local PyYAML runtime; proves the condensed mode-selection Skill retains valid frontmatter and instructions without adding a project dependency
  - [x] `mise exec -- pnpm exec vitest run test/release-provider-comparison.test.ts test/managed-controller-beta-contract.test.ts --no-file-parallelism`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and Skill Creator validation — passed 2 files / 25 tests plus static and Skill checks; proves the complete receipt JSON prompt, strict validator compatibility, sanitized arm-failure report, and omission of raw provider errors
  - [x] `node scripts/release-provider-comparison.mjs --plan --json --baseline-ref v3.2.0 --repetitions 3` — resolved `v3.2.0` to commit `3205aba11ac665dcf791b2339f19d53789c1fe21`, fixed distinct baseline and candidate Skill-composition hashes plus contract, fixture, harness, and candidate-source identities, and selected three serial pairs without provider execution
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors / 0 warnings and no whitespace errors; proves the converged Change and diff remain clean after migration
- Environment:
  - [x] `node scripts/managed-controller-beta.mjs run --model combo/gpt-5.6-terra --effort high --timeout-ms 600000 --output-root .cache/release-acceptance-campaign/managed-retry` — passed 33 deterministic contracts, baseline and product contracts, compliance, boundary, and task-result checks with no unauthorized paths or missing expected output. The first run exhausted the default 300020 ms product budget without a final response; the fresh 600000 ms rerun passed, so the observed friction is the default harness budget rather than a product regression. Trigger, first-fix, worker lifecycle, dispatch count, and provider generality remain outside observable proof.
  - [x] `node dist/cli.mjs ui --lang en` in a real PTY — observed focused Work list, semantic and Markdown Change detail, Specs list and rendered detail, bounded History list and structured detail, and normal `q` exit with status 0
  - [x] First authorized `release:provider-compare` execution against `v3.2.0` — the first baseline provider task completed but emitted `{ identity, observations }` instead of the required four top-level receipt keys, so validation failed closed before candidate execution. The run exposed and motivated the exact-shape prompt plus guaranteed sanitized-report correction; its token output is diagnostic only and is not comparison evidence.
### Optional
- Manual or environment:
  - [ ] Run `mise exec -- pnpm run release:provider-compare -- --baseline-ref v3.2.0 --repetitions 3 --model <model> --effort <effort>` serially when provider budget and exact candidate identity are authorized; inspect the generated aggregate report without retaining raw provider configuration.
  - [ ] After a new version identity and release surfaces exist, rerun `mise exec -- pnpm run release:candidate-check` against the exact release commit.
- Coverage:
  - Publication, registry reconciliation, external push/tag/release, and cross-platform Windows terminal acceptance remain outside this Change.

## Blockers
- none
