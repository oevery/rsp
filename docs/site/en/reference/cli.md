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

`rsp doctor` remains read-only unless `--fix` is explicit. It reports integration and filesystem issues, including recognized indexes that still require `rsp update`, without creating hidden workflow state.

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

```text
rsp commit --message-file <path> [--json]
```

`rsp commit` creates one local commit from the existing staged boundary. It refuses an in-progress merge, cherry-pick, revert, rebase, or sequencer operation. It never stages paths, pushes, tags, publishes, amends, creates a repair commit, or performs cross-branch integration. The message file must contain actual line breaks; literal `\n` sequences are rejected. Git receives the message through a direct child-process stdin path with `--cleanup=verbatim`. After the commit, RSP verifies the complete stored message and exact committed paths, then reports the before/after HEAD values, stored message, committed paths, and remaining worktree paths. A post-commit mismatch is reported as a failure while leaving any created commit for separately authorized history repair.

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

Plain `rsp status` keeps current focus, Change and Group summaries, progress, blockers, and the derived next action compact. Add `--verbose` to inspect effective Manage and language policy, the complete dependency forest, and archive trend. JSON exposes the same workflow facts as structured data without adding execution-environment state or a second registry.

`status` derives exact dependencies, ready work, blockers, and stable waves from the complete work tree. `check` validates Change structure and warns about unfinished placeholders or clarification markers. `history` reads retained archive files directly and defaults to 20 results, with a maximum of 100; filters include `--limit`, `--since`, `--until`, `--kind`, `--group`, and `--search`.

Commands that produce JSON—`status`, `show`, `ready`, `check`, `doctor`, `specs`, and `history`—accept `--json --compact` for the same value serialized on one LF-terminated line. `--compact` without `--json` is invalid.

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
