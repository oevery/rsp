# Conflict handling

Load this reference only when an active merge, rebase, or cherry-pick conflict intersects authorized implementation.

1. Inspect the exact Git operation, conflicted paths, index/worktree, and pre-existing user edits.
2. Interpret base, ours, and theirs in that operation; resolve behavior from authority and evidence rather than choosing a side mechanically.
3. Modify only evidenced content inside the WorkRef and mutation authority. Preserve unrelated work and do not stage without separate authority.
4. Stop for unrelated user work, an unresolved product decision, incomplete side/base evidence, or out-of-scope content. Return the exact conflict and owner input.
5. After an authorized working-tree resolution, rerun affected checks.

Conflict-resolution authority does not authorize continuing or aborting the Git operation, staging, committing, or pushing.
