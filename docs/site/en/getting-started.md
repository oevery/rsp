# Five-minute start

RSP requires Node.js 22 (`>=22`). Select one exact package version; existing projects keep their recorded version until an authorized migration.

Run setup from the target project root. Later `rsp` examples denote the exact invocation in AGENTS and `.rsp/version`, or a verified matching executable. For a new project only, resolve stable metadata once:

## Initialize a project

```bash
npm view @oevery/rsp dist-tags.latest
# Replace <version> with the inspected exact version.
RSP_VERSION='<version>'
npx -y @oevery/rsp@"$RSP_VERSION" init --with-project-setup
```

This creates the `.rsp/` foundation, ensures the RSP entry in `AGENTS.md`, and creates `.rsp/changes/project-setup.md`. Fill that Change and `.rsp/specs/design.md`, then inspect the setup:

```bash
npx -y @oevery/rsp@"$RSP_VERSION" status
```

Confirm that `status` shows the expected work; use read-only `doctor` when diagnosing setup. Neither result establishes semantic acceptance or grants further mutation authority.

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

## Update the project

Init installs all seven core Skills. To update, preserve needed custom content in
managed assets, select one exact target, then run that target's update command:

```bash
npx -y @oevery/rsp@"$RSP_VERSION" update
```

Here RSP_VERSION is the deliberately selected target, not a freshly resolved tag
on each operation. Optional update --dry-run previews without writes. No separate
Skill install, adoption or removal steps are needed. Unknown Skills, user
configuration and project knowledge remain untouched; local changes inside managed
Skills are replaced. See [migration details](./guides/skills.md#pinned-skills-only-migration).
These are source-candidate contracts, not proof of publication.

Next, read [core concepts](./concepts.md) or follow the [daily workflow](./guides/daily-workflow.md).
