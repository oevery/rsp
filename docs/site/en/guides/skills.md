# Skills and managed work

RSP publishes a default suite of twelve host-neutral Skills for on-demand loading. Each has a narrow authority boundary and returns its result to an existing project or RSP owner.

| Skill | Responsibility |
|---|---|
| `rsp` | Derive the next action; guide setup, durable writeback, and archive decisions. |
| `rsp-shape` | Shape one executable Change or justified shallow Group. |
| `rsp-design` | Resolve one bounded domain, module/seam, or evidence-seeking design question. |
| `rsp-implement` | Implement one selected ready Change with fresh verification. |
| `rsp-diagnose` | Establish a cause, or return a truthful unresolved diagnosis, before correction. |
| `rsp-tdd` | Drive one justified behavior through RED, GREEN, and safe REFACTOR. |
| `rsp-verify` | Run one bounded read-only verification pass against a selected Change's declared evidence boundary. |
| `rsp-review` | Review a fixed code, document, or mixed comparison without mutation. |
| `rsp-resolve-findings` | Dispose fixed findings, correct accepted ones, verify, and request re-review. |
| `rsp-commit` | Create one authorized exact-scope local commit. |
| `rsp-release-docs` | Draft, audit, finalize, or reconcile an explicit release documentation surface. |
| `rsp-manage` | Coordinate one eligible long-running, recovery, or multi-slice continuation. |

`rsp-structural-audit` is an optional report-only project Skill. It audits one bounded repository or subtree before implementation authority is granted.

Installation, runtime role, and invocation are separate:

| Skills | Distribution | Runtime role | Invocation |
|---|---|---|---|
| `rsp` | default | Core | direct project entry |
| `rsp-shape` | default | Shape | Core-routed or explicit shaping |
| Design, implementation, diagnosis, TDD, verification, review, finding resolution, and Release Docs | default | Discipline | Core-routed specialist or explicit bounded request |
| `rsp-commit` | default | local-delivery Discipline | Core- or Manage-routed after an authorized exact boundary |
| `rsp-manage` | default | Controller | Core-selected from an explicit request or effective project policy |
| `rsp-structural-audit` | optional | Discovery | explicit report-only request |

`default` means installed with the suite; it does not mean automatically invoked. Ordinary Discipline Skills do not recursively orchestrate user-facing flows. Only a Core-qualified Manage controller composes bounded worker lanes.

## Compose the suite from evidence

- Shape establishes the executable owner.
- Design answers one material question and returns to that owner.
- Diagnose precedes TDD when a failure is unexplained.
- TDD is selected only when explicitly required or when a concrete changed risk makes pre-mutation RED materially safer.
- Verify executes one declared read-only evidence boundary; Manage retains worker identity, independence, acceptance, and closeout.
- Review remains read-only; Resolve Findings owns accepted correction.
- Release Docs requires an explicit confirmed release operation.
- The host, user, and Git own execution-location selection and cross-branch integration. Manage operates only in the checkout or environment it actually observes; no canonical Skill selects or lands an execution environment.
- Commit owns one exact local commit in the current checkout and never absorbs cherry-pick, cleanup, or cross-branch integration.
- No Skill infers commit, push, publication, deployment, approval, or human-acceptance authority.

## Control outcomes

RSP uses a transient Skill Control Model to explain the current decision without creating a persisted controller state. Core chooses one peer route: a specialist Discipline, bounded direct execution, managed execution, return to Shape, or stop. A specialist route ends at one explicitly bounded Discipline result. A direct route orchestrates one non-managed completion or continuation and may name exactly one Discipline executor without making it a controller. Managed is the only route that composes worker lanes and review convergence. Direct execution remains valid for one ready owner, one writer, one execution phase, one integrated decisive check, no recovery, no independent acceptance obligation, no managed lifecycle coordination, and no ready successor. Multiple files or documentation surfaces alone do not change that route. Core may directly mutate only RSP control-plane state; product mutation belongs to Implement or the same bounded manual Discipline action.

Work ownership, decision ownership, transient handoff, execution uncertainty, and acceptance are separate concepts. `WorkOwner` means the selected Change or shallow Group, `DecisionOwner` means the human or authority source required for a material decision, and `NextOwner` means the next control or execution capability. A stop must say who acts next, what input is required, and whether work returns through Shape or Core, or waits for fresh evidence, environment, verification, or capability. Missing required worker creation or a missing valid receipt is unavailable evidence, never successful completion.

Three review-related gates remain distinct:

- Implementation verification supplies fresh evidence after every mutation.
- Fixed-scope change review is the report-only Review comparison. It is required when explicitly requested, required by project authority or risk, or needed for managed `review-clean`; it is not automatically required for every tiny direct action.
- The durable writeback decision is required before archive and independently decides whether stable current facts or lasting rationale must update a Spec, scoped instruction, or Decision Record. It never substitutes for fixed-scope change review.

These outcomes exist only in the current response and host execution context. Changes and Groups remain the durable owners, and their lifecycle remains `open` or `archived`.

## Managed automation

Manage is a controller for work with an observable coordination obligation: independent slices, recovery, distinct execution and acceptance owners, real-host/provider/hardware verification, bounded review convergence, managed lifecycle work, a clear ready successor, or a real multi-phase authority boundary. File count, Specs, product presentation, public documentation, and verification files do not qualify it by themselves. Substantial sequential work still selects Manage when one of those real obligations exists.

```yaml
manage:
  activation: auto
  closeout: local
```

`activation` controls selection:

- `explicit`: Manage is selected only when explicitly requested.
- `auto`: after preserving specialist routes, Core resolves a ready owner and selects Manage only when current evidence shows one of the coordination obligations above; otherwise it continues the direct Core or Discipline route.

Core resolves one unambiguous shape-ready Change or shallow Group as the `WorkOwner` and solely owns initial Manage qualification plus the `selected | declined` route result. Missing or non-ready ownership routes directly to Shape under independent planning-artifact authority; Shape returns the ready WorkOwner to Core for fresh routing and never resumes Manage directly. Once selected, Manage validates handoff completeness and current owner, authority, and owned-diff drift without repeating direct-versus-managed eligibility. Ordinary same-scope receipts require actual-path and local-diff inspection; a normal Fix implementing declared acceptance does not trigger a complete owner reread. Wider rereads and return to Core occur only when discovery or a request changes declared behavior, acceptance, or a public-interface boundary, after another invalidation signal, cross-session recovery, or closeout.

During managed execution, newly surfaced uncertainty is classified in fail-closed order as out-of-goal, owner decision, fog, factual evidence needed, or ready to execute. Manage derives a transient `ExecutionFrame` and the smallest safe topology: direct, longitudinal worker reuse, sequential workers, parallel waves, read-only fan-out, bounded correction, or independent Verify. Each `Assignment` carries only the WorkRef, objective, exact authority references, Read/Write/Verify sets, bounded known facts, allowed and prohibited actions, stop conditions, and replay safety. Workers return a `Receipt` with result, changed paths, exact verification, omissions, boundary status, evidence validity, and resource release; they do not coordinate through the Focus Capsule. Token counts, elapsed time, polling, and progress-message counts never control dispatch, routing, authority, completion, or acceptance.

Diagnose and private Inspect lanes are read-only; Fix is the sole writer at its mutation boundary. A longitudinal primary worker is reused only while the owner, role, seam, strategy, and writer boundary remain compatible. Independent investigation, a strategy reset, unrelated slices, and independent Verify use a fresh worker. Manage routes verification through the `rsp-verify` result contract and may claim independent verification only when a worker identity distinct from Fix can be established; otherwise it reports independence as unavailable. There is no whole-run dispatch quota: each dispatch must serve a necessary bounded Assignment, while a failed same-scope Assignment permits at most three correction passes by default and stops earlier without new evidence or convergence. Independent Verify remains a separate acceptance obligation. Frames, sessions, assignments, receipts, resource leases, counts, and chronology remain transient.

`closeout` sets a ceiling after Manage has actually been selected and qualified:

- `manual`: archive and commit remain manual.
- `lifecycle`: after required fixed-scope change review is clean and the durable writeback decision is complete, archive may follow; commit remains separate.
- `local`: automatically archives an eligible, verified, non-small terminal managed boundary with a clean exact owned boundary and routes its exact paths once to local Commit without another user request.

Manage derives commit eligibility, timing, and the Commit envelope; `rsp-commit` exclusively owns exact staging, message construction, one local commit, and post-commit observation.

`activation` never grants planning or product-mutation authority. For a currently selected and qualified Manage run, `closeout` is only the automatic lifecycle/local-Git ceiling described above and nearer restrictions may narrow it. Push, tags, releases, publication, deployment, approval, human acceptance, and other external actions always remain explicit.

Managed interruption and resume do not create persisted controller or paused state. Machine heartbeat is separate from user-visible progress, and a healthy long-running worker or verification is not cancelled because a timer or message threshold passes. Explicit cancellation keeps exclusive resources claimed until the worker and owned background processes acknowledge the stop. Assignments declare replay safety as idempotent, inspect-before-repeat, or non-repeatable; long contexts may roll over only after accepted state is written back and the diff and evidence are inspected.

Manager may keep a sparse accepted-state Focus Capsule in the selected marker for recovery, but it remains pointers rather than authority. A commit-safe capsule contains only a version comment plus `Current`, `Evidence`, `Next`, and an exceptional `Resume check`; it excludes worker identities, process handles, machine paths, leases, raw receipts, logs, retries, topology, and authority. An ordinary intermediate commit for an open Change may include this marker and capsule, but cross-device availability still requires separately authorized Git transfer and fresh rederivation of authority, baseline, dirty state, blockers, resources, and evidence. Unfocus or archive removes the marker. Verification is lane-local first, affected or integration-scoped once at convergence, and fresh against Change-required evidence at closeout.

See [configuration](../reference/configuration.md) for the exact keys and [daily workflow](./daily-workflow.md) for ordinary operation.
