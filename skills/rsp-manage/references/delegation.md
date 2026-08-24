# Delegation and host evidence

Load this reference only after Manage derives `DispatchDisposition: preferred | required` and before preparing a worker task or accepting a worker result.

## Delegate one bounded task

Send one independently executable vertical slice. Start by telling the recipient that it is the already-dispatched Discipline worker for this assignment: it executes the bounded task directly and must not rerun parent Manage routing or require another worker. A delegated task includes only what the worker needs to act safely:

```text
Work: <exact WorkRef>
Objective: <one bounded objective>
Authority: <exact owner sections or paths>
Read: <allowed read boundary>
Write: <allowed write boundary>
Verify: <required verification boundary>
Known facts: <only decisive current facts>
Prohibited actions: <explicit denials>
Stop conditions: <when to return without continuing>
Replay caution: <only when repeating effects may be unsafe>
```

Omit empty optional fields. Do not attach host lifecycle schemas, correlation identifiers, JSON transport contracts, evaluator instructions, token targets, or acceptance fields. Workers receive no implied focus, lifecycle, Git, publication, deployment, approval, or nested-delegation authority. Nested delegation is prohibited unless the task explicitly grants a bounded descendant role and the parent remains responsible for its work and result.

Resume the same compatible worker only when the host makes that possible and the goal, role, authority, writer boundary, strategy, and evidence remain valid. Otherwise send a complete fresh task. A concise continuation may state changed facts, but never relies on hidden inheritance for authority or safety.

Each delegated Discipline owns its own result:

- **Diagnose:** `rsp-diagnose`; `confirmed | unresolved` with cause evidence and scope impact.
- **Inspect:** Manager-only read-only evidence packet.
- **Fix:** `rsp-implement`; `changed | no-change` with changed paths, verification, omissions, and any scope issue.
- **Verify:** `rsp-verify`; `pass | fail | unavailable` with named checks, evidence delta, omissions, and any scope issue.

Fixed-scope review remains owned by `rsp-review`. Manage adds no universal worker receipt and never asks a worker to report host identity, independence, admission, settlement, release, evidence validity, or acceptance.

## Validate results and host facts

Treat three evidence sources separately:

- the worker-authored Discipline result states what the worker did and observed;
- host observations, when available, establish dispatch, attribution, activity, cancellation, completion, and whether different workers participated;
- Manager validates authority, actual changed paths, local diff, declared verification, omissions, and current acceptance.

Host facts are capabilities and observations, not RSP domain objects. Missing observations remain unavailable rather than inferred from prose, handles, elapsed time, topology, or successful tests. A worker never self-certifies identity, independence, resource release, evidence validity, or acceptance.

For required delegation, Manage must have an attributable worker-authored result that covers the assigned boundary. For required independent Verify, the host must establish that the accepted Fix and Verify came from different workers. If either condition cannot be established, acceptance remains `incomplete`. Manager must not author, repair, reconstruct, or substitute the missing worker result.

Inspect actual paths, diff, commands, outcomes, and omissions before accepting a result. A host-reported completion, a valid transport shape, successful integration tests, or absence of an error never substitutes for this validation.
