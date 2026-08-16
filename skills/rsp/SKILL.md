---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.08.14.1"
---

# RSP Skill

Use RSP to derive one current action from project authority and durable work artifacts. This Skill is the preferred operational guide; `.rsp/rsp-rules.md` is the runtime fallback when the Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. Use the response-language and artifact-language rules in [response language](references/response-language.md) for user-visible narration and durable prose. Preserve canonical headings, paths, commands, identifiers, and machine values. WorkRefs are stable identities independent from prose language and locale; Shape owns naming when a new identity must be inferred.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, and the durable-update decision before archive. Do not use it for unrelated coding or create a Change for a simple session task unless the user explicitly requests tracking.

## Derive one next action

Read user intent, nearest authority, `rsp status --json`, the selected Change and its readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

Use the canonical transient control vocabulary from the maintainer Skill Control Model. `ControlOutcome`, route and stop dispositions, Continuation fields, phase-specific results, acceptance, and closeout remain response-only contracts; do not persist or redefine them here. Core may mutate only RSP control-plane state; product mutation belongs to Implement or a bounded manual Discipline action. Every stop is fail-closed until its declared resume rule succeeds.

Apply these routes in order:

Before later-turn mutation under a direct report, design, tiny, or small route, rederive from the newly authorized objective and prospective work. Independent slices, recovery, distinct execution and acceptance owners, repeated production-path correction, real-host/provider/hardware validation, bounded review convergence, managed lifecycle delivery, or a clear ready successor requires the smallest sufficient WorkRef plus fresh owner preflight and Manage qualification before mutation. Multiple files or documentation surfaces alone do not. Unchanged direct follow-ups remain direct. Elapsed time and message count alone never escalate work.

1. Route explicit fixed-scope review to `rsp-review`, release finalization or reconciliation to `rsp-release-docs`, and one bounded design question to installed `rsp-design`; never manually emulate it. Without a selected Change, use report-only Pre-Change Design without inventing a WorkRef or artifact. Only when unavailable, its manual fallback stays bounded to the same question.
2. Before the small-work decision, Core alone evaluates `workspace.activation`: `auto` permits parallel Changes, unrelated dirty work, an independent runtime boundary, or an explicit request; `explicit` permits only the explicit request; `disabled` denies RSP isolation. When isolation is selected, Core produces one four-field `WorkspaceSelection`: `WorkRef`, `materialSelectionReason`, `exactTargetBranch`, and `authorityReference`. Load `rsp-workspace` only after selection. Workspace selection grants no implementation, verification, lifecycle, Git, Land, or external authority.
3. Return `RouteDisposition: direct` only for one ready owner, one writer, one execution phase, one integrated decisive check, no recovery, no independent acceptance obligation, no managed lifecycle coordination, and no ready successor. Multiple changed files or documentation surfaces do not by themselves alter that route. Perform no Manage handoff or managed Assignment. Rederive before further mutation if any condition changes.
4. Core resolves whether one unambiguous shape-ready Change or shallow Group is the `WorkOwner` before Manage qualification. Missing or non-ready ownership reports `RouteDisposition: shape`; Core invokes Shape only with independently granted planning-artifact authority. Material product or authority questions stop for their `DecisionOwner`; ask one highest-impact owner question that resumes through fresh Core derivation after the answer. Invalid ownership, topology, dirty paths, scope, route, or authority stops for rerouting.
5. Read [managed routing](references/managed-routing.md) for initial qualification and handoff. On `selected`, pass the WorkRef, authority, evidence, closeout ceiling, return boundaries, and any Core-produced `WorkspaceSelection` to `rsp-manage`. Once selected, Manage solely owns same-goal revalidation, interruption and resume, selected-goal execution, and lifecycle orchestration; `rsp-commit` and `rsp-land` retain their exact local delivery procedures. Automatic selection grants routing only.
6. If Manage is declined, continue ordinary routing when the owner and authority are clear; otherwise return the one required input. For incomplete or failed evidence use [Implementation evidence](#implementation-evidence). When required Tasks and verification pass, load [durable writeback decision](references/durable-review.md); do not infer release, archive, Git, publication, approval, or human acceptance.

Return the canonical `ControlOutcome` fields in localized prose: derived stage, one next action, required input, returned owner, decisive evidence, and resume/rederivation rule. Preserve exact machine values as secondary technical values.

For managed evaluation, report `selected` or `declined` and the decisive signal; report sequential/parallel choice only when dispatch applies. Name at most one optional capability when it is the next action and available. A missing optional Discipline Skill does not invalidate RSP: use its bounded manual fallback against the same owner. This fallback never substitutes for a required managed worker or required independent Verify. Do not preload or recursively invoke capabilities.

### Implementation evidence

- **Diagnosis first:** diagnosis takes precedence over TDD for an evidenced but unexplained, conflicting, intermittent, or multi-layer failure. Use `rsp-diagnose` when available; its manual fallback reproduces, locates, and tests the smallest discriminating hypothesis. Do not encode an unexplained symptom as a guessed regression test.
- **TDD when justified:** use `rsp-tdd` only when test-first is explicitly required by the user, Change, or project instructions, or when a concrete changed risk makes a pre-mutation RED materially safer; mere testability or being a fix does not qualify. Its manual fallback observes the focused RED, makes the minimum GREEN change, and refactors only while green.
- **Ordinary implementation by default:** use `rsp-implement`, or the equivalent bounded edit and verification, once the behavior, cause, and owner are sufficiently evidenced.
- **Verification as one bounded action:** use `rsp-verify` for a read-only pass over the Change-declared evidence boundary. Verify owns its result; Core retains routing and continuation, and Manage retains worker identity, independence, acceptance, and closeout.

All branches return evidence, Tasks, Verify updates, and blockers to the same Change. Required verification proves acceptance or changed material risk; Optional verification adds environment, compatibility, scale, or confidence coverage. Fresh Required verification is mandatory, and optional omissions remain visible warnings.

## Operate the selected Change

Before focusing or mutating a different WorkRef, compare dirty product or durable-truth paths with the prior owner's paths. Overlap never transfers ownership; continue, explicitly reopen, use an authorized integration owner, or stop for boundary resolution. Disjoint work may proceed without staging or forcing a commit.

Read the focused Change, its sibling Group Brief when grouped, and only the relevant Specs and Decision Records. Use `rsp specs` for direct tree navigation or bounded literal discovery, then re-read the exact authoritative source before a material decision or mutation; generated index files are migration inputs, not navigation authority. Only a `focus.d/` marker path selects current work. Its optional bounded Markdown Focus Capsule is a Manager-owned lossy recovery projection, never selection, authority, acceptance, worker transport, or a serialized ExecutionFrame. A portable commit-safe capsule contains only a version comment plus `Current`, `Evidence`, `Next`, and exceptional `Resume check` guidance; it excludes worker identity, handles, machine-specific paths, ResourceLeases, raw Receipts, chronology, topology, authority, acceptance, logs, diffs, and duplicated tasks. Run the focused check before treating the owner as ready. Preserve the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections.

Keep the Change a convergent snapshot of the current plan and final decisive evidence. Replace superseded content; keep routine attempts, temporary probes, and command transcripts in the response. Persist only `open` and `archived`; focus, readiness, routing, and capability availability grant no implementation, review, Git, publication, or approval authority.

RSP work remains repository-native and one-shot. Derive workflow state from current artifacts and checkout evidence; do not require or recreate a Broker, SQLite observation store, managed-runtime adapter, Web Observatory, or hidden runtime synchronization layer.

When archived acceptance is incomplete, read [reopen recovery](references/reopen-recovery.md) before lifecycle mutation. Reopen requires explicit lifecycle authority and grants no Git or external authority.

Load detailed procedures only when active:

- [setup and repair](references/setup-repair.md) for initialization, audit, migration, or repair.
- [groups and dependencies](references/groups-dependencies.md) for grouped/dependent work.
- [conflict handling](references/conflict-handling.md) for an intersecting Git operation.
- [durable writeback decision](references/durable-review.md) after required Tasks and implementation verification pass.

## Ownership and safety

Route planned design to the selected Change; implemented facts to the smallest fact owner; rationale to one Decision Record; stable navigation to project-owned `CONTEXT.md`; operating rules to project-owned `AGENTS.md`; temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for command-owned files. Do not directly create command-owned files; preserve unrelated work. Core recommends archive only after the durable decision; it does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority. Detailed Manage closeout, local Commit, Workspace, Land, conflict, and recovery rules remain in their owning Skills or conditional references.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. Preserve technical values; the continuation is not a second state store. On same-session resume, reopen its pointers to authority and owned artifacts, inspect drift, replay safety, and refresh decisive evidence. On cross-session or cross-device resume, distrust transient worker, independence, lease, and liveness claims and rederive authority, focus, baseline, dirty state, resources, blockers, evidence freshness, route, and Manage qualification before mutation.

## Durable decision output

After loading [durable writeback decision](references/durable-review.md), choose current facts and rationale independently. Localize headings and labels, but preserve the canonical values below:

```md
## <localized Durable Decision heading>
- <localized Current facts label>: <No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>
- <localized Current-fact target label>: <exact file path or N/A>
- <localized Facts to write label>: <durable facts or none>
- <localized Decision Record label>: <No Decision Record needed | Create or update a Decision Record>
- <localized Decision Record target label>: <exact file path or N/A>
- <localized Rationale to write label>: <lasting rationale or none>
- <localized Archive ready label>: <yes | no>
```

Response-only Continuation and Durable Decision labels are not canonical artifact headings. In Chinese, for example, use `## 持久化决策`, `决策记录（Decision Record）`, and `可归档（Archive ready）`, not English labels alone. A required unwritten update, incomplete Task, incomplete Required Verify item, or real blocker makes archive readiness `no`; Optional coverage warnings do not. Before lifecycle closeout, consume a fresh `rsp ready <work-ref> --json` result and require `completionGate: pass` plus `archiveReady: yes`.
