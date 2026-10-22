---
kind: refactor
---

# Change: unified-project-update

## Proposal
- Outcome: One ownership-based setup/update entry, with repeatable partial execution instead of whole-update recovery.
- Scope: CLI setup, owned asset replacement/deletion, diagnostics, current documentation, Core setup guidance and regression tests.
- Non-goals: No rollback/recovery API, recovery copies, permanent backups, merge engine, generic transaction framework or concurrent external-edit guarantees. Publication and paid model execution are outside this change.

## Spec
### MODIFIED
- Init creates missing user scaffolding, installs the complete core suite and writes the managed AGENTS entry and exact pin. Existing user files are preserved; incomplete initialization may be retried with the same target. Repeated init cannot adopt a different pinned version. Retired Rules use update.
- Update replaces the seven named package-owned Skill installation directories, removes exact retired Skills/Rules and deletes only metadata-recognized generated indexes. Unknown Skills and canonical maintainer source links are preserved; unexpected managed links or invalid reserved content fail preflight.
- Config, Specs, Changes, Archives, Decision Records, Focus and CONTEXT remain user-owned. Update does not normalize config or recreate missing user scaffolds; runtime defaults provide missing configuration values. Recognized generated indexes are the explicit deletion exception within knowledge directories.
- AGENTS changes are confined to its managed block. Publish the version last. Ordinary commands enforce the pin; invalid pins and downgrades are rejected.
- Optional update --dry-run remains read-only. Remove adoption/removal/force switches, standalone Skill installation/UI and doctor repair; diagnostics remain read-only.
- Failures stop and report completed steps. Partial replacements/deletions remain in place, without rollback or old-content backups. Fix the cause and rerun the same exact target CLI.
- Diagnostics distinguish missing user scaffolding from access and path-type failures. Only missing scaffolding suggests init; update does not repair user content.
### Acceptance
#### Scenario: Preserve ownership
- GIVEN old managed assets and user content, including a minimal config
- WHEN update runs
- THEN only owned assets and the managed AGENTS block change, the pin is written last, and user bytes and missing user paths stay unchanged.
#### Scenario: Partial update retry
- GIVEN an upgrade failing during Skill publication, generated-index removal, AGENTS publication or final pin publication
- WHEN the cause is corrected and the same target update is rerun
- THEN previously completed changes remain valid and the environment converges without restoring old assets.
#### Scenario: Partial initialization retry
- GIVEN init stopped before completion
- WHEN the same target init runs again
- THEN missing scaffolding is created and existing user files remain unchanged.

## Design
- Keep package-owned tree inspection and canonical source-link protection. Prepare incoming Skill content, replace named trees completely and delete retired names directly. Temporary content is not a backup; no cross-step rollback callback remains.
- Use a small prepared-text-file helper for setup publication. Generated indexes use preflight plus a live metadata check before direct deletion. Remove the project rollback journal, index quarantine/recovery implementation and unused directory-snapshot utilities.
- Config validation/defaults remain read-only; remove unused config backfill/normalization code. Leave user directories, including empty legacy directories, in place.
- Keep historical jobs, frozen run inputs and provenance unchanged. Current offline fixtures follow the candidate's diagnostics; current guides describe source behavior, not registry publication.

## Tasks
- [x] Unify init/update and remove retired commands, parameters and installation UI.
- [x] Apply ownership boundaries, exact-name deletion, complete Skill replacement and canonical source-link protection.
- [x] Remove whole-update rollback, recovery copies, associated snapshot utilities and caller protocols.
- [x] Preserve config bytes and user paths; support same-target retry after partial setup/update.
- [x] Replace retired recovery tests with public ownership/retry coverage and retain unrelated CLI/package/tooling checks.
- [x] Update CLI/distribution contracts, bilingual guides, migration documentation and Core setup guidance (2026.10.22.4).
- [x] Align ordinary-entry and Doctor guidance with ownership; update current offline fixture diagnostics without changing historical evidence.

## Verify
### Required
- [x] Final build, typecheck and lint passed. Current code/package coverage: 17 files / 106 tests passed across the full run and the corrected Harbor-file rerun, including isolated offline-cache packed installation. The full run first passed 105 tests and failed the Harbor test because three current outcome fixtures required the obsolete diagnostic. Only their inspection-output hashes changed after actual fixture execution; synthetic Git state and all other input hashes stayed unchanged. The complete failed test file then passed. Historical jobs and frozen run inputs remain unchanged.
- [x] Real CLI failure injection verifies partial Skill activation, partial index deletion, AGENTS failure, final pin failure, and partial fresh init. Same-target retries converge; config and user content stay unchanged. Tests also cover write-free preview, missing user paths, read-time defaults, managed-block preservation, retired-input rejection, invalid config/pins, downgrade rejection and symlink safety.
- [x] Archive Index read errors propagate instead of being treated as non-generated content. CLI regressions cover preflight and pre-deletion read failures: the old pin and user files remain unchanged, completed Skill replacements are retained, and same-target retry removes the generated index and converges. A real permission-denied probe also passed: EACCES exits nonzero without advancing the pin; retry succeeds after access is restored.
- [x] Diagnostic regressions distinguish missing default/custom Decision Record directories, access denial and wrong path types; only missing scaffolds suggest init. Ordinary entrypoints share missing-design guidance, preserve filesystem errors and no longer recommend update to repair user content. All 23 setup integration tests passed; real directory-permission probes also passed. Current offline fixture assertions and judge descriptions match the new diagnostic; no model execution or behavioral acceptance is claimed.
- [x] Skill tests cover whole-tree replacement including hidden stale files, exact retired names, unknown-name preservation, partial replacement retry and canonical source links.
- [x] Documentation check/build passed: 8 bilingual page pairs / 32 Markdown files. All 7 Skill packages passed; security preflight passed 41 files with zero findings. Frozen offline validation passed 47 native Harbor tasks; no agent/model behavior was executed.
- [x] Doctor reports zero issues; update preview has no pending actions. Change check and diff check passed. Read-only re-review found no actionable issue in the corrected diagnostic, retry and offline-fixture boundary; no independent-worker acceptance is claimed.
- Retained failures and supersession: earlier rollback candidates exposed mistaken mutation ownership, stale publication and inconsistent cross-mechanism commit/cleanup behavior. Their results describe the superseded rollback contract, not current acceptance. Whole-update rollback and its recovery-only tests were replaced by the authorized ownership/retry contract. Swallowed Archive Index read errors and obsolete directory-repair hints were corrected with CLI regressions. Fixture/import/metadata errors were not behavioral RED evidence; lint formatting failures were corrected before the final passing checks.
### Optional
- No independent-worker review, behavioral Skill acceptance, release or remote delivery is claimed.

## Blockers
None
