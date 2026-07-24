---
kind: "feature"
---

# Change: add-tui-history-browser

## Proposal
- Outcome: Add bounded archive-history browsing to the read-only TUI
- Why:
  - The dashboard only navigates current Changes and Groups even though the CLI history query will expose safe, bounded completed-work discovery.
  - Human maintainers should be able to inspect recent completed work without leaving the interactive dashboard or loading the complete archive.
- Scope:
  - Add a third `History` scope beside `Changes` and `Groups`.
  - Load a bounded recent archive list on demand through the shared history query seam and retrieve structured detail only for the selected record.
  - Preserve the existing read-only terminal lifecycle, responsive layout, localization, refresh, filtering, and error behavior.
- Non-goals:
  - Mutating, restoring, reopening, comparing, or deleting archived Changes.
  - Full-text search, unbounded loading, pagination, raw Markdown rendering, or adding archive data to `ProjectStatusSnapshot`.
  - Changing CLI history semantics or the public status JSON contract.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: the read-only dashboard provides bounded archive-history navigation without coupling current status inspection to archive detail.
  - `Tab` cycles deterministically through `Changes`, `Groups`, and `History`; existing scopes retain their current behavior.
  - The primary dashboard header always exposes all three scope labels in cycle order and marks the active scope textually, while the footer names the complete `Changes → Groups → History` Tab path; both remain single-line at the supported 40-column minimum in English and Simplified Chinese.
  - Entering `History` lazily requests the default bounded history list and never embeds the complete archive in the current project-status snapshot.
  - History rows show archive date, WorkRef, kind, and summary; selection uses the unique project-relative archive identity so repeated WorkRefs remain distinct, while viewport scrolling, `/` filtering over loaded rows, resize, help, and empty states remain deterministic.
  - `Enter` requests and displays the selected record's structured detail through the shared history seam; `Esc` returns to the history list.
  - `r` refreshes the active History list when that scope is selected and preserves the last valid result on failure, matching the dashboard's existing refresh contract.
  - Loading, empty, bounded-result, ambiguous-detail, oversized-record, and inspection-failure states are localized in English and Simplified Chinese while identities, paths, kinds, dates, and project-authored content remain unchanged.
  - Structured Tasks, Verify, and Blockers evidence renders as terminal-native lists: RSP checkbox and bullet prefixes become textual status markers, long items wrap by display cells with a hanging indent, and viewport omission remains explicit. The projection budgets actual physical rows across all evidence sections and does not parse or render general Markdown.
  - History inspection is read-only and does not change `rsp status`, `rsp status --json`, or non-interactive import isolation.

### Acceptance
#### Scenario: maintainer browses recent completed work
- GIVEN an interactive RSP project with more archived Changes than the default history bound
- WHEN the maintainer enters `History`, filters the loaded rows, selects one record, and opens detail
- THEN the dashboard shows only the bounded recent result and the selected record's structured detail
- AND it does not load raw or unrelated archive bodies or modify `.rsp/`

#### Scenario: history inspection fails
- GIVEN the dashboard has one last valid history result
- WHEN refresh or detail inspection returns a structured archive diagnostic
- THEN the dashboard retains the last valid result and shows a localized actionable error
- AND current Changes and Groups remain navigable

## Design
- Approach:
  - Consume the presentation-neutral history query and detail functions established by `cli-machine-output/add-bounded-history-query`; do not import the CLI command presenter.
  - Extend dashboard state with a third scope and independent bounded history list/detail loading state rather than widening `ProjectStatusSnapshot`.
  - Trigger list inspection on first entry and explicit refresh, and detail inspection only on `Enter` for the selected archive identity.
  - Model dashboard items as a discriminated union and keep scope-specific selection, filter, viewport, loading, last-valid result, and detail state so asynchronous history results cannot replace current-work state or select the wrong archive generation.
  - Project bounded evidence into terminal lines before presentation: recognize only the RSP list prefixes `[x]`, `[ ]`, `[/]`, `[-]`, `-`, and `*`; preserve the remaining project-authored text including inline Markdown punctuation; wrap by grapheme/display width with continuation indentation; and allocate the remaining physical rows fairly across Tasks, Verify, and Blockers.
- Boundaries:
  - Archive discovery, filtering, bounds, identity, and structured failures remain owned by the shared history core.
  - `src/tui/state.ts` owns history navigation and last-valid-result state; `src/tui/app.tsx` owns Ink presentation and user input; TUI i18n owns only labels and diagnostics.
  - `src/tui/entry.tsx` injects inspection functions so component and terminal-host tests use the same seam without importing command modules.
- Affected areas:
  - `src/tui/state.ts`, `src/tui/app.tsx`, `src/tui/entry.tsx`, and `src/tui/i18n/`
  - `test/tui/`, `README.md`, and `.rsp/specs/design.md`
- Constraints:
  - Keep React, Ink, Yoga, and TUI catalogs lazy-loaded behind interactive routing.
  - Do not add archive history to `ProjectStatusSnapshot`, change status presenters, duplicate archive parsing, or issue unbounded queries.
  - Do not add a Markdown renderer or another runtime dependency; the shared history core continues returning bounded structured evidence rather than raw Markdown.
  - Keep all key-driven behavior read-only and preserve current alternate-screen cleanup and signal semantics.

## Tasks
- [x] Add the third dashboard scope and independent bounded history list/detail state.
- [x] Add lazy history inspection, refresh, selection, filtering, detail, and failure behavior through the shared seam.
- [x] Add English and Simplified Chinese history presentation and responsive component coverage.
- [x] Document the TUI history workflow and update the stable dashboard boundary after implementation confirms it.
- [x] Make all three dashboard scopes and the active scope discoverable on the primary screen without opening help.
- [x] Render History evidence as readable, hanging-wrapped terminal lists while preserving the physical-row bound.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/tui` — proves: state, component, i18n, routing, refresh, and terminal-host behavior.
  - [x] `mise exec -- pnpm run build` — proves: production TypeScript and lazy TUI bundles compile.
  - [x] `mise exec -- pnpm run lint` — proves: repository lint constraints hold.
  - [x] `mise exec -- pnpm run test` — proves: full CLI, core, status, and TUI regression coverage.
  - [x] Focused dashboard navigation test — proves: the initial frame exposes all scopes, `Tab` moves the textual active marker, and English/Simplified Chinese fit at 40x8.
  - [x] Focused History evidence projection test — proves: checkbox/bullet markers, wide-character wrapping, hanging indentation, fair physical-row allocation, and truncation remain deterministic without Markdown rendering.
- Manual or environment:
  - [x] Run `rsp ui --lang en` and `rsp ui --lang zh-CN` in this repository; enter History, filter, open one detail, refresh, resize, and return to current work without modifying `.rsp/`.
- Coverage:
  - Real terminal rendering remains a manual gate; component tests do not prove every terminal emulator's display behavior.

### Observed verification (2026-07-24)
- RED: `mise exec -- pnpm exec vitest run test/tui/tui-core.test.ts test/tui/dashboard-component.test.ts test/tui/terminal-host.test.ts` failed 4 focused cases because the reducer had only two scopes, no history loaders, no archive-path selection, and no localized history loading/error states. GREEN: the same focused scope passed 22/22 after the independent history state and injected query/detail seam landed; the final `mise exec -- pnpm exec vitest run test/tui` passed 28/28 across 4 files.
- Manual RED: the first 80x24 English PTY detail rendered every bounded core evidence item and overflowed the terminal. A focused component test then failed because the viewport projection exposed a third task item. GREEN: history detail now caps evidence items by terminal height, truncates every displayed item by terminal cell width, and marks omitted content; the focused test and full TUI suite passed.
- `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `node dist/cli.mjs check --focused`, and `git diff --check` passed after the final responsive-detail correction.
- Real PTY verification passed in English at 80x24 and Simplified Chinese at 120x30: `Tab` reached History lazily, the repository returned 20/66 bounded records, local filtering retained archive-path selection, `Enter` loaded only one structured detail, `r` refreshed History while retaining the list, `Esc` returned to the list, and the next `Tab` returned to current Changes. The final bounded detail fit both terminal sizes without the observed overflow.
- `mise exec -- pnpm run test` passed 413/415 tests across 40 files. Only the two retained-package identity assertions in `test/native-design-composition.test.ts` failed because this Change's rebuilt `dist/cli.mjs` no longer matches the immutable package hash retained by the prerequisite CLI Change. Product, CLI, history, status, and TUI tests passed; retained evidence was not changed, rerun, or weakened.

### Review correction dispositions (2026-07-24)
- F1 P1 — `accepted`: the detail loader reinspected the complete archive tree after every successful list. A TUI-owned history source now atomically caches the strictly validated internal `ArchiveHistoryRecord` values for only the successful bounded result; detail reads the selected cached record directly, and a failed refresh leaves the previous cache intact.
- F2 P2 — `accepted`: the first responsive projection assigned a fixed item count independently to each evidence section instead of budgeting actual rendered rows. The projection now subtracts fixed dashboard/detail rows, shares the remaining rows round-robin across Tasks/Verify/Blockers, and renders each section's label, first item, and truncation marker on one physical row. Height 16 and 20 fixtures with all sections non-empty and truncated prove 2/2/1 and 3/3/3 row allocation respectively.
- F3 P2 — `accepted`: repeated History refreshes ran concurrently. History list refresh now mirrors status refresh serialization: one request runs, any number of overlapping requests coalesce into one queued run, and no third run is retained.
- F4 P2 — `accepted`: detail errors were global to History detail state and appeared after selection moved. The reducer now stores the failed archive path, and the presenter shows the error only when it matches the currently selected path.
- F5 P2 — `accepted`: History list labels and detail identity fields could rely on Ink wrapping when WorkRef, kind, or path exceeded the terminal width. Shared display-cell formatters now truncate the complete list row and complete detail title/kind/path field; focused coverage includes a long wide-character kind.
- F6 P3 — `accepted`: the list empty-state guard checked History loading even when Changes or Groups was active. Only the active History scope now suppresses its empty placeholder while loading; current-work empty states remain visible during background History I/O.

### Observed review correction (2026-07-24)
- F1 RED: `mise exec -- pnpm exec vitest run test/tui/history-source.test.ts` failed because `src/tui/history-source.js` did not exist. GREEN passed 1/1 and proved detail performs no reinspection and a failed refresh does not replace the last successful internal path cache.
- F2 RED: `mise exec -- pnpm exec vitest run test/tui/history-detail.test.ts` first failed because the projection did not exist, then exposed unfair 3/1/1 and 4/4/1 allocations at heights 16 and 20. GREEN passed both exact physical-row budget cases with 2/2/1 and 3/3/3 allocations.
- F3 RED: the focused component test observed four total history inspections after an initial load plus three repeated refresh keys, instead of the allowed initial load plus one running refresh. GREEN observed one running and exactly one queued refresh.
- F4 RED: a failed first record's detail error remained visible after selection moved to the second archive path. GREEN scoped the error to the first path.
- F5 RED: the presentation-neutral display-budget test failed because complete-row and complete-field formatters did not exist. GREEN bounds both outputs by display cells and marks truncation for long wide-character kinds; the Ink component uses the same formatters.
- F6 RED: while History remained loading in the background, the empty Changes view rendered only its detail-pane placeholder instead of both list and detail empty states. GREEN restored the active-scope list placeholder.
- Final focused verification: `mise exec -- pnpm exec vitest run test/tui` passed 36 tests across 6 files; `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` passed. Retained evidence, archives, CLI history core, and Git state were not modified by this correction pass.
- Fixed-scope re-review: clean after the original six findings were corrected; no actionable finding remained in the fixed TUI scope.

### Second review correction dispositions (2026-07-24)
- N1 P2 — `accepted`: the evidence projection counted only fixed detail rows, so a retained detail could overflow when History refresh loading/error chrome was also visible, and heights 8–10 attempted the full detail layout. The projection now deducts dynamic list/detail chrome rows; detail heights below 12 render one localized, actionable resize line instead of overflowing.
- N2 P2 — `accepted`: the first Evidence row truncated only the item before appending its label and truncation marker, allowing wide content plus chrome to exceed the display-cell budget. The presenter now composes label, item (or empty-state value), and marker first and applies one display-cell truncation to the complete line.
- N3 P2 — `accepted`: History list rows omitted summary and whole-row truncation could erase trailing semantics. At supported terminal widths, a deterministic four-field budget now keeps date, WorkRef, bracketed kind, and summary visible while bounding the complete row; smaller unsupported widths retain a safe whole-row fallback.

### Observed second review correction (2026-07-24)
- N1 RED: focused projection/component tests observed a 3/3/3 evidence allocation despite one dynamic row, full-detail overflow at heights 8 and 10, and 24 physical rows in a height-20 refresh frame. GREEN passed the dynamic 3/3/2 allocation, exact 8/10-row compact frames, and exact height-20 loading/error frames.
- N2 RED: the complete Evidence first-line formatter did not exist. GREEN bounds the composed label, wide-character item, and truncation marker with one truncation operation; the loaded-detail frame remains within 80 display cells.
- N3 RED: the row formatter omitted summary. GREEN keeps all four required semantics visible in the 38-cell row budget used by a 40-column terminal and remains deterministic for wide-character kinds.
- Focused RED-to-GREEN command: `mise exec -- pnpm exec vitest run test/tui/history-detail.test.ts test/tui/dashboard-component.test.ts -t 'dynamic History|complete Evidence|compact actionable|refresh loading and error|40-column History row|display budgets'` moved from 7 expected failures to 7/7 passing.
- Final verification: `mise exec -- pnpm exec vitest run test/tui` passed 42 tests across 6 files; `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `node dist/cli.mjs check --focused`, and `git diff --check` passed. Retained evidence, archives, CLI history core, and Git state were not modified by this correction pass.
- Fresh fixed-scope report-only re-review: N2 and N3 were clean; N1 retained one long-diagnostic wrapping finding, corrected as R1 below.

### Final re-review correction disposition (2026-07-24)
- R1 P2 — `accepted`: History list-refresh and selected-detail diagnostics were rendered as an unbounded label plus raw diagnostic, so a long path or wide-character error could wrap across physical rows and invalidate the projection's one-dynamic-row invariant. Both presenters now use the shared display-cell seam to compose the complete localized label and diagnostic before truncating it to the current available width.

### Observed final re-review correction (2026-07-24)
- RED: `mise exec -- pnpm exec vitest run test/tui/dashboard-component.test.ts -t 'long wide-character History detail diagnostic|long wide-character error row'` failed both cases. At 40 columns, the selected-detail diagnostic wrapped across multiple rows without a truncation marker, and the refresh-error label itself wrapped before the diagnostic.
- GREEN: the same focused command passed 2/2. Long project-relative paths plus wide-character diagnostics now render as one bounded line with a visible ellipsis; exact 12-row detail-error and 20-row retained-detail refresh-error frames remain within the declared terminal height and 40-cell width.
- Final verification: `mise exec -- pnpm exec vitest run test/tui` passed 43 tests across 6 files; `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `node dist/cli.mjs check --focused`, and `git diff --check` passed. CLI history core, retained evidence, archives, and Git state were not modified.

### Final retained evidence and repository verification (2026-07-24)
- Final fixed-scope report-only re-review was clean for code and document after R1; the reviewer confirmed both History diagnostic presenters are physically one row and the dynamic-row budget is sound at 40x12 and 40x20.
- Two immutable real-host attempts were retained as failed evidence while diagnosing durable-current-fact wording. The scorer then gained RED/GREEN coverage for the equivalent positive phrase `桌面端运行时拥有物理设备发现` and the negative phrase `桌面端运行时不拥有物理设备发现`; required facts, forbidden facts, and all other gates were unchanged.
- The final immutable run `device-discovery-boundary-tui-history-browser-scorer-fix` passed every real-host gate. Exact package SHA-256: `d44e7ef4e7ea907de7d998720dee100db59ea52afdf60b0da6e5b7a12393b2bb`; evidence SHA-256: `a60791fdb0495774f6b1fb1fd652ae362cd08194cc1ecd82fdc999f8164d2e1c`.
- `node scripts/native-design-composition-eval.mjs` passed all retained-integrity, current-package, phase-boundary, runtime-isolation, and external-verification gates.
- `mise exec -- pnpm run test` passed 430/430 tests across 42 files. `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `node dist/cli.mjs check --focused`, and `git diff --check` also passed.

### Scope-navigation discoverability refinement (2026-07-24)
- RED: `mise exec -- pnpm exec vitest run test/tui/dashboard-component.test.ts -t 'exposes all scopes'` failed 2/2 English and Simplified Chinese cases. The primary header exposed only the active scope, and the generic footer wrapped across three physical rows at 40 columns.
- GREEN: the same focused command passed 2/2 after the primary header exposed `Changes`, `Groups`, and `History` in cycle order, marked the active scope with textual brackets, and bounded the footer after placing the complete Tab path first. The full TUI suite passed 45/45 across 6 files.
- The first full repository run passed 430/432 tests; only the two exact-current-package retained-evidence assertions failed after the rebuilt TUI chunk changed. No assertion was weakened and the previous immutable run was not overwritten.
- The new immutable run `device-discovery-boundary-tui-history-navigation` passed every real-host gate. Exact package SHA-256: `1e314b673027a2a852555f7d8af11acf2f5b73a2e4d5462e69b45c1ae711f80d`; evidence SHA-256: `10128726ef7a15f694ba0c6ca30dfd16a3b648338bccb053c06be969fe70cd63`.
- Final verification: `node scripts/native-design-composition-eval.mjs` passed every retained/current-package gate; `mise exec -- pnpm run test` passed 432/432 tests across 42 files; build, typecheck, lint, focused RSP check, and `git diff --check` passed.
- Fresh fixed-scope report-only review was clean for code and document: all scopes remain visible in cycle order, the active marker is textual, the complete Tab path survives 40-column footer truncation, and CLI/history core behavior is unchanged.

### Structured evidence list slice (2026-07-24)
- RED: `mise exec -- pnpm exec vitest run test/tui/history-detail.test.ts test/tui/dashboard-component.test.ts -t 'RSP checkbox|long ASCII|empty evidence|actual remaining row|dynamic History|structured hanging-wrapped'` produced 8 expected behavior failures. The presenter exposed raw `[x]`/bullet prefixes, had no display-cell wrapping or hanging indent, and the projection still allocated raw item counts rather than rendered physical rows.
- GREEN: the same focused command passed 8/8. The TUI recognizes only `[x]`, `[ ]`, `[/]`, `[-]`, `-`, and `*` list prefixes (including the archive's optional outer bullet), maps them to `✓`, `○`, `◐`, `−`, and `•`, and preserves the remaining project-authored text and Markdown punctuation without general Markdown parsing.
- Long ASCII/CJK items now wrap by grapheme display cells. Continuations align under item text, empty sections retain their localized `none` row, and Tasks/Verify/Blockers receive physical rows round-robin after fixed and dynamic chrome rows are deducted. When source or viewport content is omitted, the localized truncation marker shares the last allocated line instead of consuming an unbudgeted row.
- Component coverage proves the complete structured detail remains within 40x16 and 80x20 frames, including hanging indentation, all marker classes used by the fixture, and explicit truncation.

### Structured section heading correction (2026-07-24)
- RED: `mise exec -- pnpm exec vitest run test/tui/history-detail.test.ts test/tui/dashboard-component.test.ts -t 'content-row budget|dynamic History|cannot fund|RSP checkbox|long ASCII|empty evidence|supported|structured hanging-wrapped'` produced 9 expected layout/projection failures. Tasks and Verify each appeared twice because count rows remained separate from evidence labels, while the projection did not reserve independent section-heading rows.
- GREEN: the same focused command passed 11/11. Tasks and Verify now use one count-bearing heading (`Tasks: done/total`, `Verify: done/total`), Blockers uses one heading, and every content row is indented beneath it with continuations aligned to item text. The standalone count rows were removed.
- The physical projection now treats 9 rows as non-evidence chrome and requires a six-row evidence minimum: one heading plus one content row for each section. Remaining content rows are allocated round-robin after dynamic loading/error rows are deducted; viewport truncation markers can modify only the last allocated content row and never a heading.
- Focused component coverage proves unique section labels and bounded 40x16/80x20 frames; projection coverage proves the dynamic-row case, localized empty `none` content, wide ASCII/CJK wrapping, and exact 39/79-cell bounds for wrapping and marker composition.

### Evidence word-boundary correction (2026-07-24)
- Real-PTY observation at 80x24 showed grapheme-only wrapping split ordinary English words such as `configure` and `version` across adjacent physical lines even though an earlier whitespace boundary was available.
- RED: `mise exec -- pnpm exec vitest run test/tui/history-detail.test.ts -t 'nearest whitespace|unbroken long token'` produced the expected whitespace-boundary failure (`release` became `releas` / `e`); the separate no-whitespace long-token/CJK bounded fallback remained green.
- GREEN: the same focused command passed 2/2, and the complete structured-evidence focus passed 13/13. Wrapping now retains pending whitespace as a preferred break opportunity, discards whitespace moved to the start of a continuation, and falls back to grapheme/display-cell wrapping only when one token cannot fit. Hanging indentation, inline Markdown punctuation, CJK handling, truncation markers, and physical-row projection remain unchanged.

### Final structured-evidence verification (2026-07-24)
- The full TUI suite passed 54/54 tests. The full repository suite passed 441/441 tests across 42 files after running the required build first; an earlier test-only attempt correctly failed five CLI-routing/evidence cases with `ENOENT` because `dist/cli.mjs` had not been built, and no product assertion was weakened.
- A fresh 80x24 real PTY check confirmed that Tasks, Verify, and Blockers each render one heading, terminal-native markers, and hanging continuations; ordinary English wraps at whitespace without splitting `configure` or `version`, while the complete frame remains within 24 rows.
- Two independent fixed-scope report-only reviews were clean: one covered the structured list projection and Change contract, and the second covered the whitespace-preferred wrapping correction and grapheme fallback.
- The final immutable run `device-discovery-boundary-tui-history-evidence-lists` passed every real-host gate. Exact package SHA-256: `6f0c89ce00827f0a7a0003a1f89bd22312b09233ae7b296fbcf9c85cd80d5a0f`; evidence SHA-256: `abd3fbf93160d78eb0da02f3d75932f4a28de255510195a7706e3e794e743034`.
- Final repository gates passed: `mise exec -- pnpm run build`, `node scripts/native-design-composition-eval.mjs`, `mise exec -- pnpm run test`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `node dist/cli.mjs check --focused`, and `git diff --check`.

## Blockers
- none
