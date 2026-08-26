# Control outcome

Load this reference whenever Core returns or composes the current phase result. ControlOutcome is an optional Core-owned response summary for one current WorkOwner. Its default rendering is localized labeled prose, not a required YAML or JSON object, durable workflow state, or a second status store. A Change WorkOwner is identified by its WorkRef; a Group WorkOwner is identified by its Group reference. Use JSON only for an explicitly identified machine consumer, and do not emit a duplicate JSON copy by default.

## Compose the response summary

Use short labels and omit inactive fields:

```text
Work: <current WorkOwner>
Phase: <current phase>
Result: <phase result>
Stop: <StopDisposition and reason>
Evidence: <decisive evidence>
Next: <NextOwner> → <next action>
Mode: <solo | delegated | coordinated>        # only when worker participation matters
State: <running | waiting | completed>        # only when lifecycle state matters
Changed: <changed paths>                      # only when paths changed
Resume: <recovery guidance>                   # only for pause or recovery
```

Exactly one of Result or Stop applies. Evidence and Next are the normal fields. Mode, State, Changed, and Resume appear only when active. Next combines owner and action and must not contradict the phase result or stop. The labels are intentionally short; canonical domain concepts such as ControlOutcome, WorkOwner, WorkRef, NextOwner, and StopDisposition retain their precise meanings.

## Preserve one status flow

State is a response presentation field, not a persisted lifecycle state or outer workflow state machine. Failure, cancellation, rerouting, verification blocking, and capability loss use the phase-specific StopDisposition; they do not create peer outer statuses. Route, dispatch, topology, lane result, acceptance, and closeout remain nested details or gates.

The optional machine values remain mode: solo | delegated | coordinated and status: running | waiting | completed; the compact human label State maps to status. Use solo when no worker participates, including selected Manage execution through a bounded local Discipline; use delegated when one worker participates; use coordinated when multiple workers participate or acceptance requires a separate verifier. Raw worker messages, host events, retry chronology, and unaccepted evidence never appear as response summary fields.

Core composes this summary from the selected phase result. Shape, Disciplines, and Manage return only their bounded phase result, evidence, and next action; they do not reproduce the complete response summary. ControlOutcome is response-only, not durable workflow state or an inter-Skill protocol.
