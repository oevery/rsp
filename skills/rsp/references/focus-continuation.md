# Focus and continuation recovery

Load for tracked work needing ongoing recovery notes, meaningful checkpoint/handoff updates, Capsule inspection or continuation recovery. Short direct tasks need no new WorkRef or Capsule.

Core owns the selected WorkRef's replaceable working snapshot. When permitted by nearer scope, update it after accepted progress, evidence validity, a blocker or next action changes, or work pauses/transfers. Use `rsp focus <work-ref> --capsule-file <path|->`; replace, do not append. For Group work use the selected child's Capsule, not a Group marker. Empty markers remain valid.

The existing v1 format is bounded to 4096 UTF-8 bytes: one leading `<!-- rsp-focus:v1 -->`, blank lines, exactly one non-empty single-line `Current`, `Evidence`, `Next`, and at most one non-empty single-line `Resume check`. No other non-empty lines are valid. Record progress, evidence status/pointers, next action and recovery cautions. Exclude raw logs/diffs, worker IDs, host handles, credentials, machine paths and chronology. The marker path selects work; its notes grant no authority or acceptance and are never worker transport or controller state.

Before closeout, revalidate these notes and distill final results and remaining limits into Change; stable knowledge then goes to its justified document owner. Complete applicable verification, required review and readiness before authorized archive clears Focus. Detailed evidence stays with its existing owner, never solely in the Capsule.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkOwner`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. A Change WorkOwner uses its WorkRef; a Group WorkOwner uses its Group reference and direct child Changes. Preserve technical values; the continuation is not a second state store.

On same-session resume, reopen pointers to authority and owned artifacts, inspect drift and replay safety, and refresh decisive evidence. On cross-session or cross-device resume, distrust transient worker and liveness claims; rederive authority, owner, status/index, dirty state, conflicting resources, blockers, evidence freshness and any coordination qualification before mutation.
