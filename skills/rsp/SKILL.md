---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.07.25.8"
---

# RSP Skill

Use RSP to derive one current action from project authority and durable work artifacts. This Skill is the preferred operational guide; `.rsp/rsp-rules.md` is the runtime fallback when the Skill is unavailable.

Nearest project instructions and relevant `CONTEXT.md` remain authoritative. Choose response and artifact languages independently: localize human-facing response prose, but preserve canonical RSP headings, WorkRefs, paths, commands, identifiers, and machine values. Write persistent artifacts in domain, system, user, or operator language; mention AI or agents only when they are actual product actors or constraints.

## Scope

Use this Skill for RSP setup or repair, focused `.rsp/` work, and the durable-update decision before archive. Do not use it for unrelated coding or create a Change for a simple session task unless the user explicitly requests tracking.

## Derive one next action

Read user intent, nearest authority, `rsp status --json`, the selected Change and its readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

Apply these routes in order:

1. Stop for ambiguous authority or selection and return the one required input and its owner. For a material owner decision inside an explicit managed request, continue to the Shape preflight in route 2 so repository inspection precedes the single owner question; otherwise stop here.
2. On an explicit managed-completion or managed-continuation request that is not an explicit report-only review or release operation, treat the requested goal and allowed planning and product mutations as a transient authority envelope, then resolve the smallest sufficient owner before testing Manage eligibility. Reuse one unambiguous selected ready owner. With no sufficient ready owner, return tiny settled work to direct engineering without a synthetic Change or controller artifact. For clear non-trivial work, the managed request grants authority to create or refine only its in-scope RSP planning artifacts unless the user requests no edits; use `rsp-shape` when available, otherwise its manual fallback, then re-read status and readiness and re-evaluate this route without another authorization round. When a material product, acceptance, scope, or owner choice remains after repository inspection—including public-interface, mutation-authority, or external-action changes—route to Shape for the single highest-impact owner decision and create no implementation or controller artifact. Only after that preflight, select `rsp-manage` for one focused ready Change or one explicitly selected ready shallow Group with genuinely independent slices, long authorized continuation, or interruption recovery. After accepted managed progress, re-read status and apply this same route: continue a clear in-scope ready successor; when ownership is clearly missing, have Manage suspend dispatch and return discovery evidence, route it to Shape under the original planning-artifact authority, then requalify and resume without another authorization round; otherwise stop naturally only when neither a ready successor nor clearly missing ownership remains. Shape keeps a cohesive correction in its Change, gives an independently verifiable and archivable result one Change, or gives at least two such results sharing one goal one shallow Group. After a managed fixed-scope re-review, correlate the report, selected Change, original authority, fresh verification, and transient convergence count. Return an in-scope `accepted` remaining or new Finding as `correction-needed` to another bounded Address Review pass without asking the user to continue; Address Review itself never self-loops. Use Manage's separate convergence limit and stop for `needs-clarification`, material behavior/interface/scope or authority change, verification-budget expansion, failed evidence, or repeated non-convergence. An ineligible request returns the ordinary Core or Discipline action. Managed routing is never implicit. Unless user/nearer authority reserves lifecycle, Manage archives reviewed Change with `rsp archive <change-work-ref>`; Group independently reviews/archives children, rederives completion, then runs `rsp group close <group>` only after children and gate pass. Both inspect complete lifecycle diff before commit, including terminal owners. Downstream work justifies checkpoint; terminal small work defaults to no commit; terminal non-small work needs explicit delivery or evidenced recovery value plus nearer-rule permission. Push always requires an explicit user mention plus an unambiguous remote, branch, and milestone. No managed request grants force-push, publication, deployment, approval, or human-acceptance authority.
3. Route an explicit report-only review with fixed scope to `rsp-review` when available, otherwise perform the same read-only review manually.
4. Route an explicit release-documentation, finalization, publication, or reconciliation operation through [Release operations](#release-operations) before ordinary Change routing.
5. With no selected Change, name one ready WorkRef and direct focus action. For tiny settled work, return the direct engineering action. For unclear non-trivial work, use `rsp-shape` when available and Change mutation is authorized; otherwise manually create or refine one Change to the same ready boundary.
6. Route one isolated material domain, module/seam, or evidence-seeking design question to `rsp-design` when available. Its manual fallback inspects authority and the live path, compares credible alternatives, separates evidence from owner choice, and returns the result to the same WorkRef without implementation or durable-truth mutation.
7. If the Change is not shape-ready, route to Shape under the same authority rule.
8. For incomplete implementation or stale, missing, or failed verification, use [Implementation evidence](#implementation-evidence).
9. When Tasks and required verification pass without blockers, perform the durable decision. Do not infer a release operation from Change completion.

State the derived stage, one next action, required input, returned owner, and decisive evidence. Name at most one optional capability, only when it is the next action and appears in the host's loaded Skill inventory. Missing capabilities never invalidate RSP: give the manual fallback against the same owner. Do not preload, enumerate, or recursively invoke optional capabilities.

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

Read the focused Change, its sibling Group Brief when grouped, and only the relevant Specs and Decision Records before implementation. Run `npx -y @oevery/rsp check --focused` before treating it as ready. Only `focus.d/` markers select current work; open filenames do not. Preserve one explicit `kind` and the canonical Proposal, Spec, Design, Tasks, Verify, and Blockers sections.

Keep the Change a convergent snapshot of the current plan and final decisive evidence. Replace superseded content; keep routine attempts, RED/GREEN chronology, temporary probes, and command transcripts in the response. Update Tasks, Verify, and any invalidated Proposal, Spec, or Design in the same session.

Persist only `open` and `archived`; derive readiness, blockers, stage, and next actions. Do not infer implementation, review, Git, publication, or approval authority from focus, readiness, routing, or capability availability.

Load detailed procedures only when their path is active:

- Read [setup and repair](references/setup-repair.md) before initializing, auditing, migrating, or repairing RSP state.
- Read [groups and dependencies](references/groups-dependencies.md) before creating, focusing, planning, or closing grouped/dependent work.
- Read [conflict handling](references/conflict-handling.md) only when an active merge, rebase, or cherry-pick conflict intersects authorized work.
- Read [durable review](references/durable-review.md) only after required Tasks and verification pass, or when auditing archive readiness.

## Ownership and safety

Route planned design to the selected Change; stable implemented facts to the smallest relevant Spec or authorized scoped instruction; lasting rationale to one exact Decision Record; stable navigation to project-owned `CONTEXT.md`; stable operating rules to project-owned `AGENTS.md`; and temporary continuation to the response. Never write planned state as current truth or duplicate facts into rationale.

Use RSP commands for managed setup, focus, repair, indexes, and archive. Do not directly create command-owned files, edit generated indexes or `.rsp/rsp-rules.md` as durable truth, or modify the managed RSP block. Preserve unrelated work. Core recommends explicit archive only after the durable decision; it does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority. The qualified Manage lifecycle and checkpoint rules above are the sole scoped exceptions.

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
