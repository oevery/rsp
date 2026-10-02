# Core concepts

RSP separates open work, durable truth, lasting rationale, scoped instructions, and completed history. That separation keeps repository context discoverable without turning every artifact into a second source of truth.

## Artifact foundation

```text
.rsp/
├── rsp-rules.md
├── specs/
│   ├── design.md
│   └── decisions/
├── changes/
├── focus.d/
└── archives/
```

- `.rsp/rsp-rules.md` is the generated, tool-agnostic fallback protocol. Prefer the `rsp` Skill when it is available.
- `.rsp/specs/` stores current capability and collaboration contracts, boundaries, and necessary constraints, not code inventories or future plans. Use `rsp specs` to derive its current tree, inspect one exact document, or run bounded literal search directly from readable Markdown.
- `.rsp/specs/decisions/` is the default authoritative Decision Record directory. It stores lasting rationale, alternatives, tradeoffs, and consequences.
- `.rsp/changes/` stores open work. Each executable Change is one Markdown file.
- `.rsp/focus.d/` contains candidate markers. Their paths select work; optional Focus Capsules hold Core-maintained ongoing recovery notes and evidence pointers, not authority, acceptance or a runtime log. Use the existing v1 format in the [CLI reference](./reference/cli.md). Before terminal closeout, distill confirmed results into Change and selectively update stable knowledge; authorized archive clears Focus. Portable Capsules may accompany an authorized open-Change commit.
- `.rsp/archives/` retains completed Change history.

Stable scoped workflow and validation instructions belong in the nearest project-owned `AGENTS.md`, outside the managed RSP block.

Root and local `CONTEXT.md` files share one model: canonical vocabulary, domain relationships, and navigation. Create them only when useful; root context links to local owners instead of copying their definitions. `CONTEXT-MAP.md` is a migration input, not a separate model. An authorized migration preserves its meaning in CONTEXT files and updates references before retiring the map; `rsp update` never performs that semantic migration or deletes project context. README remains the introduction and usage entry, not another full specification.

Ordinary entry keeps legacy context discoverable and selects Core's context-migration branch only when a map is found or migration is requested. Until authorized migration, use relevant legacy content without blocking unrelated tasks; resolve conflicting definitions before dependent work. `rsp update` and `rsp doctor` report a root legacy map as guidance, even if CONTEXT already exists. `doctor --fix` does not merge or retire either file. Core owns reconciliation and retirement gates; Doc supplies substantial writing within that authority.

## Spec writing scaffold

New domain Specs start with Purpose, Boundaries, Contracts, Scenarios, and Constraints. These guide the writer through consumers/value, responsibility handoffs, behavior/invariants/failure semantics, key examples, and necessary limits. Scenarios are optional when they add no clarity; Given/When/Then is not required. Architectural Specs can use Structure, and protocol or design-reference Specs may retain their own meaningful headings. A design-reference table belongs in the Spec system when it supplies normative evidence, not merely because it contains links.

This is a default scaffold, not a required schema. Plain-prose HTML hints may remain or be removed; they do not fill placeholders or provide requirements or evidence. Keep material decisions and limitations visible outside comments. Put test results in the Change and significant rationale in a Decision Record. Prefer contracts that survive replaceable internals, and resolve Spec/code discrepancies rather than automatically documenting the implementation as correct. Update existing Specs when their meaning changes, not merely to normalize headings; historical Changes remain untouched.

Direct Specs queries are read-only and service-independent. They identify Decision Records separately, return checkout and source-path attribution, and never make a query result authoritative over the source file. Fresh initialization and Spec creation generate no Specs indexes. During compatibility migration, `rsp update` and `rsp doctor --fix` remove only metadata-recognized reserved indexes after complete preflight and direct-query postcheck; owner-controlled reserved content fails closed and is preserved.

## Repository-native operation

RSP derives workflow state from repository Markdown and current checkout evidence. Its CLI, package, and Skills provide no daemon, database, host synchronization adapter, Web runtime, browser observatory, or hidden runtime state.

The agent and owning capability interpret evidence and decide the next permitted action. Commands and scripts perform deterministic operations and return observations; a successful exit, readiness value or recommended action is not semantic approval. Focus and lifecycle mutations retain their owning CLI. Required evidence and independent acceptance cannot be replaced by a tool-completion label.

## One Change, one outcome

A Change owns one observable outcome with a shared acceptance, verification, review, archive, and rollback boundary. It keeps canonical sections for Proposal, Spec, Design, Tasks, Verify, and Blockers. Under Verify, `### Required` contains acceptance-critical evidence and `### Optional` contains additional environment, compatibility, scale, or confidence coverage. Legacy unclassified Verify items are treated as Required.

Proposal owns intent and scope; Spec owns the contract delta and acceptance, linked to existing Specs; Design owns the approach and tradeoffs; Tasks owns checkable work; Verify owns verification methods and actual results/gaps; Blockers owns unresolved decisions and dependencies. Keep small changes brief, reference rather than copy the full baseline, and prescribe task order only where correctness, safety, or migration requires it.

Keep it as a convergent plan and final-result snapshot. Focus holds ongoing recovery notes; detailed execution records stay with their report/host owner. Closeout distills results into Change and selectively writes stable knowledge, not chronology.

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
