# Exact versions and ownership-based updates

This guide describes the unreleased source candidate, not the current registry package.
Use the built candidate for source testing; after publication select an exact released target.

## Setup and update

- Run the selected CLI's init to create missing project scaffolding, the complete seven-Skill suite, the managed AGENTS entry and the version pin. Existing user files are not overwritten. Repeated init does not adopt another version; incomplete initialization can be retried with the same target CLI.
- Run the deliberately selected target CLI's update to replace its owned assets. Optional --dry-run previews without writes. No adoption, removal or force switches, separate Skill installation, or doctor repair are needed.
- Ordinary commands follow the exact pin. Downgrades are unsupported; upgrade notices grant no authority. Preserve any needed customizations inside managed Skills or retired Rules before updating.

## Ownership

| Content | Update behavior |
| --- | --- |
| Seven named core Skill installation directories | Replace complete divergent trees, including obsolete files; unknown Skill names remain untouched |
| Exact retired Skill and Rules names | Delete |
| Metadata-recognized generated indexes | Delete; owner-controlled reserved paths stop preflight |
| AGENTS.md | Refresh only the managed block |
| .rsp/version (consumer projects) | Write last, after managed updates succeed |
| .rsp/source (RSP development checkout) | Preserve the explicit local-source selection; do not create a version pin |
| Config, Specs, Changes, Archives, Decision Records, Focus and CONTEXT | Do not rewrite, repair or create user content; recognized generated indexes are the explicit exception |

Missing configuration values use read-time defaults. Invalid configuration stops
preflight for owner correction; update does not migrate or normalize the file.
Canonical maintainer Skill links to the package sources are preserved. Other
symlinks or unsupported managed targets are rejected, not followed or replaced.

## RSP development checkout

This repository selects source mode with `.rsp/source` containing `.` instead of
`.rsp/version`. This is an explicit maintainer choice, not inferred from the package
name, directory name or a missing pin. Ordinary consumer projects keep exact pins.
Both markers together, malformed markers and symlinked markers are rejected.

Build with `mise exec -- pnpm run build`, then run
`mise exec -- node dist/cli.mjs <command>` from the checkout root. The running
package must belong to this checkout and its `src/cli.ts` must exist. Another
checkout's CLI cannot substitute even when versions match. Init/update retain
source mode and canonical Skill source links; doctor reports the local runtime
without directing it to a registry version. Mode changes require explicit owner
edits, not an update flag or automatic adoption.

The package version is metadata, not evidence of exact source contents or build
freshness. Rebuild after source changes and retain the commit, uncommitted diff
and build inputs with candidate evidence. Older published CLIs do not gain these
guards retroactively and must not be used to manage this source checkout.

## Failure and retry

Setup prepares new file/Skill content before publishing it. Temporary content is
not a backup. There is no whole-update rollback, recovery copy store or recovery
command. A failed command stops, reports completed steps and leaves partial managed
updates in place; the version is not advanced before the update steps complete.

Fix the reported cause and rerun the same exact target CLI: init for incomplete
initial setup, update for an upgrade. Already-applied changes are repeatable.
Do not run competing updates or edit managed targets during setup. Neither arbitrary
external filesystem races nor process termination/power loss have recovery guarantees.

Doctor and skills list are read-only diagnostics. Only explicit doctor --check-updates
queries stable registry metadata; notices grant no upgrade authority.

For missing user scaffolding, restore the needed content or deliberately run init
to create defaults. For access or path-type errors, correct the reported filesystem
problem first. Update does not repair these user-owned paths.
