# Managed exchange

Load this reference before Manage composes an Assignment or AssignmentDelta, dispatches or resumes a worker, validates a WorkerReceipt, or derives AcceptedLaneEvidence. This is the single runtime exchange contract owned by Manage. Its fields define semantic obligations, not a required YAML, JSON, host-native object, or persisted RSP record.

## Render for the session

Use localized labeled natural language as the default Assignment and WorkerReceipt presentation in a human-visible session. Preserve canonical identifiers and enum values secondarily in parentheses or code form. A labeled receipt is the structured claim itself; it is not free-form prose, and Manager must reject a required field that is absent rather than infer it from surrounding conversation.

Use JSON only when an explicitly identified host, API, CLI, or other machine consumer requires this managed-exchange encoding. Encode the same fields as one object without changing their semantics. JSON is secondary transport, never stronger evidence, and never implies admission, validity, or acceptance. Do not emit both natural-language and JSON renderings by default; duplication requires an explicit consumer need. A maintainer `EvaluationReceipt` is a separate evaluation-harness protocol; it is never a `WorkerReceipt` encoding or part of this managed exchange.

## Assign one bounded lane

Every fresh WorkerSession receives one complete `Assignment` using these semantic fields. Localize the labels in the session:

```text
Assignment: <Manager-issued transient assignment identity>
Work: <exact WorkRef>
Lane: <Diagnose | Inspect | Fix | Verify>
Objective: <one bounded objective>
Authority: <exact owner sections or paths>
Read: <Read Set>
Write: <Write Set>
Verify: <Verify Set>
Known facts: <bounded known facts>
Allowed actions: <allowed actions>
Prohibited actions: <prohibited actions>
Stop conditions: <stop conditions>
Replay safety: <idempotent | inspect-before-repeat | non-repeatable>
```

Manager issues a distinct transient Assignment identity for every Assignment or AssignmentDelta inside the current ExecutionFrame. The worker echoes that exact identity in its WorkerReceipt; WorkRef, WorkerSession identity, message order, or prose similarity never substitutes for this correlation. Omit an empty optional set or fact, but never omit assignment identity, WorkRef identity, objective, authority, applicable boundaries, stop conditions, or replay safety. `authority`, `read`, `write`, `verify`, `facts`, `allow`, `prohibit`, `stop`, and `replay` are contextual field labels for the canonical authority references, Read Set, Write Set, Verify Set, known facts, allowed and prohibited actions, stop conditions, and resume safety concepts.

Only an observed resumed compatible WorkerSession may receive an `AssignmentDelta`. A delta carries a new Assignment identity, repeats `workRef` and the new `objective`, then supplies only changed assignment fields. An omitted field inherits only from the immediately accepted Assignment or AssignmentDelta in that same observed WorkerSession. Never inherit across sessions, uncertain identity, or an invalidated authority or safety boundary.

The canonical resume safety values remain `resume safety: idempotent | inspect-before-repeat | non-repeatable`; the exchange form shortens only the contextual field label to `replay`.

## Return one worker claim

Every WorkerInvocation expects exactly one worker-authored `WorkerReceipt` rather than a conversational execution diary. Localize the labels in the session:

```text
Assignment: <Assignment or AssignmentDelta identity>
Result: <localized narration> (<lane-specific canonical result>)
Changed paths: <actual changed paths>
Verification:
- Command: <exact command>
  Scope: <covered boundary>
  Outcome: <observed result>
  Omissions: <known omissions>
Boundary: <unchanged | changed>
Evidence status: <valid | invalid | unavailable>
Release claim: <released | retained | unavailable>
Worker: <observed worker identity>
Independence: <established | unavailable>
```

Assignment identity, result, changed paths, verification, boundary, evidence status, and release claim are required. The release claim is worker-authored and never substitutes for the host's release observation. Worker identity and independence appear only when observed and applicable. Lane-specific result enums remain owned by Diagnose, Inspect, Fix, or Verify; this envelope never replaces them with one generic result enum. Human-facing narration follows the response language and retains an exact canonical result secondarily when needed. Never parse free-form prose to manufacture a receipt.

## Separate observations, claims, and acceptance

Host observations and producer claims remain separate inputs:

| Fact | Producer | Meaning | Never proves |
| --- | --- | --- | --- |
| creation, delivery, admission, activity or wait | host | invocation lifecycle | result or acceptance |
| interruption request or cancellation acknowledgement | host | cancellation progress | safe replay by itself |
| settlement | host | liveness closed | receipt, release, or acceptance |
| release | host | conflicting runtime ownership closed | product acceptance |
| `WorkerReceipt` | worker | attributable structured claim | accepted evidence |
| `AcceptedLaneEvidence` | Manager | validated lane evidence | review-clean or closeout by itself |

Before deriving `AcceptedLaneEvidence`, Manager matches the echoed Assignment identity to the current WorkerInvocation, then validates actual paths and local diff, exact verification and omissions, boundary validity, evidence status, the worker's release claim, and the host's lifecycle and release observations. The accepted projection retains only the validated assignment, lane result, paths, verification, applicable identity or independence, and decisive observations. It is response-only and never becomes a receipt ledger.

The managed transition is exactly:

```text
host admission -> WorkerInvocation -> WorkerReceipt claim
                                     + host observations
                                     -> Manager validation
                                     -> AcceptedLaneEvidence
                                     -> AcceptanceDisposition
                                     -> CloseoutEligibility
                                     -> bounded managed phase result for Core
```

Missing admission, a missing or invalid required receipt, changed boundaries, failed validation, unavailable required independence, unresolved cancellation or background ownership, or unreleased exclusive resources keeps `AcceptanceDisposition: incomplete` and `CloseoutEligibility: not-eligible`. Settlement, provenance, schema validity, release, or the absence of an error never substitutes for Manager acceptance.
Schema validity and attribution do not establish acceptance.

Do not persist Assignments, deltas, receipts, host observations, AcceptedLaneEvidence, acceptance, closeout, leases, handles, retries, or chronology. Compress only accepted outcomes into Change Tasks, decisive evidence into Verify, and real unresolved dependencies or risks into Blockers.
