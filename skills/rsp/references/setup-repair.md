# Setup and repair

Load this reference only before initializing, auditing, migrating, or repairing RSP-managed state.

1. Initialize with `npx -y @oevery/rsp init [--agents-mode managed|print] [--with-project-setup]`.
2. `--with-project-setup` creates and focuses `changes/project-setup.md`. Without it, create that Change only when explicit bootstrap tracking is still needed.
3. Put project-wide boundaries in `.rsp/specs/design.md`, use `rsp specs` for direct current-file navigation and bounded literal discovery, put cohesive reusable facts in the smallest domain Spec, and keep stable operating instructions in the nearest project-owned `AGENTS.md` outside its managed block.
4. Diagnose with `npx -y @oevery/rsp doctor`. Apply only deterministic repository repairs with `doctor --fix` or `rsp update`; `fixed` entries are real filesystem mutations, while an empty list means nothing changed.
5. Do not use repair commands to decide stale focus, semantic durable updates, or archive readiness.

For manual audit, require `.rsp/`, managed roots, and nested Spec parents to be real directories. Require the project `AGENTS.md`, managed markers, fallback/config files, `specs/design.md`, placeholders, and any reserved generated-index compatibility path to be regular files. Confirm the managed block, direct Specs query, configured Decision Record exclusion, valid group briefs and direct children, supported path depth, and focus markers matching executable Changes. Symlinks, special files, incomplete inspection, unrecognized reserved indexes, and file/directory identity collisions fail closed. Fresh initialization and Spec creation never generate indexes. `rsp update` removes only a root `INDEX.md` or any `00-index.md` with exact generated Specs metadata, using complete preflight, quarantine, direct-query postcheck, and rollback; owner-controlled reserved content is preserved for explicit review.
