# CLI reference

`rsp` denotes the exact CLI invocation recorded in AGENTS and `.rsp/version`, or a verified matching executable, never `@latest` or an arbitrary global installation. Existing 3.3 projects must follow the [migration instructions](../guides/skills.md#pinned-skills-only-migration).

## Setup and Skills

```text
rsp init --agents-mode <mode>   Create project files and the complete core suite
rsp init --with-project-setup   Also create the project-setup Change
rsp update [--dry-run]          Update project files, Skills and the pin together
rsp doctor [--check-updates]    Read-only diagnostics; explicit stable metadata check
rsp skills list [--json]        Inspect suite drift and known retired names
```

Use the selected target's update for an upgrade; ordinary commands keep the exact
project selection. Repeated init does not adopt another version; downgrades are
unsupported. Standalone skills install, its terminal and doctor --fix are retired.

Update replaces exact core Skill names, removes known retired names and the two
retired Rules files, and refreshes only the managed AGENTS block. Preserve needed
customizations in managed assets before updating. Unknown Skills, user configuration,
project knowledge and other AGENTS content remain intact. Optional --dry-run previews
without force or writes.

Failures stop without rollback or recovery copies. Fix the cause and rerun the same
target CLI; completed managed changes remain applied. Update does not modify config
or repair user directories. The pin is written last; crash recovery is unsupported.
Diagnostics grant no mutation authority. See [Skill mappings](../guides/skills.md).
Missing user scaffolding may be restored or created with init; access and path-type
errors require owner correction. Update does not repair these paths.

Generated-index compatibility removes only root INDEX.md or 00-index.md Specs indexes
with exact generated metadata. Preflight and ownership checks protect owner-controlled
content; init and add spec generate no indexes. Doctor always remains read-only.

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

## Focus, readiness, and lifecycle

```text
rsp focus <name> [--capsule-file <path|->]
                                Mark an open Change as current and optionally replace its capsule
rsp unfocus <name>              Remove an open Change from the focus set
rsp show <name|--focused> [--json [--compact]] [--verbose]
rsp ready <name> [--json [--compact]] [--verbose]
rsp archive <name>              Move a completed Change to archives
rsp reopen <name> --reason <text> [--from <archive-path>]
                                Restore incomplete archived acceptance
```

`rsp focus --capsule-file` accepts a regular file or standard input (`-`). Empty input keeps a valid empty marker. Every new non-empty write must be strict Focus Capsule v1: one leading `<!-- rsp-focus:v1 -->`, blank lines, exactly one non-empty single-line `Current`, `Evidence`, and `Next`, and at most one non-empty single-line `Resume check`. Unknown non-empty lines or fields, duplicates, missing fields, invalid UTF-8, unsafe inputs, and content above 4096 UTF-8 bytes are rejected before atomic replacement, preserving the previous marker.

Existing bounded unversioned UTF-8 content remains readable for compatibility. `rsp check` emits `focus_capsule_legacy` as a warning and does not treat that prose as structured recovery. For a focused Change, `rsp show --json` returns `recovery: null` for empty or legacy content, includes a stable entry in `warnings` for legacy content, and projects valid v1 as `{ version, current, evidence, next, resumeCheck, authoritative: false }`. The projection is read-only, grants no authority, and does not claim evidence freshness.

`rsp ready` and `rsp show` also expose the required completion gate, optional coverage warnings, and semantic-review signals. Incomplete Tasks, Required Verify items, or blockers produce `archiveReady: no`; incomplete Optional verification remains a warning. `rsp archive` fails without moving the Change when the completion gate is blocked. `rsp archive --dry-run` remains a deprecated compatibility alias for `rsp ready` and does not move a Change.

## Local Git delivery

RSP 4.0 removes `rsp commit --message-file`, including
`--expected-head`, `--expected-tree` and the JSON receipt. There is no compatibility
wrapper. Existing automation must migrate; earlier release records describe their
original versions.

Use the `rsp-commit` Skill for authorized exact-scope local delivery. Its ordinary
execution command is:

```sh
git commit --cleanup=verbatim -F <message-file>
```

Replace `<message-file>` with a safely prepared, quoted path outside the delivered
boundary. Use actual line breaks for multiline prose; literal backslash-n remains
literal. Preserve normal Git hooks and the project's signing policy.

The Skill owns authority, verification, staging/message review, active-operation
checks, reviewed HEAD/index rechecks and immutable result observations. Native Git
does not supply the removed wrapper's guards or JSON receipt. An exit code alone
is not exact delivery; snapshot drift, failed checks or uncertain effects stop
without automatic retry, amend, reset or a repair commit. Sequential observations
are not a cross-process lock, and no equal-reliability or cost claim is made.

Missing Commit capability still stops Core delivery without staging or a manual
substitute. Local delivery grants no archive, history rewrite, push or publication.

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

Plain `rsp status` is the default semantic view for humans and agents: it keeps current focus, Change and Group summaries, progress, blockers, and the derived next action compact. In an interactive terminal, use `rsp` or `rsp ui` for the dashboard. Use `rsp status --json` only when exact machine fields are needed; its default projection keeps current work, summaries, dependencies, waves, and structural diagnostics. Add `--json --verbose` to include filters, next actions, archive trend, and runtime diagnostics. Use `rsp config` or `rsp config --json` for effective project configuration.

`status` derives exact dependencies, ready work, blockers, and stable waves from the complete work tree. `check` validates Change structure and warns about unfinished placeholders or clarification markers. `history` reads retained archive files directly and defaults to 20 results, with a maximum of 100; filters include `--limit`, `--since`, `--until`, `--kind`, `--group`, and `--search`.

Commands that produce JSON—`status`, `show`, `ready`, `check`, `doctor`, `specs`, and `history`—accept `--json --compact` for the same projection serialized on one LF-terminated line. For `status`, `--json --verbose` restores auxiliary presentation and runtime fields; `--compact` without `--json` is invalid.

## Dashboard keys

- `Tab`: switch Work, Specs, and History. Work combines Changes and Groups with visible kind labels.
- `s` in Specs: submit a bounded literal content search; `Enter` opens a safe terminal-rendered Markdown detail, and `↑`/`↓` or `k`/`j` scroll its rendered lines. Frontmatter is hidden and raw HTML is not executed.
- `v` in Work or History detail: toggle the semantic Status/Summary and the exact bounded Markdown document. Tables adapt to terminal width and strict RSP metavariables remain inert.
- Arrow keys or `j`/`k`: move selection.
- `/`: filter the current scope.
- `Enter`: open full-width details.
- `r`: refresh the current scope.
- `?`: help.
- `q`, `Ctrl-C`, or top-level `Esc`: exit.

The dashboard localizes only its own labels. It does not localize CLI help, text output, JSON, paths, commands, Skills, or existing artifacts.
