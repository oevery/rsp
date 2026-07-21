---
name: rsp-manage
description: Continue one explicitly authorized RSP Change through bounded execution, delegation, verification, and interruption recovery until a real evidence or authority boundary.
disable-model-invocation: true
license: MIT
metadata:
  author: oevery
  version: "2026.07.21.1"
---

# RSP Manage

Manage one focused RSP Change without becoming another project workflow. Use the existing Change, Group Brief, Specs, Decisions, project instructions, and worktree as authority; keep orchestration state run-local.

## Establish the run

Require explicit managed-continuation authority and one focused, ready Change. Read nearest project instructions, relevant context, current RSP status, the sibling Group Brief when present, the Change, relevant durable authority, and the current worktree.

Name the allowed mutation scope, required verification, external actions, environment or human acceptance, and a finite run budget before execution. When the user sets no tighter budget, use at most three dispatches and one corrective retry per dispatch. Preserve unrelated work.

Choose the lightest depth that can finish the authorized work:

- **direct:** one small action in the current context;
- **assisted:** one bounded capability or worker;
- **managed:** at least two independently bounded slices, or recovery from an interrupted run.

Subagents and proprietary resume features are optional accelerators. Execute directly when the host lacks them; capability availability never changes authority or completion evidence.

## Dispatch an envelope

For each assisted or managed slice, provide one dispatch envelope:

```md
## Dispatch Envelope
- WorkRef: <focused Change>
- Objective: <one observable slice>
- Inputs: <exact authoritative paths and fixed comparison>
- Output: <changed artifacts and evidence to return>
- Mutation: <exact allowed paths or read-only>
- Verification: <commands and acceptance evidence>
- Stop: <ambiguity, failure, environment, human, or external-action boundary>
- Budget: <dispatch and retry allowance>
```

Keep overlapping mutation scopes sequential. Parallelize only independent scopes with independent verification. A worker returns evidence to this controller; it does not gain focus, lifecycle, Git, publication, approval, or cleanup authority.

After every return, inspect the actual diff and fresh verification output. Reclassify new unexplained failures to diagnosis, clear behavior gaps to TDD, fixed-scope review requests to review, and accepted findings to review resolution. Select capabilities only when available; otherwise perform the same bounded procedure directly. Spend one retry only when new evidence identifies a corrective action inside the same envelope.

Complete a slice only when its output exists, its required checks are freshly observed, omissions are named, and the selected Change still owns the result. Continue to the next ready slice while budget and authority remain.

## Recover from interruption

Treat any handoff as transient pointers, not project truth. Resume by rereading user authority, nearest instructions, focus, Group Brief, Change, status, worktree, and referenced evidence. Compare them with the handoff; mark changed or unverifiable completion and verification claims pending.

Use a compact response receipt as the default recovery surface. Save one outside `.rsp/` only when the user authorizes a temporary artifact and the project ignores it. Never create a durable controller status, retry graph, or parallel lifecycle.

## Stop at the real boundary

Stop when one of these owns the next action:

- a material product or design decision needs the user;
- mutation, lifecycle, Git, publication, deployment, deletion, approval, or other external-action authority is absent or belongs to a project/host adapter;
- a required service, credential, device, environment, or human acceptance is unavailable;
- verification fails without an evidenced correction inside the current envelope;
- the worktree or authoritative artifact changed outside the envelope;
- the finite dispatch, retry, time, or context budget is exhausted.

Return rather than route around the boundary. Durable current facts and lasting rationale go to their existing Spec, scoped instruction, or Decision Record owner through the normal RSP durable decision; the controller never promotes them automatically.

## Return the receipt

```md
## Management Receipt
- WorkRef: <focused Change>
- Depth: <direct | assisted | managed>
- Completed: <slices with fresh evidence>
- Pending: <slices or stale claims>
- Verification: <command, scope, result, and omissions>
- Budget: <dispatches and retries used/remaining>
- Boundary: <owner and evidence, or none>
- Next action: <one bounded action>
- Durable owner: <Change, Spec, Decision, project instruction, or none>
```

Completion requires every authorized slice to satisfy its checkable Change contract and every omitted environment or human gate to remain explicit. This receipt grants no archive or delivery authority.
