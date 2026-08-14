# Managed routing

Load this reference only for a requested completion or continuation that is not a report-only review or release operation and is either explicitly managed or has effective `manage.activation: auto` in status. Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual` and must remain visible.

## OWNER PREFLIGHT — Core resolves the owner without execution

Use this route after Core has preserved the fixed-scope Review, release, isolated Design, and tiny settled-work exceptions. Here fixed-scope Review means the explicit report-only fixed-scope change review. Under `manage.activation: explicit`, consider Manage only for an explicitly managed request. Under `manage.activation: auto`, consider it for every other requested completion or continuation that does not satisfy the complete small-work exclusion: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor.

Treat the requested goal and independently allowed planning and product mutations as a transient authority envelope. Automatic activation grants controller selection only and never adds planning or product-mutation authority. Core resolves the smallest sufficient owner before testing Manage eligibility, without dispatching work or mutating product state.

Before focusing, dispatching, or mutating a different WorkRef, inspect dirty paths and the diff against the prior owner's declared and observed product or durable-truth paths. Overlap never changes owner implicitly: continue the same open WorkRef, explicitly reopen its archived acceptance when authorized and applicable, use an explicitly authorized integration owner, or stop for boundary resolution. Disjoint authorized work may proceed without staging or a forced commit; insufficient ownership evidence stops the transition.

Core derives one ownership `ControlOutcome`. `WorkOwner` means the selected shape-ready Change or shallow Group. When one unambiguous ready WorkOwner exists, Core proceeds to QUALIFY. Missing or non-ready ownership uses `RouteDisposition: shape` only when the current request or nearer authority independently permits in-scope RSP planning artifacts; configuration alone never does. Shape returns the ready WorkOwner to Core, which re-reads status and freshly derives ownership, route, and qualification without another authorization round. A material product or authority decision stops with `StopDisposition: ask-owner` and names its `DecisionOwner`. An invalid WorkRef, topology, dirty-path, route, scope, or authority boundary stops with `StopDisposition: reroute` rather than converting it into a product question.

A prior direct report, design, tiny, or small route is not sticky. Before later-turn mutation, rederive from the now-authorized objective and prospective work. Material expansion into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, bounded review convergence, lifecycle delivery, or a clear ready successor requires Core to establish or reuse the smallest sufficient WorkRef and rerun owner preflight plus fresh Manage qualification before mutation. Unchanged tiny/small follow-ups remain direct; elapsed time and message count alone never trigger escalation.

Owner preflight creates no Task, Blocker, worker envelope, frontier, ticket, run record, or synthetic WorkRef. Manage has no pre-owner Intake and never creates, focuses, or reshapes the durable owner.

## QUALIFY — select or decline Manage

Select `rsp-manage` only for one selected ready Change or shallow Group that qualifies through at least one independent path: genuinely independent slices, interruption recovery, or prospective execution signals showing more than one bounded phase or authority surface. Prospective signals are implementation followed by integration verification, managed review, or lifecycle work; cross-module or cross-process mutation; real-host, provider, or hardware verification; bounded finding convergence; or a clear ready successor. A Change with prospective or recovery work does not also need independent or parallelizable slices. Derive these signals before dispatch from the authorized objective and expected phases; elapsed wall-clock minutes are never qualification evidence.

A Group qualifies when it has at least two ready children, or when the continuation qualifies through prospective signals or recovery.

Under automatic activation, bias non-small continuation toward Manage. A tracked completion spanning authoritative Specs, product presentation, public documentation, and multiple verification surfaces is multi-surface non-small work and reports `selected` even when one writer owns all mutations and dispatch must remain sequential. Writer count and lack of parallelism do not collapse multiple acceptance or authority surfaces into one local seam.

Decline as direct one-step work only when all of these are true: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor. A selected ready completion or continuation that fails any one of these conditions qualifies as non-small through this automatic path even when no separate prospective signal is obvious; do not leave the middle case unclassified. Worker-only work remains ineligible. Readiness alone does not qualify work without a requested completion or continuation, and automatic routing remains bounded by the requested goal.

Make the route observable: report `selected` with the decisive qualification signal, or `declined` with the complete direct-work exclusion and exact Core or Discipline action. If dispatch applies, report the concrete overlap/isolation evidence that makes it sequential or parallel. Selection, decline, and dispatch reasoning remain transient and create no controller state.

## HANDOFF AND RETURN — bound selected execution

Core and this reference solely own initial qualification and the `selected | declined` route result. Core hands selected Manage the goal, WorkRef, authority envelope, decisive qualification evidence, closeout ceiling, exact return boundaries, and any selected workspace boundary as transient control data. Manage validates handoff completeness and current owner, authority, and diff drift, but never repeats direct-versus-managed eligibility. Selected execution remains wholly owned by `rsp-manage`.

- Ordinary Fix, Verify, Review, or Resolve Findings receipts remain inside Manage for fresh same-goal revalidation.
- A clear in-scope ready successor under the unchanged owner topology and authority may continue inside the same managed goal.
- Owner identity, topology, requested route, behavior, acceptance, public interface, scope, mutation authority, or external-action authority changes return evidence to Core for fresh ownership and routing.
- Shape is entered only through Core when durable owner refinement is independently authorized.

Never persist the goal envelope, WorkSet, waves, discovery classification, or transition chronology.

## Dormant closeout fail-safe

If Manage was declined, unavailable, or unselected, every `manage.closeout` preset is dormant: ordinary Core may report readiness and the explicit next lifecycle or Git action, but configuration executes neither archive nor commit. Readiness, an earlier managed run, or project policy never substitutes for current selection and qualification. After selection, stop using this reference for execution detail; `rsp-manage` solely owns same-goal revalidation, interruption and resume, review convergence, acceptance, lifecycle closeout, commit eligibility and orchestration, and all corresponding authority stops. Exact staging, message construction, local commit execution, and post-commit observation remain owned by `rsp-commit`.
