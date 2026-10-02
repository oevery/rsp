# Coordinated lifecycle and delivery closeout

Load only after current coordination qualification when closeout eligibility begins, or for an explicitly authorized recovery checkpoint or push request. Core retains its incomplete-or-drifted fail-safe. Ordinary continuous execution does not activate this preset.

Distinguish checkpoint from terminal delivery before deriving CloseoutEligibility. A checkpoint requires its exact authorized current slice and fresh applicable verification; it does not require completed Change acceptance or archive and never claims them.

## Establish terminal eligibility

Derive CloseoutEligibility as not-eligible, lifecycle-ready or local-commit-ready. After final Change convergence, required durable writeback and fixed-scope review, run rsp ready <change-work-ref> --json for every terminal Change and require completionGate: pass plus archiveReady: yes.

That machine gate is necessary, not semantic acceptance. Also require review-clean acceptance, fresh owner and authority, exact diff and decisive Required verification. Optional coverage warnings remain visible but do not block. Otherwise eligibility is not-eligible and neither automatic archive nor terminal commit runs. Human acceptance remains separate.

Effective manage.closeout is an automatic ceiling narrowed by nearer restrictions and host enforcement:

- manual: no automatic archive or commit.
- lifecycle: lifecycle closeout after clean fixed-scope review and complete durable writeback; no Git action.
- local: lifecycle closeout and exactly one Commit route for an eligible terminal non-small clean exact boundary, without another user request.

Explicit current-turn authority may permit a local action outside the preset's automation; denial wins.

## Complete authorized lifecycle actions

Complete granted terminal lifecycle closeout before the terminal delivery boundary. For a Change run rsp archive <change-work-ref> and inspect the complete lifecycle diff. For a shallow Group:

1. Archive each child independently and inspect each complete lifecycle diff.
2. Re-derive completion. Every declared Integration: condition needs fresh evidence; a request-only boundary must be written back to the Brief.
3. Run rsp group close <group> only after every child and Group gate passes, then inspect its diff.

Explicit commit authority alone never grants archive. Direct delivery and checkpoints skip this branch. Command-owned lifecycle operations keep their RSP command; do not copy or delete archives to bypass a tool problem.

## Route exact delivery separately

Under local or explicit commit authority, downstream work may justify one recovery checkpoint. Send rsp-commit a compact delivery request:

```text
kind: direct | change | integration | group | release
purpose: checkpoint | terminal
work: WorkRef, Group, release, or direct summary
refs: real WorkRefs when applicable
paths: exact allowed paths
verify: fresh decisive evidence pointer
auth: current local authority
life: lifecycle evidence only when required
```

- Terminal small owners default to no automatic commit. Qualified local terminal non-small Changes/Groups route once to default core rsp-commit after lifecycle closeout.
- Integration needs at least two real WorkRefs, one evidenced shared boundary, exact paths, fresh verification and local authority; create no Group.
- Ambiguous, mixed, stale or denied boundaries stop without staging. Unavailable Commit returns capability-unavailable; Core does not stage or commit.
- Archive grants no Git/publication authority. If Commit fails after archive, report archived but undelivered; preserve lifecycle without automatic reopen or history rewrite.

Push is opt-in only when the user explicitly mentions push and the remote, branch, and milestone are unambiguous or accepted. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at the remote boundary. Return to Core before a separate release operation and dedicated release commit.
