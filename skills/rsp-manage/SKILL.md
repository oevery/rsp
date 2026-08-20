---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.08.18.4"
---

# RSP Manage

Manage one requested goal selected by Core from an explicit request or effective `manage.activation: auto`. Enter only with one selected shape-ready Change or shallow Group plus a transient handoff containing the goal, WorkRef, authority envelope, decisive qualification evidence, closeout ceiling, and return boundaries. Once selected, this Skill solely owns same-goal revalidation, interruption and resume, review convergence, acceptance, lifecycle closeout, and commit eligibility and orchestration. Exact staging, message construction, local commit execution, and post-commit observation remain owned by `rsp-commit`. Keep artifacts durable and process data transient. The goal defines authority; automatic activation grants selection, not mutation.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Selected-goal entry

Core resolves ownership before this Skill is entered. Manage has no pre-owner Intake and never creates, focuses, reshapes a durable owner, or selects an execution environment. Reject an incomplete handoff without mutation and return to Core with the missing owner, authority, qualification, closeout, or return-boundary evidence.

## Validate the selected handoff before mutation

Core and its managed-routing reference solely own initial Manage qualification and the `selected | declined` route result. Manage never repeats the direct-versus-managed eligibility test or declines a valid selected handoff back to an ordinary Core or Discipline action.

Before deriving execution, re-read the handoff against current evidence:

- every selected WorkRef, including clear in-scope successors;
- the complete owning Change, or the Group Brief and its children;
- relevant Specs and Decisions;
- the authority envelope, `rsp status --json`, and the current checkout.

Validate only handoff completeness and current drift: owner and WorkRef topology, authority envelope, owned paths, qualification evidence, closeout ceiling, return boundaries, requested goal and route, and decisive evidence. If any true owner, topology, route, behavior, acceptance, interface, scope, mutation-authority, or external-action-authority boundary changed, stop without mutation and return the decisive evidence to Core. Otherwise continue the selected managed goal without repeating qualification. Use only the execution location actually provided by the host; a worker identity never proves filesystem or runtime isolation. Keep validation and execution reasoning transient.

Derive one transient `ExecutionFrame` with the current goal, `WorkOwner` or `WorkSet`, authority, comparison baseline, observed execution location, resource claims, and acceptance surfaces. Preserve unrelated work; never require or invent a release identity for a non-release managed goal; never persist the frame or infer isolation from worker execution.

Return one bounded managed phase result for Core to compose through its `ControlOutcome` contract; do not redefine the outer receipt. Report `solo` with no worker, including bounded local Discipline execution; `delegated` with one compatible primary WorkerSession; and `coordinated` with multiple workers or an independence-seeking worker obligation. Frontier, `DispatchDisposition`, topology, lane result, `AcceptanceDisposition`, and `CloseoutEligibility` stay nested details or gates rather than peer status flows.

Derive the smallest safe topology: `control-action` for a bounded Manager-owned control action; `longitudinal` for compatible successive Assignments to one primary WorkerSession; `sequential` for ordered work; `parallel-wave` for independent mutation and verification resources; `read-only-fan-out` for independent evidence; `bounded-correction` for an accepted same-scope failure; or `independent-verify` for an acceptance obligation requiring a different worker identity. Topology is response-only nested evidence and changes only after revalidating authority, scope, seams, resources, replay safety, and evidence.

Derive `DispatchDisposition` independently after selection:

| Value | Use when | If dispatch is unavailable |
| --- | --- | --- |
| `none` | The bounded action has no useful or required worker seam. | Invoke the local Discipline; Manage retains orchestration and acceptance. |
| `preferred` | Delegation improves isolation or continuity without creating an acceptance obligation. | Record the fallback and continue locally inside the same owner and authority. |
| `required` | The request, explicit delegation authority, or declared acceptance requires worker identity or an isolated resource. | Stop `capability-unavailable`; acceptance remains `incomplete`. |

Manage qualification, distinct execution/acceptance phases, and separate owners never manufacture a worker obligation. The common path is: validate → resolve frontier → choose `none | preferred | required` → execute → verify; load recovery, lifecycle, review, closeout, or provider detail only when its trigger is present.

## Resolve the execution frontier

Classify every new unknown in fail-closed order: `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `ready-to-execute`. Canonical `FrontierDisposition` is exactly `out-of-goal`, `owner-decision`, `fog`, `evidence-needed`, or `executable`; public `ready-to-execute` maps only to `executable`.

- `out-of-goal`: return topology or authority resolution to Core; stop `reroute`.
- `owner-decision`: ask the `DecisionOwner` one highest-impact question about unresolved behavior, acceptance, interface, scope, mutation, external action, or human acceptance; stop `ask-owner`. Core freshly routes after the answer.
- `fog`: This is not yet a precise question. Create no synthetic Task, Change, Blocker, worker dispatch, or product mutation. Halt this phase; only Core may route authorized Shape. Stop `return-to-shape`. Resume after Shape returns a ready owner and Core rederives the route.
- `evidence-needed`: answer one precise factual question. If it crosses an earlier boundary, use that boundary's stop instead of selecting Fix.
- `executable`: select a lane only after ownership, authority, and required evidence are settled.

Use the canonical `StopDisposition` supplied by the invoking Core contract. Manage applies the phase-specific mappings below but does not redefine the complete common stop vocabulary. No stop permits another worker dispatch, product mutation, lifecycle closeout, or Git action until its stated resume contract succeeds.

Before composing or resuming work, validating a `WorkerReceipt`, or deriving `AcceptedLaneEvidence`, read the canonical [managed exchange](references/managed-exchange.md) contract. Send one independently executable vertical slice. Batch small same-shape edits only when role, seam, writer, authority, replay, verification, review, and ResourceLease boundaries match. Never batch distinct WorkRefs into one Assignment or WorkerReceipt. Compatible Group children may reuse a primary WorkerSession, but each child retains its own Assignment, WorkerInvocation, and WorkerReceipt.

Prefer the same primary WorkerSession while frame, role, seam, writer, strategy, and evidence remain compatible. Session loss, incompatible boundaries, independence, or a reasoning reset requires a fresh WorkerSession and complete Assignment. Use an `AssignmentDelta` only under the exchange contract's observed same-session inheritance rule. Identity and continuity grant no authority. Token or context cost may choose only between otherwise equally safe and authorized strategies; it never changes authority, acceptance, completion, or a required worker boundary.

- **Diagnose:** `rsp-diagnose`; read-only until a cause or explicit no-cause result. Return `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`, plus decisive evidence and the next safe discriminating check when available.
- **Inspect:** Manager-only and read-only; parallel only with isolated paths and verification resources. Return `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`, plus one independent evidence packet.
- **Fix:** `rsp-implement`; sole product writer with explicit in-scope mutation authority. Return `changed-same-scope`, `no-change`, or `boundary-changed`, plus observed worker identity, changed paths, and fresh verification.
- **Verify:** `rsp-verify`; read-only for declared risk or failed correction. Return the Verify-owned result with observed worker identity and independence status.

Fixed-scope review remains owned by `rsp-review`.
Verify receipts append observed worker identity and `independence: established | unavailable`.

Before worker creation, resume, interruption, settlement, or release, read [host worker lifecycle](references/host-worker-lifecycle.md). Host-confirmed Assignment admission creates the WorkerInvocation and cancellation-ownership boundary; creation or resume alone does not prove admission. Settlement closes liveness only; release closes conflicting resources only. Neither proves product acceptance. A completed WorkerSession without a compatible longitudinal successor is released through the host when supported. Validate every receipt through the managed exchange contract. Never parse free-form output to manufacture a receipt, result, dispatch, or acceptance.

Independent Verify is established only when its worker identity and the accepted Fix worker identity are both available and different. If the host cannot establish that identity boundary, record `independence: unavailable`; ordinary read-only Verify may still run, but Manager must not claim independent verification.

Derive `AcceptanceDisposition` independently from execution:

```text
accepted required receipts + fresh declared verification → evidence-complete
evidence-complete + clean fixed-scope review              → review-clean
```

Otherwise acceptance is `incomplete`. This includes a required worker that was not created, returned no valid receipt, reported `unavailable` or `boundary-changed`, or could not satisfy required independence. Execution and verification receipts never derive `review-clean`; the durable writeback decision never substitutes for review. Controller mutation cannot replace an unavailable required implementation worker, and ordinary Verify cannot satisfy required independent Verify.
Implementation verification, fixed-scope change review, and the durable writeback decision remain separate gates. The first transition above is implementation verification; only the second derives `review-clean`.

Keep transient control, execution, receipt, resource, topology, and chronology data response-only. After validation, write only accepted outcomes to Tasks, decisive evidence to Verify, and real unresolved dependencies or risks to Blockers. Durable facts or rationale remain owned by the durable writeback decision. Create no frontier file, ticket map, ledger, registry, graph, hook, numeric routing score, run directory, or receipt/worker/verification registry.

Do not impose one fixed dispatch ceiling across the whole managed run. Every dispatch requires one necessary bounded Assignment with available authority, seams, exclusive resources, replay safety, and acceptance capacity. Skip Diagnose or Inspect unless it materially reduces uncertainty for the current acceptance path.

An evidenced failed same-scope Assignment permits at most three correction passes by default. Start another pass only when new evidence makes it discriminating, replay is safe, and decisive acceptance remains possible; it stops earlier when the same failure repeats without new evidence, on non-convergence, changed boundary, unavailable capability, unsafe replay, or unverifiable correction. Independent Verify is a separate required acceptance obligation and does not consume the Fix correction allowance. Manual fallback stays within the same owner and authority; Manager never absorbs an unavailable worker's unauthorized implementation.

## Dispatch owned work

Send the complete Assignment or eligible AssignmentDelta by message; workers never use the Focus Capsule for coordination. Dispatch only for `preferred | required`; `none` invokes the local Discipline without synthetic delegation. Count a dispatch or resumed delta only after host-confirmed admission. Failed creation, resume, or pre-admission delivery creates no dispatch, continuity, invocation, or inherited boundary. Manage retains receipt validation, accepted-evidence derivation, convergence, lifecycle, and commit orchestration; Commit retains the exact Git procedure.

When dispatch cannot satisfy a required worker obligation, apply the AcceptanceDisposition rule above: return `StopDisposition: capability-unavailable`, keep acceptance `incomplete`, and stop. Absence of a confirmed WorkerInvocation or WorkerReceipt is never success, does not discharge the required obligation, and cannot be replaced by the controller claiming the worker's result.

For a Group:

- Dispatch only children in the current `plan.waves` wave.
- Treat actual overlap in writers, the RSP control plane, test runners, generated artifacts, browsers, Brokers, provider sessions, or hardware/classroom sessions as exclusive ResourceLease candidates.
- Keep blockers, later waves, shared seams, conflicting leases, and dependent verification sequential. Parallel work requires independent mutation paths and evidenced distinct resources; delegation never implies concurrency or isolation.
- Grant no implied focus, capsule, lifecycle, Git, publication, deployment, or approval authority.
- Run lane-local checks first, then at most one affected or integration gate for shared risk. Closeout reruns required evidence fresh; do not repeat an unchanged valid lane check.

## Continue from evidence

Inspect changed paths, local diff, and declared verification before accepting results. For an unchanged-boundary receipt, keep status and owner reads bounded to observed invalidations; rerun `rsp status --json` and reread complete authority only on recovery, closeout, or another invalidation signal. For a Group, restrict it to declared children.

When context growth threatens precision, treat semantic execution rollover as an interruption checkpoint and read [interruption and recovery](references/interruption-recovery.md) before returning or resuming. Do not continue from transient worker or resource claims that cannot be re-established.

Continue a clear in-scope ready successor while the goal, WorkRef topology, route, declared behavior, acceptance, public-interface boundary, scope, and authority remain unchanged. Return to Core only when owner identity, topology, requested route, declared behavior, acceptance, public-interface boundary, scope, mutation authority, or external-action authority changes. Implementing declared acceptance does not return to Core; at a changed boundary suspend mutation, return decisive evidence, and let Core freshly route Shape or the next owner. At that boundary, never classify discovery or change topology; only Core may route authorized Shape and freshly select the next path.

Stop when discovery or a new request changes declared behavior, acceptance, public-interface boundaries, scope, mutation authority, or external authority; do not stop merely because a normal Fix changes implementation behavior to satisfy the declared acceptance. Retry only evidenced corrections. Never create controller status or parallel lifecycle state.

Read [interruption and recovery](references/interruption-recovery.md) only for a progress or status inquiry, explicit pause or release, an environment or verification stop, or resume from continuation pointers.

Read [managed review convergence](references/review-convergence.md) only after a fixed-scope re-review returns Findings or when an accepted in-scope Finding may require another bounded Resolve Findings pass.

## Preserve boundaries

Keep chronology and transient control objects out of Changes, Briefs, Specs, Decisions, and Focus Capsules. Changes retain converged requirements, accepted outcomes, decisive evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Before using capsule content, read [interruption and recovery](references/interruption-recovery.md). The focus marker path remains the sole selection truth; capsule prose grants no authority.

Closeout requires a Core-selected and qualified handoff that remains valid under current evidence. For declined, unavailable, unselected, incomplete, or drifted handoffs, every `manage.closeout` preset is dormant; Core may report readiness or the next action, but configuration executes neither archive nor commit. Earlier qualification does not carry forward across a new continuation without a fresh Core route result.

When closeout begins, read [lifecycle and delivery closeout](references/closeout.md) to derive `CloseoutEligibility` and apply any authorized lifecycle, Commit, or push route. Also load it for an explicitly authorized recovery checkpoint or explicit push request. This Skill retains the valid-handoff and incomplete-or-drifted fail-safe before loading it; the reference cannot turn missing review, verification, Git, publication, or human-acceptance authority into permission.

Stop on unavailable dependencies, missing authority, failed verification, drift, or limits. When accepted work remains, preserve the focused owner unless explicit release or owner-conflict resolution requires otherwise, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Do not expose retry chronology or claim unobserved completion.
