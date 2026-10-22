# Exact versions and Skills-only workflow

This guide describes the unreleased source candidate, not a claim that the current
registry package includes these changes. Use a built candidate CLI for source
testing; after publication, choose an exact released target containing the change.
Historical release instructions remain historical.

## Routine execution

New setup records the selected CLI package version in `.rsp/version` and writes
its exact invocation into the managed AGENTS entry. Commit that selection with
project setup when Git delivery is authorized. In Skill examples, `rsp` denotes
this exact invocation or a verified matching executable. Never resolve `latest`
again for each operation. A different new CLI rejects ordinary commands before
dispatch; older published CLIs cannot be retrofitted with this guard.

Skills are now the only executable workflow. Missing required Skills stop dependent
agent work; they do not authorize fallback reading or implicit installation.
`doctor` compares installed trees against the selected package and reports missing
or divergent entries without replacing local customizations.

## Deliberate migration

1. Record the existing pin and preserve project files and customized Skills in a
   recoverable form. A Git commit containing the required content is sufficient.
2. Choose and inspect one exact target and its migration guidance. An upgrade
   notice is not permission to migrate. Existing projects must not rerun bootstrap
   discovery and silently adopt its result. Do not run different CLI versions
   concurrently against the same project's mutations.
3. With upgrade authority, run the target CLI with `update --adopt-version`. If
   `.rsp/rsp-rules.md` or `.rsp/rules/rsp-rules.md` remains, first preserve needed
   custom content, then explicitly add `--remove-legacy-rules`. Update refuses
   deletion without that flag and rejects symlinks/special files. Unrelated files
   under `.rsp/rules/` remain untouched. Init and doctor repair never silently repin.
   An incomplete legacy Rules inspection blocks mutation; restore access before
   retrying with the same exact target, rather than continuing from a failed upgrade.
   Boolean values use `--adopt-version=false`, not a detached `false` argument;
   update rejects positional arguments before adoption or deletion.
4. Keep the same target CLI for `skills install --dry-run --force`, inspect the
   proposed replacements/removals, then use `skills install --force` only with
   replacement authority. Refresh all seven core Skills together. `update` alone
   does not refresh the suite; an interrupted migration is not a consistent setup.
5. Run the same CLI's `doctor` and applicable project checks. Inspect the resulting
   diff before authorized Git delivery. Do not resume dependent agent work while
   required Skills are missing or unusable.

`doctor --check-updates` explicitly checks stable public metadata with a bounded
timeout. Network failure is informational and performs no upgrade. Ordinary CLI
execution does not query the registry; an npx launcher may still fetch the selected
package and requires its own package-fetch authority.

Removing a generated fallback from this checkout is recoverable through Git. For
consumer projects, explicitly selected deletion uses the update command rollback
boundary; successful deletion creates no permanent backup. Preserve needed content
beforehand. Restoring an older pin alone does not reverse an artifact migration or
prove arbitrary downgrade compatibility.
