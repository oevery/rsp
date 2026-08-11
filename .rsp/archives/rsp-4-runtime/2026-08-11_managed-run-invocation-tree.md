---
kind: "feature"
---

# Change: rsp-4-runtime/managed-run-invocation-tree

## Proposal
- Outcome: Make managed parent-child execution and repeated worker calls immediately readable through an invocation-identity tree while retaining committed sequence as the exact audit order
- Why:
  - The current manager/dispatch swimlane centers parallel sequence lanes, so parent-child agent relationships remain visually secondary and repeated calls are difficult to distinguish from one persistent worker.
  - Runtime observations already retain exact dispatch, worker, lane, parent-event, sequence, event, and receipt identities, but the Web projection does not expose a direct parent-invocation relationship or optional host-observed worker presentation metadata.
- Scope:
  - Project one invocation per exact dispatch with a resolved parent dispatch when the retained parent event belongs to another dispatch, plus explicit root, missing, later, and unresolved states.
  - Retain optional host-observed worker display name and semantic role as immutable dispatch-time presentation metadata without replacing `workerId` or `dispatchId`.
  - Replace the default swimlane with a responsive, keyboard-readable invocation tree that keeps repeated calls distinct and attaches events and receipts to their owning invocation.
  - Preserve the existing committed-sequence graph and ordered timeline as secondary audit views, synchronized with invocation selection and bounded filters.
  - Compact duplicated freshness presentation and distinguish run status, projection freshness, and invocation terminal state.
- Non-goals:
  - Infer a persistent worker identity across runs, merge calls by random display name, repair missing parents, or use timestamps as authoritative ordering.
  - Add editable graph layout, drag and drop, remote telemetry, cross-run dependencies, or acceptance semantics.
  - Replace exact opaque runtime identities with labels or roles.

## Spec
### ADDED
- Requirement: Managed run detail defaults to an invocation-identity tree that makes exact parent-child dispatch relationships and repeated worker calls explicit.
  - Every invocation node is keyed by exact `dispatchId`; `workerId`, optional display name, optional role, and a deterministic repeated-call ordinal are presentation attributes.
  - A repeated `workerId` or role produces separate invocation nodes and never collapses receipts, events, objectives, or terminal states.
  - Parent invocation derives only from a retained exact parent event and its owning dispatch. Missing, later, manager-root, same-dispatch, and truncated relationships remain explicit rather than inferred.
  - Committed sequence remains the exact audit order. The invocation tree may summarize sequence ranges but does not imply wall-clock duration or synchronized worker clocks.
  - Optional host-observed display name and role are bounded, redacted, immutable dispatch-time observations and never become identity or authority.
  - Run status, projection freshness, and invocation result use distinct labels and visual treatment; warnings remain understandable without color alone.

### Acceptance
#### Scenario: repeated worker calls
- GIVEN one worker identity or semantic role is dispatched more than once in one managed run
- WHEN managed run detail opens
- THEN each dispatch appears as a separate invocation with its own ordinal, objective, events, receipt, terminal state, and exact identity

#### Scenario: nested invocation
- GIVEN a worker event causes another dispatch and both parent event and owning dispatch are retained
- WHEN the invocation tree renders
- THEN the child invocation is nested below the parent invocation while manager-originated dispatches remain root children

#### Scenario: incomplete parent evidence
- GIVEN a dispatch parent event is missing, committed later, belongs to the same dispatch, or is outside the bounded projection
- WHEN the invocation tree renders
- THEN it reports the exact unresolved state, creates no fabricated parent, and the ordered sequence view remains available

#### Scenario: optional worker presentation
- GIVEN the host supplies a random worker display name and a stable lane role at dispatch observation time
- WHEN the run is projected
- THEN the tree shows role and call ordinal first, display name second, and exact worker and dispatch identities in detail without treating the name as stable identity

#### Scenario: responsive and accessible inspection
- GIVEN a bounded run with nested and repeated calls on desktop or a narrow viewport
- WHEN a keyboard or pointer user selects, expands, filters, or switches views
- THEN the selected invocation, attached observations, freshness warning, and exact audit sequence remain reachable without page-level horizontal overflow

## Design
- Approach:
  - Extend dispatch observation payload and typed runtime projection with optional `workerDisplayName` and `workerRole`, retaining exact host values only when supplied.
  - Derive a bounded `parentDispatchId` and relationship state in the runtime projection by joining the exact parent event to its `dispatchId`; keep browser code presentation-only.
  - Build a deterministic invocation tree model keyed by `dispatchId`, with manager root, stable sibling sequence order, per-worker and per-role ordinals, attached events/receipts, sequence range, and anomaly counts.
  - Present `Invocation tree`, `Sequence`, and `Raw events` modes. Keep the existing SVG and textual timeline in `Sequence`; use a side inspector on desktop and stacked detail on narrow screens.
  - Replace repeated full freshness cards with compact labeled summaries and one expandable reason region in run detail.
- Boundaries:
  - Runtime storage owns exact observations and sequence. Web projections remain bounded, redacted, disposable, read-only, and non-authoritative.
  - `dispatchId` remains invocation identity and `workerId` remains host execution identity; display name, role, and ordinals are never identity.
  - Parent invocation resolution never crosses runs or guesses through a missing/truncated event.
  - Existing projection compatibility remains additive; absent optional fields render through exact fallback labels.
- Affected areas:
  - Runtime dispatch input/storage/projection types, protocol validation, Web managed projection, and compatibility fixtures.
  - React run-detail models and components, localization catalogs, authored CSS, generated bundle, browser/projection tests, and runtime/Web Specs.
- Constraints:
  - Preserve existing runtime schema migration, idempotency, fingerprint, redaction, projection limits, SSE refresh, and no-acceptance boundaries.
  - Preserve the current Web bundle size ceilings, no graph-layout dependency, narrow-screen behavior, and keyboard access.
  - Work sequentially in the current dirty worktree because the accepted React, localization, content, and swimlane foundations are not yet committed and own overlapping paths.

## Tasks
- [x] Add optional worker presentation metadata and exact parent-invocation derivation through runtime and Web projections.
- [x] Build and test a deterministic invocation tree that preserves repeated calls, nested dispatches, unresolved parents, attached observations, and exact sequence summaries.
- [x] Replace the default run visualization with invocation-tree, sequence, and raw-event modes plus compact status/freshness presentation and responsive inspection.
- [x] Refine the run observatory around an exception-first summary, compact master/detail allocation, automatic anomaly selection, conditional inspection, and clearer bilingual status hierarchy.
- [x] Replace the card-based Runs page with a Trace Explorer workbench: hide the picker for one run, use a five-column invocation tree table, dock detail only for a selected invocation, add anomaly navigation, and move sequence/raw audit views into a bounded bottom panel.
- [x] Update bilingual labels, authored styles, stable runtime/Web presentation facts, and generated browser assets.
- [x] Run focused and full required verification, then retain only final decisive evidence and truthful omissions.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/manage-runtime-integration.test.ts test/runtime-event-store.test.ts test/web-observatory.test.ts test/web-react-browser.test.tsx test/clean-install-check.test.ts --no-file-parallelism` — 5 files and 69 tests passed in an independent verification on 2026-08-10; proves: optional dispatch metadata, parent invocation derivation, repeated calls, exact projection compatibility, tree interaction, localization, and package behavior.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, and `mise exec -- pnpm run lint` — passed in the same independent verification on 2026-08-10; proves: runtime types, React presentation, styles, localization, and shipped generated assets agree.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism` and `git diff --check` — 69 files and 826 tests passed with a clean whitespace check in the same independent verification on 2026-08-10; proves: the invocation projection and presentation do not regress other RSP surfaces or introduce whitespace defects.
  - [x] `mise exec -- pnpm exec vitest run test/web-react-browser.test.tsx test/clean-install-check.test.ts --no-file-parallelism`, `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run test -- --no-file-parallelism`, and `git diff --check` — 11 focused tests and the 69-file, 828-test full suite passed on 2026-08-11; proves: exception-first selection, conditional inspector allocation, authored/generated asset agreement, responsive CSS packaging, and repository-wide compatibility.
  - [x] Managed Fix, independent Verify, one bounded correction, and independent Re-Verify converged on 2026-08-11; `mise exec -- pnpm exec vitest run test/web-observatory.test.ts test/web-react-browser.test.tsx test/clean-install-check.test.ts --no-file-parallelism` passed 3 files and 47 tests, `mise exec -- pnpm run test -- --no-file-parallelism` passed 69 files and 828 tests, and build, typecheck, lint, plus `git diff --check` passed. A real Simplified Chinese retained run was inspected at 1440px and 390px: the desktop workbench measured 1403px with a 963px tree table and 400px inspector, the 390px view had no horizontal overflow, both audit modes used one bounded scroll surface, and live treeitem labels exposed all five columns.
### Optional
- Manual or environment:
  - [ ] Inspect one real managed run with nested dispatches and one repeated worker or role in English and Simplified Chinese at desktop and 390px.
- Coverage:
  - Automated browser and projection coverage includes repeated worker and role calls, nested dispatches, missing/later/same-dispatch/truncated parents, synchronized invocation/sequence selection, raw-event fallback, bilingual labels, keyboard semantics, and responsive CSS ownership. One real Simplified Chinese retained run passed desktop geometry and 390px visual/overflow inspection; a real nested or repeated invocation in both locales remains optional and was not available in the retained run.
  - Cross-run persistent worker identity, wall-clock duration analytics, arbitrary DAG layout, and remote multi-user telemetry remain outside this Change.

## Blockers
- none
