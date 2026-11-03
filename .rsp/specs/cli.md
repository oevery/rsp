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
| `architecture` | Full or selected neutral structure and document locators without bodies |
| `view` | Explicit local architecture reading service, status and stop |
| `config` | Read-only validated effective settings |
| `doctor` | Read-only project and managed-asset diagnostics |

Plain output is the default semantic view for humans and agents. JSON is the exact
machine projection; [TUI](tui.md) is interactive presentation. `status`, `show`,
`ready`, `check`, `doctor`, `specs`, `architecture` and `history` support `--json --compact`:
the same value on one LF-terminated line. `--compact` without `--json` fails before
command behavior. Verbose/filtered outputs add only their declared auxiliary fields.

`history` and Spec search default to 20 results and accept 1–100, reporting matched,
returned and `hasMore`. Spec queries preserve source path, kind, title, summary,
bounds and diagnostics; search also bounds excerpts, candidates, file size and
detail content. Decision Records remain a separate category. Generated indexes
are compatibility inputs, never authority for current Spec content.

Configuration accepts workflow.delegation: off | auto and workflow.closeout:
ask | auto | manual, with off/ask defaults for both generated and omitted settings.
Legacy manage mappings are rejected with explicit migration guidance before update
mutation; no automatic permission mapping is performed. Effective config and
internal status policy projections use workflow instead of manage. Language fields
remain default, artifacts and commit. Invalid shapes, unknown fields and unsafe
Decision Record paths fail closed. No worker-count field or Git grant exists.
Workflow owns policy interpretation and final-delivery conditions.

Successful `rsp config --json` returns the effective summary directly, with validated
defaults and language inheritance; optional `--compact` changes only presentation.
Failure is nonzero with no successful summary. Status does not project these
settings. Agent consumption belongs to [Workflow](workflow.md#methods-and-evidence).

### Project runtime selection

For ordinary consumer projects, init records the running exact package version in
`.rsp/version` and installs the complete core
suite. The managed AGENTS entry supplies its ordinary invocation. Ordinary commands
reject a different version before dispatch; help, standalone version queries,
configuration and doctor remain available for diagnosis.

The RSP development checkout explicitly selects source mode with `.rsp/source`
containing `.`. The source marker and version pin are mutually exclusive; neither
the package name nor the directory name enables this mode implicitly. The running
package root must resolve to the current project root, which must contain the RSP
source entry `src/cli.ts`. Invalid or symlinked markers fail closed. Build here and
run `mise exec -- node dist/cli.mjs`; an external CLI is rejected even with matching
version metadata. Help, version and config remain diagnostic exceptions; doctor
reports invalid selections without adopting or repairing them.

In source mode, init/update preserve the explicit selection without creating a
version pin. They render the local-source invocation in the managed AGENTS entry
and reconcile Skills from the local package, preserving canonical source links.
Doctor identifies the source runtime instead of suggesting a registry upgrade.
Version metadata is not source identity or freshness evidence: retain the commit,
uncommitted diff and build inputs, and rebuild after source changes. Switching
runtime modes is an explicit owner edit, not an automatic update side effect.

Only an explicitly selected target's update reconciles the complete environment
and changes the pin. Update accepts only optional --dry-run, not adoption, removal
or force switches or positional arguments. Preview makes no writes. Repeated init
does not adopt another version. Downgrades and invalid/symlink pins fail closed.
Projects with retired Rules use authorized update. Init creates only missing
scaffolding and supports same-target retry after partial setup; existing user files
are not rewritten. Update does not recreate missing user directories or config.

Doctor inspects the full installed Skill suite against the selected package. It
reports missing/divergent trees and known retired names without changing files. Explicit
`doctor --check-updates` reads only public stable registry metadata, with a two-second
timeout and no authentication forwarding. Unavailable metadata is informational;
ordinary commands stay offline and update notices grant no mutation authority.
No mechanism retrofits selection guards into an older published CLI.

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
  and `doctor` reports non-blocking `legacy_context_map`.
  Neither command merges, retires or certifies its semantic migration.
- The managed Entry allows an explicit bounded capability with established scope,
  authority and owner facts to load directly. Core and Focus load conditionally
  under [Workflow](workflow.md#capability-ownership); invocation changes neither
  tracked ownership nor required prerequisites, permissions or runtime selection.
- Init and add spec create no generated index. Update preflights the entire Specs
  tree, then deletes only indexes with exact generated ownership metadata. User
  reserved indexes stop preflight. No quarantine or restoration is performed.
- Seven named core Skill installation directories and exact retired Skills/Rules
  are package-owned. Replace divergent trees completely and remove retired names;
  preserve unknown Skills and canonical maintainer source links. Other managed
  symlinks and unsupported entries fail validation.
- User config, Specs, Changes, Archives, Decision Records, Focus and CONTEXT remain
  untouched by update, except for recognized generated indexes. No missing user
  scaffold is repaired. Config defaults apply at read time, not by rewriting YAML.
- Init creates missing user scaffolding without overwriting existing files. Both
  commands refresh only the managed AGENTS block and publish the version last.
- Diagnostics distinguish missing scaffolding from access and path-type errors.
  Missing user content may be restored or scaffolded with init; update is not a
  user-directory repair. Access and type errors require owner correction.
- Commands use the project lock and prepare new content before replacement. Failure
  stops with completed-step information, without whole-update rollback, recovery
  copies or a recovery command. Correct the cause and rerun the same target CLI;
  partial managed changes are repeatable. Concurrent external edits and crash-atomic
  recovery are unsupported.

## Boundaries

CLI owns deterministic operations, structural diagnostics, bounded projections,
warnings and exit decisions. [Architecture](design.md#agent-and-tool-boundary) owns
Agent/tool separation. Success proves only the declared operation/projection,
not semantic review, writeback, independence or authority; failure alone proves
no absence of effects. Tool switching cannot bypass a safety rejection.

## Constraints

Preflight mutation targets, preserving prior content on validation failure.
Outputs remain stable, bounded and platform-independent. Expose no Broker,
SQLite store, managed-runtime controller or Web Observatory. The explicit local
architecture reader is a presentation service, not a workflow controller. JSON projects
command facts, not host sessions, receipts or runtime history. Local success
grants no remote action, approval, human acceptance or issue closure.

### Architecture reading

#### Model and selection

The fixed `.rsp/architecture.json` uses `schemaVersion: 1` and contains `nodes`,
`relations`, `views` and `bindings`. Nodes have stable IDs, titles, descriptions
and optional parents. Parent means structural composition; it does not encode
identity, execution order or view membership. Relations have IDs, source and
target IDs, authored types and descriptions. Views have IDs, titles, an owning
node and explicit included node IDs. Duplicate identities, missing references,
cycles and unsupported schemas fail explicitly.

Bindings reference project-relative Markdown files and optional heading hierarchies.
Scope defaults to `node`; only explicit `subtree` bindings inherit. References
retain their origin and inheritance. Missing or ambiguous headings are diagnostics,
not guessed matches. Whole-file bindings need no chapter metadata or stored line
ranges. Several nodes may share a document; nodes need not have a Spec. Specs
remain behavioral authority, while the model supplies curated navigation.

`architecture` returns full structure. `--node` selects the node and descendants;
`--view` selects explicit view members. The selectors are exclusive. Incident
external endpoints are marked as boundaries without recursive expansion. Text
and JSON preserve hierarchy, relation IDs, view ownership, binding scope, source
identity and diagnostics, never document bodies. Named Web views use the same
selection, including empty views whose owner has children.

There is no count truncation. Files above 16 MiB fail explicitly rather than
returning incomplete success. Missing architecture reports not configured and
does not affect unrelated commands. Ordinary and structural CLI commands do not
load the viewer runtime; init and update do not generate architecture data.

#### Navigation and presentation

##### Views and relationships

The persistent left sidebar contains workspace selection, object search and all
declared views. Opening selects the first declared view, or full structure when
none exist. Direct links retain their addressed view or focus. Selecting an object
opens one compact information card without navigation or relayout. The card shows
responsibility, structural parent, owned views and bound documents; it omits an
empty document section. Selecting a relation shows exact endpoints, type and description.

Internal-view actions are explicit: no action for zero views, one action for one
view, a choice for several. Relationship focus selects only the chosen object's
direct incident relations and real endpoints, including self-relations. Its display
is flat, without adding unselected ancestors; original parents remain available
in details. Focus is distinct from CLI subtree selection. An already-focused
object does not repeat the focus action.

Local structure views retain hierarchy. Authored relations are not aggregated,
and arrows do not imply execution order. Explicit reference nodes represent
unsupported self or hierarchy edges and participating container endpoints without
changing their original identity. Ancestors never replace descendant endpoints.
Reference details and native relationship browsing retain each relation. Undrawn
relations have a visible indication and exact accessible details; a reference edge
is not a graphical self-loop. Boundary meaning has a text label, not color alone.

Compact left-to-right diagrams use short relation-type labels; complete descriptions
remain in the card. Native pan/zoom and relationship browsing remain available
without competing detail layers.

##### Controls and workspace identity

Object search supports Up/Down, Home/End and Enter. Escape clears an open search
before dismissing its navigation drawer. Workspace and language selection use the
same keyboard-accessible control. Document and internal-view entries communicate
navigation rather than text input. Long names retain accessible full text without
displacing arrows or actions; close controls have consistent hit areas and labels.

Registered workspaces are grouped by Git repository when metadata is available.
The selector shows branch or detached commit, main or linked worktree status, and
path. Each root retains separate model and document authorization. Grouping does
not register more worktrees. Git failures fall back to directory presentation;
existing refresh updates metadata without a new watcher. The authored RSP icon
serves as branding and favicon; the browser title identifies view and workspace.

##### Complete Spec reading

A document link replaces the information card with a separate right drawer showing
complete Markdown at the bound chapter when present. Users can navigate its table
of contents, resize it or expand it across the canvas. Opening, resizing, expanding
and closing do not relayout or auto-fit the graph. Closing restores the selected
object and graph state.

Desktop reading is non-modal: the uncovered canvas retains pan/zoom without a
backdrop or focus trap. Reading keeps the original selection and disables node
reselection and native relationship browsing until it closes. Narrow navigation
and full-width reading use separate modal drawers with focus containment. Escape
dismisses only the top layer. Closing reading restores focus to the selected object
when available; closing navigation returns focus to its trigger.

Valid reading position survives document updates and desktop/narrow remounts for
both chapter and whole-file entries. Tables preserve column headers and declared
alignment. Inline and reference HTTP(S) links use the same safe new-tab behavior;
local document links remain in the reader.

Deep links, refresh and back restore valid addressed context and selection.
In-session viewport restoration is scoped to workspace and graph revision, not
persisted across browser sessions. Removed views or focused objects explicitly
fall back to full structure; removed selections remain visibly unavailable.

##### Locale and readability

The host supports `zh-CN` and `en`. Without a saved origin-local preference, a
primary browser language starting with `zh` selects `zh-CN`; other languages select
English. Manual choice stays in browser storage, not project configuration. Host
controls, accessible names, statuses and adapter boundary/reference markers use
that locale. Authored names, descriptions, Markdown, paths and code stay unchanged;
raw diagnostics remain available inside expandable details.

LikeC4 1.60.0 has no public locale configuration. Native relationship controls and
diagram keyboard descriptions remain English; RSP does not patch private DOM or
remove those functions to conceal this limitation.

At the browser's default text size, captions use at least 12px. Primary controls,
details and Spec prose, code and tables use 14px in all reader layouts. Prose line
height is 1.65; code and tables use 1.5. Spec headings use 24/20/16px defaults,
paragraph spacing is .75em and vertical cell padding is 6px. Relative sizing
respects text enlargement. Bounded prose width and horizontally scrollable code
and tables preserve readability without shrinking text or adding density settings.

#### Runtime and document safety

`view` starts or reuses the current runtime and opens the workspace; `--no-open`
prints its URL without opening a browser. `view status` reports only that runtime;
`view stop` disconnects all its workspaces. Version, real installation root and
build identity isolate services. Before listening, the service validates its build
digest and captures its version and served assets in memory. Later disk replacement
cannot change that running snapshot; project content still refreshes independently.

The service listens on `127.0.0.1` with an automatically chosen port. Registered
roots retain separate revisions, navigation and caches. Reading requires local
credentials; registration and control require separate credentials. Exact Host
and Origin checks reject foreign requests. Discovery contains only owner-readable
endpoint and runtime credentials, not content. Late responses and errors cannot
replace another workspace or document's state.

Pages poll content every five seconds and on reactivation, and send heartbeats
every 20 seconds. Thirty minutes without valid reading activity exits the service;
five-minute inactive workspace caches are released and rebuilt on reopening.
No tab-close signal or system autostart is required. Dirty source and configuration
changes refresh; document-only changes reuse layout. Errors mark retained content
stale, and repaired sources recover. Polling uses no filesystem watchers.

Bound documents are authorization entry points, not directory grants. Current
relative Markdown links authorize reachable documents and PNG/JPEG/GIF/WebP images,
including sibling directories. Cycles terminate; removing links revokes downstream
access on the next read. A 16 MiB aggregate Markdown-inspection budget bounds each
authorization search and fails explicitly when exceeded.

Safe reads reject traversal, symlinks, runtime directories, hidden paths and paths
named for credentials, secrets or private content. Authored `.rsp/specs/` and
explicitly bound `.rsp/` document directories are the hidden-path exception.
Raw HTML, MDX and project scripts do not execute; external images do not load.
The [user guide](../../docs/site/en/guides/architecture.md) provides the format
example, operating instructions and precautions for credential-bearing URLs.
