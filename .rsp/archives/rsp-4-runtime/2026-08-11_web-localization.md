---
kind: "feature"
---

# Change: rsp-4-runtime/web-localization

## Proposal
- Outcome: Deliver a complete, readable English and Simplified Chinese presentation for every local Web Observatory view
- Why:
  - The TUI already supports `en` and `zh-CN`, while the browser surface currently hard-codes English across navigation, loading, empty, stale, managed-run, attention, and error states.
  - Browser localization should improve usability without translating or changing repository-owned content, canonical identities, projection contracts, or project language policy.
  - Fresh browser inspection found that long Specs and History collections stretch empty detail panes to several thousand pixels, narrow navigation consumes excessive vertical space, and presentation controls and information hierarchy are visually inconsistent.
- Scope:
  - Add one typed-equivalent browser catalog for `en` and `zh-CN`, deterministic locale normalization, host-locale auto selection, and an in-page language switch.
  - Localize every Web-owned label, action, accessibility label, empty state, bounded-status phrase, and known browser error fallback.
  - Refine the shared visual hierarchy, compact navigation and presentation controls, equalize locale choices, and keep master/detail collections bounded and usable across desktop and narrow viewports.
  - Give every retained History archive an opaque path-derived browser lookup identity so repeated archives of the same WorkRef open the exact selected record.
  - Keep detail and search failures scoped to the selected view, provide an optional automatic atomic-refresh mode, and explain the safe recovery path after an intentional browser reload discards in-memory authorization.
  - Preserve projected WorkRefs, paths, titles, summaries, evidence, diagnostics, canonical state values, and runtime observations exactly as supplied.
  - Keep locale selection in browser memory for the one-time authenticated page session and update document language and locale-sensitive timestamps without changing Broker or projection data.
- Non-goals:
  - Read `.rsp/config.yaml` artifact or commit language, translate repository-authored prose, add machine translation, persist browser preferences, or support locales beyond `en` and `zh-CN`.
  - Add a `rsp web --lang` CLI contract, change Web authentication, widen route authority, change repository/runtime semantic projections, or add a browser framework beyond the existing typed React root.

## Spec
### ADDED
- Requirement: The Web Observatory presents all browser-owned text in one resolved `en` or `zh-CN` locale while repository and runtime evidence remain presentation-neutral.
  - Locale resolution uses the browser language list and falls back to `en`; an in-page selector switches locale without refetching snapshots, replacing the Web bearer, or resetting the current view.
  - Catalogs expose the same complete key set. Rendering receives the selected locale and catalog explicitly rather than reading project artifact-language configuration or translating projection values.
  - The page updates its `lang` attribute and locale-sensitive timestamp formatting. Canonical state and identity values remain exact even when surrounding labels are localized.
  - The typed browser catalog is compiled into the generated `web/static/app.js` bundle, which remains inside the exact no-follow Web asset allowlist, package inventory, CSP, and clean-install boundary.
- Requirement: Every Observatory view preserves a clear, bounded reading hierarchy on desktop and narrow screens.
  - Navigation remains one compact view selector instead of consuming multiple rows on a 390px viewport, and the live state, equal-width locale choices, and refresh action remain visually grouped but semantically distinct.
  - Overview metrics remain scannable without turning into three full-width cards on narrow screens.
  - Specs, History, and Runs use bounded independently scrollable collection panes on desktop; narrow screens bound the collection before the detail pane so a long collection cannot make selected or empty detail effectively unreachable.
  - Long projected titles, summaries, WorkRefs, source references, and freshness reasons wrap or clamp inside their owning surface without horizontal overflow or hidden canonical identity.
- Requirement: History detail selection remains exact when one WorkRef has multiple retained archives.
  - Each History list record exposes an opaque deterministic lookup identity derived from its repository-relative archive path.
  - The browser sends only that lookup identity to the bounded History detail route; the service resolves the selected inspected archive without accepting a client-supplied filesystem path.
  - Repeated archives may display the same WorkRef, but selecting either record returns that record's own summary and evidence.
- Requirement: Browser refresh behavior distinguishes complete-snapshot freshness from one view operation.
  - A failed atomic snapshot refresh retains the previous complete snapshot and marks it stale.
  - A failed Specs search or Specs, History, or Runs detail request leaves the complete snapshot live and shows one bounded view-operation warning instead of mislabeling all projected data stale.
  - A browser bundle that receives History records from the earlier Broker route uses their WorkRef route directly; when a current opaque request receives the exact earlier query-contract rejection, it retries the legacy route once and warns that repeated-archive selection requires a current Broker.
- Requirement: The toolbar offers session-local automatic atomic refresh without changing authentication persistence.
  - Automatic refresh is enabled by default, can be turned off in the page, runs at most once every 30 seconds while the page is visible, and coalesces with an already active manual, event-driven, or automatic refresh.
  - Automatic refresh pauses while one detail or search result is open so the complete-snapshot replacement contract cannot silently discard the user's active reading context.
  - Browser reload continues to discard the in-memory bearer. The unavailable surface explains this boundary, shows `rsp web` as the recovery command, and never persists the bearer in a cookie, URL, browser storage, or repository state.

### Acceptance
#### Scenario: automatic Chinese presentation
- GIVEN a browser whose preferred supported locale is Simplified Chinese
- WHEN one authenticated Web Observatory page starts
- THEN every Web-owned loading, navigation, action, status, empty, stale, managed, attention, and error label renders in Chinese while projected WorkRefs, paths, canonical values, and repository prose remain unchanged

#### Scenario: in-page locale switch
- GIVEN a valid snapshot, active Web bearer, selected view, and loaded detail
- WHEN the user switches between `中文` and `EN`
- THEN the page rerenders locally in the selected locale without a snapshot request, token exchange, view reset, detail reset, or persisted repository mutation

#### Scenario: unsupported browser locale
- GIVEN no supported locale in the browser preference list
- WHEN the browser resolves its presentation locale
- THEN it deterministically uses English and keeps the page operational

#### Scenario: bounded master/detail navigation
- GIVEN a checkout with at least 17 Specs or 30 retained history records
- WHEN the user opens Specs or History on desktop or a 390px viewport
- THEN the collection remains bounded and scrollable, the detail surface remains reachable, and the document does not grow to the full unbounded collection height

#### Scenario: compact presentation controls
- GIVEN either supported locale on desktop or a 390px viewport
- WHEN the Web toolbar renders
- THEN all five view choices remain one compact selector and the `中文` and `EN` locale choices have equal dimensions and an unambiguous selected state

#### Scenario: repeated History archives
- GIVEN two retained archive files for the same WorkRef
- WHEN the user selects either History record
- THEN the browser requests its distinct opaque lookup identity and displays the detail from that exact archive

#### Scenario: earlier Broker History compatibility
- GIVEN the static browser bundle is newer than the already-running Broker and History records do not carry an opaque lookup identity
- WHEN the user selects one History record
- THEN the browser uses the earlier WorkRef detail route, keeps the complete snapshot live, and presents a bounded compatibility warning

#### Scenario: scoped detail failure
- GIVEN one complete current snapshot
- WHEN a detail or Specs search request fails
- THEN the selected operation shows a warning while the complete snapshot remains current and is not labeled stale

#### Scenario: automatic atomic refresh
- GIVEN an authenticated visible page with no open detail or search result
- WHEN automatic refresh is enabled
- THEN the browser requests at most one fresh complete snapshot every 30 seconds, pauses when hidden or while a result is open, and retains the manual atomic-refresh action

#### Scenario: browser reload recovery
- GIVEN the page bearer exists only in JavaScript memory
- WHEN the user reloads the complete browser document
- THEN the unavailable surface explains that authorization was intentionally discarded and directs the user to run `rsp web` again without exposing or persisting a reusable credential

## Design
- Approach:
  - Keep the complete catalogs, supported-locale normalization, and deterministic resolver in typed React source at `web/src/i18n.ts`; the build compiles them into the single generated `web/static/app.js` bundle.
  - Store `locale` in browser application state, pass the selected messages through the typed React render path, and expose one language action in the top toolbar.
  - Use localized presentation phrases around exact projected values; never rewrite server projections or derive workflow meaning in the browser.
  - Use shared semantic CSS classes for shell controls, metric cards, collection panes, detail panes, and attention/run state instead of view-specific inline presentation logic.
- Boundaries:
  - Browser locale is presentation state only. It does not use project `language.default`, `language.artifacts`, or `language.commit`, and it grants no authority.
  - The Broker serves the exact static inventory `web/static/index.html`, `web/static/app.css`, and generated `web/static/app.js`; Web bearer, bootstrap, API, SSE, projection, redaction, CSP, and no-store boundaries remain unchanged.
  - TUI and Web share the `en` / `zh-CN` product contract but retain surface-specific catalogs because their labels and runtimes differ.
- Affected areas:
  - Typed React browser sources under `web/src/`, generated `web/static/app.js`, authored `web/static/app.css`, Browser static-asset serving, exact package inventory, and Web tests.
  - Runtime and Web Specs plus the authoritative React Web Decision Record.
- Constraints:
  - No inline script, browser storage, cookie, query parameter, translated projection value, or new runtime dependency.
  - Locale switching must be a pure local rerender and preserve the current application state and authenticated session.
  - Keep one typed React root and one generated JavaScript bundle with no runtime-loaded chunks; preserve keyboard focus, reduced motion, dark mode, exact projected values, and the existing no-horizontal-overflow guarantee.

## Tasks
- [x] Add complete `en` and `zh-CN` Web catalogs plus deterministic browser-locale resolution.
- [x] Thread locale through browser state and rendering, add the language switch, and localize every Web-owned string and timestamp.
- [x] Extend the exact static-asset and package inventory boundaries without changing authentication or projection routes.
- [x] Update stable Web presentation facts and add focused regression coverage for catalog parity, auto fallback, Chinese rendering, local switching, and unchanged projected content.
- [x] Refine all five views with compact responsive navigation, equal locale controls, stronger hierarchy, and bounded master/detail collections.
- [x] Give repeated History archives distinct opaque lookup identities and protect exact detail selection with regression coverage.
- [x] Reinspect Overview, Specs, History, Runs, and Attention in both locales at desktop and 390px, then replace the prior browser evidence with the final accepted presentation.
- [x] Scope detail and search errors independently from complete-snapshot stale state and retain one legacy History route fallback for an already-running Broker.
- [x] Add default-on, session-local 30-second automatic atomic refresh with visibility, active-reading, and concurrent-refresh guards.
- [x] Replace the bare missing-bootstrap dead end with a localized security-boundary explanation and visible `rsp web` recovery command.
- [x] Cancel and clear hidden Specs search state when navigation leaves the view so late results cannot suppress automatic refresh.

## Verify
### Required
- Automated:
  - [x] `mise x node@22.13.0 -- pnpm exec vitest run test/web-observatory.test.ts test/clean-install-check.test.ts --no-file-parallelism` — passed 2 files / 34 tests; proves: catalog parity, `zh-CN`, `zh-Hans`, `zh-SG`, English and unsupported-locale fallback, local state-preserving switching, exact projected values, distinct repeated-archive lookup identities, earlier-route request derivation and duplicate detection, scoped operation failures, automatic-refresh guards, reload recovery presentation, Web security boundaries, static serving, and package inventory remain exact.
  - [x] `mise x node@22.13.0 -- pnpm run build`, `mise x node@22.13.0 -- pnpm run typecheck`, `mise x node@22.13.0 -- pnpm run lint`, and `git diff --check` — passed; proves: browser modules, authored assets, types, style, and whitespace remain valid.
- Historical pre-React integration evidence on 2026-08-10: `mise x node@22.13.0 -- pnpm run docs:check` passed 7 bilingual pairs / 30 Markdown files; after the refresh and earlier-Broker compatibility correction, `mise x node@22.13.0 -- pnpm run build`, `mise x node@22.13.0 -- pnpm run typecheck`, and `mise x node@22.13.0 -- pnpm exec vitest run --no-file-parallelism` passed with 68 files / 809 tests; that historical clean installation included the then-authored `web/static/i18n.js`. This evidence is retained for chronology but was superseded as final architecture and package evidence by the later React integration.
- Historical fixed-scope review against `6b20fe8` covered the pre-React catalog asset and was Code `clean`, Document `clean`, with no P0-P3 findings. It is not the final closeout review for the integrated React implementation; final review uses typed `web/src/i18n.ts`, generated `web/static/app.js`, and the exact static package inventory `index.html` / `app.css` / `app.js` under the authoritative React Web Decision Record.
- Fresh managed correction evidence on 2026-08-11: focused browser, Web, and clean-install verification passed 3 files / 50 tests after adding completed-search and in-flight-search navigation coverage; `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test -- --no-file-parallelism` (69 files / 831 tests), `mise exec -- pnpm run docs:check`, and `git diff --check` then passed on the integrated wave.
### Optional
- Manual or environment:
  - [x] Authenticated browser inspection covered Chinese and English presentation at desktop and 390px across Overview, Specs, History, Runs, and Attention. Desktop Specs held `document.scrollHeight === innerHeight === 720` while its long collection scrolled internally; the 390px navigation remained one row; `中文` and `EN` both measured `52 × 36px`; Runs event labels and metadata each retained about 667px without overlap.
  - [x] The History lookup route and repeated-archive exact selection are covered by fresh HTTP/projection integration tests. The already-running system Broker predates this route change and was not restarted, so its old live page is not claimed as verification of the new `historyId` route.
  - [x] Fresh authenticated inspection against that already-running earlier Broker confirmed the new static browser bundle renders `自动` enabled, switches it off locally, loads a unique archived WorkRef through the earlier route with a compatibility warning, and rejects a repeated WorkRef locally with an exact restart-required explanation while the complete snapshot remains live rather than stale.
- Coverage:
  - Additional locales, persisted preferences, `rsp web --lang`, machine translation, remote hosting, and translated repository content remain outside this Change.

## Blockers
- none
