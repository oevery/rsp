---
kind: "feature"
---

# Change: rsp-4-runtime/parallel-run-visualization

## Proposal
- Outcome: Make parallel managed execution readable through one bounded manager/dispatch SVG swimlane while retaining the committed sequence timeline as the exact audit log
- Why:
  - The current Runs detail flattens manager events, dispatches, worker events, and receipts into one vertical sequence, so concurrent branches appear serial and their fan-out, progress, and convergence are difficult to understand.
  - Runtime storage already retains dispatch, actor, parent-event, observation-time, receipt, and committed-sequence facts, but the Web projection drops the exact parent identity and observation time needed for a useful visual relationship.
- Scope:
  - Extend the bounded managed-run Web projection with exact redacted parent references and optional observation timestamps while preserving committed sequence as authoritative order.
  - Render one responsive native SVG swimlane with a manager lane and one lane per dispatch, deterministic sequence-based positions, parent edges, receipt terminals, missing/out-of-order markers, and selected-node detail.
  - Add filtering/highlighting by dispatch, actor, and event type, synchronized with the retained ordered timeline.
  - Keep the existing topology, receipt/evidence, attention, and ordered timeline sections available as accessible textual fallbacks.
- Non-goals:
  - Introduce React Flow, Dagre, ELK, d3-force, editable nodes, draggable layout, wall-clock causal ordering, runtime mutation, or inferred acceptance.
  - Visualize arbitrary cross-run dependencies or claim that observation timestamps are synchronized across workers.

## Spec
### ADDED
- Requirement: A managed run with parallel dispatches exposes one deterministic bounded swimlane projection without replacing its committed audit sequence.
  - Lane identity is the exact dispatch identity, not worker display name or lane label; one manager lane owns run-level events.
  - Horizontal placement derives from committed sequence. Optional creation/observation timestamps are display metadata only and never determine causality, freshness, or acceptance.
  - Exact parent references produce bounded edges. Missing and after-sequence parents remain explicit instead of being silently repaired.
  - Dispatch, event, and receipt nodes retain duplicate, conflict, attention, stop-boundary, and source-reference information already present in the textual projection.
  - The graph is keyboard-readable, has a textual accessible summary, responds to narrow screens through bounded horizontal scrolling, and remains usable when SVG is unavailable.

### Acceptance
#### Scenario: two parallel dispatches
- GIVEN one run where a manager dispatches two workers before either receipt is committed
- WHEN Runs detail opens
- THEN the graph shows two separate dispatch lanes sharing the same manager branch, positions all nodes by committed sequence, and does not imply that one worker ran after the other

#### Scenario: branch convergence and attention
- GIVEN one completed receipt, one missing receipt, and one event whose parent is missing or committed later
- WHEN the graph and ordered timeline render
- THEN the completed branch, incomplete branch, parent anomaly, attention state, and exact sequence references agree across both representations

#### Scenario: bounded narrow presentation
- GIVEN the maximum retained timeline and dispatch count on a 390px viewport
- WHEN the graph renders
- THEN lane labels remain visible, the plot scrolls inside its owner without page overflow, and the textual timeline remains reachable

## Design
- Approach:
  - Add optional `parentRef` and `observedAt`/`createdAt` presentation fields to managed dispatch, event, receipt, and timeline records, bounded and redacted through the existing Web projection.
  - Derive one deterministic graph model in the React browser from already projected nodes: fixed lane height, sequence column width, manager lane first, dispatch lanes ordered by dispatch sequence and identity.
  - Render graph primitives with authored SVG elements and CSS. Selection updates a local inspector and highlights the matching textual timeline item.
- Boundaries:
  - Runtime storage remains the observation owner; the Web graph never invents missing nodes, merges dispatches by worker, or reorders committed sequence.
  - Observation time is non-authoritative display metadata. Parent identity and source references remain bounded opaque runtime identities.
  - React Flow and automatic graph-layout dependencies remain absent until arbitrary graph editing or unconstrained DAG layout is evidenced.
- Affected areas:
  - Managed runtime projection types and projection assembly, Web-safe managed projection, React Runs components, styles, and localization.
  - Runtime/Web Specs, managed-observability Decision Record if rationale changes, and focused projection/render/browser tests.
- Constraints:
  - Requires the React browser foundation.
  - Preserve current projection limits, redaction, source sequence, stale detection, attention derivation, and no-acceptance boundary.

## Tasks
- [x] Project exact bounded parent and timestamp display metadata without changing runtime ordering or authority.
- [x] Build and test the deterministic manager/dispatch swimlane model and accessible textual summary.
- [x] Render the responsive native SVG graph, selection/filter interaction, anomaly markers, and synchronized timeline highlighting.
- [x] Update stable managed Web presentation facts and inspect representative parallel, missing-parent, duplicate, conflict, truncated, and narrow-screen cases.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/web-react-browser.test.tsx test/web-observatory.test.ts test/clean-install-check.test.ts --no-file-parallelism` — 3 files and 42 tests passed on 2026-08-10; proves: parent references, optional timestamps, exact dispatch lane identity including independently truncated dispatch records, committed-sequence positions, missing/later parents, receipt terminal state, synchronized filtering/selection, redaction, and bounded internal horizontal overflow remain exact.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed on 2026-08-10; proves: the native SVG graph, React interactions, styles, localization, and generated browser asset compile without a graph-layout dependency.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism` and `git diff --check` — 69 files and 817 tests passed on 2026-08-10 with a clean whitespace check; proves: the added projection and SVG presentation do not regress other RSP surfaces.
### Optional
- Manual or environment:
  - [ ] Inspect a real managed run with at least two parallel dispatches at desktop and 390px in both locales.
- Coverage:
  - Arbitrary cross-run DAGs, editable graphs, drag/drop, automatic layout libraries, and synchronized wall-clock analytics remain outside this Change.

## Blockers
- requires `rsp-4-runtime/web-react-foundation`: migrate the browser to the typed React root before adding the SVG run presentation
