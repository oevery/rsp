# RSP — Reliable Software Practice

English | [简体中文](./README.zh-CN.md)

**A repository-native engineering workflow for humans and AI agents.**

RSP turns unclear intent into shaped, implemented, reviewed, and verified software changes while keeping project knowledge durable and work recoverable. It uses ordinary repository files—Rules, Specs, and Plans—rather than hidden workflow state.

## What RSP helps you do

- Shape ambiguous work into an executable Change.
- Resolve design questions from repository evidence before implementation.
- Route diagnosis, implementation, TDD, review, and release work to explicit capabilities.
- Preserve current facts, lasting rationale, scoped instructions, and completed history in the right owners.
- Keep authority visible: RSP never infers permission to commit, publish, deploy, or approve work.

```text
intent → shape → design when needed → diagnose | TDD | implement
       → review → durable review → archive
```

## Five-minute start

RSP requires Node.js 22 (`>=22.13.0`). Use the current stable release:

```bash
npx -y @oevery/rsp@latest init --with-project-setup
# fill .rsp/changes/project-setup.md
# fill .rsp/specs/design.md
npx -y @oevery/rsp@latest doctor
npx -y @oevery/rsp@latest status --json
```

Then create and focus one tracked change:

```bash
rsp create improve-login "Make login failures actionable"
rsp focus improve-login
rsp show --focused
```

Follow the nearest `AGENTS.md`, edit the focused Change as work progresses, run fresh project checks, make the durable-update decision, and archive only after acceptance is satisfied.

[Read the full getting-started guide](./docs/site/en/getting-started.md).

## Artifact model

```text
.rsp/
├── rsp-rules.md       # minimal fallback protocol
├── specs/             # durable current facts
├── changes/           # open work
├── focus.d/           # empty markers selecting current work
└── archives/          # completed history
```

A Change is one Markdown file with canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections. Stable facts belong in Specs, lasting rationale in Decision Records, and scoped operating instructions in the nearest project-owned `AGENTS.md`.

## Documentation

- [Getting started](./docs/site/en/getting-started.md)
- [Core concepts and artifact ownership](./docs/site/en/concepts.md)
- [Daily workflow](./docs/site/en/guides/daily-workflow.md)
- [Skills and managed work](./docs/site/en/guides/skills.md)
- [Configuration reference](./docs/site/en/reference/configuration.md)
- [CLI reference](./docs/site/en/reference/cli.md)
- [3.0 migration guide](./docs/migrations/3.0.md) and [3.1 migration guide](./docs/migrations/3.1.md)
- [Release notes](./docs/releases/3.2.0.md)
- [Design philosophy](./docs/maintainers/design-philosophy.md) and [maintainer upstream research](./docs/maintainers/upstreams.md)

Run the documentation locally:

```bash
pnpm docs:dev
pnpm docs:check
pnpm docs:build
```

The site is only a presentation layer over the Markdown in this repository. It adds bilingual navigation, local search, and page outlines without introducing a content database or runtime service.

## Platform support

RSP is a tool-agnostic file convention and works with any assistant or editor that can read project files. Humans start here; agents follow the nearest `AGENTS.md`, load `skills/rsp/SKILL.md` when available, and use `.rsp/rsp-rules.md` only when the Skill is unavailable.

RSP is licensed under the [MIT License](./LICENSE).
