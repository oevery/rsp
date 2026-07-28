---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.07.28.1"
---

# RSP Skill

Use RSP to derive one current action from project authority and durable work artifacts. This Skill is the preferred operational guide; `.rsp/rsp-rules.md` is the runtime fallback when the Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. Choose response and artifact languages independently: localize human-facing response prose, but preserve canonical RSP headings, WorkRefs, paths, commands, identifiers, and machine values. Write persistent artifacts in domain, system, user, or operator language; mention AI or agents only when they are actual product actors or constraints.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, and the durable-update decision before archive. Do not use it for unrelated coding or create a Change for a simple session task unless the user explicitly requests tracking.

## Derive one next action

Read user intent, nearest authority, `rsp status --json`, the selected Change and its readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

Apply these routes in order:

Before later-turn mutation under a direct report, tiny, or small route, rederive routing from the now-authorized objective and prospective work. If it materially expands into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, or lifecycle delivery, establish or reuse the smallest sufficient WorkRef, then apply managed preflight and fresh qualification before mutation. Follow-ups that remain tiny/small stay direct. Elapsed time and message count are never escalation evidence.

1. Stop for ambiguous authority or selection and return the one required input and its owner. For a material owner decision inside an explicit managed request, continue to the Shape preflight in route 2 so repository inspection precedes the single owner question; otherwise stop here.
2. For a requested completion or continuation that is not a report-only review or release operation, read [managed routing](references/managed-routing.md) when the request is explicitly managed or the effective status policy has `manage.activation: auto`. It owns owner preflight, qualification, successor discovery, bounded review convergence, and lifecycle/Git separation. Select `rsp-manage` only after that preflight for an eligible selected ready Change or shallow Group; otherwise return the ordinary Core or Discipline action. Automatic activation grants controller selection only; planning, product mutation, lifecycle, Git, and external authority remain separately derived.
3. Route an explicit report-only review with fixed scope to `rsp-review` when available, otherwise perform the same read-only review manually.
4. Route an explicit release-documentation, finalization, publication, or reconciliation operation through [Release operations](#release-operations) before ordinary Change routing.
5. Route one explicit isolated material domain, module/seam, or evidence-seeking design question to installed `rsp-design`; never manually emulate it. Without a selected Change, use report-only Pre-Change Design only for an already bounded question; return its result without inventing a WorkRef or artifact. With a selected Change, return to that WorkRef. Only when unavailable, its manual fallback inspects authority and the live path, compares credible alternatives, and separates evidence from owner choice without implementation or durable-truth mutation.
6. With no selected Change, name one ready WorkRef and direct focus action. For tiny settled work, return the direct engineering action. When outcome, scope, non-goals, acceptance, or decomposition is materially unclear, use `rsp-shape` when available and Change mutation is authorized; otherwise manually create or refine one Change to the same ready boundary.
7. If the Change is not shape-ready, route to Shape under the same authority rule.
8. For incomplete implementation or stale, missing, or failed verification, use [Implementation evidence](#implementation-evidence).
9. When Tasks and required verification pass without blockers, perform the durable decision. Do not infer a release operation from Change completion.

State the derived stage, one next action, required input, returned owner, and decisive evidence. Name at most one optional capability, only when it is the next action and appears in the host's loaded Skill inventory. Missing capabilities never invalidate RSP: give the manual fallback against the same owner. When Core or qualified Manage has derived one authorized RSP-owned local commit boundary, route exact staging, structured message construction, local commit execution, and post-commit observation to `rsp-commit`; if unavailable, use the bounded manual action in durable review against the same owner. Do not preload, enumerate, or recursively invoke optional capabilities.

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

When fresh evidence shows that an archived executable Change did not meet its original acceptance, keep the correction under the same WorkRef by explicitly running `rsp reopen <work-ref> --reason <text>`. Reopen retains the selected archive as history, restores and focuses open work, and adds unfinished Task and Verify evidence. If multiple archives share the WorkRef, require exact `--from .rsp/archives/...` selection rather than choosing the newest. Treat the open WorkRef as current dependency state; do not cascade into archived dependents or implicitly reopen a closed Change Group. Use a new corrective Change for genuinely new scope or an independently delivered correction. Reopen is lifecycle mutation only and grants no Git, release, publication, deployment, or approval authority.

Load detailed procedures only when their path is active:

- Read [setup and repair](references/setup-repair.md) before initializing, auditing, migrating, or repairing RSP state.
- Read [groups and dependencies](references/groups-dependencies.md) before creating, focusing, planning, or closing grouped/dependent work.
- Read [conflict handling](references/conflict-handling.md) only when an active merge, rebase, or cherry-pick conflict intersects authorized work.
- Read [durable review](references/durable-review.md) only after required Tasks and verification pass, or when auditing archive readiness.

## Ownership and safety

Route planned design to the selected Change; stable implemented facts to the smallest relevant Spec or authorized scoped instruction; lasting rationale to one exact Decision Record; stable navigation to project-owned `CONTEXT.md`; stable operating rules to project-owned `AGENTS.md`; and temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for managed setup, focus, repair, indexes, archive, and reopen. Do not directly create command-owned files, edit generated indexes or `.rsp/rsp-rules.md` as durable truth, or modify the managed RSP block. Preserve unrelated work. Core recommends explicit archive only after the durable decision; it does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority. A configured `manage.closeout` preset remains dormant unless Core selected and qualified Manage for the current continuation; declined, unavailable, or unselected Manage leaves Core advisory even under `lifecycle` or `local`. Core also does not execute reopen without explicit lifecycle authority. The qualified Manage rules in [managed routing](references/managed-routing.md) are the sole scoped exceptions.

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
