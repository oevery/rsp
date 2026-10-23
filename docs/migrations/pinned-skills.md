# Upgrade from RSP 3.3 to 4.0

RSP 4.0 changes configuration, Skill ownership and CLI interfaces. Use Node.js 22 or later. Keep the old environment recoverable, explicitly choose the new workflow policy, then update with the exact 4.0.0 CLI. Update does not migrate configuration or preserve local edits inside managed assets.

The commands below require access to the exact `@oevery/rsp@4.0.0` package. For an installed local candidate tarball, replace each `npx -y @oevery/rsp@4.0.0` invocation with `node /absolute/path/to/consumer/node_modules/@oevery/rsp/bin/rsp.mjs`. Use the installed candidate throughout that evaluation; its generated registry invocation does not prove registry availability. Do not use the registry 3.3.0 CLI to manage the RSP source checkout.

## 1. Preserve project and managed customizations

Start at the consumer project root. Stop other agents or tools that might update its managed files. Keep a recoverable copy of `.rsp/`, `AGENTS.md` and `.agents/skills/`, including any uncommitted or ignored content that matters. A Git snapshot is sufficient only for the content it actually captures.

Review local edits inside the seven core Skill directories, known retired Skill directories and `.rsp/rsp-rules.md` or `.rsp/rules/rsp-rules.md`. Update replaces or deletes these assets. Move ongoing instructions to project-owned AGENTS content outside the managed block or to separately named Skills before proceeding. Unknown Skill names remain untouched.

## 2. Explicitly migrate configuration and callers

Remove the entire `manage` mapping from `.rsp/config.yaml`, including its old `activation` and `closeout` values. Choose the replacement policy deliberately; this is a recommended starting point, not an automatic translation:

```yaml
workflow:
  delegation: off
  closeout: ask
```

`delegation` accepts `off` or `auto`. Off disables automatic dispatch while retaining explicit worker requests and required independent workers. `closeout` accepts `ask`, `auto` or `manual` and applies only to established final delivery. Ordinary completion and checkpoint commits keep work open. Old `local` closeout has no equivalent that grants Git permission; commit, push and publication remain separately authorized.

Keep other valid configuration and custom comments. Missing settings use read-time defaults. Old `manage`, mixed old/new configuration and invalid values cause config inspection and update to reject; neither command converts the file. Validate the chosen policy before updating:

```bash
npx -y @oevery/rsp@4.0.0 config --json
```

Require a successful result with the intended `workflow` projection. Change JSON consumers from `manage` to `workflow`, and review automation using older `status` fields: use `config --json` for effective settings and `status --json --verbose` when auxiliary status fields are needed.

Update project-owned AGENTS text and automation for these removed interfaces:

| Earlier interface | 4.0 action |
| --- | --- |
| Rules fallback | Load the installed required Skill; stop dependent work if it is missing |
| `skills install`, its installation terminal, `doctor --fix` | Use the selected target's complete `update`; diagnostics remain read-only |
| `rsp commit --message-file`, expected HEAD/tree options and JSON receipt | Use the `rsp-commit` Skill for authorized native Git delivery and its verification; migrate receipt consumers explicitly |
| `rsp-manage` | Core's conditional coordination method |
| `rsp-design` | `rsp-shape` |
| `rsp-diagnose`, `rsp-tdd`, `rsp-address-review`, `rsp-resolve-findings` | The applicable `rsp-implement` method |
| `rsp-codebase-audit`, `rsp-structural-audit` | Structural discovery in `rsp-review` |
| `rsp-release-docs` | Release communication in `rsp-doc`, or read-only document judgment in `rsp-review` |

These mappings change capability ownership, not the user's authorization. Native Git does not itself provide the removed commit wrapper's guards or receipt.

## 3. Preview and apply the exact target

```bash
npx -y @oevery/rsp@4.0.0 update --dry-run
npx -y @oevery/rsp@4.0.0 update
```

Inspect the preview before applying. It must not modify files. Update replaces the complete seven-Skill suite, removes known retired assets, refreshes only the managed AGENTS block and writes `.rsp/version` last. No separate Skill installation or force flag is needed. Do not substitute repeated init for an upgrade.

For a legacy 3.3 project without a pin, update establishes its initial `4.0.0` pin. For already pinned projects, ordinary commands keep the selected version; only the deliberately selected target's update can change it. Downgrades are unsupported. Older published CLIs do not acquire version guards retroactively, so remove old invocations from agents and automation.

## 4. Verify the project before resuming work

```bash
npx -y @oevery/rsp@4.0.0 config --json
npx -y @oevery/rsp@4.0.0 doctor --json
npx -y @oevery/rsp@4.0.0 skills list --json
npx -y @oevery/rsp@4.0.0 status --json
npx -y @oevery/rsp@4.0.0 check
```

Confirm `.rsp/version` is `4.0.0`, AGENTS names that exact invocation, all seven core Skills match the target and retired assets are absent. Doctor must report no unexplained setup issue. Confirm existing work, Specs, archives, Focus, custom Skills and project instructions remain intact. Check can report pre-existing incomplete work or placeholders; resolve those with their owner rather than weakening acceptance or rewriting history to make migration appear successful.

Update removes the two named Rules files but leaves their directories and unknown
contents in place. An empty directory is harmless. If Doctor reports unsupported
`.rsp/rules/` entries, inspect them and move any needed instructions to their
project-owned destination, then rerun Doctor. An owner may remove an empty directory
with `rmdir .rsp/rules`; do not recursively delete unreviewed contents.

Refresh the host's Skill discovery if needed, then resume agents with the updated project entry. A successful CLI check does not prove a host has reloaded its Skills or that an agent follows them.

## New setup and missing scaffolding

Use the selected CLI's init for new projects or deliberately creating missing user
scaffolding. It installs the complete suite and managed entry without overwriting
existing user files. Repeated init does not adopt another pinned version; incomplete
initialization can be retried with the same target CLI. Update does not repair user
directories or convert their content.

## Ownership

| Content | Update behavior |
| --- | --- |
| Seven named core Skill installation directories | Replace complete divergent trees, including obsolete files; unknown Skill names remain untouched |
| Exact retired Skill and Rules names | Delete |
| Metadata-recognized generated indexes | Delete; owner-controlled reserved paths stop preflight |
| AGENTS.md | Refresh only the managed block |
| .rsp/version (consumer projects) | Write last, after managed updates succeed |
| .rsp/source (RSP development checkout) | Preserve the explicit local-source selection; do not create a version pin |
| Config, Specs, Changes, Archives, Decision Records, Focus and CONTEXT | Do not rewrite, repair or create user content; recognized generated indexes are the explicit exception |

Missing configuration values use read-time defaults. Invalid configuration stops
preflight for owner correction; update does not migrate or normalize the file.
Canonical maintainer Skill links to the package sources are preserved. Other
symlinks or unsupported managed targets are rejected, not followed or replaced.

## RSP development checkout

This repository selects source mode with `.rsp/source` containing `.` instead of
`.rsp/version`. This is an explicit maintainer choice, not inferred from the package
name, directory name or a missing pin. Ordinary consumer projects keep exact pins.
Both markers together, malformed markers and symlinked markers are rejected.

Build with `mise exec -- pnpm run build`, then run
`mise exec -- node dist/cli.mjs <command>` from the checkout root. The running
package must belong to this checkout and its `src/cli.ts` must exist. Another
checkout's CLI cannot substitute even when versions match. Init/update retain
source mode and canonical Skill source links; doctor reports the local runtime
without directing it to a registry version. Mode changes require explicit owner
edits, not an update flag or automatic adoption.

The package version is metadata, not evidence of exact source contents or build
freshness. Rebuild after source changes and retain the commit, uncommitted diff
and build inputs with candidate evidence. Older published CLIs do not gain these
guards retroactively and must not be used to manage this source checkout.

## Failure, retry and return to an older environment

Setup prepares new file/Skill content before publishing it. Temporary content is
not a backup. There is no whole-update rollback, recovery copy store or recovery
command. A failed command stops, reports completed steps and leaves partial managed
updates in place; the version is not advanced before the update steps complete.

Fix the reported cause and rerun the same exact target CLI: init for incomplete
initial setup, update for an upgrade. Already-applied changes are repeatable.
Do not run competing updates or edit managed targets during setup. Neither arbitrary
external filesystem races nor process termination/power loss have recovery guarantees.

Doctor and skills list are read-only diagnostics. Only explicit doctor --check-updates
queries stable registry metadata; notices grant no upgrade authority.

For missing user scaffolding, restore the needed content or deliberately run init
to create defaults. For access or path-type errors, correct the reported filesystem
problem first. Update does not repair these user-owned paths.

There is no supported downgrade command. If the owner chooses to return to 3.3, stop
the new workflow and restore the complete recoverable pre-upgrade environment,
including config, managed assets, AGENTS and runtime selection. Do not run a 3.3
update against a partially upgraded 4.0 environment and assume it restores the old
state. Preserve any work done since the snapshot separately. For unresolved
migration issues, report the CLI version, failing command and redacted diagnostics
through the [issue tracker](https://github.com/oevery/rsp/issues); never include credentials.

## Validation boundaries

Build, type, offline task-schema, package and Doctor checks establish only their
tested source and environment. Schema validation starts no agents or judges.
Model results remain bound to their original source, Skills, dependencies, tasks
and runtime images; they cannot be combined into final-candidate acceptance or a
reliability estimate. Windows terminal behavior, broad independent-project
upgrades and full-corpus model acceptance require separate evidence.

An installed local archive does not establish registry availability, publication,
deployment or human acceptance. Use the installed archive throughout candidate
validation and keep its source identity, digest and verification evidence.
