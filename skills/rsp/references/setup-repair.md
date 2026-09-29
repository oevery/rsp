# Setup and repair

Load this reference only before initializing, auditing, migrating, or repairing RSP-managed state.

1. Initialize with `npx -y @oevery/rsp init [--agents-mode managed|print] [--with-project-setup]`.
2. `--with-project-setup` creates and focuses `changes/project-setup.md`. Without it, create that Change only when explicit bootstrap tracking is still needed.
3. Put architectural contracts in `.rsp/specs/design.md` and cohesive capability contracts in the smallest domain Spec. Use `rsp specs` for direct current-file discovery. Root and local `CONTEXT.md` files own domain vocabulary, relationships, and navigation; create them only when useful. Keep operating instructions in the nearest project-owned `AGENTS.md` outside its managed block.
4. Diagnose with `npx -y @oevery/rsp doctor`. Apply only deterministic repository repairs with `doctor --fix` or `rsp update`; `fixed` entries are real filesystem mutations, while an empty list means nothing changed.
5. Do not use repair commands to decide stale focus, semantic durable updates, or archive readiness.

For a detected legacy context map or a context-migration request, use [context migration](context-migration.md). CLI updates refresh managed entry guidance, not project-owned context files.

For manual audit, require `.rsp/`, managed roots, and nested Spec parents to be real directories. Require the project `AGENTS.md`, managed markers, fallback/config files, `specs/design.md`, placeholders, and any reserved generated-index compatibility path to be regular files. Confirm the managed block, direct Specs query, configured Decision Record exclusion, valid group briefs and direct children, supported path depth, and focus markers matching executable Changes. Symlinks, special files, incomplete inspection, unrecognized reserved indexes, and file/directory identity collisions fail closed. Fresh initialization and Spec creation never generate indexes. `rsp update` removes only a root `INDEX.md` or any `00-index.md` with exact generated Specs metadata, using complete preflight, quarantine, direct-query postcheck, and rollback; owner-controlled reserved content is preserved for explicit review.
