---
kind: "feature"
summary: "Add a repository-owned architecture model, CLI queries and a shared local graph viewer with complete Spec reading."
---

# Change: shared-architecture-viewer

## Proposal

Give agents and people two views of the same repository-owned architecture:
complete or selected structure through the CLI, and an interactive graph with
full Spec reading through a shared local viewer. Projects maintain the model;
RSP supplies the reader without a project website build or `.c4` generation.

The delivery includes model interpretation, CLI queries, packaged presentation,
workspace isolation, live refresh and an on-demand service lifecycle. It does not
include automatic code discovery, architecture editing, remote hosting, worktree
management, standalone HTML export, workflow control or a new agent-facing
document reader. There is no separate viewer installer or persistent content cache.

## Spec

### ADDED

The [CLI contract](../specs/cli.md#architecture-reading) owns the model and reader
behavior. This Change adds three connected capabilities:

- A fixed `.rsp/architecture.json` model with stable identities, explicit relations
  and views, and many-to-many Spec bindings. CLI projections retain complete
  structure or an explicit selection without returning Spec bodies.
- A sidebar and graph reader with object details, explicit internal-view navigation,
  incident-relationship focus and a separate complete-document drawer. Named Web
  views use the same selection as CLI views; presentation never changes identity,
  ownership or authored relationships.
- A local service shared only by compatible runtimes, with isolated registered
  workspaces, safe document access and idle cleanup. The same package supplies
  prebuilt assets; ordinary commands do not load the viewer dependency graph.

The [architecture boundary](../specs/design.md#dependency-direction) keeps the domain
independent of presentation. The [distribution contract](../specs/distribution.md#packaged-architecture-reader)
owns packaged assets and lazy loading. Format examples and operating instructions
belong to the [English](../../docs/site/en/guides/architecture.md) and
[Chinese](../../docs/site/zh-CN/guides/architecture.md) guides.

### Acceptance

#### Structural fidelity

Full queries return all registered nodes and relations without bodies or count
truncation. Subtree and named-view queries preserve binding origins and direct
external endpoints without recursively expanding neighbors. Invalid identities,
references, cycles and selector combinations fail explicitly; missing models do
not affect other commands. Whole-file bindings work without chapter metadata;
missing or ambiguous chapters produce diagnostics.

Named CLI and Web views contain the same relation IDs, including an empty view
whose owner has children. Focus contains only the chosen object's incident
relations and real endpoints, not its subtree. Single-application, shared-package
and async-service examples need no artificial common hierarchy. Unsupported
native edges remain accessible with their exact endpoints and descriptions.

#### Reading and navigation

Object selection leaves the current graph in place; explicit actions enter owned
views or relationship focus. Zero and multiple owned views remain usable. Opening
a bound document shows its full content and optional chapter; closing restores
the selected object and graph viewport. Markdown links, local images, table
headers and column alignment retain their meaning. Both Markdown external-link
forms open a new tab; local document links stay in the reader.

Keyboard search, top-layer Escape and focus return work in desktop and narrow
layouts. Reading position survives source updates and both breakpoint directions,
with and without an initial chapter. Controls remain usable at 390px and with
200% text enlargement. Locale changes preserve authored content and graph state.

#### Isolation and recovery

Two projects and a linked worktree with colliding IDs and file names remain
isolated under concurrent requests, late responses and history navigation.
Dirty model, configuration and Spec edits refresh without rebuilding frontend
assets; Spec-only edits reuse graph layout. Invalid sources mark retained content
stale and recover after repair. Removed targets produce explicit fallbacks.

#### Runtime and security

Compatible concurrent opens reuse one service. Changed runtime identities start
separate services; disk replacement cannot alter a running service's frontend
snapshot. Status and stop address only the current runtime and never stop an
unrelated listener. Controlled-clock tests demonstrate idle cache release,
reconstruction and eventual port release while valid activity keeps reading alive.

Unauthorized control or reading requests, foreign origins, traversal, symlinks,
unlinked resources and executable content are rejected. Removing a Markdown link
revokes downstream access on the next read. An installed package outside the
checkout supplies usable assets and lifecycle commands without an extra download
or project build.

## Design

The neutral model and shared selection functions sit beside existing domain
queries. They reuse the safe file reader and Markdown AST rather than adding a
second parser or returning the bounded CLI Spec excerpt as a complete document.
Bindings authorize entry documents; current parsed links authorize further reads.

The adapter uses LikeC4 1.60.0's public Builder, computed model, Graphviz WASM and
React components. Layout runs in the service with serialized, coalesced work.
Display aliases and explicit reference endpoints preserve relations that native
self, hierarchy or expanded-container drawing would otherwise reject or suppress.
Flat focus changes only the display projection, not structural parents.

A host information card represents parents, multiple view choices and binding
origins that native details cannot express. The Spec drawer overlays the graph
without resizing its canvas. Tailwind, licensed shadcn adaptations and Radix controls
provide consistent host interactions without Preflight or private LikeC4 patches.
React build aliases prevent duplicate React instances. The sidebar replaces the
prototype's mandatory guide-card flow; click selects rather than immediately
navigating to focus.

Runtime identity includes version, real installation path and build identity.
The service verifies its build and captures served assets before listening.
Only discovery credentials and endpoint metadata persist. Frontend cancellation
and response-identity guards separate stale responses from current content;
viewport and reading restoration use their actual workspace and document context.
Optional Git metadata groups registered roots without registering more worktrees.

## Tasks

- [x] Neutral model, Spec bindings and shared structural selectors are available through the CLI.
- [x] Local views, flat relationship focus and exact relation details are available in the packaged graph reader.
- [x] The sidebar, selection card and Spec drawer support keyboard use, locale, worktree identity and reading-state restoration.
- [x] Current-link authorization, runtime isolation, source recovery and idle cleanup enforce the reading boundary.
- [x] Domain, browser and installed-package regressions cover the delivered behavior.
- [x] Stable Specs and bilingual guides describe the implemented contract and its limits.
- [x] Complete independent review of the final integrated scope and independent re-review of both resulting corrections.
- [x] Obtain final human acceptance of real workspace opening, switching, reading, updates and shutdown; confirmed by the user on November 3, 2026.

## Verify

### Candidate and checks

Baseline: `329aa8b1ffa0726aaf2ff551081f9bfe30cb6b5c` with uncommitted implementation.
Runtime build: `a2c5f1c676774d15b0a64b7264b58171441d1303f42e40cd69595ae49b75cada`.
Evidence below is from November 3, 2026. Log names are relative to the ignored
`.cache/shared-architecture-viewer/` directory.

| Check | Result | Evidence |
| --- | --- | --- |
| Code suite | 16 files, 125 tests passed after the final review corrections and assertion cleanup | `final-review-fixes-test.log` |
| Affected tests | All 17 tests passed after cleanup; no scenarios removed | `test-quality-domain-final.log` |
| Browser regression | 23 checks passed in Chrome 156.0.8078.80, including both review regressions | `final-review-fixes-browser-complete.log` |
| Build | Passed for the corrected runtime | `final-review-fixes-test.log` |
| Lint and types | Passed for the corrections | `final-review-fixes-lint-complete.log`, `final-review-fixes-types.log` |
| Installed package | Prior offline installation, CLI, assets, snapshot isolation and lifecycle evidence reused for unchanged packaging paths | `pnpm run test:pack` output in the pre-commit review |
| Documentation | Bilingual checks, local-source Change check and whitespace check passed | Document consolidation command output; zero Change errors or warnings |

Tests omit caller-supplied ID comparisons and fixed display-alias/reference-count
assertions. HTML regressions check parsed structure, content and attributes rather
than serialization order. Exact endpoints, focus boundaries, Markdown semantics
and unsafe-link rejection remain covered. The final review corrections add browser
coverage for prototype-named views and context titles during locale changes without
changing model contracts or dependencies.

The preceding build `00b8c68c125224cbe0d96c335f7371febd1cbb56b0e80e143a1606b4b4cb7847`
package check measured a 951,799-byte tarball and a 31,863,427-byte production
installation on Node v24.22.1. The browser fixture measured about 456 ms cold
opening, 136 ms warm opening, 4.3 s document refresh and 4-12 ms layouts. These
measurements include a 196,672 KiB service RSS sample. They are small-fixture
observations, not scalability guarantees or measurements of the corrected build.

Independent review covered all 41 changed or added files at fingerprint
`a972f5b6e7a51228762daacec633eb29c0c057065299252f6a8161903009076f`.
It found two issues: inherited object properties bypassed missing-view recovery,
and the locale provider overwrote the context title. The corrections use an own-key
view lookup and leave title ownership solely in the application. Browser regressions
exercise an existing then removed `constructor` view and context titles across
locale changes. No model restriction or new abstraction was introduced.
The same independent reviewer rechecked the corrected behavior and adjacent risks,
returning `clean` for the three code and test files at fingerprint
`534b21bdd422a905b5025a932b3a92a32013b7347864a1b2315a74a56fc97159`.
Together with the full review, this closes both findings. The user confirmed
final human acceptance on November 3, 2026.

### Real-source exercise

`boats-acceptance/validation.json` and `provenance.json` record an isolated copy of
a boats-cloud client slice: 13 objects, 16 composition or declared dependency
relations, four views and 15 bindings. Every view matched CLI selection. Full Spec
reading, a real relative Spec link, source edits and 390px navigation passed.
Spec and model updates appeared in 2,809 ms and 4,390 ms, retaining their relevant
context. Edited copies were restored; the live repository was unchanged.

This exercise used build
`4f31fe38e861fee74c5a2b9f129274ef7b6b6788566fbf6e8d5f6b1b4beef511`.
`worktree-brand-*` and `spec-density-*` retain later UI captures of the copied
slice. Declared package dependencies are not proof of runtime calls, and synthetic
demo branches are not actual project history. The separate prototype established
feasibility only; formal regressions own the production acceptance evidence.

### Corrections and limits

Graph-reference, link-routing and authorization failures were corrected without
weakening exact relation or access contracts; evidence remains in `followup-fix-*`
and `converge-*`. `control-unification-browser*.log` retain control-layer and focus
failures. `reading-fixes-browser.log` retains the failed breakpoint-restoration
attempt: the old reader had already reflowed before capture. The corrected reader
retains the latest scroll position and restores it when the new container mounts.
These failed runs are not counted as passing evidence.
`final-review-fixes-browser.log` and `final-review-fixes-browser-final.log` retain
two test-precondition failures: the new initial title assertion ran before model
or workspace metadata loaded. The final test waits for that initial context;
post-switch assertions remain immediate so polling cannot mask a title regression.

Reference nodes can visually repeat an object, and native LikeC4 controls still
contain English. Windows, Safari, Firefox, large models and native browser-toolbar
zoom remain unverified; the enlargement check changes root text size. Idle tests
use controlled time, not a real 30-minute wait, and do not promise immediate RSS
reduction. Human acceptance and independent review are recorded separately from
automated checks and isolated real-source exercises. Commit, publication and
closeout remain separate actions.

## Blockers

None
