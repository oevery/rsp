---
kind: "feature"
---

# Change: replay-provider-comparison-evidence

## Proposal
- Outcome: Provide trustworthy reusable provider-comparison evidence through deterministic replay and a representative routing/worker-topology scenario matrix.
- Why:
  - Harness-only corrections should be applied to intact historical observations without paying for or introducing variance from a new provider campaign when the compared Skill, contract, and fixture are unchanged.
- Scope:
  - Add an explicit `--replay-report` mode to `release:provider-compare`.
  - Validate the source report and every retained raw run before summarizing them with the current harness.
  - Produce a new non-overwriting sanitized JSON and Markdown report carrying bounded replay provenance.
  - Document and test the replay contract and candidate-check reuse.
  - Add a serial provider comparison matrix covering direct, managed solo, one delegated worker with integrated verification, one implementation worker plus independent verification, coordinated sequential workers, and coordinated parallel workers.
  - Require exact scenario coverage before candidate evidence is reusable.
- Non-goals:
  - Re-running, retrying, or contacting any provider.
  - Reinterpreting contaminated, failed, incomplete, or replacement-pair campaigns.
  - Relaxing the exact identity requirements of `release:candidate-check`.
  - Overwriting or editing the source report or raw evidence.
  - Executing the new provider matrix without separate provider-cost authority.
  - Aggregating efficiency measurements across scenarios with different workloads.

## Spec
### ADDED
- Requirement: Deterministic provider-evidence replay
  - Replay accepts only a passed `serial-paired` source report with exactly the requested number of clean eligible baseline/candidate pairs, no contamination, no incomplete pair, no identity issue, and no replacement attempt.
  - Baseline ref, baseline commit, baseline and candidate Skill-composition hashes, contract hash, and fixture hash must match the current comparison plan. Candidate commit, candidate source fingerprint, and source harness hash are provenance and may differ.
  - Each sanitized source run must map exactly once to a regular non-symlink raw metadata, events, and final-response file. Metadata identity, composition, contract, result, observation hash, receipt identity/hash, final hash, and stable measurements must validate through the current managed-controller summarizer.
  - Replay must reject provider execution options and must not invoke the evaluation runner.
  - A successful replay writes a new report with the current harness and candidate provenance plus only bounded source report hash, source harness hash, source candidate commit, and replay mode. Raw paths, provider settings, prompts, sessions, and events remain absent.
  - The existing candidate evidence checker consumes the replayed report without any weakened matching rule.
- Requirement: Representative provider scenario matrix
  - The matrix declares six immutable scenario identities with per-scenario pair counts and runs them serially under one provider/model/effort invocation.
  - Scenario coverage includes direct integrated work, managed solo execution, one delegated primary worker with integrated verification, one implementation worker plus one independent verifier, coordinated sequential workers, and coordinated parallel-wave workers.
  - Every scenario binds its own contract and fixture hashes while sharing exact baseline/candidate Skill compositions and the current harness identity.
  - Structured agent receipt evidence must satisfy each scenario's expected route, execution mode, dispatch topology, and worker-dispatch count; final prose alone cannot satisfy topology correctness.
  - Correctness and efficiency are reported per scenario. Cross-scenario token, tool-call, or elapsed-time aggregation is prohibited.
  - Candidate evidence reuse requires one passed report for every declared scenario with its configured complete eligible pair count. Missing or stale scenario evidence fails closed with a matrix handoff.
  - Single-scenario execution and replay remain available for diagnosis and recovery but do not satisfy the complete matrix gate alone.

### Acceptance
#### Scenario: Replay intact evidence after a harness-only change
- GIVEN a passed clean three-pair report whose compared Skill compositions, baseline commit, contract, and fixture still match the current plan, with intact matching raw artifacts
- WHEN `release:provider-compare -- --replay-report <report> --baseline-ref <ref> --repetitions 3` runs
- THEN no provider is called and a new passed sanitized report is written with the current harness identity and bounded replay provenance

#### Scenario: Reject stale or unsafe source evidence
- GIVEN a source with Skill, baseline, contract, or fixture drift, contamination, replacement attempts, incomplete or failed runs, missing raw files, symlinks, or mismatched metadata and hashes
- WHEN replay is requested
- THEN replay fails closed without writing a passed report or invoking a provider

#### Scenario: Reuse replayed evidence for the exact candidate
- GIVEN a successful replay report whose current baseline, Skill-composition, contract, fixture, and harness identities match the candidate plan
- WHEN candidate provider evidence is checked
- THEN the existing exact-match gate accepts the replayed report without special-case relaxation

#### Scenario: Run the complete provider matrix
- GIVEN the six declared routing/topology scenarios and authorized provider settings
- WHEN `release:provider-compare -- --matrix --baseline-ref <ref>` runs
- THEN all scenarios execute serially with their configured pair counts and write separate sanitized reports without cross-scenario efficiency aggregation

#### Scenario: Reject incomplete scenario coverage
- GIVEN one or more missing, failed, stale, contaminated, or topology-mismatched scenario reports
- WHEN candidate provider evidence is checked
- THEN the gate reports the missing scenario coverage and requires an explicit matrix run without invoking a provider itself

## Design
- Approach:
  - Build the current comparison plan, validate the sanitized source envelope, locate each raw run by pair attempt and arm, and pass trusted metadata plus final content through `summarizeManagedControllerBetaRun` and the existing sanitization/summary/rendering pipeline.
  - Rebuild the plan immediately before summary creation so concurrent source drift is surfaced by the existing identity-drift checks.
  - Load the matrix catalog from the managed-controller beta plan, derive one existing comparison plan per scenario, and reuse the existing serial paired runner for each scenario.
  - Keep reports scenario-local; campaign orchestration supplies identical provider settings and serial ordering without introducing a second aggregate efficiency format.
- Boundaries:
  - Raw evidence is local input only; the generated report remains the sole reusable release artifact.
  - Replay is intentionally limited to already-clean campaigns because raw events have no independent immutable content hash suitable for safely reclassifying arbitrary historical contamination.
- Affected areas:
  - `scripts/release-provider-comparison.mjs` and its declaration surface
  - `scripts/managed-controller-beta.mjs`, provider evidence checking, and the managed-controller beta catalog
  - managed-controller holdout manifests for the added routing/topology cases
  - release comparison/evidence-check tests
  - `.rsp/specs/distribution.md`
- Constraints:
  - Preserve serial execution and non-overwriting report directories.
  - Preserve the current candidate evidence check's exact harness and release-surface identity requirements.
  - Do not retain machine paths or provider-private values in the sanitized report.

## Tasks
- [x] Implement the replay API and CLI mode with fail-closed source and raw-artifact validation.
- [x] Add focused regression coverage for successful no-provider replay and unsafe/tampered source rejection.
- [x] Prove the replayed report passes the unchanged current candidate-evidence matcher.
- [x] Update the durable distribution specification and release-acceptance operating guidance.
- [x] Replay the retained v3.2.0 comparison into a fresh current-harness sanitized report without provider execution.
- [x] Add and validate the six-scenario provider matrix catalog and bounded holdouts.
- [x] Implement scenario-local planning, structured topology correctness, and serial `--matrix` campaign execution.
- [x] Require complete exact scenario coverage in the candidate evidence checker.
- [x] Add regression coverage for matrix planning, serial campaign execution, topology mismatch, and incomplete candidate evidence.
- [x] Update the durable distribution and release-acceptance contracts for matrix coverage.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` — passed, 2 files and 28 tests; proves replay behavior and exact-gate integration
  - [x] `mise exec -- pnpm run typecheck` — passed; proves declaration and implementation consistency
  - [x] `mise exec -- pnpm run lint` — passed; proves repository static quality gates
  - [x] `mise exec -- pnpm run build` — passed; proves the package CLI still builds
  - [x] `mise exec -- pnpm run test` — passed, 87 files and 887 tests; proves complete deterministic regression coverage
  - [x] `git diff --check` — passed; proves patch formatting integrity
  - [x] Direct `assessReleaseProviderEvidence` against the current `v3.2.0` plan and retained reports — returned `state: reused` for the replayed report; proves the unchanged exact matcher accepts it
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-beta-contract.test.ts test/evaluation/managed-controller-contract.test.ts test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` — passed, 4 files and 131 tests; proves the six-scenario catalog, prompt receipt contract, topology scoring, serial fail-fast matrix execution, one-pair replay compatibility, and complete candidate matrix gating
  - [x] `mise exec -- pnpm run typecheck` — passed; proves updated case, expectation, matrix plan, runner, and evidence result declarations
  - [x] `mise exec -- pnpm run lint` — passed; proves repository static quality gates
  - [x] `mise exec -- pnpm run build` — passed; proves the package CLI still builds
  - [x] `mise exec -- pnpm run test` — passed, 87 files and 895 tests; proves complete deterministic regression coverage including matrix-wide identity drift rejection
  - [x] `git diff --check` — passed; proves patch formatting integrity
  - [x] `node scripts/release-provider-comparison.mjs --plan --matrix --json --baseline-ref v3.2.0` — passed; exposes six serial scenarios and eight configured pairs without provider execution
  - [x] Direct `assessReleaseProviderEvidenceMatrix` against the current `v3.2.0` matrix and retained reports — returned `state: missing` with all six cases; proves legacy single-scenario evidence cannot satisfy the expanded matrix gate
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` — passed, 2 files and 35 tests after review resolution; proves a passed scenario with cross-scenario composition drift fails fast as `scenario-identity-drift`
### Optional
- Manual or environment:
  - [x] `mise exec -- pnpm run release:provider-compare -- --replay-report .cache/release-provider-comparison/20260820T044007105Z-3205aba11a-72409/report.json --baseline-ref v3.2.0 --repetitions 3` — passed and wrote `.cache/release-provider-comparison/20260820T064806599Z-3205aba11a-33931/report.json`; historical replay proof only, now superseded for release gating by the expanded scenario contracts and complete matrix requirement
- Coverage:
  - Provider execution is intentionally omitted. The historical replay proves the no-provider replay mechanism, but its report is stale for the expanded matrix and is not current release evidence.
  - The added matrix is deterministically planned and validated in this Change but remains provider-unexecuted until separately authorized.
  - The repository package version remains `3.2.0`, so the top-level candidate evidence command currently selects `v3.1.1` as its previous-release baseline; exact `v3.2.0` reuse is proven directly and becomes the normal command path after the next version identity is selected.

## Blockers
- none
