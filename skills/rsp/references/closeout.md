# Final delivery and lifecycle closeout

Load for an established final-delivery boundary, an explicit close request, or a delivery question requiring checkpoint classification. Ordinary completion never activates closeout. A generic commit request defaults to a checkpoint unless final delivery is already established; checkpoints keep Change open and require only the authorized slice and applicable evidence.

## Decide closure independently of Git

Use the validated workflow.closeout setting from rsp config --json:

- ask (default): prepare a concrete final boundary, applicable evidence and required knowledge/Change updates, then ask whether to close before terminal staging. Reuse explicit closure authority already granted; do not ask twice.
- auto: close eligible work at established final delivery without another closure request, subject to nearer denial.
- manual: close only on an explicit close request. Authorized final commits may leave work open and must report that fact.

Explicit refusal keeps work open. A decision to leave it open does not block an otherwise authorized commit. Neither policy, readiness nor archive grants Git authority. An explicit standalone close request can close eligible work without a commit. Do not interpret finishing implementation, a pass, a successor task or elapsed time as final delivery.

## Reconcile the final boundary

1. Confirm exact delivery scope and inspect existing evidence for that boundary.
2. Apply [durable writeback](durable-review.md): necessary stable knowledge first, final Change reconciliation second. These can be one operation with no edits when already current.
3. Fill missing or invalidated checks and separately required review. Reuse applicable results; ordinary record cleanup does not invalidate code tests. Changed normative contracts and executable Skills need affected checks/judgment. Fresh independent review is not a universal closeout prerequisite.
4. For each Change to close, obtain current rsp ready <work-ref> --json with completionGate: pass and archiveReady: yes. Also require accurate final records, completed or unnecessary knowledge updates, applicable Required evidence and every separately required review. Readiness alone does not establish semantic acceptance.

Missing Required evidence, active blockers or contradictory contracts prevent closure. Optional omissions remain visible. Fresh authority, owner and exact Git/lifecycle observations remain necessary even when tests are reused.

## Close only when authorized

Use rsp archive <work-ref>, then inspect the exact resulting archive and entire lifecycle diff, including Focus removal and any cleanup warning. Use the returned archive filename with the selected WorkRef's archive directory (.rsp/archives/ for an ungrouped Change, .rsp/archives/<group>/ for a child); do not guess a date, suffix or directory. Expand read-only discovery only if output or effects are incomplete or contradictory, without replaying the mutation.

For a Group, archive eligible authorized children independently, reconcile the Brief and integrated evidence, then run rsp group close <group> after every child and Group gate passes. Request-only integration conditions must first be recorded in the Brief; child passes alone do not prove integration.

Never delete or copy lifecycle files to bypass commands. If archive succeeds but commit fails, report the archived, uncommitted state. Do not automatically reopen, rewrite history or repeat uncertain mutations.

## Route exact delivery separately

With explicit local commit authority, route to rsp-commit with the delivery kind (direct, change, integration, group or release), purpose (checkpoint or terminal), real owner/WorkRefs, exact paths, applicable verification and lifecycle evidence only when applicable. No transport schema or duplicate receipt is required.

Integration requires at least two real WorkRefs and one shared delivery boundary but creates no Group. Ambiguous, mixed, stale or denied boundaries stop before staging. Missing Commit capability has no Core fallback. Commit audits the exact index and owns Git execution.

Push requires explicit authority and an unambiguous remote, branch and milestone. Never infer it from commit or closure; no force push or automatic publication. Remote failure preserves local commits and stops at that boundary.
