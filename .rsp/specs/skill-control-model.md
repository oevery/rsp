# Skill Control Model

## Purpose
- Define the canonical transient vocabulary used to explain how Core, Shape, Disciplines, and Manage route work, stop safely, resume, accept evidence, and derive closeout eligibility.
- Keep control decisions observable without adding a persisted controller, workflow state machine, ticket map, run registry, or runtime glossary dependency.

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
- Shape returns a phase Shape `ControlOutcome` with `OwnershipDisposition: ready`, the WorkRef, decisive readiness evidence, next owner `Core`, and a rule for Core to freshly derive the route only when its Ready gate passes. A material owner question instead returns `StopDisposition: ask-owner`, next owner `owner`, the required answer, and a rule to rerun Shape from fresh evidence after the answer. Any other non-ready blocker returns its applicable canonical `StopDisposition`, next owner, required input, and resume rule.

## Route Disposition
- Core owns `RouteDisposition`, whose values are exactly:
  - `specialist`: return one explicit Discipline owner for its bounded action.
  - `direct`: execute one bounded Core or Implement mutation path with one decisive verification and no Manage Intake or WorkerEnvelope.
  - `managed`: enter no-mutation Manage Intake for the requested goal.
  - `shape`: return unclear but owned work to Shape.
  - `stop`: perform no further action and name the applicable `StopDisposition`.
- Direct execution requires all of: one ready owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor.
- If any direct-execution condition ceases to hold, Core freshly rederives the route. Direct execution does not silently expand into managed execution.

## Ownership and Frontier Dispositions
- Manage Intake owns `OwnershipDisposition`, whose values are exactly:
  - `ready`
  - `ask-owner`
  - `return-to-shape`
  - `reroute`
- Existing public Intake labels map to the canonical vocabulary as follows:

| Intake label | Canonical ownership disposition | Next owner and resume |
| --- | --- | --- |
| `ready` | `ready` | Manage may continue to qualification and frontier derivation. |
| `needs-owner` | `ask-owner` | The product or authority owner answers one highest-impact question; Manage reruns Intake from fresh evidence. |
| `needs-shape` | `return-to-shape` | Shape clarifies the owned work and returns a ready owner; Core then reruns Intake and qualification. |
| `out-of-goal` | `reroute` | Core establishes a new owner, WorkRef, topology, or authority boundary before deriving a new route. |

- `FrontierDisposition` applies only after Intake has confirmed a ready owner and Manage has qualified. Its values remain exactly:
  - `owner-decision`
  - `fog`
  - `evidence-needed`
  - `executable`
  - `out-of-goal`
- Frontier precedence is fail-closed: `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `executable`.
- `owner-decision` stops with `ask-owner`; `fog` stops with `return-to-shape`; frontier `out-of-goal` stops with `reroute`. Evidence collection may continue only when it is authorized, bounded, and capable of advancing the current acceptance path.

## Stop and Resume
- `StopDisposition` values are exactly:
  - `ask-owner`
  - `return-to-shape`
  - `reroute`
  - `retry-with-evidence`
  - `environment-blocked`
  - `verification-blocked`
  - `capability-unavailable`
- Every stop names the next owner, required input, and resume rule:

| Stop disposition | Required next action | Resume rule |
| --- | --- | --- |
| `ask-owner` | Ask one highest-impact owner decision with the evidenced tradeoff. | Rerun Intake or the owning Discipline from fresh evidence after the answer. |
| `return-to-shape` | Shape uses ordinary clarification or explicit deep clarification without implementation. | Resume only after Shape confirms a ready owner, then freshly rederive routing and qualification. |
| `reroute` | Core establishes a valid owner, WorkRef, topology, dirty-path boundary, or authority. | Start again at Core route derivation; do not resume the prior frontier. |
| `retry-with-evidence` | Supply new evidence that directly addresses the failed or unresolved result. | Retry only within the owning Discipline's or Manage's declared retry bound. |
| `environment-blocked` | Restore the required local or external environment. | Reread authority, state, diff, blockers, and evidence before continuing. |
| `verification-blocked` | Resolve the named verification gate or obtain the required acceptance input. | Rerun the decisive verification and rederive acceptance. |
| `capability-unavailable` | Restore the required capability or select an explicitly valid fallback. | Freshly rederive the route or frontier; absence is never accepted as success. |

- No stop disposition permits worker dispatch, product mutation, lifecycle closeout, staging, commit, push, publication, deployment, approval, or human-acceptance claims before its resume rule succeeds.

## Execution Evidence
- Specialist Disciplines and managed lanes retain their own exact result schemas. The control model does not replace Diagnose, Inspect, Fix, Verify, Review, or Resolve Findings results with a generic execution enum.
- Only a missing optional Discipline Skill may use that Discipline's bounded manual fallback against the same owner. A manual fallback never substitutes for a required managed worker or required independent Verify.
- A managed WorkerEnvelope and its receipt are transient execution evidence. A required worker obligation is satisfied only when the worker was actually created and returned a valid result within its declared authority and schema.
- A required worker that cannot be created, returns no valid receipt, reports unavailable or changed boundaries, or cannot satisfy required independent verification produces `capability-unavailable` or the more specific evidenced stop and keeps acceptance `incomplete`. The controller cannot replace the missing receipt with an assumption, a generic manual fallback, or its own undeclared work.
- Token counts, token limits, and token cost are not routing, dispatch, retry, authority, completion, acceptance, or closeout inputs.

## Acceptance and Closeout
- `AcceptanceDisposition` values are exactly:
  - `incomplete`: at least one required result, receipt, owner decision, verification, or acceptance input is missing, invalid, unavailable, boundary-changing, or unresolved.
  - `evidence-complete`: required execution and verification evidence is fresh and accepted, but durable fixed-scope review is not yet clean.
  - `review-clean`: required evidence is complete and the current fixed-scope durable review has no unresolved accepted finding.
- `CloseoutEligibility` values are exactly:
  - `not-eligible`
  - `lifecycle-ready`
  - `local-commit-ready`
- Closeout eligibility is derived independently from execution. Only `review-clean` acceptance plus fresh owner, authority, exact diff, and decisive verification evidence can produce a ready value.
- Missing required worker creation, an invalid required receipt, required independent verification that cannot be established, or any unresolved stop keeps acceptance `incomplete` and closeout `not-eligible`.
- The existing closeout tiers remain authority ceilings:
  - `manual`: no automatic archive or commit.
  - `lifecycle`: may derive `lifecycle-ready`, but never `local-commit-ready`.
  - `local`: may derive `local-commit-ready` only for one exact, terminal, clean, verified, non-small boundary after lifecycle closeout.
- A nearer denial or restriction narrows any configured ceiling. Push, publication, deployment, approval, and human acceptance remain separately authorized.

## Transition Invariants
1. Core derives one route; it does not persist the route.
2. Shape returns a clarified owner; it does not execute product work.
3. Manage Intake resolves ownership before qualification or frontier work.
4. Frontier classification occurs only for a ready, qualified managed owner.
5. Every stop halts mutation and names how control may resume.
6. Every required worker obligation needs actual creation evidence and a valid receipt.
7. Acceptance is derived from fresh evidence, never from the absence of a failure event.
8. Closeout is derived only after acceptance and durable review, never directly from execution progress.
9. Lifecycle closeout precedes any eligible local commit; remote delivery remains explicit.
10. Resume invalidates stale control claims and rereads the owning artifacts, authority, diff, blockers, and decisive evidence.

## Boundaries
- Core owns route derivation and rerouting.
- Shape owns clarification and ready-owner return.
- Each Discipline owns its bounded action, exact result, and applicable stop.
- Manage owns Intake, qualification, execution-frontier derivation, worker acceptance, convergence, acceptance derivation, and eligible closeout after selection.
- The selected Change or shallow Group remains the only durable work owner. Changes remain only `open` or `archived`.
