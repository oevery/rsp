# Setup and repair

Load before initializing, inspecting or updating RSP-managed assets.

Use the runtime selected in AGENTS: an exact package pin in .rsp/version for
consumer projects, or this checkout's built CLI when .rsp/source explicitly
selects source mode. The two markers are mutually exclusive. An authorized package
upgrade deliberately selects its exact target CLI; source update keeps the local
selection. Never silently resolve @latest; package fetching requires separate authority.

- **Initialize:** rsp init [--agents-mode managed|print] [--with-project-setup] creates missing scaffolding and the complete core suite. Existing user files remain unchanged. Retry an incomplete init with the same target; repeated init cannot adopt a different pinned version. Retired Rules require update instead.
- **Update:** rsp update replaces the selected package's owned assets; optional --dry-run previews without writes. No separate installation or migration switches are needed.
- **Inspect:** rsp doctor and rsp skills list are read-only. Only explicit doctor --check-updates queries stable metadata. Reports and notices grant no mutation authority.

## Ownership and failure

Core Skill installation directories and exact retired Skill/Rules names are
package-owned: replace or delete them, including local changes. Preserve needed
customizations beforehand. Unknown Skills, config, Specs, work, archives, Decision
Records and Focus are user-owned; update does not rewrite or repair them. Missing
config values use read-time defaults. AGENTS changes are confined to its managed
block; write a consumer pin last, and never create one in source mode. Preserve
canonical maintainer links to package sources.

Only metadata-recognized generated indexes may be deleted from user knowledge
directories. Stop for owner-controlled reserved paths, invalid config, unexpected
symlinks or unsupported targets. Do not bypass validation or downgrade the pin.

Failure stops without whole-update rollback or recovery copies. Completed steps
remain applied. Inspect the reported failure, fix its cause and rerun the same exact
target command; do not infer completion or switch to the old pin's CLI midway.
Concurrent external edits and crash recovery are unsupported. No recovery entry exists.

## Project knowledge

Keep architecture in .rsp/specs/design.md, contracts in domain Specs, navigation in
CONTEXT and scoped instructions outside the managed AGENTS block. Use rsp specs to
query knowledge. A legacy context map selects [context migration](context-migration.md);
discovery alone grants no merge or deletion. Semantic writeback and archive decisions
remain outside deterministic setup. Missing required Skills stop dependent work;
never fall back to retired Rules or install implicitly.
