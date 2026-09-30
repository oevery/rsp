---
kind: "ops"
---

# Change: research-artifact-hygiene

## Proposal
- Outcome: Retire inactive research work copies, retain selected unique evidence with verified recovery mappings, and preserve readable historical conclusions without keeping permanent full cache backups.
- Scope: Selected inactive .cache entries, legacy evals/reports, obsolete tracked research execution artifacts, selective private retention, and current storage/recovery guidance.
- Non-goals: Model execution, dependency installation, upstream lock changes, immutable report edits, prior archive edits, process termination, remote delivery or publication.

## Spec
### MODIFIED
- Requirement: Preserve active upstream source/distillation and offline installation caches. Name, size or dirty status alone never determines evidence value or authorizes deletion.
- Requirement: Keep selected private historical evidence under ignored tests/skills/reports/legacy. Record every original path, byte identity, mode/link metadata, disposition and recovery source; distinguish selected blobs, fixed-history Git recovery and permanent disposal.
- Requirement: Preserve readable research conclusions, necessary metadata and historical verdicts. Retired tracked raw files use their fixed Git history; unique model evidence and experimental text use the selected private pack. No complete old workspace or replay guarantee remains.

### Acceptance
#### Scenario: Selective evidence retention
- GIVEN exact inactive targets and independently reviewed retention/disposal classifications
- WHEN retained bytes and Git recovery objects are fully verified, mappings cover all original entries, actual recovery samples pass and removal targets pass fresh stability/occupancy checks
- THEN only enumerated redundant private files are removed, protected sources remain unchanged, and current guidance explains both recoverable evidence and irreversible losses

## Design
- Keep .cache/upstreams, .cache/upstream-distillation and .cache/rsp-package-install unchanged, including backups within those actively owned roots. Do not change current reports outside this legacy scope or old RSP archives.
- First preserve and verify full retirement snapshots; then independently review a content/identity-based retention candidate before removing those temporary safety backups. Ambiguous/in-use work copies are never forcibly removed.
- Final private storage has four files: selected-evidence.tar.gz, dispositions.json.gz, repository-provenance.json.gz and retention-receipt.json. Deduplicate selected bytes by SHA-256; preserve original-path/mode mappings separately. No new product cleanup framework or permanent runner is introduced.
- Preserve provider evidence including failed/incomplete runs, unique experimental sources/Changes/candidate Skills, the complete small SQLite collection and uncertain small material. Remove installed dependencies, nested Git metadata, identity-confirmed local-test output and the repeatable Vitest log. Identical source/research bytes rely on fixed commit d14b6dcd35c64025cd229cf6012ce57ee5011579 and its ancestry.
- Preserve historical documents verbatim. Current recovery guidance demonstrates manifest-based extraction because tar member names are blob identities, not original paths; old absolute references and runtimes are not automatically portable.

## Tasks
- [x] Inventory consumers, use, Git state and exact retirement targets; preserve active caches and immutable research.
- [x] Verify initial full archives and restoration samples before retiring unused work copies and 667 tracked research execution/raw-output files.
- [x] Produce selected private evidence and exact dispositions; receive independent classification/content/recovery verification before deleting safety backups.
- [x] Remove exactly 176 original bundles, 176 per-source inventories and redundant scripts/receipts/samples inside the authorized legacy directory; preserve the selected pack and mappings.
- [x] Update current recovery guidance, Spec and research/test entry points to explain selective retention and irreversible losses.
- [x] Check final restoration examples, private layout/permissions/ignore status, documentation and Change consistency.

## Verify
### Required
- [x] Initial retirement evidence, preceding selective retention: all 176 safety bundles passed complete file-byte/mode/link comparison and 310 actual sample restorations. Main-session independent checks matched original cache/report/research baselines. These full bundles were temporary safety copies and have now been replaced by the selected set, not retained as complete recovery sources.
- [x] Initial protected-boundary acceptance by the main session: exactly 668 tracked deletions (667 research files plus legacy .gitkeep), no extra deletions; 434 original retained research files, 36 current report files, three retained cache inventories and upstream locks matched their baselines. Typecheck/lint/docs, full Skill offline readiness, Change and diff checks passed before the selective-retention documentation delta.
- [x] Main-session independent selective-retention verification before removal: all 12,516 retained blobs matched SHA-256/length; all 1,436 Git blobs matched full content and were reachable from fixed d14b6dc history; all 529,561 disposition rows matched every original inventory field with no omissions. Classification and recovery were explicitly accepted. This is preservation verification, not fresh model acceptance.
- [x] Implementer verified every original bundle and inventory hash again before exact removal. Fresh lsof returned its empty-match result (exit 1, no stdout/stderr or warnings). Exactly 389 private files were removed: 176 full bundles, 176 source inventories, 19 old support files, 4 superseded candidate documents/receipts and 14 restored samples. No root-recursive deletion or symlink following was used. The three selected payload hashes remained unchanged after relocation to the final legacy root.
- [x] Recovery sampling before deletion: 14 actual file restorations passed, including all 10 SQLite files with matching DB/WAL/SHM. Database-open/replay compatibility was not tested. All selected payloads and the precise mapping/provenance survive; complete nested histories, dependency installations and discarded local-test/log bytes do not.
- [x] Final implementation-side checks: the exact documented Python recovery example restored the SQLite DB/WAL/SHM trio through the final manifest/blob layout, with 3/3 SHA-256 matches; temporary samples were removed. Final four-file totals, 0700/0600 permissions and ignore coverage passed. docs:check passed 7 bilingual pairs / 31 Markdown files; rsp check reported 0 errors / 0 warnings; git diff --check passed and the index remained empty. No full test/build/install suite was repeated.
- [x] Main-session independent final-layout verification: the published Python example restored the three state DB/WAL/SHM files successfully without opening the database. Final selected-pack and disposition SHA-256 values matched the approved candidate; the aggregate hash of 724 retained research/old-archive files was unchanged, and 44 current report entries retained their contents and permissions.
- [x] Final main-session verification after selective retention: Verify pass, evidence_delta=new, boundary=unchanged. Typecheck, lint, docs:check (7 bilingual pairs / 31 Markdown files), Change check and git diff --check all passed.
- [x] Final main-session fixed-scope review against d14b6dc: Code clean and Document clean for 675 tracked diffs plus this Change/focus, the recovery guide and evaluations README. Code changes are confined to obsolete ignore/lint entries and retired research execution assets, with no current src/tests/scripts dependency. Document review confirmed selective recovery, permanent disposal and model-acceptance limits; no unresolved choices or blockers remain.
- [x] Durable writeback decision: Update existing spec or scoped instruction. Current storage/recovery boundaries are written in .rsp/specs/distribution.md, AGENTS.md and the relevant research/test guides. No Decision Record needed; the existing Spec and recovery guide own the lasting boundaries and recovery risks.
- Storage: final four-file legacy totals 57,961,822 logical bytes and 58,052 KiB allocated, including manifest/provenance/receipt. Before compaction: 383,645,989 logical bytes and 375,452 KiB allocated. Reductions: 325,684,167 logical bytes and 325,017,600 allocated bytes. These are scoped footprint measurements, not filesystem-wide free space.
### Optional
- [x] Main-session latest pnpm test built first and passed 16 files / 89 tests in 100.66 seconds, including offline packed install, before this private cleanup/documentation-only finalization. No CLI/test implementation changed in this phase; the implementation agent did not repeat that suite.
- Boundary: providerInvocations=0 and behavioralAcceptance=not-run for offline readiness. No real model validation, network, dependency installation or fresh historical verdict is claimed by this Change.

## Blockers
- None.
