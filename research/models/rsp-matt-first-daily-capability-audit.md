---
topic: rsp-matt-first-daily-capability-audit
status: complete
implementation_status: proposed
decision_status: candidate
sources:
  - "matt-skills@9603c1cc8118d08bc1b3bf34cf714f62178dea3b -> research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md"
  - "superpowers@d884ae04edebef577e82ff7c4e143debd0bbec99 -> research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md"
  - "compound-engineering@d1bff966296b687eb8509312098458e5fa2535dc -> research/upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md"
  - "gsd-core@24273e9fdf54f85af23000e7edeaa99d8b74aab9 -> research/upstreams/gsd-core/24273e9fdf54f85af23000e7edeaa99d8b74aab9.md"
---

# RSP Matt-first Daily Capability Audit

## Decision

Keep Matt as the primary behavioral reference for small daily engineering disciplines, but do not reproduce its Skill inventory one-for-one. The current seven-Skill suite already covers navigation, shaping output, implementation, diagnosis, TDD, review, and review resolution. Its material daily-depth gaps are narrower:

1. `rsp-shape` can resolve and record ambiguity, but it does not itself provide Matt's deliberate one-question-at-a-time stress-test mode or active domain-modeling discipline.
2. The suite has no generic owner for authorized multi-stage continuation, bounded delegation, or cross-session recovery after the stable disciplines compose.

Treat the first as a candidate progressive shaping branch, not a new always-discoverable Skill. Treat the second as an optional Managed Controller outside the seven-Skill assisted suite. Keep module design, prototypes, tracker operations, merge conflicts, Git delivery, teaching, and general research in project/host-selected capabilities unless a later RSP-specific failure proves a different owner.

This audit does not qualify either candidate. It blocks 3.0 product-boundary freeze until the maintainer selects or rejects the two follow-ups and their paired evaluation gate.

## Evidence Boundary

- Matt source: accepted complete report at revision `9603c1cc8118d08bc1b3bf34cf714f62178dea3b`; all required upstream paths matched and status reports no pending revision.
- Current product: `skills/rsp`, `rsp-shape`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-review`, and `rsp-address-review` plus their frozen system/capability models.
- Retained behavior evidence: Shape's three complete 15-case paired matrices, Core's six-case holdout, the assisted-loop three-turn installed-package holdout, and the installed diagnosis/TDD holdouts.
- Local daily evidence: boats-cloud uses project-owned `.scratch` issues, rich `AGENTS.md`/`CONTEXT.md` domain authority, cross-Web/Desktop changes, logical commit slicing, authenticated or hardware acceptance, and handoff to a different code owner.

No fresh Matt-versus-RSP provider matrix was run for this research slice. Cost and success comparisons below therefore use retained RSP runs plus contract analysis; paired candidate performance remains a follow-up promotion gate.

## Complete Matt Capability Disposition

| Capability family | Matt stable Skills | Current RSP coverage | Daily-depth finding | Disposition |
| --- | --- | --- | --- | --- |
| Navigation | `ask-matt` | Core derives one next action from intent, focus, readiness, and available capabilities | Covered without loading a catalog | Keep `rsp`; no new router |
| Clarification | `grilling`, `grill-me`, `grill-with-docs` | Shape inspects evidence, asks material owner questions, and progressively loads multi-round shaping; external grilling is optional | Basic and multi-round clarification are covered, but deliberate stress-testing is not self-contained | Evaluate one progressive deep-clarification branch |
| Specification and slicing | `to-spec`, `to-tickets` | Shape writes one six-section Change or shallow Group with tracer-bullet slices and exact blockers | Covered for RSP-owned work | Keep `rsp-shape`; do not add PRD/ticket duplicates |
| Domain and module design | `domain-modeling`, `codebase-design` | RSP reads project context, Specs, and Decisions but owns no generic design vocabulary | Real projects often already own richer domain/module rules; duplicating them would create competing authority | Keep project-selected by default; test only a narrow Shape routing hook |
| Exploration | `prototype`, `improve-codebase-architecture` | No RSP owner | Distinct report/disposable-code outputs and broad mutation scope do not belong to ordinary shaping | External explicit opt-in |
| Implementation | `implement` | Implement owns one selected ready Change, dirty-worktree restraint, fresh verification, and return ownership | Covered | Keep `rsp-implement` |
| Test and diagnosis | `tdd`, `diagnosing-bugs` | Standalone concise TDD and non-corrective diagnosis Skills | Covered for ordinary clear behavior and confirmed-cause diagnosis; specialized flaky/performance/HITL branches remain intentionally unqualified | Keep concise contracts; add depth only after a failing holdout |
| Review | `code-review` | Fixed-scope Code/Document review plus separate finding resolution | Covered and behavior-qualified | Keep Review and Address Review separate |
| Continuity | `handoff`, `wayfinder` | Address Review has an artifact-scoped handoff; generic continuity is deferred | The stable disciplines now compose, and repeated long work still requires manual next-step prompting | Select an optional Controller candidate; do not import Wayfinder's tracker map |
| Tracker/project setup | `setup-matt-pocock-skills`, `triage` | RSP has its own protocol; projects may use another tracker | A second tracker authority would be harmful | External project workflow |
| Git conflict handling | `resolving-merge-conflicts` | No RSP owner | Requires a concrete Git state and authority, independent of RSP lifecycle | External project/host discipline |
| Research | `research` | Maintainer `distill-upstream`; ordinary project research remains host-selected | Covered for RSP maintenance, not a runtime product gap | Do not publish a duplicate |
| Teaching and Skill authoring | `teach`, `writing-great-skills` | No RSP runtime owner | User/productivity capability rather than RSP workflow state | External |

Deprecated, in-progress, personal, and miscellaneous Matt Skills remain research inventory, not stable product candidates. `grill-with-docs` is composition glue over grilling plus domain modeling rather than evidence for a third independent RSP capability.

## Five Daily Journey Audit

### J1 — Ambiguous product intent

**Representative need:** a user has a direction but key behavior, ownership, migration, or acceptance decisions are unsettled.

**Current evidence:** Shape's retained 15-case matrix covers multi-round clarification, ambiguity stops, optional grilling, dirty preservation, cohesive work, Groups, and terminal delivery. `complex-shaping.md` asks one to three related questions and can repeat until material decisions close.

**Matt delta:** `grilling` makes stress-testing an explicit user-selected mode: one question at a time, traverse dependent decisions, provide a recommended answer, inspect facts instead of asking for them, and do not act until shared understanding is confirmed.

**Finding:** no general clarification failure is demonstrated. The missing behavior is an explicit high-depth mode for users who ask to be challenged. Adding another default Skill would overstate the gap; a progressively loaded Shape reference can express the mode with lower discovery and context cost.

### J2 — Domain vocabulary and durable documents

**Representative need:** a change introduces or changes domain terms, ownership, state transitions, or a hard-to-reverse decision.

**Current evidence:** Core and Shape read Specs/Decision Records and route stable facts or rationale to existing owners. They avoid inventing product decisions and do not automatically promote Change prose.

**Matt delta:** `domain-modeling` actively challenges terms with edge cases and writes settled glossary/decision material; `grill-with-docs` composes that behavior with a deep interview.

**Finding:** RSP has the durable destinations but not the active design discipline. In boats-cloud, project-owned `CONTEXT.md`, ADRs, and scoped instructions already provide richer domain authority than a generic RSP vocabulary. The smallest RSP improvement is a Shape routing/return contract for explicit domain-model work, not a competing universal glossary format.

### J3 — Module seam design

**Representative need:** decide whether behavior belongs in Web, Electron, a package, an adapter, or an owning domain module, and choose the public test seam.

**Current evidence:** Shape requires affected boundaries and verification; Implement and Review follow nearest project rules and production reachability. They do not define a universal deep-module vocabulary.

**Matt delta:** `codebase-design` supplies a consistent vocabulary for module depth, interfaces, seams, deletion tests, and test surfaces; `improve-codebase-architecture` applies it through a broad audit.

**Finding:** the capability is valuable, but the authority usually belongs to the project's architecture rules. boats-cloud already defines owner-first modules, typed Web/Electron boundaries, published interfaces, and testing seams. RSP should route an explicitly requested design task to an available project capability and consume its settled result; it should not make Matt's vocabulary an RSP protocol rule.

### J4 — Ordinary implementation and correction

**Representative need:** implement a clear vertical slice, use TDD or diagnosis when evidence selects it, review the fixed scope, address accepted findings, and preserve unrelated work.

**Current evidence:** the installed seven-Skill package passed deterministic composition plus fresh diagnosis, RED/GREEN, review-resolution, and re-review holdouts. The TDD confirmation skipped an unjustified refactor; diagnosis stopped before production correction; no run inferred Git authority.

**Matt delta:** Matt offers richer tutorials and specialized feedback-loop techniques, but no missing ordinary owner. Superpowers adds stricter shortcut defenses at much greater instruction weight.

**Finding:** covered. Keep Matt as the primary refinement source and Superpowers as negative-test evidence. Do not reopen stable Skills without a failing real task.

### J5 — Long multi-session continuation

**Representative need:** the user authorizes completion across several slices or agents and expects work to continue until a genuine decision, environment, human-acceptance, or external-action boundary.

**Current evidence:** Core intentionally returns one next action. Discipline Skills return to the same Change and cannot recursively invoke one another. Address Review can recover one bounded pass, but the assisted-loop report explicitly does not qualify a Managed Controller, automatic retries, parallel agents, or generic handoff.

**Matt and cross-source delta:** Matt's `handoff` keeps compact pointers to authoritative artifacts; Matt's implementation loop and router expose the main path. GSD and Compound separately support an optional controller with explicit inputs/outputs, run-local state, budgets, and authority stops. Superpowers contributes bounded delegation and review-after-implementation constraints, not the mandatory full method.

**Finding:** this is a demonstrated missing layer, not another Discipline Skill. The system model's prerequisite is now satisfied because Shape, Implement, Review, Address Review, TDD, and Diagnose compose through existing RSP artifacts.

## Candidate Recommendations

### D1 — Deep clarification as a progressive Shape branch (`model-only`)

- **Observed gap:** users who explicitly request relentless questioning cannot get a self-contained high-depth mode from RSP alone.
- **Owner:** `rsp-shape` capability-local reference, loaded only for explicit deep exploration or a high-risk multi-round decision.
- **Smallest behaviors:** inspect facts first; ask one owner decision at a time; provide a recommended answer; traverse dependent decisions; stop mutation until the user confirms shared understanding.
- **Boundaries:** no implementation, Git, hidden state, invented product decision, or automatic durable-document mutation.
- **Evidence gate:** compare current Shape and the candidate on ambiguous product, domain term, premature-action restraint, already-settled restraint, and ordinary-shaping cost cases.

### D2 — Project design capability routing, not RSP-owned design doctrine (`model-only`)

- **Observed gap:** Shape can identify a design decision but cannot supply every project's domain/module discipline.
- **Owner:** Core/Shape return contract to one available project-selected `domain-modeling`, `codebase-design`, or equivalent capability.
- **Smallest behaviors:** name the unresolved design question, authoritative project docs, expected design artifact, mutation boundary, and same returning WorkRef.
- **Boundaries:** no catalog enumeration, required Matt dependency, duplicate glossary/ADR owner, or recursive invocation inside Shape.
- **Evidence gate:** a domain-language and module-seam holdout must show fewer owner corrections than ordinary Shape without adding cost to unrelated work.

### D3 — Optional Managed Controller experiment (`model-only` plus independent implementation)

- **Observed gap:** authorized long work requires repeated user prompts and has no generic continuation/recovery owner.
- **Owner:** optional Controller outside the seven-Skill suite and outside durable `.rsp/` truth.
- **Smallest behaviors:** consume one focused Change; select direct/assisted/managed depth from task size and explicit user intent; dispatch bounded capabilities with named inputs/output/mutation/verification/stop; continue until a real authority or evidence boundary; keep only a transient artifact-scoped handoff and return durable facts to existing owners.
- **Boundaries:** no new project state model, recursive hidden retry loop, implicit commit/push/publish, mandatory subagents, or requirement for proprietary host features.
- **Evidence gate:** paired current-versus-controller runs on one multi-slice task and one interruption/recovery task, measuring success, corrections, elapsed time, total tokens, tool calls, unauthorized actions, and stale-evidence handling.

### D4 — Verification coverage stays evidence, not a new Skill or state (`model-only`)

- **Observed gap:** automation can pass while authenticated, browser, packaging, deployment, or hardware acceptance remains pending.
- **Owner:** existing Change `Verify`, discipline return receipts, Review Coverage, and Controller stop output.
- **Smallest behaviors:** label observed automated checks, environment/manual coverage, omitted coverage, owner, and next acceptance action.
- **Boundaries:** no persisted readiness enum in RSP and no claim that unavailable real-world acceptance is a code failure.
- **Evidence gate:** a hardware-derived holdout must remain incomplete and return the human action despite all automated checks passing.

### D5 — Freeze by daily-depth composition, not Skill count (`independent-reimplementation`)

- **Observed gap:** the minimum suite gate proves assisted composition but not the maintainer's end-to-end daily workflow.
- **Owner:** a future RSP Change Group selected by the maintainer, with D1/D2 shaping depth, D3 controller, and one terminal composition slice.
- **Evidence gate:** five sanitized journeys corresponding to J1-J5; candidate promotion requires only demonstrated deltas, hard-boundary tests, one available-host run, and total-cost reporting.

## Rejected Expansion

- Copying the Matt directory or publishing one RSP Skill per Matt Skill.
- Adding `rsp-accept` when verification coverage can remain evidence in existing owners.
- Adding `rsp-deliver` to the canonical suite; explicit Git delivery remains project/host authority and may be called only by an authorized controller adapter.
- Treating `.scratch`, GitHub, Linear, or another external tracker item as an RSP WorkRef inside every Discipline Skill.
- Adding generic architecture, prototype, research, teaching, setup, triage, or merge-conflict Skills before a distinct RSP-owned failure exists.
- Using Superpowers' universal invocation, mandatory TDD/worktree sequence, Iron-Law repetition, or full-method bootstrap as the daily RSP flow.

## Release Decision

The seven stable Skills remain a valid 3.0 **assisted suite**. They are not yet evidence for a self-contained **managed daily workflow**. Because the maintainer explicitly requires the latter, release preparation should remain blocked until D1/D2 and D3 are selected or rejected and D5's scope is fixed. The next product action is one decision: authorize a shallow `daily-workflow-depth` Group containing a shaping-depth candidate, a Managed Controller experiment, and a terminal five-journey composition gate, or narrow the 3.0 promise back to the already qualified assisted suite.
