---
kind: "feature"
---

# Change: workspace-isolated-execution

## Proposal
- Outcome: RSP can create, resume, operate, recover, land, and safely dispose an isolated Git worktree for one selected WorkOwner without disturbing unrelated changes in the target worktree or embedding a project execution engine in the CLI.
- Why:
  - Concurrent Changes and Groups currently share one worktree, so unrelated edits and fixed runtime resources can interfere.
  - Git worktree mechanics alone do not provide environment inheritance, project-aware operation, recoverable long-running activities, shared-resource coordination, or exact delivery.
- Scope:
  - Add an opt-in workspace lifecycle to the CLI for an explicit RSP WorkRef.
  - Use the stable branch name `rsp/<workref>` and resume an existing registered workspace instead of generating session branches.
  - Expose deterministic workspace facts while leaving project-semantic setup, verification, preview, and command execution to the active AI or human through host-native capabilities.
  - Register host-started activities and cooperative exclusive resources so later sessions can stop or dispose them safely.
  - Land explicitly selected commits into an explicit target branch while preserving conflicts and unrelated target changes.
  - Add `rsp-workspace` and `rsp-land` Skills and compose them with Core, Manage, Implement, Review, and Commit.
- Non-goals:
  - Do not move ordinary temporary work into worktrees.
  - Do not embed project frameworks, task runners, package managers, service names, or project-specific infrastructure in the workspace kernel.
  - Do not infer commit, land, cleanup, publication, or remote authority.
  - Do not require project configuration, a universal execution-plan DSL, or CLI parsing of AI response protocols.

## Spec
### ADDED
- Requirement: Explicit isolated workspace lifecycle
  - `workspace prepare <workref>` requires an existing open Change and creates or resumes branch `rsp/<workref>`.
  - The workspace record retains repository, target branch, base commit, branch, path, and registered activity state.
  - Preparation must fail safely without deleting or overwriting an unrelated branch, path, or worktree.
- Requirement: AI-native workspace coordination
  - `workspace inspect` returns bounded repository and workspace facts without interpreting a framework, task runner, service, or project architecture.
  - `rsp-workspace` reuses the invoking RSP control and result contracts, appends only workspace context and observations, and uses normal host file, shell, package, browser, and process capabilities.
  - The CLI does not parse those protocols, execute project commands, infer effects, or define a universal materialization, requirement, readiness, framework, service, frontend, or backend schema.
  - Network, credentials, external state, destructive materialization, long-running processes, host resources, deployment, and publication retain their ordinary explicit authority boundaries.
- Requirement: Recoverable host activities
  - `workspace activity register` records one already-running PID with its stable process-start identity, an optional verified process group, and optional opaque exclusive resource ids.
  - Registration exposes no lease token, does not claim sandbox enforcement, and rejects a live conflicting resource owner.
  - `workspace activity stop` and disposal revalidate the recorded process identity before stopping its process or verified process group, fail closed on identity drift, and release cooperative resources only after the stop boundary is safe.
- Requirement: Exact local landing
  - Landing requires an explicit target branch and explicit commit list.
  - Landing refuses stale ownership, ambiguous target state, unrelated in-progress Git operations, or commits outside the workspace branch.
  - A conflict remains in the target worktree for explicit recovery; the source workspace is preserved.
  - Automatic disposal occurs only after successful landing and verification when cleanup is explicitly requested.
- Requirement: Skill composition
  - `rsp-workspace` owns workspace preparation, observation, response-only operation coordination, host-native execution guidance, activity registration, and disposal.
  - `rsp-land` owns only authorized exact local transfer and post-transfer observation.
  - Existing discipline Skills continue to own design, diagnosis, implementation, tests, review, and commit boundaries.

### Acceptance
#### Scenario: Prepare and resume one workspace
- GIVEN a clean Git repository with an open Change `example-change`
- WHEN `rsp workspace prepare example-change` is run twice
- THEN branch `rsp/example-change` and one registered worktree are reused and the command returns the same workspace identity

#### Scenario: Preserve existing user state
- GIVEN a dirty target worktree and disjoint uncommitted user paths
- WHEN a workspace is prepared and later disposed
- THEN the target paths remain byte-for-byte unchanged

#### Scenario: Coordinate execution without a CLI plan DSL
- GIVEN bounded workspace facts and repository evidence
- WHEN `rsp-workspace` decides and performs setup, verification, or preview work
- THEN it returns fixed response-only decision and receipt fields, uses host-native capabilities, and does not persist or submit a universal execution plan to the CLI

#### Scenario: Register and dispose a host activity
- GIVEN the host started and observed a long-running process
- WHEN its PID, verified process group, and exclusive resources are registered and the workspace is later disposed
- THEN the activity is recorded without exposing lease credentials, its stable process identity is revalidated before signaling, its complete registered process boundary is stopped, and its resources are released

#### Scenario: Reject a conflicting cooperative resource
- GIVEN one live registered activity owns an exclusive resource id
- WHEN another workspace registers the same resource id
- THEN registration fails without stopping either process or changing either workspace

#### Scenario: Land exact commits
- GIVEN a workspace branch with one authorized commit and a target worktree with disjoint unrelated modifications
- WHEN landing that commit is explicitly requested
- THEN only that commit is cherry-picked, unrelated modifications remain, and successful cleanup removes the registered workspace and temporary branch

#### Scenario: Preserve a conflicted landing
- GIVEN the selected commit conflicts with the target branch
- WHEN landing is attempted
- THEN the command reports the conflict, preserves the source workspace, and does not infer abort, reset, cleanup, or conflict resolution authority

## Design
- Approach:
  - Store local workspace records under Git common state rather than tracked `.rsp/` files so records are shared by all worktrees and never committed.
  - Implement mechanical behavior in the CLI and policy/authority behavior in thin Skills.
  - Use the pipeline `bounded facts → existing RSP control contract plus workspace context → host-native execution → existing RSP result contract plus workspace observations → deterministic Git and cleanup primitives`.
  - Let AI or humans interpret repository semantics and observed evidence while the CLI owns only worktree identity, local records, activity/process cleanup, cooperative resources, exact landing, and destructive-operation checks.
  - Treat activity resources as cooperative recovery metadata rather than effect declarations or sandbox enforcement.
- Boundaries:
  - Core selects the WorkOwner and whether isolation is warranted.
  - Manage may coordinate separate workspace sessions but cannot assume shared runtime resources are parallel-safe.
  - Implement, Diagnose, TDD, Review, and Commit operate inside the selected workspace without creating another one.
  - Land and disposal remain separate explicit authority boundaries.
- Affected areas:
  - CLI commands, command help, and local state handling.
  - Workspace fact inspection, host activity registration, cooperative resources, and Git safety checks.
  - Authored Skills and generated fallback rules.
  - Unit and integration tests.
- Constraints:
  - Branch names default to `rsp/<workref>`; no host-branded fallback branch is created.
  - Existing branches and worktrees are resumed only when their ownership matches.
  - No secret values are emitted by status or evidence output.
  - Worktree deletion targets must be resolved, registered, and proven to belong to the workspace record.

## Tasks
- [x] Add workspace records and safe Git worktree lifecycle commands.
- [x] Replace technology-specific detection with bounded workspace fact inspection.
- [x] Remove the universal WorkspacePlan, preflight, materialization, finite execution, and readiness engine from the CLI.
- [x] Reuse existing RSP control and result contracts while limiting `rsp-workspace` additions to workspace context and observations.
- [x] Add host activity registration, explicit process-group ownership, cooperative resource conflicts, stop, and disposal.
- [x] Add exact local landing and conflict-preserving behavior.
- [x] Add `rsp-workspace` and `rsp-land` Skills and compose Core/Manage routing.
- [x] Mark the self-hosted Skill Control Model as maintainer-only and enforce standalone published-Skill contract ownership.
- [x] Update focused tests, rebuild projections, and run full repository verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/workspace.test.ts test/workspace-session-safety.test.ts test/rsp-workspace-skill-contract.test.ts` — 3 files and 18 tests passed; proves lifecycle, stable activity identity enforcement, process-group cleanup, fail-closed stale resource handling, cooperative resource conflicts, exact recorded-owner release, landing, and Skill protocol boundaries
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/rsp-workspace-skill-contract.test.ts` — 2 files and 9 tests passed; proves repository-only Specs are not runtime Skill dependencies and Workspace does not redefine common contracts
  - [x] `mise exec -- pnpm run build && node dist/cli.mjs update` — package compilation and fallback projection passed
  - [x] `mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — TypeScript and static checks passed
  - [x] `mise exec -- pnpm run test` — 58 files and 692 tests passed
  - [x] `mise exec -- pnpm run docs:check && mise exec -- pnpm run docs:build` — 7 bilingual page pairs and 30 Markdown files passed; VitePress site built successfully
  - [x] `node dist/cli.mjs check --focused && git diff --check` — focused Change validation and whitespace checks passed
- Manual or environment:
  - [x] inspected `workspace`, `workspace inspect`, `workspace activity register`, `workspace activity stop`, and `land` help; the CLI exposes only bounded facts, recoverable activity mechanics, disposal, and exact landing
  - [x] three parallel disposable-repository Verify lanes exercised the built `dist/cli.mjs` through separate CLI processes: real prepare/inspect plus detached random-port activity registration, stop, and disposal left the target HEAD/tree unchanged and removed the registered process, branch, worktree, record, and temporary-cache leases
  - [x] two real workspaces contended for one opaque resource: a live owner rejected the contender, an exited but uncleared owner produced the expected fail-closed stale-lease result, exact recorded-owner stop released the lease, and the contender then registered successfully without stopping its process or an unrelated sentinel
  - [x] disposable exact-land cases preserved an unrelated dirty target file byte-for-byte, cherry-picked only the selected workspace commit, retained the source when cleanup was omitted, and removed only the registered source worktree and `rsp/<workref>` branch when cleanup was explicit
- Coverage:
  - Local Git worktree lifecycle, Skill contract reuse, recoverable host activities, cooperative resource conflicts, and exact local landing are covered.
  - Published Skills are checked against runtime dependency on repository-only `.rsp/specs` and cross-Skill file loading; the self-hosted Skill Control Model remains maintainer-only.
  - Project-semantic interpretation and execution remain owned by AI or humans through host capabilities; provisioning or mutating external services remains separately authorized.
  - A generic detached Node HTTP preview and local TCP resource were exercised on the current macOS host. No project-specific preview, external shared-state mutation, credentialed service, remote runtime, Linux process identity, or Windows process identity and hard-link behavior was exercised; those remain environment-owned validation.

## Blockers
- none
