# Interruption and recovery

Load this reference only for a progress or status inquiry, explicit pause, an environment or verification stop, or resume from continuation pointers.

Treat a status inquiry as an update, not a stop signal. Report current evidence and continuing intent, then continue while authority, verification, and blockers permit it. Host liveness signals and elapsed time do not change a Discipline result or justify cancelling healthy work.

For an explicit pause, use the host's available interruption mechanism and confirm active workers or owned background processes have stopped before acknowledging the pause. Cancelling the caller's wait does not itself stop accepted work. Until stop is observed, do not start conflicting mutation or verification. A terminal message or partial output does not prove that owned work has ended.

Preserve the focused owner and focused WorkRef during ordinary pause or blockers. Only an explicit release or unfocus request, archive, or another authorized lifecycle action changes selection. Update the Change only with accepted outcomes, decisive verification, and durable blockers.

Manager may atomically replace the focused marker's optional Focus Capsule at a meaningful checkpoint. A valid v1 capsule contains one version declaration, exactly one single-line `Current`, `Evidence`, and `Next`, and at most one single-line `Resume check`. Exclude worker identities, host handles, machine-specific paths, raw messages, retry chronology, topology, authority, acceptance, logs, diffs, and duplicated Tasks. The capsule is a recovery pointer, never worker coordination, authority, or acceptance.

On resume, inspect actual effects before repeating work. An idempotent action may repeat after boundary inspection; an action requiring inspection must first check its prior effects; a non-repeatable action stops for recovery or owner input. Resume a compatible worker only when the host supports it and current authority, scope, writer boundary, strategy, and evidence still match. Otherwise send a complete fresh task.

For cross-session or cross-device recovery, distrust transient worker and liveness claims. Reread current authority, focused owner, status, checkout diff, dirty paths, blockers, execution location, and decisive evidence before mutation or delegation. Validate the selected handoff again, revalidate required verification, and re-establish any host evidence needed for worker attribution or independent verification. Host completion without an attributable required worker result keeps acceptance incomplete. Current authority always wins.

If incomplete archived child acceptance belongs to a closed Group, recovery requires separate explicit lifecycle authority for `rsp group reopen <group> --reason <text>` before `rsp reopen <group>/<child>`. Restore neither children nor dependents implicitly.
