# Worker delegation and resource evidence

Load for actual workers, dependencies/shared-resource arbitration or required independent acceptance. Work shape and worker count are independent. Explicit worker requests or binding worker requirements permit bounded dispatch; otherwise use the validated workflow.delegation setting (off by default, auto when enabled). Recovery and ordinary continuation do not enable delegation.

Core decides none, preferred or required from the actual obligation. Keep tightly coupled work local; prefer independently executable slices only when delegation is allowed. Required dispatch needs attributable host execution; required independence needs a distinct worker. The main agent or user chooses worker count without RSP tiers or limits; host resource limits still apply. No setting grants product, Git or lifecycle authority. Missing optional delegation falls back locally; missing required workers leave acceptance incomplete.

## Delegate one bounded task

For grouped or dependent work, use [groups and dependencies](groups-dependencies.md) and the current `rsp status --json` plan. Only children in the first non-empty `plan.waves` wave are eligible; a prerequisite in `plan.blocked` prevents dispatch. Recheck dependencies and integrated evidence before the next wave. Child passes alone do not satisfy Group integration.

Before parallel work, check write boundaries and shared resources: generated outputs, manifests/lockfiles, Git index, test services, databases, browsers and hardware. Different filenames prove neither interface compatibility nor isolation. Require host-proven isolation or run serially. Unknown required isolation blocks concurrency; otherwise safe serial work may continue.

Send one independently executable vertical slice. Tell the recipient it is already dispatched and must not rerun parent routing or delegate further. Include only what it needs to act safely:

```text
Work: <exact WorkRef>
Objective: <bounded outcome or review target and comparison>
Authority: <exact owner sections or paths>
Read: <needed sources and supporting references within the allowed boundary>
Write: <allowed write boundary>
Verify: <required verification boundary>
Known facts: <only decisive current facts>
Prohibited actions: <explicit denials>
Stop conditions: <when to return without continuing>
Replay caution: <only when repeating effects may be unsafe>
```

For direct work, identify the bounded request instead of inventing a WorkRef. Supply source locations and decisive facts, not copied method bodies. Distinguish the review target from supporting references. Workers load their methods and inspect actual sources and applicable instructions; Core retains result validation.

Omit empty optional fields. Do not attach host lifecycle schemas, correlation identifiers, JSON transport contracts, evaluator instructions, token targets, or acceptance fields. Workers receive no implied focus, lifecycle, Git, publication, deployment, approval, or nested-delegation authority. Nested delegation is prohibited unless the task explicitly grants a bounded descendant role and the parent remains responsible for its work and result.

Reuse a host-resumable worker only while goal, role, authority, writer boundary and evidence remain compatible; otherwise send a complete fresh task. Pass changed facts explicitly, never hidden inheritance as authority. After interruption use [recovery](coordination-recovery.md) to inspect effects and re-establish host facts before dispatch.

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

Derive host facts from observations, not prose, handles, elapsed time, topology or passing tests. Missing observations remain unavailable. Host facts create no RSP domain objects. Workers cannot certify their own identity, independence, resource release, evidence validity or acceptance.

For required delegation, Core must have an attributable worker-authored result covering the assigned boundary. For required independent Verify or Review, host observations must establish distinct workers from the accepted implementation. If not, acceptance remains `incomplete`. Core cannot author or substitute the missing result.

When one worker owns Fix and ordinary checks, Core validates the result before deriving `evidence-complete`. Reuse applicable observations and checks; required Review still independently judges the actual target. Integration or changed inputs require affected checks. Archive and commit keep separate gates. Corrections return through [Core review convergence](coordination-review.md), not a worker-local loop.

Host completion, transport shape or passing tests alone cannot establish acceptance; use the actual result and host facts above.
