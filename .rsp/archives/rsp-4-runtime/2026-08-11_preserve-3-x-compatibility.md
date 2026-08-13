---
kind: "fix"
---

# Change: rsp-4-runtime/preserve-3-x-compatibility

## Proposal
- Outcome: Preserve practical 3.x compatibility for the next compatible release boundary
- Why:
  - With default Web delivery withdrawn, the remaining Broker, runtime, workspace, and Specs-query capabilities are optional or additive and do not justify a major version by themselves.
  - The legacy `--lite` invocation and package-wide Node engine are inexpensive compatibility boundaries to preserve, while generated Specs indexes are package-owned derived files with a safe explicit migration and a machine-readable replacement.
- Scope:
  - Accept exactly `rsp create --lite`, `--lite=true`, and `--lite=false` as deprecated compatibility inputs that use the standard kind-aware Change template; reject every other `--lite=` token before mutation.
  - Restore the package installation boundary to Node.js `>=22`; keep Node.js `>=22.13.0` as the exact requirement only for optional SQLite runtime use.
  - Keep the existing explicit, ownership-checked generated Specs-index removal in `rsp update`, direct `rsp specs --json` replacement, rollback behavior, and owner-content protection.
  - Remove non-delivered Web-only packages from production dependencies while retaining any dependencies needed only to build and test non-shipped source as development dependencies.
  - Reconcile CLI, configuration, distribution, migration, and bilingual public documentation with the compatible-release boundary.
- Non-goals:
  - Restore generated Specs-index creation or make generated files authoritative.
  - Restore a separate lite template implementation.
  - Expose or publish the retained Web Observatory.
  - Finalize, commit, tag, push, publish, or announce a release.

## Spec
### MODIFIED
- Requirement: The next release preserves practical 3.x command and installation compatibility while migrating package-owned generated navigation explicitly.
  - Legacy `rsp create --lite`, `--lite=true`, and `--lite=false` invocations remain accepted for one compatibility cycle and produce the standard kind-aware six-section Change scaffold.
  - The compatibility invocation emits bounded deprecation guidance and creates no second template mode.
  - Ordinary installation and one-shot Markdown/CLI use retain the Node.js `>=22` package boundary; opening the optional SQLite runtime continues to fail with the existing exact `>=22.13.0` diagnostic when unavailable.
  - `rsp update` may remove only metadata-recognized generated Specs indexes after complete preflight and rollback protection; owner-controlled reserved content is preserved.
  - `rsp specs --json` is the supported machine-readable replacement for generated navigation.
  - The default installed dependency graph contains no package used only by the non-delivered Web source.

### Acceptance
#### Scenario: legacy lite invocation
- GIVEN a supported 3.x command invocation using any legacy `--lite` boolean form
- WHEN the next compatible RSP release creates the Change
- THEN it succeeds with the standard kind-aware scaffold, emits deprecation guidance, and creates no alternate template mode

#### Scenario: ordinary Node 22 installation
- GIVEN a Node.js 22 environment older than 22.13.0
- WHEN the package is installed and ordinary one-shot CLI commands are used
- THEN the package engine accepts the environment while optional SQLite runtime opening returns the bounded runtime-specific requirement

#### Scenario: generated navigation migration
- GIVEN metadata-recognized generated Specs indexes from 3.2
- WHEN the user explicitly runs `rsp update`
- THEN only package-owned generated files are removed safely and `rsp specs --json` provides current machine-readable navigation

## Design
- Approach:
  - Parse the legacy option before the command framework rejects it, strip it from the forwarded argv, and pass one transient compatibility marker to Change creation for the warning only.
  - Keep all creation paths on `generateChangeContent`; do not restore `generateLiteChangeContent`.
  - Keep runtime capability checks lazy and runtime-owned while returning the package engine to its ordinary CLI compatibility range.
  - Classify retained Web parser and DOM packages as development-only because no shipped distribution entry imports them.
- Boundaries:
  - CLI parsing owns legacy option compatibility; Change rendering remains single-path.
  - Runtime code owns SQLite capability diagnostics.
  - The existing compatibility migration remains the owner of generated-index deletion safety.
  - Distribution metadata owns installed dependencies.
- Affected areas:
  - `src/cli.ts`, `src/commands/create.ts`, creation integration tests.
  - `package.json`, `pnpm-lock.yaml`, clean-install checks, public CLI/concept/configuration documentation, and owning Specs.
- Constraints:
  - Preserve every current no-Web route, command, package-entry, and browser-asset omission.
  - Preserve unrelated dirty work and do not weaken generated-index owner checks or rollback.

## Tasks
- [x] Accept legacy `--lite` boolean forms as a deprecated alias for the standard template and cover observable creation behavior.
- [x] Restore the package engine to Node.js `>=22` while preserving the optional runtime `>=22.13.0` diagnostic and clean-install coverage.
- [x] Remove Web-only production dependencies and reconcile package inventory.
- [x] Update owning Specs, the SQLite Decision Record, and bilingual public documentation for the compatible-release and generated-index migration boundary.
- [x] Run focused compatibility, package, build, typecheck, lint, documentation, and full regression checks.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/compatibility-migration.test.ts` — 1 file / 18 tests passed; proves: all three accepted legacy forms retain the standard-template warning path, unsupported `--lite=` values fail before Change or focus mutation, and the v3.2.0 migration fixture remains valid.
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts` — 1 file / 182 tests passed; proves: the complete CLI lifecycle and direct production command path remain compatible after the legacy-option correction.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run docs:check` — passed; proves: implementation and 7 bilingual documentation pairs plus 30 Markdown files remain coherent.
  - [x] `mise exec -- pnpm exec vitest run test/clean-install-check.test.ts test/helpers.test.ts` and `mise exec -- pnpm run release:package-check` — 2 files / 61 tests and exact clean installation passed with SHA-256 `ab242fa18e2e73b182199d3b7c3dbae0bde7a1d427fd79aa2188a73173482ded`; proves: the packed package retains `engines.node: >=22`, excludes Web-only production dependencies, and ships no Web command, projector, or browser assets.
  - [x] `mise exec -- pnpm run test` and `git diff --check` — 70 files / 816 tests passed and patch hygiene passed; proves: complete regression after final documentation and package assertions.
### Optional
- Manual or environment:
  - [ ] Install under a real Node.js 22.0–22.12 environment and exercise ordinary CLI plus runtime diagnostics.
- Coverage:
  - Exact future version metadata, release prose, candidate commit, publication, registry reconciliation, and remote installation belong to a separately authorized release operation after its range is frozen.

## Blockers
- none
