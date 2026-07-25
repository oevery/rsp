---
name: rsp-manage
description: Continue one explicitly requested bounded managed goal across ready RSP Changes or shallow Change Groups while ordinary work stays on Core and Discipline paths.
license: MIT
metadata:
  author: oevery
  version: "2026.07.25.7"
---

# RSP Manage

Manage one selected ready Change or shallow Change Group only after the user explicitly requests managed continuation. Keep RSP artifacts as durable truth and process data transient. The goal and allowed mutations form a transient authority envelope.

## Qualify before mutation

Before dispatch, read each qualified WorkRef—including successors—complete Change or Brief/children, Specs/Decisions, authority, `rsp status --json`, and worktree.

Eligible Change needs independent scopes, long continuation, or recovery; Group needs two ready children or long/recovery. Small, coupled, or worker-only work is ineligible. Decline without mutation/controller artifact; return Core/Discipline action.

Preserve unrelated work. Release identity needs explicit authority. Allow four worker dispatches and one corrective retry across the whole managed run; owner transitions do not reset them.

## Dispatch owned work

Send a compact envelope: WorkRef, objective, authority, evidence, stop boundary. For a Group, dispatch child WorkRefs only in the derived `plan.waves` wave. Parallelize independent mutations; shared paths, lockfiles, generated artifacts, and integration outputs overlap unless an authorized isolated workspace exists. Keep blockers, later waves, overlaps, and dependent verification sequential. Workers receive no implied focus, lifecycle, Git, publication, deployment, or approval authority. Choose the cheapest decisive check and one integration gate at most.

## Continue from evidence

Inspect diff and verification before accepting results. After progress, rerun `rsp status --json`; for a Group restrict it to declared children and follow its ready wave.

At owner boundaries, Core re-derives from goal. Continue a clear in-scope ready successor. Stop only when neither a ready successor nor clearly missing ownership remains. Otherwise suspend dispatch and return evidence to Core; Core routes Shape and requalifies without another authorization round. Manage neither classifies discovery nor changes topology.

Stop when discovery changes behavior, acceptance, public interfaces, scope, mutation, or external authority. Ignore unrelated improvements. Retry only evidenced corrections. During recovery, reread authority and evidence. Never create controller status, retry graphs, receipts, or parallel lifecycle state.

## Preserve boundaries

Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records. Changes retain converged requirements, outcomes, evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Never persist the goal envelope, WorkSet, waves, or discovery classification.

Close lifecycle before commit unless user or nearer instructions reserve or deny it. For Change, after Core durable review run `rsp archive <change-work-ref>` and inspect the complete lifecycle diff. For shallow Group, durable-review/archive each child independently, rederive completion, then when all children plus Group gate pass run `rsp group close <group>`; inspect the complete lifecycle diff after each mutation. This includes terminal owners. Stop unless review and clean boundaries are proven.

Decide commit separately. With downstream work, the managed request authorizes one recovery checkpoint unless user or nearer instructions reserve or deny commits: stage exact owned paths, inspect cached boundary, commit one reviewable Change or integration-coupled wave, then derive status. Terminal small owners default to no commit. A terminal non-small owner commits only for explicit delivery or evidenced recovery value when nearer rules allow. Without clean exact boundary, return without staging. Archive grants no Git or publication authority.

Push is opt-in only when user explicitly mentions push and remote, branch, and Group or goal milestone are unambiguous or accepted. Push at that milestone, or earlier only for required remote CI, recovery, or collaboration. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at remote boundary. Return to Core before a separate release operation and dedicated release commit.

Stop at owner decisions, unavailable dependencies, missing authority, failed verification, drift, or limits. Return WorkRefs, verification, omissions, boundary owner, and next action. Do not expose retry chronology or claim unobserved completion.
