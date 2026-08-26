---
kind: "refactor"
---

# Change: normalize-rsp-spec-modules

## Proposal
- Outcome: Consolidate the authoritative RSP Specs into six concise modules and keep maintainer research outside product truth.
- Why:
  - The current Specs repeat domain, Skill-control, distribution, evaluation, and upstream-research concerns across several files.
  - Research evidence and upstream judgments are versioned inputs, not current product behavior.
  - A smaller stable Spec surface is needed before further model or implementation changes.
- Scope:
  - Consolidate current facts into `core`, `skill`, `design`, `cli`, `tui`, and `distribution`.
  - Keep `decisions/` unchanged.
  - Define the boundary between product Specs, maintainer research, research models, and Decision Records.
  - Define optional single-Change worker delegation, same-worker ordinary verification, and independent-acceptance boundaries in the `skill` module.
  - Remove duplicated transient control, evaluation, historical, and research narrative from formal Specs.
- Non-goals:
  - Do not implement product runtime behavior or change the release process. Fallback rules and authored Skill wording may change only as bounded projections of the consolidated `skill` Spec and WorkOwner-aware routing semantics; no new lifecycle or persistent worker state is introduced.
  - Do not rewrite or reclassify existing upstream reports, research models, evaluations, or Decision Records.
  - Do not add a seventh research Spec.

## Spec
### MODIFIED
- Requirement: The formal Spec set has six authoritative modules
  - `core` owns WorkRef, Change, Group, FocusSet, lifecycle, dependencies, verification, archive, and durable-writeback boundaries.
  - `skill` owns Skill capability ownership, composition, routing, delegation, and authority boundaries in one `skill.md` file.
  - `design` owns system layering, artifact ownership, dependency direction, and Host/Git/RSP boundaries.
  - `cli` owns deterministic command, filesystem, inspection, JSON, history, and repair contracts.
  - `tui` owns interactive scopes, presentation, localization, history views, and terminal lifecycle.
  - `distribution` owns package, Skill installation, release, provenance, and the product/research boundary.

- Requirement: Formal Specs state stable current facts
  - Each statement expresses one durable behavior, ownership rule, boundary, or invariant.
  - Planned changes, implementation history, evaluation results, upstream comparisons, and temporary control vocabulary remain outside formal Specs.

- Requirement: Maintainer research remains separate from product truth
  - Source reports remain immutable evidence under `research/upstreams/`.
  - Cross-source judgments remain research models under `research/models/`.
  - Research recommendations enter product artifacts only through a selected RSP Change.
  - Adopted current behavior enters the smallest relevant Spec; lasting rationale enters one Decision Record.

- Requirement: Single-Change delegation remains an execution strategy, not a lifecycle object
  - A ready single Change may use one delegated worker for implementation and ordinary verification when context isolation, compatible continuation, or multiple execution phases is a real coordination obligation.
  - One-worker delegation is one optional strategy; it does not restrict the Change from using `parallel-wave` with multiple workers for independent tasks.
  - Manage validates the worker result and derives acceptance; the worker does not own acceptance, archive, commit, publication, or external action.
  - Same-worker implementation and ordinary verification may establish `evidence-complete`.
  - Independent Verify requires a different worker when the acceptance declares that requirement.
  - When no coordination obligation exists, Core may keep the Change on the direct route.

### Acceptance
#### Scenario: Six modules provide complete formal Spec coverage
- GIVEN the formal Spec tree is inspected
- WHEN the current modules are classified by ownership
- THEN every product-facing stable fact belongs to exactly one of `core`, `skill`, `design`, `cli`, `tui`, or `distribution`
- AND `decisions/` remains a separate rationale namespace
- AND no research report or evaluation artifact is required as a formal Spec authority.

#### Scenario: Research does not become a second product authority
- GIVEN an upstream report or cross-source model contains a recommendation
- WHEN the recommendation has not been adopted through a selected Change
- THEN it remains research input
- AND it does not define current RSP behavior or grant implementation authority.

#### Scenario: Spec content is concise and non-duplicative
- GIVEN the six modules are reviewed
- WHEN a fact has one clear owner
- THEN the fact appears once in that owner
- AND historical explanation, process narration, and temporary runtime detail are removed from the formal Spec surface.

#### Scenario: Single-Change worker delegation remains optional
- GIVEN one ready Change has a real context-isolation, continuation, or multi-phase coordination obligation
- WHEN Manage selects worker delegation
- THEN one worker may perform implementation and ordinary verification for that Change
- AND Manage/Core retains acceptance and closeout authority
- AND an acceptance requiring independent Verify uses a different worker
- AND a Change without that obligation may remain direct.

#### Scenario: One Change may use multiple workers
- GIVEN one Change contains independent tasks with disjoint mutation and verification resources
- WHEN Manage selects `parallel-wave`
- THEN multiple workers may execute those tasks concurrently
- AND the Change remains one durable WorkRef
- AND Manage coordinates integration and acceptance.

## Design
- Approach:
  - Treat the existing Specs as source material and rewrite them into six ownership-based modules.
  - Preserve settled current facts and safety boundaries while removing superseded 3.3 protocol composition, research history, and implementation detail.
  - Keep the research workflow in existing maintainer research artifacts rather than creating a formal research Spec.
- Boundaries:
  - Formal Specs describe current product truth.
  - Research reports and models describe evidence and recommendations.
  - Decision Records describe lasting rationale.
  - Changes describe planned deltas until implementation and durable review complete.
- Affected areas:
  - `.rsp/specs/` current modules and their internal cross-references.
  - Authored Core/Manage Skills and their conditional delegation references receive only the routing and delegation wording required to project the consolidated `skill` module.
  - Public EN/zh-CN Skill guides receive the same bounded-result, Host-observation, and optional single-worker/parallel-wave wording.
  - Contract tests and the managed-controller fixture receive Spec-path, retained-vocabulary, and worker-boundary assertions.
  - No product runtime, new lifecycle object, fallback-rule redesign, release-process change, or research-record rewrite.
- Constraints:
  - Preserve Decision Record ownership and migrate current consumers from the two old Skill Spec paths to `.rsp/specs/skill.md`.
  - Preserve the distinction between current facts, planned work, rationale, evidence, and transient execution state.
  - Keep `ControlOutcome` response-only and Core-owned; do not make it a durable domain object or a universal worker protocol.
  - Keep the result short, positive, and directly normative; retain negative constraints only where they prevent authority or ownership leakage.

## Tasks
- [x] Inventory the current seven formal Spec files and classify every stable statement by one authoritative owner.
- [x] Rewrite the six module contents with concise current-fact statements and remove duplication.
- [x] Move research-process and upstream-judgment wording to the existing maintainer research boundary without changing research records.
- [x] Remove or relocate transient ControlOutcome, runtime, evaluator, and historical material from formal Specs.
- [x] Validate that every retained statement has one owner and that `decisions/` remains untouched.
- [x] Review the result for stale 3.3 narrowing, session leakage, worker topology leakage, and accidental authority expansion.
- [x] Merge the two physical Skill Spec files into `.rsp/specs/skill.md` and update current consumers.
- [x] Restore the necessary precise CLI contract facts without reintroducing implementation history or evaluator detail.
- [x] Reconcile the response-only `ControlOutcome` boundary with the final Skill Spec wording.
- [x] Define Manage-owned sequential, parallel-wave, read-only fan-out, and independent-verification strategies for Groups and single-Change worker tasks.
- [x] Define deterministic `rsp show --focused` behavior for zero, one, and multiple Focus markers.
- [x] Define the exact staged delivery boundary for local commits integrating multiple WorkRefs.
- [x] Reduce `ControlOutcome` to a non-durable response projection and keep research ownership in Distribution.
- [x] Keep single-Change worker delegation optional and separate same-worker evidence from independent acceptance.
- [x] Record the durable review decision: `.rsp/specs/skill.md` is the smallest current-fact owner; `.rsp/specs/design.md` needs no update and no Decision Record is required.
- [x] Update the public EN/zh-CN Skill guides to remove superseded WorkerSession/Receipt protocol wording.
- [x] State that Change and Group do not impose execution order.
- [x] Compress formal Skill control wording while retaining phase-local safety semantics.
- [x] Define WorkOwner as the selected Change-or-Group owner and keep Group references distinct from Change WorkRefs.
- [x] Keep the formal control response as an optional Core-owned summary of the current WorkOwner and phase.
- [x] Align authored Core, Manage, Shape, Verify, fallback, and public Skill guidance with WorkOwner/WorkRef boundaries.
- [x] Keep ControlOutcome Core-owned and response-only without making it a universal receipt or inter-Skill protocol.
- [x] Synchronize the remaining Discipline, Review, and Commit Skill boundaries with WorkOwner, WorkRef, Group reference, and named integration-boundary semantics.
- [x] Synchronize Core verification evidence guidance and the fallback rules with the WorkOwner-aware Verify boundary.
- [x] Resolve fixed review findings for Group integration-boundary ownership, fallback scope, and response-summary terminology.
- [x] Compress the public EN/zh-CN Skill guides to user-facing capability and boundary statements.
- [x] Replace changed public-guide and response-contract checks with semantic-unit assertions instead of full-sentence coupling.

## Verify
### Required
- Automated:
  - [x] `node dist/cli.mjs check --focused --json` — proves: the new Change and focus state are structurally valid; 0 errors and 0 warnings.
  - [x] `node dist/cli.mjs specs --json` — proves: the current Spec tree exposes six Spec documents and unchanged Decision Records without diagnostics.
  - [x] `mise exec -- pnpm exec vitest run test/architecture/documentation-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/skills/skill-runtime-context-contract.test.ts test/evaluation/managed-controller-contract.test.ts test/skills/skill-contract.test.ts test/core/focus-capsule-public-contract.test.ts test/specs/query.test.ts` — proves: consolidated documentation, concise public-guide semantics, semantic response-projection assertions, concurrency, multi-focus CLI, integration-boundary, Skill, runtime-boundary, evaluator-boundary, Focus Capsule, and Specs query contracts; 7 files and 66 tests passed.
- [x] `mise exec -- pnpm run build` — passed.
- [x] `mise exec -- pnpm exec vitest run` — 92 files and 891 tests passed.
- [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run skills:security-check` — 41 files, 0 findings, 0 suppressed.
  - [x] Authored Skill context scan — 16 canonical packages; no unreachable Markdown resources and one diagnostic repetition group.
  - [x] `node dist/cli.mjs update` — synchronized the authored fallback rules into `.rsp/rsp-rules.md`.
  - [x] `git diff --check` — proves: edited Spec files contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Read all six modules once for ownership, duplication, historical residue, and research-boundary leakage.
- Coverage:
  - Product runtime behavior, host-worker execution, upstream freshness, and full implementation compatibility are not verified by this Spec-led Change.
  - Fixed-scope review rechecked the six modules for the accepted concurrency, multi-focus, integration-boundary, response-projection, and research-ownership findings.
  - Durable review: current facts are owned by `.rsp/specs/skill.md`; no `.rsp/specs/design.md` update and no Decision Record are needed.

## Blockers
- none
