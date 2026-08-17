---
kind: "refactor"
---

# Change: refine-managed-control-host-protocol

## Proposal
- Outcome: Refine RSP managed execution so control transfer, work delegation, worker invocation lifecycle, host observations, and accepted evidence compose without forcing unsafe delegation or importing host runtime state into `.rsp/`.
- Why:
  - Current Manage selection and worker obligation are coupled strongly enough that a host which reserves subagents for independent work can be forced to delegate the immediate critical path or stop despite executable local implementation.
  - `WorkerSession` currently carries both reusable context identity and per-Assignment admission, cancellation, settlement, and Receipt concerns; upstream evidence indicates those lifecycles should remain distinct.
  - Managed-controller evaluation records several dispatch measurements from an agent-authored evaluation receipt rather than independent host observations.
- Scope:
  - Add pinned upstream research for control transfer versus delegation, session versus invocation, host adapter stability, and observer-authored execution evidence; synthesize one cross-source model.
  - Refine the maintainer Skill Control Model and published Core/Manage contracts with the smallest coherent vocabulary and ownership boundaries.
  - Update managed-controller fixtures and evaluation observability so host-observed and agent-reported evidence remain distinguishable.
- Non-goals:
  - Add a persisted controller, WorkerSession registry, invocation ledger, event history, queue, mailbox, or host-specific state under `.rsp/`.
  - Copy an upstream agent framework, workflow engine, sandbox runtime, prompt suite, or provider-specific API into RSP.
  - Weaken required independent verification, review, lifecycle, Git, publication, deployment, approval, or human-acceptance boundaries.

## Spec
### MODIFIED
- Requirement: Control transfer and work delegation are separate relationships.
  - Core transfers phase control to Manage or one Discipline; Manage retains selected-goal control while delegating bounded Assignments to workers. A worker never becomes `NextOwner` of the managed goal merely by receiving work.
- Requirement: Manage derives worker need independently from Manage qualification.
  - `DispatchDisposition` is a transient nested decision with `none`, `preferred`, or `required`; it is not a peer status flow or persisted state.
  - `none` permits Manage to invoke the bounded local Discipline for a coupled critical-path implementation while retaining orchestration and acceptance ownership.
  - `required` applies only when explicit delegation, independent identity, isolated resources, or another declared acceptance obligation requires a worker; its failure keeps acceptance incomplete.
- Requirement: Reusable worker context and one execution call have distinct identities.
  - `WorkerSession` owns compatible context continuity; `WorkerInvocation` owns exactly one admitted Assignment or AssignmentDelta through settlement and resource release.
  - One stateful WorkerSession has at most one context-mutating active WorkerInvocation; parallel work requires separately evidenced execution contexts.
- Requirement: Host lifecycle facts remain an adapter projection.
  - Creation, admission, activity, cancellation acknowledgement, settlement, and release are distinct observations supplied by the host and grant no product authority.
  - A settled invocation without an accepted structured worker receipt remains incomplete; a completed session that is no longer an explicit longitudinal successor is released through the host when supported.
- Requirement: Worker claims and accepted evidence remain distinct.
  - `WorkerReceipt` is a schema-valid worker-authored claim. `AcceptedLaneEvidence` is derived only after Manager inspection of Assignment identity, actual paths and diff, verification, boundary validity, host observations, and resource release.
  - Worker identity, structured syntax, settlement, or provenance cannot elevate trust or establish acceptance by themselves.
- Requirement: Managed evaluation distinguishes producer claims from observer facts.
  - Dispatch, delivery, wait, interruption, settlement, and release measurements are harness-observed when the host event surface exposes them; unavailable facts remain null rather than copied from agent self-report.
  - Agent-reported routing and semantic observations remain labeled as claims and cannot independently prove worker lifecycle behavior.

### Acceptance
#### Scenario: Managed critical-path solo execution
- GIVEN a Change qualifies for Manage through lifecycle or acceptance coordination but has one coupled immediate implementation path and no required worker obligation
- WHEN the host policy keeps immediate blocking work local
- THEN Manage derives `DispatchDisposition: none`, invokes the bounded local implementation Discipline, and preserves all verification and closeout gates without synthetic delegation

#### Scenario: Required independent execution
- GIVEN declared acceptance requires a different observed worker identity or isolated resource
- WHEN the host cannot create and admit a qualifying worker invocation
- THEN Manage returns `capability-unavailable`, keeps acceptance incomplete, and does not replace the worker with controller self-certification

#### Scenario: Session and invocation lifecycles remain distinct
- GIVEN one compatible WorkerSession is reused longitudinally
- WHEN it receives successive Assignments or AssignmentDeltas
- THEN each call has its own admission, cancellation, settlement, WorkerReceipt, accepted evidence, and release outcome without overlapping context-mutating invocations

#### Scenario: Host settlement without accepted evidence
- GIVEN the host observes a worker invocation settle
- WHEN no schema-valid WorkerReceipt exists or Manager validation fails
- THEN liveness may close but the lane remains incomplete and no successful accepted evidence is manufactured

#### Scenario: Observer-authored evaluation
- GIVEN a managed-controller holdout reports worker dispatches in its evaluation receipt
- WHEN the host event stream exposes a different count or exposes no count
- THEN the evaluator uses the host observation or records an omission and never labels the agent-reported value as independently observed

## Design
- Approach:
  - Distill OpenAI Agents SDK, LangGraph, Anthropic managed-agent boundaries, and Temporal-style observer evidence only to the extent they address the evidenced RSP gaps; retain DeepSeek Harness and Superpowers as existing source reports.
  - Keep one managed control domain with orthogonal routing, dispatch, host-protocol, and evidence projections rather than one cross-product state machine.
  - Add new vocabulary only where it separates currently conflated identities or ownership; keep all execution objects transient.
- Boundaries:
  - Core owns phase control transfer and initial Manage selection.
  - Manage owns DispatchDisposition, ExecutionTopology, WorkerSession and WorkerInvocation composition, WorkerReceipt validation, AcceptedLaneEvidence, acceptance, and closeout orchestration.
  - The host owns worker API semantics and supplies observations through a thin capability projection; RSP neither selects nor persists the execution environment.
  - Disciplines retain their exact execution and verification result contracts.
- Affected areas:
  - `upstreams.yaml`, `upstreams.lock`, `research/upstreams/`, and `research/models/`
  - `.rsp/specs/skill-control-model.md` and `.rsp/specs/skill-system.md`
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, and `skills/rsp-manage/`
  - `scripts/managed-controller-eval.mjs`, declarations, fixtures, and managed-controller tests
- Constraints:
  - Preserve the single outer `ControlOutcome`, current durable Change lifecycle, and host-neutral published Skills.
  - Do not make host-specific names, statuses, handles, timeouts, model tiers, or polling intervals canonical RSP vocabulary.
  - Do not count token or latency cost as authority, safety, acceptance, or completion evidence.

## Tasks
- [x] Add and pin the smallest relevant upstream sources, complete traceable source distillations, and synthesize `research/models/managed-control-and-host-protocol.md`.
- [x] Refine the maintainer control model and published Core/Manage contracts with control-transfer, DispatchDisposition, WorkerInvocation, WorkerReceipt, AcceptedLaneEvidence, and host-release boundaries.
- [x] Update managed-controller deterministic fixtures and evaluator observability to distinguish host-observed lifecycle evidence from agent-reported semantic claims.
- [x] Run focused tests, build, lint, and the complete repository suite; perform a fixed-scope review and resolve accepted findings.
- [x] Refresh decisive evidence and the durable writeback decision.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts test/skill-evaluation-observability.test.ts` — proves: routing, managed execution, evaluator, and retained beta contracts agree on the refined model.
  - [x] `mise exec -- pnpm run build` — proves: authored package sources and declarations compile.
  - [x] `mise exec -- pnpm run lint` — proves: changed source, research, and tests satisfy repository static checks.
  - [x] `mise exec -- pnpm run test` — proves: the complete repository suite has no regression.
  - [x] `git diff --check && node dist/cli.mjs check --focused && node dist/cli.mjs ready refine-managed-control-host-protocol --json` — proves: repository formatting and the focused Change contract remain valid.
### Optional
- Manual or environment:
  - [ ] Provider-backed host lifecycle holdout — omitted: deterministic host-event fixtures cover the available adapter surface, but no separately authorized provider-backed run was performed.
- Coverage:
  - Deterministic fixtures own portable semantics; one host-backed run may add confidence but cannot establish cross-host generality.
  - Focused verification passed 94 tests before review and 90 evaluator/managed tests after the accepted review correction. Final full verification passed 72 files and 813 tests; a prior concurrent run exposed a transient shared-`dist/` cleanup race, after which the affected test passed alone, the complete suite passed with `--no-file-parallelism`, and the exact `pnpm run test` command passed on a fresh rebuild.
  - Fixed-scope re-review: Code `clean`; Document `clean`. Accepted findings corrected false-positive host lifecycle observations and over-broad OpenAI upstream path coverage.
  - All four new upstream reports are `complete` with matched path coverage. Their candidate revisions remain pending research acceptance; `upstreams.lock` was intentionally not changed.

## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: `.rsp/specs/skill-control-model.md`, `.rsp/specs/skill-system.md`, `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, and `skills/rsp-manage/`
- Facts to write: Control transfer is distinct from delegation; Manage derives transient DispatchDisposition independently from qualification; WorkerSession, WorkerInvocation, WorkerReceipt, AcceptedLaneEvidence, host settlement, and release remain separate transient boundaries; evaluator host facts remain separate from agent claims.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: No additional lasting rationale; the completed upstream reports and cross-source model retain research provenance while the Specs own current product truth.
- Archive ready: yes

## Blockers
- none
