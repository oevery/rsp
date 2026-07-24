---
kind: "feature"
---

# Change: add-ink-tui-dashboard

## Proposal
- Outcome: Ship a lazy-loaded, read-only Ink dashboard as the default human-facing `rsp` experience on an interactive terminal for RSP 3.1.0, while retaining deterministic plain-text and JSON command output.
- Why:
  - The current status view compresses dependency state, progress, blockers, and long WorkRefs into a static report that becomes difficult to scan as a project grows.
  - Human operators benefit from navigation, filtering, responsive layout, and contextual detail; agents already have the deterministic `--json` path and must not depend on a TUI.
  - The maintainer accepts raising the runtime floor to Node.js 22 and treating the internal CLI change as a 3.1 minor release because there are no known external users and the published Skill contract does not change.
- Scope:
  - Raise the package runtime floor to Node.js 22 and adopt Ink 7.1.x with React 19.2.x for the interactive host.
  - Launch the dashboard from bare `rsp` only when both stdin and stdout are real TTYs, and expose `rsp ui` as the explicit interactive entry point.
  - Provide a read-only dashboard for navigating Changes and Change Groups, inspecting dependencies, readiness, progress, and blockers, filtering the list, refreshing state, viewing key bindings, and exiting cleanly.
  - Localize TUI-owned labels and guidance in English and Simplified Chinese without routing existing CLI or machine output through localization.
  - Consume the prerequisite-owned immutable project-status snapshot and explicit v3 JSON/plain presentation boundaries without expanding the public 3.0 JSON contract.
  - Improve the plain-text status renderer where its current semantics or fixed layout are misleading, while preserving its non-interactive role.
  - Measure package and startup cost and keep the TUI implementation isolated from non-interactive command paths.
- Non-goals:
  - Creating, focusing, archiving, or otherwise mutating RSP state from the first dashboard release; the UI may show deterministic CLI commands for those actions.
  - Changing the `rsp status --json` schema, RSP rules/protocol, or published Skills.
  - Translating existing command help, plain-text command output, JSON, diagnostic codes, WorkRefs, paths, commands, canonical status values, or persisted RSP artifacts.
  - Adding a general localization framework, downloading locale data, persisting a language preference, or supporting locales beyond `en` and `zh-CN` in the first release.
  - Adding persistence, a cache, a database, background file watching, or a daemon.
  - Splitting the TUI into a separate package in this Change; a failed size or startup gate returns the package topology or stack choice to shaping because an opt-in package would conflict with the default-dashboard outcome.
  - Publishing 3.1.0, creating a tag, or pushing a registry/GitHub release; a separate release Change owns those external actions.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Interactive entry routing is explicit, deterministic, and safe for automation.
  - Bare `rsp` launches the dashboard only for an empty argument list when stdin and stdout are TTYs, `TERM` is not `dumb`, and `CI` is absent or exactly `false`.
  - Bare `rsp` in a non-interactive environment prints normal command help and exits without waiting for input.
  - `rsp ui` launches the same dashboard when both streams are TTYs and `TERM` is not `dumb`; this explicit route may run when `CI` is set. Otherwise it exits non-zero with a concise actionable error.
  - Root `--help`, `--version`, invalid arguments, and every explicit existing subcommand keep their existing command path; `rsp status` remains plain text and `rsp status --json` never loads or renders the TUI.

- Requirement: Localization is owned by the TUI and does not alter CLI contracts.
  - TUI labels, help, empty states, refresh state, compact-terminal guidance, and human-readable diagnostics are available in `en` and `zh-CN` from one typed in-package message catalog.
  - `rsp ui --lang en|zh-CN|auto` selects a locale explicitly. Bare `rsp` and `auto` first honor `RSP_UI_LANG=en|zh-CN`, then normalize the host locale; `zh`, `zh-CN`, and `zh-Hans` variants select `zh-CN`, and every other locale selects `en`.
  - An unsupported explicit `--lang` value fails before loading Ink with an English CLI error and non-zero exit. An unsupported `RSP_UI_LANG` value falls back through host-locale detection rather than preventing startup.
  - Locale selection is fixed for one dashboard process. The first release has no in-dashboard language toggle and does not write a preference to the project or user environment.
  - WorkRefs, filesystem paths, commands, keyboard keys, diagnostic codes, canonical states, and data from Change files are never translated. Localized labels may pair a translated term with a canonical state when that improves traceability.
  - The primary dashboard renders TUI-owned state and relationship labels only in the selected locale. Canonical state tokens remain available once in keyboard help for traceability instead of being repeated beside every localized row; project-authored dependency reasons remain byte-for-byte unchanged and are introduced by a localized label.
  - Existing root/subcommand help, errors emitted before the TUI starts, plain-text output, stdout/stderr separation, JSON values and structure, Skills, and RSP artifacts remain English and bypass the TUI message catalog.

- Requirement: The dashboard provides a responsive read-only view of current RSP work.
  - `Tab` switches the top-level scope between `Changes` and `Groups`. The Changes scope lists open executable Changes; the Groups scope lists current Change Groups and their declared direct slices.
  - The work list visibly distinguishes focused, blocked, ready, and waiting state without using `selected` as a synonym for `focused`. `resolved` is reserved for archived prerequisites in dependency detail and archived slices inside a Group; it is not an open-list state.
  - A detail pane shows the current item's deterministic local dependency forest, progress, blockers, readiness, and suggested deterministic next command. The forest reads parent-requires-children, marks focus/readiness without relying on color, expands transitive prerequisites once, and renders later occurrences as shared references rather than duplicating subtrees.
  - The normal detail pane is a concise current-item summary: it names only prerequisite children rather than repeating the selected root, collapses an empty prerequisite forest to one `none` row, keeps the symbol legend in help, excludes exact `requires` declarations from the external-blocker section, and replaces a redundant show command with localized owner-decision guidance when an external blocker prevents execution.
  - Arrow keys and `j`/`k` move selection, `/` filters the active scope by WorkRef or title, `Tab` changes scope, `Enter` opens expanded detail, `r` refreshes filesystem state, `?` shows help, and `q` or `Ctrl-C` exits.
  - `Esc` closes search, help, or expanded/narrow-screen detail first and exits only from the top-level work list.
  - At widths where both panes retain readable content the dashboard uses a list column capped at 56 display cells plus a flexible detail column. `Enter` opens the selected detail as a full-width page in both wide and narrow layouts, and `Esc` returns to the list/detail overview. Otherwise the dashboard uses a list page and an `Enter`-opened detail page. A compact terminal that cannot show the header, one item, and key hint displays an actionable size message instead of clipping controls.
  - The list is a terminal-height viewport rather than an unbounded render. Moving selection scrolls it into view; filtering, scope changes, refresh, and resize preserve selection by WorkRef when possible and otherwise choose the nearest remaining item deterministically.
  - Empty projects, empty filter results, long WorkRefs, and inspection diagnostics have explicit non-crashing views. Refreshes are serialized, repeated `r` presses coalesce, and a failed refresh retains the last valid snapshot while showing the diagnostic.
  - The first release performs no project-state writes from key presses or component lifecycle.

- Requirement: Interactive presentation is isolated from reusable state collection and machine output.
  - The dashboard consumes the `ProjectStatusSnapshot` established by `extract-project-status-boundary`; it does not introduce a second inspection model or import command modules.
  - Snapshot construction remains separate from presentation. JSON, plain-text, and TUI presenters do not reread `.rsp/`, print, exit, or reinterpret dependency state.
  - The prerequisite-owned v3 status adapter remains the only projection into the exact documented `StatusJsonShape`; deep structure, field presence, value semantics, stdout/stderr behavior, and exit codes of `rsp status --json` remain compatible with 3.0.
  - React, Ink, and Yoga are loaded only after the TUI route has been selected; ordinary commands must not import the interactive dependency graph.
  - The TUI host owns alternate-screen entry, raw input, cursor visibility, Ink lifecycle, signal handlers, and one idempotent cleanup path. Normal exit, keyboard `Ctrl-C`, render failure, and catchable termination signals restore the previous screen, raw mode, cursor, console behavior, and input listeners; uncatchable process termination is outside the guarantee.
  - Normal `q`/top-level `Esc` exit returns zero, a render or initial inspection failure returns one, and handled `SIGHUP`, `SIGINT`, and `SIGTERM` preserve conventional non-zero signal exit semantics after cleanup. Keyboard `Ctrl-C` in raw mode is tested separately from an operating-system `SIGINT`.
  - State labels and selection remain understandable without color. `NO_COLOR` is respected, and Ink screen-reader mode uses a linear inline presentation without alternate-screen replacement.

- Requirement: The plain-text fallback remains useful without imitating an interactive screen.
  - Readiness guidance distinguishes a ready dependency from an incomplete next task; a completed `12/12` Change is not presented as the next implementation action.
  - Human output uses `focused`, `open`, and prerequisite language instead of exposing internal selection semantics.
  - Long WorkRefs use an adaptive or stacked layout instead of overflowing fixed table columns.
  - Blocker information is summarized once per relevant context rather than repeated in the graph, summary, and footer.

### Acceptance
#### Scenario: human opens the dashboard
- GIVEN an RSP project with open, focused, ready, and blocked work and a real dual TTY
- WHEN the user runs bare `rsp`
- THEN the read-only dashboard opens with a navigable work list and dependency detail
- AND filtering, scope switching, viewport scrolling, expanded detail, refresh, help, resize, and quit operate without modifying `.rsp/`

#### Scenario: dashboard handles dense and changing work
- GIVEN more open work than fits in the terminal, long WorkRefs, and both Change and Group records
- WHEN the user navigates, filters to zero results, switches scope, refreshes after the selected WorkRef disappears, and resizes between wide and narrow layouts
- THEN the selected item remains visible or moves to the nearest deterministic item
- AND the dashboard shows explicit empty and compact states without clipping controls or rendering beyond the viewport

#### Scenario: automation invokes the root command
- GIVEN stdin or stdout is not a TTY
- WHEN a process runs bare `rsp`
- THEN normal command help is printed and the process exits without waiting for interactive input
- AND React, Ink, and Yoga are not loaded

#### Scenario: explicit root arguments bypass the dashboard
- GIVEN stdin and stdout are real TTYs
- WHEN the user invokes `rsp --help`, `rsp --version`, an invalid root argument, or any existing subcommand
- THEN the existing CLI command path and exit behavior are preserved
- AND the TUI dependency graph is not evaluated

#### Scenario: agent consumes status JSON
- GIVEN the same RSP fixture is evaluated before and after the change
- WHEN an agent runs `rsp status --json`
- THEN the command emits one parseable JSON document with the compatible 3.0 status contract
- AND it does not load the TUI dependency graph or emit terminal control sequences

#### Scenario: user requests UI without a terminal
- GIVEN stdin or stdout is not a TTY
- WHEN the user runs `rsp ui`
- THEN the command exits non-zero with guidance to use `rsp status` or `rsp status --json`
- AND it does not hang or leave input handlers active

#### Scenario: CI routing remains explicit
- GIVEN stdin and stdout are real TTYs, `TERM` is not `dumb`, and `CI=true`
- WHEN a process runs bare `rsp`
- THEN normal command help is printed without loading the TUI
- BUT WHEN the user runs `rsp ui`
- THEN the dashboard opens because the explicit route overrides CI auto-detection

#### Scenario: TUI chooses a supported locale without changing CLI output
- GIVEN the same RSP fixture and terminal dimensions
- WHEN the dashboard starts with `rsp ui --lang zh-CN`, `rsp ui --lang en`, or bare `rsp` under the corresponding host locale
- THEN TUI-owned labels and guidance render in the selected language
- AND WorkRefs, paths, commands, keyboard keys, diagnostic codes, canonical states, and project-authored text remain unchanged
- BUT WHEN `rsp status`, `rsp show`, `rsp check`, or any JSON command is run under the same locale environment
- THEN its existing English output, machine values, exit behavior, and TUI import isolation remain unchanged

#### Scenario: unsupported explicit locale fails at the CLI boundary
- GIVEN stdin and stdout are real TTYs
- WHEN the user runs `rsp ui --lang fr`
- THEN the command exits non-zero with an English error listing `auto`, `en`, and `zh-CN`
- AND Ink, React, Yoga, and the TUI message catalog are not evaluated

#### Scenario: terminal is interrupted
- GIVEN the dashboard is running
- WHEN the user quits, types raw-mode `Ctrl-C`, the process receives a catchable termination signal, or a render error is raised
- THEN cleanup restores the previous screen, normal terminal input, cursor, console behavior, and registered listeners exactly once
- AND subsequent shell input is displayed normally

#### Scenario: accessible presentation avoids destructive redraw
- GIVEN color is disabled or Ink screen-reader mode is enabled
- WHEN the dashboard renders status and selection
- THEN every state is named in text or a non-color symbol
- AND screen-reader mode uses linear inline output instead of alternate-screen replacement

#### Scenario: plain status renders dense work
- GIVEN status contains long WorkRefs, a completed Change, and an external blocker
- WHEN the user runs `rsp status`
- THEN the report remains readable at narrow terminal widths
- AND it does not call the completed Change the next implementation action, conflate selected with focused, or repeat the same blocker in multiple summary sections

## Design
- Approach:
  - Consume the immutable `ProjectStatusSnapshot`, pure derivations, exact v3 JSON adapter, and plain renderer established by `extract-project-status-boundary`; add Ink as a sibling presenter rather than reopening status collection.
  - Add a small root dispatcher that chooses the TUI only for implicit interactive invocation. Dynamically import a separate TUI entry so non-interactive commands retain their present startup path.
  - Model interactive state explicitly as snapshot, active scope, filter, selected WorkRef, viewport, detail/help/search mode, refresh state, and terminal dimensions. Reducer transitions remain pure; only the host performs inspection and terminal effects.
  - Keep localization behind a small typed `TuiMessages` interface owned by `src/tui/`. Resolve the locale before importing the Ink entry, inject one immutable translator into the component tree, and format complete messages rather than assembling translated fragments inside components.
  - Project one presentation-neutral dependency forest from `ChangeDependencyPlanOutput` and selected roots. Plain status and Ink render that shared semantic projection independently so tree roots, ordering, shared-node detection, states, and edge reasons cannot drift while terminal characters, wrapping, color, and localization remain presenter-owned.
  - Derive a TUI-only concise detail projection from the selected item, dependency forest, and plan blockers. It exposes prerequisite children, external blocker prose, and action kind without changing snapshot or JSON semantics; the Ink component owns overview-versus-expanded density and localized guidance.
  - Implement the initial dashboard as React/Ink components over the snapshot. Refresh rereads the filesystem explicitly and atomically replaces the snapshot; no watcher or write command is embedded in component state.
  - Keep one npm package for 3.1. Treat a failed size or cold-start gate as a shaping blocker requiring an explicit choice among accepting the footprint, changing the default-dashboard outcome, or choosing a lighter stack.
- Boundaries:
  - CLI dispatch owns TTY/CI detection and lazy entry selection; it does not own project-state interpretation.
  - CLI dispatch validates the UI-only `--lang` option and resolves the TUI locale without localizing existing CLI output. TUI components consume messages; core inspection and all non-TUI presenters remain locale-unaware.
  - Core inspection owns status semantics and returns the internal snapshot without printing, exiting, changing raw mode, or writing project files.
  - The v3 JSON adapter owns public compatibility; plain-text and TUI modules own presentation only. The TUI host owns Ink lifecycle, alternate-screen control, signals, and terminal cleanup.
  - The TUI may suggest existing CLI commands but may not call mutation handlers in this Change.
- Affected areas:
  - `package.json`, lockfile, and build configuration for Node.js 22, React 19.2.x, Ink 7.1.x, TSX, and lazy TUI output.
  - `src/cli.ts` and command registration for root routing and `rsp ui`.
  - Prerequisite-owned `src/status/` modules only where the planned plain-renderer improvements require presentation-local changes; status collection, model ownership, and v3 adaptation remain stable.
  - New `src/tui/` host, components, layout, key handling, and tests.
  - New `src/tui/i18n/` typed English and Simplified Chinese catalogs plus locale normalization and interpolation tests; no general-purpose i18n runtime dependency.
  - CLI fixtures, command-output tests, package/clean-install checks, README, changelog/migration inputs, and retained native-design evidence.
- Settled choices:
  - Minimum runtime is Node.js 22; Node.js 18 compatibility is intentionally dropped in 3.1.0 and must be disclosed in release documentation.
  - Ink 7.1.x and React 19.2.x are the selected TUI stack. OpenTUI now exposes Node entry points, but its native per-platform distribution and Bun/Zig-centered build surface add packaging risk that is disproportionate for this portable Node CLI. Terminal Kit is not used because Ink better matches the component and test model needed here.
  - Bare `rsp` is interactive only on a real dual TTY. `rsp ui` is the explicit equivalent. `rsp status` remains the stable human snapshot and `rsp status --json` remains the automation contract.
  - The 3.1 dashboard is read-only. Guided mutation is deferred until navigation and terminal lifecycle have production evidence.
  - The normal dashboard uses the alternate screen. Ink screen-reader mode uses inline linear output, and non-interactive users retain `rsp status` and `rsp status --json`.
  - TUI localization initially supports only `en` and `zh-CN`; host-locale detection defaults all unsupported languages to English. Locale is process-local and immutable after startup.
  - Existing CLI, JSON, Skills, protocol language, and project artifacts remain English. This separation is a compatibility boundary, not a temporary translation gap.
  - The localized primary view favors scanability over per-row bilingual duplication. Canonical state values are listed once in help, while TUI-owned labels use only the active locale and project-authored reasons remain unchanged.
  - Dependency symbols are self-labelled in detail, so their legend belongs in keyboard help rather than every selected-item pane. Exact prerequisite declarations belong to the dependency forest; only external blocker prose belongs under the blocker heading.
  - No published Skill or RSP protocol text changes are required because agents continue to use deterministic commands and JSON.
- Constraints:
  - The packed npm tarball must remain below 512 KiB. Record the before/after packed and installed production sizes in retained evidence.
  - Installed production footprint is measured from clean `npm install --omit=dev --ignore-scripts` results by recursively summing regular-file logical byte sizes with a repository script. Record baseline, candidate, file counts, package manager, lockfile, Node version, OS, and architecture. If the candidate adds more than 15 MiB, stop and return the package topology or stack choice to shaping.
  - On the same host and Node.js version, the median warm-cache startup of `rsp status --json` must regress by no more than the greater of 25 ms or 20 percent compared with commit `8d351c2`; record the command, samples, and result.
  - Tests must prove that non-TUI routes do not evaluate the Ink entry or its React/Yoga dependency graph, including root help/version/error paths and every existing subcommand.
  - Supported release verification covers Node.js 22 and 24. Terminal interaction must remain portable Node behavior and must not depend on a macOS-only shell or API.
  - Existing explicit subcommands, exit-code behavior, stdout/stderr separation, and the 3.0 JSON contract remain compatibility boundaries.
  - English and Simplified Chinese catalogs must expose the same compile-time key set. Layout and truncation use terminal display-cell width rather than JavaScript string length so CJK text cannot corrupt panes or viewport calculations.

## Tasks
- [x] Raise the runtime floor to Node.js 22, add Ink 7.1.x/React 19.2.x, configure TSX/build output, and implement a lazy TUI import that is absent from ordinary command evaluation.
- [x] Add deterministic bare-root and `rsp ui` routing for empty args, help/version/error args, existing subcommands, dual/non-dual TTY, `TERM=dumb`, and explicit CI behavior.
- [x] Add TUI-only locale resolution and typed `en`/`zh-CN` message catalogs, including `rsp ui --lang`, `RSP_UI_LANG`, host-locale normalization, complete-message interpolation, and pre-Ink validation of unsupported explicit values.
- [x] Implement the reducer-driven read-only dashboard with Changes/Groups scopes, list/detail and narrow-page layouts, bounded viewport, dependency detail, state legend, filtering, serialized refresh, help, empty/diagnostic states, selection recovery, and resize behavior.
- [x] Implement alternate-screen, raw-input, cursor, console, screen-reader, signal, exit-code, and idempotent-cleanup behavior in the TUI host.
- [x] Refine the plain-text renderer's readiness language, focus terminology, narrow-width layout, and blocker deduplication without changing JSON semantics.
- [x] Add reducer, Ink component, command, pseudo-terminal, import-isolation, locale parity/isolation, CJK-width, signal, accessibility-mode, viewport, refresh-failure, and terminal-cleanup coverage for the acceptance scenarios.
- [x] Document the Node.js 22 requirement, interactive entry behavior, TUI locale selection, static/JSON alternatives, keyboard controls, and 3.1 migration impact in both READMEs without changing published Skills or implying that existing CLI output is localized.
- [x] Add the deterministic logical-byte footprint measurement, then measure packed size, installed production footprint, and non-TUI startup against commit `8d351c2`; return to shaping instead of implementing a silent package-topology change if a gate fails.
- [x] Refresh retained native-design evaluation and package evidence because CLI composition, dependencies, and runtime support change.
- [x] Replace flat TUI dependency-edge text with the shared local dependency forest, including transitive ordering, edge reasons, state symbols, and shared-prerequisite references without changing the status JSON contract.
- [x] Render primary TUI rows in one selected language, move canonical state tokens to help, and verify that project-authored reasons, WorkRefs, paths, commands, and diagnostics remain unchanged.
- [x] Refine the real-terminal overview by removing repeated dependency roots and legends, suppressing exact prerequisite declarations from external blockers, capping the wide list column, making wide `Enter` open full-width detail, and replacing redundant blocked-item show commands with owner-decision guidance.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — proves: the CLI and lazy TSX TUI entries compile for the supported Node.js runtime.
  - [x] `mise exec -- pnpm run lint` — proves: the new dispatcher, projection, renderers, and components satisfy repository static checks.
  - [x] `mise exec -- pnpm run test` — proves: command compatibility, exact JSON fixtures, reducer and TUI behavior, locale catalog parity, CJK layout, non-TUI locale isolation, viewport/refresh edge cases, import isolation, accessibility mode, signals, and terminal lifecycle tests pass.
  - [x] `node dist/cli.mjs check --focused` — proves: this Change and current RSP project state remain valid.
  - [x] `npm pack --dry-run --json` — proves: the package inventory and packed-size gate are recorded and the TUI source/build output is complete.
  - [x] Run the repository clean-install check and logical-byte footprint measurement under Node.js 22 and Node.js 24 — proves: the declared runtime range installs and executes the packed artifact without workspace leakage and the 15 MiB gate uses one reproducible metric.
  - [x] Run the documented repeated startup benchmark for `rsp status --json` at `8d351c2` and the completed Change — proves: the lazy TUI path stays within the non-interactive startup gate.
  - [x] Run focused dependency-forest and Ink component tests — proves: plain and TUI presenters share graph semantics, the localized primary view avoids bilingual state duplication, canonical states remain discoverable in help, and shared/transitive dependencies stay readable.
  - [x] Run focused real-frame component and reducer tests — proves: ready items do not repeat resolved prerequisites as blockers, dependency-free items remain compact, wide detail expansion works, the list column stays bounded, help owns the legend, and externally blocked work identifies the required owner decision without suggesting a redundant show command.
- Manual or environment:
  - [x] In a macOS terminal, exercise bare `rsp`, long-list navigation, empty search, scope switching, detail, refresh success/failure, help, wide/narrow resize, `q`, contextual `Esc`, raw `Ctrl-C`, and a catchable signal, then type at the restored shell prompt — proves: the real dashboard is usable and alternate-screen/input cleanup works outside the test harness.
  - [x] Exercise `NO_COLOR=1` and `INK_SCREEN_READER=true` — proves: state remains understandable without color and assistive output avoids destructive full-screen redraw.
  - [x] Exercise bare `rsp` and `rsp ui --lang` in English and Simplified Chinese at wide and narrow terminal sizes — proves: locale detection, explicit override, CJK cell-width layout, help, empty states, and canonical token preservation work in a real terminal.
  - [x] On a non-TTY pipe, run bare `rsp`, `rsp ui`, `rsp status`, and `rsp status --json` — proves: automation does not hang or receive terminal control output.
  - [x] Complete retained native composition evaluation in a fresh supported host process — proves: the package's new dependency and CLI composition works in its actual installed form.
- Coverage:
  - Node.js 24.18.0 clean-install, package, test, and retained-host verification passed. A temporary Node.js 22.23.1 runtime acquired with `npx -y -p node@22` then ran npm through its own `process.execPath`, freshly installed the exact candidate tarball, and passed installed help, initialized-project status JSON, non-TTY UI failure, and invalid-locale failure; no global runtime configuration was changed.
  - Real Windows terminal acceptance may be unavailable to the maintainer; pseudo-terminal and platform-neutral tests cover the contract, and any missing Windows host evidence must be recorded rather than inferred.
  - Registry publication, tag creation, and external release-channel verification belong to the separate 3.1 release Change.

### Observed verification (2026-07-23 review correction)
- RED/GREEN: focused TUI tests first failed because the new modules did not exist, then passed after the reducer, locale, route, component, and terminal host were implemented. Dense plain-output tests first exposed the old `selected` wording, fixed-width layout, and duplicated blocker output, then passed after the presentation-only changes. The retained scorer first rejected stronger durable-design wording; a focused scorer regression test was added before widening that semantic matcher.
- Review corrections keep focus orthogonal to execution state, project transitive Group dependency detail and condition-valid actions, treat every defined `CI` value except exact `false` as disabling auto-launch, restrict Simplified Chinese detection to `zh`/`zh-CN`/`zh-Hans`, keep canonical state tokens visible beside localized labels, and pin Ink/React to the selected patch lines.
- The published `bin/rsp.mjs` and direct built entry now share one `runCliMain()` error boundary. Fresh installed-bin checks prove normal help plus concise single-line, stack-free non-TTY and invalid-locale errors with exit one. Package-evidence failure injection runs only against an explicit isolated repository, covers failure after worktree registration and initial remove failure, reports cleanup failures, prunes, verifies registry recovery, and leaves no transient directory.
- Node.js 22 compatibility evidence used temporary Node.js v22.23.1 to run npm 11.16.0, installed CLI commands, and the logical-byte measurement. The fresh tarball SHA `42bbf81006eace778d4ad1b880c30134eeece52aaa85d01033d64ad2df2bb2d8` matched the Node.js 24 package evidence; installed size was 8,709,071 logical bytes / 4,905 files, and help, status JSON, non-TTY UI, and invalid-locale checks passed.
- Final repository gates on Node.js 24.18.0: build, typecheck, lint, 38 test files / 395 tests, focused RSP check, clean-install check, package dry run, retained evaluator, and `git diff --check` passed. Node.js 22.23.1 clean-install and installed-CLI verification also passed against the same exact tarball.
- Exact candidate package: 94,922 B packed, 361,581 B unpacked, SHA-256 `42bbf81006eace778d4ad1b880c30134eeece52aaa85d01033d64ad2df2bb2d8`; clean-install inventory contains 27 expected package files.
- Retained footprint evidence: packed delta +7,540 B; installed production logical-byte delta +7,647,779 B and +4,633 files, below the 15 MiB gate.
- Same-host startup evidence: baseline median 32.545 ms, candidate median 33.040 ms, regression +0.495 ms against a 25 ms allowed regression.
- `scripts/package-evidence.mjs` retains the exact baseline/candidate build, pack, fresh-install, logical-byte, installed-bin benchmark, and installed candidate PTY command chain with both tarball and lockfile hashes, and removes its transient worktree/directories on success or failure.
- The installed candidate PTY check observed raw mode before input and passed `q`, contextual `Esc`, raw `Ctrl-C`, `SIGINT`, `SIGTERM`, and `SIGHUP` with exit codes 0, 0, 0, 130, 143, and 129; terminal attributes and alternate-screen state were restored. Direct `runTui()` host tests cover initial inspection and render failure, listener removal, and idempotent cleanup.
- Fresh retained identity `device-discovery-boundary-ink-tui-dashboard-entry-cleanup-final` ran all four real-host phases against the exact package and passed all 16 direct gates without rescore; the default retained-artifact evaluator passed all 13 integrity/composition gates. The earlier immutable `device-discovery-boundary-ink-tui-dashboard-entry-cleanup-correction` run remains failed because its durable artifact genuinely omitted the hardware-acceptance-unavailable fact; it was neither overwritten nor rescored.
- The complete locale/route/layout matrix passed in a real macOS PTY: bare `rsp` with environment-selected `en` and `zh-CN`, plus explicit `rsp ui --lang en|zh-CN`, each rendered at 120-column wide and 52-column narrow sizes. English and CJK labels, canonical states, help, empty filtering, wide detail, narrow list/detail pages, Group guidance, and compact-terminal guidance remained readable and correctly routed.
- Additional manual observations covered an 18-item bounded viewport, Change/Group scope switching, refresh success, invalid-work-tree diagnostics and recovery, normal quit, contextual `Esc`, alternate-screen restoration, and successful input at the restored zsh prompt. The invalid-work-tree case returned a diagnostic snapshot rather than throwing the `refresh-failed` path, while raw `Ctrl-C` and catchable signals remained retained automated PTY evidence; the broader all-in-one manual lifecycle checkbox was left open pending the maintainer's final walkthrough. The temporary long-list project was moved to the user's Trash after verification.

### Observed verification (2026-07-24 dependency-forest and localization refinement)
- RED/GREEN: the focused dependency-forest test first failed because the shared projection did not exist, while Ink component assertions exposed the flat edge list and repeated bilingual Chinese state labels. The same focused command then passed 19 tests across the semantic projection, plain presenter, Ink component, and reducer/projection seams after implementation.
- `src/status/dependency-forest.ts` now owns deterministic roots, lexical child ordering, transitive expansion, edge reasons, and shared-node references. Plain status and Ink consume the same semantic forest; Ink separately owns localized relationship/state labels, symbols, tree characters, and responsive list width.
- Chinese primary rows now render only localized TUI-owned labels such as `已聚焦 · 就绪`; canonical values remain unchanged and discoverable once in help. WorkRefs, commands, diagnostic codes, and project-authored dependency reasons remain unchanged. English renders the same component structure with its own catalog.
- Final Node.js 24.18.0 repository gates passed: build, typecheck, lint, 39 test files / 396 tests, clean-install check, focused RSP check, package dry run, retained evaluator, and `git diff --check`.
- Exact candidate package: 95,630 B packed, 364,731 B unpacked, SHA-256 `860fc21614991227c495acab30d35cd881fcc4d7d2b3d147d3a81628b78f117f`; the clean-install inventory contains 27 expected package files.
- Retained footprint evidence: packed delta +8,248 B; installed production logical-byte delta +7,650,929 B and +4,633 files, below the 15 MiB gate. Same-host startup medians were 34.969 ms baseline and 35.030 ms candidate, a +0.061 ms regression against the 25 ms allowance.
- Node.js 22.23.1 used npm 11.16.0 through its own `process.execPath` and passed clean install plus installed help, status JSON, non-TTY UI failure, invalid-locale failure, and footprint measurement against the same exact tarball; installed production size was 8,712,221 logical bytes / 4,905 files.
- The installed-package PTY gate passed `q`, contextual `Esc`, raw `Ctrl-C`, `SIGINT`, `SIGTERM`, and `SIGHUP` with exit codes 0, 0, 0, 130, 143, and 129 and restored terminal state. Its driver now waits for an observed help interaction and raw mode before injecting the measured action, eliminating a title-before-input-readiness race without weakening lifecycle assertions.
- Fresh real-host run `device-discovery-boundary-ink-tui-dashboard-dependency-forest-localization` completed all four phases and package/runtime gates but was retained as failed because the scorer did not recognize the stronger Web prohibition wording. A focused RED/GREEN scorer regression accepted that equivalent clause, and independent correction run `device-discovery-boundary-ink-tui-dashboard-dependency-forest-localization-correction` passed all retained gates while preserving the failed source run unchanged.

### Observed verification (2026-07-24 real-frame visual refinement)
- RED/GREEN: focused Ink component and projection tests first showed the repeated selected dependency root and legend, unresolved prerequisite declarations repeated as blockers, a no-op wide `Enter`, an unbounded proportional list pane, and the redundant `rsp show` action for external owner-decision blockers. The focused suite passed after the concise projection and layout changes; the isolated Esc assertion now waits through Ink's escape-sequence disambiguation window.
- Change details now render only prerequisite children, use one compact `none` row when no prerequisite exists, keep dependency direction and symbols in help, and filter only exact `requires \`name\`: reason` entries that are already represented by plan edges. Malformed or unmatched blocker text remains visible. Wide overview reasons truncate to the available display-cell width; full-width detail preserves the complete reason.
- Wide list width is 40 percent with a 36-cell floor and 56-cell ceiling. `Enter` opens the same full-width detail page in wide and narrow layouts; that page includes status so it remains self-contained. External blockers now show `Next action: Awaiting owner decision` / `下一步：等待维护者决策` rather than suggesting another read-only `rsp show` command.
- Final Node.js 24.18.0 repository gates passed: build, typecheck, lint, 39 test files / 397 tests, focused RSP check, package dry run, retained evaluator, and `git diff --check`.
- Exact candidate package: 96,092 B packed, 366,584 B unpacked, SHA-256 `3c1aafb37372032b3f87e2ae469090913bcbf646d836d0c8a1298030738b52ef`; the clean-install inventory contains 27 expected package files.
- Retained footprint evidence: packed delta +8,710 B; installed production logical-byte delta +7,652,782 B and +4,633 files, below the 15 MiB gate. Same-host startup medians were 34.245 ms baseline and 35.400 ms candidate, a +1.155 ms regression against the 25 ms allowance.
- Node.js 22.23.1 used npm 11.16.0 through its own `process.execPath` and passed clean install plus installed help, status JSON, non-TTY UI failure, invalid-locale failure, and footprint measurement against the same exact tarball; installed production size was 8,714,074 logical bytes / 4,905 files.
- Fresh real-host run `device-discovery-boundary-ink-tui-dashboard-visual-refinement` passed every execution/package boundary but was retained as failed because the scorer did not recognize the equivalent wording “物理设备发现与连接生命周期仍归桌面运行时所有”. A focused RED/GREEN matcher regression accepted that ownership form while continuing to reject negation, and independent correction `device-discovery-boundary-ink-tui-dashboard-visual-refinement-correction` passed all retained gates without overwriting the failed run.
- The maintainer subsequently completed the full macOS real-terminal walkthrough, including the listed navigation, refresh, resize, exit, signal, terminal-restoration, and restored-shell-input checks, and reported no issues. The English and Chinese keyboard guides now match the implemented full-width `Enter` behavior.
- Durable review kept current architecture facts in `.rsp/specs/design.md` and routed the lasting Node.js 22, default-dashboard, package-topology, and Ink/React tradeoffs to `.rsp/specs/decisions/interactive-dashboard-stack.md`.

## Blockers
- requires `extract-project-status-boundary`: establish the behavior-preserving status snapshot and presentation adapters before adding Ink as a second human renderer.
