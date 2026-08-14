# Five-minute start

RSP requires Node.js 22 (`>=22`). Use the current stable release for setup and maintenance commands.

## Initialize a project

```bash
npx -y @oevery/rsp@latest init --with-project-setup
```

This creates the `.rsp/` foundation, ensures the RSP entry in `AGENTS.md`, and creates `.rsp/changes/project-setup.md`. Fill that Change and `.rsp/specs/design.md`, then inspect the setup:

```bash
npx -y @oevery/rsp@latest doctor
npx -y @oevery/rsp@latest status --json
npx -y @oevery/rsp@latest status
```

Use `init --agents-mode print` when you need RSP to print the resulting `AGENTS.md` content as well as initialize the project. RSP owns only the block between `<!-- rsp:begin -->` and `<!-- rsp:end -->`; surrounding project instructions remain project-owned.

## Start one change

```bash
rsp create improve-login "Make login failures actionable"
rsp focus improve-login
rsp show --focused
```

Edit `.rsp/changes/improve-login.md`. Keep its canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections. A focus marker selects current work; an open Change is not automatically current merely because its file exists.

Use the same kind-aware Change template for tracked work of any size. Do not create persistent tracking for every trivial session task.

During the current compatibility cycle, RSP accepts the legacy `rsp create --lite`, `--lite=true`, and `--lite=false` forms. They emit a deprecation warning and use this same standard kind-aware template; there is no separate lite renderer.

When no Change is focused and the user has not supplied a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work. Simple current-session tasks should not create RSP changes unless tracking is intentionally needed.

## Work to acceptance

1. Read the nearest `AGENTS.md`, relevant context, focused Change, and only the Specs or Decision Records that own the affected behavior.
2. Refine unresolved outcome, scope, non-goals, acceptance, or design before implementation.
3. Implement within explicit mutation authority and run fresh, proportionate verification.
4. Update Tasks, Verify, and Blockers with current outcomes rather than an execution transcript.
5. Decide whether stable facts, lasting rationale, or scoped instructions need a durable owner.
6. Archive only after acceptance and required checks pass and no blocker remains.

Archive does not grant Git, publication, or deployment authority. Reinspect the worktree and obtain those permissions separately.

## Install project Skills

Preview and install the fourteen default Skills from the exact RSP package being used:

```bash
npx -y @oevery/rsp@latest skills install --dry-run
npx -y @oevery/rsp@latest skills install
```

The optional report-only structural audit is installed by exact name:

```bash
rsp skills install rsp-structural-audit --dry-run
rsp skills install rsp-structural-audit
```

Next, read [core concepts](./concepts.md) or follow the [daily workflow](./guides/daily-workflow.md).
