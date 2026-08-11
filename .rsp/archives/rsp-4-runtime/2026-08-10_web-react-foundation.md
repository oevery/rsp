---
kind: "refactor"
---

# Change: rsp-4-runtime/web-react-foundation

## Proposal
- Outcome: Migrate the local Web Observatory from whole-page HTML string replacement to one typed React browser root without changing observable product, authentication, projection, or authority behavior
- Why:
  - The authored browser application now owns five views, localization, SSE recovery, automatic refresh, detail/search coordination, compatibility fallbacks, and more than one thousand lines of imperative rendering code.
  - Parallel visualization and structured Markdown presentation need reusable components, local interaction state, and deterministic rerendering that would otherwise increase string-template and event-delegation complexity.
  - React is already a direct runtime dependency through the Ink TUI, but the browser package does not yet ship `react-dom` or a browser-targeted build.
- Scope:
  - Add a browser-targeted TypeScript/JSX source tree and deterministic build that emits the exact Web assets served and packed by the Broker.
  - Add `react-dom` as an exact compatible runtime dependency and render the complete Observatory through one `createRoot`.
  - Migrate current state transitions, fetch/SSE behavior, localization, responsive classes, accessibility labels, legacy History compatibility, and safe reload guidance with observable parity.
  - Keep authored HTML and CSS boundaries explicit and update exact asset/package validation for generated browser output.
- Non-goals:
  - Add the parallel swimlane graph, Markdown rendering, routing, browser persistence, mutation actions, remote hosting, React Flow, or another state-management framework.
  - Change Broker/Web bearer authentication, snapshot semantics, projection schemas, runtime authority, or the current supported locales.

## Spec
### MODIFIED
- Requirement: The packaged Web Observatory is built from typed browser sources into one exact framework bundle while preserving the existing local read-only contract.
  - One React root owns the complete page and receives explicit application state; React components do not read repository configuration or derive workflow authority.
  - Browser build output is deterministic, CSP-compatible, free of inline script and remote imports, covered by the exact no-follow static allowlist, and included by clean-install inventory checks.
  - Existing bootstrap exchange, in-memory bearer, snapshot replacement, SSE replay, auto-refresh pause rules, locale switching, detail/search cancellation, stale handling, and earlier-Broker History compatibility remain behaviorally equivalent.
  - Browser failures retain their current scope: complete refresh failures may mark a retained snapshot stale, while detail/search failures remain view-local.

### Acceptance
#### Scenario: behavior-preserving React migration
- GIVEN the current Web acceptance fixtures in English and Chinese
- WHEN the generated React bundle boots, switches views/locales, refreshes, receives managed events, loads details, searches Specs, or encounters bounded failures
- THEN it produces the same observable projection, security, freshness, accessibility, responsive, and recovery behavior without whole-page string replacement

#### Scenario: exact packaged browser build
- GIVEN a fresh checkout or clean package installation
- WHEN the normal build and package checks run
- THEN every served Web asset is generated or authored from an explicit source, present in the package, reachable from the static entry, and accepted by the exact allowlist

## Design
- Approach:
  - Add `web/src/main.tsx` as the single browser entry and split state transitions, transport, localization, shared controls, and the five views into typed modules.
  - Use React 19 `createRoot` over the existing `#app` mount. Keep state local to the browser root with reducer-style pure transitions and effects for bootstrap, refresh, heartbeat, and SSE.
  - Add a separate browser-targeted tsup configuration that emits one stable ESM `web/static/app.js` bundle without a Node shebang, source map, runtime chunk lookup, remote asset, or content hash in the served filename.
  - Retain `web/static/index.html` and `app.css` as authored package assets; move catalog source under the typed browser tree and bundle it into the browser entry.
- Boundaries:
  - React owns rendering and browser interaction only; projection, redaction, Markdown interpretation, runtime sequence, and authority remain server owners.
  - Generated browser output is a package artifact, not an editable source owner.
  - No unsafe HTML injection, `dangerouslySetInnerHTML`, cookie, browser storage, service worker, or additional network origin is introduced.
- Affected areas:
  - `web/src/`, `web/static/`, browser build configuration, `package.json`, lockfile, Broker static assets, and clean-install inventory.
  - Web browser tests, generated-asset checks, stable runtime/Web Specs, and the Web architecture Decision Record.
- Constraints:
  - Preserve the current dirty-worktree changes and migrate behavior without rewriting Broker or runtime owners.
  - Keep one exact ESM entry compatible with the existing CSP and loopback no-store transport.
  - Do not retain both imperative and React implementations after parity is proven.

## Tasks
- [x] Add the browser TypeScript/JSX build, direct `react-dom` dependency, exact generated asset boundary, and package validation.
- [x] Port pure browser state transitions, localization, transport coordination, refresh/SSE effects, and recovery behavior into typed modules.
- [x] Port the complete responsive UI and all five views to one React root with accessibility and behavior parity.
- [x] Remove the superseded imperative bundle source and update stable architecture facts and focused regression coverage.
- [x] Replace the shared 256 KiB static ceiling with exact per-asset HTML, CSS, and JavaScript bounds so dependent browser features retain headroom without permitting unbounded reads.
- [x] Exercise the mounted React root lifecycle and keep heartbeat/refresh timers inactive until a valid Web authorization is established.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed on 2026-08-10; proves: the browser bundle, React types, Node entries, authored assets, and generated boundaries compile and remain valid.
  - [x] `mise exec -- pnpm exec vitest run test/web-react-browser.test.tsx test/web-observatory.test.ts test/clean-install-check.test.ts --no-file-parallelism` — 38 tests passed on 2026-08-10; proves: the mounted React lifecycle executes bootstrap, coalesces overlapping manual/automatic/SSE refresh, reconnects, cancels detail requests, cleans up effects, retains missing-bootstrap recovery, enforces exact HTML/CSS/JavaScript bounds, and preserves package and stale/view-local failure contracts.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism` — 69 files and 813 tests passed on 2026-08-10; proves: the React migration and per-asset static limits do not regress CLI, Broker, runtime, Specs, History, Manage, package, or release behavior.
### Optional
- Manual or environment:
  - [ ] Inspect all five authenticated views in both locales at desktop and 390px, including auto refresh, SSE reconnect, stale state, earlier-Broker History compatibility, and browser reload recovery.
- Coverage:
  - Parallel graph behavior and Markdown document presentation are owned by dependent Changes.

## Blockers
- none
