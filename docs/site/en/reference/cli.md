# CLI reference

Use `rsp <command>` when RSP is already available in the environment. For setup and maintenance, invoke the current stable package with `npx -y @oevery/rsp@latest <command>`.

## Setup and Skills

```text
rsp init --agents-mode <mode>   Scaffold .rsp/ and ensure the RSP entry in AGENTS.md
rsp init --with-project-setup   Also create .rsp/changes/project-setup.md
rsp update                      Refresh managed project files, not packaged Skills
rsp doctor [--fix]              Inspect integration health; fix only safe deterministic issues
rsp skills                      Open the project Skill manager in a dual TTY
rsp skills list [--json]        List bundled Skills and exact installation state
rsp skills install [name] [--dry-run] [--force]
                                Install the default suite or one exact optional Skill
```

`rsp update` does not refresh installed package-owned Skills; run `rsp skills install` separately. `--force` is required to replace differing selected Skill directories or remove recognized obsolete package-owned identities.

`rsp doctor --fix` reports only real filesystem mutations; a healthy project returns `fixed: []` and explains that no safe repair was needed.

For the generated-index compatibility migration, `rsp update` removes only root `.rsp/specs/INDEX.md` or any `.rsp/specs/**/00-index.md` whose metadata identifies an RSP-generated Specs index and whose `source_dir` exactly matches the owning directory. It preflights all candidates before mutation and rolls quarantined files back if post-migration direct Specs inspection fails. Owner-controlled, unreadable, or replaced reserved content stops the update without overwrite or deletion. Fresh initialization and `rsp add spec` never create generated indexes.

`rsp doctor` remains read-only unless `--fix` is explicit. It reports recognized indexes that still require `rsp update`, plus absent, healthy, stale, invalid, unhealthy, or incompatible Broker discovery; absent, healthy, migration-required, incompatible, incomplete, or corrupt checkout runtime state; and bounded fresh or stale disposable context packets. It does not start or register with Broker, create an absent cache, delete a runtime database, or block Markdown recovery because context is stale.

## Specs and work creation

```text
rsp specs [path] [--json [--compact]]
                                Derive the current tree or inspect one exact returned path
rsp specs --search <literal> [--limit 1..100] [--excerpt 40..1000]
                                Search current Specs and Decision Records with bounded excerpts
rsp add spec <name>             Create a Spec for direct current-file queries
rsp create <name> [summary]     Create a kind-aware Change
rsp group create <name> [goal] Create a non-focused Group Brief
rsp group close <name>         Archive a completed Group Brief
rsp group reopen <name> --reason <text>
                                Restore one retained Group Brief as open work
```

`rsp specs` reads current regular Markdown directly without a daemon, database, or generated navigation file. Tree, detail, and search JSON identify the checkout, exact project-relative source paths, document kind, limits, and diagnostics. Search is case-insensitive literal matching, defaults to 20 results and 240-code-point excerpts, and fails closed on invalid Specs trees or owner-controlled reserved index content. After migration this command is the supported navigation replacement for generated indexes. Re-read the returned source before a material decision or mutation.

For one compatible-release cycle, `rsp create --lite`, `--lite=true`, and `--lite=false` remain accepted. Each form emits bounded deprecation guidance and creates the same standard kind-aware six-section Change; every other `--lite=` value fails before mutation, and no separate lite template exists.

## Optional local Broker

```text
rsp broker status [--json]     Inspect discovery and compatibility without starting a service
rsp broker start [--json]      Start or reuse one compatible user-level Broker
rsp broker stop [--json]       Cooperatively stop the compatible Broker or clean stale metadata
rsp broker restart [--json]    Replace one verified same-protocol-major Broker with a fresh process
```

The Broker is optional operational transport for runtime capabilities. Ordinary `status`, `check`, `show`, `ready`, `specs`, lifecycle, Git, and repair commands remain one-shot: they neither require the Broker nor create its cache. `broker status` also stays cache-free when no Broker exists and reports absence successfully. The default package does not expose the retained Web Observatory source as a command, Broker route, projector entry, or browser asset.

`broker restart` holds one startup lock across cooperative shutdown or stale discovery recovery and fresh daemon publication. It can replace a healthy, identity-verified Broker with the same protocol major even when its protocol minor or runtime schema is incompatible with the current package. A protocol-major mismatch or unhealthy owner still requires the compatible package and is never signaled directly. Restart discards loaded project sessions and the old endpoint.

Repository migration and runtime-cache disposal are separate. Update and doctor do not remove runtime databases or sidecars. If disposal is explicitly authorized, close the exact Broker/session/store owner, then import `resolveRuntimeDisposalTarget()` and `disposeRuntimeDatabase()` from `@oevery/rsp/dist/runtime-store.mjs`; derive the current checkout's exact cache/projects/namespace target and pass that complete target back to disposal. Never hand-delete runtime files, delete the whole Broker cache root, guess a project identity, copy a database between checkouts, or signal a recorded PID manually.

Concurrent starts serialize through one complete-record user-level lock and return the same healthy instance and endpoint. A one-time startup claim transfers atomically from the launching client to exactly one daemon; a delayed loser exits instead of replacing discovery. Package versions may reuse the process when managed-observability-capable Broker protocol `1.2` and the required runtime schema `1.1` are compatible; an older required minor is rejected while a compatible newer minor may be reused. An incompatible client never starts a hidden side-by-side service; it returns the exact action for stopping the existing Broker with a compatible package before retrying the intended version.

The service binds only exact `http://127.0.0.1:<port>`, checks loopback peer, `Host`, optional browser `Origin`, and bearer tokens, and never prints control or project tokens in CLI output. Canonical Git checkout path plus filesystem identity keeps repositories and separate worktrees in different project sessions, tokens, and namespaces; concurrent registration of one checkout returns its one canonical loaded token. JSON responses are checked before headers against the 64 KiB limit, and status preserves the exact session count while bounding its optional session list. Inactive sessions unload after five minutes by default without deleting repository files or making runtime state authoritative.

An explicit runtime consumer lazily opens `runtime-v1.sqlite` inside that exact project namespace through the packaged `dist/runtime-store.mjs` adapter. While a Broker session owns that live store, observation and projection use only the packaged runtime or Broker APIs; direct SQLite access is unsupported until the owning session releases the database. The current database identity is schema major `1`, migration version `3`; this is distinct from Broker protocol `1.2` and runtime-schema compatibility identity `1.1`. The store uses built-in `node:sqlite`, WAL, short transactions, idempotent delivery, transactional sequence allocation, guarded checkpoints, bounded context, retention, and project-local disposal. It records runtime observations only and never owns planning, blockers, readiness, acceptance, lifecycle, Git, or publication.

Hosts may import packaged `dist/manage-runtime.mjs` and consume optional capability `rsp.manage-runtime@1.0` either directly against an accepted store or through project-token-scoped Broker endpoints. Broker discovery for this capability is non-starting. The adapter records only host-confirmed runs, exact dispatch and worker identities, structured events and receipts, attention, pause/resume, explicit terminal boundaries, and context. Every new observation, including dispatch, advances one committed run sequence; duplicate delivery retains its original effect and sequence. Worker events require an existing matching dispatch, while missing, unavailable, or boundary-changing receipts remain incomplete. Run and attention projections are non-authoritative, source-referenced, and capped at 32 items. `terminalDeliveryObserved` is also non-authoritative and requires an explicit terminal boundary, at least one dispatch, no truncation, and safe retained delivery for every observed dispatch. Context packets are capped at 12 KiB and 24 hours; public save and hydrate requests expose no caller clock, and any later committed observation makes the prior packet non-fresh. Resume always rereads current authority and changed sources, while stale authority or checkout identity forces full reread. Runtime absence or failure is diagnostic only and preserves the canonical no-runtime Manage result.

The package engine accepts Node.js `>=22` and declares no native SQLite addon. Optional SQLite runtime opening requires Node.js `>=22.13.0`; an older Node 22 version or `--no-experimental-sqlite` returns `runtime_sqlite_unavailable`. Ordinary one-shot CLI commands remain usable because they do not import SQLite.

Discovery uses `RSP_BROKER_CACHE_HOME` when explicitly set; otherwise it follows XDG cache on supported Unix hosts, `LOCALAPPDATA` on Windows, the macOS user cache directory, or `~/.cache` as the fallback. Stop revalidates process-start and metadata identity: dead or reused PIDs cause metadata cleanup only and are never signaled, while an unavailable identity fails closed.

## Focus, readiness, and lifecycle

```text
rsp focus <name>                Mark an open Change as current
rsp unfocus <name>              Remove an open Change from the focus set
rsp show <name|--focused> [--json [--compact]] [--verbose]
rsp ready <name> [--json [--compact]] [--verbose]
rsp archive <name>              Move a completed Change to archives
rsp reopen <name> --reason <text> [--from <archive-path>]
                                Restore incomplete archived acceptance
```

`rsp ready` and `rsp show` expose the required completion gate, optional coverage warnings, and semantic-review signals. Incomplete Tasks, Required Verify items, or blockers produce `archiveReady: no`; incomplete Optional verification remains a warning. `rsp archive` fails without moving the Change when the completion gate is blocked. `rsp archive --dry-run` remains a deprecated compatibility alias for `rsp ready` and does not move a Change.

## Local Git delivery

```text
rsp commit --message-file <path> [--json]
```

`rsp commit` creates one local commit from the existing staged boundary. It never stages paths, pushes, tags, publishes, amends, or creates a repair commit. The message file must contain actual line breaks; literal `\n` sequences are rejected. Git receives the message through a direct child-process stdin path with `--cleanup=verbatim`, and the complete message on `HEAD` is checked after the commit. A post-commit mismatch is reported as a failure while leaving any created commit for separately authorized history repair.

## Isolated workspaces

```text
rsp workspace prepare <work-ref> [--target <branch>] [--json]
rsp workspace status <work-ref> [--json]
rsp workspace inspect <work-ref> [--json]
rsp workspace activity register <work-ref> --id <id> --pid <pid>
    [--label <text>] [--process-group <pgid>] [--resources <ids>] [--json]
rsp workspace activity stop <work-ref> --id <id> [--json]
rsp workspace dispose <work-ref> [--discard] [--json]
rsp land <work-ref> --target <branch> --commits <sha[,sha...]> [--cleanup] [--json]
```

Workspace preparation is opt-in for an existing executable WorkRef and must satisfy the project `workspace.activation` policy. `auto` allows Core to select isolation from material workspace signals, `explicit` requires a current explicit request, and `disabled` denies RSP workspace selection. Preparation creates or resumes branch `rsp/<work-ref>` in a stable cache worktree; ordinary temporary work remains in the current branch. `inspect` returns bounded repository facts without classifying the project stack.

The `rsp-workspace` Skill or a human interprets project semantics and uses the host's existing file, shell, package, browser, and process capabilities. The Skill reuses the invoking RSP control and result contracts and appends only workspace context and observations; the CLI does not parse AI response text or provide a universal execution-plan DSL.

Long-running processes are started and verified by the host. `activity register` records an observed PID with its stable process-start identity, an optional verified process group, and opaque cooperative resource names so a later session can stop or dispose them safely. Stop and disposal revalidate that identity and fail closed rather than signal a reused PID or process group. Registration is coordination rather than sandboxing and grants no network, credential, external-state, deployment, or publication authority.

Disposal refuses dirty workspaces and commits that remain ahead of the target. `--discard` explicitly authorizes losing both. Landing requires an exact target and ordered commit list. Conflicts preserve the source workspace and target cherry-pick state; `--cleanup` runs only after successful landing and only when the list covers every workspace commit ahead of the target.

## Inspection

```text
rsp ui [--lang auto|en|zh-CN]   Open the read-only interactive dashboard
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
rsp check [--focused] [--json [--compact]] [--verbose]
rsp specs [path|--search <literal>] [--json [--compact]]
rsp history [filters] [--json [--compact]]
rsp history <work-ref> [--json [--compact]]
```

Without a subcommand, RSP opens the same dashboard as `rsp ui` in a real interactive terminal. CI, pipes, redirected streams, and `TERM=dumb` receive static command output.

Plain `rsp status` keeps current focus, Change and Group summaries, progress, blockers, and the derived next action compact. Add `--verbose` to inspect effective Manage and language policy, the complete dependency forest, and archive trend. JSON output is unchanged by plain presentation mode.

`status` derives exact dependencies, ready work, blockers, and stable waves from the complete work tree. `check` validates Change structure and warns about unfinished placeholders or clarification markers. `history` reads retained archive files directly and defaults to 20 results, with a maximum of 100; filters include `--limit`, `--since`, `--until`, `--kind`, `--group`, and `--search`.

Commands that produce JSON—`status`, `show`, `ready`, `check`, `doctor`, `specs`, and `history`—accept `--json --compact` for the same value serialized on one LF-terminated line. `--compact` without `--json` is invalid.

## Dashboard keys

- `Tab`: switch Changes, Groups, and History.
- Arrow keys or `j`/`k`: move selection.
- `/`: filter the current scope.
- `Enter`: open full-width details.
- `r`: refresh the current scope.
- `?`: help.
- `q`, `Ctrl-C`, or top-level `Esc`: exit.

The dashboard localizes only its own labels. It does not localize CLI help, text output, JSON, paths, commands, Skills, or existing artifacts.
