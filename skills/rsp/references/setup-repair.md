# Setup and repair

Load this reference only before initializing, auditing, migrating, or repairing RSP-managed state.

Select the requested operation; an audit or repair does not require initialization. Run from the selected project root with the same selected CLI; `rsp` below denotes that invocation. Read `.rsp/version` and use the exact invocation in AGENTS; verify any project/local executable matches. Never substitute `@latest` or silently change the project pin. Fetching or installing a package requires its own authority; an unavailable CLI is a gap, not permission to download one.

- **Initialize:** use `rsp init [--agents-mode managed|print] [--with-project-setup]`. `--with-project-setup` creates and focuses `changes/project-setup.md`; without it, create that Change only when explicit bootstrap tracking is needed.
- **Place project knowledge:** architecture belongs in `.rsp/specs/design.md`, cohesive capabilities in the smallest domain Spec, and vocabulary/relationships/navigation in useful root or local `CONTEXT.md` files. Discover current files with `rsp specs`; keep operating rules in nearest project-owned `AGENTS.md` outside its managed block.
- **Diagnose or repair:** use `rsp doctor`. Only authorized deterministic repairs use `doctor --fix` or `rsp update`; `fixed` entries are filesystem mutations, an empty list means none. Repair commands decide neither stale focus nor semantic writeback/archive readiness.

For a detected legacy context map or a context-migration request, use [context migration](context-migration.md). CLI updates refresh managed entry guidance, not project-owned context files.

## Manual audit

- Require real directories for `.rsp/`, managed roots and nested Spec parents.
- Require regular files for project `AGENTS.md`, managed markers, version/config, `specs/design.md`, placeholders and reserved generated-index compatibility paths.
- Confirm the managed block, direct Specs query, configured Decision Record exclusion, valid Group Briefs/direct children, supported depth and focus markers matching executable Changes.

Fail closed on symlinks, special files, incomplete inspection, unrecognized reserved indexes or file/directory identity collisions.

## Version and Skills migration

Init records the running exact package version. To change an existing pin, first
inspect migration guidance and choose one exact target. Only separately authorized
`rsp update --adopt-version` adopts that running target; ordinary init/update and
doctor repair never repin. Use that same CLI for the complete suite install, preview
with `skills install --dry-run --force` before explicitly authorized replacement,
then run `doctor`. A drift report is not permission to replace local customizations.

Rules are retired. Preserve custom content in `.rsp/rsp-rules.md` and
`.rsp/rules/rsp-rules.md` before explicit `update --remove-legacy-rules`; unrelated
`.rsp/rules/` content remains owner-controlled. Neither setup nor repair regenerates
a fallback. `doctor --check-updates` is an explicit metadata-only network check;
ordinary commands stay offline and a notice authorizes no upgrade.

## Generated-index compatibility

Fresh initialization and Spec creation generate no indexes. `rsp update` removes only root `INDEX.md` or any `00-index.md` with exact generated Specs metadata. Require complete preflight, quarantine, direct-query postcheck and rollback; preserve owner-controlled reserved content for explicit review.

## Legacy workflow configuration

A legacy manage mapping requires explicit migration to workflow.delegation (off or
auto) and workflow.closeout (ask, auto or manual). Recommend off/ask; never map old
local closeout into Git authority. With configuration-edit authority, remove manage,
choose new values, check project-owned policy instructions and validate through
rsp config --json before rsp update. Update refuses legacy or mixed settings without
rewriting them. Historical evidence is not migrated into current acceptance.
