---
name: rsp-land
description: Land an explicit ordered commit set from one recorded RSP workspace into its exact local target branch, preserving unrelated dirty work and retaining conflicts for recovery.
license: MIT
metadata:
  author: oevery
  version: "2026.08.06.1"
---

# RSP Land

Transfer one exact local commit boundary from a recorded RSP workspace. Land is separate from implementation, review, lifecycle closeout, Commit, push, and publication.

## Require exact authority

Require Core or qualified Manage to provide:

- one executable WorkRef and matching workspace record;
- explicit local landing authority;
- the exact target branch;
- an ordered explicit commit list produced by the workspace branch;
- decisive verification and review state required by the Change;
- whether successful cleanup is authorized.

Inspect the source workspace branch and worktree, target worktree, target HEAD, staged, unstaged, and untracked target paths, each commit and its changed paths, and every in-progress Git operation. Stop before cherry-pick when ownership, target, commit reachability, order, dirty-path overlap, or authority is ambiguous. Unrelated dirty target paths are preserved; overlap is not silently resolved.

## Land

Run:

```sh
rsp land <workref> --target <branch> --commits <sha[,sha...]> [--cleanup]
```

The CLI must verify that every commit is reachable from `rsp/<workref>` and that the target is the branch recorded at workspace preparation. `--cleanup` additionally requires the explicit commit list to equal every workspace commit ahead of the target.

Observe the target HEAD before and after cherry-pick. Never amend, squash, rebase, merge, reset, abort, continue, push, or resolve a conflict unless separately authorized by its owning procedure.

## Stop and return

On conflict or any cherry-pick failure, preserve the source workspace and the target Git operation exactly as observed. Return the WorkRef, source branch, target branch and worktree, commits, before and after HEADs, conflicting paths when available, and the exact recovery owner. Do not infer abort or cleanup.

After success, report the landed commits, target HEAD, remaining target dirty paths, and cleanup result. Cleanup removes only the recorded source worktree and exact workspace branch. Push and publication remain explicit external actions.
