# Managed routing

Load this reference only for a requested completion or continuation that is not a report-only review or release operation and is either explicitly managed or has effective `manage.activation: auto` in status. Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual` and must remain visible.

## PREFLIGHT — resolve the owner

Treat the requested goal and independently allowed planning and product mutations as a transient authority envelope. Automatic activation grants controller selection only and never adds planning or product-mutation authority. Resolve the smallest sufficient owner before testing Manage eligibility.

Before focusing, dispatching, or mutating a different WorkRef, inspect dirty paths and the diff against the prior owner's declared and observed product or durable-truth paths. Overlap never changes owner implicitly: continue the same open WorkRef, explicitly reopen its archived acceptance when authorized and applicable, use an explicitly authorized integration owner, or stop for boundary resolution. Disjoint authorized work may proceed without staging or a forced commit; insufficient ownership evidence stops the transition.

- Reuse one unambiguous selected ready owner.
- Return tiny settled work to direct engineering without a synthetic Change or controller artifact.
- For clear non-trivial work with no sufficient ready owner, an explicit managed request authorizes only in-scope RSP planning artifacts unless the user requests no edits. Under automatic activation, route to Shape only when the current request or nearer authority independently permits those artifacts; configuration alone never does. Then re-read status/readiness and re-evaluate without another authorization round.
- If repository evidence leaves a material product, acceptance, public-interface, scope, mutation-authority, external-action, or human choice, Shape returns the single highest-impact owner decision and creates no implementation or controller artifact.

A prior direct report, tiny, or small route is not sticky. Before later-turn mutation, rederive from the now-authorized objective and prospective work. Material expansion into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, or lifecycle delivery requires Core to establish or reuse the smallest sufficient WorkRef and rerun this preflight plus fresh Manage qualification before mutation. Unchanged tiny/small follow-ups remain direct; elapsed time and message count alone never trigger escalation.

PREFLIGHT is complete only when one selected ready Change or shallow Group owns the requested outcome and no material decision remains.

## QUALIFY — select or decline Manage

Select `rsp-manage` only for one selected ready Change or shallow Group that qualifies through at least one independent path: genuinely independent slices, prospectively long authorized continuation, or interruption recovery. A Change with long/recovery work does not also need independent or parallelizable slices. Derive “long” before dispatch from the authorized objective and its expected phases; elapsed wall-clock minutes are never qualification evidence. Small coupled one-step work and worker-only work remain ineligible and return to ordinary Core or Discipline action. Automatic routing is policy-selected, bounded by the requested goal, and not inferred from readiness alone.

## CONTINUE — rederive from evidence

After accepted managed progress, re-read `rsp status --json` and apply PREFLIGHT again.

- Continue a clear in-scope ready successor.
- When ownership is clearly missing, Manage suspends dispatch and returns discovery evidence to Core. Shape keeps a cohesive correction in its Change, gives one independently verifiable and archivable result one Change, or gives at least two such results sharing one goal one shallow Group. Core then requalifies without another authorization round.
- Stop naturally only when neither a ready successor nor clearly missing ownership remains.
- Stop earlier for a material behavior, acceptance, public-interface, scope, mutation-authority, external-action, or human decision.

Never persist the goal envelope, WorkSet, waves, discovery classification, or transition chronology.

## CONVERGE — bound review correction

After a managed fixed-scope re-review, correlate the report, selected Change, original authority, fresh verification, and transient convergence count. Return an in-scope `accepted` remaining or new Finding as `correction-needed` to another bounded Resolve Findings pass without asking the user to continue. Resolve Findings never self-loops.

Allow at most three Resolve Findings passes per Change and stop earlier when the same Finding remains after two completed corrections. Stop for `needs-clarification`, material behavior/interface/scope or authority change, verification-budget expansion, an additional real-host/provider/network run outside existing authority, failed or unavailable decisive verification, or repeated non-convergence. Never persist the convergence count or correction chronology.

## CLOSE — apply the bounded preset

Enter CLOSE only when Core selected and QUALIFY accepted Manage for the current continuation. If Manage was declined, unavailable, or unselected, every `manage.closeout` preset is dormant: ordinary Core may report readiness and the explicit next lifecycle or Git action, but configuration executes neither archive nor commit. Do not infer the current-continuation gate from readiness, an earlier managed run, or project policy alone; keep the selection and qualification result transient.

After that gate passes, use effective `manage.closeout` as an automatic grant ceiling, narrowed by nearer restrictions and host enforcement. `manual` grants neither automatic archive nor commit. `lifecycle` grants lifecycle closeout after Core durable review but no Git action. `local` adds separately justified recovery checkpoints and the deterministic terminal route below. Explicit current-turn authority may allow a named local action that the preset does not automate; denial still wins.

When lifecycle closeout is granted, archive a Change after Core durable review. A shallow Group independently reviews and archives each child, re-derives completion, then runs `rsp group close <group>` only after every child and the Group gate pass. Inspect the complete lifecycle diff after each mutation, including terminal owners.

Decide Git delivery separately. Under `local` or explicit commit authority, accepted downstream work may justify an exact-path recovery checkpoint unless commits are reserved or denied. Terminal small work defaults to no commit. After lifecycle closeout, a qualified `local` terminal non-small Change or Group with a derived owner, allowed paths, fresh decisive verification, one clean exact boundary, and no nearer denial must be handed exactly once to `rsp-commit`; do not require the user to repeat `commit`. An ambiguous, mixed, stale, or denied boundary stops without staging. Commit owns structured message construction, one local commit, and post-commit observation; when unavailable, return the equivalent bounded Core manual action against the same owner.

Push requires an explicit user mention plus an unambiguous remote, branch, and milestone. Never force-push; preserve local commits on failure. Managed authority never includes publication, deployment, approval, or human acceptance.
