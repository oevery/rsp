---
kind: "feature"
---

# Change: unify-tui-specs-navigation

## Proposal
- Outcome: Unify the read-only TUI shell and add Specs navigation
- Why:
  - The dashboard hard-codes Changes, Groups, and History in one component and reducer while the Skills selector uses a second terminal application, making each new read-only surface amplify duplicated navigation and loading logic.
  - Removing generated Specs indexes left the CLI as the only first-class Specs browser even though the presentation-neutral tree, detail, and search projections are already available to TUI consumers.
- Scope:
  - Extract a small shared read-only TUI shell and domain presenters without changing terminal routing, lifecycle, localization, or non-interactive CLI behavior.
  - Consolidate Changes and Groups under one Work section while preserving exact WorkRef identity, focused selection, filtering, dependency details, and next-action presentation.
  - Add a lazy-loaded Specs section backed only by the existing presentation-neutral tree, detail, and search projections, with separate Specs and Decision Record roots.
  - Add bounded document navigation, safe terminal Markdown presentation, detail scrolling, metadata filtering, explicit content search, refresh, diagnostics, and stale-result handling suitable for narrow and wide terminals.
  - Reuse terminal and display primitives with the Skills selector where this reduces duplication without placing mutation inside the read-only dashboard.
- Non-goals:
  - Do not change Specs query semantics, bounds, filesystem inspection, generated-index migration, status/history JSON, or persisted artifacts.
  - Do not add a generic Markdown plugin/page framework, execute raw HTML, persist UI state, add mouse interaction, or add a command palette.
  - Do not perform Skill installation from the read-only dashboard or weaken its separate confirmation and mutation boundary.
  - Do not change non-TTY routing, package publication, or release identity.

## Spec
### ADDED
- Requirement: The dashboard presents one cohesive read-only information architecture.
  - Primary sections are Work, Specs, and History. Work combines open Changes and Groups while retaining a visible type distinction and exact identity.
  - Tab cycles primary sections; each section retains its own selection, filter, viewport, loading, error, and detail state.
  - Existing terminal cleanup, 40-column minimum, bilingual labels, alternate-screen behavior, and lazy interactive loading remain unchanged.
- Requirement: Specs navigation reuses the authoritative query seam.
  - The Specs section lazily obtains `SpecsTreeProjection`, displays Specs and Decision Records as separate roots, and uses project-relative paths as stable selection identities.
  - Enter expands or collapses directories and loads `SpecsDetailProjection` for documents. Detail presents bounded current content through a constrained Markdown-to-Ink projection and supports vertical scrolling without parsing generated indexes.
  - Markdown presentation covers headings, paragraphs, lists and task items, blockquotes, fenced and inline code, emphasis, strong text, links, and thematic breaks. YAML frontmatter is hidden; raw HTML is never executed; unsafe terminal control sequences are removed before display.
  - The viewport is calculated from rendered physical lines, and Up/Down arrows share the same one-line scroll actions as `k`/`j` while document detail is active.
  - Metadata filtering remains local and explicit content search invokes `SpecsSearchProjection`; search results retain path, kind, heading, line, excerpt, matched/returned counts, and `hasMore`.
  - Refresh re-inspects current files, preserves selection by exact path when possible, and never silently presents a failed refresh as current. A prior successful result may remain visible only with an explicit stale warning.
- Requirement: TUI structure has explicit domain ownership.
  - The shell owns terminal-independent primary navigation, global modes, resize, shared list/detail layout, and help/footer composition.
  - Work, Specs, and History presenters own their domain-specific state, loading, rows, details, refresh behavior, and errors.
  - Shared abstractions are limited to demonstrated layout, viewport, display-cell, and async-request behavior; the implementation does not introduce a generic runtime extension system.
- Requirement: Skills retains an explicit mutation boundary.
  - `rsp skills` remains a separate interactive route and returns a typed selection before the CLI performs installation.
  - It may reuse shared terminal session or display helpers, but the read-only dashboard neither installs nor rewrites Skills.

### Acceptance
#### Scenario: Navigate the unified dashboard
- GIVEN a project containing open Changes, a Group, Specs, Decision Records, and archives
- WHEN the user opens `rsp ui` and cycles primary sections
- THEN Work, Specs, and History are reachable in order, each retains independent navigation state, and Work visibly distinguishes Changes from Groups

#### Scenario: Browse current Specs without generated indexes
- GIVEN nested current Specs and Decision Records with no generated index files
- WHEN the user opens Specs, expands directories, and enters a document
- THEN the TUI displays the shared tree and bounded current detail using exact project-relative paths

#### Scenario: Read and scroll a Markdown document
- GIVEN a Spec containing frontmatter, headings, lists, emphasis, links, code, and raw HTML
- WHEN the user opens the document and scrolls with either Up/Down or `k`/`j`
- THEN the TUI presents a readable bounded terminal projection, hides frontmatter, treats HTML as inert content, strips unsafe terminal controls, and both key pairs move through the same rendered lines

#### Scenario: Search Specs content
- GIVEN a literal appears in current tracked or untracked Specs content
- WHEN the user invokes Specs content search
- THEN the TUI displays the bounded shared search projection with heading, line, excerpt, and omitted-result state without changing files

#### Scenario: Preserve a valid view after refresh failure
- GIVEN a successfully loaded Specs tree and a later filesystem inspection failure
- WHEN the user refreshes Specs
- THEN the prior projection remains available with a visible stale/error state and no result is represented as freshly authoritative

#### Scenario: Preserve terminal and mutation boundaries
- GIVEN interactive and non-interactive invocations plus the Skills selector
- WHEN the dashboard exits normally, errors, receives a signal, or the user invokes `rsp skills`
- THEN terminal state is restored, non-interactive output remains deterministic, and only the explicit Skills flow can return an installation selection

## Design
- Approach:
  - Refactor the existing dashboard in behavior-preserving steps: extract shell/navigation primitives, introduce Work and History presenters, then add the Specs presenter and its source adapter.
  - Keep one Ink root and one terminal session for the read-only dashboard. Domain sources remain presentation-neutral siblings injected through the TUI runtime.
  - Flatten the Specs directory projection into display rows while retaining directory expansion state and exact path identity. Treat Specs and Decision Records as two explicit roots rather than merging their authority.
  - Parse document content on the lazy TUI path with `mdast-util-from-markdown`, project only supported nodes into a small presentation-neutral block/inline model, and let Ink own terminal styling and width. Add only the smallest reusable viewport primitive required by History and Specs details.
  - Keep `/` as section-local metadata filtering. Use a distinct key for submitted Specs content search so existing filter behavior remains predictable.
- Boundaries:
  - `src/specs/` continues to own inspection and tree/detail/search semantics.
  - `src/status/` and `src/history/` continue to own their presentation-neutral projections.
  - `src/tui/` owns read-only orchestration and presentation; `src/skills-tui/` retains selection and confirmation.
  - CLI routing and installation remain outside React components.
- Affected areas:
  - `src/tui/**`, focused TUI component/state/source tests, and TUI localization.
  - `src/skills-tui/**` only where shared terminal/display extraction removes demonstrated duplication.
  - `.rsp/specs/tui.md`, bilingual CLI/TUI documentation, and semantic documentation checks when public behavior changes.
- Constraints:
  - Preserve lazy Ink loading and keep React/Ink/Yoga out of ordinary commands.
  - Keep the Markdown parser on the lazy TUI import path and declare it as a direct runtime dependency.
  - Preserve the supported 40-column and 8-row compact boundary and display-cell-safe truncation.
  - Do not load Specs until its section is first visited; detail and content search remain demand-driven.
  - Use request identities so stale async tree, detail, or search responses cannot overwrite newer state.
  - Keep current package and public JSON contracts compatible.

## Tasks
- [x] Extract cohesive Work and Specs presentation modules while keeping the read-only dashboard shell responsible for navigation, async coordination, resize, and terminal input.
- [x] Consolidate Changes and Groups into the Work information architecture with retained filtering, selection, details, and next-action behavior.
- [x] Add an injected Specs source plus lazy tree, exact detail, explicit content-search, refresh/stale, and viewport state.
- [x] Implement the Specs tree/detail/search presentation and bilingual interaction labels for wide, narrow, and compact layouts.
- [x] Preserve the separate Skills mutation route while continuing to reuse the existing terminal session and display primitives.
- [x] Update authoritative TUI facts and public guidance, then complete focused and full verification.
- [x] Add a constrained Markdown presentation model with frontmatter hiding, inert HTML, and terminal-control sanitization.
- [x] Render Specs document details from rendered physical lines without weakening compact terminal bounds.
- [x] Route Up/Down and `k`/`j` through identical Specs detail scroll actions.
- [x] Add focused renderer and keyboard-interaction tests, then refresh package-wide verification evidence.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/tui/dashboard-component.test.ts test/tui/tui-core.test.ts test/tui/specs-source.test.ts test/tui/specs-display.test.ts --reporter=dot --no-file-parallelism` — 4 files and 49 tests passed; proves Work consolidation, independent section state, Specs lazy loading, tree display, exact detail, content search, visibly stale refresh safety, viewport behavior, and bilingual bounded rendering.
  - [x] `mise exec -- pnpm exec vitest run test/tui/specs-source.test.ts test/tui/specs-display.test.ts test/tui/tui-core.test.ts test/tui/dashboard-component.test.ts test/tui/history-source.test.ts test/tui/history-detail.test.ts test/tui/terminal-host.test.ts test/tui/skills-component.test.ts test/tui/skills-terminal-host.test.ts test/tui/cli-routing.test.ts --reporter=dot --no-file-parallelism` — 10 files and 74 tests passed before the final presentation-only extraction; proves Specs source integration, nested roots, Decision Records, untracked content, History compatibility, terminal cleanup, Skills separation, routing, localization, and 40-column behavior.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed on the final tree; 66 test files and 759 tests passed, proving package-wide compatibility.
  - [x] `mise exec -- pnpm run docs:check`, `mise exec -- pnpm run docs:build`, `node dist/cli.mjs check --focused --json`, and `git diff --check` — passed; proves bilingual documentation, focused artifacts, and changed-text hygiene remain coherent.
  - [x] `mise exec -- pnpm exec vitest run test/tui/markdown-presentation.test.ts test/tui/specs-display.test.ts test/tui/specs-source.test.ts test/tui/tui-core.test.ts test/tui/dashboard-component.test.ts --reporter=dot --no-file-parallelism` — 5 files and 51 tests passed after review resolution; covers supported Markdown structures, rendered-line wrapping and viewport behavior, frontmatter hiding, inert HTML, terminal-control sanitization, equivalent arrow/`j`/`k` scrolling, and immediate reverse movement after an extra bottom-boundary keypress.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed after the enhancement.
  - [x] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=false mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — 67 files and 761 tests passed after review resolution; command-local Git configuration prevented machine commit-signing policy from blocking temporary-fixture commits without changing repository or global configuration.
  - [x] `mise exec -- pnpm run docs:check` and `mise exec -- pnpm run docs:build` — passed; 7 bilingual page pairs and 30 Markdown files checked, then the VitePress site built successfully.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed after the enhancement with no focused errors, warnings, or changed-text hygiene failures.
### Optional
- Manual or environment:
  - [x] Exercise `rsp ui` in a real dual-TTY terminal at wide, narrow, 40-column, and short-height sizes, including Specs search/detail scrolling and signal exit — user-confirmed visual and interaction acceptance on 2026-08-14.
- Coverage:
  - Automated coverage owns deterministic state, rendering, source integration, and terminal lifecycle; real-terminal visual ergonomics remain explicit manual acceptance.

## Blockers
- none
