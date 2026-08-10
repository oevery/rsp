---
kind: "feature"
---

# Change: rsp-4-runtime/compatibility-migration

## Proposal
- Outcome: Migrate supported 3.x projects to the 4.0 repository, runtime, and cache contracts
- Why:
  - RSP 4.0 removes generated Specs navigation and adds optional Broker and runtime caches while preserving Markdown authority and one-shot operation.
  - Existing projects need deterministic migration that distinguishes recognized generated files from owner-controlled content and remains usable without local services.
- Scope:
  - Preserve and document the existing fail-fast `rsp create --lite` diagnostic as part of the supported 3.x-to-4.0 migration story.
  - Remove generated `00-index.md` creation and health requirements, and migrate only metadata-recognized generated files.
  - Reconcile `rsp init`, `update`, and `doctor` with direct Specs queries, Broker/runtime compatibility diagnostics, context-packet freshness and disposal, and no-service fallback.
  - Add supported 3.x upgrade, fresh 4.0 initialization, owner-content preservation, and rollback fixtures.
- Non-goals:
  - Finalize package version, changelog, release notes, public release prose, shipped inventory, or the exact release candidate; those belong to `rsp-4-runtime/release-4-0`.
  - Publish, tag, push, create a hosted release, move immutable history, or perform registry authentication.
  - Delete unrecognized user content, repository facts, unrelated caches, or incompatible runtime data silently.
  - Require Broker, Web, or runtime availability to inspect, migrate, or recover repository truth.

## Spec
### MODIFIED
- Requirement: Supported 3.x projects migrate deterministically while owner-controlled Markdown and service-independent operation remain intact.
  - The existing `rsp create --lite` rejection remains fail-fast and carries explicit migration guidance.
  - Fresh projects contain no generated Specs `00-index.md`; direct Specs navigation and bounded search are the supported replacement.
  - `rsp update` removes only metadata-recognized generated Specs indexes and preserves unrecognized reserved content for owner review.
  - `rsp doctor` validates Specs tree safety, Broker and runtime compatibility when present, stale runtime records or context packets, cache disposal guidance, and no-service fallback without starting the Broker.
  - Runtime caches are user-local, disposable, versioned, and never required to recover project truth.
  - Repository migration is deterministic and separately testable from package versioning or publication.

### Acceptance
#### Scenario: supported 3.x project upgrade
- GIVEN a valid supported 3.x project containing metadata-recognized generated Specs indexes
- WHEN the 4.0 migration path runs update and doctor
- THEN recognized generated files are removed, owner Markdown remains byte-identical, direct navigation works, and no Broker is required

#### Scenario: owner-controlled reserved content
- GIVEN an unrecognized `00-index.md` at a reserved path
- WHEN update or doctor inspects the project
- THEN it fails closed with an owner action and does not overwrite or delete the content

#### Scenario: removed lite option
- GIVEN a 4.0 CLI invocation containing `rsp create --lite`
- WHEN argument validation runs
- THEN it fails before mutation with the exact standard-template migration guidance

#### Scenario: absent or incompatible local runtime
- GIVEN a supported repository and an absent, stale, corrupt, or incompatible Broker/runtime cache
- WHEN update and doctor run
- THEN repository migration and direct Specs inspection remain available while the runtime condition is reported with a bounded recovery action

#### Scenario: stale context cache
- GIVEN a retained context packet whose checkout, schema, Git, dirty-path, or source identity is incompatible with current evidence
- WHEN doctor or resume compatibility inspection runs
- THEN the packet is reported as stale and disposable without changing or blocking repository truth

## Design
- Approach:
  - Reuse metadata ownership checks for generated cleanup and the accepted direct Specs query model for post-migration navigation.
  - Extend doctor with read-only Broker/runtime and context-packet compatibility, freshness, and disposal diagnostics without starting services.
  - Keep cache disposal separate from repository migration because caches are non-authoritative and may be deleted independently.
  - Define the package-executed supported 3.x boundary as the final published `@oevery/rsp@3.2.0` tag. Retain its complete byte-exact init directory/file inventory, tag/tree/blob provenance, and SHA-256 manifest under `test/fixtures/compatibility/v3.2.0/`; the successful upgrade starts from that frozen layout, while earlier 3.x claims are limited to the same synthetic metadata-recognized layout.
  - Snapshot and revalidate every real project-to-Spec ancestor identity before quarantine, copy, unlink, or restore. Use exclusive no-overwrite materialization with a verified copy fallback when hard links are unavailable.
  - Treat one update invocation as a rollback boundary for config, fallback, `AGENTS.md`, directories/placeholders, Archive Index, and generated Specs-index migration. Restore deleted parent directories before descendants, refresh journal-owned parent identities after each directory restoration, remove newly created paths from descendants upward, and retain explicit recovery evidence only when complete rollback is genuinely prevented.
  - Inspect runtime state only through a bounded private copy after stable namespace/database/sidecar identity, containment, symlink, size, and POSIX permission checks. Context inspection uses the service clock and canonical finite ordered timestamps.
  - Expose one package-supported disposal contract through `resolveRuntimeDisposalTarget()` and `disposeRuntimeDatabase()` from `@oevery/rsp/dist/runtime-store.mjs`; require closed exact owners, carry project ID plus exact cache/projects/namespace roots as one immutable target, reject sibling substitution, revalidate that complete real chain around every candidate mutation, and never recommend hand deletion.
- Boundaries:
  - This Change owns repository migration behavior, runtime/cache diagnostics, and migration-specific guidance.
  - Feature children own Broker, runtime, Manage, Specs, and Web implementation; `release-4-0` owns terminal package and public release reconciliation.
  - Historical 3.x release records remain immutable and describe their observed behavior.
- Affected areas:
  - `init`, `update`, `doctor`, create-option validation, generated-index migration, cache diagnostics, Skills, and migration-focused documentation.
  - Cross-version project fixtures, no-service operation, reserved-content handling, stale/incompatible runtime or context diagnostics, and rollback checks.
- Constraints:
  - Migration is deterministic, offline-capable for repository facts, and safe when Broker, runtime, or Web components are unavailable.
  - No cache cleanup follows an unresolved path, process, project identity, ownership, or compatibility guess.
  - Versioned release prose is deferred until the exact release identity and net candidate range are confirmed.

## Tasks
- [x] Preserve and verify the removed-`--lite` fail-fast diagnostic while removing generated Specs-index creation and health contracts.
- [x] Implement preflighted recognized-index quarantine/removal, owner-content stops, rollback, fresh 4.0 initialization, and direct Specs navigation after migration.
- [x] Add read-only Broker/runtime compatibility, stale-record, context-packet freshness, corruption, disposal, and no-service diagnostics to doctor.
- [x] Update owning Specs, Skills, migration guidance, helper locks, and supported 3.x/fresh 4.0 fixtures without changing historical release records.
- [x] Resolve corrective review Findings F1–F8 plus final P1 convergence with production-reachable ancestor-swap and accessible recovery evidence, hardlink-unavailable concurrent replacement preservation, dependency-ordered whole-update rollback including deleted legacy rules trees, runtime snapshot/symlink/oversize and project-bound full cache-root/projects-root/namespace disposal isolation, the canonical/reversed/future/expired timestamp matrix, a complete package-executed 3.2.0 init fixture, POSIX/Windows permission checks, and exact packaged resolver/disposer coverage.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/compatibility-migration.test.ts test/helpers.test.ts test/integration.test.ts test/runtime-event-store.test.ts test/broker-protocol.test.ts --maxWorkers=1` — 5 files, 291 tests passed; proves corrective migration, concurrent replacement, deleted-parent rollback, complete 3.2.0 inventory/provenance, helper, integration, full runtime disposal chain, timestamp, and Broker boundaries.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run docs:check` — all passed; docs check covered 7 bilingual page pairs and 31 Markdown files.
  - [x] `mise exec -- pnpm run release:package-check` and `mise exec -- pnpm exec vitest run test/clean-install-check.test.ts --maxWorkers=1` — exact post-CalVer package smoke passed with SHA-256 `62f97547e59475fe268ee20bf60a05a9d86961209c12592ceddab7d79f6a44d3`; clean-install tests passed 3/3 and exercised the packaged resolver-produced, project-bound disposal target.
  - [x] `mise exec -- pnpm exec vitest run --maxWorkers=1` — direct serial full suite passed 68 files / 790 tests after the final compatibility correction.
### Optional
- Manual or environment:
  - [ ] Upgrade representative supported 3.x repositories with absent, healthy, stale, and incompatible local runtime state — omitted; deterministic integration fixtures and package smoke cover the declared required boundary.
- Coverage:
  - `rsp-4-runtime/release-4-0` later proves exact-package migration, documentation, package inventory, and clean installation.

## Blockers
- none
