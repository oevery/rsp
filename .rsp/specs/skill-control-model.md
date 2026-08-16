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
| `ControlOutcome`, `RouteDisposition`, `StopDisposition`, and Continuation | `rsp` |
| `WorkspaceSelection` | `rsp` Core |
| `ExecutionFrame`, `WorkerSession`, `Assignment`, `Receipt`, `ResourceLease`, frontier, acceptance, and closeout | `rsp-manage` |
| Verification result and evidence fields | `rsp-verify` |
| Discipline-specific result and stop conditions | The owning Discipline Skill |
| Workspace context and observations | `rsp-workspace` |

- Non-owner Skills may name an invoking contract and append their own bounded fields, but must not redefine the complete common contract.

## Control Outcome
- A `ControlOutcome` is response-only derived coordination data for one current phase. It contains:
  - `phase`
  - one phase-specific `disposition`
  - `decisiveEvidence`
  - `nextOwner`
  - `requiredInput` when continuation depends on an owner, capability, environment, or verification result
  - `resumeRule`, which names whether continuation resumes through the current phase or requires fresh derivation by Core
- A `ControlOutcome` is never durable product or workflow state. It is not stored in a Change, Group Brief, Spec, Decision Record, archive, registry, generated projection, or hidden host ledger.
- Each Skill uses only the terms needed for its phase. Phase-specific dispositions remain distinct and are not flattened into one universal status enum.
- `WorkOwner` means the selected Change or shallow Group that durably owns the requested outcome. `DecisionOwner` means the human or authority source required to settle one material decision. `NextOwner` means the next control or execution capability named by the transient outcome.
- Shape returns a phase Shape `ControlOutcome` with the ready `WorkOwner`, decisive readiness evidence, `NextOwner: Core`, and a rule for Core to freshly derive the route only when its Ready gate passes. A material decision instead returns `StopDisposition: ask-owner`, the `DecisionOwner`, the required answer, and a rule to rerun Shape from fresh evidence after the answer. Any other non-ready blocker returns its applicable canonical `StopDisposition`, `NextOwner`, required input, and resume rule.

## Route Disposition
- Core owns `RouteDisposition`, whose values are exactly:
  - `specialist`: return one explicit bounded Discipline result path. The named Discipline owns that one action and returns its result without becoming a completion controller.
  - `direct`: orchestrate one bounded non-managed completion or continuation with one decisive verification and no Manage handoff or managed `Assignment`. It may name exactly one Discipline executor. Core may directly mutate only RSP control-plane state; product mutation belongs to Implement or the same bounded manual Discipline action.
  - `managed`: hand one selected shape-ready owner and bounded goal to Manage after qualification. This is the only route that composes worker lanes and review convergence.
  - `shape`: return unclear but owned work to Shape.
  - `stop`: perform no further action and name the applicable `StopDisposition`.
- Direct execution requires one ready owner, one writer, one execution phase, one integrated decisive check, no recovery, no independent acceptance obligation, no managed lifecycle coordination, and no ready successor. Multiple files, Specs, product presentation, public documentation, or verification files do not by themselves make the route managed.
- If any direct-execution condition ceases to hold, Core freshly rederives the route. Direct execution does not silently expand into managed execution.

## Workspace Selection
- A `WorkspaceSelection` is the unique response-only isolation handoff produced by Core after policy and material-signal evaluation. Its fields are exactly:
  - `WorkRef`
  - `materialSelectionReason`
  - `exactTargetBranch`
  - `authorityReference`
- Core produces it, Manage validates and forwards it unchanged, and Workspace consumes it without redefining it. Workspace appends only separately observed path, branch, target, dirty state, commits ahead, activity, resource, and cleanup facts through the invoking result contract.
- It contains no observed machine path, prepared branch fact, activity, dirty state, commits-ahead count, readiness, acceptance, lifecycle, Git, or execution result. It is never persisted or added to a CLI manifest, Change, Group Brief, Spec, Decision Record, Focus Capsule, registry, status projection, or hidden host ledger.
- If any of the four fields is missing, ambiguous, stale, or inconsistent with current evidence, Manage or Workspace stops and returns the discrepancy to Core rather than repairing or reselecting isolation.

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
- Only a missing optional Discipline Skill may use that Discipline's bounded manual fallback against the same owner. A manual fallback never substitutes for a required managed worker or required independent Verify.
- Managed execution uses five transient objects and persists none of them as RSP state:
  - `ExecutionFrame` contains the current goal, WorkOwner or WorkSet, effective authority, comparison baseline, observed execution location, current resource claims, and acceptance surfaces. Manage rederives it from current owners and evidence.
  - `WorkerSession` identifies one worker role and its fresh or resumed context within the current frame. It is not a resource lease, does not imply an isolated worktree, and is not durable identity.
  - `Assignment` contains one bounded objective, exact authority references, Read/Write/Verify Sets, known facts, allowed and prohibited actions, stop conditions, and `resume safety: idempotent | inspect-before-repeat | non-repeatable`.
  - `Receipt` contains the exact lane result, actual changed paths, verification and omissions, boundary status, evidence validity, and resource-release outcome. Worker identity and independence are included only when observed and required.
  - `ResourceLease` claims only an evidenced exclusive resource such as a repository writer boundary, RSP control plane, test runner, generated artifacts, browser, Broker, or hardware/classroom session. It is host/runtime coordination, never a general worker lock or durable project fact.
- Every Assignment carries the response language and localized control-narration rule: human-facing Receipt narration uses that response language, while an exact result value remains unchanged only as a secondary parenthesized or code-formatted token. Private Inspect uses the managed contract directly; managed Verify consumes the `rsp-verify` result and Manage appends observed worker identity and independence.
- Manage derives the smallest safe topology from the current ExecutionFrame: `direct`, `longitudinal`, `sequential`, `parallel-wave`, `read-only-fan-out`, `bounded-correction`, or `independent-verify`. The topology is response-only and may change only after affected authority, scope, seams, resources, replay safety, and evidence are revalidated.
- `longitudinal` resumes one WorkerSession only when one Change, role, shared seam, writer boundary, strategy, and continuation evidence remain compatible and continuity has material value. Independent investigation or Verify, truly separate slices, a fundamentally rejected strategy, or uncertain prior identity uses a fresh WorkerSession.
- A same-goal receipt whose WorkRef, topology, route, scope, behavior, acceptance, interface, and authority remain unchanged is revalidated inside Manage. It does not return to Core merely to repeat route selection or qualification.
- A required worker obligation is satisfied only when the worker was actually created and returned a valid result within its declared authority and schema.
- Do not require hosts to expose worker identity, cancellation, heartbeat, or process APIs they do not have; unavailable capabilities fail or downgrade truthfully instead of being inferred.
- A required worker that cannot be created, returns no valid receipt, reports unavailable or changed boundaries, or cannot satisfy required independent verification produces `capability-unavailable` or the more specific evidenced stop and keeps acceptance `incomplete`. The controller cannot replace the missing receipt with an assumption, a generic manual fallback, or its own undeclared work.
- No whole-run dispatch quota exists. A failed same-scope Assignment may receive at most three bounded correction passes by default, but stops earlier on repeated failure without new evidence, non-convergence, changed scope, authority, behavior, or acceptance, unavailable capability, or unsafe replay. Required independent Verify is a separate acceptance obligation and does not consume the Fix correction allowance.
- Elapsed time, poll count, heartbeat count, progress-message count, token count, token limit, and token cost are not routing, dispatch, correction, authority, completion, acceptance, or closeout inputs. Machine heartbeat reports liveness; user-facing progress reports only a material checkpoint, decision, risk, or wait reason.
- Explicit cancellation retains ResourceLeases until the worker and owned background processes acknowledge stop. Replay follows the Assignment's resume-safety class. When context growth threatens precision, Manage may accept the current slice, compress decisive evidence into its existing owner, inspect diff and resources, produce a minimal continuation, and rederive a fresh ExecutionFrame without copying execution chronology.
- Raw messages, heartbeat, leases, retry chronology, unaccepted Receipts, process handles, and raw logs remain in the host session or native CI/log store. Manage compresses only accepted outcomes into Change Tasks, decisive evidence into Verify, and real unresolved dependencies or risks into Blockers.

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
6. Every required worker obligation needs actual creation evidence and a valid Receipt.
7. Acceptance is derived from fresh evidence, never from the absence of a failure event.
8. Closeout is derived only after acceptance and the durable writeback decision, never directly from execution progress.
9. Lifecycle closeout precedes any eligible local commit; remote delivery remains explicit.
10. Same-goal resume and Receipts invalidate stale control claims and are revalidated inside Manage; only a true owner, WorkRef topology, route, behavior, acceptance, interface, scope, or authority boundary returns to Core.
11. WorkerSession continuity never proves workspace isolation or independent verification; only observed execution location and identity evidence support those claims.
12. ResourceLease release follows observed completion or acknowledged cancellation, never elapsed time or controller assumption.
13. WorkspaceSelection remains the four-field Core handoff; Workspace observations never mutate or persist it.

## Boundaries
- Core owns route derivation and rerouting.
- Shape owns clarification and ready-owner return.
- Each Discipline owns its bounded action, exact result, and applicable stop.
- Core owns initial Manage qualification and the `selected | declined` route result.
- Manage owns selected-handoff validation, ExecutionFrame and topology derivation, WorkerSession reuse, Assignment dispatch, Receipt acceptance, ResourceLease coordination, semantic rollover, internal current-evidence revalidation, review convergence, acceptance derivation, lifecycle closeout, and commit eligibility and orchestration after selection; it does not repeat direct-versus-managed eligibility or perform Commit's exact Git procedure.
- Commit owns exact staging, message construction, one local commit, and post-commit observation for a Core- or Manage-derived boundary.
- The selected Change or shallow Group remains the only durable work owner. Changes remain only `open` or `archived`.
