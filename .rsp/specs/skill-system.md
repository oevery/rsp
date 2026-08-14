# Skill System

## Purpose
- Define the published Skill suite, capability ownership, and progressive-disclosure boundaries.

## Suite composition

- The published default suite contains `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-commit`, `rsp-release-docs`, `rsp-manage`, `rsp-workspace`, and `rsp-land`.
- `rsp-structural-audit` is an independently invoked, report-only project Skill. It audits one explicit repository or subtree boundary for evidenced ownership, dependency, production-path, change-amplification, or verification risks; it neither requires nor creates a Change and never enters implementation or lifecycle routing. In a broad boundary, history selects only the smallest current behavior chain and never proves a Finding. Suspected shallow indirection is evaluated by whether removal eliminates complexity or disperses required caller knowledge, while every retained Finding still requires a reachable trigger and concrete impact.
- Structural Audit behavior holdouts separately qualify a real Finding, heuristic false positives, history-only selection, specialist routing, and mutation refusal. Deterministic package tests score result values, Finding bounds, required evidence fields, and forbidden claims; provider execution remains optional evidence rather than an ordinary test dependency.
- Skill classification has three orthogonal axes. Distribution kind is the existing machine contract `default | optional`; runtime role explains Core, Shape, Discipline, Infrastructure, Controller, or Discovery ownership; invocation mode explains direct entry, Core routing, policy selection, or explicit-only selection. Installation never implies invocation or mutation authority, and role remains documentation rather than another runtime manifest or JSON field.

| Skills | Distribution kind | Runtime role | Invocation mode |
| --- | --- | --- | --- |
| `rsp` | default | Core | direct project entry |
| `rsp-shape` | default | Shape | Core-routed or explicit shaping |
| `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-release-docs` | default | Discipline | Core-routed specialist or explicit bounded request |
| `rsp-commit` | default | Discipline: local delivery | Core- or Manage-routed after an authorized exact boundary |
| `rsp-manage` | default | Controller | Core-selected from explicit request or effective project policy |
| `rsp-workspace` | default | Infrastructure: isolated execution | Core-selected for one explicit ready WorkRef when isolation is materially useful |
| `rsp-land` | default | Discipline: local integration | Core- or Manage-routed after an authorized exact workspace commit set |
| `rsp-structural-audit` | optional | Discovery | explicit report-only request |

## Capability ownership

- Skills are independently selectable and return to an existing project, Change, Spec, Decision Record, archive, or release-artifact owner. Report-only Pre-Change Design and Structural Audit may return one bounded result directly to the user without creating an artifact owner.
- `rsp` owns project entry, current-action routing, durable-artifact routing, and the output contract required before another capability is loaded.
- `rsp-shape` owns clarification and ready-owner planning artifacts; `rsp-design` owns one bounded report-only design question.
- `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-commit`, and `rsp-release-docs` remain standalone bounded capabilities within their declared result and authority contracts.
- `rsp-manage` is the only suite capability that composes worker lanes, selected-goal execution, review convergence, lifecycle closeout, and local Commit orchestration after Core selection.
- `rsp-workspace` is isolated execution infrastructure selected by Core; `rsp-land` is local integration for an explicit ordered workspace commit set. Neither grants product, lifecycle, Git, remote, publication, deployment, approval, or human-acceptance authority beyond its owning contract.
- Each capability has one detailed procedure owner. Non-owner capabilities may invoke or append bounded fields, but do not redefine another capability's complete contract.

## Progressive disclosure

- The Skill Control Model is the sole durable owner of transient control vocabulary; this Spec does not redefine its fields or enums.
- Published Skills are standalone and must not require `.rsp/` Specs, generated projections, another installed Skill, or a runtime glossary.
- Published Core and Manage Skills may consume one optional host-exposed `rsp.manage-runtime@1.0` capability, but remain fully operable when it is absent. The capability appends exact correlation and observations only after existing semantic boundaries; it is not another Skill dependency, controller, scheduler, authority source, or acceptance owner.
- Always-loaded entry Skills retain only the selection, routing, safety, fallback, and output facts needed for their own phase. Detailed procedures are loaded from the owning Skill or a conditional reference only when that branch is active.
- Core conditionally loads setup/repair, Group/dependency operations, conflict handling, managed routing, release operations, archived-acceptance recovery, and durable writeback guidance. Manage conditionally loads interruption/recovery, review convergence, and lifecycle/delivery closeout. During execution it sends one minimal one-shot worker slice by message, uses exact authority references and Read/Write/Verify sets instead of copied owner prose, accepts a normal Fix within declared acceptance through actual-path and local-diff inspection without a complete owner reread, and widens reads only when discovery or a request changes a declared behavior, acceptance, or public-interface boundary, or on another invalidation, recovery, or closeout. Review conditionally loads its Code and Document pipelines.
- Focus Capsules are sparse Manager-owned recovery projections inside the selected marker, not another Skill, worker channel, event log, receipt store, dependency graph, or authority source. Their Markdown remains unparsed and arbitrary within the byte bound; a version comment is recommended for generated capsules but is not required. Managed verification remains lane-local first, affected or integration-scoped at convergence, and fresh against Change-required evidence at closeout.
- Shared composition does not recursively load unrelated Skill bodies. Private notation, numeric routing scores, hidden controller state, registries, and implicit Git/publication authority are outside the suite contract.
- Normative Skill prose stays in English for cross-agent stability. Retained evaluation evidence is immutable; material prompt changes require a new evaluation identity and fresh run.

## Boundaries
- In scope:
  - Skill selection, discipline behavior, artifact return paths, conditional references, managed qualification/convergence, and authority separation.
- Out of scope:
  - Host scheduling, hidden runtime orchestration, automatic retry, persisted controller state, runtime-owned semantic decisions, general host permissions, remote Git/publication authority, and project-specific product decisions.

## Constraints
- Keep safety, authority, readiness, verification, and completion criteria checkable even when compacting prompts.
- Prefer progressive disclosure and one semantic owner over duplicated eager rules.
- Keep agent-distributed normative prose in English for cross-agent stability.
- Retained evaluation evidence is immutable; prompt-content changes require a new identity and fresh run rather than overwriting prior results.
