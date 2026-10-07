---
kind: refactor
summary: Keep research acquisition recoverable and reports as ordinary timestamped Markdown.
---

# Change: research-capture-recovery

## Proposal

Simplify maintainer research to source configuration, a small recovery index, resumable refresh tasks and timestamped reports. Preserve current captures and useful current-format run evidence; consolidate historical conclusions before removing replaced layouts and selected obsolete private artifacts. Remove per-file evidence identity, report sealing and custom history management. The change is maintainer-only; published product CLI and remote delivery behavior are unchanged.

## Spec

### MODIFIED
- Requirement: Git captures record repository, commit identity and selection only. Non-Git captures record origin and acquisition time. No persistent file inventories or content hashes.
- Requirement: Reports are ordinary Markdown under research/reports with time-based filenames. Sources, local applicability and limitations are prose; no required metadata, parser, seal, revision chain or coverage registry.
- Requirement: Refreshes preserve each source's before/after commits and necessary execution state, retry incomplete work and keep successful versions. Explicit configuration changes affect only selected changed sources.
- Requirement: Comparisons use Git locally and expose whole-repository changes; missing objects require explicit acquisition. Recover uses the indexed commit, never substitutes the latest ref.
- Requirement: Cleanup previews explicit selected captures; no inferred unused-material deletion. Ordinary copy/archive tools handle portability without a custom evidence bundle protocol.

### Acceptance
#### Scenario: Retry a partial refresh
- GIVEN one source succeeds and another fails
- WHEN the task resumes
- THEN successful commits remain and incomplete sources retry with the original comparison baseline.

#### Scenario: Recover a historical capture
- GIVEN the local payload is missing and upstream has advanced
- WHEN recovery is requested
- THEN material is taken from the recorded commit and selection, or unavailability is reported.

#### Scenario: Explore changes
- GIVEN two retained source commits
- WHEN they are compared
- THEN Git reports repository-wide changes without stored tree inventories or payload checksums.

## Design

Keep sources.yaml as current configuration and index.json as recovery metadata only. Derive ordinary capture paths from source/commit or name/time, recording only collision exceptions. Use Git for differences and exact revision acquisition. Keep process locks and atomic writes for resumable operations. Reports have no runtime owner. Remove report lifecycle, automated coverage, custom export/restore, content deduplication and permanent migration commands. Consolidate useful historical conclusions into a timestamped report reconciled with current owners. Remove replaced research layouts and explicitly selected obsolete private evidence; keep current captures and relevant current-format run evidence.

## Tasks

- [x] Consolidate historical research, update live references and remove replaced layouts and obsolete private material.
- [x] Simplify the catalog, capture and recovery commands; replace manifest comparison with Git diff.
- [x] Keep resumable refresh and before/after commits; require explicit cleanup targets.
- [x] Remove report lifecycle and migrate active fixtures to timestamped plain Markdown; update research guidance and Skill cases.
- [x] Reduce current metadata without changing retained payloads, and verify the final implementation.

## Verify

### Required
- [x] Observable code tests cover acquisition, retry/interruption, stable minimal index, Git comparison, exact recovery and explicit cleanup.
- [x] Build, lint and code suite; affected offline maintainer cases and Skill package/security checks.
- [x] Current captures and source versions preserved during metadata reduction.

Build and the full 156-test code suite passed before the final baseline correction. The final affected research/oracle suite passed 25 tests; lint, typecheck, docs, offline maintainer readiness, both changed Skill packages and the 15-file composition security scan passed within their recorded boundaries. Unchanged implementation boundaries reuse earlier checks. Commands, logs and candidate applicability are recorded at tests/skills/reports/research-simplification-20261007/verification.md. Offline readiness used zero provider invocations and does not establish model effectiveness.

The recovery index shrank from 14,895,588 to 9,963 bytes. All 29 capture identities and 16,438 payload files were preserved. Existing commits were pinned in their Git caches; resuming the complete acquisition task left the index byte-identical. This verifies retention and retry, not current upstream freshness.

Historical consolidation is recorded in [the dated baseline](../../research/reports/2026-10-07T14-19-03Z.md), separating current owners, investigation leads and unchanged historical verdicts. Removed 448 replaced research/fixture files and 289 obsolete private files (about 151 MiB of private payload). Current-format October model evidence remains present. The research README and maintainer Skill guidance own the current operating contract; no additional Spec or Decision Record is needed.

The review finding about path-only retry was corrected: selection changes preserve the original before commit, while repository/ref changes re-establish it. The CLI regression checks failed capture, selection repair, actual selected/outside-selection differences and a subsequent ref switch. Independent bounded re-review found no remaining issue, and the subsequent full uncommitted review returned Code and Document clean. Local-link, package and whitespace checks passed. No release-selection policy change is included.

### Optional
- Model effectiveness is outside this storage change; offline readiness is not model acceptance.

## Blockers

- none
