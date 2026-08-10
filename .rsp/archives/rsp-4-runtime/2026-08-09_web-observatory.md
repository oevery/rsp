---
kind: "feature"
---

# Change: rsp-4-runtime/web-observatory

## Proposal
- Outcome: Expose a local read-only Web Observatory for current project state, Specs, and history
- Why:
  - The terminal dashboard is intentionally bounded by terminal layout and lifecycle, while a browser can provide deeper read-only navigation over current work, Specs, diagnostics, and retained history.
  - A shared Broker can serve one bounded UI for multiple checkouts without starting one server per project.
- Scope:
  - Add an embedded local Web application with Overview, Specs, and History views.
  - Add read-only HTTP JSON snapshot APIs over existing status, diagnostics, history, and direct Specs query projections.
  - Route projects by exact checkout identity through one compatible Broker endpoint and support explicit refresh, bounded detail, and stale-state indication.
- Non-goals:
  - Render managed run topology, worker receipts, attention, live event streams, or execution timelines; those belong to `rsp-4-runtime/managed-run-observatory`.
  - Edit Markdown, create or focus or archive Changes, execute commands, mutate Git, publish, deploy, or approve results.
  - Expose the service remotely by default, add accounts or cloud sync, or provide a multi-user hosted product.
  - Reimplement RSP domain derivation or parse repository Markdown independently in browser code.

## Spec
### ADDED
- Requirement: The base Web Observatory is a read-only, local, bounded projection of exact current project sources.
  - One Broker HTTP endpoint routes every page and API request through an exact checkout identity and scoped access token.
  - Overview answers current WorkRef, goal, state, blockers, diagnostics, and next action from presentation-neutral server projections.
  - Specs and History reuse server-side query seams and never parse or cache independent semantic copies in the browser.
  - Snapshots carry source identity and freshness metadata; refresh replaces browser state atomically instead of merging hidden semantic caches.
  - Origin, token, content-security, path, payload, and redaction checks fail closed before local data is returned.

### Acceptance
#### Scenario: one Broker, multiple checkouts
- GIVEN two registered repositories or worktrees and one compatible Broker
- WHEN each project URL is opened
- THEN each page receives only its exact status, diagnostics, Specs, history, and token scope
- AND live managed event streams remain deferred to `rsp-4-runtime/managed-run-observatory`

#### Scenario: current repository change
- GIVEN a visible Change, Spec, or archive is modified in the working tree
- WHEN the page refreshes
- THEN the next snapshot reflects the current readable source and does not serve a hidden semantic cache as truth

#### Scenario: refresh failure
- GIVEN a page with one previously valid snapshot
- WHEN a later refresh fails or returns an incompatible projection
- THEN the page preserves the prior snapshot as visibly stale and exposes the bounded error without inventing newer state

#### Scenario: write attempt
- GIVEN a browser request attempting lifecycle, filesystem, command, Git, or runtime mutation
- WHEN it reaches the Web API
- THEN no such route or authority exists and the request cannot mutate repository or runtime semantics

## Design
- Approach:
  - Build one static browser bundle shipped with the package and served by the Broker.
  - Share presentation-neutral project, Specs, history, diagnostic, and evidence projection types with CLI and TUI consumers.
  - Use atomic HTTP snapshots and explicit or bounded polling refresh; keep browser state disposable and recoverable.
  - Reuse the existing TUI information architecture where useful without copying Ink components.
  - Require Broker protocol `1.1`, use one one-minute one-use URL-fragment bootstrap to exchange an eight-hour project-scoped in-memory Web bearer, and omit credentials from normal human and JSON command output.
  - Ship authored framework-free HTML, CSS, and JavaScript plus an isolated `dist/web-projector.mjs`; add no browser framework or runtime dependency.
  - Preflight the exact serialized success envelope against the Broker response bound before replacing the cached snapshot, so projection, compatibility, or transport failure retains the prior complete snapshot.
- Boundaries:
  - Server and domain modules derive all semantic state; the browser renders received projections only.
  - The Broker owns authentication, checkout routing, transport, bounds, and redaction.
  - CLI and Skills remain usable without building, launching, or connecting to the Web UI at runtime.
- Affected areas:
  - New browser source and build assets, Broker HTTP snapshot routes, shared API types, and `rsp web` behavior.
  - Status, history, Specs, diagnostics, localization policy, documentation, and package checks.
  - Component, API, snapshot-refresh, security, checkout-isolation, bundle, and local browser acceptance tests.
- Constraints:
  - Bind to loopback by default, choose or reuse the discovered Broker endpoint, and never make the access token durable project state.
  - Browser bundles contain no repository data, credentials, project paths, or environment-specific configuration.
  - Browser tooling and dependencies require an explicit package-footprint and clean-install rationale before implementation.
  - UI detail remains bounded and progressively disclosed; raw JSON is optional diagnostic detail, not the primary human surface.

## Tasks
- [x] Define the base read-only Web snapshot API, token, checkout routing, freshness, error, and shared projection contracts.
- [x] Select the minimal browser bundle/tooling boundary and implement Overview, Specs, and History over presentation-neutral server projections.
- [x] Implement Broker static serving, scoped atomic snapshots, refresh failure handling, redaction, and security headers.
- [x] Add component, API, security, bundle, and local browser acceptance coverage, then document `rsp web`, shutdown, privacy, resource behavior, and unavailable-service fallback.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/web-observatory.test.ts --maxWorkers=1` and `mise exec -- pnpm exec vitest run test/web-observatory.test.ts test/history-query.test.ts test/broker-protocol.test.ts test/specs-query.test.ts --maxWorkers=1` — focused Web 13/13 and fixed 4-file suite 59/59 passed; bounded Overview, Specs, History, diagnostics, loading, browser rendering, errors, and incompatible projections remain deterministic.
  - [x] The fixed focused suite passed atomic clearing plus generation/source-identity rejection of deferred snapshot-derived detail/search after refresh, failed and oversized refresh retention, safe current Specs and archive no-follow identity/growth bounds with final handle/path/root validation, post-read symlink or regular replacement rejection, inspection-to-detail same-inode archive rewrite rejection, complete PEM redaction before Specs excerpt/detail truncation, exact checkout-root and issue-URL token boundaries including bounded nested `**`, `_`, and `~~` closing-order stacks without prefix or legitimate-suffix widening, safe path-free `rsp web` human/JSON failure output, and projector timeout/max-buffer/invalid/incompatible cleanup.
  - [x] The same focused suite passed exact loopback Host and Origin rejection, injected-clock one-minute bootstrap and eight-hour Web bearer expiry, concurrent bootstrap exactly-once consumption, project/Web token separation, opener-rejection TTY boundaries, method and query allowlists, path traversal rejection, security headers, write-route absence, and two-checkout isolation.
  - [x] `mise exec -- pnpm run release:package-check` and `mise exec -- pnpm exec vitest run test/clean-install-check.test.ts --maxWorkers=1` — passed on the reconciled Group package; SHA-256 `62f97547e59475fe268ee20bf60a05a9d86961209c12592ceddab7d79f6a44d3`, 3/3 clean-install tests, exact static assets and `dist/web-projector.mjs`, safe non-interactive `rsp web --json`, authenticated page/API smoke, runtime fallback, Broker stop, and no package-workspace residue.
- Fresh closeout verification on 2026-08-09: the fixed four-file Web suite passed 59/59; `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run docs:check` passed; the direct serial full suite passed 68 files / 790 tests; `git diff --check` passed; Broker status was `absent`.
### Optional
- Manual or environment:
  - [ ] Inspect responsive Overview, Specs, and History pages across two repositories and two worktrees.
- Coverage:
  - `rsp-4-runtime/managed-run-observatory` later adds run topology, receipts, attention, evidence, live event streams, and timeline views.

## Blockers
- none
