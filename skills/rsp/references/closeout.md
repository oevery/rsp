# Coordinated lifecycle and delivery closeout

Load only after current coordination qualification when closeout eligibility begins, or for an explicitly authorized recovery checkpoint or push request. Core retains its incomplete-or-drifted fail-safe. Ordinary continuous execution does not activate this preset.

Derive CloseoutEligibility independently as not-eligible, lifecycle-ready, or local-commit-ready. Before deriving a ready value, run rsp ready <change-work-ref> --json for every terminal Change and require completionGate: pass plus archiveReady: yes. Only that machine gate, review-clean acceptance, fresh owner, authority, exact diff, and decisive Required verification evidence can derive a ready value. Optional coverage warnings remain in the result but do not block. Any other acceptance state is not-eligible; neither archive nor commit runs. Human acceptance remains separate and unperformed unless explicitly established.

The effective manage.closeout is an automatic grant ceiling narrowed by nearer restrictions and host enforcement. manual grants neither automatic archive nor commit. lifecycle grants lifecycle closeout after clean fixed-scope review and a complete durable writeback decision but no Git action. local automatically grants lifecycle closeout and, for one eligible terminal non-small clean exact boundary, exactly one local Commit route without another user request. Explicit current-turn authority may allow a local action not automated by the preset; denial wins.

When granted, close lifecycle before any commit. For a Change, after clean review and durable writeback run rsp archive <change-work-ref> and inspect the complete lifecycle diff. For a shallow Group, archive each child independently, rederive completion, then run rsp group close <group> only after every child and Group gate passes. Every declared `Integration:` condition must have fresh evidence before it is marked complete; a request-only boundary must be written back to the Group Brief before closeout. Inspect the complete lifecycle diff after each mutation.

Decide commit eligibility separately. Under local or explicit commit authority, downstream work may justify one recovery checkpoint. Send rsp-commit a compact delivery request:

```text
kind: direct | change | integration | group | release
work: WorkRef, Group, release, or direct summary
refs: real WorkRefs when applicable
paths: exact allowed paths
verify: fresh decisive evidence pointer
auth: current local authority
life: lifecycle evidence only when required
```

Terminal small owners default to no commit. An integration request requires at least two real WorkRefs, one evidenced shared boundary, exact paths, fresh verification, and local authority; it does not create a Group. A qualified local terminal non-small Change or Group routes exactly once to rsp-commit after lifecycle closeout. Ambiguous, mixed, stale, or denied boundaries stop without staging. If Commit is unavailable, return capability-unavailable; Core does not stage or commit. Archive grants no Git or publication authority.

Push is opt-in only when the user explicitly mentions push and the remote, branch, and milestone are unambiguous or accepted. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at the remote boundary. Return to Core before a separate release operation and dedicated release commit.
