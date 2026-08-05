# Core concepts

RSP separates open work, durable truth, lasting rationale, scoped instructions, and completed history. That separation keeps repository context discoverable without turning every artifact into a second source of truth.

## Artifact foundation

```text
.rsp/
├── rsp-rules.md
├── specs/
│   ├── 00-index.md
│   ├── design.md
│   └── decisions/
├── changes/
├── focus.d/
└── archives/
```

- `.rsp/rsp-rules.md` is the generated, tool-agnostic fallback protocol. Prefer the `rsp` Skill when it is available.
- `.rsp/specs/` stores durable current facts and agreed design. Every `00-index.md` is generated direct-child navigation, not an editable fact owner.
- `.rsp/specs/decisions/` is the default authoritative Decision Record directory. It stores lasting rationale, alternatives, tradeoffs, and consequences.
- `.rsp/changes/` stores open work. Each executable Change is one Markdown file.
- `.rsp/focus.d/` contains empty marker files selecting current work.
- `.rsp/archives/` retains completed Change history.

Stable scoped workflow and validation instructions belong in the nearest project-owned `AGENTS.md`, outside the managed RSP block.

## One Change, one outcome

A Change owns one observable outcome with a shared acceptance, verification, review, archive, and rollback boundary. It keeps canonical sections for Proposal, Spec, Design, Tasks, Verify, and Blockers.

Keep it as a convergent snapshot of the current plan and final decisive evidence. Temporary probes, debugging chronology, and routine command transcripts belong in the working conversation, not durable artifacts.

Change names can be flat (`<change>`) or one direct grouped child (`<group>/<change>`). Recursive work directories are invalid.

When RSP must infer a new WorkRef, an explicit valid user-supplied identity takes precedence, followed by an explicit nearest project or domain naming convention. Without either, the default is ASCII lowercase kebab-case derived from stable domain or technical vocabulary, such as `user-login`. Valid Unicode WorkRefs such as `听说训练/模拟朗读` remain supported when supplied explicitly or selected by project convention. Artifact language, commit language, response language, host locale, and TUI language do not choose or translate WorkRef language, and changing guidance never renames an existing identity.

An exact blocker line declares a dependency:

```md
- requires `<change-work-ref>`: <reason>
```

RSP does not infer dependency edges from free-form prose.

## Groups

A Change Group is the only composite work shape. Its non-executable `<group>/brief`, stored as `<group>/00-brief.md`, owns a shared goal, constraints, declared slices, completion conditions, durable outcomes, and group blockers for at least two direct child Changes.

Create the Group before its children. Each child is focused, verified, reviewed, and archived independently. Close the Group only after every declared child is complete. Reopening a closed Group or archived Change is explicit recovery; it does not rewrite Git or publication history.

## Lifecycle and durable review

The persisted lifecycle is deliberately small:

```text
open → archived
```

Readiness, blockers, recommended actions, group health, and managed state are derived rather than stored. Before archive, make two independent semantic decisions:

1. Do implemented current facts or scoped instructions need an existing or new durable owner?
2. Does a lasting rationale deserve a Decision Record?

Archive is history retention, not automatic promotion. Change `Spec` delta markers are planning aids; `rsp archive` never copies them into Specs or Decision Records.

See [configuration](./reference/configuration.md) for Decision Record routing and [daily workflow](./guides/daily-workflow.md) for operational steps.
