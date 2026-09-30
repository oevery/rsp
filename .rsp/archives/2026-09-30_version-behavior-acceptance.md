---
kind: "ops"
---

# Change: version-behavior-acceptance

## Proposal
- Outcome: Replace the fragmented evaluation/release infrastructure with code tests and a shared realistic Skill validation matrix.
- Scope: tests, runner, projects, shared configuration, package/install checks, active consumers, maintainer instructions and current distribution truth. Existing uncommitted evaluation changes belong to this explicitly authorized reconstruction.
- Non-goals: Product Skill behavior changes, model campaigns in this implementation, staging, commits, archive, push, publication, global configuration, or rewritten historical verdicts.

## Spec
### MODIFIED
- Requirement: Code tests live under tests/code and assert observable CLI, TUI, installation and minimal runner boundaries; no Skill-body assertions or read-fingerprint gates.
- Requirement: Skill validation lives under tests/skills with shared projects, case tasks, suites, one runner/report and one executor/judge configuration. Each execution gets a fresh workspace.
- Requirement: Preserve small cases and supply runnable fixed-source real projects plus complex workflows. Record dependency provenance and prevent writes back into shared dependencies.
- Requirement: Independent candidate runs need no baseline, holdout or release-specific scoring. Offline readiness is not model acceptance. Keep failed/inconclusive results, explicit session budgets and independent semantic review.
- Requirement: Historical evals/reports and research/evaluations/version-behavior-acceptance remain unchanged.

### Acceptance
#### Scenario: Two truthful verification lanes
- GIVEN a selected case or suite and shared model configuration
- WHEN local checks or separately authorized model execution run
- THEN results state the evidence lane, actual configuration, project/input identity and scope without treating local adapters as model acceptance

## Design
- Retain the existing observable process, file/Git, native attribution and blind review seams; remove mandatory pairing, holdout, replay, and independent release machinery.
- Separate projects from case prompts; materialize fixed Git snapshots and copied dependency graphs into temporary workspaces. Single-skill and natural workflows share execution and report format.
- Keep prepublishOnly as a thin serial aggregation of code tests, offline matrix readiness and repository checks; it does not certify model quality or authorize publication.
- Maintainer Skills retain their existing trigger/authority/stop boundaries while using the new commands and proportional evidence selection.

## Tasks
- [x] Resolve overlapping ownership under this Change and preserve historical evidence.
- [x] Complete code-test relocation and package/install integration.
- [x] Complete shared Skill runner/config/projects/cases/suites and remove obsolete active consumers.
- [x] Update active docs, Specs and authored maintainer references.
- [x] Complete implementation checks and receive the main session's independent final validation, including fresh acceptance after custom test-watch removal.
- [x] Resolve the four authorized P2 review findings: freeze the selected external composition across the matrix; resolve project identities only after case selection; check native root and worker executor identities; correct the three Commit case IDs.
- [x] Remove the explicitly retired custom test-watch configuration, build setup, regression test and package entry; document build-first full and targeted CLI verification while preserving the development build watcher.

## Verify
### Required
- Final watch-removal acceptance supplied by the main session on 2026-09-30; the following current checks were executed by that session.
- [x] Fresh post-removal mise exec -- pnpm test builds first and passes 16 files / 89 tests in 107.18 seconds, including packed clean installation, custom-content preservation and the four-finding regression coverage.
- [x] Subsequent typecheck, lint and docs:check all exit 0; documentation checks cover 7 bilingual pairs / 31 Markdown files.
- [x] Full Skill offline readiness passes 46/46 cases, providerInvocations 0, behavioralAcceptance not-run.
- [x] Active reference scans find no test:watch, vitest.watch or watch-build references; all three retired files are absent and dev remains tsup --watch. git diff --check passes and the staging area is unchanged.
- Retained evidence from the earlier unchanged package/Skill scope, not rerun in this watch-removal acceptance: skills:package-check passed 9 packages and skills:security-check scanned 42 files with 0 findings.
- [x] Earlier fixed-scope read-only re-review: Code clean / Document clean, no residual findings or out-of-scope changes within the original four P2 findings, comparison 0cd01fd and the ten correction files. This result applies to those corrections, not a new review of the later watch removal.
- Finding dispositions: all four accepted and corrected. The re-review traced CLI selection through frozen composition to runCase, manifest selection through resolveCase to project identity, gradeEvidence through root/worker configuration grading, and the coverage table through the three actual Commit CLI IDs. The original review and historical reports remain unchanged.
- Evidence boundary: real/rsp-cli binds commit 0cd01fd14f9fd5735b0f79ec223b101d23bb0bfb and copied dependency content to four cases. Executor/judge configuration and failure controls were exercised with local fixtures only. No real model-backed task or judge acceptance was run.
### Optional
- [ ] Fresh model-backed matrix execution and independent judge acceptance, requiring separate authorization.
- Historical evidence: original paired Commit reports and both native failures remain in research/evaluations/version-behavior-acceptance/report.md and ignored evals/reports. They neither pass nor fail this newly authorized offline implementation boundary.

## Blockers
- None.
