---
name: rsp-rules
description: Minimal fallback protocol for Rules, Specs, and Plans driven development.
---

# RSP fallback protocol

This file is the minimal fallback protocol for agents that cannot load the `rsp` Skill. It is a compatibility and safety kernel, not a replacement for project instructions, installed Skills, or durable design documentation.

## Entry

- Read the nearest `AGENTS.md` and relevant `CONTEXT.md` before RSP work. Use the root `CONTEXT-MAP.md` when present.
- Apply this fallback before operating `.rsp/` only after the Core Skill is absent or cannot be used.
- Treat each `focus.d/` marker path as the only current-focus source. A marker may contain a short optional Markdown Focus Capsule with Manager-accepted recovery pointers, but its prose never selects work or grants authority, acceptance, lifecycle, Git, or worker coordination. For grouped work, read the sibling Group Brief before the explicitly focused child Change. Then read only the relevant Specs and Decision Records under the configured authoritative path.
- If `focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>`. Do not infer current work from open Changes or filenames.

## Ownership

- `changes/` owns open work, `archives/` owns completed history, `specs/` owns stable current facts, and the configured Decision Record path owns lasting rationale and tradeoffs.
- A Change owns one executable outcome and its acceptance, Tasks, verification, and blockers. Executable WorkRefs are `<change>` or one direct `<group>/<change>` child. A Group Brief provides shared context but is not executable or focusable.
- For a new inferred WorkRef, preserve explicit valid user input first, otherwise follow an explicit nearest project or domain naming convention, otherwise use ASCII lowercase kebab-case from stable domain or technical vocabulary. Language or locale settings never select or translate WorkRef language. Valid Unicode remains available through explicit input or project/domain convention, and existing identities are never renamed by later guidance.
- Persist only `open` and `archived` lifecycle state. Readiness, blockers, routes, and acceptance remain derived from current artifacts and evidence. A Focus Capsule may project accepted current work, next action, evidence validity, and blockers for recovery without becoming lifecycle or controller state. Under `## Verify`, `### Required` owns acceptance-critical evidence and `### Optional` owns additional coverage; legacy unclassified items are Required. Incomplete Tasks, Required verification, or blockers fail the completion gate, while Optional omissions remain visible warnings.
- Project-owned `AGENTS.md` and `CONTEXT.md` retain their own instruction and context authority. RSP does not replace them.
- Prefer RSP commands for deterministic setup, status, validation, repair, focus, Spec-index, history, archive, and reopen operations. Invalid identity, structure, dependency, managed path, symlink, or incomplete inspection fails closed.

## One bounded action

- Derive the next action from user intent, explicit authority, the selected WorkRef, its current Change and Group Brief when any, relevant durable facts, the worktree, and fresh status or verification evidence.
- Perform at most one bounded ordinary Core action or one optional Discipline action against the same owner. A mutation requires one ready owner, an explicit boundary, settled acceptance criteria, and one decisive verification. Do not auto-continue a successor or widen the boundary because more work is visible.
- When an optional Discipline Skill is unavailable, a compact manual fallback may cover only the same bounded owner and action. It never substitutes for a required managed worker, independent verification, unresolved product or authority decision, or missing acceptance.
- When the next action is a read-only pass over a Change-declared evidence boundary, use `rsp-verify` when available. Verify owns the bounded result and evidence; Core retains routing, and Manage retains worker identity, independence, acceptance, and closeout. If Verify is unavailable, a manual fallback may collect only the same declared evidence and must report the capability gap truthfully.
- Before later mutation or a different WorkRef, rederive authority and inspect dirty product and durable-truth paths. Continue the same owner, use an explicitly authorized reopen or integration owner, or stop for boundary resolution when ownership overlaps or remains uncertain.
- As the Core fallback, read the effective `workspace.activation` before the small-work decision for one explicit executable WorkRef. Under `auto`, select isolation only for AI-orchestrated work when parallel work, unrelated dirty paths, an independent runtime boundary, or an explicit user request makes it materially useful; under `explicit`, require the explicit-request signal; under `disabled`, never select or prepare an RSP workspace. When selected, keep one response-only four-field `WorkspaceSelection`: WorkRef, material selection reason, exact target branch, and authority reference. Evaluating policy and signals does not load the Workspace capability; load it only after selection. The public `rsp workspace` CLI remains a lower-level explicit infrastructure executor and does not prove Core selection, readiness, qualification, product acceptance, or authority. Its default branch is `rsp/<workref>`; resume matching ownership instead of creating host-branded or random-session branches. Ordinary temporary work remains in the current worktree.
- If the action becomes multi-owner, cross-boundary, dependent on managed coordination, or unsafe without an unavailable capability, stop. Return the missing capability or input, decisive evidence, next owner, and the condition for safe resumption.

## Durable routing

- Route planned future design to the selected Change; stable implemented facts to the smallest authoritative Spec or explicitly authorized project context; lasting rationale to the configured Decision Record path when warranted; and temporary execution or continuation state to the response.
- Keep a Change as a convergent current-plan and final-evidence snapshot, not an append-only execution log. Replace superseded plans and evidence; keep routine attempts, transcripts, and temporary probes out of durable artifacts.
- Before archive, judge current-fact and rationale updates independently, then compress the Change to the delivered outcome, current design, completed Tasks, decisive final verification, unresolved blockers, and remaining risk. Required verification must pass; Optional omissions may remain as explicit coverage warnings. Reclassifying incomplete Required evidence as Optional changes acceptance and requires explicit owner authority plus fresh readiness and review. Change Spec deltas are never promoted automatically.
- Use the response language for user-visible narration while preserving exact WorkRefs, paths, commands, headings, and machine values. Preserve each existing artifact's established language unless translation is explicitly authorized.

## Safety ceiling

- This fallback does not emulate `rsp-manage`, ready-owner qualification, worker dispatch, convergence loops, managed resume, workspace selection, or configured closeout. Configuration selects no capability and grants no planning, product-mutation, workspace, lifecycle, Git, publication, deployment, approval, or human-acceptance authority. `workspace.activation` is a ceiling consumed by Core when the full Skill is available; this fallback never prepares a worktree.
- Do not create or repair command-owned RSP files directly. Do not create archives or restore archived content by editing files; use the owning RSP command only with explicit lifecycle authority.
- This fallback never archives, closes a Group, stages, commits, tags, pushes, publishes, deploys, deletes unrelated work, or records external approval. Those actions require their own explicit authority and available owning capability.
- It also never lands commits between worktrees or discards a workspace without the exact local authority and owning capability.
- On malformed or incomplete evidence, ambiguous focus or ownership, unresolved decisions, unavailable required capability, failed verification, or out-of-scope work, fail closed without mutation. State what was inspected, what is missing, who owns the next decision or action, and what evidence or authority permits resumption.
- Return the selected `WorkRef`, effective authority, changed artifacts, fresh verification, blockers, and next action. This response is not durable truth or a second state store.
