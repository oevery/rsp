# RSP: Rules, Spec, Plan

RSP = **Rules, Spec, Plan** — a lightweight AI-assisted development workflow.

## What you get

| Item                     | Path                             | Purpose                            |
| ------------------------ | -------------------------------- | ---------------------------------- |
| `rsp` skill              | `.kilo/skills/rsp/SKILL.md`      | Full RSP playbook (on-demand)      |
| `rsp-rules` rule         | `.ai/rules/rsp-rules.md`         | Behavioral constraints (always-on) |
| `/init-rsp` command      | `.kilo/command/init-rsp.md`      | Bootstrap a project                |
| `/new-feature` command   | `.kilo/command/new-feature.md`   | Start a feature                    |
| `/close-feature` command | `.kilo/command/close-feature.md` | Archive completed work             |

## Quick install

```bash
npx @oevery/rsp
```

Then add to `~/.config/kilo/kilo.jsonc`:

```json
{
  "instructions": [
    "~/.config/kilo/.ai/rules/rsp-rules.md"
  ]
}
```

## What is RSP

Two modes, one philosophy — keep business intent and execution state in explicit files that AI can read and maintain.

### Mode B (single-feature)

``` bash
.ai/
+-- archive/
+-- rules.md
+-- spec.md
+-- plan.md
```

One active feature at a time. Archive to `.ai/archive/` when done.

### Mode A (multi-feature)

``` bash
.ai/
+-- rules/
+-- specs/
+-- plans/
+-- archive/
```

Multiple features in parallel. Feature-bundle archives.

### Commands

| Command                 | Purpose                      |
| ----------------------- | ---------------------------- |
| `/init-rsp`             | Initialize project structure |
| `/new-feature <name>`   | Start a new feature          |
| `/close-feature <name>` | Archive and reset            |

## License

MIT

## Tool-agnostic

The `.ai/` directory (rules / spec / plan / archive) is a plain file convention — no tool lock-in. It works with Kilo Code, Cursor, Claude Code, Cline, GitHub Copilot, or any AI coding assistant that can read project files.

This repo provides a convenience installer and Kilo-specific integrations (skill / commands). To use RSP with other tools, just create the `.ai/` directory and follow the same file conventions.
