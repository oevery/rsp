# CLI

## Purpose

Define deterministic command behavior, managed-path safety, inspection, JSON, history, Specs queries, repair, and local commit boundaries.

## Current facts

- CLI commands operate on repository-owned `.rsp/` artifacts and fail closed on invalid identity, structure, dependency, managed path, symlink, or incomplete inspection.
- `status`, `check`, `ready`, `show`, `history`, `specs`, and `doctor` inspect current artifacts without creating a second workflow state. Derived readiness, blockers, dependency edges, waves, and history projections are not persisted.
- Plain output is the default semantic view for humans and AI. JSON is the exact field surface for agents, CI, and scripts. TUI is the interactive presentation surface.
- `rsp specs` reads current Markdown directly. Generated indexes are navigation compatibility artifacts and never become Spec authority. Decision Records remain a separate inspected category.
- Change, Group, focus, archive, reopen, and commit commands validate their complete target boundary before mutation and preserve unrelated files.
- Focus commands may create multiple valid markers. Marker content is optional bounded recovery guidance and never grants ownership or authority.
- `rsp show --focused` succeeds only when exactly one Focus marker exists; no marker returns `no_focused_change`, multiple markers return `multiple_focused_changes`, and `rsp show <work-ref>` remains explicit.
- A non-empty Focus Capsule v1 starts with `<!-- rsp-focus:v1 -->`, contains `Current`, `Evidence`, `Next`, and optional `Resume check`, and is limited to 4096 bytes. Unknown non-empty lines or fields fail before atomic replacement and preserve the prior marker. Legacy content produces `focus_capsule_legacy`; `recovery: null` and `authoritative: false` remain the bounded read-only projection for empty or legacy content.
- Archive and reopen preserve lifecycle and historical boundaries. Archive does not automatically update Specs or Decision Records.
- `rsp commit` creates one exact local commit from an already reviewed staged boundary. It does not stage paths, push, tag, publish, amend, rebase, or clean another checkout.
- Configuration is strict and small. It controls supported RSP options and authority ceilings; it does not configure WorkRef language, session state, runtime topology, or external delivery.
- `.rsp/config.yaml` accepts `manage.activation: explicit | auto`, `manage.closeout: manual | lifecycle | local`, and durable language fields `default`, `artifacts`, and `commit`. The generated default is `auto + local`; invalid shapes, unknown fields, unsafe Decision Record paths, and unsupported values fail closed before config mutation.
- `rsp config` and `rsp config --json` are read-only effective-configuration projections. Status does not project effective Manage or language configuration.
- `status`, `show`, `ready`, `check`, `doctor`, `specs`, and `history` accept `--json --compact` and return the same JSON value on one LF-terminated line; `--compact` without `--json` fails before command behavior.
- `rsp status --json` projects current work, summaries, dependency nodes, edges, blockers, waves, and diagnostics. Verbose or filtered projections add only their declared auxiliary fields.
- `rsp create <name> [summary] --issue <url>` validates and stores one normalized issue relationship without remote access. `--issue-relation closes` requires `--issue`; invalid issue metadata fails before Change or focus mutation.
- `rsp history` is a bounded archive query. It defaults to 20 results, accepts 1–100, supports date, kind, group, WorkRef, and summary filters, and returns matched, returned, and `hasMore` counts.
- `rsp specs` provides deterministic tree, exact-detail, and bounded literal-search projections from current Markdown. It preserves source paths, document kind, title, summary, bounds, and diagnostics; Decision Records remain separately identified.
- Specs search defaults to 20 results, accepts 1–100, bounds excerpts, candidate files, file size, and detail content, and returns deterministic matched, returned, and `hasMore` counts.
- `rsp commit --message-file <path>` operates only on the current reviewed staged boundary. It rejects literal `\n` escapes, an empty staged boundary, and active merge, cherry-pick, revert, rebase, mail-apply, or sequencer state. JSON success returns exact before/after heads, commit, stored message, committed paths, and remaining worktree paths.
- Tracked Changes of every size use the same kind-aware scaffold.
- Change scaffolds retain the six canonical sections and include short plain-prose HTML writing hints. Keeping or removing these hints does not change checks or readiness; body placeholders and unfinished work remain visible.
- New domain Specs default to Purpose, Boundaries, Contracts, Scenarios, and Constraints; the architectural scaffold uses Structure instead of Scenarios. These are writing defaults, not a Spec schema. Existing domain headings remain valid and update does not rewrite existing Specs.
- Generated project entry reads root and relevant local CONTEXT.md for vocabulary, domain relationships, and navigation. Updates preserve project-owned context files, including legacy maps requiring separate semantic migration.
- Entry retains a legacy-map discovery route to Core context migration or the fallback. `update` reports a root CONTEXT-MAP.md when present; `doctor` reports non-blocking `legacy_context_map` information, including with `--fix`. Detection does not certify semantics or migration, even when CONTEXT.md also exists; neither command merges or retires project context.
- `.rsp/rsp-rules.md` is the minimal fallback when the published Skill is unavailable.
- `rsp init` and `rsp add spec` do not create generated Specs indexes. `rsp update` and `rsp doctor --fix` remove only recognized generated indexes after complete preflight and rollback-safe postchecks.
- `rsp update` and therefore `rsp doctor --fix` remove only reserved root `INDEX.md` or any `00-index.md` whose metadata identifies an RSP-generated Specs index and whose owning directory matches exactly.
- direct `rsp specs` tree, detail, and search remain the navigation authority after removal.
- `rsp doctor --fix` reports only real filesystem mutations in `fixed`; an empty array means no safe repair changed files.
- The CLI exposes no Broker, SQLite runtime-store, managed-runtime, or Web Observatory commands. Repository-native behavior is derived from current files and checkout evidence.

## Boundaries

- CLI owns deterministic filesystem operations, structural diagnostics, bounded projections, warnings, and exit decisions.
- Semantic durable-writeback decisions remain with Core, the selected Change, human authority, or the owning Skill.
- JSON exposes exact command projections, not hidden controller state, worker sessions, evaluator receipts, or runtime history.

## Constraints

- Preflight all mutation targets and leave prior content unchanged on validation failure.
- Keep command output stable, bounded, human-readable, and platform-independent.
- Keep safety, authority, readiness, verification, and completion criteria checkable.
- Do not infer remote delivery, publication, approval, human acceptance, or external issue closure from local command success.
