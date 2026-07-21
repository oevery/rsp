---
kind: "research"
---

# Change: skill-capability-research/synthesize-shaping-capability

## Proposal
- Summary: Define the smallest RSP-native shaping and slicing capability from selected cross-source evidence.
- Why:
  - RSP lacks a bounded way to turn an unclear request into one executable Change without importing a second PRD/ticket lifecycle.
- Scope:
  - Synthesize `research/models/rsp-shaping-capability.md` from selected exact paths in Matt, Superpowers, Compound, OpenSpec/spec-kit, Ponytail/Karpathy research, and local workflows.
  - Define how a Group Brief can explain a complex requirement and its delivery path without adding nested work identities or a second state model.
  - Define ordinary and Overall Delivery Change content profiles without adding a new `kind`, template file, entity, or lifecycle.
- Non-goals:
  - Creating `rsp-shape`, requiring ceremony for tiny work, or adding nested issues or a persisted/general-purpose dependency graph.

## Spec
### ADDED
- Requirement: The shaping model defines trigger, inputs, authority, permitted Change mutations, output, stop conditions, vertical-slice rubric, restraint behavior, provenance, and evaluation cases.
  - It preserves one Change as the work owner and uses a shallow Change Group only when multiple independently executable slices share one completion contract.
  - It distinguishes clarification from implementation and refuses to invent unresolved product decisions.
  - An ordinary Change profile owns one executable outcome and keeps its Proposal, Spec, Design, Tasks, Verify, and Blockers local to that outcome.
  - An Overall Delivery Change profile is used only when one terminal delivery outcome depends on multiple upstream semantic owners. It uses the same six-section contract, references upstream Group or Change outcomes without owning them as children, and keeps Tasks and Verify limited to terminal delivery operations.
  - The Overall Delivery Change Proposal, Spec, and Design may name the overall outcome, upstream semantic owners, aggregate Definition of Done, and static ownership map. It must not copy upstream tasks, completion checklists, live status, or execution waves.
  - For a complex Group, it may add a concise `Decomposition` view to explain the requirement tree without creating new work identities or lifecycle state.
  - `Slices` remains the sole membership declaration, child `Blockers` remain the dependency authority, and `Completion Conditions` remains the sole Group completion gate. The CLI derives delivery order and dependency rationale from exact blocker references instead of requiring a manually maintained `Delivery Map`.
  - Brief content must not copy live dependency, status, progress, task, or verification state already available from Change files and deterministic CLI projections.

### Acceptance
#### Scenario: an unclear non-trivial request needs an executable RSP shape
- GIVEN project authority and either an existing selected Change or explicit authority to create one
- WHEN the proposed shaping contract is applied
- THEN it returns a bounded Proposal, Spec, Design, Tasks, Verify, and Blockers shape with independently verifiable slices
- AND it does not create a parallel PRD, ticket state machine, or implementation

#### Scenario: a complex requirement needs an understandable shallow plan
- GIVEN one goal decomposes into several independently executable direct child Changes
- WHEN the shaping contract produces or refines the Group Brief
- THEN the Brief explains the requirement decomposition using only direct slice references while the CLI derives the current dependency plan from child Changes
- AND normative membership, dependencies, and completion truth remain owned by their existing sections and child Changes without a duplicated delivery map or recursive groups

#### Scenario: several semantic owners converge on one terminal delivery
- GIVEN independently closable research or implementation owners contribute to one final delivery outcome
- WHEN the shaping contract produces the terminal Change
- THEN it uses the Overall Delivery Change content profile to state the overall outcome, upstream owners, aggregate completion contract, and terminal operations
- AND it does not create child Groups, duplicate upstream execution state, or introduce a new Change kind or lifecycle

## Design
- Approach:
  - Compare capability rows for clarification, spec writing, planning, tracer-bullet slicing, and ambiguity handling; select mechanisms only when they solve an RSP-specific gap.
  - Treat ordinary and Overall Delivery Changes as two content profiles of the same protocol interface; choose the delivery profile only when the terminal Change needs cross-owner semantic context.
  - Treat `Decomposition` as optional explanatory context: use it only when the ordered `Slices` list cannot communicate why slices exist.
  - Prefer one deterministic CLI dependency projection for execution navigation instead of copying delivery order or live artifact flow into the Brief.
- Affected areas:
  - `research/models/rsp-shaping-capability.md`
- Constraints:
  - Cite source reports/revisions and exact eligible paths; separate adapted mechanisms from independent design.
  - Do not introduce phase, initiative, milestone, dependency-graph, progress-rollup, or controller entities into the RSP core.
  - Do not add a fixed Brief table schema or parse explanatory `Decomposition` content until repeated project evidence shows prose and simple Markdown are insufficient; the selected exact blocker-reference contract remains the only machine-readable dependency surface.

## Tasks
- [x] Select evidence-backed shaping and slicing rows from the coverage model.
- [x] Compare authority, mutation, output, restraint, and slicing behavior across sources.
- [x] Define the candidate contract and adversarial/clean/ambiguous evaluation matrix.
- [x] Test one ordinary Change and one Overall Delivery Change; reject delivery-profile use when one Change or one Group already owns the complete outcome.
- [x] Test the minimal Group Brief views against one simple group and one complex group; omit them when they add no navigation value.
- [x] Record rejected ceremony, lifecycle, hierarchy, and router mechanisms.

## Verify
- Automated:
  - [x] Validate model frontmatter, source references, recommendation IDs, and absence of unresolved placeholders.
- Manual:
  - [x] Trace every recommended behavior to a demonstrated RSP gap and exact evidence path.
  - [x] Confirm the two profiles share the same six-section protocol and that Overall Delivery Tasks contain no upstream work.
  - [x] Confirm optional Brief decomposition contains no duplicated live state and can be removed without changing work identity, dependency, readiness, or completion semantics.
- Durable updates:
  - [x] Keep the synthesis in research until a separate product Change selects recommendations.

## Blockers
- requires `skill-capability-research/map-capability-coverage`: needs the classified shaping paths
