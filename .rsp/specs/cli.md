# CLI

## Purpose

Define deterministic command behavior, configuration, managed-path safety and
public projections. Semantic workflow and delivery judgments belong to Skills.

## Current facts

### Inspection and configuration

Commands operate on repository-owned `.rsp/` artifacts. Invalid identity, structure,
dependencies, managed paths, symlinks or incomplete inspection fail closed.
Inspection derives current state without creating another workflow store.

| Surface | Contract |
| --- | --- |
| `status` | Current work, summaries, dependency nodes/edges, blockers, waves and diagnostics |
| `check` / `ready` | Declared structural and completion gates, not semantic acceptance |
| `show` | Exact selected work; `--focused` requires exactly one marker |
| `history` | Bounded archive query with date, kind, group, WorkRef and summary filters |
| `specs` | Current Markdown tree, exact detail and bounded literal search |
| `config` | Read-only validated effective settings |
| `doctor` | Diagnostics and separately selected safe repair |

Plain output is the default semantic view for humans and agents. JSON is the exact
machine projection; [TUI](tui.md) is interactive presentation. `status`, `show`,
`ready`, `check`, `doctor`, `specs` and `history` support `--json --compact`:
the same value on one LF-terminated line. `--compact` without `--json` fails before
command behavior. Verbose/filtered outputs add only their declared auxiliary fields.

`history` and Spec search default to 20 results and accept 1–100, reporting matched,
returned and `hasMore`. Spec queries preserve source path, kind, title, summary,
bounds and diagnostics; search also bounds excerpts, candidates, file size and
detail content. Decision Records remain a separate category. Generated indexes
are compatibility inputs, never authority for current Spec content.

`.rsp/config.yaml` accepts `manage.activation: explicit | auto`,
`manage.closeout: manual | lifecycle | local` and durable language fields `default`,
`artifacts` and `commit`. Generated defaults are `auto + local`. Invalid shapes,
unknown fields and unsafe Decision Record paths fail closed before mutation.
Settings do not configure WorkRef language, workers, runtime topology or external
permission. Their qualified workflow effect is owned by
[Workflow control boundaries](workflow.md#control-boundaries).

Successful `rsp config --json` returns the effective summary directly, with validated
defaults and language inheritance; optional `--compact` changes only presentation.
Failure is nonzero with no successful summary. Status does not project these
settings. Agent consumption belongs to [Workflow](workflow.md#methods-and-evidence).

### Managed artifacts and lifecycle

Document inspection recognizes Markdown structure before applying RSP's canonical
grammar. Comments and code examples provide no identity, sections, completion or
dependency evidence; inline-code values in valid protocol items retain their exact
authored spelling. Syntax recognition does not relax canonical headings or task
states. YAML syntax errors are rejected before value validation or mutation.
Source-positioned edits preserve unrelated text rather than regenerating the
whole document from a syntax tree.
Managed AGENTS entry markers select replacement spans only as actual top-level
comment nodes, not marker literals inside examples.

Change, Group, focus, archive and reopen mutations validate their target boundary
and preserve unrelated files. Archive/reopen retain historical boundaries and do
not automatically write Specs or Decision Records. The
[Work model](work-model.md) owns lifecycle and semantic closeout conditions.

Multiple Focus markers are valid. `show --focused` reports `no_focused_change` or
`multiple_focused_changes` rather than guessing; explicit `show <work-ref>` remains
available. Non-empty Capsule v1 begins with `<!-- rsp-focus:v1 -->`, includes single
`Current`, `Evidence` and `Next` fields plus optional `Resume check`, and is bounded
at 4096 UTF-8 bytes. Unknown lines/fields fail before atomic replacement. Empty
markers remain valid; legacy content reports `focus_capsule_legacy` with
`recovery: null` and `authoritative: false`.

`create <name> [summary] --issue <url>` validates and stores one normalized issue
relationship without remote access. `--issue-relation closes` requires `--issue`;
invalid metadata fails before Change/Focus mutation.

### Git execution boundary

The CLI neither advertises nor dispatches `rsp commit`. Its former message-file,
snapshot flags and JSON receipt have no compatibility wrapper. Consumers migrate
to `rsp-commit`'s native Git procedure and cannot expect deterministic CLI commit
guards. [Workflow](workflow.md#capability-ownership) owns authority, message policy,
snapshot/result observations and exact-delivery judgment; Git owns execution.

### Scaffolds, updates and repair

- Tracked Changes use one kind-aware six-section scaffold at every size. Plain
  HTML writing hints are optional guidance, not evidence or completed content;
  body placeholders and unfinished work remain visible.
- New domain Specs default to Purpose, Boundaries, Contracts, Scenarios and
  Constraints; the architectural scaffold uses Structure instead of Scenarios.
  These are writing aids, not an enforced schema or a reason to rewrite existing Specs.
- Entry reads root/relevant CONTEXT for language and navigation. Context and
  legacy-map ownership remains with the project; `update` reports a root legacy map
  and `doctor` reports non-blocking `legacy_context_map` even with `--fix`.
  Neither command merges, retires or certifies its semantic migration.
- `init` and `add spec` create no generated Spec index. `update` and `doctor --fix`
  remove only reserved root `INDEX.md` or `00-index.md` carrying recognized generated
  metadata for its exact owning directory, after complete preflight and rollback-safe
  postchecks. Current `specs` queries read Markdown directly.
- `doctor --fix` lists only actual mutations in `fixed`; an empty array means none.
- `.rsp/rsp-rules.md` is the fallback when the published Skill is unavailable,
  not another full workflow or project-rule owner.

## Boundaries

CLI owns deterministic operations, structural diagnostics, bounded projections,
warnings and exit decisions. [Architecture](design.md#agent-and-tool-boundary) owns
Agent/tool separation. Success proves only the declared operation/projection,
not semantic review, writeback, independence or authority; failure alone proves
no absence of effects. Tool switching cannot bypass a safety rejection.

## Constraints

Preflight mutation targets, preserving prior content on validation failure.
Outputs remain stable, bounded and platform-independent. Expose no Broker,
SQLite store, managed-runtime controller or Web Observatory. JSON projects
command facts, not host sessions, receipts or runtime history. Local success
grants no remote action, approval, human acceptance or issue closure.
