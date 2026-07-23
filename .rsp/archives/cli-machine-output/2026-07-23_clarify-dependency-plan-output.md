---
kind: "fix"
---

# Change: cli-machine-output/clarify-dependency-plan-output

## Proposal
- Summary: Make dependency-plan JSON and filtered status projections explicitly communicate prerequisite direction and required node context.
- Why:
  - Current edge fields require consumers to infer that `change` is the dependent and `requires` is the prerequisite.
  - `rsp status --focused --json` can retain a dependency edge while omitting its prerequisite record and leave an empty leading wave, so the returned projection is not self-contained.
- Scope:
  - Give dependency edges an unambiguous machine-readable direction.
  - Preserve the transitive prerequisite context needed to interpret filtered status plans.
  - Keep ready, blocked, edge, and wave projections internally consistent after filtering.
  - Render the same dependency graph as a compact terminal tree for human-readable status output.
- Non-goals:
  - Persisting a graph, adding arbitrary dependency types, introducing scheduling authority, or changing the `Blockers` syntax.
  - Returning full Change contents through `status`.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: dependency-plan output is self-contained and directionally explicit.
  - A consumer can identify the dependent and prerequisite of every edge without relying on display notation or undocumented field interpretation.
  - JSON remains a flat graph projection rather than nesting prerequisites into a tree, so shared prerequisites, multiple roots, and invalid cycles retain one identity.
  - The graph includes minimal node metadata that distinguishes filter-selected Changes from prerequisite context and reports each node's derived readiness state.
  - A filtered plan includes the open prerequisite closure required to explain the selected Changes, while distinguishing selected records from contextual nodes.
  - Filtered waves contain no meaningless empty leading wave and remain consistent with the included prerequisite closure.
  - Archived prerequisites remain visible as resolved evidence without being treated as executable open nodes.
  - Human-readable status renders selected Changes and their prerequisite closure as a deterministic dependency tree whose parent requires its children, with a direct next-action summary and text labels that remain meaningful without color.
  - The projection remains derived from open Change blockers and archive evidence and does not persist delivery state.

### Acceptance
#### Scenario: focused dependent has an open prerequisite
- GIVEN `implement` is focused and declares `requires research`
- WHEN `rsp status --focused --json` is run
- THEN the output identifies `implement` as the dependent and `research` as its prerequisite
- AND includes enough contextual node and wave information to show that `research` is ready before `implement`
- AND distinguishes `implement` as selected by the filter from `research` as prerequisite context

#### Scenario: prerequisite is archived
- GIVEN an open Change requires an archived Change
- WHEN dependency status is emitted as JSON
- THEN the edge identifies the prerequisite as archived
- AND the open Change can be ready without adding the archived Change to an executable wave

#### Scenario: human reads a focused dependency tree
- GIVEN `implement` is focused and transitively requires ready `research`
- WHEN `rsp status --focused` is run
- THEN the output renders `implement` as the selected root and `research` as its prerequisite child
- AND labels `research` as the next action without requiring the reader to decode an arrow direction or inspect JSON
- AND the same relationship, node states, and next executable Change are present in `rsp status --focused --json`

## Design
- Affected boundaries:
  - `src/core/dependency-plan.ts` owns the complete derived dependency projection.
  - `src/commands/status.ts` owns filter-aware projection and terminal-tree rendering and must not discard explanatory prerequisite context.
  - `src/types.ts`, JSON error envelopes, CLI documentation, and integration tests own the public output contract.
- Constraints:
  - Preserve deterministic ordering and current fail-closed behavior for malformed, missing, self-referential, cyclic, or incompletely inspected dependencies.
  - Do not make Group Brief order or filtered status output a persisted execution plan.
  - Compatibility changes must be explicit and covered by tests for both filtered and unfiltered output.
- Settled contract:
  - Preserve the existing `plan.ready`, `plan.edges`, `plan.blocked`, and `plan.waves` fields and the existing edge keys `change` and `requires` for 3.x compatibility; document that every edge reads as “`change` requires `requires`”.
  - Add `plan.nodes` as the minimal graph-node projection. Each node contains `name`, `selection: selected | prerequisite`, and `state: ready | waiting | blocked | archived | missing`; do not duplicate complete status records inside the plan.
  - Treat Changes matched by the active status filter as `selected`; recursively include their open, archived, or missing prerequisite nodes as `prerequisite` context. An unfiltered status selects every open Change.
  - Rebuild `ready`, `blocked`, and `waves` over the selected open Changes plus their open prerequisite closure. Archived prerequisites remain nodes and edges but never executable wave members.
  - Render human output as a deterministic forest rooted at selected Changes that are not prerequisites of another selected Change. Display parents above the prerequisites they require, use text state labels in addition to optional symbols and color, and mark repeated shared prerequisites as references instead of expanding them indefinitely.
  - End the human projection with `Next action` derived from `plan.ready`; retain explicit external blockers and dependency reasons without relying on color or Unicode geometry for meaning.
  - Keep JSON as the canonical flat graph projection and terminal-tree layout as a presentation concern; do not add nested JSON children, a persisted graph, or a general-purpose graph-layout dependency.

## Tasks
- [x] Settle and record the graph compatibility, contextual-node, and terminal-tree contracts.
- [x] Implement the complete dependency projection and filter-aware prerequisite closure.
- [x] Implement deterministic human dependency-tree rendering from the same graph projection.
- [x] Update JSON types, error envelopes, human presentation, and public documentation as required by the settled contract.
- [x] Add focused integration coverage for unfiltered, focused, blocked, archived-prerequisite, shared-prerequisite, and invalid-graph projections.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts` — 153 integration tests passed.
  - [x] `mise exec -- pnpm run build` — production bundle built successfully.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run test` — 30 test files / 364 tests passed.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real && node scripts/native-design-composition-eval.mjs` — the real four-phase host run and retained-evidence recheck passed every gate for exact package SHA-256 `e621a85f78fa9ceaa5d91c08a697c8b5dcf5cd160f0e2a6611e7bbf8ef72444d`.
- Manual:
  - [x] Inspected human, pretty JSON, and compact JSON `rsp status --focused` output for `release -> implement -> research`; each retained only `release` as selected, included the two prerequisite nodes, rendered the dependency direction, and named `research` as the next action.
- Durable updates:
  - [x] Updated `.rsp/specs/design.md` with the stable filtered-graph and human-rendering contract; no Decision Record is required because the additive 3.x compatibility shape preserves the existing edge and plan fields and is not a hard-to-reverse policy choice.

## Blockers
- none
