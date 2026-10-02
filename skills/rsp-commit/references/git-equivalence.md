# Checked Git equivalence

Load for native execution, external checks around an older CLI, or recovery from a diagnosed pre-execution tool fault. This replaces the mechanism, not Commit ownership, authority, verification, staging or final-message audit. Respect a nearer required method or denial; availability is not permission.

Before switching after a tool failure:

- Diagnose the cause and inspect actual Git state independently. A refusal label or attempt: not_attempted alone is insufficient.
- Prove no commit invocation or uncertain effects; refresh authority, decisive verification and the same reviewed HEAD/tree and safeguards.
- Missing capability or a diagnosed transport/content heuristic permits equivalent execution only when all checks remain achievable.

Unrelated staging, active Git operations, stale snapshots, failed verification or incomplete safety inspection needs resolution, not another command. An attempted or created commit, or unknown effects, stops delivery without method switch or retry.

1. Confirm no active merge, cherry-pick, revert, rebase, mail-apply or sequencer state. Locate Git state through git rev-parse --git-path so worktrees are covered. Distinguish a confirmed missing symbolic branch from a failed HEAD read; only the former is unborn. An incomplete inspection stops execution.
2. Recheck HEAD and git write-tree against the reviewed snapshot immediately before execution. A changed tree or HEAD stops without index repair. Observe exact paths using NUL-delimited output so filenames are not split or quoted into different identities.
3. Invoke the selected command once. Native Git uses git commit --cleanup=verbatim with a safely prepared message file or direct child-process stdin. For a permitted older CLI, externally supply its missing snapshot checks and observations around its message-file invocation. Preserve project hooks and signing policy; do not disable them to obtain success.
4. Read the resulting HEAD, then obtain its raw message, tree, parents and paths by that immutable SHA, using git --no-replace-objects for object observations. Require the reviewed tree and paths, one parent equal to reviewed HEAD (none for unborn), the complete prepared message with only one terminal LF tolerance, and final HEAD still naming that commit. Inspect remaining staged, unstaged and untracked work.
5. Report exact delivery only after all checks pass. On Git failure inspect HEAD before classifying its effects; changed or unobservable effects forbid retry. On mismatch retain the observed commit and stop without amendment or another commit.

Report the selected mechanism and externally supplied checks. No equivalence grants archive, broad staging, index cleanup, remote delivery or history rewrite, or manual replacement of command-owned RSP artifact operations. If required safeguards cannot be established safely before execution, return capability-unavailable without committing.
