# Focus and continuation recovery

Load when tracked work needs a recovery snapshot, a Capsule needs inspection or replacement, or a portable continuation handoff is required. Same-session worker continuation alone uses [coordinated interruption and recovery](coordination-recovery.md), not this format. Short direct tasks need no new WorkRef or Capsule.

Core owns the selected WorkRef's optional recovery snapshot. At a pause, handoff or recovery-relevant checkpoint, create or replace it only when the existing snapshot is insufficient or stale. Keep only context unavailable from the Change, current workspace or existing evidence whose loss would make continuation unsafe or require costly repeated discovery. Ordinary same-session progress needs no update. Refer to Change items rather than maintain another task, verification or blocker list; a delivery blocker belongs in Change, with only missing operational detail here.

Retain the current recovery position, necessary evidence pointers, next action and resume conditions. Unfinished experiments, pending cleanup and operations with uncertain effects may matter; a ruled-out approach needs only its still-applicable conclusion when repeating it would be costly. Do not record command sequences, attempts, repair/test rounds or how the diagnosis evolved. Use `rsp focus <work-ref> --capsule-file <path|->` to replace the snapshot as facts change, not append history.

Remove notes when their obligations are discharged, obsolete or safely transferred to their existing owner. Do not clear unresolved effects or hard-to-reconstruct safety context merely to shorten the snapshot. An empty capsule file clears notes while retaining the focus marker; cleanup alone does not authorize unfocus, closure or deletion of evidence. Respect nearer mutation restrictions. For Group work use the selected child's Capsule, not a Group marker.

The existing v1 format is bounded to 4096 UTF-8 bytes: one leading `<!-- rsp-focus:v1 -->`, blank lines, exactly one non-empty single-line `Current`, `Evidence`, `Next`, and at most one non-empty single-line `Resume check`. No other non-empty lines are valid. Keep raw logs/diffs, runtime identifiers, host paths, credentials and execution history out. The marker path selects work; its notes grant no authority or acceptance and are never worker transport or controller state.

Before closeout, use the [durable-writeback sequence](durable-review.md) to establish outcome facts and update their owners as needed. No useful Focus addition requires no edit; recovery obligations still need disposition before clearing the marker. Detailed evidence stays with its existing owner, never solely in the Capsule.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkOwner`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. A Change WorkOwner uses its WorkRef; a Group WorkOwner uses its Group reference and direct child Changes. Preserve technical values; the continuation is not a second state store.

For same-session, cross-session or cross-device resume, follow [interruption and recovery](coordination-recovery.md#resume-from-effects-not-tool-status) before continuing from this snapshot. That method owns drift, evidence applicability, replay safety and re-establishing current authority and host facts.
