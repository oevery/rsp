---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.07.28.4"
---

# RSP Manage

Manage one ready Change or shallow Group selected by Core from an explicit request or effective `manage.activation: auto`. Keep artifacts durable and process data transient. The goal defines authority; automatic activation grants selection, not mutation.

## Qualify before mutation

Before dispatch, read all of the following:

- every qualified WorkRef, including clear in-scope successors;
- the complete owning Change, or the Group Brief and its children;
- relevant Specs and Decisions;
- the authority envelope, `rsp status --json`, and the current worktree.

Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual`.

A Change is eligible when at least one of these independent conditions holds:

- its work contains genuinely independent slices;
- the authorized continuation is prospectively long; or
- the continuation is interruption recovery.

Lack of parallel work does not disqualify a long continuation or recovery. Derive "long" before dispatch from the authorized objective and expected phases, never from elapsed time. A Group is eligible when it has at least two ready children, or when the continuation qualifies as long or recovery. A small coupled one-step Change and worker-only work are ineligible. Decline Manage without any mutation and without creating a controller artifact, then return the exact Core or Discipline action.

Preserve unrelated work and require an explicit release identity. Allow four worker dispatches and one worker corrective retry across the whole managed run. Owner transitions do not reset either limit.

## Dispatch owned work

Send a compact envelope that identifies the WorkRef, objective, authority, decisive evidence, and stop boundary. For a Group, dispatch child WorkRefs only in the current derived `plan.waves` wave. Assume shared paths, lockfiles, generated artifacts, and integration outputs overlap unless an authorized isolated workspace exists. Keep blockers, later waves, overlaps, and dependent verification sequential. Workers receive no implied focus, lifecycle, Git, publication, deployment, or approval authority. Choose the cheapest decisive check and at most one integration gate.

## Continue from evidence

Inspect diff and verification before accepting results; rerun `rsp status --json`. For a Group restrict it to declared children.

At owner boundaries, Core re-derives from goal. Continue a clear in-scope ready successor. Stop only when neither a ready successor nor clearly missing ownership remains. Otherwise suspend dispatch and return evidence to Core; Core routes Shape and requalifies without another authorization round. Manage neither classifies discovery nor changes topology.

Stop when discovery changes behavior, acceptance, interfaces, scope, mutation, or external authority. Retry only evidenced corrections. During recovery, reread authority and evidence. Never create controller status or parallel lifecycle state.

## Converge managed review

After fixed-scope re-review, Core correlates the report with the selected Change, original authority, fresh verification, and transient pass count. An `accepted` Finding starts another Resolve Findings pass without asking the user to continue only when it remains inside the original behavior, acceptance, paths, mutation authority, and verification budget. Resolve Findings never self-loops.

Allow at most three Resolve Findings passes per Change, separate from the worker retry limit. Stop when the same Finding remains after two completed corrections. Also stop for `needs-clarification`; a material product, interface, or scope change; new mutation or external authority; an additional real-host, provider, or network run outside existing verification authority; or failed or unavailable decisive verification. Return one owner input. Treat an eligible in-scope Finding as `correction-needed`, not an external blocker. Keep counts and correction chronology transient.

## Preserve boundaries

Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records. Changes retain converged requirements, outcomes, evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Never persist the goal envelope, WorkSet, waves, or discovery classification.

Closeout requires Core-selected, currently-qualified Manage. For declined, unavailable, or unselected Manage, every `manage.closeout` preset is dormant; Core may report readiness/next action, but configuration executes neither archive nor commit. Earlier qualification does not carry forward.

Qualified only: effective `manage.closeout` is an automatic grant ceiling narrowed by nearer restrictions and host enforcement. `manual` grants neither automatic archive nor commit. `lifecycle` grants lifecycle closeout after Core durable review but no Git action. `local` grants lifecycle closeout, separately justified recovery checkpoints, and the deterministic terminal route below. Explicit current-turn authority may allow a local action not automated by the preset; denial wins.

When granted, close lifecycle before any commit. Change: after Core durable review run `rsp archive <change-work-ref>` and inspect the complete lifecycle diff. For shallow Group: durable-review/archive each child independently, rederive completion, then when all children plus Group gate pass run `rsp group close <group>`; inspect the complete lifecycle diff after each mutation. This includes terminal owners. Require proven review/clean-boundaries.

Decide commit separately. Under `local` or explicit commit authority, downstream work may justify one recovery checkpoint: give `rsp-commit` owner, paths, evidence, lifecycle, and authority, then derive status. Terminal small owners default to no commit. After lifecycle closeout, a qualified `local` terminal non-small Change or Group with known owner and paths, fresh decisive verification, clean exact boundary, and no nearer denial routes exactly once to `rsp-commit`; do not require the user to repeat `commit`. An ambiguous, mixed, stale, or denied boundary stops without staging. Apply the same owner envelope to explicitly authorized Group/release commits; use Core fallback if Commit is unavailable. Archive grants no Git or publication authority.

Push is opt-in only when user explicitly mentions push and remote, branch, and Group or goal milestone are unambiguous or accepted. Push there, or earlier only for required remote CI, recovery, or collaboration. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at remote boundary. Return to Core before a separate release operation and dedicated release commit.

Stop on unavailable dependencies, missing authority, failed verification, drift, or limits. Return WorkRefs, verification, omissions, boundary owner, and next action. Do not expose retry chronology or claim unobserved completion.
