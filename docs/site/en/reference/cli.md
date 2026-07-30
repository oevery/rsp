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
rsp create <name> [summary]     Create a Change; add --lite for the shorter template
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

`rsp ready` and `rsp show` expose deterministic readiness and semantic-review signals. They never turn those signals into archive approval. `rsp archive --dry-run` remains a deprecated compatibility alias for `rsp ready` and does not move a Change.

## Inspection

```text
rsp ui [--lang auto|en|zh-CN]   Open the read-only interactive dashboard
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
rsp check [--focused] [--json [--compact]] [--verbose]
rsp history [filters] [--json [--compact]]
rsp history <work-ref> [--json [--compact]]
```

Without a subcommand, RSP opens the same dashboard as `rsp ui` in a real interactive terminal. CI, pipes, redirected streams, and `TERM=dumb` receive static command output.

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
