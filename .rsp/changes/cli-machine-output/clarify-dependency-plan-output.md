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
- Non-goals:
  - Persisting a graph, adding arbitrary dependency types, introducing scheduling authority, or changing the `Blockers` syntax.
  - Returning full Change contents through `status`.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: dependency-plan output is self-contained and directionally explicit.
  - A consumer can identify the dependent and prerequisite of every edge without relying on display notation or undocumented field interpretation.
  - A filtered plan includes the open prerequisite closure required to explain the selected Changes, while distinguishing selected records from contextual nodes.
  - Filtered waves contain no meaningless empty leading wave and remain consistent with the included prerequisite closure.
  - Archived prerequisites remain visible as resolved evidence without being treated as executable open nodes.
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

## Design
- Affected boundaries:
  - `src/core/dependency-plan.ts` owns the complete derived dependency projection.
  - `src/commands/status.ts` owns filter-aware presentation and must not discard explanatory prerequisite context.
  - `src/types.ts`, JSON error envelopes, CLI documentation, and integration tests own the public output contract.
- Constraints:
  - Preserve deterministic ordering and current fail-closed behavior for malformed, missing, self-referential, cyclic, or incompletely inspected dependencies.
  - Do not make Group Brief order or filtered status output a persisted execution plan.
  - Compatibility changes must be explicit and covered by tests for both filtered and unfiltered output.
- Design decision to settle with the maintainer:
  - Choose between an additive compatibility shape that retains `change`/`requires`, or a schema-versioned replacement using explicit `dependent`/`prerequisite` fields.
  - Choose the smallest contextual-node representation that makes filter scope and prerequisite closure explicit without duplicating complete status records.

## Tasks
- [ ] Settle and record the edge compatibility and contextual-node shape.
- [ ] Implement the complete dependency projection and filter-aware prerequisite closure.
- [ ] Update JSON types, error envelopes, human presentation, and public documentation as required by the settled contract.
- [ ] Add focused integration coverage for unfiltered, focused, blocked, archived-prerequisite, and invalid-graph projections.

## Verify
- Automated:
  - [ ] `mise exec -- pnpm exec vitest run test/integration.test.ts`
  - [ ] `mise exec -- pnpm run build`
  - [ ] `mise exec -- pnpm run lint`
  - [ ] `mise exec -- pnpm run test`
- Manual:
  - [ ] Inspect pretty and compact-independent `rsp status --focused --json` output for a three-Change chain and confirm its direction, filter scope, and next executable prerequisite are understandable without reading source files.
- Durable updates:
  - [ ] Decide whether the settled dependency projection belongs in `.rsp/specs/design.md` and whether its compatibility policy requires a Decision Record.

## Blockers
- Maintainer decision: select the compatible edge-field and contextual-node contract before implementation.
