# Use built-in node:sqlite for disposable checkout runtime observations

RSP uses the built-in `node:sqlite` module behind a lazy runtime adapter because the event store is optional package runtime, must support concurrent local processes, and must remain removable without introducing host-specific compilation or another project truth.

## Considered Options

- Persist shared JSON snapshots or append-only JSON files: rejected because cross-process sequence allocation, duplicate delivery, guarded checkpoints, atomic migrations, and crash recovery would require a second locking and recovery system with weaker query and integrity guarantees.
- Add a native SQLite addon: rejected because clean installation would depend on prebuilt binaries or host compilation across supported platforms, increasing package and rollback risk for an optional local capability.
- Store runtime observations in repository Markdown: rejected because operational events, receipts, checkpoints, and context packets are disposable and must not become Change, Spec, Decision, readiness, lifecycle, or acceptance authority.
- Use one writable database shared by all repositories: rejected because corrupt or incompatible state and path, token, retention, or identity mistakes could cross checkout boundaries.

## Consequences

- The package requires Node.js `>=22.13.0`, ships a standalone `dist/runtime-store.mjs` adapter, dynamically imports `node:sqlite` only on runtime opening, and declares no SQLite addon dependency.
- Hosts using `--no-experimental-sqlite` receive an exact runtime-unavailable diagnostic. Ordinary one-shot repository commands remain SQLite-independent and continue to derive their results from Markdown and current checkout evidence.
- Each canonical checkout or worktree owns one database under its exact Broker project namespace. Stored project path and filesystem identity prevent moving or reusing that database across namespaces.
- Database schema major `1` and migration version `3` are storage identities distinct from Broker protocol `1.2` and runtime-schema compatibility identity `1.1`. Migration `3` adds the unified managed observation revision without changing Markdown authority or the Broker runtime-schema identity. Compatible Broker minors may share the runtime contract; incompatible majors, older required minors, newer database versions, incomplete history, and corruption fail closed.
- WAL, short transactions, idempotency records, transactional sequence allocation, atomic context revision/version ownership, single-snapshot run projections, compare-and-swap checkpoints, bounded payloads, retention, and identity-scoped disposal make committed observations recoverable while keeping checkpoints and context packets rebuildable.
- Runtime data records only what the runtime observed and delivered. Manage and current repository authority still own interpretation, routing, blockers, acceptance, closeout, Git, and publication.
