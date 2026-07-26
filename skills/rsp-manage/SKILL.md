---
name: rsp-manage
description: Continue one bounded managed goal selected explicitly or by effective project policy across ready RSP Changes or shallow Change Groups.
license: MIT
metadata:
  author: oevery
  version: "2026.07.26.1"
---

# RSP Manage

Manage one selected ready Change or shallow Change Group after Core selects it from an explicit managed request or effective `manage.activation: auto` policy. Keep RSP artifacts as durable truth and process data transient. The requested goal defines the authority envelope; automatic activation grants selection only, not mutation authority.

## Qualify before mutation

Before dispatch, read each qualified WorkRef—including successors—complete Change or Brief/children, Specs/Decisions, authority, `rsp status --json`, and worktree. Missing configuration preserves `explicit` activation with `local` closeout compatibility; invalid configuration fails closed as `explicit` plus `manual` and remains an error.

Eligible Change needs independent scopes or long/recovery; Group needs two ready children or long/recovery. Small, coupled, or worker-only work is ineligible. Decline without mutation/controller artifact; return Core/Discipline action.

Preserve unrelated work; release identity needs explicit authority. Allow four worker dispatches and one worker corrective retry across the whole managed run; owner transitions do not reset them.

## Dispatch owned work

Send a compact envelope: WorkRef, objective, authority, evidence, stop boundary. For a Group, dispatch child WorkRefs only in the derived `plan.waves` wave. Parallelize independent mutations; shared paths, lockfiles, generated artifacts, and integration outputs overlap unless an authorized isolated workspace exists. Keep blockers, later waves, overlaps, and dependent verification sequential. Workers receive no implied focus, lifecycle, Git, publication, deployment, or approval authority. Choose the cheapest decisive check and one integration gate at most.

## Continue from evidence

Inspect diff and verification before accepting results; rerun `rsp status --json`. For a Group restrict it to declared children.

At owner boundaries, Core re-derives from goal. Continue a clear in-scope ready successor. Stop only when neither a ready successor nor clearly missing ownership remains. Otherwise suspend dispatch and return evidence to Core; Core routes Shape and requalifies without another authorization round. Manage neither classifies discovery nor changes topology.

Stop when discovery changes behavior, acceptance, interfaces, scope, mutation, or external authority. Retry only evidenced corrections. During recovery, reread authority and evidence. Never create controller status or parallel lifecycle state.

## Converge managed review

After Address Review returns a fixed-scope re-review, Core correlates its report, selected Change, original authority, fresh verification, and transient pass count. When a remaining or new Finding is `accepted` and stays inside the original behavior, acceptance, affected paths, mutation authority, and verification budget, start another bounded Address Review pass without asking the user to continue. Address Review never self-loops.

Allow at most three Address Review passes per Change, separate from worker retry, and stop earlier when the same Finding remains after two completed corrections. Also stop for `needs-clarification`, material product/interface/scope change, new mutation or external authority, an additional real-host/provider/network run outside existing verification authority, or failed/unavailable decisive verification. Return the single required owner input. Treat an eligible in-scope Finding as `correction-needed`, not an external blocker. Keep counts and correction chronology transient.

## Preserve boundaries

Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records. Changes retain converged requirements, outcomes, evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Never persist the goal envelope, WorkSet, waves, or discovery classification.

Effective `manage.closeout` is an automatic grant ceiling narrowed by nearer restrictions and host enforcement. `manual` grants neither automatic archive nor commit. `lifecycle` grants lifecycle closeout after Core durable review but no Git action. `local` grants lifecycle closeout plus the existing exact-path local checkpoint or terminal-commit eligibility. Explicit current-turn authority may allow a local action not automated by the preset; denial wins.

When granted, close lifecycle before any commit. For Change, after Core durable review run `rsp archive <change-work-ref>` and inspect the complete lifecycle diff. For shallow Group, durable-review/archive each child independently, rederive completion, then when all children plus Group gate pass run `rsp group close <group>`; inspect the complete lifecycle diff after each mutation. This includes terminal owners. Stop unless review and clean boundaries are proven.

Decide commit separately. Under `local` or explicit commit authority, downstream work may justify one recovery checkpoint: stage exact owned paths, inspect cached boundary, commit one reviewable Change or integration-coupled wave, then derive status. Terminal small owners default to no commit. A terminal non-small owner commits only for explicit delivery or evidenced recovery value when nearer rules allow. Without clean exact boundary, return without staging. Archive grants no Git or publication authority.

Push is opt-in only when user explicitly mentions push and remote, branch, and Group or goal milestone are unambiguous or accepted. Push at that milestone, or earlier only for required remote CI, recovery, or collaboration. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at remote boundary. Return to Core before a separate release operation and dedicated release commit.

Stop on unavailable dependencies, missing authority, failed verification, drift, or limits. Return WorkRefs, verification, omissions, boundary owner, and next action. Do not expose retry chronology or claim unobserved completion.
