---
name: rsp
description: Continue an authorized RSP request through implementation, checks and writeback; coordinate conditionally for real multi-owner, recovery or independent-acceptance obligations, and operate or repair RSP state.
license: MIT
metadata:
  author: oevery
  version: "2026.10.02.6"
---

# RSP Skill

Carry one authorized request through ownership, implementation and its checks, necessary writeback, and completion. Recheck on changed facts, recovery, independent acceptance, delivery or a real stop. Prefer this Skill; use the generated fallback only when it is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. User-visible prose follows explicit response language, then personal instructions, then conversation language; existing artifacts retain their language, and new artifacts follow explicit artifact language, effective configuration, project instructions, then conversation language. Preserve canonical headings, paths, commands, identifiers, and machine values. Load [language details](references/response-language.md) only for a contested or complex language choice. WorkRefs do not change with locale; Shape owns inferred names.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, coordination when genuinely needed, and the durable-update decision before archive. Do not create a Change for a simple session task unless tracking is authorized and needed.

## Select responsibility before loading

Read intent and authority, nearest context, focus candidates and relevant owner, tracked status/readiness, checkout state and decisive evidence. An explicit WorkRef wins; multiple focus markers alone are not a stop.

Use plain `rsp status` for ordinary state, JSON for exact dependencies, and verbose JSON for auxiliary details. When a decision needs effective RSP settings, use the same selected CLI's successful `rsp config --json` summary (`--compact` is optional). The CLI resolves validation, defaults and language inheritance; raw YAML and status are not substitutes. Reuse values until configuration drift, recovery or dependent closeout requires refresh, not every method transition. If projection fails or is unavailable, inspect raw configuration only to diagnose; do not invent effective values or automatically close out. Independently authorized work needing no unresolved setting may continue. Derive stages; do not persist them.

Check for a root legacy `CONTEXT-MAP.md` during entry. When it or a relevant local legacy map is found, or context migration is requested, load [context migration](references/context-migration.md). Until migration is resolved, retain relevant legacy context; discovery does not authorize edits or interrupt unrelated work.

Core owns the goal, selected owner, authority, cross-responsibility decisions, results and necessary writeback, not product edits. Choose the responsibility before loading its detail:

- `rsp-shape`: bounded design advice or authorized planning; advice alone grants no artifact mutation.
- `rsp-implement`: an unexplained symptom, authorized fix or fixed findings, using its matching mode. Only an accepted finding with correction authority permits mutation.
- `rsp-verify`: explicitly read-only or independently required verification of an existing WorkOwner's declared boundary. Implement performs its ordinary own checks without a forced Verify handoff.
- `rsp-review`: fixed-scope read-only review, including release communication.
- `rsp-commit`: exact separately authorized local delivery. This default core capability is required: if unavailable, stop without staging or manual Core/CLI substitution. Recovery or installation needs separate authority.
- `rsp-structural-audit`: optional open-ended read-only discovery.

For authorized repository-document, Skill or release writing, use `rsp-doc` and its matching artifact method. Tiny text edits remain direct; read-only review stays Review and product decisions stay Shape. If Doc is unavailable, check reader purpose, facts, concise expression, ownership and references within the same scope. Default distribution does not make Doc a mandatory phase.

For explicitly authorized release checks without a selected RSP WorkOwner, Core collects and interprets the project's declared checks at an exact candidate, with a range only when needed by those checks. Require the check contract, baseline and authority for actual effects; stop dependent checks when these are missing. Do not invent a Change or route an ownerless request to Verify. Preserve required independent acceptance; checks and Doc/Review results grant no Git delivery, publication or approval.

Continue the authorized objective through edits, fresh Required checks and necessary writeback. Diagnose and correct same-scope failures internally; a failed check alone needs no Core return. Stop for a material owner decision, changed scope or authority, unavailable required capability, unsafe replay, or failure without a new discriminating step. Self-checks are not independent review.

Return outcome, evidence, limits and next action naturally. Load [control outcome](references/control-outcome.md) only for a real consumer needing its technical rendering.

## Choose methods within the evidence boundary

The owning capability chooses permitted tools and interprets their observations. A method change inside one owner needs no new phase or continuation request when the goal, scope, authoritative baseline, permissions and required evidence stay fixed. Named mandatory checks, immutable provenance, independent acceptance and command-owned RSP mutations cannot be replaced by an easier result.

Diagnose a tool-only obstacle and inspect actual effects before recovery. Read-only or proven repeat-safe work may continue in scope; failed required evidence, unsafe facts, unknown mutation or a changed boundary need the missing condition or owner decision. Observe uncertain effects without replaying mutation. Commit retains its one-attempt delivery rule; do not apply a universal retry policy to every capability. Tool availability, recommendations and exit status grant neither authority nor completion.

## Conditional coordination

Load [coordination qualification](references/managed-routing.md) only for a genuine obligation: independent slices or acceptance, recovery, incompatible resources, real-host/provider/hardware verification, bounded review convergence, or managed lifecycle delivery. File count, effort, sequential edits and ordinary continuation alone do not qualify.

On the selected branch:

- Read effective `manage.activation` and `manage.closeout` through `rsp config --json`. Activation grants no authority; qualified closeout is a limited ceiling narrowed by nearer denial. Ordinary execution never activates it.
- Retain goal ownership, pass bounded work and current authority to its capability, validate the result and continue while the boundary holds.
- Selection is not delegation; workers and concurrency need host evidence. A missing optional sibling permits an equivalent bounded action under the same authority, never a simulated required independent worker or reviewer.

Load only the active procedure:

- [Worker and resource coordination](references/coordination.md): actual workers or resource conflicts.
- [Interruption recovery](references/coordination-recovery.md): pause/resume or an environment stop.
- [Review convergence](references/coordination-review.md): repeated accepted findings.
- [Closeout](references/closeout.md): qualified lifecycle/delivery or an authorized checkpoint; exact Git execution remains `rsp-commit`.

Report the selected route and decisive signal; keep dispatch, worker count, acceptance and closeout nested as technical evidence, never a persisted controller. Do not preload unrelated methods or reread the complete owner without invalidation.

## Operate the selected Change

Before focusing or mutating a different WorkOwner or child WorkRef, compare dirty product or durable-truth paths with the prior owner's paths. Overlap never transfers ownership; continue, explicitly reopen, use an authorized integration owner, or stop for boundary resolution. Disjoint work may proceed without staging or forcing a commit.

Read the selected Change or Group, its sibling Brief when grouped, and only relevant Specs and Decisions. For direct tree navigation or bounded literal discovery use `rsp specs`, then reread the authoritative source before material decisions or mutation. Generated indexes are migration inputs, not authority. User intent or an explicit WorkOwner selects from the open-work focus candidates.

Run the selected check before treating the owner as ready. Preserve Proposal, Spec, Design, Tasks, Verify and Blockers. For tracked work needing checkpoint or recovery notes, maintain its permitted Focus snapshot through [focus and continuation recovery](references/focus-continuation.md); also load it when a capsule is inspected or a continuation resumes.

Keep ongoing recovery notes in Focus, converged results in Change, and justified stable knowledge in its document owner. Focus is a replaceable snapshot, not a log or authority; detailed evidence stays with its report or host owner. Persist only `open` and `archived`; focus, readiness, routing, and capability availability grant no implementation, review, Git, publication, or approval authority.

When archived acceptance is incomplete, read [reopen recovery](references/reopen-recovery.md) before lifecycle mutation. Reopen requires explicit lifecycle authority and grants no Git or external authority.

Load detailed procedures only when active:

- [setup and repair](references/setup-repair.md) for initialization, audit, migration, or repair.
- [groups and dependencies](references/groups-dependencies.md) for grouped or dependent work.
- [conflict handling](references/conflict-handling.md) for an intersecting Git operation.
- [durable writeback decision](references/durable-review.md) after required Tasks and implementation verification pass, when writeback or archive readiness matters.

## Ownership and safety

Route each durable item by its responsibility, not its presentation:

- `README`: introduction, usage, and starting points, not a duplicate specification.
- `AGENTS.md`: scoped operating rules, authority, and checks, not product behavior definitions.
- `CONTEXT.md`: canonical vocabulary, domain relationships, and navigation, not implementation notes or session history. Root and local files share this model; define a term once in its domain and link it elsewhere.
- Specs: current capability and collaboration contracts, boundaries, and necessary constraints, not code inventories or future plans. Design references belong here when they define normative evidence.
- Change: this outcome's contract delta, design, work, and evidence, not a full baseline copy or execution log.
- Decision Record: significant choices, alternatives, and consequences, not another definition of current behavior. Archives retain historical evidence, not current authority.

Use short summaries and links instead of maintaining the same rule twice. Keep temporary continuation in the response. Never promote planned state to current truth. A Spec/code disagreement needs a decision about the discrepancy, not automatic documentation of whatever the code does.

Use RSP commands for command-owned files and preserve unrelated work. Ordinary Core never automatically archives or commits. Qualified coordination closeout still requires its effective ceiling, fresh readiness and actual authority. Core never infers push, publication, deletion, deployment, approval or human acceptance. Commit, conflict and recovery retain their owners; execution location and cross-branch integration remain host, user or Git concerns.

When accepted work remains or a continuation resumes, use the same recovery reference for an actual capsule, recovery or non-trivial handoff. Report owner, authority, changed artifacts, fresh evidence, blocker and next action as needed, not a complete template at each same-owner method change. On cross-session resume refresh authority, owner, index/status, dirty paths and replay safety before mutation. Derive state from repository artifacts and checkout evidence; continuation is no hidden runtime or second state store.

## Durable decision output

After loading [durable writeback decision](references/durable-review.md), verify outcome facts, distill Focus and update knowledge as needed, then converge the whole Change before final consistency checks and authorized archive. Its localized decision summary belongs in the response, not as an archive template. A required unwritten update, incomplete Task, incomplete Required Verify item, or real blocker makes archive readiness `no`; Optional coverage warnings do not. Before lifecycle closeout, consume fresh `rsp ready <work-ref> --json` evidence with `completionGate: pass` and `archiveReady: yes`.
