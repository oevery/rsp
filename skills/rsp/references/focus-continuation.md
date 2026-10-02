# Focus and continuation recovery

Load this reference only when a Focus Capsule exists, is inspected or mutated, reports warnings, accepted work needs a continuation, or a continuation resumes.

The optional bounded Markdown Focus Capsule is a Core-owned recovery pointer, never selection, authority, acceptance, worker transport, or host runtime state. Core may atomically replace it at a meaningful checkpoint. A portable commit-safe v1 capsule permits only one leading version comment, blank lines, exactly one non-empty single-line `Current`, `Evidence`, and `Next`, and at most one non-empty single-line `Resume check`; unknown non-empty lines or fields are invalid. It excludes worker identity, handles, machine-specific paths, raw worker messages, chronology, topology, authority, acceptance, logs, diffs, and duplicated Tasks.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkOwner`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. A Change WorkOwner uses its WorkRef; a Group WorkOwner uses its Group reference and direct child Changes. Preserve technical values; the continuation is not a second state store.

On same-session resume, reopen pointers to authority and owned artifacts, inspect drift and replay safety, and refresh decisive evidence. On cross-session or cross-device resume, distrust transient worker and liveness claims; rederive authority, owner, status/index, dirty state, conflicting resources, blockers, evidence freshness and any coordination qualification before mutation.
