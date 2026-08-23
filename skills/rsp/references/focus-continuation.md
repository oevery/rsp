# Focus and continuation recovery

Load this reference only when a Focus Capsule exists, is inspected or mutated, reports warnings, accepted work needs a continuation, or a continuation resumes.

The optional bounded Markdown Focus Capsule is a Manager-owned recovery pointer, never selection, authority, acceptance, worker transport, or host runtime state. A portable commit-safe v1 capsule permits only one leading version comment, blank lines, exactly one non-empty single-line `Current`, `Evidence`, and `Next`, and at most one non-empty single-line `Resume check`; unknown non-empty lines or fields are invalid. It excludes worker identity, handles, machine-specific paths, raw worker messages, chronology, topology, authority, acceptance, logs, diffs, and duplicated Tasks.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. Preserve technical values; the continuation is not a second state store.

On same-session resume, reopen its pointers to authority and owned artifacts, inspect drift and replay safety, and refresh decisive evidence. On cross-session or cross-device resume, distrust transient worker and liveness claims and rederive authority, focus, baseline, dirty state, conflicting resources, blockers, evidence freshness, route, and Manage qualification before mutation.
