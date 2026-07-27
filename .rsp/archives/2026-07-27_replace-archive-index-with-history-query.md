---
kind: "refactor"
---

# Change: replace-archive-index-with-history-query

## Proposal
- Outcome: Make authoritative Archive Markdown available through one bounded `rsp history` query surface and remove the redundant generated `.rsp/archives/INDEX.md` projection.
- Why:
  - The generated Archive Index grows with every archived Change even though history inspection already reads and validates the authoritative Archive tree directly.
  - A full Markdown table is an unbounded AI context surface, creates generated-file churn on every archive operation, and can conflict across otherwise independent branches.
- Scope:
  - Remove Archive Index creation, regeneration, diagnostics, documentation, and tests from initialization, update, archive, and repair flows.
  - Route archive-history listing, filtering, detail, TUI history, and archive-trend derivation through the shared authoritative history inspection.
  - Add bounded case-insensitive history search over WorkRef and summary for both human and JSON consumers.
- Non-goals:
  - Do not replace Archive Markdown with a database or another persisted index.
  - Do not make history output a durable source of truth; Archive Markdown remains authoritative.
  - Do not add pagination, semantic/vector search, or a committed cache without measured need.

## Spec
<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->
### REMOVED
- Requirement: generated Archive Index
  - `.rsp/archives/INDEX.md` is no longer created, required, regenerated, read, repaired, or documented as an RSP-managed file.
  - Migration safely removes a legacy regular generated Archive Index identified by valid `kind: generated-index` and `index_type: archives` metadata, but fails closed rather than deleting an unrecognized file at that path.

### MODIFIED
- Requirement: authoritative archive access
  - `.rsp/archives/**/*.md` files remain the only authoritative archive records.
  - Human CLI output, compact or pretty JSON, TUI History, and status archive trends derive from the same complete fail-closed history inspection rather than a generated projection.
  - Default and filtered history results remain bounded and deterministically ordered.

### ADDED
- Requirement: bounded history search
  - `rsp history --search <text>` performs a case-insensitive literal substring match against WorkRef and summary after complete archive validation and before the result limit is applied.
  - Search composes with the existing date, kind, Group, limit, human, JSON, and compact-output contracts.
  - Empty search text fails before archive inspection with a stable machine-readable error.

### Acceptance
#### Scenario: a project is initialized or updated
- GIVEN a project with no Archive Index or a recognized legacy generated Archive Index
- WHEN `rsp init` or `rsp update` completes
- THEN `.rsp/archives/INDEX.md` does not exist
- AND an unrecognized file at that path is not deleted or overwritten

#### Scenario: an archived Change is queried
- GIVEN authoritative Archive Markdown records and no Archive Index
- WHEN a human, JSON consumer, TUI History view, or status archive trend requests archive information
- THEN the result is derived from the shared history inspection
- AND preserves deterministic validation, ordering, and bounded output

#### Scenario: history is searched
- GIVEN more matching archive records than the requested limit
- WHEN `rsp history --search history --limit 10 --json` runs
- THEN matching is case-insensitive over WorkRef and summary
- AND at most 10 newest deterministic matches are returned with truthful matched and `hasMore` metadata

## Design
- Approach:
  - Delete the Archive Index builder and make archive lifecycle commands stop scheduling index writes.
  - Reuse one history inspection result for each command projection; derive monthly trend counts from validated records instead of reparsing Markdown table rows.
  - Extend the existing history query model and CLI adapter with one optional literal search field.
- Boundaries:
  - Archive Markdown owns durable history; `rsp history` owns bounded retrieval and presentation; status and TUI consume the same inspection/query layer.
- Affected areas:
  - `src/history/`, `src/commands/history.ts`, `src/commands/archive.ts`, `src/commands/init.ts`, `src/commands/update.ts`, and `src/commands/doctor.ts`
  - `src/status/`, `src/tui/`, CLI help, README, rules, Specs, migrations, and focused integration/history tests
- Constraints:
  - Preserve no-follow filesystem checks, complete validation before filtering, bounded diagnostics, exact detail lookup, and existing JSON compatibility except for additive search fields.
  - Do not add a database dependency; a future cache must be disposable, untracked, and rebuildable from Archive Markdown.
  - Avoid duplicate archive scans within one command path where the same inspection can be shared.

## Tasks
- [x] Remove Archive Index generation and all managed-file consumers while safely handling a recognized legacy index during update/repair.
- [x] Derive status archive trends and TUI/CLI history projections from the shared authoritative history inspection.
- [x] Add bounded literal `--search` behavior to the history model, CLI, JSON output, help, and tests.
- [x] Update user documentation, runtime rules, Specs, migrations, and retained fixtures to remove the Archive Index contract.
- [x] Run focused and full project verification and record only final decisive evidence.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — passed; TypeScript and bundled CLI surfaces compile after removing the builder and extending history queries.
  - [x] `mise exec -- pnpm run lint` — passed; changed source and tests satisfy repository static rules.
  - [x] `mise exec -- pnpm run test` — passed, 555/555; initialization, update, doctor, archive, status, history, TUI, migration, and retained-evidence contracts remain coherent.
- Manual or environment:
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` — passed all four host phases and every score gate under new immutable run ID `device-discovery-boundary-archive-history-query-2026-07-27`; the prior retained run remains unchanged.
  - [x] In a temporary initialized project, two archived Changes produced no Archive Index; default/limited JSON, case-insensitive searched JSON, and status trend returned authoritative bounded results.
- Coverage:
  - Direct dual-TTY TUI History smoke was not executed because this host rejected `rsp ui` before dashboard loading. This is a non-blocking omission: TUI history source/component tests passed within the 555 successful automated tests.
  - Performance cache behavior is omitted until archive-scale measurements justify a separate Change.

## Blockers
- none
