# RSP repository context

This checkout contains the shipped RSP product and its own maintenance workspace.
Use the relevant contract below; research and completed work explain evidence,
not current behavior.

## Contract navigation

| Question | Owner |
| --- | --- |
| Architecture and authority relationships | [Architecture](.rsp/specs/design.md) |
| Work identities, artifacts, lifecycle and closeout conditions | [Work model](.rsp/specs/work-model.md) |
| Core routing, capability handoffs and completion flow | [Workflow](.rsp/specs/workflow.md) |
| CLI/configuration and interactive presentation | [CLI](.rsp/specs/cli.md) and [TUI](.rsp/specs/tui.md) |
| Installation, packaging and release boundaries | [.rsp/specs/distribution.md](.rsp/specs/distribution.md) |
| Writing and content-review quality | [.rsp/specs/writing-quality.md](.rsp/specs/writing-quality.md) |
| Significant choices and alternatives | [.rsp/specs/decisions/](.rsp/specs/decisions/) |

Work model defines durable work; the `rsp` Core capability selects and coordinates
actions under the Workflow contract. These are different responsibilities.
Their contracts are linked above; this file does not redefine them.

Read Architecture for the overall boundaries, Work model/Workflow for the domain
and collaboration contracts, and CLI/TUI/Distribution for their product surfaces.
Writing quality is cross-cutting; it does not own lifecycle or delivery authority.

## Source navigation

- `src/` and `bin/`: runtime domains, deterministic commands and presentation.
- `skills/`: authored workflow distribution assets;
  `.agents/skills/` also hosts local projections and maintainer-only capabilities.
- `scripts/`: deterministic maintenance tools;
  [tests/README.md](tests/README.md) selects code, package and Skill evidence.
- [research/README.md](research/README.md): source acquisition, recovery and dated research reports.
- `.rsp/focus.d/` and `.rsp/changes/`: selected/open maintenance work;
  `.rsp/archives/`: historical outcomes, not current Spec authority.

Nearest `AGENTS.md` owns operating instructions. Human introduction and usage
start in [README.md](README.md); executable workflow methods live in their Skills.
