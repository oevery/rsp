---
title: Reopen Preserves Archive Snapshots
summary: Restore incomplete archived work under the same WorkRef without deleting historical closeout evidence.
kind: decision
status: accepted
---

# Reopen Preserves Archive Snapshots

## Context

Managed closeout can archive a Change after its planned verification passes, while a later real run can still show that the original acceptance or implementation was incomplete. Always creating a differently named corrective Change fragments one logical owner and loses the converged Proposal, Tasks, Verify, and evidence context. Moving an archive back to open work would recover that context but remove the completed snapshot from current history.

The archive store already supports multiple dated snapshots for one WorkRef, and dependency planning already distinguishes current open work from historical prerequisites.

## Decision

An explicitly authorized reopen copies one exact archived executable Change back to its canonical open path under the same WorkRef and retains the selected archive unchanged. The restored Change is focused and gains unfinished Task and Verify evidence describing the reopen reason.

When more than one archive shares the WorkRef, callers must select an exact inspected archive path; the CLI never infers the newest snapshot. Open work takes precedence over same-WorkRef archives in current dependency state. Reopen does not cascade into archived dependents and does not implicitly reopen a closed Change Group.

Use reopen only when fresh evidence invalidates the original acceptance. Genuinely new scope or a correction that needs an independent delivery record uses a new Change. Reopen is a lifecycle mutation and grants no Git, release, publication, deployment, approval, or history-rewrite authority.

## Alternatives Considered

- Always create a successor Change: preserves append-only history but fragments one incomplete outcome across owners and duplicates its working context.
- Move the archive back to open work: preserves one current file but removes the historical closeout snapshot from current archive queries.
- Select the newest archive automatically: is convenient but becomes unsafe and surprising after repeated archive generations.
- Reopen dependents or the enclosing Group automatically: can invalidate already accepted work and expands lifecycle authority beyond the selected Change.

## Consequences

- One WorkRef may simultaneously have one authoritative open Change and multiple historical archive snapshots.
- Archive history remains append-only across reopen and rearchive cycles; exact paths disambiguate generations.
- Dependency and status projections must prefer open current work over matching historical snapshots.
- Users and managed automation must provide a reason and resolve the inserted unfinished evidence before the Change can be archived again.
- Closed Group recovery remains a separate explicitly designed and authorized lifecycle operation.
