# Control outcome

Load this reference whenever Core returns or composes the current phase result. `ControlOutcome` is the single outer response receipt for one current WorkRef. Its default session rendering is localized labeled natural language, not a required YAML or JSON object, durable workflow state, or a second status store. Use JSON only for an explicitly identified machine consumer, encode the same semantics, and do not emit a duplicate JSON copy by default.

## Compose the outer receipt

Use these contextual fields, localize their labels, and omit empty optional fields:

```text
Work: <current WorkRef>
Mode: <solo | delegated | coordinated>
Status: <running | waiting | completed>
Phase: <current control or execution phase>
Result: <phase-specific result>
Stop: <phase-specific StopDisposition and reason>
Evidence: <decisive evidence>
Changed artifacts: <changed artifacts>
Next owner: <NextOwner>
Next action: <next action>
Recovery: <bounded recovery guidance>
```

Exactly one of Result or Stop applies. Evidence, Changed artifacts, and Recovery appear only when present. Next owner and Next action form one transition and must not contradict the phase result or stop. The contextual labels shorten and localize the response form; canonical domain concepts such as `ControlOutcome`, `WorkRef`, `NextOwner`, and `StopDisposition` retain their precise names.

## Preserve one status flow

Outer status transitions are only `running -> waiting | completed` and `waiting -> running | completed`. Failure, cancellation, rerouting, verification blocking, and capability loss use the phase-specific `stop`; they never create peer outer status values. Route, dispatch, topology, lane result, acceptance, and closeout remain nested phase details or gates.

The canonical fields retain `mode: solo | delegated | coordinated` and `status: running | waiting | completed`. Use `solo` when no worker participates, including selected Manage execution through a bounded local Discipline; use `delegated` for one compatible primary WorkerSession; use `coordinated` for multiple workers or an independence-seeking obligation. Raw Assignments, WorkerReceipts, host events, leases, retry chronology, and unaccepted evidence never appear as outer receipt fields.

Core composes this receipt from the selected phase result. Shape, Disciplines, and Manage return only their owned bounded result and evidence; they may name this invoking contract but never redefine its complete form. Never persist a `ControlOutcome` in a Change, Group Brief, Spec, Decision Record, archive, registry, Focus Capsule, or hidden host ledger.
