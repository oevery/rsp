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
- `.rsp/specs/` stores durable current facts and agreed design. Use `rsp specs` to derive its current tree, inspect one exact document, or run bounded literal search directly from readable Markdown.
- `.rsp/specs/decisions/` is the default authoritative Decision Record directory. It stores lasting rationale, alternatives, tradeoffs, and consequences.
- `.rsp/changes/` stores open work. Each executable Change is one Markdown file.
- `.rsp/focus.d/` contains empty marker files selecting current work.
- `.rsp/archives/` retains completed Change history.

Stable scoped workflow and validation instructions belong in the nearest project-owned `AGENTS.md`, outside the managed RSP block.

Direct Specs queries are read-only and service-independent. They identify Decision Records separately, return checkout and source-path attribution, and never make a query result authoritative over the source file. Fresh initialization and Spec creation generate no Specs indexes. During compatibility migration, `rsp update` and `rsp doctor --fix` remove only metadata-recognized reserved indexes after complete preflight and direct-query postcheck; owner-controlled reserved content fails closed and is preserved.

## Optional runtime

RSP can explicitly start one compatible user-level Broker for runtime capabilities. The Broker is a local loopback transport and lazy checkout-session host, not another workflow engine or source of truth. Each canonical repository or worktree receives a distinct project identity, in-memory access token, and disposable namespace; idle sessions unload without changing repository files.

Ordinary CLI work remains service-independent. `rsp status`, `rsp check`, `rsp show`, `rsp ready`, `rsp specs`, lifecycle, Git, and repair commands do not start the Broker or create its cache. Protocol or runtime-schema incompatibility fails closed instead of creating an automatic side-by-side service.

Doctor may inspect existing discovery, runtime, and bounded context state read-only. Stale context is disposable information, while incompatible or corrupt runtime state carries bounded recovery guidance. Repository migration never silently disposes cache state; explicit disposal is scoped to one resolved checkout namespace after the exact owner is closed.

When a runtime operation needs retained observations, its Broker session lazily opens one checkout-scoped SQLite database. Dispatches, events, and receipts record what the runtime actually observed; every new boundary advances one committed run sequence while duplicate delivery retains the original effect and sequence. Guarded checkpoints and bounded context packets are disposable projections. The optional `rsp.manage-runtime@1.0` adapter correlates only host-confirmed managed runs, exact dispatch and worker identities, structured events and receipts, attention, pause/resume, an explicit terminal boundary, and bounded context. Worker events require an existing matching dispatch. Context save and hydration use only the runtime service clock, and a packet becomes stale after any later committed observation. It never parses worker prose, creates workers, schedules retries, or owns routing, acceptance, closeout, or Git.

Managed run and attention projections return at most 32 source-referenced items and remain explicitly non-authoritative. Resume context is bounded to 12 KiB and 24 hours. Hydration always revalidates checkout, WorkRef, Git, dirty paths, authority, expiry, and complete source identities, rereads current authority pointers, and reloads changed evidence; authority or checkout drift requires a full reread. Removing or losing the database removes runtime convenience only—Markdown work, history, readiness, lifecycle, and no-runtime Manage behavior remain unchanged.

The package installation and ordinary Markdown/CLI boundary is Node.js `>=22`. The optional runtime lazily uses the built-in `node:sqlite` module and requires Node.js `>=22.13.0`; it installs no native SQLite addon. An older Node 22 runtime or explicit SQLite disablement makes runtime opening fail with a precise diagnostic while ordinary CLI inspection remains available.

The default package does not expose the retained Web Observatory source as a CLI command, Broker route, projector entry, or browser asset. Markdown artifacts, one-shot CLI queries, and optional runtime APIs remain the supported observation surfaces.

## One Change, one outcome

A Change owns one observable outcome with a shared acceptance, verification, review, archive, and rollback boundary. It keeps canonical sections for Proposal, Spec, Design, Tasks, Verify, and Blockers. Under Verify, `### Required` contains acceptance-critical evidence and `### Optional` contains additional environment, compatibility, scale, or confidence coverage. Legacy unclassified Verify items are treated as Required.

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
