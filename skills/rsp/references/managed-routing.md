# Managed routing

Load this reference only for a requested completion or continuation that is not a report-only review or release operation and is either explicitly managed or has effective `manage.activation: auto` in status. Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual` and must remain visible.

## INTAKE — resolve the owner without execution

Use this route after Core has preserved the fixed-scope Review, release, isolated Design, and tiny settled-work exceptions. Under `manage.activation: explicit`, select Intake only for an explicitly managed request. Under `manage.activation: auto`, select Intake for every other requested completion or continuation that does not satisfy the complete small-work exclusion: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor.

Treat the requested goal and independently allowed planning and product mutations as a transient authority envelope. Automatic activation grants controller selection only and never adds planning or product-mutation authority. Intake resolves the smallest sufficient owner before testing Manage eligibility, without focusing another owner, dispatching work, or mutating durable or product state.

Before focusing, dispatching, or mutating a different WorkRef, inspect dirty paths and the diff against the prior owner's declared and observed product or durable-truth paths. Overlap never changes owner implicitly: continue the same open WorkRef, explicitly reopen its archived acceptance when authorized and applicable, use an explicitly authorized integration owner, or stop for boundary resolution. Disjoint authorized work may proceed without staging or a forced commit; insufficient ownership evidence stops the transition.

Invoke `rsp-manage` Intake and consume its canonical `ControlOutcome`. Canonical ready ownership identifies one unambiguous selected shape-ready Change or shallow Group and proceeds to QUALIFY. Any returned stop hands its next owner, required input, and resume rule back to Core without implementation or controller mutation. Core invokes Shape only when that outcome returns ownership to Shape and the current request or nearer authority independently permits in-scope RSP planning artifacts; configuration alone never does. After a ready owner is confirmed, Core re-reads status and repeats Intake selection and qualification without another authorization round. Product or authority decisions remain with their returned owner, while topology, selected-owner, dirty-path, or authority-boundary failures return to Core for rerouting rather than being converted into product questions.

A prior direct report, design, tiny, or small route is not sticky. Before later-turn mutation, rederive from the now-authorized objective and prospective work. Material expansion into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, bounded review convergence, lifecycle delivery, or a clear ready successor requires Core to establish or reuse the smallest sufficient WorkRef and rerun Intake selection plus fresh Manage qualification before mutation. Unchanged tiny/small follow-ups remain direct; elapsed time and message count alone never trigger escalation.

Intake creates no Task, Blocker, worker envelope, frontier, ticket, run record, or synthetic WorkRef. Its compatibility labels, exact canonical mappings, response schema, and detailed resume contracts are owned only by `rsp-manage`.

## QUALIFY — select or decline Manage

Select `rsp-manage` only for one selected ready Change or shallow Group that qualifies through at least one independent path: genuinely independent slices, interruption recovery, or prospective execution signals showing more than one bounded phase or authority surface. Prospective signals are implementation followed by integration verification, managed review, or lifecycle work; cross-module or cross-process mutation; real-host, provider, or hardware verification; bounded finding convergence; or a clear ready successor. A Change with prospective or recovery work does not also need independent or parallelizable slices. Derive these signals before dispatch from the authorized objective and expected phases; elapsed wall-clock minutes are never qualification evidence.

Under automatic activation, bias non-small continuation toward Manage. Decline as direct one-step work only when all of these are true: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor. A selected ready completion or continuation that fails any one of these conditions qualifies as non-small through this automatic path even when no separate prospective signal is obvious; do not leave the middle case unclassified. Worker-only work remains ineligible. Readiness alone does not qualify work without a requested completion or continuation, and automatic routing remains bounded by the requested goal.

Make the route observable: report `selected` with the decisive qualification signal, or `declined` with the complete direct-work exclusion and exact Core or Discipline action. If dispatch applies, report the concrete overlap/isolation evidence that makes it sequential or parallel. Selection, decline, and dispatch reasoning remain transient and create no controller state.

## REQUALIFY — rederive the route from evidence

When selected execution returns to Core at an owner boundary or resume, re-read `rsp status --json`, apply Intake selection again, then rerun QUALIFY before any later mutation or dispatch. Treat the continuation only as pointers and invalidate stale or unverifiable claims. This reference selects or declines the next controller route; selected execution remains wholly owned by `rsp-manage`.

- A clear in-scope ready successor may qualify under the same goal.
- Clearly missing ownership returns discovery evidence to Core; Shape owns any authorized topology change, after which Core requalifies without another authorization round.
- A material behavior, acceptance, public-interface, scope, mutation-authority, external-action, or human decision stops requalification for its owner.

Never persist the goal envelope, WorkSet, waves, discovery classification, or transition chronology.

## Dormant closeout fail-safe

If Manage was declined, unavailable, or unselected, every `manage.closeout` preset is dormant: ordinary Core may report readiness and the explicit next lifecycle or Git action, but configuration executes neither archive nor commit. Readiness, an earlier managed run, or project policy never substitutes for current selection and qualification. After selection, stop using this reference for execution detail; `rsp-manage` solely owns interruption and resume, convergence limits, lifecycle and commit execution, and all corresponding authority stops.
