---
kind: "feature"
---

# Change: rsp-4-runtime/specs-query

## Proposal
- Outcome: Replace committed Specs indexes with direct dynamic navigation and bounded search
- Why:
  - Generated per-directory `00-index.md` files duplicate information that can be derived from the current Specs tree and create committed maintenance churn.
  - Agents and humans need current ownership navigation and bounded source-attributed search; a second cached repository index is not required to remove generated navigation.
- Scope:
  - Add dynamic Specs tree, detail, and bounded literal-search commands with stable human and JSON output.
  - Remove product and Skill dependence on generated `00-index.md` navigation while preserving complete fail-closed Specs tree inspection.
  - Share one presentation-neutral Specs query model with CLI, TUI, Broker, and Web consumers.
  - Provide exact safe-removal classification for metadata-recognized generated indexes to the terminal migration Change.
- Non-goals:
  - Move Spec, Decision, Change, archive, `AGENTS.md`, or `CONTEXT.md` authority out of Markdown.
  - Add SQLite indexing, embeddings, a vector database, a knowledge graph, filesystem watchers, or automatic memory promotion in the first 4.0 release.
  - Search dependencies, generated artifacts, credentials, arbitrary user files, complete conversations, or raw command logs.
  - Let query results substitute for rereading a source before material design or mutation.

## Spec
### ADDED
- Requirement: Specs navigation and search are direct, deterministic, bounded, and independent from committed generated indexes.
  - `rsp specs` projects the valid Specs hierarchy from current files and supports stable human and JSON output.
  - Bounded literal search returns exact source path, document kind, title, heading, excerpt, and current working-tree identity.
  - CLI, TUI, Broker, and Web consumers share one query model and do not parse or cache separate semantic copies.
  - Decision Records remain separately identified and generated artifacts remain excluded from current-fact ownership.
  - Specs tree validation retains no-follow traversal, regular-file requirements, configured Decision Record boundaries, diagnostics, and reserved-path protection after index generation is removed.
  - Search cost is bounded by explicit candidate, file-size, result, and excerpt limits; performance evidence may justify a separately shaped acceleration layer later.

### Acceptance
#### Scenario: fresh clone without generated indexes
- GIVEN an initialized project containing Specs and no Broker, database, or `00-index.md`
- WHEN a user runs `rsp specs --json`
- THEN the complete valid hierarchy is derived from current Markdown with stable paths, titles, summaries, and diagnostics

#### Scenario: current working-tree search
- GIVEN a Spec whose tracked or untracked content changes
- WHEN bounded Specs search runs
- THEN results and excerpts come from the current readable file rather than a stale generated or cached copy

#### Scenario: invalid Specs tree
- GIVEN a symlink, special entry, collision, unreadable path, or unrecognized reserved file
- WHEN navigation, search, update, or doctor inspects Specs
- THEN the same fail-closed structural error remains visible without writing a replacement index

#### Scenario: generated index migration input
- GIVEN a metadata-recognized generated `00-index.md`
- WHEN 4.0 migration inspects the project
- THEN it is classified as safely removable while unrecognized content at the reserved path remains owner-controlled

## Design
- Approach:
  - Extract authoritative Specs tree inspection from the existing index planner before removing rendering and health requirements.
  - Add one direct filesystem query model shared by CLI JSON, TUI, Broker, and Web.
  - Implement bounded literal search over eligible current Markdown with deterministic ordering and explicit limits.
  - Retain generated-index recognition only as a migration classifier until the terminal compatibility Change removes obsolete creation and health contracts.
- Boundaries:
  - Markdown files own facts and rationale; the Specs query model owns navigation and bounded search projections.
  - The Broker may expose the query model, but one-shot CLI access remains direct and service-independent.
  - Compatibility migration owns removal of recognized committed indexes and versioned user guidance.
- Affected areas:
  - Specs tree inspection, CLI registration, JSON types, update and doctor behavior, Skills, documentation, TUI/Web projections, and package checks.
  - Removal or replacement of `specs-index.ts`, generated-index tests, reserved identities, and current Specs-index Specs.
  - New tree, detail, search-bound, current-file, and migration-classification tests.
- Constraints:
  - Search and navigation never write product Markdown or select current work.
  - Output is deterministic for the same source tree and bounded in candidates, file sizes, records, excerpts, diagnostics, and paths.
  - Fresh clones retain useful direct navigation and search without setup, a daemon, a database, or a warm cache.

## Tasks
- [x] Extract complete Specs tree inspection from generated-index planning and define the shared direct query contracts.
- [x] Implement `rsp specs` human and JSON tree, detail, and bounded literal search over current files.
- [x] Remove runtime dependence on `00-index.md` and provide exact safe-removal classification to the terminal migration Change.
- [x] Update Skills, docs, TUI/Web-facing projections, package inventory, and focused structural and query coverage.

## Verify
### Required
- Automated:
  - [x] Specs tree equivalence tests across current valid, nested, empty, invalid, and Decision Record layouts — proves: dynamic navigation preserves structural safety without generated files.
  - [x] Current-file tree, detail, and bounded-search tests — proves: deterministic results use current Markdown without generated or cached semantic copies.
  - [x] Bound, reserved-content, and generated-index classification tests — proves: direct queries remain proportionate and migration is owner-safe.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — proves: CLI and shared query projections remain package-valid.
### Optional
- Manual or environment:
  - [ ] Search a representative large repository and record whether direct bounded search exposes a measured need for a separately shaped acceleration layer.
- Coverage:
  - Group migration and browser checks later prove exact 3.x cleanup and Web consumption.

## Blockers
- none

<!-- Fresh implementation evidence (2026-08-08): build, typecheck, lint, focused Specs and integration tests (189 tests), bilingual docs checks, clean-install package checks, and git diff --check passed. The optional representative large-repository performance check was not run. -->
<!-- Fixed review resolution (2026-08-08): [P1] accepted and corrected with no-follow opening plus pre-open/opened-file identity validation and a controlled symlink-replacement regression; [P2] accepted and corrected with CommonMark closing-sequence parsing plus C#, F#, and spaced-closing-hash coverage. Focused tests, build, typecheck, lint, and diff check passed; fixed-scope re-review is pending. -->
<!-- Fixed re-review resolution (2026-08-08): new [P2] accepted and corrected by reading at most maxFileBytes + 1 bytes from the validated file handle and returning specs_file_too_large when the extra byte exists. A deterministic post-stat growth regression covers the shared detail and search read path. Focused Specs and integration tests (192 tests), build, typecheck, lint, and scoped diff checks passed; same-scope re-review is pending. -->
