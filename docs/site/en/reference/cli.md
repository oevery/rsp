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

## Specs and work creation

```text
rsp add spec <name>             Create a Spec and rebuild affected generated indexes
rsp create <name> [summary]     Create a kind-aware Change
rsp group create <name> [goal] Create a non-focused Group Brief
rsp group close <name>         Archive a completed Group Brief
rsp group reopen <name> --reason <text>
                                Restore one retained Group Brief as open work
```

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
rsp history [filters] [--json [--compact]]
rsp history <work-ref> [--json [--compact]]
```

Without a subcommand, RSP opens the same dashboard as `rsp ui` in a real interactive terminal. CI, pipes, redirected streams, and `TERM=dumb` receive static command output.

Plain `rsp status` keeps current focus, Change and Group summaries, progress, blockers, and the derived next action compact. Add `--verbose` to inspect effective Manage and language policy, the complete dependency forest, and archive trend. JSON output is unchanged by plain presentation mode.

`status` derives exact dependencies, ready work, blockers, and stable waves from the complete work tree. `check` validates Change structure and warns about unfinished placeholders or clarification markers. `history` reads retained archive files directly and defaults to 20 results, with a maximum of 100; filters include `--limit`, `--since`, `--until`, `--kind`, `--group`, and `--search`.

Commands that produce JSON—`status`, `show`, `ready`, `check`, `doctor`, and `history`—accept `--json --compact` for the same value serialized on one LF-terminated line. `--compact` without `--json` is invalid.

## Dashboard keys

- `Tab`: switch Changes, Groups, and History.
- Arrow keys or `j`/`k`: move selection.
- `/`: filter the current scope.
- `Enter`: open full-width details.
- `r`: refresh the current scope.
- `?`: help.
- `q`, `Ctrl-C`, or top-level `Esc`: exit.

The dashboard localizes only its own labels. It does not localize CLI help, text output, JSON, paths, commands, Skills, or existing artifacts.
