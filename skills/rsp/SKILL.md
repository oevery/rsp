---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.08.21.3"
---

# RSP Skill

Use RSP to derive one current action from project authority and durable work artifacts. This Skill is the preferred operational guide; `.rsp/rsp-rules.md` is the runtime fallback when the Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. Use the response-language and artifact-language rules in [response language](references/response-language.md) for user-visible narration and durable prose. Preserve canonical headings, paths, commands, identifiers, and machine values. WorkRefs are stable identities independent from prose language and locale; Shape owns naming when a new identity must be inferred.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, and the durable-update decision before archive. Do not use it for unrelated coding or create a Change for a simple session task unless the user explicitly requests tracking.

## Derive one next action

Read user intent, nearest authority, `rsp status --json`, the selected Change and its readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

Use the canonical transient control vocabulary from the maintainer Skill Control Model. Before Core returns or composes a phase result, read the canonical [control outcome](references/control-outcome.md) contract. Route and stop dispositions, dispatch disposition, topology, lane results, acceptance, and closeout remain nested phase-specific details or gates; do not expose them as peer status flows or persist any control object. Core transfers current-phase control to Manage or one Discipline and receives its bounded result. Manage-to-worker communication is delegation, not control transfer: the worker never becomes owner of the managed goal. Core may mutate only RSP control-plane state; product mutation belongs to Implement or a bounded manual Discipline action. Every stop is fail-closed until its declared resume rule succeeds.

Apply these routes in order:

Before later-turn mutation under a direct report, design, tiny, or small route, rederive from the newly authorized objective and prospective work. Independent slices, recovery, distinct execution and acceptance owners, repeated production-path correction, real-host, provider, or hardware validation, bounded review convergence, managed lifecycle delivery, or a clear ready successor requires the smallest sufficient WorkRef plus fresh owner preflight and Manage qualification before mutation. Multiple files or documentation surfaces alone do not. Unchanged direct follow-ups remain direct. Elapsed time and message count alone never escalate work.

1. Route explicit fixed-scope review to `rsp-review`, release finalization or reconciliation to `rsp-release-docs`, and one bounded design question to installed `rsp-design`; never manually emulate it. Without a selected Change, use report-only Pre-Change Design without inventing a WorkRef or artifact. Only when unavailable, its manual fallback stays bounded to the same question.
2. Return `RouteDisposition: direct` only for one ready owner, one writer, one execution phase, one integrated decisive check, no recovery, no independent acceptance obligation, no managed lifecycle coordination, and no ready successor. Multiple changed files or documentation surfaces do not by themselves alter that route. Perform no Manage handoff or managed Assignment. After the direct result and fresh verification exist, explicit local commit authority may route exactly once to `rsp-commit` with a `direct` owner summary, exact allowed paths, decisive evidence, and current authority; do not invent a Change, WorkRef, lifecycle state, or RSP trailer. An available Commit refusal returns its real missing condition to Core and never becomes a manual fallback. Rederive before further mutation if any condition changes.
3. Core resolves whether one unambiguous shape-ready Change or shallow Group is the `WorkOwner` before Manage qualification. Missing or non-ready ownership reports `RouteDisposition: shape`; Core invokes Shape only with independently granted planning-artifact authority. Material product or authority questions stop for their `DecisionOwner`; ask one highest-impact owner question that resumes through fresh Core derivation after the answer. Invalid ownership, topology, dirty paths, scope, route, or authority stops for rerouting.
4. Read [managed routing](references/managed-routing.md) for initial qualification and handoff. On `selected`, pass the WorkRef, authority, evidence, closeout ceiling, and return boundaries to `rsp-manage`. Once selected, Manage solely owns same-goal revalidation, interruption and resume, selected-goal execution, and lifecycle orchestration; `rsp-commit` retains the exact local delivery procedure. Automatic selection grants routing only.
5. If Manage is declined, continue ordinary routing when the owner and authority are clear; otherwise return the one required input. For incomplete or failed evidence use [Implementation evidence](#implementation-evidence). When required Tasks and verification pass, load [durable writeback decision](references/durable-review.md); do not infer release, archive, Git, publication, approval, or human acceptance.

Return the canonical outer `ControlOutcome` in localized prose through the Core-owned contract. Preserve exact machine values as secondary technical values and keep route, dispatch disposition, or topology only as nested technical evidence.

For managed evaluation, report `selected` or `declined` and the decisive signal; report a sequential or parallel choice only when dispatch applies. Name at most one optional capability when it is the next action and available. A missing optional Discipline Skill does not invalidate RSP: use its bounded manual fallback against the same owner. This fallback never substitutes for a required managed worker or required independent Verify. Do not preload or recursively invoke capabilities.

### Implementation evidence

For incomplete or failed implementation evidence, read [implementation evidence](references/implementation-evidence.md) before selecting Diagnose, TDD, ordinary Implement, or Verify. Diagnosis precedes TDD; every branch returns evidence to the same Change, and fresh Required verification remains mandatory.

## Operate the selected Change

Before focusing or mutating a different WorkRef, compare dirty product or durable-truth paths with the prior owner's paths. Overlap never transfers ownership; continue, explicitly reopen, use an authorized integration owner, or stop for boundary resolution. Disjoint work may proceed without staging or forcing a commit.

Read the focused Change, its sibling Group Brief when grouped, and only the relevant Specs and Decision Records. Use `rsp specs` for direct tree navigation or bounded literal discovery, then re-read the exact authoritative source before a material decision or mutation; generated index files are migration inputs, not navigation authority. Only a `focus.d/` marker path selects current work. When a Focus Capsule exists, is inspected or mutated, reports warnings, or a continuation resumes, read [focus and continuation recovery](references/focus-continuation.md). Run the focused check before treating the owner as ready. Preserve the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections.

Keep the Change a convergent snapshot of the current plan and final decisive evidence. Replace superseded content; keep routine attempts, temporary probes, and command transcripts in the response. Persist only `open` and `archived`; focus, readiness, routing, and capability availability grant no implementation, review, Git, publication, or approval authority.

RSP remains repository-native and derives workflow state from current project artifacts and checkout evidence; it requires no hidden runtime state.

When archived acceptance is incomplete, read [reopen recovery](references/reopen-recovery.md) before lifecycle mutation. Reopen requires explicit lifecycle authority and grants no Git or external authority.

Load detailed procedures only when active:

- [setup and repair](references/setup-repair.md) for initialization, audit, migration, or repair.
- [groups and dependencies](references/groups-dependencies.md) for grouped or dependent work.
- [conflict handling](references/conflict-handling.md) for an intersecting Git operation.
- [durable writeback decision](references/durable-review.md) after required Tasks and implementation verification pass.

## Ownership and safety

Route planned design to the selected Change; implemented facts to the smallest fact owner; rationale to one Decision Record; stable navigation to project-owned `CONTEXT.md`; operating rules to project-owned `AGENTS.md`; temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for command-owned files. Do not directly create command-owned files; preserve unrelated work. Core recommends archive only after the durable decision; it does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority. Detailed Manage closeout, local Commit, conflict, and recovery rules remain in their owning Skills or conditional references. Execution-environment selection and cross-branch integration remain host, user, or Git concerns outside RSP workflow state.

When accepted work remains or a continuation resumes, read [focus and continuation recovery](references/focus-continuation.md), then return a localized continuation with these semantic fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. Preserve technical values; the continuation is not a second state store. On resume, reopen its pointers to authority and owned artifacts, inspect drift and replay safety, and refresh decisive evidence before mutation.

## Durable decision output

After loading [durable writeback decision](references/durable-review.md), use its canonical localized output and choose current facts and lasting rationale independently. A required unwritten update, incomplete Task, incomplete Required Verify item, or real blocker makes archive readiness `no`; Optional coverage warnings do not. Before lifecycle closeout, consume fresh `rsp ready <work-ref> --json` evidence with `completionGate: pass` and `archiveReady: yes`.
