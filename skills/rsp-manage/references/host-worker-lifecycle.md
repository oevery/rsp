# Host worker lifecycle

Load this reference only when Manage may dispatch, resume, interrupt, settle, or release worker execution, or when it must interpret host lifecycle evidence. Host APIs remain adapters; provider-specific handles, statuses, event names, polling delays, and cleanup calls never become portable RSP vocabulary.

## Compose sessions and invocations

A `WorkerSession` is a reusable compatible role and context. A `WorkerInvocation` is exactly one host-admitted Assignment or AssignmentDelta. Admission creates cancellation ownership for that invocation; creation or resume alone does not. A stateful WorkerSession has at most one active context-mutating WorkerInvocation unless the host proves distinct execution contexts, writer boundaries, and resources.

Observe creation, delivery, admission, activity or wait, interruption request, cancellation acknowledgement, settlement, and release as distinct facts when the host exposes them. Missing observations remain unavailable; do not infer them from a handle, terminal prose, elapsed time, or another lifecycle fact.

After admission, cancelling the caller's wait does not retract accepted work. Use the host's explicit interrupt or cancellation operation when available. Retain affected ResourceLeases until cancellation is acknowledged or settlement is observed, owned background work is reconciled, and the host-specific release boundary completes when supported. Settlement closes liveness, not acceptance; release closes conflicting runtime resource ownership, not product acceptance.

## Separate claims from acceptance

The worker returns one structured `WorkerReceipt`. It is an attributable claim, not accepted evidence. Validate its Assignment or AssignmentDelta identity, actual changed paths and diff, exact verification and omissions, boundary validity, observed host lifecycle, and resource release. Only then derive transient `AcceptedLaneEvidence`. Worker identity, schema validity, provenance, settlement, or release alone never grants authority or proves acceptance.

A required worker obligation remains incomplete when creation or admission is unobserved, no schema-valid WorkerReceipt arrives, Manager validation fails, required independence is unavailable, cancellation or background ownership remains unresolved, or release cannot satisfy a declared exclusive-resource boundary. Use the most specific stop and never substitute controller self-certification.

## Evaluate observer facts

When an evaluation harness exposes host events, derive lifecycle counts and order from those events. Keep agent-reported routing, correction, and dispatch values under an explicit producer-claim label. If a host does not expose one lifecycle fact, record null and an omission; never copy the agent-reported value into an observed measurement. Host observations remain evaluation/session evidence and are never persisted into `.rsp/`.
