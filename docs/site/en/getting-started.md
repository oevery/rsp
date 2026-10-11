# Five-minute start

RSP requires Node.js 22 (`>=22`). Use the current stable release for setup and maintenance commands.

Run setup from the target project root. Later `rsp` examples assume the command is available; otherwise use `npx -y @oevery/rsp@latest <command>` with the same selected package.

## Initialize a project

```bash
npx -y @oevery/rsp@latest init --with-project-setup
```

This creates the `.rsp/` foundation, ensures the RSP entry in `AGENTS.md`, and creates `.rsp/changes/project-setup.md`. Fill that Change and `.rsp/specs/design.md`, then inspect the setup:

```bash
npx -y @oevery/rsp@latest doctor
npx -y @oevery/rsp@latest status
```

Confirm that `doctor` reports the intended setup and `status` shows the expected work. Neither result establishes semantic acceptance or grants further mutation authority.

Use `init --agents-mode print` when you need RSP to print the resulting `AGENTS.md` content as well as initialize the project. RSP owns only the block between `<!-- rsp:begin -->` and `<!-- rsp:end -->`; surrounding project instructions remain project-owned.

## Start one change

```bash
rsp create improve-login "Make login failures actionable"
rsp focus improve-login
rsp show improve-login
```

Focus is a set, so project-setup may remain focused alongside improve-login. Inspect the explicit name; show --focused succeeds only with exactly one marker. Starting this Change does not require archiving setup.

Edit `.rsp/changes/improve-login.md`. Keep its canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections. A focus marker selects current work; an open Change is not automatically current merely because its file exists.

Use the same kind-aware Change template for tracked work of any size. Do not create persistent tracking for every trivial session task.

During the current compatibility cycle, RSP accepts the legacy `rsp create --lite`, `--lite=true`, and `--lite=false` forms. They emit a deprecation warning and use this same standard kind-aware template; there is no separate lite renderer.

When no Change is focused and the user has not supplied a concrete task, ask what to work on or suggest `rsp create <name>` using the same selected CLI for tracked work. Simple current-session tasks should not create RSP changes unless tracking is intentionally needed.

## Work to acceptance

1. Read the nearest `AGENTS.md`, relevant context, focused Change, and only the Specs or Decision Records that own the affected behavior.
2. Refine unresolved outcome, scope, non-goals, acceptance, or design before implementation.
3. Implement within explicit mutation authority and establish proportionate verification. Reuse traceable passing evidence while its tested boundary and relevant inputs still apply; run missing, failed or invalidated checks. Explicit reruns and required independent execution remain binding.
4. Update Tasks, Verify, and Blockers with current outcomes rather than an execution transcript.
5. Verify outcome facts and write needed stable knowledge to its owner. Converge the entire Change after writeback, check final consistency and complete any required Review.
6. With lifecycle authority, inspect `rsp ready <work-ref> --json` and require `completionGate: pass` and `archiveReady: yes` before `rsp archive`. Readiness does not replace acceptance or the preceding semantic checks.

Archive does not grant Git, publication, or deployment authority. Reinspect the worktree and obtain those permissions separately.

## Install project Skills

Preview and install the default Skills from the stable package you invoke. These `@latest` commands do not install the unreleased source candidate; see [Skill ownership and candidate migration](./guides/skills.md) before replacing any existing package-owned or customized tree:

```bash
npx -y @oevery/rsp@latest skills install --dry-run
npx -y @oevery/rsp@latest skills install
```

The current source candidate installs all seven core Skills together and rejects individual named installs. Structural discovery is included in Review; it needs no separate Skill installation. Use the exact candidate CLI described in the migration guide rather than assuming the stable package has this behavior.

Next, read [core concepts](./concepts.md) or follow the [daily workflow](./guides/daily-workflow.md).
