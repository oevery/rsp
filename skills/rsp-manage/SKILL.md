---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.07.29.3"
---

# RSP Manage

Manage one requested goal selected by Core from an explicit request or effective `manage.activation: auto`. Its transient Intake first resolves one owner state; only a `ready` result can enter managed execution for one ready Change or shallow Group. Once selected, this Skill solely owns interruption and resume, convergence, lifecycle and commit execution detail while Core's managed-routing reference retains preflight and requalification. Keep artifacts durable and process data transient. The goal defines authority; automatic activation grants selection, not mutation.

## Manage Intake

Before qualification or dispatch, Intake reads the requested goal, current selection, current status, relevant owner artifacts, authority envelope, and dirty-path evidence. It does not focus another owner, mutate a planning or product artifact, create a controller record, or dispatch a worker.

Intake returns exactly one response-only owner state with decisive evidence and the next owner:

- `ready` maps to canonical `OwnershipDisposition: ready`: one selected shape-ready Change or shallow Group owns the requested outcome. Continue to qualification.
- `needs-shape` maps to canonical `OwnershipDisposition: return-to-shape`: no sufficient ready owner exists for clear non-trivial work. Return `StopDisposition: return-to-shape` to Core; only Core may invoke Shape with independently granted planning-artifact authority, then re-read status and rerun Intake/preflight and qualification.
- `needs-owner` maps to canonical `OwnershipDisposition: ask-owner`: behavior, acceptance, interface, scope, mutation authority, external action, or human choice remains materially unresolved. Return `StopDisposition: ask-owner` with the one highest-impact owner question and resume through fresh Intake only after the owner answers.
- `out-of-goal` maps to canonical `OwnershipDisposition: reroute`: owner identity, topology, dirty-path ownership, or authority cannot safely establish the requested boundary. Return `StopDisposition: reroute`; Core must establish a new owner or authority boundary before continuing, without turning it into a product question.

Intake creates no Task, Blocker, worker envelope, frontier, ticket, run record, or synthetic WorkRef. It has no execution responsibility: only `ready` enters `## Qualify before mutation`.

The canonical `OwnershipDisposition` is exactly `ready`, `ask-owner`, `return-to-shape`, or `reroute`. Every return is one transient `ControlOutcome` containing phase, disposition, decisive evidence, next owner, required input when any, and its resume or rederivation rule.

## Qualify before mutation

After Intake returns `ready`, before dispatch, read all of the following:

- every qualified WorkRef, including clear in-scope successors;
- the complete owning Change, or the Group Brief and its children;
- relevant Specs and Decisions;
- the authority envelope, `rsp status --json`, and the current worktree.

Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual`.

A Change is eligible when at least one of these independent conditions holds:

- its work contains genuinely independent slices;
- prospective execution signals show more than one bounded phase or authority surface; or
- the continuation is interruption recovery.

Prospective signals are implementation followed by integration verification, managed review, or lifecycle work; cross-module or cross-process mutation; real-host, provider, or hardware verification; bounded finding convergence; or a clear ready successor. Lack of parallel work does not disqualify prospective or recovery work. Derive the signals before dispatch from the authorized objective and expected phases, never from elapsed time. A Group is eligible when it has at least two ready children, or when the continuation qualifies through prospective signals or recovery.

Under automatic activation, decline as direct one-step work only when all of these are true: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor. A selected ready completion or continuation that fails any one condition qualifies as non-small through automatic activation even when no separate prospective signal is obvious; do not leave the middle case unclassified. Worker-only work remains ineligible. Decline Manage without any mutation and without creating a controller artifact, then return the exact Core or Discipline action. Report `selected` or `declined` and its decisive qualification or exclusion; when dispatch applies, also report the concrete reason for sequential or parallel execution. Keep this reasoning transient.

Preserve unrelated work and require an explicit release identity. Allow four worker dispatches and one worker corrective retry across the whole managed run. Owner transitions do not reset either limit.

## Resolve the execution frontier

After Intake returns `ready` and Manage qualifies, classify every newly surfaced unknown before selecting work, in this fail-closed compatibility order: `out-of-goal` → `owner-decision` → `fog` → `evidence-needed` → `ready-to-execute`. The canonical `FrontierDisposition` is exactly `out-of-goal`, `owner-decision`, `fog`, `evidence-needed`, or `executable`; public `ready-to-execute` maps only to canonical `executable`.

- `out-of-goal` stops for topology or authority resolution with `StopDisposition: reroute`.
- `owner-decision` stops with the single highest-impact owner question when behavior, acceptance, public interface, scope, mutation authority, external action, or human acceptance is unresolved. Return `StopDisposition: ask-owner` and resume through fresh Intake after the answer.
- `fog` is not yet a precise question. Create no synthetic Task, Change, Blocker, or worker dispatch; return `StopDisposition: return-to-shape` to Core/Shape unless an independently ready owned slice can continue. Resume only after Shape confirms a ready owner and Core freshly rederives the route.
- `evidence-needed` is one precise factual question answerable without choosing any owner decision above. If evidence would cross one of those boundaries, take the applicable stop instead of selecting Fix.
- Canonical `executable` permits lane selection only after ownership, authority, and required evidence are settled.

`StopDisposition` is exactly `ask-owner`, `return-to-shape`, `reroute`, `retry-with-evidence`, `environment-blocked`, `verification-blocked`, or `capability-unavailable`. No stop disposition permits another worker dispatch, product mutation, lifecycle closeout, or Git action until its stated resume contract succeeds.

Every lane receives one transient `WorkerEnvelope` with these common fields: `WorkRef`, `lane`, `objective`, `current hypothesis` when one exists, `known evidence`, `allowed paths`, `allowed actions and commands`, `prohibited actions`, `comparison baseline`, `expected result schema`, and `stop conditions`. Never include token counts or context-size targets; they do not influence dispatch, authority, continuation, completion, or acceptance.

- Diagnose reuses `rsp-diagnose` and remains read-only until it returns a discriminating cause or an explicit no-cause result. Its result is exactly one of `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`; the receipt also gives decisive evidence and the next safe discriminating check when one exists.
- Inspect is a private Manager-only read-only lane. It gathers one independent evidence packet and may run alongside another read-only lane only when paths and verification resources are demonstrably isolated; otherwise keep it sequential. Its result is exactly one of `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`; the receipt also gives decisive evidence and the next safe discriminating check when one exists.
- Fix reuses `rsp-implement`, receives explicit in-scope mutation authority, and is the sole product writer at its mutation boundary. Separate Group child mutation boundaries may overlap only under the existing isolated workspace and verification rule. Its result is exactly one of `changed-same-scope`, `no-change`, or `boundary-changed`; the receipt also gives `worker identity` when the host exposes it, changed paths, and fresh verification evidence.
- Verify is a private Manager-only read-only lane and runs only for the Change-declared risk or after a failed correction. Its result is exactly one of `pass`, `failed-with-new-evidence`, `failed-without-new-evidence`, `unavailable`, or `boundary-changed`; the receipt also gives named checks, the observed diff boundary, `worker identity` when the host exposes it, and `independence: established | unavailable`. Fixed-scope review remains owned by `rsp-review`; Inspect and Verify are not public Skills.

Every receipt contains these common fields: `WorkRef`, `lane objective`, `effective authority`, `result`, `decisive evidence`, and `stop boundary`, plus the lane-specific fields above. Inspect the actual diff and fresh verification before acceptance. An evidence receipt triggers fresh status, preflight, and qualification rederivation before any later mutation or dispatch.

Independent Verify is established only when its worker identity and the accepted Fix worker identity are both available and different. If the host cannot establish that identity boundary, record `independence: unavailable`; ordinary read-only Verify may still run, but Manager must not claim independent verification.

Derive `AcceptanceDisposition` independently from execution; it is exactly `incomplete`, `evidence-complete`, or `review-clean`. A required worker that was not created, did not return a valid required receipt, returned `unavailable` or `boundary-changed`, or could not satisfy required independent verification keeps acceptance `incomplete`. Accepted required receipts plus fresh declared verification may derive only `evidence-complete`; only a clean fixed-scope durable review may then derive `review-clean`. An execution receipt never derives `review-clean` directly. An unavailable required implementation worker cannot be replaced by controller mutation, and ordinary Verify cannot satisfy an acceptance contract that requires independent Verify.

Keep frontier classification, lane choice, envelopes, receipts, dispatch and retry counts, concurrency reasoning, and resume chronology response-only. Converged requirements and design belong in the selected Change, real dependencies in `Blockers`, and durable facts or rationale in ordinary durable review. Create no frontier file, ticket map, ledger, registry, ambient hook, or numeric routing score.

Total worker dispatch remains at most four. Before starting an optional Diagnose or Inspect dispatch, derive the currently known required remaining worker obligations: count one Fix when accepted mutation is still required and count one Verify when the declared acceptance risk or a failed correction still requires worker verification. Start the optional dispatch only when the remaining dispatch capacity covers that dispatch plus every known required obligation; otherwise skip it and preserve the completion path, or stop when no decisive path fits. This is dynamic capacity protection, not a fixed per-lane allocation.

An evidenced failed correction permits at most one corrective retry. Start it only when new evidence makes another correction discriminating, the remaining dispatch capacity still covers the retry and every then-required Verify dispatch, and those remaining resources can still produce decisive acceptance evidence. A failure without new evidence, or a retry that cannot still be decisively verified, stops dispatch. Managed review remains at most three Resolve Findings passes per Change with separate accounting. Missing verification, drift, an authority boundary, or unavailable capability also stops dispatch. Use an explicit manual fallback only when it stays within the same owner and authority; Manager never absorbs an unavailable worker's unauthorized implementation.

## Dispatch owned work

Send a compact envelope that identifies the WorkRef, objective, authority, decisive evidence, and stop boundary. When the host supports workers and authorized implementation remains, dispatch at least one implementation worker; sequential execution does not permit the controller to absorb the whole implementation. The controller retains owner resolution, worker-result acceptance, integration verification, review convergence, lifecycle, and Git decisions.

When a required worker cannot be created, return `StopDisposition: capability-unavailable`, keep `AcceptanceDisposition: incomplete`, and stop. Absence of a dispatch event or receipt is never success, does not discharge the required obligation, and cannot be replaced by the controller claiming the worker's result.

For a Group, dispatch child WorkRefs only in the current derived `plan.waves` wave. Assume shared paths, lockfiles, generated artifacts, integration state, real hosts, provider sessions, and hardware resources overlap unless an authorized isolated workspace and verification boundary exist. Keep blockers, later waves, overlaps, and dependent verification sequential. Dispatch in parallel only for isolated mutation paths and verification resources; delegation never implies concurrency. Workers receive no implied focus, lifecycle, Git, publication, deployment, or approval authority. Choose the cheapest decisive check and at most one integration gate.

## Continue from evidence

Inspect diff and verification before accepting results; rerun `rsp status --json`. For a Group restrict it to declared children.

At owner boundaries, Core re-derives from goal. Continue a clear in-scope ready successor. Stop only when neither a ready successor nor clearly missing ownership remains. Otherwise suspend dispatch and return evidence to Core; Core routes Shape and requalifies without another authorization round. At that owner boundary, Manage neither classifies discovery nor changes topology. After a ready owner is confirmed, it classifies only execution-frontier unknowns and never absorbs Shape.

Stop when discovery changes behavior, acceptance, interfaces, scope, mutation, or external authority. Retry only evidenced corrections. During recovery, reread authority and evidence. If incomplete archived child acceptance belongs to a closed Group, require separate explicit lifecycle authority for `rsp group reopen <group> --reason <text>` before `rsp reopen <group>/<child>`; restore neither children nor dependents implicitly. Never create controller status or parallel lifecycle state.

## Handle interruption

Treat a progress or status inquiry as an update, not a stop signal: report current evidence and continuing intent, then continue authorized work after the update while authority, verification, and blockers still permit it. For an explicit pause, interrupt active workers and confirm they have stopped before acknowledging the pause, keep the focused WorkRef selected, and do not mutate again until resume. Only an explicit release or unfocus request clears owner selection; ordinary pause and blockers preserve focus.

When an environment or verification boundary stops dispatch, preserve the focused owner. Update the Change only with durable blocker and verification facts, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Treat continuation prose only as pointers. On resume, reread the current authority, status, focused owner, worktree diff, blockers, and decisive evidence; mark stale or unverifiable claims pending and requalify Manage before mutation or worker dispatch. Never persist a paused state, worker registry, controller ledger, or execution chronology.

## Converge managed review

After fixed-scope re-review, Core correlates the report with the selected Change, original authority, fresh verification, and transient pass count. An `accepted` Finding starts another Resolve Findings pass without asking the user to continue only when it remains inside the original behavior, acceptance, paths, mutation authority, and declared verification scope. Resolve Findings never self-loops.

Allow at most three Resolve Findings passes per Change, separate from the worker retry limit. Stop when the same Finding remains after two completed corrections. Also stop for `needs-clarification`; a material product, interface, or scope change; new mutation or external authority; an additional real-host, provider, or network run outside existing verification authority; or failed or unavailable decisive verification. Return one owner input. Treat an eligible in-scope Finding as `correction-needed`, not an external blocker. Keep counts and correction chronology transient.

## Preserve boundaries

Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records. Changes retain converged requirements, outcomes, evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Never persist the goal envelope, WorkSet, waves, or discovery classification.

Closeout requires Core-selected, currently-qualified Manage. For declined, unavailable, or unselected Manage, every `manage.closeout` preset is dormant; Core may report readiness/next action, but configuration executes neither archive nor commit. Earlier qualification does not carry forward.

Derive `CloseoutEligibility` independently; it is exactly `not-eligible`, `lifecycle-ready`, or `local-commit-ready`. Only `AcceptanceDisposition: review-clean` plus fresh owner, authority, exact diff, and decisive verification evidence can derive a ready value. Missing required worker creation, a missing or invalid required receipt, `unavailable`, `boundary-changed`, or unsatisfied required independent verification forces `AcceptanceDisposition: incomplete` and `CloseoutEligibility: not-eligible`; neither archive nor commit runs.

Qualified only: effective `manage.closeout` is an automatic grant ceiling narrowed by nearer restrictions and host enforcement. `manual` grants neither automatic archive nor commit. `lifecycle` grants lifecycle closeout after Core durable review but no Git action. `local` grants lifecycle closeout, separately justified recovery checkpoints, and the deterministic terminal route below. Explicit current-turn authority may allow a local action not automated by the preset; denial wins.

When granted, close lifecycle before any commit. Change: after Core durable review run `rsp archive <change-work-ref>` and inspect the complete lifecycle diff. For shallow Group: durable-review/archive each child independently, rederive completion, then when all children plus Group gate pass run `rsp group close <group>`; inspect the complete lifecycle diff after each mutation. This includes terminal owners. Require proven review/clean-boundaries.

Decide commit separately. Under `local` or explicit commit authority, downstream work may justify one recovery checkpoint: give `rsp-commit` owner, paths, evidence, lifecycle, and authority, then derive status. Terminal small owners default to no commit. After lifecycle closeout, a qualified `local` terminal non-small Change or Group with known owner and paths, fresh decisive verification, clean exact boundary, and no nearer denial routes exactly once to `rsp-commit`; do not require the user to repeat `commit`. An ambiguous, mixed, stale, or denied boundary stops without staging. Apply the same owner envelope to explicitly authorized Group/release commits; use Core fallback if Commit is unavailable. Archive grants no Git or publication authority.

Push is opt-in only when user explicitly mentions push and remote, branch, and Group or goal milestone are unambiguous or accepted. Push there, or earlier only for required remote CI, recovery, or collaboration. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at remote boundary. Return to Core before a separate release operation and dedicated release commit.

Stop on unavailable dependencies, missing authority, failed verification, drift, or limits. When accepted work remains, preserve the focused owner unless explicit release or owner-conflict resolution requires otherwise, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Do not expose retry chronology or claim unobserved completion.
