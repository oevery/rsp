# Interruption and recovery

Load this reference only for a progress or status inquiry, explicit pause or release, an environment or verification stop, or resume from continuation pointers.

Treat a progress or status inquiry as an update, not a stop signal: report current evidence and continuing intent, then continue authorized work after the update while authority, verification, and blockers still permit it. For an explicit pause, interrupt active workers and confirm they have stopped before acknowledging the pause, keep the focused WorkRef selected, and do not mutate again until resume. Only an explicit release or unfocus request clears owner selection; ordinary pause and blockers preserve focus.

When an environment or verification boundary stops dispatch, preserve the focused owner. Update the Change only with durable blocker and verification facts, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Treat continuation prose only as pointers. On resume, reread the current authority, status, focused owner, worktree diff, blockers, and decisive evidence; mark stale or unverifiable claims pending and revalidate the selected handoff before mutation or worker dispatch. Never persist a paused state, worker registry, controller ledger, or execution chronology.
