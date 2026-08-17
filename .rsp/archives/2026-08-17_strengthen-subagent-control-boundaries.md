---
kind: "refactor"
---

# Change: strengthen-subagent-control-boundaries

## Proposal
- Outcome: Strengthen managed worker control boundaries so dispatch admission, cancellation ownership, runtime settlement, Receipt acceptance, message provenance, nested delegation, and compatible worker reuse have one unambiguous contract.
- Why:
  - The unified control model already avoids duplicate status flows, but it does not explicitly define the host-observed Assignment admission boundary after which caller cancellation can no longer retract accepted work.
  - Runtime settlement and partial worker output must not be mistaken for a schema-valid Receipt or successful lane result.
  - WorkerSession identity and message provenance should support continuity and attribution without widening Assignment authority.
  - A worker-created helper or reviewer must not duplicate Manager-owned orchestration or acceptance obligations, while small same-shape edits should not require one worker per file.
- Scope:
  - Refine `rsp-manage` and the maintainer Skill Control Model with the admission, settlement, provenance, nested-delegation, and same-WorkRef batching boundaries above.
  - Add deterministic managed-controller fixtures and structural assertions for pre-admission cancellation, post-admission cancellation, settlement without Receipt, outstanding owned background work, partial or empty terminal output, nested-delegation authority, and compatible same-shape batching.
  - Retain the DeepSeek Harness and Superpowers supplemental distillations plus their cross-source model as research provenance.
- Non-goals:
  - Add a durable worker registry, runtime inbox, settlement mailbox, retry ledger, or new outer status.
  - Require hosts to expose worker ids, cancellation, settlement, or process APIs they do not have.
  - Persist WorkerSessions, Assignments, Receipts, leases, provenance, or runtime ancestry in Focus Capsules or other RSP artifacts.
  - Import Superpowers ledgers, brief/report/review-package workspaces, worker commits, provider-specific model routing, or automatic material rulings.

## Spec
### MODIFIED
- Requirement: Managed dispatch has one host-observed admission boundary.
  - Failed creation, resume, delivery, or cancellation before confirmed Assignment admission creates no accepted dispatch or inherited Assignment boundary.
  - After confirmed admission, caller abandonment does not retract work; an explicit supported interrupt or cancellation contract must be used, and ResourceLeases remain claimed until acknowledged cancellation or observed settlement.
- Requirement: Runtime settlement and Receipt acceptance remain separate evidence.
  - Settlement may close liveness and resource accounting but cannot manufacture a lane result, Receipt, successful verification, or acceptance.
  - Partial or empty terminal output is recovery evidence only; a missing schema-valid required Receipt keeps `AcceptanceDisposition: incomplete`.
- Requirement: Provenance is non-authoritative.
  - WorkerSession identity, sender identity, message source, and continuity evidence may support attribution or eligible AssignmentDelta reuse only.
  - Effective authority comes only from the current complete Assignment or eligible AssignmentDelta envelope.
- Requirement: WorkerSessions are leaf-scoped by default.
  - Nested delegation requires explicit Assignment authority that bounds descendant role, authority, resources, stop conditions, and evidence.
  - The parent owns descendant work, background processes, leases, evidence integration, and one Receipt to Manager; descendants cannot self-create Manager-owned independent Verify or fixed-scope Review acceptance.
- Requirement: Compatible same-shape edits may share one Assignment.
  - Batching is allowed only inside one WorkRef, role, seam, writer boundary, authority envelope, replay-safety class, verification and review surface, and compatible ResourceLease set.
  - Distinct WorkRefs retain distinct Assignments and Receipts. Manager may reuse one compatible primary WorkerSession longitudinally across Group children without merging their ownership or acceptance boundaries.
  - Incompatible edits remain separate ordered or independent slices; token or context cost cannot weaken these boundaries.
- Requirement: The existing outer execution model remains unchanged.
  - `ControlOutcome` remains the only user-visible receipt with `mode: solo | delegated | coordinated` and `status: running | waiting | completed`.
  - No runtime object or new peer status is persisted.

### Acceptance
#### Scenario: Cancellation before admission
- GIVEN worker creation, resume, or Assignment delivery is not host-confirmed
- WHEN caller cancellation or delivery failure wins before admission
- THEN no accepted dispatch, continuity claim, inherited Assignment boundary, or lease release claim is created

#### Scenario: Cancellation after admission
- GIVEN the host confirms Assignment admission
- WHEN the caller later abandons or cancels its own wait
- THEN accepted work continues until an explicit supported interrupt/cancel operation and acknowledgement or settlement, with affected ResourceLeases retained

#### Scenario: Settlement without Receipt
- GIVEN a worker stops, disappears, is cancelled, or produces only partial output
- WHEN no schema-valid required Receipt is returned
- THEN settlement may update liveness and recovery evidence but acceptance remains `incomplete` and no lane success is synthesized

#### Scenario: Owned background work remains live
- GIVEN the worker or its owned background processes have not acknowledged stop or settled
- WHEN the controller observes elapsed time, a terminal message, or partial output
- THEN the lane remains incomplete and conflicting ResourceLeases are not released

#### Scenario: Provenance cannot widen authority
- GIVEN a same-session message or observed WorkerSession identity
- WHEN its current Assignment envelope does not authorize an action
- THEN provenance cannot authorize the action or reconstruct omitted authority across an invalidated boundary

#### Scenario: Nested delegation is not implied
- GIVEN a worker has an Assignment without nested-delegation authority
- WHEN it attempts to dispatch a helper, reviewer, or verifier
- THEN the descendant action is unauthorized, cannot satisfy Manager-owned acceptance, and creates no inferred authority or durable registry

#### Scenario: Compatible same-shape batching
- GIVEN several small edits inside one WorkRef share the same role, seam, writer boundary, authority, replay safety, verification and review surface, and ResourceLeases
- WHEN Manager derives the smallest safe slice
- THEN it may batch them into one Assignment and one Receipt, but any incompatible boundary keeps the edits separate

#### Scenario: Group child identity survives WorkerSession reuse
- GIVEN two compatible Group child WorkRefs can reuse one primary WorkerSession
- WHEN Manager dispatches them longitudinally
- THEN each child receives its own Assignment and Receipt and their ownership and acceptance boundaries are not merged

## Design
- Approach:
  - Add concise normative sentences to the existing dispatch, Receipt acceptance, acceptance, and interruption/recovery owners rather than introducing new entities.
  - Add deterministic fixtures covering the original five runtime boundaries plus leaf-worker authority and same-shape batching.
- Boundaries:
  - `rsp-manage` remains the runtime contract owner; `.rsp/specs/skill-control-model.md` remains maintainer-facing durable truth.
  - Existing host-native messages and cancellation APIs remain implementation details; unavailable capabilities downgrade or fail truthfully.
  - The research report is provenance, not runtime authority.
- Research adoption:
  - DeepSeek Harness supplement `research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a-subagent-model.md`: adopt R1 and R3 as `model-only`; adopt R2 and R4 as `independent-reimplementation`; retain R5 as `reject`.
  - Superpowers supplement `research/upstreams/superpowers/b36e0829c6d0140e93cfef2ca599b1b07d4a7797-subagent-model.md`: adopt R1 and R2 as `independent-reimplementation`; use R3 and R4 as `model-only` support for existing reuse and bounded-context rules; retain R5 as `reject`.
  - Cross-source synthesis `research/models/subagent-orchestration.md`: select C1 and C2 for this delta, retain C3 and C4 as confirmation of existing RSP behavior.
- Affected areas:
  - `skills/rsp-manage/SKILL.md`
  - `skills/rsp-manage/references/interruption-recovery.md`
  - `.rsp/specs/skill-control-model.md`
  - `test/managed-controller-contract.test.ts`
  - `test/managed-controller/fixtures/`
  - `research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a-subagent-model.md`
  - `research/upstreams/superpowers/b36e0829c6d0140e93cfef2ca599b1b07d4a7797-subagent-model.md`
  - `research/models/subagent-orchestration.md`
- Constraints:
  - Preserve the current outer status and mode vocabulary.
  - Do not add durable runtime state, host-specific identifiers, or a second delivery protocol.
  - Keep all fixture expectations host-neutral and observable at the RSP contract boundary.

## Tasks
- [x] Add admission, post-admission cancellation, settlement, Receipt, and provenance invariants to the owning Skill and maintainer Spec.
- [x] Add five deterministic boundary fixtures and focused structural assertions.
- [x] Distill Superpowers subagent orchestration and synthesize the DeepSeek/Superpowers cross-source model.
- [x] Add leaf-worker and compatible same-shape batching invariants plus two deterministic fixtures.
- [x] Restrict same-shape batching to one WorkRef while preserving longitudinal WorkerSession reuse across compatible Group children.
- [x] Resolve the fixed review findings by aligning the cross-source model with the adopted WorkRef boundary and correcting the Change scope summary.
- [x] Rerun focused managed-controller tests and the repository build, lint, and test gates after the expanded implementation.
- [x] Refresh final decisive evidence and the durable writeback decision.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts` — passed after the WorkRef batching correction: 2 files and 80 tests; proves all 29 managed-controller contract fixtures, focused semantic assertions, and product composition lock `8f7923cf2cd1744c84f5a0149b55a5c5bb421bb9e4931cf2a5021e273a738dd4` pass.
  - [x] `mise exec -- pnpm run build` — passed: `tsup` completed successfully; proves authored package sources compile and generated projections remain buildable.
  - [x] `mise exec -- pnpm run lint` — passed with no findings; proves changed authored, research, and test sources satisfy repository static checks.
  - [x] `mise exec -- pnpm run test` — passed: 72 files and 808 tests; proves the complete repository suite has no regression.
  - [x] `git diff --check && node dist/cli.mjs check --focused && node dist/cli.mjs ready strengthen-subagent-control-boundaries --json` — passed for the document-only review corrections; the pre-write readiness result reported only this deliberately incomplete Verify item, with no blocker or structural diagnostic.
### Optional
- Manual or environment:
  - [-] Provider-backed managed holdout — omitted because deterministic contracts and the complete repository suite settle the selected host-neutral boundary; provider generality and performance remain outside this Change.
- Coverage:
  - Deterministic coverage owns the contract boundary; provider/runtime implementations remain out of scope.

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `.rsp/specs/skill-control-model.md`, `skills/rsp-manage/SKILL.md`, and `skills/rsp-manage/references/interruption-recovery.md`
- Facts to write: Assignment admission transfers cancellation ownership; runtime settlement cannot substitute for a schema-valid Receipt; provenance supports attribution and continuity but grants no authority; owned background work retains conflicting ResourceLeases until acknowledgement or settlement; WorkerSessions are leaf-scoped unless explicitly authorized; compatible same-shape edits within one WorkRef may share one Assignment, while distinct WorkRefs retain distinct Assignments and Receipts across longitudinal WorkerSession reuse.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none beyond the scoped control-model and Skill contracts; source comparison remains in the DeepSeek Harness and Superpowers supplements plus the cross-source model.
- Archive ready: yes

## Blockers
- none
