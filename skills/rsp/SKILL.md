---
name: rsp
description: Continue an authorized RSP request through implementation, checks and writeback; coordinate conditionally for real multi-owner, recovery or independent-acceptance obligations, and operate or repair RSP state.
license: MIT
metadata:
  author: oevery
  version: "2026.09.29.1"
---

# RSP Skill

Use RSP to carry one authorized request through its meaningful completion boundary: resolve ownership and authority once, continue implementation and its own checks, perform necessary writeback, then finish. Recheck only on changed facts, recovery, independent acceptance, delivery, or a real stop. This Skill is the preferred operational guide; the generated fallback is used only when this Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. User-visible prose follows explicit response language, then personal instructions, then conversation language; existing artifacts retain their language, and new artifacts follow explicit artifact language, effective configuration, project instructions, then conversation language. Preserve canonical headings, paths, commands, identifiers, and machine values. Load [language details](references/response-language.md) only for a contested or complex language choice. WorkRefs do not change with locale; Shape owns inferred names.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, coordination when genuinely needed, and the durable-update decision before archive. Do not create a Change for a simple session task unless tracking is authorized and needed.

## Select responsibility before loading

Read the request and authority, nearest project context, open focus candidates and relevant owner, status/readiness when tracked, checkout state, and decisive evidence. Resolve an explicit WorkRef first; multiple focus markers are candidates, not a stop. Use plain `rsp status` for ordinary state, JSON for exact dependency fields, and verbose JSON for downgraded details. Status does not project effective Manage or language configuration; only `rsp config --json` or the configuration file does. Do not read coordination configuration for routine work. Stages are derived, never persisted.

Core owns goal, owner, authority, cross-responsibility decisions, results, and necessary writeback, not product edits. Choose the next responsibility before loading its detail. For a fixed-scope read-only review use `rsp-review`; release documentation uses `rsp-release-docs`. Design advice or planned shaping uses `rsp-shape`, without assuming artifact authority. An unexplained symptom, authorized fix, or fixed review report with a bounded investigation request uses `rsp-implement` with its matching conditional mode; only an accepted finding with separate correction authority permits mutation. Explicit read-only or independently required verification uses `rsp-verify`; the implementer performs ordinary own checks without a forced Verify handoff. Local delivery uses `rsp-commit` only with exact separate authority. Optional open-ended read-only discovery uses `rsp-structural-audit`. Do not treat a change of method inside one owner as a new phase requiring another user request.

Continue within the same authorized objective through edits, fresh Required checks and necessary writeback. Stop for a material owner decision, scope or authority change, an unavailable required capability, unsafe replay, or evidence that fails without a new discriminating step. Same-scope failure may be diagnosed and corrected internally; do not force a Core return for every failed check. Do not claim independent review from self-checks. Before a final response, load [control outcome](references/control-outcome.md) only when its technical rendering is needed by a real consumer; otherwise report outcome, evidence, limits and next action naturally.

## Conditional coordination

Only when the request has a genuine coordination obligation—independent slices or acceptance, recovery, incompatible resources, real-host/provider/hardware verification, bounded review convergence, or managed lifecycle delivery—load [coordination qualification](references/managed-routing.md). Multiple files, effort, sequential edits, and ordinary continuation alone do not qualify. Selection is not delegation; workers and concurrency require host evidence. On this branch read effective `manage.activation` and `manage.closeout` from `rsp config --json` or configuration, never status. An unavailable optional sibling uses a bounded equivalent action under the same authority; a required independent worker or reviewer cannot be simulated locally. Ordinary execution never activates configured managed closeout.

On a coordinated branch Core retains goal ownership. Pass bounded work and current authority to the selected responsibility, consume its result and continue while the boundary holds. Load [worker and resource coordination](references/coordination.md) only for workers or resource conflicts, [interruption recovery](references/coordination-recovery.md) only for pause/resume or an environment stop, [review convergence](references/coordination-review.md) only for repeated accepted findings, and [closeout](references/closeout.md) only for qualified lifecycle/delivery or an authorized checkpoint. Exact Git execution remains `rsp-commit`. Activation does not grant authority; qualified closeout is a limited ceiling subject to nearer denial.

Report a coordinated route and decisive signal only when coordination was selected. Keep dispatch, worker count, acceptance and closeout as nested technical evidence; never persist a controller record. A missing optional Skill permits an equivalent bounded method, but not a fictitious independent result. Do not pre-load unrelated methods or repeatedly reread the complete owner without invalidation.

## Operate the selected Change

Before focusing or mutating a different WorkOwner or child WorkRef, compare dirty product or durable-truth paths with the prior owner's paths. Overlap never transfers ownership; continue, explicitly reopen, use an authorized integration owner, or stop for boundary resolution. Disjoint work may proceed without staging or forcing a commit.

Read the selected Change, Group, or sibling Group Brief when grouped, and only the relevant Specs and Decision Records. Use `rsp specs` for direct tree navigation or bounded literal discovery, then re-read the exact authoritative source before a material decision or mutation; generated index files are migration inputs, not navigation authority. Focus markers form the open-work candidate set, while an explicit WorkOwner reference or user intent may select the default action. When a Focus Capsule exists, is inspected or mutated, reports warnings, or a continuation resumes, read [focus and continuation recovery](references/focus-continuation.md). Run the selected check before treating the owner as ready. Preserve the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections.

Keep the Change a convergent snapshot of the current plan and final decisive evidence. Replace superseded content; keep routine attempts, temporary probes, and command transcripts in the response. Persist only `open` and `archived`; focus, readiness, routing, and capability availability grant no implementation, review, Git, publication, or approval authority.

RSP remains repository-native and derives workflow state from current project artifacts and checkout evidence; it requires no hidden runtime state.

When archived acceptance is incomplete, read [reopen recovery](references/reopen-recovery.md) before lifecycle mutation. Reopen requires explicit lifecycle authority and grants no Git or external authority.

Load detailed procedures only when active:

- [setup and repair](references/setup-repair.md) for initialization, audit, migration, or repair.
- [groups and dependencies](references/groups-dependencies.md) for grouped or dependent work.
- [conflict handling](references/conflict-handling.md) for an intersecting Git operation.
- [durable writeback decision](references/durable-review.md) after required Tasks and implementation verification pass, when writeback or archive readiness matters.

## Ownership and safety

Route planned design to the selected Change; implemented facts to the smallest fact owner; rationale to one Decision Record; stable navigation to project-owned `CONTEXT.md`; operating rules to project-owned `AGENTS.md`; temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for command-owned files. Preserve unrelated work. Ordinary Core never automatically archives or commits; a currently qualified coordination branch may execute lifecycle closeout only within its effective ceiling, fresh readiness and actual authority. Activation alone grants nothing; a qualified closeout setting is a limited ceiling, narrowed by nearer denial. Core never infers push, publication, deletion, deployment, approval, or human-acceptance authority. Exact local Commit and conditional conflict/recovery rules retain their owners. Execution location and cross-branch integration remain host, user, or Git concerns.

When accepted work remains or a continuation resumes, load [focus and continuation recovery](references/focus-continuation.md) for an actual capsule, recovery, or non-trivial handoff. Report owner, authority, changed artifacts, fresh evidence, blocker and next action to the extent needed; do not force a complete handoff template at each same-owner method change. Continuation is not a second state store. On cross-session resume refresh authority, owner, index/status, dirty paths and replay safety before mutation.

## Durable decision output

After loading [durable writeback decision](references/durable-review.md), use its canonical localized output and choose current facts and lasting rationale independently. A required unwritten update, incomplete Task, incomplete Required Verify item, or real blocker makes archive readiness `no`; Optional coverage warnings do not. Before lifecycle closeout, consume fresh `rsp ready <work-ref> --json` evidence with `completionGate: pass` and `archiveReady: yes`.
