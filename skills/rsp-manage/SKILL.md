---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.08.05.2"
---

# RSP Manage

Manage one requested goal selected by Core from an explicit request or effective `manage.activation: auto`. Enter only with one selected shape-ready Change or shallow Group plus a transient handoff containing the goal, WorkRef, authority envelope, decisive qualification evidence, closeout ceiling, and return boundaries. Once selected, this Skill solely owns same-goal revalidation, interruption and resume, review convergence, acceptance, lifecycle closeout, and commit eligibility and orchestration. Exact staging, message construction, local commit execution, and post-commit observation remain owned by `rsp-commit`. Keep artifacts durable and process data transient. The goal defines authority; automatic activation grants selection, not mutation.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Selected-goal entry

Core resolves ownership before this Skill is entered. Manage has no pre-owner Intake and never creates, focuses, or reshapes a durable owner. Reject an incomplete handoff without mutation and return to Core with the missing owner, authority, qualification, closeout, or return-boundary evidence.

## Validate the selected handoff before mutation

Core and its managed-routing reference solely own initial Manage qualification and the `selected | declined` route result. Manage never repeats the direct-versus-managed eligibility test or declines a valid selected handoff back to an ordinary Core or Discipline action.

Before dispatch, validate the handoff against current evidence by re-reading all of the following:

- every selected WorkRef, including clear in-scope successors;
- the complete owning Change, or the Group Brief and its children;
- relevant Specs and Decisions;
- the authority envelope, `rsp status --json`, and the current worktree.

Validate only handoff completeness and current drift: the selected owner and topology still match, the requested goal and route are unchanged, the authority envelope still permits the next action, owned paths remain exact and unmixed, and the decisive qualification evidence has not been invalidated. If the handoff is incomplete, evidence has drifted, or a true owner, topology, route, behavior, acceptance, interface, scope, mutation-authority, or external-action-authority boundary changed, stop without mutation and return the decisive evidence to Core. Otherwise continue the selected managed goal without repeating qualification. When dispatch applies, report only the concrete reason for sequential or parallel execution. Keep validation and dispatch reasoning transient.

Preserve unrelated work and require an explicit release identity. Allow four worker dispatches and one worker corrective retry across the whole managed run. Owner transitions do not reset either limit.

## Resolve the execution frontier

After the selected handoff remains valid, classify every newly surfaced unknown before selecting work, in this fail-closed compatibility order: `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `ready-to-execute`. The canonical `FrontierDisposition` is exactly `out-of-goal`, `owner-decision`, `fog`, `evidence-needed`, or `executable`; public `ready-to-execute` maps only to canonical `executable`.

- `out-of-goal` stops for topology or authority resolution with `StopDisposition: reroute`.
- `owner-decision` stops with the single highest-impact question for its `DecisionOwner` when behavior, acceptance, public interface, scope, mutation authority, external action, or human acceptance is unresolved. Return `StopDisposition: ask-owner` to Core for fresh routing after the answer.
- `fog` is not yet a precise question. Create no synthetic Task, Change, Blocker, or worker dispatch; return `StopDisposition: return-to-shape` to Core and halt the current managed control phase. Only Core may route authorized Shape. Do not continue an independently ready slice, dispatch another worker, or mutate product state. Resume only after Shape confirms a ready owner and Core freshly rederives the route.
- `evidence-needed` is one precise factual question answerable without choosing any owner decision above. If evidence would cross one of those boundaries, take the applicable stop instead of selecting Fix.
- Canonical `executable` permits lane selection only after ownership, authority, and required evidence are settled.

`StopDisposition` is exactly `ask-owner`, `return-to-shape`, `reroute`, `retry-with-evidence`, `environment-blocked`, `verification-blocked`, or `capability-unavailable`. No stop disposition permits another worker dispatch, product mutation, lifecycle closeout, or Git action until its stated resume contract succeeds.

Every lane receives one transient `WorkerEnvelope` with these common fields: `WorkRef`, `lane`, `objective`, `current hypothesis` when one exists, `known evidence`, `allowed paths`, `allowed actions and commands`, `prohibited actions`, `comparison baseline`, `expected result schema`, `response language`, `localized control-narration rule`, and `stop conditions`. The narration rule requires human-facing receipt prose in the response language and preserves the exact result only as a secondary parenthesized or code-formatted token; it applies equally to private Inspect and Verify lanes that have no standalone Skill. Never include token counts or context-size targets; they do not influence dispatch, authority, continuation, completion, or acceptance.

- Diagnose reuses `rsp-diagnose` and remains read-only until it returns a discriminating cause or an explicit no-cause result. Its result is exactly one of `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`; the receipt also gives decisive evidence and the next safe discriminating check when one exists.
- Inspect is a private Manager-only read-only lane. It gathers one independent evidence packet and may run alongside another read-only lane only when paths and verification resources are demonstrably isolated; otherwise keep it sequential. Its result is exactly one of `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`; the receipt also gives decisive evidence and the next safe discriminating check when one exists.
- Fix reuses `rsp-implement`, receives explicit in-scope mutation authority, and is the sole product writer at its mutation boundary. Separate Group child mutation boundaries may overlap only under the existing isolated workspace and verification rule. Its result is exactly one of `changed-same-scope`, `no-change`, or `boundary-changed`; the receipt also gives `worker identity` when the host exposes it, changed paths, and fresh verification evidence.
- Verify is a private Manager-only read-only lane and runs only for the Change-declared risk or after a failed correction. Its result is exactly one of `pass`, `failed-with-new-evidence`, `failed-without-new-evidence`, `unavailable`, or `boundary-changed`; the receipt also gives named checks, the observed diff boundary, `worker identity` when the host exposes it, and `independence: established | unavailable`. Fixed-scope review remains owned by `rsp-review`; Inspect and Verify are not public Skills.

Every receipt contains these common fields: `WorkRef`, `lane objective`, `effective authority`, `result`, `decisive evidence`, and `stop boundary`, plus the lane-specific fields above. Its human-facing narration follows the envelope's response language; when that differs from a canonical result value, localize the primary result explanation and retain the exact result only as a secondary parenthesized or code-formatted token. Inspect the actual diff and fresh verification before acceptance. After every ordinary same-goal Fix, Verify, Review, or Resolve Findings receipt, re-read status, owner, authority, diff, blockers, and decisive evidence internally before any later mutation or dispatch. Do not return to Core merely to repeat route selection or qualification.

Independent Verify is established only when its worker identity and the accepted Fix worker identity are both available and different. If the host cannot establish that identity boundary, record `independence: unavailable`; ordinary read-only Verify may still run, but Manager must not claim independent verification.

Derive `AcceptanceDisposition` independently from execution; it is exactly `incomplete`, `evidence-complete`, or `review-clean`. Implementation verification, fixed-scope change review, and the durable writeback decision are separate gates. A required worker that was not created, did not return a valid required receipt, returned `unavailable` or `boundary-changed`, or could not satisfy required independent verification keeps acceptance `incomplete`. Accepted required receipts plus fresh declared verification may derive only `evidence-complete`; this verification is implementation verification. Only a clean fixed-scope change review may then derive managed `review-clean`. An execution receipt never derives `review-clean` directly; a verification receipt does not derive it either. The later durable writeback decision cannot substitute for fixed-scope change review. An unavailable required implementation worker cannot be replaced by controller mutation, and ordinary Verify cannot satisfy an acceptance contract that requires independent Verify.

Keep frontier classification, lane choice, envelopes, receipts, dispatch and retry counts, concurrency reasoning, and resume chronology response-only. Converged requirements and design belong in the selected Change, real dependencies in `Blockers`, and durable facts or rationale in the durable writeback decision. Create no frontier file, ticket map, ledger, registry, ambient hook, or numeric routing score.

Total worker dispatch remains at most four. Before starting an optional Diagnose or Inspect dispatch, derive the currently known required remaining worker obligations: count one Fix when accepted mutation is still required and count one Verify when the declared acceptance risk or a failed correction still requires worker verification. Start the optional dispatch only when the remaining dispatch capacity covers that dispatch plus every known required obligation; otherwise skip it and preserve the completion path, or stop when no decisive path fits. This is dynamic capacity protection, not a fixed per-lane allocation.

An evidenced failed correction permits at most one corrective retry. Start it only when new evidence makes another correction discriminating, the remaining dispatch capacity still covers the retry and every then-required Verify dispatch, and those remaining resources can still produce decisive acceptance evidence. A failure without new evidence, or a retry that cannot still be decisively verified, stops dispatch. Missing verification, drift, an authority boundary, or unavailable capability also stops dispatch. Use an explicit manual fallback only when it stays within the same owner and authority; Manager never absorbs an unavailable worker's unauthorized implementation.

## Dispatch owned work

Send a compact envelope that identifies the WorkRef, objective, authority, decisive evidence, and stop boundary. When the host supports workers and authorized implementation remains, dispatch at least one implementation worker; sequential execution does not permit the controller to absorb the whole implementation. The controller retains worker-result acceptance, integration verification, review convergence, lifecycle decisions, and commit eligibility and orchestration. It does not absorb Commit's exact Git procedure.

When dispatch cannot satisfy a required worker obligation, apply the AcceptanceDisposition rule above: return `StopDisposition: capability-unavailable`, keep acceptance `incomplete`, and stop. Absence of a dispatch event or receipt is never success, does not discharge the required obligation, and cannot be replaced by the controller claiming the worker's result.

For a Group, dispatch child WorkRefs only in the current derived `plan.waves` wave. Assume shared paths, lockfiles, generated artifacts, integration state, real hosts, provider sessions, and hardware resources overlap unless an authorized isolated workspace and verification boundary exist. Keep blockers, later waves, overlaps, and dependent verification sequential. Dispatch in parallel only for isolated mutation paths and verification resources; delegation never implies concurrency. Workers receive no implied focus, lifecycle, Git, publication, deployment, or approval authority. Choose the cheapest decisive check and at most one integration gate.

## Continue from evidence

Inspect diff and verification before accepting results; rerun `rsp status --json`. For a Group restrict it to declared children.

Continue a clear in-scope ready successor while the goal, WorkRef topology, route, behavior, acceptance, interface, scope, and authority remain unchanged. Return to Core only when owner identity, topology, requested route, behavior, acceptance, public interface, scope, mutation authority, or external-action authority changes. At that boundary, suspend mutation, return decisive evidence, and never classify discovery or change topology; only Core may route authorized Shape and freshly select the next path.

Stop when discovery changes behavior, acceptance, interfaces, scope, mutation, or external authority. Retry only evidenced corrections. During recovery, reread authority and evidence. If incomplete archived child acceptance belongs to a closed Group, require separate explicit lifecycle authority for `rsp group reopen <group> --reason <text>` before `rsp reopen <group>/<child>`; restore neither children nor dependents implicitly. Never create controller status or parallel lifecycle state.

Read [interruption and recovery](references/interruption-recovery.md) only for a progress or status inquiry, explicit pause or release, an environment or verification stop, or resume from continuation pointers.

Read [managed review convergence](references/review-convergence.md) only after a fixed-scope re-review returns Findings or when an accepted in-scope Finding may require another bounded Resolve Findings pass.

## Preserve boundaries

Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records. Changes retain converged requirements, outcomes, evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Never persist the goal envelope, WorkSet, waves, or discovery classification.

Closeout requires a Core-selected and qualified handoff that remains valid under current evidence. For declined, unavailable, unselected, incomplete, or drifted handoffs, every `manage.closeout` preset is dormant; Core may report readiness/next action, but configuration executes neither archive nor commit. Earlier qualification does not carry forward across a new continuation without a fresh Core route result.

Derive `CloseoutEligibility` independently; it is exactly `not-eligible`, `lifecycle-ready`, or `local-commit-ready`. Only `AcceptanceDisposition: review-clean` plus fresh owner, authority, exact diff, and decisive verification evidence can derive a ready value. Any other acceptance state derives `CloseoutEligibility: not-eligible`; neither archive nor commit runs.

Read [lifecycle and delivery closeout](references/closeout.md) only after `CloseoutEligibility` becomes ready, when an explicitly authorized recovery checkpoint is being considered, or when the user explicitly requests push. The reference owns preset application, lifecycle commands, Commit handoff, and remote delivery constraints; this Skill retains the fail-safe above before loading it.

Stop on unavailable dependencies, missing authority, failed verification, drift, or limits. When accepted work remains, preserve the focused owner unless explicit release or owner-conflict resolution requires otherwise, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Do not expose retry chronology or claim unobserved completion.
