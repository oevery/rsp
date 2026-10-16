---
name: rsp
description: Coordinate authorized direct, Change or Group work; select capabilities and accept results while executors load their methods. Retain recovery and evidence and prepare delivery without treating completion as closure.
license: MIT
metadata:
  author: oevery
  version: "2026.10.16.8"
---

# RSP Core

Carry the authorized request through capability selection, execution, applicable evidence and needed knowledge updates. Core owns the goal, work boundary, cross-capability decisions and result acceptance; capabilities own their methods. Explicit capability invocation needs no prior Core execution. Use Core when available and fallback only otherwise; inspecting either as audit data does not activate a second workflow.

## Select the work and responsibility

Read nearest instructions and relevant CONTEXT, then resolve intent, authority and existing owner evidence before mutation. Use known paths and discover missing context as needed. An explicit WorkRef wins; multiple focus markers alone do not block work. Preserve dirty work and its ownership. Before switching owners, compare overlapping product and durable-knowledge paths; overlap does not transfer authority.

- **Direct:** a clear bounded request needing no durable continuity. Create no Change and run no tracking preflight merely to execute it.
- **Change:** one delivery/acceptance boundary needing sustained work or cross-session recovery. Read its six sections and relevant Specs; Focus is only a sparse recovery pointer.
- **Group:** independently acceptable/deliverable child Changes with dependencies or integration obligations. Read the Brief then select a child; the Brief is not executable work. File count, complexity and agent count alone do not create a Group.

For tracked identities missing from context, load the [work model](references/work-model.md). Missing required tracking is a gap, not a reason to relabel work Direct. Use rsp status when current owner, dependency or recovery information is needed; use JSON for exact dependency data. Resolve needed settings through the selected CLI's successful rsp config --json summary and reuse until relevant drift or recovery. Raw YAML is diagnostic, not a substitute; projection failure blocks only choices depending on unknown settings. Required dependency checks and fresh archive readiness remain binding.

Select capabilities from their descriptions and the task contract. Executors load applicable methods and inspect sources; Core consults method details when needed for its own work or a concrete coordination question. Select the responsibility needed now:

- rsp-shape: bounded read-only design or authorized planning; reopen planning only for material unresolved choices.
- rsp-implement: diagnosis, authorized implementation or accepted-finding correction, including ordinary own checks.
- rsp-doc: substantive document/Skill writing, needed knowledge writeback and final Change reconciliation.
- rsp-verify: a requested declared-evidence result or a separately required verification obligation; ordinary implementation checks stay with Implement.
- rsp-review: fixed-scope read-only judgment or explicitly bounded structural discovery. Supporting checks remain within that review.
- rsp-commit: separately authorized exact local delivery; required for Git execution, with no Core substitute if unavailable.

A phase, role or method change adds no mandatory tool call, worker, review or test run. Continue authorized same-scope work without a generic continuation request. Required review, independent execution and protected operations retain their obligations. For ownerless release checks require the exact candidate, check contract, baseline and effects authority; do not invent a Change or Verify owner.

## Execute and reconcile evidence

Implement owns ordinary self-checks. Main-agent inspection can assess results, but an implementation participant cannot certify required independent review. Select extra Verify/Review only when requested, required or supported by concrete risk, not per task or per worker automatically.

Reuse traceable observations, checks and reviews while their target, acceptance boundary and relevant inputs remain applicable. Role changes and delivery-scope confirmation alone invalidate nothing; changed code, dependencies, configuration, tools or environment invalidate affected evidence. Excluded worktree changes can invalidate evidence for a staged slice. Normative Specs and executable Skills can change behavior even when stored as Markdown.

Core checks actual paths, diff, outcomes, omissions and evidence applicability without routinely replaying executor checks. Independent semantic review may consume implementer test evidence; separately required independent execution must actually run. Keep command, result, tested boundary and decisive source with existing evidence owners. Preserve failures, unavailable checks and superseded results; no new evidence ledger is needed.

For required correction/re-review, load [review convergence](references/coordination-review.md). Batch compatible findings into one correction, run covering checks, then review finding resolution and new risks in the correction. Stop for changed scope/authority, unsafe replay, missing required capability, non-convergence or no new discriminating evidence. Required failures remain incomplete.

Dependent writes require successful prerequisites; observe each required result rather than relying on a batch's final exit status. Recover tool failures within unchanged authority, inspecting uncertain effects before safe replay. Named checks and Commit's one-attempt rule remain binding.

## Coordinate only when needed and allowed

Work shape does not choose agent topology. Automatic delegation defaults off. An explicit worker request or binding independent-worker requirement permits that bounded dispatch; otherwise resolve workflow.delegation before automatic delegation. When auto is enabled, the user or main agent chooses zero, one or multiple execution workers. RSP has no worker-count tiers or maximum; host constraints still apply.

Load [worker coordination](references/coordination.md) for actual dispatch, dependencies/shared-resource arbitration or required independent workers. Keep tightly coupled work local; never simulate missing worker identity or independence. Workers do not delegate further by default. Main retains integration and result acceptance; child passes do not establish integration coverage.

Load [interruption recovery](references/coordination-recovery.md) for pause/resume or unsettled host effects, and [focus continuation](references/focus-continuation.md) for a recovery snapshot. Cross-session continuation refreshes current authority, owner, applicable status, Git index, dirty paths, evidence applicability and replay safety. Cancelling a wait does not stop workers or release resources.

## Maintain records and prepare delivery

During execution update Tasks/Verify directly for actual outcomes when scope, contract, design and knowledge remain accurate. Passing checks or recovery alone adds no whole-document rewrite. Routine narration stays in the conversation; retained execution evidence stays with its existing owner. Focus is replaceable recovery guidance, never acceptance or authority.

Ordinary completion leaves Change open. A checkpoint commit also leaves it open. A generic commit request does not establish final delivery. At an established final-delivery boundary or explicit close request, load [delivery closeout](references/closeout.md): workflow.closeout is ask (default), auto or manual. No setting grants Git, push, publication, deployment, approval or human acceptance authority.

For necessary stable-knowledge updates, load [durable writeback](references/durable-review.md) to establish facts, update their owners and reconcile affected records. Final delivery or closure additionally requires whole-Change convergence and consistency checks. Reuse applicable evidence and fill missing or invalidated coverage and separately required review. Already-accurate records need no edit; current readiness is a lifecycle observation, not semantic acceptance.

Operate command-owned state through RSP commands. Persist only open and archived; derive readiness and routing. A complete Task list never closes work. Reopen is exceptional recovery requiring explicit authority: load [reopen recovery](references/reopen-recovery.md) only when actually needed.

Other conditional procedures:

- [Setup and repair](references/setup-repair.md) for initialization, audit or repair.
- [Groups and dependencies](references/groups-dependencies.md) for grouped work.
- [Context migration](references/context-migration.md) when a root/relevant legacy CONTEXT-MAP.md is found or migration requested; preserve context, discovery alone grants no migration.
- [Conflict handling](references/conflict-handling.md) for an intersecting Git operation.

## Return the result

Follow explicit response language, personal instructions, then conversation language. Existing artifacts retain their language; new artifacts follow explicit instruction, effective project settings, scoped instructions, then conversation language. Keep identifiers and machine values exact; load [language details](references/response-language.md) only for contested choices.

Report the outcome, decisive evidence, material limits and needed next action. Distinguish observed effects, checks, review and acceptance; unverified claims stay unverified. Missing Required evidence blocks only dependent completion. No mandatory phase receipts or repeated logs. Load [control outcome](references/control-outcome.md) only for a consumer needing its technical rendering. For unfinished work retain only the owner, authority, evidence, blocker and safe continuation needed by the next actor.
