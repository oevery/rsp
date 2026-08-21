# Host worker lifecycle

Load this reference only when Manage may dispatch, resume, interrupt, settle, or release worker execution, or when it must interpret host lifecycle evidence. Host APIs remain adapters; provider-specific handles, statuses, event names, polling delays, and cleanup calls never become portable RSP vocabulary.

## Compose sessions and invocations

A `WorkerSession` is a reusable compatible role and context. A `WorkerInvocation` is exactly one host-admitted Assignment or AssignmentDelta. Admission creates cancellation ownership for that invocation; creation or resume alone does not. A stateful WorkerSession has at most one active context-mutating WorkerInvocation unless the host proves distinct execution contexts, writer boundaries, and resources.

Observe creation, delivery, admission, activity or wait, interruption request, cancellation acknowledgement, settlement, and release as distinct facts when the host exposes them. Missing observations remain unavailable; do not infer them from a handle, terminal prose, elapsed time, or another lifecycle fact.

After admission, cancelling the caller's wait does not retract accepted work. Use the host's explicit interrupt or cancellation operation when available. Retain affected ResourceLeases until cancellation is acknowledged or settlement is observed, owned background work is reconciled, and the host-specific release boundary completes when supported. Settlement closes liveness, not acceptance; release closes conflicting runtime resource ownership, not product acceptance.

## Separate claims from acceptance

The Manage-owned managed exchange contract defines the structured `WorkerReceipt` and its validation into transient `AcceptedLaneEvidence`. This lifecycle reference adds no receipt fields. A worker-authored release claim remains distinct from the host's release observation; neither substitutes for the other. Worker identity, schema validity, provenance, settlement, or release alone never grants authority or proves acceptance.

A required worker obligation remains incomplete when creation or admission is unobserved, no schema-valid WorkerReceipt arrives, Manager validation fails, required independence is unavailable, cancellation or background ownership remains unresolved, or release cannot satisfy a declared exclusive-resource boundary. Use the most specific stop and never substitute controller self-certification.

## Observe lifecycle facts

Derive completed lifecycle and count claims from host observations. A topology records intended orchestration only, and controller or worker claims do not prove creation, admission, settlement, or release. If the host does not expose a lifecycle fact, keep it unavailable rather than inferring it.
