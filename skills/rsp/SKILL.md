---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.08.06.1"
---

# RSP Skill

Use RSP to derive one current action from project authority and durable work artifacts. This Skill is the preferred operational guide; `.rsp/rsp-rules.md` is the runtime fallback when the Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. Keep response language user/session-owned and durable project language repository-owned. Response prose follows an explicit current response language, user/host personal instructions, then conversation language; project `.rsp/config.yaml` never selects it. Every user-visible RSP progress update, phase or stage description, control result, worker receipt, stop reason, and handoff uses natural-language narration selected by that precedence. When exact identity matters, retain a canonical technical value unchanged in parentheses or code formatting; when its language differs from the response language, it must not stand alone as the human-facing label. This response-only rule does not change persisted artifact language or host-owned hidden reasoning summaries. A new authorized artifact follows an explicit artifact language, then the configured effective artifact language, artifact-scoped project instructions, and conversation language; an existing artifact keeps its established language unless translation is explicitly authorized. Configuration changes never rewrite existing artifacts. Commit-message prose follows an explicit current commit-language instruction, configured effective commit language, nearest repository commit authority, then clear recent non-merge history. Preserve canonical headings, paths, commands, identifiers, Conventional Commit types/scopes, trailers, and machine values. WorkRefs are stable identities independent from artifact, commit, response, host locale, and TUI language settings. Existing identities are never renamed by later language or naming guidance; when a new WorkRef must be inferred, Shape owns its naming policy. Write persistent artifacts in domain, system, user, or operator language; mention AI or agents only when they are actual product actors or constraints.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, and the durable-update decision before archive. Do not use it for unrelated coding or create a Change for a simple session task unless the user explicitly requests tracking.

## Derive one next action

Read user intent, nearest authority, `rsp status --json`, the selected Change and its readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

Represent each current decision as one response-only transient `ControlOutcome`: phase, phase-specific disposition, decisive evidence, next owner, required input when any, and the rule for resuming or rederiving. Never persist it in a Change, Group Brief, Spec, Decision Record, archive, registry, or generated projection.

Core's `RouteDisposition` is exactly `specialist`, `direct`, `managed`, `shape`, or `stop`:

- `specialist`: one bounded Discipline result; the Discipline does not become a completion controller.
- `direct`: one non-managed completion or continuation, one decisive verification, no WorkerEnvelope, and at most one Discipline executor.
- `managed`: one selected shape-ready owner and bounded goal handed to Manage; only this route composes worker lanes and review convergence.
- `shape`: unclear owned work returned to Shape.
- `stop`: no further action until one `StopDisposition` resume contract succeeds.

Core may directly mutate only RSP control-plane state; product mutation belongs to Implement or the same bounded manual Discipline action. `StopDisposition` is exactly `ask-owner`, `return-to-shape`, `reroute`, `retry-with-evidence`, `environment-blocked`, `verification-blocked`, or `capability-unavailable`. No stop disposition permits worker dispatch, product mutation, lifecycle closeout, or Git action before its resume contract succeeds.

Apply these routes in order:

Before later-turn mutation under a direct report, design, tiny, or small route, rederive from the newly authorized objective and prospective work. Cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, bounded review convergence, lifecycle delivery, or a clear ready successor requires the smallest sufficient WorkRef plus fresh owner preflight and Manage qualification before mutation. Unchanged tiny/small follow-ups remain direct. Elapsed time and message count alone never escalate work.

1. Route an explicit report-only review with fixed scope to `rsp-review` when available, otherwise perform the same read-only review manually.
2. Route an explicit release-documentation, finalization, publication, or reconciliation operation to `rsp-release-docs` when available; otherwise read [release operations](references/release-operations.md) for the manual fallback. Do this before ordinary Change routing.
3. Route one explicit isolated material domain, module/seam, or evidence-seeking design question to installed `rsp-design`; never manually emulate it. Without a selected Change, use report-only Pre-Change Design for an already bounded question without inventing a WorkRef or artifact. Tracked Design returns to its selected WorkRef. Only when unavailable, its manual fallback stays with the same question and performs no implementation or durable-truth mutation.
4. Before applying the small-work exclusion to an executable ready WorkRef, Core alone selects whether workspace isolation is materially useful from exactly four signals: parallel Changes, unrelated dirty work, an independent runtime boundary, or an explicit user request. Evaluating those signals does not load `rsp-workspace`; load it only after Core selects isolation. An explicit direct request still enters Core for this selection and does not bypass ownership or readiness. Ordinary temporary work remains in the current worktree. An isolated RSP branch is `rsp/<workref>` and resumes by WorkRef; never invent a host-branded or random-session fallback branch. Workspace selection grants no implementation, verification, Commit, Land, cleanup, or external authority.
   Return tiny settled work directly only when it satisfies the complete small-work exclusion: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor. Report `RouteDisposition: direct`. Perform no Manage handoff or WorkerEnvelope. A selected workspace remains execution infrastructure for that direct route and does not make it managed. Rederive before further mutation if prospective work expands beyond any condition.
5. For every other requested completion or continuation, Core resolves whether one unambiguous shape-ready Change or shallow Group is the `WorkOwner`. Missing or non-ready ownership reports `RouteDisposition: shape`; Core invokes Shape only with independently granted planning-artifact authority, then re-reads status and freshly derives ownership and routing from the returned ready WorkOwner. Material product or authority questions stop for their `DecisionOwner`; invalid WorkOwner, topology, dirty-path, route, scope, or authority stops with `StopDisposition: reroute`.
6. With one ready owner, read [managed routing](references/managed-routing.md). It solely owns initial qualification and the `selected | declined` result: under `auto`, consider non-small completion or continuation; under `explicit`, qualify only an explicitly managed request. On selection, hand `rsp-manage` the goal, WorkRef, authority envelope, decisive qualification evidence, closeout ceiling, return boundaries, and Core's selected workspace-isolation boundary when any. Manage validates current handoff evidence without repeating eligibility or workspace selection. Once selected, Manage solely owns same-goal revalidation, interruption and resume, review convergence, acceptance, lifecycle closeout, and commit eligibility and orchestration; `rsp-commit` retains exact Git execution. Return to Core only for changed owner identity, topology, requested route, behavior, acceptance, public interface, scope, mutation authority, external-action authority, or evidence that invalidates the selected workspace-isolation boundary. Automatic activation selects a controller but grants no planning, product mutation, lifecycle, Git, or external authority.
7. If Manage is not selected, stop only when authority or selection is actually ambiguous, then return the one required input and its `DecisionOwner`. With no selected Change, name one ready WorkRef and direct focus action. Otherwise preserve ordinary routing under the clear ready WorkOwner and continue to Implementation evidence or the durable decision as applicable; `manage.activation: explicit` without an explicitly managed request is not itself a stop signal.
8. For incomplete implementation or stale, missing, or failed verification, use [Implementation evidence](#implementation-evidence). This is implementation verification.
9. When Tasks and required verification pass without blockers, perform the durable writeback decision. A fixed-scope change review remains a separate report-only gate: require it only when explicitly requested, required by nearer authority or risk, or needed for managed `review-clean`; do not impose it automatically on every tiny direct action. Do not infer a release operation from Change completion.

State the `ControlOutcome`, derived stage, one next action, required input, returned owner, decisive evidence, and resume or rederivation rule. `ask-owner` asks one highest-impact owner question and resumes through fresh Core derivation after the answer; `return-to-shape` resumes only after Shape confirms a ready owner; `reroute` requires a valid owner or authority boundary. Other stops name the evidence, environment, verification, or capability condition that must change.

For managed evaluation, state `selected` or `declined` with the decisive qualification signal or complete direct-work exclusion; when dispatch applies, state why it is parallel or sequential. Name at most one optional Discipline Skill, only when it is the next action and appears in the host's loaded Skill inventory. A missing optional Discipline Skill does not invalidate RSP: use its bounded manual fallback against the same owner. This fallback never substitutes for a required managed worker or required independent Verify: keep acceptance incomplete and stop with `capability-unavailable` or the more specific evidenced `StopDisposition`. For an authorized exact local commit boundary, route exact staging, structured message construction, local commit execution, and post-commit observation to `rsp-commit`; if unavailable, use the durable-decision manual fallback. Do not preload, enumerate, or recursively invoke optional capabilities.

After an isolated workspace has an authorized exact commit set, route local transfer to `rsp-land` only with explicit landing authority, exact target branch, ordered commits, and cleanup disposition. Commit authority alone does not grant Land; Land does not grant conflict resolution, cleanup, push, or publication. A missing required workspace or Land capability stops with `capability-unavailable` rather than silently mutating another worktree.

### Implementation evidence

- **Diagnosis first:** diagnosis takes precedence over TDD for an evidenced but unexplained, conflicting, intermittent, or multi-layer failure. Use `rsp-diagnose` when available; its manual fallback reproduces, locates, and tests the smallest discriminating hypothesis. Do not encode an unexplained symptom as a guessed regression test.
- **TDD when justified:** use `rsp-tdd` only when test-first is explicitly required by the user, Change, or project instructions, or when a concrete changed risk makes a pre-mutation RED materially safer. Public contracts, persisted data, security or money, concurrency, complex transitions, and escaped defects qualify; mere testability or being a fix does not. Its manual fallback observes the focused RED, makes the minimum GREEN change, and refactors only while green.
- **Ordinary implementation by default:** use `rsp-implement`, or the equivalent bounded edit and verification, once the behavior, cause, and owner are sufficiently evidenced.

All branches return evidence, Tasks, Verify updates, and blockers to the same Change. Fresh verification is required, but a new test is only one option; use the cheapest decisive check that covers the changed risk.

## Operate the selected Change

Before focusing or mutating a different WorkRef, compare dirty product or durable-truth paths with the prior owner's declared or observed paths. Overlap never transfers ownership: continue the same open WorkRef, explicitly reopen archived acceptance when authorized and applicable, use an explicitly authorized integration owner, or stop for boundary resolution. Disjoint authorized work may proceed without staging or forcing a commit; insufficient evidence stops the transition.

Read the focused Change, its sibling Group Brief when grouped, and only the relevant Specs and Decision Records before implementation. Use generated local `.rsp/specs/**/00-index.md` files only as direct-child navigation; never treat them as durable owners. Run `npx -y @oevery/rsp check --focused` before treating it as ready. Only `focus.d/` markers select current work; open filenames do not. Preserve one explicit `kind` and the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections.

Keep the Change a convergent snapshot of the current plan and final decisive evidence. Replace superseded content; keep routine attempts, RED/GREEN chronology, temporary probes, and command transcripts in the response. Update Tasks, Verify, and any invalidated Proposal, Spec, or Design in the same session.

Persist only `open` and `archived`; derive readiness, blockers, stage, and next actions. Do not infer implementation, review, Git, publication, or approval authority from focus, readiness, routing, or capability availability.

When fresh evidence shows that archived acceptance was incomplete, keep the correction under the same owner and read [reopen recovery](references/reopen-recovery.md) before any lifecycle mutation. Reopen requires explicit lifecycle authority and grants no Git or external authority; genuinely new or independently delivered scope uses a new corrective owner.

Load detailed procedures only when their path is active:

- Read [setup and repair](references/setup-repair.md) before initializing, auditing, migrating, or repairing RSP state.
- Read [groups and dependencies](references/groups-dependencies.md) before creating, focusing, planning, or closing grouped/dependent work.
- Read [conflict handling](references/conflict-handling.md) only when an active merge, rebase, or cherry-pick conflict intersects authorized work.
- Read [durable writeback decision](references/durable-review.md) only after required Tasks and implementation verification pass, or when auditing archive readiness.

## Ownership and safety

Route planned design to the selected Change; stable implemented facts to the smallest relevant Spec or authorized scoped instruction; lasting rationale to one exact Decision Record; stable navigation to project-owned `CONTEXT.md`; stable operating rules to project-owned `AGENTS.md`; and temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for managed setup, focus, repair, indexes, archive, and reopen. Do not directly create command-owned files, edit generated indexes or `.rsp/rsp-rules.md` as durable truth, or modify the managed RSP block. Preserve unrelated work. Core recommends explicit archive only after the durable decision; it does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority. A configured `manage.closeout` preset remains dormant unless Core selected and qualified Manage for the current continuation; declined, unavailable, or unselected Manage leaves Core advisory even under `lifecycle` or `local`. Core also does not execute reopen without explicit lifecycle authority. During a qualified managed run, `rsp-manage` solely owns interruption and resume, convergence, lifecycle closeout, and commit eligibility and orchestration; `rsp-commit` owns exact Git execution. Those procedures create no persisted controller state or additional authority.

When accepted work remains, return a localized continuation with these semantic fields in order: `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, `Next action`. Preserve technical values. The continuation points to existing owners, is not a second state store, and must not be persisted without explicit path authority. On resume, reopen its pointers, inspect drift, and refresh decisive evidence.

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

Response-only Continuation and Durable Decision labels are not canonical artifact headings. In Chinese, for example, use `## 持久化决策`, `决策记录（Decision Record）`, and `可归档（Archive ready）`, not English labels alone. A required unwritten update or real blocker makes archive readiness `no`; CLI `archiveReady: judgment` is advisory, not approval.
