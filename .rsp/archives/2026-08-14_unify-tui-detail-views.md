---
kind: "feature"
---

# Change: unify-tui-detail-views

## Proposal
- Outcome: Give Work, Specs, and History one coherent detail-reading experience while preserving each scope's strongest semantic default
- Why:
  - Specs now has document search, safe Markdown presentation, and scrolling, while Work and History still use fixed semantic details with different truncation and navigation behavior.
  - Treating every scope as raw Markdown would hide actionable status and archive evidence, but leaving document access exclusive to Specs makes the unified navigation feel uneven.
- Scope:
  - Introduce one shared detail shell and rendered-line viewport contract with consistent `↑`/`↓`, `j`/`k`, position, loading, error, and compact-terminal behavior.
  - Keep Work status and History evidence as the default semantic views, and add a read-only `Document` view for the exact current Change/Group or archived Change.
  - Reuse the existing constrained terminal Markdown presentation for all document views.
  - Extend that presentation only for repository-evidenced gaps: Markdown tables and strict inert RSP metavariables.
- Non-goals:
  - Do not pursue GitHub pixel parity, execute raw HTML, render images, add horizontal scrolling, or implement the complete GFM surface.
  - Do not replace Work status or History evidence with Markdown as the default view.
  - Do not change status/history/specs public JSON, archive semantics, project files, or dashboard mutation boundaries.
  - Do not add mouse interaction, persisted view state, or a generic page/plugin framework.

## Spec
### ADDED
- Requirement: Detail navigation is coherent across dashboard scopes.
  - Work, Specs, and History use one terminal-bounded detail shell with consistent title metadata, rendered-line viewport, scroll position, diagnostics, and scroll keys.
  - `↑`/`↓` and `k`/`j` move one rendered line without accumulating offset beyond either boundary; resize re-clamps the visible viewport.
  - The supported 40-column and 8-row compact boundary, alternate-screen lifecycle, and lazy TUI loading remain unchanged.
- Requirement: Semantic defaults remain authoritative while exact documents are available on demand.
  - Work opens on `Status`, retaining progress, dependencies, blockers, slices, and next action. A local view toggle opens the exact bounded current Change or Group Brief as `Document`.
  - History opens on `Summary`, retaining scenario, checkbox, and bounded evidence projections. The same local toggle opens the exact cached archive record as `Document` without weakening stale-path or replacement safety.
  - Specs remains document-first and uses the same shell and renderer without adding an artificial summary mode.
  - View toggles are scope-local, reset safely when selection identity changes, and never mutate project state.
- Requirement: Terminal Markdown presentation grows from observed repository needs.
  - Pipe tables are parsed as tables and projected as bounded terminal content: aligned columns when they fit and stacked `field: value` rows when they do not.
  - Only strict no-attribute RSP metavariables with safe lowercase hyphenated names, including `<reason>`, are presented as inert inline code; arbitrary HTML remains inert text.
  - Existing frontmatter hiding, control sanitization, headings, lists, tasks, code, emphasis, links, grapheme-safe wrapping, and physical-line viewport behavior remain compatible.

### Acceptance
#### Scenario: Read all scopes through one detail shell
- GIVEN current Work, current Specs, and archive History entries
- WHEN the user opens each detail and scrolls it
- THEN each scope exposes the same bounded position and one-line key behavior while retaining its scope-specific default content

#### Scenario: Inspect the exact Work document without losing status
- GIVEN an open Change or Group selected in Work
- WHEN the user opens detail and toggles from Status to Document
- THEN the TUI safely reads and renders the exact project-relative Markdown file, and toggling back restores the semantic status view

#### Scenario: Inspect an archived document from validated history
- GIVEN a History row from the last successful bounded inspection
- WHEN the user toggles from Summary to Document
- THEN the TUI renders the exact bounded archive content associated with that cached row and fails visibly if the file changed or became unsafe

#### Scenario: Present repository tables and metavariables safely
- GIVEN a document containing a pipe table, `<change-work-ref>`, `<reason>`, and arbitrary HTML
- WHEN the document view renders at wide and narrow widths
- THEN the table uses a readable bounded wide or stacked projection, strict RSP metavariables appear as inert code, arbitrary HTML remains inert, and no line exceeds the terminal width

## Design
- Approach:
  - Extract a presentation-neutral `DetailViewport` input from the current Markdown viewport and reuse one shell component for headers, rendered rows, position, loading, and diagnostics. Domain presenters continue to supply their own body rows.
  - Extend `TuiHistorySource.detail()` to return both the existing `HistoryDetailOutput` and exact bounded archive content from `readArchiveHistoryDocument()`; keep the validated record cache and failure contract unchanged.
  - Add an injected Work document source that accepts only the exact `record.output.path` or `group.path`, resolves it through the open-work model, performs a bounded no-follow read, and returns project-relative identity plus content.
  - Keep view mode in dashboard state by scope. Use `v` as the local Status/Summary/Document toggle while detail is open; Specs ignores it because it is already document-first.
  - Add GFM table parsing to the lazy Markdown path and project table nodes into the existing styled-line model. Treat strict metavariables as a narrow HTML-node exception, never as executable HTML.
- Boundaries:
  - `src/status/` and Work source logic own exact current-work identity and safe reads; Work presenters own status/document selection and display.
  - `src/history/` owns archive identity, bounded reads, and structured evidence; the TUI source only adapts the combined document result.
  - `src/tui/markdown-presentation.ts` owns terminal document semantics; the shared detail shell owns layout and viewport chrome, not domain interpretation.
  - `src/specs/` remains the only owner of Specs inspection, detail, and search semantics.
- Affected areas:
  - `src/tui/**`, `src/history/query.ts` consumers, focused source/presentation/component tests, and lazy-loader boundaries.
  - Direct Markdown dependencies, `.rsp/specs/tui.md`, and bilingual CLI guidance.
- Constraints:
  - Preserve unrelated dirty work from `unify-tui-specs-navigation`; this Change builds on it without rewriting or archiving it.
  - Keep Markdown/GFM dependencies and document readers on the lazy interactive path.
  - Bound current and archived document reads, reject symlinks and identity replacement, sanitize terminal controls, and keep raw HTML inert.
  - Prefer semantic views by default and do not duplicate status/history parsing inside React components.

## Tasks
- [x] Extract a shared rendered-line document detail shell and scope-local view state with consistent scrolling and resize clamping.
- [x] Return exact archive content through the validated History source and add Summary/Document detail modes.
- [x] Add a bounded safe Work document source and Status/Document detail modes for Changes and Group Briefs.
- [x] Add terminal table projection and strict inert RSP metavariable presentation on the lazy Markdown path.
- [x] Update TUI facts and bilingual guidance, then complete focused and package-wide verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/tui/work-source.test.ts test/tui/history-source.test.ts test/tui/markdown-presentation.test.ts test/tui/dashboard-component.test.ts --reporter=dot --no-file-parallelism` — 4 files and 30 tests passed; proves exact bounded Work reads, cached History documents, semantic/document toggles, shared scrolling, responsive tables, metavariable allowlisting, inert HTML, sanitization, and display-cell bounds.
  - [x] `mise exec -- pnpm exec vitest run test/tui/cli-routing.test.ts test/clean-install-check.test.ts --reporter=dot --no-file-parallelism` — 2 files and 9 tests passed; proves Markdown/GFM dependencies stay on the lazy TUI path and ship in the production dependency graph.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `mise exec -- pnpm run docs:build` — passed; 7 bilingual page pairs and 30 Markdown files checked.
  - [x] `mise exec -- pnpm exec vitest run test/tui/dashboard-component.test.ts test/tui/tui-core.test.ts test/tui/history-detail.test.ts --reporter=dot --no-file-parallelism` — 3 files and 53 tests passed after dynamic chrome resolution; proves Work and History semantic detail identity remains visible while loading, errors, summaries, refresh state, and diagnostics consume terminal rows.
  - [x] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=false mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — 68 files and 766 tests passed after dynamic chrome resolution; command-local Git policy isolated temporary fixture commits without changing repository or global configuration.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed after semantic viewport resolution with no focused errors, warnings, or changed-text hygiene failures.
  - [x] Fresh fixed-scope review — clean after the accepted Detail Shell finding was resolved, with no new actionable finding.
### Optional
- Manual or environment:
  - [x] Exercise Work, Specs, and History details in a real dual-TTY terminal at wide, narrow, 40-column, and short-height sizes — user-confirmed visual and interaction acceptance on 2026-08-14.
- Coverage:
  - Automated evidence owns deterministic sources, state, rendering, width, and terminal lifecycle; real-terminal visual balance remains explicit manual acceptance.

## Blockers
- none
