---
kind: "refactor"
---

# Change: remove-workspace-and-converge-git-delivery

## Proposal
- Outcome: Remove the unreleased RSP-owned Workspace and Land subsystems, keep Manage independent of execution-location isolation, and retain exact local Git delivery through Commit.
- Why:
  - Workspace was introduced after the published v3.2.0 boundary as a trial for isolated managed execution, but repository dogfooding showed repeated selection, handoff, landing, cleanup, and recovery friction disproportionate to its low-frequency value.
  - Mainstream hosts already own local worktrees or isolated cloud environments, while RSP's durable value is work ownership, authority, evidence, lifecycle, and exact local commit boundaries rather than execution-environment management.
  - The trial is not publicly released: npm latest and the v3.2.0 tag predate the Workspace implementation, and this checkout has no active Workspace records.
  - Retaining compatibility or another observation period would preserve substantial Core, Manage, configuration, CLI, Skill, documentation, and test complexity for an unproven capability.
- Scope:
  - Remove Workspace policy, selection, status, registry, process/resource management, CLI commands, Skill inventory, documentation, Specs, and deterministic tests.
  - Remove the Workspace-bound Land command and Skill.
  - Keep Manage automatic qualification and execution fully usable in the observed current checkout without isolation language or requirements.
  - Converge the reusable exact-boundary guarantees into rsp-commit: exact owner and staged paths, current Git-operation safety, before/after HEAD observation, complete message/path receipt, and truthful remaining worktree state.
  - Record the failed Workspace trial and the lasting execution-environment ownership decision without rewriting retained Change archives or upstream research.
- Non-goals:
  - No host-native worktree wrapper, optional plugin, compatibility alias, migration command, cross-branch cherry-pick, automatic handoff, or remote delivery.
  - No weakening of dirty-worktree preservation, worker coordination, verification, lifecycle, commit, or publication authority boundaries.
  - No rewriting historical archives that truthfully record the trial and its prior implementation evidence.

## Spec
### MODIFIED
- Requirement: RSP does not own execution-environment isolation.
  - Core and Manage operate against the actual checkout observed by the host and never select, prepare, persist, land, dispose, or recover a product Workspace.
  - Local worktrees, containers, cloud VMs, and cross-branch integration remain explicit host, Git, or user concerns outside canonical RSP workflow state.
- Requirement: Manage remains independent from isolation.
  - Automatic Manage qualification, worker dispatch, resource coordination, acceptance, lifecycle closeout, and commit eligibility use owner, authority, seam, resource, and evidence facts without a WorkspaceSelection or Workspace capability.
- Requirement: Commit owns one exact local Git delivery boundary.
  - Commit stages only the authorized owner paths, refuses ambiguous or incompatible Git state, creates one local commit in the current checkout, and reports exact before/after HEAD, message, committed paths, and remaining worktree paths.
  - Commit never cherry-picks into another branch, cleans another checkout, or infers push/publication authority.
- Requirement: The failed Workspace trial remains historically visible.
  - A Decision Record explains why the unreleased trial was removed and assigns execution-location isolation to the host or Git rather than Core or Manage.
  - Existing archives and upstream research remain unchanged historical evidence.

### Acceptance
#### Scenario: Ordinary managed execution has no Workspace dependency
- GIVEN a ready Change qualifies for Manage
- WHEN Core and Manage route, dispatch, verify, and close out the goal
- THEN they use the observed current checkout without reading Workspace policy, producing WorkspaceSelection, or loading rsp-workspace

#### Scenario: The public product has no Workspace surface
- GIVEN a generated, updated, installed, or self-hosted RSP project
- WHEN configuration, status, CLI help, Skill inventory, docs, and package contents are inspected
- THEN no Workspace activation, Workspace command, rsp-workspace Skill, rsp-land Skill, or rsp land command is present

#### Scenario: Commit preserves exact local delivery
- GIVEN one authorized RSP owner with a reviewed staged boundary and no conflicting Git operation
- WHEN rsp-commit creates the local commit
- THEN it verifies the exact staged paths, records before and after HEAD, returns the complete stored message and committed paths, and leaves unrelated work untouched

#### Scenario: Cross-branch integration stays external
- GIVEN implementation occurred in a host-selected worktree or another branch
- WHEN RSP returns a verified local commit SHA
- THEN host or user Git tooling owns any handoff or cherry-pick and RSP performs no hidden landing or cleanup

#### Scenario: Failed trial remains explainable
- GIVEN a maintainer later asks why Workspace was removed
- WHEN current Specs, the Decision Record, and retained archives are inspected
- THEN they show that the post-v3.2.0 trial was tested, caused disproportionate routing and lifecycle friction, was never publicly released, and was removed before release

## Design
- Approach:
  - First preserve the reusable Commit invariants with focused tests, then remove Workspace and Land from outer contracts inward: Core/Manage model, package inventory/config/status, CLI/runtime, docs/Specs, and tests.
  - Treat execution location as an observed field of Manage's transient ExecutionFrame, not a selected or persisted RSP concept.
  - Delete the complete Workspace implementation rather than retain a partial prepare-only or recovery-only subsystem.
  - Keep historical archives and research immutable; write one current Decision Record for the lasting ownership choice.
- Boundaries:
  - Host and Git own checkout/worktree/VM selection and cross-branch integration.
  - Manage owns coordination and acceptance in the observed checkout.
  - Commit owns exact staging, one local commit, and its receipt; it does not absorb Land's cherry-pick or cleanup behavior.
- Affected areas:
  - Core/Manage/Implement/Commit Skills, control and core Specs, fallback rules, package Skill inventory, configuration, status, CLI registration and presentation.
  - Workspace/Land source modules, tests, integration fixtures, clean-install/package checks, and bilingual documentation.
- Constraints:
  - Preserve Manage activation and closeout behavior, unrelated dirty work, exact Git authority, historical archives, upstream research, and host-neutral execution.
  - Do not introduce another execution-location abstraction, compatibility state, migration registry, or hidden lifecycle.

## Tasks
- [x] Add or update focused Commit tests for current Git-operation refusal and exact before/after HEAD plus committed-path receipt.
- [x] Remove WorkspaceSelection, Workspace policy, and Workspace language from Core, Manage, Implement, fallback, and durable control models.
- [x] Remove Workspace and Land Skills, package inventory, CLI commands, source modules, status projections, configuration fields, docs, and dedicated tests.
- [x] Keep generated and self-hosted configuration valid without Workspace and synchronize the authored fallback.
- [x] Add a Decision Record documenting the failed unreleased trial, alternatives, and host/Git ownership boundary.
- [x] Run focused contract, configuration, status, commit, packaging, and integration tests.
- [x] Run build, typecheck, lint, docs check, full tests, package/release checks, rsp check, and diff hygiene.
- [x] Record decisive evidence, omissions, and remaining risks.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/commit.test.ts test/config.test.ts test/status/status-boundary.test.ts test/status/plain-dense.test.ts test/rsp-core-routing-contract.test.ts test/skill-contract.test.ts test/project-skill-dogfood.test.ts test/skills-install.test.ts test/clean-install-check.test.ts test/daily-workflow-product-surface.test.ts test/native-design-composition.test.ts --maxWorkers=1` — 11 files and 98 tests passed, including exact rename-boundary observation; proves the removed public surface and retained exact local commit contract.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test` — build, typecheck, lint, 7 bilingual page pairs and 30 Markdown files, plus 71 files and 792 tests passed.
  - [x] `node dist/cli.mjs update`, `mise exec -- pnpm run release:metadata-check`, `mise exec -- pnpm run docs:build`, `mise exec -- pnpm run skills:security-check`, `mise exec -- pnpm run release:package-check`, `node dist/cli.mjs check --focused --json`, and `git diff --check` — generated fallback synchronized; docs build, 38-file Skill security preflight, release metadata, clean packed install with 13 Skills and no Workspace/Land surface, focused structural check with 0 errors and 0 warnings, and diff hygiene all passed.
### Optional
- Manual or environment:
  - [ ] One host-native worktree handoff comparison — optional because RSP no longer owns or promises host integration behavior.
- Coverage:
  - Deterministic tests cover the absence of RSP Workspace/Land surfaces and exact current-checkout commit behavior; they do not claim host-native worktree or cloud-VM compatibility.
  - The optional host-native worktree handoff comparison was not run because execution-location integration is explicitly outside the RSP product contract.

## Blockers
- none
