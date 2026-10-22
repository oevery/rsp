# RSP — Reliable Software Practice

English | [简体中文](./README.zh-CN.md)

**A repository-native engineering workflow for humans and AI agents.**

RSP turns unclear intent into shaped, implemented, reviewed, and verified software changes while keeping project knowledge durable and work recoverable. It uses ordinary repository files—Skills, Specs, and Plans—rather than hidden workflow state.

## What RSP helps you do

- Shape ambiguous work into an executable Change.
- Resolve design questions from repository evidence before implementation.
- Route diagnosis, implementation, risk-selected test-first work, review, and release work to explicit capabilities.
- Preserve current facts, lasting rationale, scoped instructions, and completed history in the right owners.
- Keep authority visible: RSP never infers permission to commit, publish, deploy, or approve work.

RSP selects the next responsibility from the task and evidence, not a fixed stage pipeline. A settled authorized task can proceed directly to implementation and its own checks; design, review, coordination and lifecycle closeout apply only when needed and permitted.

## Five-minute start

RSP requires Node.js 22 (`>=22`). Run setup from the target project root. For a new project, resolve a stable version once and keep that exact selection. Existing projects use the version in `.rsp/version` and the generated AGENTS entry, not a fresh `latest` resolution. Later `rsp` examples denote that exact invocation or a verified matching executable:

```bash
npm view @oevery/rsp dist-tags.latest
# Replace <version> with the inspected exact version.
RSP_VERSION='<version>'
npx -y @oevery/rsp@"$RSP_VERSION" init --with-project-setup
# fill .rsp/changes/project-setup.md
# fill .rsp/specs/design.md
npx -y @oevery/rsp@"$RSP_VERSION" skills install --dry-run
npx -y @oevery/rsp@"$RSP_VERSION" skills install
npx -y @oevery/rsp@"$RSP_VERSION" doctor
npx -y @oevery/rsp@"$RSP_VERSION" status
```

Then create and focus one tracked change:

```bash
rsp create improve-login "Make login failures actionable"
rsp focus improve-login
rsp show improve-login
```

Focus is a set: the setup Change may still be focused alongside improve-login. Use the explicit name to inspect it; show --focused requires exactly one marker.

Confirm that `doctor` reports the intended setup and `status` shows the expected work. These are deterministic observations, not semantic acceptance. Follow the nearest `AGENTS.md`, keep the selected Change current and establish applicable required verification, reusing traceable passing evidence when its tested boundary and relevant inputs still apply. Before authorized archive, decide necessary knowledge updates, converge the whole Change and check current readiness.

[Read the full getting-started guide](./docs/site/en/getting-started.md).

## Artifact model

```text
.rsp/
├── version            # exact CLI package selection
├── specs/             # current contracts, boundaries, and constraints
├── changes/           # open work
├── focus.d/           # markers selecting work; optional short recovery capsules
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
- [Release notes](./docs/releases/3.3.0.md)
- [Maintainer tests and Skill validation](./tests/README.md)
- [Maintainer workflows, publication and documentation recovery](./docs/site/en/contributing.md)
- [Repository context and contract navigation](./CONTEXT.md)
- [Authoritative architecture and Specs](./.rsp/specs/design.md) and [maintainer research](./research/README.md)

Run the documentation locally:

```bash
pnpm docs:dev
pnpm docs:check
pnpm docs:build
```

The site is only a presentation layer over the Markdown in this repository. It adds bilingual navigation, local search, and page outlines without introducing a content database or runtime service.

## Platform support

RSP is a tool-agnostic file convention and works with any assistant or editor that can read project files. Humans start here; agents follow the nearest `AGENTS.md`, load the required project Core through host Skill discovery or `.agents/skills/rsp/SKILL.md`. Missing required Skills stop dependent work; there is no Rules fallback. Root `skills/` contains authored sources in the RSP repository, not the consumer installation entry.

The current source candidate records exact project versions, requires explicit adoption for upgrades, and retires Rules; see the [pinned Skills migration](docs/migrations/pinned-skills.md). These source changes do not establish publication. It installs the seven core Skills together with `rsp skills install`. Individual named installs are unsupported; each capability may still be invoked directly and reads shared Core definitions on demand. Structural discovery is now a conditional method of Review. See the [Skill migration guide](docs/site/en/guides/skills.md) for protected upgrades from older installations.

RSP is licensed under the [MIT License](./LICENSE).
