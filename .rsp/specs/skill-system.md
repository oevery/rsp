# Skill System

## Purpose
- Define the published Skill suite, capability ownership, and progressive-disclosure boundaries.

## Suite composition

- The published default suite contains `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-commit`, `rsp-release-docs`, and `rsp-manage`.
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
| `rsp-structural-audit` | optional | Discovery | explicit report-only request |

## Capability ownership

- Skills are independently selectable and return to an existing project, Change, Spec, Decision Record, archive, or release-artifact owner. Report-only Pre-Change Design and Structural Audit may return one bounded result directly to the user without creating an artifact owner.
- `rsp` owns project entry, current-action routing, durable-artifact routing, and the output contract required before another capability is loaded.
- Core and Manage use only the execution location actually supplied by the host. Manage may include that observed location in its transient ExecutionFrame, but no Skill selects, prepares, persists, lands, or cleans an execution environment.
- `rsp-shape` owns clarification and ready-owner planning artifacts; `rsp-design` owns one bounded report-only design question.
- `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-commit`, and `rsp-release-docs` remain standalone bounded capabilities within their declared result and authority contracts.
- `rsp-manage` is the only suite capability that composes worker lanes, selected-goal execution, review convergence, lifecycle closeout, and local Commit orchestration after Core selection.
- `rsp-commit` owns exact local commit creation and its receipt for one Core- or Manage-derived `direct`, Change, Group, or release boundary. A direct owner is transient and supplies no synthetic WorkRef or lifecycle state. Host or user Git tooling owns any later cross-branch handoff, cherry-pick, cleanup, remote delivery, or publication.
- Each capability has one detailed procedure owner. Non-owner capabilities may invoke or append bounded fields, but do not redefine another capability's complete contract.

## Progressive disclosure

- The Skill Control Model is the sole durable owner of transient control vocabulary; this Spec does not redefine its fields or enums.
- Published Skills are standalone and must not require `.rsp/` Specs, generated projections, another installed Skill, or a runtime glossary.
- Always-loaded entry Skills retain only the selection, routing, safety, fallback, and output facts needed for their own phase. Detailed procedures are loaded from the owning Skill or a conditional reference only when that branch is active.
- Core conditionally loads setup/repair, Group/dependency operations, conflict handling, managed routing, release operations, archived-acceptance recovery, and durable writeback guidance. Automatic Manage routing requires observable coordination rather than file or documentation count; substantial sequential work remains managed only when a real multi-phase or authority obligation exists. Core-to-Manage or Core-to-Discipline is a transient control transfer; Manage-to-worker remains bounded delegation with Manage retaining selected-goal control. One outer `ControlOutcome` projects `solo | delegated | coordinated` and `running | waiting | completed`; route, dispatch disposition, topology, lane result, acceptance, and closeout remain nested details or gates. Manage conditionally loads host worker lifecycle, interruption/recovery, review convergence, and lifecycle/delivery closeout. During execution it derives one transient ExecutionFrame and `DispatchDisposition: none | preferred | required`; `none` permits a bounded local Discipline action, while `required` fails closed when the declared worker boundary is unavailable. A reusable WorkerSession may receive successive non-overlapping WorkerInvocations, each owning one admitted Assignment or AssignmentDelta through settlement and release. Manage validates a worker-authored WorkerReceipt, then separately derives AcceptedLaneEvidence from actual paths, diff, verification, authority, host observations, and resource release. It preferentially resumes a compatible longitudinal primary worker to avoid repeating settled context; independent investigation or Verify, separate slices, rejected strategy, session loss, or invalidated continuity receives a fresh worker and complete Assignment. Review conditionally loads its Code and Document pipelines.
- Manage derives control-action, longitudinal, sequential, parallel-wave, read-only-fan-out, bounded-correction, and independent-Verify topology as internal strategy from current ownership, seams, resources, replay safety, and acceptance needs. No topology or whole-run dispatch quota is persisted. Token or context cost may break ties only among equally safe and authorized strategies and never changes authority, safety, acceptance, or completion. Same-scope Fix correction permits at most three passes by default and stops earlier on repeated evidence, non-convergence, boundary change, unavailable capability, or unsafe replay; independent Verify remains a separate obligation.
- Focus Capsules are sparse Manager-owned recovery projections inside the selected marker, not another Skill, worker channel, event log, WorkerReceipt store, dependency graph, authority source, or serialized ExecutionFrame. A portable commit-safe v1 capsule contains only one leading version comment, blank lines, exactly one non-empty single-line `Current`, `Evidence`, and `Next`, plus at most one non-empty single-line `Resume check`; unknown non-empty lines or fields are invalid. It omits identities, handles, machine paths, ResourceLeases, raw WorkerReceipts, chronology, topology, authority, acceptance, logs, diffs, and duplicated tasks. Cross-session or cross-device recovery distrusts transient claims and rederives current authority, baseline, dirty state, resources, blockers, and evidence freshness. Managed verification remains lane-local first, affected or integration-scoped at convergence, and fresh against Change-required evidence at closeout.
- Shared composition does not recursively load unrelated Skill bodies. Private notation, numeric routing scores, hidden controller state, registries, and implicit Git/publication authority are outside the suite contract.
- Normative Skill prose stays in English for cross-agent stability. Retained evaluation evidence is immutable; material prompt changes require a new evaluation identity and fresh run.

## Boundaries
- In scope:
  - Skill selection, discipline behavior, artifact return paths, conditional references, managed qualification/convergence, and authority separation.
- Out of scope:
  - Host scheduling, hidden runtime orchestration, persisted controller, WorkerSession, WorkerInvocation, WorkerReceipt, AcceptedLaneEvidence, ResourceLease, topology, retry, event-history, or verification-ledger state, runtime-owned semantic decisions, general host permissions, remote Git/publication authority, and project-specific product decisions.

## Constraints
- Keep safety, authority, readiness, verification, and completion criteria checkable even when compacting prompts.
- Prefer progressive disclosure and one semantic owner over duplicated eager rules.
- Keep agent-distributed normative prose in English for cross-agent stability.
- Retained evaluation evidence is immutable; prompt-content changes require a new identity and fresh run rather than overwriting prior results.
