# Setup and repair

Load this reference only before initializing, auditing, migrating, or repairing RSP-managed state.

1. Initialize with `npx -y @oevery/rsp init [--agents-mode managed|print] [--with-project-setup]`.
2. `--with-project-setup` creates and focuses `changes/project-setup.md`. Without it, create that Change only when explicit bootstrap tracking is still needed.
3. Put project-wide boundaries in `.rsp/specs/design.md`, use generated local `00-index.md` files only for direct-child navigation, put cohesive reusable facts in the smallest domain Spec, and keep stable operating instructions in the nearest project-owned `AGENTS.md` outside its managed block.
4. Diagnose with `npx -y @oevery/rsp doctor`. Apply only deterministic repairs with `doctor --fix` or `rsp update`; `fixed` entries are real filesystem mutations, while an empty list means nothing changed.
5. Do not use repair commands to decide stale focus, semantic durable updates, or archive readiness.

For manual audit, require `.rsp/`, managed roots, and nested Spec parents to be real directories. Require the project `AGENTS.md`, managed markers, fallback/config files, generated local `00-index.md` files, and placeholders to be regular files. Confirm the managed block, root and populated-directory Specs indexes, `specs/design.md`, configured Decision Record exclusion, valid group briefs and direct children, supported path depth, and focus markers matching executable Changes. Symlinks, special files, incomplete inspection, unrecognized reserved indexes, and file/directory identity collisions fail closed.
