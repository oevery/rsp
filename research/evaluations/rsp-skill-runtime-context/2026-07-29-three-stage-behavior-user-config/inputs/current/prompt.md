You are performing a read-only routing-contract evaluation. Use only the exact Skill sources embedded below. Do not use tools, external knowledge, global Skills, memory, or repository files. Do not propose edits. Evaluate each case independently from fresh state. The current variant may keep release and reopen procedures inline in Core; candidate variants may route into an embedded conditional reference. When Core selects rsp-manage, use the embedded rsp-manage Skill for selected execution behavior.

Return exactly one schema-valid row for every case. Preserve the supplied case ids. Choose only the narrow categorical values in the schema. A release fallback that must load but then stop for identity, owner, or candidate cleanliness is RELEASE_FALLBACK_STOP. A reopen path that must stop for exact archive selection or lifecycle authority is REOPEN_RECOVERY_STOP.

Variant: current

Cases:
[
  {
    "id": "normal-implement",
    "scenario": "A selected ready Change owns one local behavior. The behavior, cause, edit path, mutation authority, and decisive existing check are clear. Test-first is not required and no concrete changed risk needs pre-mutation RED. Implementation is incomplete."
  },
  {
    "id": "unexplained-diagnose",
    "scenario": "A selected Change has a reproducible multi-layer failure, but the cause and owning seam are not explained. The request permits investigation and later correction, but no production mutation should encode a guessed cause."
  },
  {
    "id": "risk-qualified-tdd",
    "scenario": "A selected ready Change modifies a persisted public state transition. Behavior, cause, owner, and mutation authority are clear. A pre-mutation RED materially reduces the concrete regression risk."
  },
  {
    "id": "missing-authority",
    "scenario": "A focused ready Change exists, but the request is only to explain current status. No product mutation, lifecycle, Git, release, or external authority was granted."
  },
  {
    "id": "release-fallback-unconfirmed-unclean",
    "scenario": "The user explicitly requests release finalization. rsp-release-docs is unavailable. No release identity or range is confirmed, the exact candidate is unclean, and no owner has resolved the ambiguity. Decide the next action before any versioned mutation."
  },
  {
    "id": "reopen-ambiguous-no-authority",
    "scenario": "Fresh evidence disproves acceptance of an archived Change. Multiple retained archives match, and no explicit lifecycle authority was granted. Decide the next action before any reopen command."
  },
  {
    "id": "managed-status",
    "scenario": "Core already selected and qualified rsp-manage for an authorized non-small Change. Workers are active and checks remain available. The user asks only for a progress update, without pausing or releasing the owner."
  },
  {
    "id": "managed-pause",
    "scenario": "Core already selected and qualified rsp-manage for an authorized non-small Change. Workers are active. The user explicitly says pause now."
  }
]

Exact Skill sources:
<skill-source path="skills/rsp/SKILL.md">
---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.07.29.1"
---

# RSP Skill

Use RSP to derive one current action from project authority and durable work artifacts. This Skill is the preferred operational guide; `.rsp/rsp-rules.md` is the runtime fallback when the Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. Keep response language user/session-owned and durable project language repository-owned. Response prose follows an explicit current response language, user/host personal instructions, then conversation language; project `.rsp/config.yaml` never selects it. A new authorized artifact follows an explicit artifact language, then the configured effective artifact language, artifact-scoped project instructions, and conversation language; an existing artifact keeps its established language unless translation is explicitly authorized. Configuration changes never rewrite existing artifacts. Commit-message prose follows an explicit current commit-language instruction, configured effective commit language, nearest repository commit authority, then clear recent non-merge history. Preserve canonical headings, paths, commands, identifiers, Conventional Commit types/scopes, trailers, and machine values; WorkRefs follow the Unicode identity contract rather than the natural-language fallback chain. Write persistent artifacts in domain, system, user, or operator language; mention AI or agents only when they are actual product actors or constraints.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, and the durable-update decision before archive. Do not use it for unrelated coding or create a Change for a simple session task unless the user explicitly requests tracking.

## Derive one next action

Read user intent, nearest authority, `rsp status --json`, the selected Change and its readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

Apply these routes in order:

Before later-turn mutation under a direct report, design, tiny, or small route, rederive routing from the now-authorized objective and prospective work. If it materially expands into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, bounded review convergence, lifecycle delivery, or a clear ready successor, establish or reuse the smallest sufficient WorkRef, then apply managed preflight and fresh qualification before mutation. Follow-ups that remain tiny/small stay direct. Elapsed time and message count are never escalation evidence.

1. Stop for ambiguous authority or selection and return the one required input and its owner. For a material owner decision inside an explicit managed request, continue to the Shape preflight in route 2 so repository inspection precedes the single owner question; otherwise stop here.
2. For a requested completion or continuation that is not a report-only review or release operation, read [managed routing](references/managed-routing.md) when the request is explicitly managed or the effective status policy has `manage.activation: auto`. It owns owner preflight, qualification, successor discovery, bounded review convergence, and lifecycle/Git separation. Select `rsp-manage` only after that preflight for an eligible selected ready Change or shallow Group; otherwise return the ordinary Core or Discipline action. Automatic activation grants controller selection only; planning, product mutation, lifecycle, Git, and external authority remain separately derived.
3. Route an explicit report-only review with fixed scope to `rsp-review` when available, otherwise perform the same read-only review manually.
4. Route an explicit release-documentation, finalization, publication, or reconciliation operation through [Release operations](#release-operations) before ordinary Change routing.
5. Route one explicit isolated material domain, module/seam, or evidence-seeking design question to installed `rsp-design`; never manually emulate it. Without a selected Change, use report-only Pre-Change Design only for an already bounded question; return its result without inventing a WorkRef or artifact. With a selected Change, return to that WorkRef. Only when unavailable, its manual fallback inspects authority and the live path, compares credible alternatives, and separates evidence from owner choice without implementation or durable-truth mutation.
6. With no selected Change, name one ready WorkRef and direct focus action. For tiny settled work, return the direct engineering action. When outcome, scope, non-goals, acceptance, or decomposition is materially unclear, use `rsp-shape` when available and Change mutation is authorized; otherwise manually create or refine one Change to the same ready boundary.
7. If the Change is not shape-ready, route to Shape under the same authority rule.
8. For incomplete implementation or stale, missing, or failed verification, use [Implementation evidence](#implementation-evidence).
9. When Tasks and required verification pass without blockers, perform the durable decision. Do not infer a release operation from Change completion.

State the derived stage, one next action, required input, returned owner, and decisive evidence. When managed routing is evaluated, state `selected` or `declined` with the decisive qualification signal or complete direct-work exclusion; when dispatch applies, also state why it is parallel or sequential. Name at most one optional capability, only when it is the next action and appears in the host's loaded Skill inventory. Missing capabilities never invalidate RSP: give the manual fallback against the same owner. When Core or qualified Manage has derived one authorized RSP-owned local commit boundary, route exact staging, structured message construction, local commit execution, and post-commit observation to `rsp-commit`; if unavailable, use the bounded manual action in durable review against the same owner. Do not preload, enumerate, or recursively invoke optional capabilities.

### Implementation evidence

- **Diagnosis first:** diagnosis takes precedence over TDD for an evidenced but unexplained, conflicting, intermittent, or multi-layer failure. Use `rsp-diagnose` when available; its manual fallback reproduces, locates, and tests the smallest discriminating hypothesis. Do not encode an unexplained symptom as a guessed regression test.
- **TDD when justified:** use `rsp-tdd` only when test-first is explicitly required by the user, Change, or project instructions, or when a concrete changed risk makes a pre-mutation RED materially safer. Public contracts, persisted data, security or money, concurrency, complex transitions, and escaped defects qualify; mere testability or being a fix does not. Its manual fallback observes the focused RED, makes the minimum GREEN change, and refactors only while green.
- **Ordinary implementation by default:** use `rsp-implement`, or the equivalent bounded edit and verification, once the behavior, cause, and owner are sufficiently evidenced.

All branches return evidence, Tasks, Verify updates, and blockers to the same Change. Fresh verification is required, but a new test is only one option; use the cheapest decisive check that covers the changed risk.

### Release operations

Route here only when the user explicitly requests release documentation, finalization, publication, or reconciliation and the operation has a confirmed identity or range with unfinished release-surface work. A selected Change is not required, and lifecycle stage or archive readiness alone is insufficient.

Release identity is an owner decision confirmed only by explicit user instruction or authoritative repository release configuration. Never infer it from version order, a previous prerelease, commits, or planned prose. Until confirmation, keep ledgers version-neutral and leave manifests, target changelog headings, exact-version commands, versioned notes, and tag comparisons unchanged.

Select `rsp-release-docs` when available or use its manual evidence-led fallback. An explicit tag, hosted release, registry publication, or equivalent public action must pass its **Finalize for publication** branch against a clean exact candidate after implementation Change closeout. Finalize versioned shipped surfaces in a separate release commit when Git delivery is authorized. The credential-free `ready` or `not ready` handoff never executes or grants commit, tag, push, release creation, publication, deployment, or approval authority.

Use an optional Release Change only for material decisions, cross-stage coordination, recovery, blockers, or acceptance needing a persistent owner—never for a mechanical checklist. After observed publication, use **Reconcile published release** for unfinished verification or authorized mutable-surface corrections; preserve immutable history and assign drift to a corrective version or owner.

## Operate the selected Change

Before focusing or mutating a different WorkRef, compare dirty product or durable-truth paths with the prior owner's declared or observed paths. Overlap never transfers ownership: continue the same open WorkRef, explicitly reopen archived acceptance when authorized and applicable, use an explicitly authorized integration owner, or stop for boundary resolution. Disjoint authorized work may proceed without staging or forcing a commit; insufficient evidence stops the transition.

Read the focused Change, its sibling Group Brief when grouped, and only the relevant Specs and Decision Records before implementation. Use generated local `.rsp/specs/**/00-index.md` files only as direct-child navigation; never treat them as durable owners. Run `npx -y @oevery/rsp check --focused` before treating it as ready. Only `focus.d/` markers select current work; open filenames do not. Preserve one explicit `kind` and the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections.

Keep the Change a convergent snapshot of the current plan and final decisive evidence. Replace superseded content; keep routine attempts, RED/GREEN chronology, temporary probes, and command transcripts in the response. Update Tasks, Verify, and any invalidated Proposal, Spec, or Design in the same session.

Persist only `open` and `archived`; derive readiness, blockers, stage, and next actions. Do not infer implementation, review, Git, publication, or approval authority from focus, readiness, routing, or capability availability.

When fresh evidence shows that archived acceptance was incomplete, keep the correction under the same owner through explicit lifecycle commands. `rsp reopen <work-ref> --reason <text>` retains the selected archive, restores and focuses executable work, and adds unfinished Task and Verify evidence. If its Group is closed, first run `rsp group reopen <group> --reason <text>` to restore only one exact retained Brief as unfocused work with unfinished completion evidence, then separately reopen only the incomplete child. Multiple matching Change or Group archives require exact `--from .rsp/archives/...` selection rather than choosing the newest. Treat open work as current dependency state; never cascade into children or archived dependents, and never use `rsp group create` to reuse archived identity. Use a new corrective Change for genuinely new or independently delivered scope. Reopen is lifecycle mutation only and grants no Git, release, publication, deployment, or approval authority.

Load detailed procedures only when their path is active:

- Read [setup and repair](references/setup-repair.md) before initializing, auditing, migrating, or repairing RSP state.
- Read [groups and dependencies](references/groups-dependencies.md) before creating, focusing, planning, or closing grouped/dependent work.
- Read [conflict handling](references/conflict-handling.md) only when an active merge, rebase, or cherry-pick conflict intersects authorized work.
- Read [durable review](references/durable-review.md) only after required Tasks and verification pass, or when auditing archive readiness.

## Ownership and safety

Route planned design to the selected Change; stable implemented facts to the smallest relevant Spec or authorized scoped instruction; lasting rationale to one exact Decision Record; stable navigation to project-owned `CONTEXT.md`; stable operating rules to project-owned `AGENTS.md`; and temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for managed setup, focus, repair, indexes, archive, and reopen. Do not directly create command-owned files, edit generated indexes or `.rsp/rsp-rules.md` as durable truth, or modify the managed RSP block. Preserve unrelated work. Core recommends explicit archive only after the durable decision; it does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority. A configured `manage.closeout` preset remains dormant unless Core selected and qualified Manage for the current continuation; declined, unavailable, or unselected Manage leaves Core advisory even under `lifecycle` or `local`. Core also does not execute reopen without explicit lifecycle authority. The qualified Manage rules in [managed routing](references/managed-routing.md) are the sole scoped exceptions.

During a qualified managed run, a progress or status inquiry reports evidence and continuing intent without ending authorized work. An explicit pause must stop and confirm active workers before acknowledgement, preserve the focused owner, and prevent further mutation until resume. Only an explicit release or unfocus request clears selection; blockers preserve the focused owner. Resume treats response prose as pointers, reopens authority and artifacts, inspects drift and stale evidence, and must requalify Manage before mutation or dispatch. These behaviors never create a persisted paused or controller state.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. Preserve technical values. The continuation points to existing owners, is not a second state store, and must not be persisted without explicit path authority. On resume, reopen its pointers, inspect drift, and refresh decisive evidence.

## Durable decision output

After loading [durable review](references/durable-review.md), choose current facts and rationale independently. Localize headings and labels, but preserve the canonical values below:

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

Response-only Continuation and Durable Decision labels are not canonical artifact headings. In Chinese, for example, use `## 持久化决策`, `决策记录（Decision Record）`, and `可归档（Archive ready）`, not English labels alone. A required unwritten update or real blocker makes archive readiness `no`; CLI `archiveReady: judgment` is advisory, not approval.

</skill-source>

<skill-source path="skills/rsp-implement/SKILL.md">
---
name: rsp-implement
description: Implement exactly one selected, ready RSP Change within explicit mutation authority. Use when the user asks to implement or fix tracked work and requires code/tests plus truthful Tasks, Blockers, and fresh verification evidence; never infer Git, publication, review, TDD, or diagnosis authority.
license: MIT
metadata:
  author: oevery
  version: "2026.07.24.1"
---

# RSP Implement

Implement one selected Change and return facts.

## Select and inspect

Require an explicit WorkRef or one unambiguous focus marker. A Group Brief is context, not executable work. Stop when selection, readiness, product authority, acceptance, or required decisions are unresolved.

Read nearest instructions, Core or fallback, Change and Brief, relevant Specs and decisions, worktree, then the smallest owning code/test chain. Use normal repository discovery; do not guess owners.

## Preserve authority

Identify outcome, owners, verification, and pre-existing work. Modify only Change requirements, Tasks, Verify, and Blockers. Preserve unrelated modified, staged, and untracked work. Stop when overlap would discard, guess, or rewrite pre-existing intent.

Git delivery, publication, deployment, approval, and out-of-scope deletion require separate explicit authority. For conflicts, inspect base/ours/theirs, preserve unrelated work, resolve only evidenced scope, rerun checks, and stop before staging, continuing, aborting, or committing. Verify named findings first.

## Classify implementation evidence

Classify evidence before mutation and after failure:

- An unexplained failure returns `rsp-diagnose` when available; otherwise return Core's manual diagnosis fallback.
- Return `rsp-tdd` only when test-first work is explicitly required by the user, selected Change, or project instructions, or a concrete changed risk makes pre-mutation RED materially safer; use Core's manual TDD fallback when unavailable. Behavior being testable, a test being possible, or the work being a fix is not sufficient by itself.
- Continue ordinary implementation by default when diagnosis does not apply, the required behavior, cause, or edit is sufficiently evidenced, and no explicit or concrete-risk TDD gate is met.

Diagnosis precedes TDD. Do not invoke another Skill from inside this Skill. If evidence changes the route, stop mutation and return the next action, evidence, and same selected Change. Do not reproduce either discipline inside Implement or invoke review or delivery.

## Implement and verify

Implement the smallest complete slice. Update Tasks after outcomes exist; keep unresolved issues in Blockers.

After final mutation, run required Change checks and narrower risk checks. Fresh verification is required, but a new test is only one evidence option; prefer the cheapest decisive existing test, static check, build, or acceptance evidence. Record command, scope, result, and omissions. Prior runs are stale; failed or unavailable verification cannot support completion. Rerun after relevant edits.

Keep a new test only when it protects observable behavior or a real boundary, adds distinct future confidence, avoids duplicate or implementation-detail coverage, and has proportionate maintenance cost. Otherwise remove the disposable test, fixture, and helper before completion, then use smallest sufficient final evidence. User, Change, and project retention requirements remain authoritative.

Record concise fresh evidence when Change Verify owns it. Do not create a receipt store or mandate one shell wrapper.

## Return ownership

Report whether the Change is completed, partial, blocked before implementation, verification-failed, verification-unavailable, or verification-blocked. Use failed for an exercised defect; use unavailable when a missing tool, dependency, service, credential, or environment prevents execution. Use blocked only when scoped checks pass but a required gate fails solely from a confirmed pre-existing or out-of-scope baseline defect; never waive affected gates.

When work remains, follow Core's response-versus-artifact language boundary and return `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. They are not durable truth; persistence requires explicit path authority.

Claim completion only when required Tasks and checks pass and no blocker remains. Do not claim review, archive, Git delivery, or release unless separately performed with explicit authority.

</skill-source>

<skill-source path="skills/rsp-manage/SKILL.md">
---
name: rsp-manage
description: Coordinate one eligible long-running, recovery, or multi-slice RSP goal across ready Changes or a shallow Group without expanding its authority.
license: MIT
metadata:
  author: oevery
  version: "2026.07.29.2"
---

# RSP Manage

Manage one ready Change or shallow Group selected by Core from an explicit request or effective `manage.activation: auto`. Keep artifacts durable and process data transient. The goal defines authority; automatic activation grants selection, not mutation.

## Qualify before mutation

Before dispatch, read all of the following:

- every qualified WorkRef, including clear in-scope successors;
- the complete owning Change, or the Group Brief and its children;
- relevant Specs and Decisions;
- the authority envelope, `rsp status --json`, and the current worktree.

Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual`.

A Change is eligible when at least one of these independent conditions holds:

- its work contains genuinely independent slices;
- prospective execution signals show more than one bounded phase or authority surface; or
- the continuation is interruption recovery.

Prospective signals are implementation followed by integration verification, managed review, or lifecycle work; cross-module or cross-process mutation; real-host, provider, or hardware verification; bounded finding convergence; or a clear ready successor. Lack of parallel work does not disqualify prospective or recovery work. Derive the signals before dispatch from the authorized objective and expected phases, never from elapsed time. A Group is eligible when it has at least two ready children, or when the continuation qualifies through prospective signals or recovery.

Under automatic activation, decline as direct one-step work only when all of these are true: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor. A selected ready completion or continuation that fails any one condition qualifies as non-small through automatic activation even when no separate prospective signal is obvious; do not leave the middle case unclassified. Worker-only work remains ineligible. Decline Manage without any mutation and without creating a controller artifact, then return the exact Core or Discipline action. Report `selected` or `declined` and its decisive qualification or exclusion; when dispatch applies, also report the concrete reason for sequential or parallel execution. Keep this reasoning transient.

Preserve unrelated work and require an explicit release identity. Allow four worker dispatches and one worker corrective retry across the whole managed run. Owner transitions do not reset either limit.

## Dispatch owned work

Send a compact envelope that identifies the WorkRef, objective, authority, decisive evidence, and stop boundary. When the host supports workers and authorized implementation remains, dispatch at least one implementation worker; sequential execution does not permit the controller to absorb the whole implementation. The controller retains owner resolution, worker-result acceptance, integration verification, review convergence, lifecycle, and Git decisions.

For a Group, dispatch child WorkRefs only in the current derived `plan.waves` wave. Assume shared paths, lockfiles, generated artifacts, integration state, real hosts, provider sessions, and hardware resources overlap unless an authorized isolated workspace and verification boundary exist. Keep blockers, later waves, overlaps, and dependent verification sequential. Dispatch in parallel only for isolated mutation paths and verification resources; delegation never implies concurrency. Workers receive no implied focus, lifecycle, Git, publication, deployment, or approval authority. Choose the cheapest decisive check and at most one integration gate.

## Continue from evidence

Inspect diff and verification before accepting results; rerun `rsp status --json`. For a Group restrict it to declared children.

At owner boundaries, Core re-derives from goal. Continue a clear in-scope ready successor. Stop only when neither a ready successor nor clearly missing ownership remains. Otherwise suspend dispatch and return evidence to Core; Core routes Shape and requalifies without another authorization round. Manage neither classifies discovery nor changes topology.

Stop when discovery changes behavior, acceptance, interfaces, scope, mutation, or external authority. Retry only evidenced corrections. During recovery, reread authority and evidence. If incomplete archived child acceptance belongs to a closed Group, require separate explicit lifecycle authority for `rsp group reopen <group> --reason <text>` before `rsp reopen <group>/<child>`; restore neither children nor dependents implicitly. Never create controller status or parallel lifecycle state.

## Handle interruption

Treat a progress or status inquiry as an update, not a stop signal: report current evidence and continuing intent, then continue authorized work after the update while authority, verification, and blockers still permit it. For an explicit pause, interrupt active workers and confirm they have stopped before acknowledging the pause, keep the focused WorkRef selected, and do not mutate again until resume. Only an explicit release or unfocus request clears owner selection; ordinary pause and blockers preserve focus.

When an environment or verification boundary stops dispatch, preserve the focused owner. Update the Change only with durable blocker and verification facts, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Treat continuation prose only as pointers. On resume, reread the current authority, status, focused owner, worktree diff, blockers, and decisive evidence; mark stale or unverifiable claims pending and requalify Manage before mutation or worker dispatch. Never persist a paused state, worker registry, controller ledger, or execution chronology.

## Converge managed review

After fixed-scope re-review, Core correlates the report with the selected Change, original authority, fresh verification, and transient pass count. An `accepted` Finding starts another Resolve Findings pass without asking the user to continue only when it remains inside the original behavior, acceptance, paths, mutation authority, and verification budget. Resolve Findings never self-loops.

Allow at most three Resolve Findings passes per Change, separate from the worker retry limit. Stop when the same Finding remains after two completed corrections. Also stop for `needs-clarification`; a material product, interface, or scope change; new mutation or external authority; an additional real-host, provider, or network run outside existing verification authority; or failed or unavailable decisive verification. Return one owner input. Treat an eligible in-scope Finding as `correction-needed`, not an external blocker. Keep counts and correction chronology transient.

## Preserve boundaries

Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records. Changes retain converged requirements, outcomes, evidence, omissions, and blockers; Briefs retain shared completion without copied child state. Never persist the goal envelope, WorkSet, waves, or discovery classification.

Closeout requires Core-selected, currently-qualified Manage. For declined, unavailable, or unselected Manage, every `manage.closeout` preset is dormant; Core may report readiness/next action, but configuration executes neither archive nor commit. Earlier qualification does not carry forward.

Qualified only: effective `manage.closeout` is an automatic grant ceiling narrowed by nearer restrictions and host enforcement. `manual` grants neither automatic archive nor commit. `lifecycle` grants lifecycle closeout after Core durable review but no Git action. `local` grants lifecycle closeout, separately justified recovery checkpoints, and the deterministic terminal route below. Explicit current-turn authority may allow a local action not automated by the preset; denial wins.

When granted, close lifecycle before any commit. Change: after Core durable review run `rsp archive <change-work-ref>` and inspect the complete lifecycle diff. For shallow Group: durable-review/archive each child independently, rederive completion, then when all children plus Group gate pass run `rsp group close <group>`; inspect the complete lifecycle diff after each mutation. This includes terminal owners. Require proven review/clean-boundaries.

Decide commit separately. Under `local` or explicit commit authority, downstream work may justify one recovery checkpoint: give `rsp-commit` owner, paths, evidence, lifecycle, and authority, then derive status. Terminal small owners default to no commit. After lifecycle closeout, a qualified `local` terminal non-small Change or Group with known owner and paths, fresh decisive verification, clean exact boundary, and no nearer denial routes exactly once to `rsp-commit`; do not require the user to repeat `commit`. An ambiguous, mixed, stale, or denied boundary stops without staging. Apply the same owner envelope to explicitly authorized Group/release commits; use Core fallback if Commit is unavailable. Archive grants no Git or publication authority.

Push is opt-in only when user explicitly mentions push and remote, branch, and Group or goal milestone are unambiguous or accepted. Push there, or earlier only for required remote CI, recovery, or collaboration. Never force-push, infer push from commit authority, or push a protected or ambiguous branch. Failure preserves local commits and stops at remote boundary. Return to Core before a separate release operation and dedicated release commit.

Stop on unavailable dependencies, missing authority, failed verification, drift, or limits. When accepted work remains, preserve the focused owner unless explicit release or owner-conflict resolution requires otherwise, then return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`. Do not expose retry chronology or claim unobserved completion.

</skill-source>

<skill-source path="skills/rsp/references/managed-routing.md">
# Managed routing

Load this reference only for a requested completion or continuation that is not a report-only review or release operation and is either explicitly managed or has effective `manage.activation: auto` in status. Missing configuration preserves `explicit` activation with `local` closeout compatibility. Invalid configuration fails closed as `explicit` plus `manual` and must remain visible.

## PREFLIGHT — resolve the owner

Treat the requested goal and independently allowed planning and product mutations as a transient authority envelope. Automatic activation grants controller selection only and never adds planning or product-mutation authority. Resolve the smallest sufficient owner before testing Manage eligibility.

Before focusing, dispatching, or mutating a different WorkRef, inspect dirty paths and the diff against the prior owner's declared and observed product or durable-truth paths. Overlap never changes owner implicitly: continue the same open WorkRef, explicitly reopen its archived acceptance when authorized and applicable, use an explicitly authorized integration owner, or stop for boundary resolution. Disjoint authorized work may proceed without staging or a forced commit; insufficient ownership evidence stops the transition.

- Reuse one unambiguous selected ready owner.
- Return tiny settled work to direct engineering without a synthetic Change or controller artifact.
- For clear non-trivial work with no sufficient ready owner, an explicit managed request authorizes only in-scope RSP planning artifacts unless the user requests no edits. Under automatic activation, route to Shape only when the current request or nearer authority independently permits those artifacts; configuration alone never does. Then re-read status/readiness and re-evaluate without another authorization round.
- If repository evidence leaves a material product, acceptance, public-interface, scope, mutation-authority, external-action, or human choice, Shape returns the single highest-impact owner decision and creates no implementation or controller artifact.

A prior direct report, design, tiny, or small route is not sticky. Before later-turn mutation, rederive from the now-authorized objective and prospective work. Material expansion into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, bounded review convergence, lifecycle delivery, or a clear ready successor requires Core to establish or reuse the smallest sufficient WorkRef and rerun this preflight plus fresh Manage qualification before mutation. Unchanged tiny/small follow-ups remain direct; elapsed time and message count alone never trigger escalation.

PREFLIGHT is complete only when one selected ready Change or shallow Group owns the requested outcome and no material decision remains.

## QUALIFY — select or decline Manage

Select `rsp-manage` only for one selected ready Change or shallow Group that qualifies through at least one independent path: genuinely independent slices, interruption recovery, or prospective execution signals showing more than one bounded phase or authority surface. Prospective signals are implementation followed by integration verification, managed review, or lifecycle work; cross-module or cross-process mutation; real-host, provider, or hardware verification; bounded finding convergence; or a clear ready successor. A Change with prospective or recovery work does not also need independent or parallelizable slices. Derive these signals before dispatch from the authorized objective and expected phases; elapsed wall-clock minutes are never qualification evidence.

Under automatic activation, bias non-small continuation toward Manage. Decline as direct one-step work only when all of these are true: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor. A selected ready completion or continuation that fails any one of these conditions qualifies as non-small through this automatic path even when no separate prospective signal is obvious; do not leave the middle case unclassified. Worker-only work remains ineligible. Readiness alone does not qualify work without a requested completion or continuation, and automatic routing remains bounded by the requested goal.

Make the route observable: report `selected` with the decisive qualification signal, or `declined` with the complete direct-work exclusion and exact Core or Discipline action. If dispatch applies, report the concrete overlap/isolation evidence that makes it sequential or parallel. Selection, decline, and dispatch reasoning remain transient and create no controller state.

## CONTINUE — rederive from evidence

After accepted managed progress, re-read `rsp status --json` and apply PREFLIGHT again.

- Continue a clear in-scope ready successor.
- When ownership is clearly missing, Manage suspends dispatch and returns discovery evidence to Core. Shape keeps a cohesive correction in its Change, gives one independently verifiable and archivable result one Change, or gives at least two such results sharing one goal one shallow Group. Core then requalifies without another authorization round.
- Stop naturally only when neither a ready successor nor clearly missing ownership remains.
- Stop earlier for a material behavior, acceptance, public-interface, scope, mutation-authority, external-action, or human decision.

Never persist the goal envelope, WorkSet, waves, discovery classification, or transition chronology.

### Interrupt and resume

Treat a progress or status inquiry as an evidence update, not a stop signal, and continue authorized work when the preflight remains valid. An explicit pause interrupts active workers and confirms their stop before acknowledgement, preserves the focused owner, and permits no later mutation until resume. Only an explicit release or unfocus request clears owner selection; an environment or verification blocker must preserve the focused owner and return the complete seven-field continuation.

On resume, treat the continuation only as pointers: reread current authority, status, focus, owned diff, blockers, and decisive evidence; invalidate stale claims; rerun PREFLIGHT; and requalify Manage before mutation or dispatch. Never persist pause, worker, controller, or execution-chronology state.

## CONVERGE — bound review correction

After a managed fixed-scope re-review, correlate the report, selected Change, original authority, fresh verification, and transient convergence count. Return an in-scope `accepted` remaining or new Finding as `correction-needed` to another bounded Resolve Findings pass without asking the user to continue. Resolve Findings never self-loops.

Allow at most three Resolve Findings passes per Change and stop earlier when the same Finding remains after two completed corrections. Stop for `needs-clarification`, material behavior/interface/scope or authority change, verification-budget expansion, an additional real-host/provider/network run outside existing authority, failed or unavailable decisive verification, or repeated non-convergence. Never persist the convergence count or correction chronology.

## CLOSE — apply the bounded preset

Enter CLOSE only when Core selected and QUALIFY accepted Manage for the current continuation. If Manage was declined, unavailable, or unselected, every `manage.closeout` preset is dormant: ordinary Core may report readiness and the explicit next lifecycle or Git action, but configuration executes neither archive nor commit. Do not infer the current-continuation gate from readiness, an earlier managed run, or project policy alone; keep the selection and qualification result transient.

After that gate passes, use effective `manage.closeout` as an automatic grant ceiling, narrowed by nearer restrictions and host enforcement. `manual` grants neither automatic archive nor commit. `lifecycle` grants lifecycle closeout after Core durable review but no Git action. `local` adds separately justified recovery checkpoints and the deterministic terminal route below. Explicit current-turn authority may allow a named local action that the preset does not automate; denial still wins.

When lifecycle closeout is granted, archive a Change after Core durable review. A shallow Group independently reviews and archives each child, re-derives completion, then runs `rsp group close <group>` only after every child and the Group gate pass. Inspect the complete lifecycle diff after each mutation, including terminal owners.

During authorized recovery, a closed Group and its incomplete archived child remain two explicit lifecycle operations: first `rsp group reopen <group> --reason <text>`, then `rsp reopen <group>/<child> --reason <text>`. Neither operation cascades into other children or dependents, creates controller state, or grants Git or external authority.

Decide Git delivery separately. Under `local` or explicit commit authority, accepted downstream work may justify an exact-path recovery checkpoint unless commits are reserved or denied. Terminal small work defaults to no commit. After lifecycle closeout, a qualified `local` terminal non-small Change or Group with a derived owner, allowed paths, fresh decisive verification, one clean exact boundary, and no nearer denial must be handed exactly once to `rsp-commit`; do not require the user to repeat `commit`. An ambiguous, mixed, stale, or denied boundary stops without staging. Commit owns structured message construction, one local commit, and post-commit observation; when unavailable, return the equivalent bounded Core manual action against the same owner.

Push requires an explicit user mention plus an unambiguous remote, branch, and milestone. Never force-push; preserve local commits on failure. Managed authority never includes publication, deployment, approval, or human acceptance.

</skill-source>