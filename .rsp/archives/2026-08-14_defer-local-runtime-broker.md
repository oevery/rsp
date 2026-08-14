---
kind: "refactor"
---

# Change: defer-local-runtime-broker

## Proposal
- Outcome: Remove the deferred local Runtime and Broker from active product surfaces
- Why:
  - Runtime observations require a host, MCP, or plugin integration to synchronize dispatch, event, receipt, and context data; RSP cannot provide complete value independently.
  - Keeping the optional transport, SQLite schema, compatibility protocol, retained Web source, and release gates in the default package creates ongoing maintenance cost for a deferred capability.
- Scope:
  - Remove Broker, SQLite runtime, managed-runtime adapters, retained Web Observatory source, and their product commands, package entries, dependencies, tests, documentation, Specs, and Skill contracts.
  - Keep repository-native Markdown, direct Specs queries, Workspace/Land, verification criticality, and Focus Capsule recovery behavior.
  - Record the deferral as the current product decision while preserving prior implementation evidence in Git history, archives, and the pushed experiment branch.
- Non-goals:
  - Do not remove `rsp specs`, `rsp workspace`, `rsp land`, `rsp commit`, `rsp-verify`, or the compact Manage context-flow improvements.
  - Do not design a replacement MCP, plugin, scheduler, event bus, or synchronization protocol.
  - Do not publish, tag, or push the cleanup on `main`.

## Spec
### MODIFIED
- Requirement: The default RSP product remains repository-native and one-shot.
  - The CLI and published package expose no Broker lifecycle command, daemon, SQLite runtime store, managed-runtime adapter, Runtime diagnostic, Web Observatory source, or runtime synchronization contract.
  - Ordinary status, check, show, ready, specs, lifecycle, Git, Workspace, and Skill flows retain their existing behavior without runtime state.
- Requirement: Deferred experimentation imposes no active maintenance surface.
  - Runtime and Web implementation are retained by Git history and `origin/codex/runtime-broker-experiment`, not by dead production source or dependencies on `main`.
  - Current Specs, Decision Records, public docs, Skills, package checks, and tests describe the no-Runtime product boundary consistently.
- Requirement: Independent post-3.2 capabilities remain intact.
  - Direct Specs tree/detail/search and generated-index migration remain supported.
  - Workspace isolation, exact landing, verification gates, commit transport, and Focus Capsule recovery remain supported.

### Acceptance
#### Scenario: Installed package has no deferred runtime surface
- GIVEN a clean package built from the resulting checkout
- WHEN its CLI help, packed files, production dependencies, and clean-install behavior are inspected
- THEN no Broker, SQLite runtime, managed-runtime, Web Observatory, or runtime synchronization surface is present

#### Scenario: Repository-native workflows remain available
- GIVEN an initialized RSP project
- WHEN status, check, show, ready, specs, Workspace, Land, commit, and Skill installation paths are exercised
- THEN their non-runtime contracts remain available and do not create or inspect runtime cache state

#### Scenario: Deferred work remains recoverable without active maintenance
- GIVEN a maintainer needs to revisit the experiment
- WHEN repository history or `origin/codex/runtime-broker-experiment` is inspected
- THEN the complete pre-cleanup implementation and rationale remain recoverable without keeping dead source on `main`

## Design
- Approach:
  - Remove the product surface vertically from CLI registration through implementation, package/build inventory, Skills, Specs, docs, and verification.
  - Replace current Runtime stable facts with one explicit deferral Decision Record; prior Runtime/Web decisions become historical evidence superseded by that record.
  - Remove Broker/SQLite inspection from Doctor while retaining the existing generic command diagnostic contract for ordinary filesystem and parsing issues.
- Boundaries:
  - Git history and the pushed experiment branch own recoverability; active source owns only shipped or currently supported behavior.
  - Focus Capsule is plain marker content and remains independent of SQLite or Broker hydration.
  - Workspace process/activity ownership remains local Git/worktree infrastructure and does not depend on Broker.
- Affected areas:
  - `src/broker/`, `src/runtime/`, `src/web/`, `web/`, Broker and Doctor command seams, build/package configuration.
  - Runtime/Web tests and clean-install assertions.
  - Core and Manage Skills, public documentation, Runtime/Distribution/CLI Specs, and Runtime/Web Decision Records.
- Constraints:
  - Preserve all unrelated changes since `v3.2.0`.
  - Do not leave hidden flags, optional package entries, development-only Web dependencies, or dormant protocol compatibility claims.
  - Keep the resulting worktree reviewable as one cohesive removal boundary.

## Tasks
- [x] Remove Runtime, Broker, retained Web implementation, CLI registration, build entries, and production/shared types.
- [x] Remove Runtime/Web dependencies, package checks, fixtures, and tests while retaining independent post-3.2 coverage.
- [x] Reconcile Skills, Specs, Decision Records, README, and bilingual public docs to the repository-native boundary.
- [x] Build and run focused checks, then run the complete project validation gates.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run build` — passed in `release:check`; the supported package builds with only the CLI entry.
  - [x] `mise exec -- pnpm run typecheck` — passed in `release:check`; code, tests, and retained contracts contain no invalid removed-surface references.
  - [x] `mise exec -- pnpm run lint` — passed in `release:check`; the cleaned source and documentation satisfy project policy.
  - [x] `mise exec -- pnpm run test` — 64 files and 746 tests passed; retained CLI, Specs, Workspace, Manage, TUI, and package behavior remains covered.
  - [x] `mise exec -- pnpm run release:package-check` — passed; the packed installation contains only `dist/cli.mjs` and its chunks with the supported Skill inventory.
  - [x] `git diff --check` — passed for the complete cleanup diff.
### Optional
- Manual or environment:
  - [x] `git ls-remote --heads origin codex/runtime-broker-experiment` resolved the pre-cleanup `8ca388d` tip.
- Coverage:
  - `mise exec -- pnpm run release:check` passed metadata, bilingual docs, docs build, package build, typecheck, lint, all tests, and clean-install package validation.
  - No push or publication of the cleanup was performed.

## Blockers
- none
