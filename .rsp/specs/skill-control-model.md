# Skill Control Model

## Purpose
- Define the canonical transient vocabulary used to explain how Core, Shape, Disciplines, and Manage route work, stop safely, resume, accept evidence, and derive closeout eligibility.
- Keep control decisions observable without adding a persisted controller, workflow state machine, ticket map, run registry, or runtime glossary dependency.

## Distribution Boundary
- This Spec is maintainer-facing durable truth for the RSP repository. It is not included in the published package and is never a runtime dependency of an installed Skill.
- Installed Skills must not read, link to, or require this `.rsp/` path. Exact-name Skill installation creates no implicit dependency on another installed Skill or repository-only artifact.
- Runtime contracts remain locally owned by their published Skills:

| Contract | Runtime owner |
| --- | --- |
| `ControlOutcome`, `ControlTransfer`, `RouteDisposition`, `StopDisposition`, and Continuation | `rsp` |
| `ExecutionFrame`, `DispatchDisposition`, `WorkerSession`, `WorkerInvocation`, `Assignment`, `WorkerReceipt`, `AcceptedLaneEvidence`, `ResourceLease`, frontier, acceptance, and closeout | `rsp-manage` |
| Verification result and evidence fields | `rsp-verify` |
| Discipline-specific result and stop conditions | The owning Discipline Skill |

- Non-owner Skills may name an invoking contract and append their own bounded fields, but must not redefine the complete common contract.

## Control Outcome
- A `ControlOutcome` is the single outer response receipt for one current WorkRef and phase. Core owns its packaged runtime projection in `skills/rsp/references/control-outcome.md`; the durable model owns its identity, mode and status vocabulary, nesting rules, and invariants rather than duplicating the complete response form.
- Its mode vocabulary is exactly `mode: solo | delegated | coordinated`, and its status vocabulary is exactly `status: running | waiting | completed`.
- A `ControlOutcome` is never durable product or workflow state. It is not stored in a Change, Group Brief, Spec, Decision Record, archive, registry, generated projection, or hidden host ledger.
- Outer status transitions are only `running -> waiting | completed` and `waiting -> running | completed`. Failure, cancellation, reroute, verification blocking, and capability loss are represented by the phase-specific outcome or stop reason, not additional peer status values.
- Route, topology, lane result, `AcceptanceDisposition`, and `CloseoutEligibility` remain nested phase-specific details or gates. They never form peer user-visible status flows beside the outer `ControlOutcome`.
- `solo` means no worker, including a selected Manage run whose immediate bounded work stays with a local Discipline; `delegated` means one compatible primary `WorkerSession`; and `coordinated` means multiple workers or an independence-seeking worker obligation. Manage's seven topologies remain internal strategies and do not replace the outer mode.
- `WorkOwner` means the selected Change or shallow Group that durably owns the requested outcome. `DecisionOwner` means the human or authority source required to settle one material decision. `NextOwner` means the next control or execution capability named by the transient outcome.
- Shape returns a phase Shape `ControlOutcome` with the ready `WorkOwner`, decisive readiness evidence, `NextOwner: Core`, and a next action for Core to freshly derive the route only when its Ready gate passes. A material decision instead nests `StopDisposition: ask-owner`, the `DecisionOwner`, the required answer, and a next action to rerun Shape from fresh evidence after the answer. Any other non-ready blocker nests its applicable canonical `StopDisposition`, `NextOwner`, required input, and recovery guidance.

## Route Disposition
- `ControlTransfer` is the transient phase-control relationship by which Core invokes Manage or one Discipline and receives its bounded result. It changes `NextOwner` for the current phase without granting product, lifecycle, Git, publication, or acceptance authority beyond the selected route. Manage-to-worker communication is delegation, not `ControlTransfer`: Manage remains the selected-goal controller and a worker never becomes `NextOwner` merely by receiving an Assignment.
- Core owns `RouteDisposition`, whose values are exactly:
  - `specialist`: return one explicit bounded Discipline result path. The named Discipline owns that one action and returns its result without becoming a completion controller.
  - `direct`: orchestrate one bounded non-managed completion or continuation with one decisive verification and no Manage handoff or managed `Assignment`. It may name exactly one Discipline executor. Core may directly mutate only RSP control-plane state; product mutation belongs to Implement or the same bounded manual Discipline action.
  - `managed`: hand one selected shape-ready owner and bounded goal to Manage after qualification. This is the only route that composes worker lanes and review convergence.
  - `shape`: return unclear but owned work to Shape.
  - `stop`: perform no further action and name the applicable `StopDisposition`.
- Direct execution requires one ready owner, one writer, one execution phase, one integrated decisive check, no recovery, no independent acceptance obligation, no managed lifecycle coordination, and no ready successor. Multiple files, Specs, product presentation, public documentation, or verification files do not by themselves make the route managed.
- If any direct-execution condition ceases to hold, Core freshly rederives the route. Direct execution does not silently expand into managed execution.

## Work Ownership and Frontier Dispositions
- Core resolves one unambiguous shape-ready `WorkOwner` before Manage qualification. Missing or non-ready ownership uses `RouteDisposition: shape` only when independently granted planning-artifact authority permits Shape; a material product or authority decision uses `StopDisposition: ask-owner`, and an invalid WorkRef, topology, route, dirty-path, scope, or authority boundary uses `StopDisposition: reroute`.
- Shape returns only a ready `WorkOwner` to Core. It does not encode Shape routing or stop reasons in a second ownership-status enum.
- Only a ready `WorkOwner` may enter Manage qualification. Manage never creates, focuses, or resolves a pre-owner boundary.
- `FrontierDisposition` applies only after Core has handed Manage a ready, qualified owner. Its values remain exactly:
  - `owner-decision`
  - `fog`
  - `evidence-needed`
  - `executable`
  - `out-of-goal`
- Frontier precedence is fail-closed: `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `executable`.
- `owner-decision` stops with `ask-owner`; `fog` stops with `return-to-shape`; frontier `out-of-goal` stops with `reroute`. Each is a true boundary return to Core. Evidence collection may continue only when it is authorized, bounded, and capable of advancing the current acceptance path.

## Stop and Resume
- `StopDisposition` values are exactly:
  - `ask-owner`
  - `return-to-shape`
  - `reroute`
  - `retry-with-evidence`
  - `environment-blocked`
  - `verification-blocked`
  - `capability-unavailable`
- Every stop names the `NextOwner`, required input, and resume rule:

| Stop disposition | Required next action | Resume rule |
| --- | --- | --- |
| `ask-owner` | Ask one highest-impact owner decision with the evidenced tradeoff. | Core freshly derives ownership and routing, or reruns the owning Discipline, after the answer. |
| `return-to-shape` | Shape uses ordinary clarification or explicit deep clarification without implementation. | Resume only after Shape confirms a ready owner, then freshly rederive routing and qualification. |
| `reroute` | Core establishes a valid owner, WorkRef, topology, dirty-path boundary, or authority. | Start again at Core route derivation; do not resume the prior frontier. |
| `retry-with-evidence` | Supply new evidence that directly addresses the failed or unresolved result. | Retry only while the owning Discipline's bound or the current managed Assignment's convergence rule permits it. |
| `environment-blocked` | Restore the required local or external environment. | Reread authority, state, diff, blockers, and evidence before continuing. |
| `verification-blocked` | Resolve the named verification gate or obtain the required acceptance input. | Rerun the decisive verification and rederive acceptance. |
| `capability-unavailable` | Restore the required capability or select an explicitly valid fallback. | Freshly rederive the route or frontier; absence is never accepted as success. |

- No stop disposition permits worker dispatch, product mutation, lifecycle closeout, staging, commit, push, publication, deployment, approval, or human-acceptance claims before its resume rule succeeds.

## Execution Evidence
- Specialist Disciplines and managed lanes retain their own exact result schemas. The control model does not replace Diagnose, Inspect, Fix, Verify, Review, or Resolve Findings results with a generic execution enum.
- Discipline receipt dimensions are orthogonal: Diagnose and Inspect use `result: confirmed | unresolved`; Fix uses `result: changed | no-change`; Verify uses `result: pass | fail | unavailable` plus `evidence_delta: new | none`; every lane independently uses `boundary: unchanged | changed`. `boundary: changed` is never a Discipline result, and value names do not repeat their field meaning.
- Only a missing optional Discipline Skill may use that Discipline's bounded manual fallback against the same owner. A manual fallback never substitutes for a required managed worker or required independent Verify.
- Managed execution uses the following transient objects and persists none of them as RSP state:
  - `ExecutionFrame` contains the current goal, WorkOwner or WorkSet, effective authority, comparison baseline, observed execution location, current resource claims, and acceptance surfaces. Manage rederives it from current owners and evidence.
  - `DispatchDisposition` is derived after Manage selection and is exactly `none | preferred | required`. `none` permits a bounded local Discipline action while Manage retains orchestration and acceptance; `preferred` permits a truthful local fallback when dispatch is unavailable and no independent obligation is lost; `required` applies only when explicit delegation, independent identity, isolated resources, or declared acceptance requires a worker and fails closed when that boundary cannot be established. Once derived, `required` remains monotonic for the current managed phase unless a changed request, authority, or acceptance boundary returns to Core for fresh derivation. It is a nested decision, not a route or persisted status.
  - `WorkerSession` identifies one reusable compatible worker role and context within the current frame. It is a leaf execution boundary unless the current Assignment explicitly grants bounded nested-delegation authority. It is not one execution call, a resource lease, an isolated execution environment, or durable identity.
  - `WorkerInvocation` identifies exactly one host-admitted Assignment or AssignmentDelta from admission through cancellation handling, settlement, WorkerReceipt, and release observations. A stateful WorkerSession has at most one active context-mutating WorkerInvocation unless the host proves distinct execution contexts and resources.
  - `Assignment` is one complete bounded objective for exactly one WorkRef. Every Assignment or AssignmentDelta has a distinct Manager-issued transient identity that the WorkerReceipt echoes for correlation. `AssignmentDelta` continues only an observed resumed compatible WorkerSession and inherits only from its immediately accepted predecessor. Manage owns their packaged runtime forms in `skills/rsp-manage/references/managed-exchange.md`. Distinct WorkRefs retain distinct Assignments, WorkerInvocations, and WorkerReceipts even when Manager reuses one compatible primary WorkerSession longitudinally.
  - `WorkerReceipt` is the worker-authored structured claim. Its release claim remains distinct from the host's release observation. `AcceptedLaneEvidence` is the Manager-derived validated projection for that lane. Manage owns both packaged runtime forms and their transition contract in `skills/rsp-manage/references/managed-exchange.md`; schema validity and attribution do not establish acceptance, and neither object becomes durable runtime state.
  - `ResourceLease` claims only an evidenced exclusive resource such as a repository writer boundary, RSP control plane, test runner, generated artifacts, browser, Broker, or hardware/classroom session. It is host/runtime coordination, never a general worker lock or durable project fact.
- Core owns cross-Skill transport integrity when an explicitly identified machine consumer supplies a contract descriptor. The descriptor carries its consumer, version, transport, exact correlation identity, fields, types, and canonical value domains as one atomic transient input. Any delegated producer receives the complete applicable descriptor unchanged; transport conformance never replaces the owning Skill's domain validation or acceptance.
- Every Assignment carries the response language and localized control-narration rule: human-facing Assignment, WorkerReceipt, and ControlOutcome presentation defaults to labeled natural language in that response language, while exact identifiers and enum values remain secondary parenthesized or code-formatted tokens. JSON is used only for an explicitly identified machine consumer of that runtime contract, carries identical semantics, and is not emitted as a duplicate by default. Maintainer EvaluationReceipts remain a separate evaluation-harness protocol rather than a WorkerReceipt encoding. Private Inspect uses the managed contract directly; managed Verify consumes the `rsp-verify` result and Manage appends observed worker identity and independence.
- Manage projects one outer execution mode before choosing an internal strategy. `solo` uses no worker and may invoke the bounded local Discipline when `DispatchDisposition: none | preferred`; `delegated` uses one compatible primary WorkerSession; `coordinated` uses multiple workers or an independence-seeking worker obligation.
- Manage derives the smallest safe internal topology from the current ExecutionFrame: `control-action`, `longitudinal`, `sequential`, `parallel-wave`, `read-only-fan-out`, `bounded-correction`, or `independent-verify`. The topology is response-only nested technical evidence and may change only after affected authority, scope, seams, resources, replay safety, and evidence are revalidated.
- `longitudinal` preferentially resumes one primary WorkerSession when one Change, role, shared seam, writer boundary, strategy, and continuation evidence remain compatible and continuity avoids repeating settled context. Independent investigation or Verify, truly separate slices, a fundamentally rejected strategy, uncertain prior identity, session loss, or boundary invalidation uses a fresh WorkerSession and complete Assignment.
- Nested delegation is prohibited by default. When an Assignment explicitly authorizes it, the parent WorkerSession remains responsible for descendant authority, work, background processes, ResourceLeases, evidence integration, and one schema-valid WorkerReceipt. Descendants gain no ambient authority, cannot self-create a Manager-owned independent Verify or fixed-scope Review result, and require no durable registry.
- A same-goal WorkerReceipt whose WorkRef, topology, route, scope, behavior, acceptance, interface, and authority remain unchanged is revalidated inside Manage. It does not return to Core merely to repeat route selection or qualification.
- A required worker obligation is satisfied only when the host observed creation and Assignment admission for one WorkerInvocation, the invocation settled or was safely cancelled and released, and Manager derived AcceptedLaneEvidence from a valid in-authority WorkerReceipt. Before admission, Manager may inspect evidence, compose and deliver the Assignment, and manage lifecycle only; it may not perform Assignment-owned mutation or verification.
- WorkerSession identity, sender identity, message source, and continuity evidence support attribution or eligible same-session inheritance only. They never grant authority, prove Assignment admission, or widen the current Assignment or AssignmentDelta envelope.
- Host-confirmed Assignment admission creates the WorkerInvocation and is the cancellation-ownership boundary. WorkerSession creation or resume alone does not prove admission. Cancellation or delivery failure before admission creates no accepted dispatch or inherited Assignment boundary; after admission, caller abandonment does not retract work, and only an explicit supported interrupt or cancellation plus acknowledgement, observed settlement, and release reconciliation may release affected ResourceLeases.
- Do not require hosts to expose worker identity, cancellation, heartbeat, or process APIs they do not have; unavailable capabilities fail or downgrade truthfully instead of being inferred.
- A required worker that cannot be created, returns no valid receipt, reports unavailable or changed boundaries, or cannot satisfy required independent verification produces `capability-unavailable` or the more specific evidenced stop and keeps acceptance `incomplete`. The controller cannot replace the missing receipt with an assumption, a generic manual fallback, or its own undeclared work.
- No whole-run dispatch quota exists. A failed same-scope Assignment may receive at most three bounded correction passes by default, but stops earlier on repeated failure without new evidence, non-convergence, changed scope, authority, behavior, or acceptance, unavailable capability, or unsafe replay. Required independent Verify is a separate acceptance obligation and does not consume the Fix correction allowance.
- Elapsed time, poll count, heartbeat count, progress-message count, token count, token limit, and token cost are not authority, safety, acceptance, completion, or closeout inputs. Token or context cost may break a tie only between otherwise equally safe and authorized strategies; it never creates a worker obligation, weakens verification, or changes a boundary. Machine heartbeat reports liveness; user-facing progress reports only a material checkpoint, decision, risk, or wait reason.
- Explicit cancellation retains ResourceLeases until the worker and owned background processes acknowledge stop. Replay follows the Assignment's resume-safety class. When context growth threatens precision, Manage may accept the current slice, compress decisive evidence into its existing owner, inspect diff and resources, produce a minimal continuation, and rederive a fresh ExecutionFrame without copying execution chronology.
- Host observations form a thin conditional projection: creation, admission, activity or wait, interruption request, cancellation acknowledgement, settlement, and release remain distinct facts. Provider-specific handles and statuses stay in the host adapter. Runtime settlement, disappearance, cancellation acknowledgement, and terminal output are liveness or recovery evidence, not a WorkerReceipt or AcceptedLaneEvidence. They may close runtime accounting but cannot manufacture a lane result, successful verification, or acceptance. Partial or empty terminal output remains recovery evidence only; a missing schema-valid required WorkerReceipt keeps acceptance `incomplete`, and outstanding owned background work keeps conflicting ResourceLeases claimed.
- Evaluation keeps observer facts and producer claims separate. When host events expose lifecycle calls, the harness derives dispatch, admission, wait, interruption, settlement, release, and ordering measurements from those events. Agent-reported routing, correction, or dispatch values remain labeled claims; unavailable host facts stay null with explicit omissions.
- Raw messages, heartbeat, leases, retry chronology, unaccepted WorkerReceipts, process handles, and raw logs remain in the host session or native CI/log store. Manage compresses only accepted outcomes into Change Tasks, decisive evidence into Verify, and real unresolved dependencies or risks into Blockers.

## Acceptance and Closeout
- Implementation verification, fixed-scope change review, and the durable writeback decision are separate gates:
  - implementation verification supplies fresh evidence after every mutation;
  - fixed-scope change review is a report-only comparison owned by Review and is required when explicitly requested, required by nearer authority or risk, or needed to derive managed `review-clean`; it is not automatically required for every tiny direct action;
  - the durable writeback decision occurs before archive and independently decides whether stable current facts or lasting rationale must be written. It never substitutes for fixed-scope change review.
- `AcceptanceDisposition` values are exactly:
  - `incomplete`: at least one required result, receipt, owner decision, verification, or acceptance input is missing, invalid, unavailable, boundary-changing, or unresolved.
  - `evidence-complete`: required execution and implementation verification evidence is fresh and accepted, but the required fixed-scope change review is not yet clean.
  - `review-clean`: required evidence is complete and the current fixed-scope change review has no unresolved accepted finding.
- `CloseoutEligibility` values are exactly:
  - `not-eligible`
  - `lifecycle-ready`
  - `local-commit-ready`
- Closeout eligibility is derived independently from execution. Only `review-clean` acceptance plus fresh owner, authority, exact diff, and decisive verification evidence can produce a ready value.
- Missing required worker creation, an invalid required receipt, required independent verification that cannot be established, or any unresolved stop keeps acceptance `incomplete` and closeout `not-eligible`.
- The existing closeout tiers remain authority ceilings:
  - `manual`: no automatic archive or commit.
  - `lifecycle`: may derive `lifecycle-ready`, but never `local-commit-ready`.
  - `local`: archives one eligible terminal non-small managed boundary and then routes its exact clean paths exactly once to local Commit without another user request.
- A nearer denial or restriction narrows any configured ceiling. Push, publication, deployment, approval, and human acceptance remain separately authorized.

## Transition Invariants
1. Core derives one route; it does not persist the route.
2. Shape returns a clarified owner; it does not execute product work.
3. Core resolves one ready owner before Manage qualification; Shape returns only to Core.
4. Frontier classification occurs only after Core selects and hands off a ready, qualified managed owner.
5. Every stop halts mutation and names how control may resume.
6. Every required worker obligation needs observed WorkerInvocation admission, a valid WorkerReceipt, and Manager-derived AcceptedLaneEvidence.
7. Acceptance is derived from fresh evidence, never from the absence of a failure event.
8. Closeout is derived only after acceptance and the durable writeback decision, never directly from execution progress.
9. Lifecycle closeout precedes any eligible local commit; remote delivery remains explicit.
10. Same-goal resume and WorkerReceipts invalidate stale control claims and are revalidated inside Manage; only a true owner, WorkRef topology, route, behavior, acceptance, interface, scope, or authority boundary returns to Core.
11. WorkerSession continuity never proves execution-environment isolation or independent verification; only observed execution location and identity evidence support those claims.
12. ResourceLease release follows observed WorkerInvocation settlement or acknowledged cancellation plus host release reconciliation, never elapsed time or controller assumption.
13. The outer `ControlOutcome` owns the user-visible mode and status; route, topology, lane results, acceptance, and closeout remain nested details or gates.
14. `AssignmentDelta` inheritance never crosses WorkerSessions or an invalidated boundary; uncertain continuity requires a complete Assignment.
15. Assignment admission transfers cancellation ownership: pre-admission failure creates no dispatch, while post-admission work requires explicit cancellation and observed acknowledgement or settlement before lease release.
16. Runtime settlement and provenance never substitute for current authority, a schema-valid WorkerReceipt, or Manager-derived AcceptedLaneEvidence.

## Boundaries
- Core owns route derivation and rerouting.
- Shape owns clarification and ready-owner return.
- Each Discipline owns its bounded action, exact result, and applicable stop.
- Core owns initial Manage qualification and the `selected | declined` route result.
- Manage owns selected-handoff validation, ExecutionFrame and DispatchDisposition derivation, topology, WorkerSession reuse, WorkerInvocation composition, Assignment delegation, WorkerReceipt validation, AcceptedLaneEvidence, ResourceLease coordination, semantic rollover, internal current-evidence revalidation, review convergence, acceptance derivation, lifecycle closeout, and commit eligibility and orchestration after selection; it does not repeat direct-versus-managed eligibility or perform Commit's exact Git procedure.
- Commit owns exact staging, message construction, one local commit, and post-commit observation for a Core- or Manage-derived `direct | change | group | release` boundary. Its transient envelope carries exact paths, decisive verification, current commit authority, and only the identity or lifecycle evidence required by the selected owner variant.
- A direct Commit owner is an exact transient Git boundary, not a durable WorkOwner; it never creates or implies a WorkRef, lifecycle state, or RSP trailer. The selected Change or shallow Group remains the only durable tracked work owner. Changes remain only `open` or `archived`.
