# Coordinated interruption and recovery

Load this reference only for a progress or status inquiry, explicit pause, an environment or verification stop, or resume from continuation pointers.

Reread the complete owner and authority only on a real invalidation, recovery, cross-session continuation, or closeout boundary.

Treat a status inquiry as an update, not a stop signal. Report current evidence and continuing intent, then continue while authority, verification, and blockers permit it. Host liveness signals and elapsed time do not change a Discipline result or justify cancelling healthy work.

For an explicit pause, use the host's available interruption mechanism and confirm active workers or owned background processes have stopped before acknowledging the pause. Cancelling the caller's wait does not itself stop accepted work. Until stop is observed, do not start conflicting mutation or verification. A terminal message or partial output does not prove that owned work has ended.

Preserve the focused owner (`WorkOwner`) and focused child WorkRef when applicable during ordinary pause or blockers. Only an explicit release or unfocus request, archive, or another authorized lifecycle action changes selection. Update the Change only with accepted outcomes, decisive verification, and durable blockers.

When a Focus Capsule exists or is inspected or replaced, or accepted work needs a continuation, read [focus and continuation recovery](focus-continuation.md) for the portable format and handoff. The capsule is a recovery pointer, never worker coordination, authority or acceptance.

## Resume from effects, not tool status

Inspect actual effects before repeating work. An idempotent action may repeat after boundary inspection; an action requiring inspection must first check its prior effects; a non-repeatable action stops for recovery or owner input. An exit code or partial result alone does not prove that nothing happened. Unknown mutation blocks replay, not safe read-only observation.

A permitted method may change only while authority, owner, scope, baseline and required evidence remain the same. Named checks, provenance operations and required independent workers retain their declared obligations. Resume a compatible worker only when the host supports it and writer boundary, strategy and evidence also match; otherwise send a complete fresh task.

For cross-session or cross-device recovery, distrust transient worker and liveness claims. Reread current authority, focused owner, status and index, checkout diff, dirty paths, blockers, execution location, and decisive evidence before mutation or delegation. Validate the selected handoff again, revalidate required verification, and re-establish any host evidence needed for worker attribution or independent verification. Host completion without an attributable required worker result keeps acceptance incomplete. Current authority always wins.

For incomplete archived acceptance, read [reopen recovery](reopen-recovery.md) before any lifecycle mutation. It requires separate explicit lifecycle authority and owns exact archive selection and the closed-Group-before-child sequence. Restore neither children nor dependents implicitly.
