---
kind: "feature"
---

# Change: cli-machine-output/add-bounded-history-query

## Proposal
- Summary: Add a bounded CLI query for archived Change summaries and opt-in detail.
- Why:
  - `rsp status` currently exposes only monthly archive counts, while agents and scripts must inspect generated index Markdown or search archive files to find relevant completed work.
  - Returning the complete archive in `status --json` would mix current navigation with history retrieval and create unbounded output.
- Scope:
  - Add a dedicated history command that returns a bounded, deterministic list of archived Change metadata.
  - Support filters that narrow history before serialization.
  - Support one exact archived WorkRef detail lookup with explicitly bounded content.
  - Expose the archive query and detail model through presentation-neutral modules that CLI and later TUI presenters can share.
- Non-goals:
  - Replacing Git history, providing full-text search, indexing arbitrary project documents, or creating a history database.
  - Returning every archived Change body by default or changing archive file ownership.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: archived Change history is queryable through a bounded machine-readable CLI surface.
  - The default query returns a deterministic limited list containing at least archive date, WorkRef, kind, summary, and project-relative archive path.
  - Consumers can narrow the list by stable filters such as date range, kind, or Group before records are serialized.
  - An exact WorkRef query returns one archived record or a structured not-found/ambiguous error.
  - Detailed content is opt-in and bounded; the default list never embeds all archive Markdown bodies.
  - Archive files and their generated index remain authoritative, and incomplete or inconsistent inspection fails visibly.

### Acceptance
#### Scenario: agent finds recent relevant history
- GIVEN a project has archived Changes across multiple dates, kinds, and Groups
- WHEN an agent requests a limited filtered JSON history list
- THEN the CLI returns only matching deterministic summaries up to the requested bound
- AND reports enough selection metadata to request one exact archived record next

#### Scenario: agent requests one archived Change
- GIVEN an exact archived WorkRef exists
- WHEN its history detail is requested as JSON
- THEN the CLI returns that record's archive identity, metadata, evidence-oriented detail, and source path
- AND does not include unrelated archive bodies

#### Scenario: archive inspection is incomplete
- GIVEN an archive entry cannot be read or its identity is inconsistent
- WHEN history is queried
- THEN the command returns a structured failure instead of silently presenting partial history as complete

## Design
- Affected boundaries:
  - `src/cli.ts` owns the public command and argument surface.
  - Archive/work-tree inspection owns safe file discovery and identity validation.
  - A dedicated history command owns filtering, bounding, output shape, and human rendering.
  - `src/types.ts`, integration tests, `README.md`, and stable Specs own the published contract.
- Constraints:
  - Reuse authoritative archive files and generated metadata rather than adding a cache or database.
  - Apply bounds before reading or serializing optional detailed content wherever possible.
  - Preserve flat or one-Group-level WorkRef semantics and deterministic ordering.
- Settled command contract:
  - `rsp history [--limit <n>] [--since <YYYY-MM-DD>] [--until <YYYY-MM-DD>] [--kind <kind>] [--group <group>] [--json] [--compact]` lists matching archives.
  - `rsp history <work-ref> [--json] [--compact]` requests one exact archived WorkRef. List-only filters are rejected for detail lookup.
  - List queries default to 20 records and accept an integer limit from 1 through 100. The first release has no offset or cursor; consumers narrow the authoritative archive set with inclusive date, exact kind, and exact Group filters before the limit is applied.
  - Results sort by archive date descending, WorkRef ascending, and source path ascending. The response reports the applied filters, matched and returned counts, whether additional matches were omitted by the limit, and the project-relative archive path as a stable record identity.
  - Detail returns identity, kind, bounded summary, archive date, project-relative source path, scenario and checkbox counts, and bounded evidence lists derived from `Tasks`, `Verify`, and `Blockers`. Each evidence list contains at most 20 non-empty items, each item and summary contains at most 500 Unicode code points, and truncation is explicit.
  - Detail never returns raw Markdown or unrelated archive bodies. Multiple archive generations with the same WorkRef return an ambiguous error with candidate archive identities rather than choosing by date; internal consumers such as the TUI may request detail by the unique project-relative archive identity.
  - JSON follows the existing one-document envelope, structured diagnostic, and opt-in `--compact` conventions. Human output is a presenter over the same result model.
  - The command accepts zero or one positional WorkRef; a second positional argument fails before archive inspection in human, JSON, and compact JSON modes.
  - Diagnostics and ambiguous candidate identities are each capped at 20 entries with total, returned, and `hasMore` metadata. Human output renders only the same bounded entries and reports the omitted count. Archive read failures are not duplicated into the runtime channel.
- Shared seam:
  - A presentation-neutral archive-history module owns safe discovery, strict identity parsing, metadata extraction, filtering, ordering, bounds, detail selection by WorkRef or stable archive identity, and structured diagnostics.
  - History discovery includes executable `# Change:` archives and recognizes archived `# Change Group:` briefs as valid non-result entries. It does not expose Group Briefs as first-release history records.
  - The archive tree is inspected completely and fails closed for unreadable, malformed, or identity-inconsistent entries even when a query filter would otherwise exclude the bad entry. Generated `archives/INDEX.md` remains a derived output rather than the query source.
  - A missing archive root is incomplete inspection rather than empty history. Executable archive headings may not claim the reserved grouped identities `*/brief` or `*/00-brief`, including collision-suffixed archive filenames.
  - `src/commands/history.ts` owns CLI rendering only. TUI modules may consume the shared query seam later but are outside this Change.

## Tasks
- [x] Settle and record the list, filter, continuation, and single-record detail contract.
- [x] Implement archive discovery, deterministic bounded filtering, and structured error handling.
- [x] Implement human and JSON history list/detail output without changing archive ownership.
- [x] Document examples and add focused integration fixtures for flat, grouped, filtered, detailed, empty, and invalid archive cases.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts`
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
- Manual:
  - [x] Query this repository's archive with the settled default and filters, then retrieve one exact flat and one grouped Change without emitting unrelated archive bodies.
- Durable updates:
  - [x] Update `.rsp/specs/design.md` and `README.md` with the settled archive-query boundary and command contract if implementation confirms them.

### Observed verification (2026-07-24)
- RED: `mise exec -- pnpm exec vitest run test/history-query.test.ts` failed because `src/history/query.js` did not exist; after the shared inspection/query/detail seam was added, the same command passed 3 tests.
- RED: `mise exec -- pnpm exec vitest run test/integration.test.ts -t 'history command'` failed four cases with `Unknown command history`; after CLI registration and presentation were added, the same focused integration command passed all 4 cases.
- `mise exec -- pnpm exec vitest run test/integration.test.ts` passed all 159 integration tests after review corrections. `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, focused history tests, and `git diff --check` passed.
- Manual repository queries returned a bounded list plus exact detail for flat `add-ink-tui-dashboard` and grouped `skill-capability-research/synthesize-shaping-capability`; detail contained only the selected record's bounded evidence and no raw-content field.
- Fresh post-correction `mise exec -- pnpm run test` passed 408 of 410 tests. The two failures are retained-package identity assertions in `test/native-design-composition.test.ts`: the evaluator reports only `behavior_files_match: false` because the freshly built `dist/cli.mjs` no longer matches the immutable pre-change retained package hash; executed Skill, published Skill, and inventory bindings still match. No retained evidence was overwritten or rescored.

### Observed review correction (2026-07-24)
- F1 (`accepted`) RED showed collision-suffixed executable archives could claim reserved `release/brief` and `release/00-brief` identities. GREEN rejects both with `archive_work_ref_invalid` while preserving real `# Change Group:` brief recognition.
- F2 (`accepted`) RED showed a missing archive root produced an empty successful history result. GREEN preserves `rootExists`, emits bounded `archive_root_missing`, and returns structured `archive_inspection_incomplete` with exit one.
- F3 (`accepted`) RED showed a second positional argument was ignored. GREEN rejects two or more positionals before inspection in human, JSON, and compact JSON modes; all exit one and machine modes preserve stdout-only structured errors.
- F4 (`accepted`) RED showed diagnostics and ambiguity candidates could grow with the archive tree. GREEN caps each at 20 deterministic entries, returns `total`, `returned`, and `hasMore`, renders the same bounded human output with omitted counts, and keeps archive read failures only in diagnostics instead of duplicating them through runtime.
- Correction verification: `mise exec -- pnpm exec vitest run test/history-query.test.ts` passed 7 tests; `mise exec -- pnpm exec vitest run test/integration.test.ts` passed 159 tests; build, typecheck, lint, and `git diff --check` passed. Retained evidence was not rerun, overwritten, or rescored.
- Fresh fixed-scope re-review resolved F1-F4 and returned `clean` with no new findings.
- Authorized real-host verification created the new immutable run `device-discovery-boundary-bounded-history-query` without replacing prior evidence. `node scripts/native-design-composition-eval.mjs --run-real` passed every phase and gate for exact package `2e5beadd87cd9cb6b898ccad8c2f18ea0290d1fc5d9a67b7f87cba4617e5d114`; the retained evaluator then passed with no blockers.
- Final `mise exec -- pnpm run test` passed all 410 tests across 40 files after the retained identity moved to the new run.

## Blockers
- none
