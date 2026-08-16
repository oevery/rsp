---
name: rsp-workspace
description: Prepare, inspect, operate, recover, or safely dispose one isolated Git worktree for an explicit ready RSP WorkRef while leaving project-semantic planning and execution to the active AI or human operator.
license: MIT
metadata:
  author: oevery
  version: "2026.08.06.5"
---

# RSP Workspace

Operate one isolated workspace selected by Core for AI-orchestrated work. Manage may allocate or reuse sessions only after that selection. The public `rsp workspace` CLI is a lower-level explicit infrastructure executor: it validates local policy and mechanical ownership invariants but does not infer or attest Core selection, Change readiness, Manage qualification, product acceptance, or authority. This Skill is execution infrastructure, not a WorkOwner, project adapter, completion controller, Discipline, or Git delivery grant.

## Require a selected boundary

For Skill-driven operation, require Core's policy-compliant `WorkspaceSelection` for one executable open WorkRef plus explicit workspace authority. Consume the invoking `WorkspaceSelection` without redefining it: its only fields are WorkRef, material selection reason, exact target branch, and authority reference. Workspace defaults to `explicit`; only a current explicit isolation request permits selection. `auto` is an advanced project opt-in that additionally permits current parallel Changes, unrelated dirty work, or an independent runtime boundary; `disabled` never enters this Skill. An explicit request handled by Core does not select this Skill by itself. A human may invoke the low-level CLI explicitly, but that invocation supplies only command authority and never becomes evidence of semantic selection or readiness. Ordinary temporary work remains in the current worktree. Without an RSP WorkOwner, create no implicit or host-branded branch.

Workspace is pre-mutation infrastructure. Before mutation inspect the selected Change and Group Brief when any, current branch and HEAD, source-checkout product changes, existing `rsp/<workref>` branch, registered worktrees, target dirty paths, and any existing workspace record. If the invoking selection has not been refreshed immediately before preparation, its material reason is stale, or selected product mutation already exists in the source checkout, stop without running `rsp workspace prepare` and require an explicit owner-directed handoff. Never copy only RSP control files and silently continue. Stop on identity, ownership, path, target, or authority ambiguity. The CLI remains a mechanical ownership executor; it never turns one WorkRef, one writer, same-WorkRef Change and focus mutations, or a provider or evaluation harness directory into semantic isolation evidence, and it never decides whether the current checkout is sufficient.

## Prepare and inspect

Use `rsp workspace prepare <workref> --target <branch>`. The default branch identity is exactly `rsp/<workref>`. New preparation rejects source dirty paths outside the selected owner-control files. Use `--allow-dirty-source` only after Core or the human owner has established that those paths are unrelated; the flag never proves that classification or migrates product changes. Resume matching recorded ownership; never create a random session branch to bypass stale or conflicting state.

Use `rsp workspace inspect <workref> --json` for bounded facts: workspace identity, tracked paths, local-only paths, changed paths, dirty paths, and commits ahead of the target. Facts contain no project-semantic classification. Read relevant repository files with normal host tools before deciding setup, commands, verification, or preview behavior.

## Reuse the invoking control contract

The active AI or human owns project-semantic interpretation. Do not create a workspace-specific decision, disposition, authority envelope, next-owner field, or stop vocabulary. Reuse the invoking owner's existing contract:

- Core retains its `ControlOutcome` and canonical `StopDisposition`.
- Manage retains its ExecutionFrame, Assignment and Receipt contracts, frontier classification, and authority envelope.

When that contract needs workspace detail, append only observed workspace facts in a `Workspace context`: exact observed path, branch, target branch, dirty paths, commits ahead, registered activities, shared resources, and intended workspace-local actions. Never add these observations back into `WorkspaceSelection`. Keep both transient. A WorkerSession does not imply this context or prove that a worktree was used. Do not persist it, turn it into project configuration, serialize it as a universal execution plan, or ask the CLI to interpret it.

## Execute with host-native capabilities

Use the host's existing file, shell, package, browser, and process capabilities inside the exact workspace path. The current repository and selected Change determine the commands; this Skill defines no framework, package-manager, service, environment-file, readiness, or deployment schema.

Materialize only evidenced local inputs needed by the selected action. Prefer an idempotent link or copy, never overwrite a different destination, never emit secret contents, and record the source and destination in the final receipt. Installing dependencies, accessing a network, reading credentials, mutating external state, starting a long-running process, binding a host resource, or opening a browser requires the same explicit authority it would require in the ordinary worktree.

Diagnosis, TDD, implementation, review, and commit remain owned by their existing Skills and reuse this workspace. Do not create nested workspaces or use workspace isolation to broaden their authority.

## Register recoverable activities

The host starts and verifies long-running processes. After a process is observed running, register only the cleanup identity and optional cooperative resources:

```text
rsp workspace activity register <workref> --id <id> --pid <pid> \
  [--label <text>] [--process-group <pgid>] [--resources <id[,id...]>]
```

Pass `--process-group` only when the host created an independent process group and the value has been verified. Registration captures a stable process-start identity; later stop or disposal must fail closed rather than signal when that identity cannot be revalidated. Resource ids are opaque exclusive coordination names; registration prevents another RSP workspace from claiming the same name while the recorded owner identity is alive. A stale cooperative lease is not removed by a competing registration: stop or dispose its recorded activity first, wait for acknowledged termination, then retry. Workspace registration is one implementation for recoverable process resources, not the universal managed ResourceLease model, an operating-system sandbox, or proof that an undeclared process cannot use the resource.

Use `rsp workspace activity stop <workref> --id <id>` to stop one recorded activity and release its resources. If registration fails after the host starts a process, stop that process through the host before returning.

## Return through the invoking result contract

After the selected action, return through the invoking owner's existing result surface:

- Manage receives its ordinary common receipt and lane-specific fields.
- Core receives the ordinary invoking result or, when work remains, the canonical Continuation.

Append only `Workspace observations`: operation performed, exact path/branch/target, changed local resources, active activities, and cleanup state. Evidence, omissions, effective authority, result, next owner, and stop boundary remain owned by the invoking contract and are not redefined here.

Report what was observed, not what a planned command was expected to do. Workspace observations are not durable workflow state and do not themselves prove implementation acceptance, review, commit eligibility, or external-system correctness. When stopping, use the invoking contract's existing canonical stop reason rather than inventing a workspace-specific status.

## Dispose safely

Use `rsp workspace dispose <workref>` only when the worktree is clean and every workspace commit is absent from the target or already patch-equivalent there. Ordinary disposal accepts `landed` and `landed-equivalent` delivery states, rejects `unlanded`, stops every recorded activity, releases its cooperative resources, and removes only the registered path and exact branch owned by the workspace record. `cleanupReady` has this same meaning on direct and global status; active activities remain separately visible. Patch equivalence is mechanical delivery evidence only; it never proves Change acceptance or lifecycle closeout.

Use `rsp workspace prune <workref>` to report exact orphan evidence without mutation. `--apply` requires explicit cleanup authority and may remove only a valid record whose branch, worktree, cache path, and live activities are absent, releasing only its owned leases. An unparsable exact regular record under the same absence proof is quarantined for recovery rather than deleted. Any present or ambiguous resource blocks pruning.

`--discard` is destructive authority. Require an explicit request that names the workspace and accepts loss of its uncommitted changes and unlanded commits. On dirty state, unlanded commits, missing registration, changed ownership, activity-stop failure, or cleanup failure, preserve the workspace and report the exact recovery condition.

Return changed local resources, fresh observations, evidence, omissions, and the next owning Skill. Never infer Commit, Land, conflict resolution, archive, push, publication, deployment, or approval authority.
