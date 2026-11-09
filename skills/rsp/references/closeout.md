# Final delivery and lifecycle closeout

Load for an established final-delivery boundary, an explicit close request, or a tracked commit whose Tasks are complete. Inspect actual remaining work and correct inaccurate records before classification. Task completion triggers a closure decision, not archive eligibility; missing or failed checks do not suppress the decision. Ordinary completion without a delivery request leaves work open. Reuse an explicit applicable checkpoint or closure choice. Checkpoints keep Change open and require their own applicable evidence.

## Decide closure independently of Git

Use the validated workflow.closeout setting from rsp config --json:

- ask (default): inspect the concrete boundary, existing evidence and specific gaps, then ask before staging whether to finish necessary checks and records, archive when eligible and commit if authorized, or make only an eligible checkpoint and leave work open. Do not require every check or final-record update before asking. A selected conditional closeout authorizes its necessary preparation and eligible archive; do not ask again when gates pass.
- auto: prepare closeout for a completed-task delivery or established final delivery and close only eligible work, subject to nearer denial.
- manual: close only on an explicit close request. Authorized final commits may leave work open and must report that fact.

Explicit refusal keeps work open. A decision to leave it open does not block an otherwise authorized, verified commit. Neither policy, readiness nor archive grants Git authority. An explicit standalone close request can close eligible work without a commit. A pass, a successor task or elapsed time alone selects no closure. After closeout is selected, resolve failures within existing authority; if blocked, report the gap without silently falling back to a checkpoint commit.

## Reconcile the final boundary

1. Confirm exact delivery scope and inspect existing evidence for that boundary.
2. Apply [durable writeback](durable-review.md): necessary stable knowledge first, final Change reconciliation second. These can be one operation with no edits when already current.
3. Fill missing or invalidated checks and separately required review. Reuse applicable results; ordinary record cleanup does not invalidate code tests. Changed normative contracts and executable Skills need affected checks/judgment. Fresh independent review is not a universal closeout prerequisite.
4. For each Change to close, obtain current rsp ready <work-ref> --json with completionGate: pass and archiveReady: yes. Also require accurate final records, completed or unnecessary knowledge updates, applicable Required evidence and every separately required review. Readiness alone does not establish semantic acceptance.

Missing Required evidence, active blockers or contradictory contracts prevent closure. Optional omissions remain visible. Fresh authority, owner and exact Git/lifecycle observations remain necessary even when tests are reused.

## Close only when authorized

Run rsp archive <work-ref>. Inspect the resulting archive and entire lifecycle diff, including Focus removal and cleanup warnings. Use the returned filename in the selected WorkRef's archive directory: .rsp/archives/ for an ungrouped Change, .rsp/archives/<group>/ for a child. Do not guess dates, suffixes or directories. Expand read-only discovery only for incomplete or contradictory output/effects; do not replay the mutation.

For a Group, archive eligible authorized children independently, reconcile the Brief and integrated evidence, then run rsp group close <group> after every child and Group gate passes. Request-only integration conditions must first be recorded in the Brief; child passes alone do not prove integration.

Never delete or copy lifecycle files to bypass commands. If archive succeeds but commit fails, report the archived, uncommitted state. Do not automatically reopen, rewrite history or repeat uncertain mutations.

## Route exact delivery separately

With explicit local commit authority, route to rsp-commit with the delivery kind (direct, change, integration, group or release), purpose (checkpoint or terminal), real owner/WorkRefs, exact paths, applicable verification and lifecycle evidence only when applicable. No transport schema or duplicate receipt is required.

Integration requires at least two real WorkRefs and one shared delivery boundary but creates no Group. Ambiguous, mixed, stale or denied boundaries stop before staging. Missing Commit capability has no Core fallback. Commit audits the exact index and owns Git execution.

Push requires explicit authority and an unambiguous remote, branch and milestone. Never infer it from commit or closure; no force push or automatic publication. Remote failure preserves local commits and stops at that boundary.
