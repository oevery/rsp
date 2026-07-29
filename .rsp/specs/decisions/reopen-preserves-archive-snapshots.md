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

An explicitly authorized reopen copies one exact archived owner back to its canonical open path under the same logical identity and retains the selected archive unchanged. An executable Change is focused and gains unfinished Task and Verify evidence describing the reason. A Group Brief is restored only into absent-or-empty Group work/focus subtrees, remains unfocused, and gains unfinished completion evidence bound to its exact source archive path and reason; an incomplete child is reopened only through a later separate command.

When more than one archive shares the identity, callers must select an exact inspected archive path; the CLI never infers the newest snapshot. Group publication rejects an evidence key already present in any retained Brief. Status requires one non-dropped key whose source path belongs to the current Group's retained Brief set and which is absent from every retained snapshot. This rejects nonexistent or cross-Group sources and distinguishes explicit continuation from replaying a closed Brief without adding persisted generation or controller state. Open work takes precedence over same-identity archives in current state. Reopen does not cascade into children or archived dependents. A closed Group and one incomplete child are two explicit lifecycle operations.

Use reopen only when fresh evidence invalidates the original acceptance. Genuinely new scope or a correction that needs an independent delivery record uses a new Change. Reopen is a lifecycle mutation and grants no Git, release, publication, deployment, approval, or history-rewrite authority.

## Alternatives Considered

- Always create a successor Change: preserves append-only history but fragments one incomplete outcome across owners and duplicates its working context.
- Move the archive back to open work: preserves one current file but removes the historical closeout snapshot from current archive queries.
- Select the newest archive automatically: is convenient but becomes unsafe and surprising after repeated archive generations.
- Reopen dependents, children, or the enclosing Group automatically: can invalidate already accepted work and expands lifecycle authority beyond the selected owner.
- Add a persisted Group generation or controller token: would make replay detection explicit but adds lifecycle state solely for recovery; exact source-path-bound evidence is sufficient within the retained archive model.

## Consequences

- One WorkRef may simultaneously have one authoritative open Change and multiple historical archive snapshots.
- Archive history remains append-only across reopen and rearchive cycles; exact paths disambiguate generations.
- Dependency and status projections must prefer open current work over matching historical snapshots.
- Users and managed automation must provide a reason and resolve the inserted unfinished evidence before the Change or Group Brief can be archived again.
- `rsp group create` remains forbidden for archived identity reuse; explicit Group reopen is continuation of the retained logical owner, not new work under an old name.
- Reopening the same retained path with the same reason after its evidence has entered history fails closed; a later retained snapshot or fresh reason creates a distinct evidence key.
