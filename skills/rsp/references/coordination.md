# Worker delegation and resource evidence

Load only after qualified Core coordination needs an actual worker, independent acceptance, or resource arbitration. Derive `DispatchDisposition: none | preferred | required` from the current obligation: none runs locally; preferred can fall back locally; required stops if worker attribution is unavailable. Distinct-worker evidence is additionally required only for explicit independent Verify or Review. Qualification is not delegation. Do not infer parallel safety from delegation.

## Delegate one bounded task

For grouped or dependent work, load [groups and dependencies](groups-dependencies.md) and inspect the current `rsp status --json` plan. Dispatch only ready child WorkRefs in the first non-empty `plan.waves` wave; never execute a child whose prerequisite remains in `plan.blocked`. Recheck the derived plan before another wave. Parallelize only when actual writer and resource isolation is established.

Send one independently executable vertical slice. Tell the recipient it is already dispatched and must not rerun parent routing or delegate further. Include only what it needs to act safely:

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

- **Diagnose:** `rsp-implement` read-only diagnosis mode; `confirmed | unresolved` with cause evidence and scope impact.
- **Inspect:** Core-owned read-only evidence packet.
- **Fix:** `rsp-implement`; `changed | no-change` with changed paths, verification, omissions, and any scope issue.
- **Verify:** `rsp-verify`; `pass | fail | unavailable` with named checks, evidence delta, omissions, and any scope issue.

One worker may return both the Fix and ordinary Verify results for the same Change when independent verification is not required. The combined result is implementation evidence, not self-certified acceptance.

Fixed-scope review remains owned by `rsp-review`, including a required independent reviewer. Core adds no universal worker receipt and never asks a worker to self-report identity, independence, settlement, or acceptance.

## Validate results and host facts

Treat three evidence sources separately:

- the worker-authored Discipline result states what the worker did and observed;
- host observations, when available, establish dispatch, attribution, activity, cancellation, completion, and whether different workers participated;
- Core validates authority, actual changed paths, local diff, declared verification, omissions, and current acceptance.

Host facts are capabilities and observations, not RSP domain objects. Missing observations remain unavailable rather than inferred from prose, handles, elapsed time, topology, or successful tests. A worker never self-certifies identity, independence, resource release, evidence validity, or acceptance.

For required delegation, Core must have an attributable worker-authored result covering the assigned boundary. For required independent Verify or Review, host observations must establish distinct workers from the accepted implementation. If not, acceptance remains `incomplete`. Core cannot author or substitute the missing result.

When the same worker owns Fix and ordinary checks, Core may derive `evidence-complete` only after validating result, paths, checks, omissions, and scope. `review-clean` requires an actual required Review result; archive and commit remain separate gates. Shared writers, generated artifacts, test runners, browsers, providers and hardware run sequentially unless host and checkout evidence establish isolation.

Inspect actual paths, diff, commands, outcomes, and omissions before accepting a result. A host-reported completion, a valid transport shape, successful integration tests, or absence of an error never substitutes for this validation.
