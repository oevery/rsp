---
kind: "refactor"
---

# Change: refine-control-exchange-contracts

## Proposal
- Outcome: Centralize Core outcome and managed exchange contracts
- Why:
  - The current control flow is coherent, but complete response and worker-exchange field definitions are repeated across the maintainer Spec, Core, Manage, lifecycle guidance, and evaluation fixtures.
  - Separate canonical runtime references reduce drift while preserving the distinction between Core's outer control result and Manage's internal worker claim and acceptance flow.
- Scope:
  - Add one Core-owned outer control outcome reference and one Manage-owned worker exchange reference.
  - Use concise contextual field labels in the templates while retaining precise canonical domain type names.
  - Replace duplicated complete schemas in owner Skills and lifecycle guidance with links and bounded operational rules.
  - Update contract, runtime-context, clean-install, and managed-controller tests for the new references.
  - Make localized labeled natural language the default session presentation and keep JSON as an explicit machine-consumer encoding only.
- Non-goals:
  - Do not introduce persisted receipts, registries, queues, runtime stores, generated schemas, or host-specific lifecycle vocabulary.
  - Do not replace lane-specific Diagnose, Inspect, Fix, Verify, Review, or Commit result contracts with one generic result enum.
  - Do not change Manage qualification, dispatch policy, acceptance semantics, closeout authority, or release behavior.

## Spec
### MODIFIED
- Requirement: Core owns one canonical runtime template for the outer `ControlOutcome`.
  - The template uses contextual response fields and keeps route, dispatch, lane, acceptance, and closeout details nested.
- Requirement: Manage owns one canonical runtime template for Assignment and worker exchange.
  - The template separates host observations, worker-authored `WorkerReceipt`, Manager-derived `AcceptedLaneEvidence`, acceptance, and closeout.
  - Every Assignment or AssignmentDelta has one Manager-issued transient identity that its WorkerReceipt echoes for correlation.
  - A WorkerReceipt release claim and the host's release observation remain distinct validation inputs.
  - Session-visible Assignments and WorkerReceipts use localized labeled natural language by default; JSON is optional only when an explicit runtime machine consumer requires that encoding.
  - Maintainer EvaluationReceipts remain a separate evaluation-harness protocol rather than a WorkerReceipt encoding.
- Requirement: The maintainer control model remains the canonical vocabulary and ownership index without duplicating complete runtime templates.
  - Core and Manage load only their owning references; no cross-Skill runtime dependency is introduced.

### Acceptance
#### Scenario: Core returns one outer result
- GIVEN Core routes direct, specialist, shaped, stopped, or managed work
- WHEN it reports the current phase result
- THEN the result follows the Core-owned `ControlOutcome` template without exposing peer state flows

#### Scenario: Manage accepts a worker result
- GIVEN a host-admitted `WorkerInvocation` returns a structured worker claim
- WHEN Manage correlates the echoed Assignment identity and validates paths, verification, boundary, the worker's release claim, and host release observations
- THEN it derives `AcceptedLaneEvidence` without treating settlement, provenance, or the raw receipt as acceptance

#### Scenario: Installed Skills retain their contracts
- GIVEN a clean packaged installation
- WHEN Core or Manage conditionally loads the relevant reference
- THEN both new references are present and no maintainer-only Spec is required at runtime

#### Scenario: A receipt is shown in the session
- GIVEN a worker returns a valid `WorkerReceipt` to a human-visible session
- WHEN no explicit machine consumer requires another encoding
- THEN the receipt uses localized labeled natural language, preserves canonical values secondarily, and does not duplicate a JSON rendering

## Design
- Approach:
  - Add `skills/rsp/references/control-outcome.md` for the outer response envelope owned by Core.
  - Add `skills/rsp-manage/references/managed-exchange.md` for assignments, receipts, observations, accepted evidence, acceptance, and closeout projection owned by Manage.
  - Keep canonical type names such as `ControlOutcome`, `WorkerReceipt`, and `AcceptedLaneEvidence`; shorten only contextual template fields such as `artifacts`, `stop`, `next.owner`, `paths`, and `release claim`.
  - Treat the field maps as semantic requirements rather than YAML or JSON serialization mandates; use structured natural language as the default rendering.
  - Make owner Skills link to the references and keep only routing or execution procedure in their main bodies.
- Boundaries:
  - Core composes the outer `ControlOutcome`; Manage returns one bounded managed phase result rather than exposing raw worker receipts to Core.
  - Manage owns worker exchange validation; the host lifecycle reference owns only observation, cancellation, settlement, and release procedure.
  - `.rsp/specs/skill-control-model.md` owns durable vocabulary, ownership, invariants, and model relationships, not runtime form duplication.
- Affected areas:
  - `skills/rsp/`, `skills/rsp-manage/`, and their conditional references.
  - `.rsp/specs/skill-control-model.md`, package/runtime-context tests, and managed-controller contract fixtures.
- Constraints:
  - Preserve progressive disclosure and independent Skill installation boundaries.
  - Preserve exact lifecycle and acceptance distinctions and response-only transient state.
  - JSON never grants validity or acceptance and is emitted only for an explicitly identified machine consumer; do not emit natural-language and JSON copies by default.
  - Authored package sources under `skills/` remain the edit target; generated `.agents/skills/` projections are updated only through the documented build/update flow.

## Tasks
- [x] Add the Core and Manage canonical contract references with concise contextual templates.
- [x] Link owner Skills to the new references and remove duplicated complete field definitions.
- [x] Reconcile the maintainer control model and lifecycle reference around ownership rather than repeated forms.
- [x] Update package and behavioral contract tests for reference closure and semantic invariants.
- [x] Build, confirm the symlinked self-hosted projection, and run focused plus full project verification.
- [x] Make structured natural language the default session receipt and downgrade JSON to explicit machine-consumer encoding.
- [x] Refresh affected contract evidence after the presentation correction.
- [x] Add echoable Assignment correlation, distinguish worker release claims from host release observations, and exclude EvaluationReceipt from the managed runtime exchange.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run build` — passed; proves the authored package builds and the CLI bundle is complete
  - [x] `mise exec -- pnpm run lint` — passed; proves repository static checks pass
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts test/managed-controller-contract.test.ts test/clean-install-check.test.ts` — 4 files and 83 tests passed after the correlation and release-claim correction; proves both references are packaged, conditionally reachable, and enforce the final exchange contract
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts --maxWorkers=1` — 1 file and 16 tests passed after refreshing only the current product-composition hash to `daf4b9058527962b03b41ef6945f803298fc75a99af2043e2420104468f0ae4c`; retained historical evidence was unchanged
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test -- --no-file-parallelism` — 72 files and 813 tests passed after all three corrections; proves full Skill, packaging, CLI, and managed-controller compatibility
### Optional
- Manual or environment:
  - [x] Installed Skill closure covered by clean-install and runtime-context tests; no separate manual inspection required
- Coverage:
  - Required checks cover canonical reference presence, echoable Assignment correlation, worker release claim versus host release observation, EvaluationReceipt isolation, and the separation of claims, accepted evidence, acceptance, closeout, and outer control reporting. The default file-parallel full command twice exposed the existing shared-`dist/` race between clean-install rebuild and CLI-consuming tests; isolated affected tests passed and the complete no-file-parallelism run passed all 813 tests.

## Blockers
- none

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `.rsp/specs/skill-control-model.md`
- Facts to write: Core owns the packaged outer `ControlOutcome` projection; Manage owns the packaged Assignment, WorkerReceipt, AcceptedLaneEvidence, acceptance, and closeout exchange projection; every Assignment has an echoable transient identity; worker release claims remain distinct from host release observations; EvaluationReceipt belongs only to the maintainer evaluation harness; localized labeled natural language is the default session rendering and JSON is an explicit runtime machine-consumer encoding only.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none beyond the current ownership and distribution boundaries in the existing control model
- Archive ready: yes
