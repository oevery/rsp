---
name: rsp
description: Select and continue the appropriate responsibility for authorized RSP work, including task transitions, knowledge writeback and closeout; operate or repair RSP state and coordinate only for multi-owner, recovery or independent-acceptance obligations.
license: MIT
metadata:
  author: oevery
  version: "2026.10.05.1"
---

# RSP Skill

Carry one authorized request through responsibility selection, implementation/checks, necessary writeback and completion. Reassess evidence on changed facts, recovery, independent acceptance, delivery or a real stop, not a responsibility change alone. Use Core or, only when unavailable, the generated fallback; never load both as entry protocols.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. User-visible prose follows explicit response language, then personal instructions, then conversation language; existing artifacts retain their language, and new artifacts follow explicit artifact language, effective configuration, project instructions, then conversation language. Preserve canonical headings, paths, commands, identifiers, and machine values. Load [language details](references/response-language.md) only for a contested or complex language choice. WorkRefs do not change with locale; Shape owns inferred names.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, coordination when genuinely needed, and the durable-update decision before archive. Do not create a Change for a simple session task unless tracking is authorized and needed.

## Select responsibility before loading

Read intent and authority, nearest context, focus candidates and relevant owner, tracked status/readiness, checkout state and decisive evidence. An explicit WorkRef wins; multiple focus markers alone are not a stop.

Use plain `rsp status` for ordinary state, JSON for exact dependencies and verbose JSON for auxiliary details. Resolve needed effective settings through the same selected CLI's successful `rsp config --json` summary (optional `--compact`), including validation, defaults and language inheritance. Reuse it until configuration drift, recovery or dependent closeout. Raw YAML is diagnostic; neither it nor status replaces this summary. Failed projection leaves dependent choices and automatic closeout unresolved, while independently authorized work needing no unknown setting may continue. Derive stages; do not persist them.

Check for a root legacy `CONTEXT-MAP.md` during entry. When it or a relevant local legacy map is found, or context migration is requested, load [context migration](references/context-migration.md). Until migration is resolved, retain relevant legacy context; discovery does not authorize edits or interrupt unrelated work.

Core owns the goal, selected owner, authority, cross-responsibility decisions, results and necessary writeback, not product edits. Choose the responsibility before loading its detail:

- `rsp-shape`: bounded design advice or authorized planning; advice alone grants no artifact mutation.
- `rsp-implement`: an unexplained symptom, authorized fix or fixed findings, using its matching mode. Only an accepted finding with correction authority permits mutation.
- `rsp-doc`: authorized repository-document, Skill or release writing, including whole-Change convergence and justified knowledge writeback. Planning decisions stay Shape; fixed-scope read-only judgment stays Review.
- `rsp-verify`: explicitly read-only or independently required verification of an existing WorkOwner's declared boundary. Implement performs its ordinary own checks without a forced Verify handoff.
- `rsp-review`: fixed-scope read-only review, including release communication.
- `rsp-commit`: exact separately authorized local delivery. This default core capability is required: if unavailable, stop without staging or manual Core/CLI substitution. Recovery or installation needs separate authority.
- `rsp-structural-audit`: optional open-ended read-only discovery.

Use Doc's matching method for writing, including whole-Change convergence even when few lines change or no rewrite is needed. Local wording fixes and mechanical status/evidence updates needing no whole-record reconciliation remain direct. If Doc is unavailable, check reader purpose, facts, expression, ownership and references locally. Doc is not a mandatory phase.

Select each successor from the current requested result and authority, not the previous Skill or changed-line count. Load its entrypoint and active method only when not already applicable. A responsibility transition requires no new worker, repeated checks or user continuation and grants no new authority.

For authorized ownerless release checks, collect the project's declared evidence at an exact candidate, with a range only when needed. Require the check contract, baseline and effect authority; missing inputs stop dependent checks. Create no Change and do not route to Verify. Preserve required independence; check and Doc/Review results grant no Git delivery, publication or approval.

Continue the authorized objective through edits, applicable Required evidence and necessary writeback. Diagnose and correct same-scope failures internally; a failed check alone needs no Core return. Stop for a material owner decision, changed scope or authority, unavailable required capability, unsafe replay, or failure without a new discriminating step. Self-checks are not independent review.

## Choose methods within the evidence boundary

The owning capability selects permitted tools and interprets observations. A method change needs no new phase or continuation request while goal, scope, authoritative baseline, permissions and required evidence stay fixed. Named checks, immutable provenance, required independence and command-owned RSP mutations retain their obligations.

For a tool-only obstacle, inspect cause and actual effects before recovery. Continue read-only or proven repeat-safe work in scope; missing Required evidence, unsafe replay, unknown mutation or changed boundaries stop affected actions. Observe uncertain effects without replaying mutation. Commit keeps its one-attempt rule; other capabilities retain their own retry boundaries. Tools grant neither authority nor completion.

Reuse traceable passing evidence while tested scope and relevant code, dependencies, configuration, tools, inputs and environment apply. Read further for concrete decision gaps; summaries locate but do not replace decisive sources. Refresh required current observations and invalidated inputs; run missing, failed or invalidated checks needed by risk and acceptance. Retain command, result, boundary and source in existing reports or Verify, distinguishing reuse from new execution. Time or phase changes alone do not invalidate evidence; explicit reruns, independence and current lifecycle/Git observations still apply.

## Conditional coordination

Load [coordination qualification](references/managed-routing.md) only for a genuine obligation: independent slices or acceptance, recovery, incompatible resources, real-host/provider/hardware verification, bounded review convergence, or managed lifecycle delivery. File count, effort, sequential edits and ordinary continuation alone do not qualify.

Qualification selects the needed worker, recovery, review or closeout procedure. Effective activation and closeout apply only on the qualified selected branch, subject to nearer denial and fresh gates; ordinary execution gains no authority. Selection is not delegation: required workers and independence need host evidence, not a simulated capability. Report the selected route and decisive signal when relevant, not a routine phase receipt.

## Operate the selected Change

Before focusing or mutating a different WorkOwner or child WorkRef, compare dirty product or durable-truth paths with the prior owner's paths. Overlap never transfers ownership; continue, explicitly reopen, use an authorized integration owner, or stop for boundary resolution. Disjoint work may proceed without staging or forcing a commit.

Read the selected Change or Group, its sibling Brief when grouped, and only relevant Specs and Decisions. For direct tree navigation or bounded literal discovery use `rsp specs`, then reread the authoritative source before material decisions or mutation. Generated indexes are migration inputs, not authority. User intent or an explicit WorkOwner selects from the open-work focus candidates.

Planning readiness means settled scope, authority and acceptance with executable Tasks and declared checks. Dependency readiness selects unblocked work; neither proves completion. Require completed Tasks and applicable passing Required checks, then separate archive gates. Preserve Proposal, Spec, Design, Tasks, Verify and Blockers. Load [focus and continuation recovery](references/focus-continuation.md) for a needed snapshot, Capsule inspection or resumed continuation.

Keep routine execution narration in the conversation; create no process-record file for it. Write Change updates only for necessary plan/contract changes, task outcomes, blockers or scoped verification conclusions. Focus holds only state needed for safe continuation; justified stable knowledge belongs to its document owner. Follow existing retention contracts for tool-owned or explicitly required evidence and reference it without copying execution history. Focus is a replaceable snapshot, not authority. Persist only `open` and `archived`; focus, readiness, routing, and capability availability grant no implementation, review, Git, publication, or approval authority.

When archived acceptance is incomplete, read [reopen recovery](references/reopen-recovery.md) before lifecycle mutation. Reopen requires explicit lifecycle authority and grants no Git or external authority.

Load detailed procedures only when active:

- [setup and repair](references/setup-repair.md) for initialization, audit, migration, or repair.
- [groups and dependencies](references/groups-dependencies.md) for grouped or dependent work.
- [conflict handling](references/conflict-handling.md) for an intersecting Git operation.
- [durable writeback decision](references/durable-review.md) after required Tasks and implementation verification pass, when writeback or archive readiness matters.

## Completion and response

Use RSP commands for command-owned files and preserve unrelated work. Ordinary Core never automatically archives or commits. Qualified coordination closeout still requires its effective ceiling, fresh readiness and actual authority. Core never infers push, publication, deletion, deployment, approval or human acceptance. Commit, conflict and recovery retain their owners; execution location and cross-branch integration remain host, user or Git concerns.

For accepted remaining work or a non-trivial handoff, load [focus and continuation recovery](references/focus-continuation.md) and report only needed owner, authority, artifacts, evidence, blocker and next action. Cross-session resume refreshes authority, owner, index/status, dirty paths and replay safety before mutation. Derive state from artifacts and checkout evidence, never a second continuation store.

For durable writeback or archive readiness, use [durable writeback decision](references/durable-review.md) for knowledge placement, final whole-Change convergence and closeout checks. Planned state is not current truth; a Spec/code disagreement needs a decision, not automatic adoption of code behavior. A required unwritten update, incomplete Task, incomplete Required Verify item or real blocker makes archive readiness `no`; Optional coverage warnings do not. Before lifecycle closeout, consume fresh `rsp ready <work-ref> --json` evidence with `completionGate: pass` and `archiveReady: yes`.

Follow applicable response instructions and present the current request's outcome, necessary evidence and material limits without mandatory headings or repeated evidence. Include a next action only when work or a user decision remains. Distinguish observed actions and effects, checks, review and acceptance from inference or proposed work; brevity never hides failure, authority or unverified scope. A gap limits only affected claims; missing Required evidence still prevents completion. Describe read-only work by actual effects, including auxiliary writes, without inferring write authority from the label. Load [control outcome](references/control-outcome.md) only for a real consumer needing its technical rendering.
