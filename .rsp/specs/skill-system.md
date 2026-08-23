# Skill System

## Purpose
- Define the published Skill suite, capability ownership, and progressive-disclosure boundaries.

## Suite composition
- The published default suite contains `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-commit`, `rsp-release-docs`, and `rsp-manage`.
- `rsp-structural-audit` remains an optional explicit report-only Discovery Skill.
- Distribution kind is `default | optional`; runtime role documents Core, Shape, Discipline, Controller, or Discovery ownership; invocation mode documents direct, Core-routed, policy-selected, or explicit-only entry. Installation grants no mutation or lifecycle authority.

## Capability ownership
- `rsp` owns project entry, current-action routing, durable-artifact routing, and the outer response contract.
- `rsp-shape` owns clarification and ready-owner planning artifacts. `rsp-design` owns one bounded report-only design question.
- Discipline Skills own their bounded action and result. They do not become routers, controllers, host runtimes, or acceptance owners.
- `rsp-manage` composes bounded Discipline work, validates results, converges review, derives acceptance, and orchestrates authorized lifecycle closeout after Core selection.
- `rsp-commit` owns exact local commit creation. Later cross-branch integration, remote delivery, and publication remain separately authorized.
- Hosts own worker execution, identity, continuation, cancellation, isolation, concurrency, and lifecycle observations; no Skill selects, prepares, persists, lands, or cleans an execution environment. Evaluators and adapters own machine schemas, correlation, parsing, event extraction, and provider scoring. These are not RSP Skill capabilities or durable vocabulary.

## Progressive disclosure
- Published Skills are standalone and never require `.rsp/` Specs, generated projections, another installed Skill, or a runtime glossary.
- Always-loaded entry Skills retain only selection, authority, safety, stop, return, and conditional-loading facts needed for their phase. Detailed low-frequency procedures live in directly linked references; deterministic processing belongs in scripts.
- Core conditionally loads setup, repair, Group operations, conflicts, managed routing, incomplete or failed implementation evidence, Focus/continuation recovery, release operations, archived recovery, and durable review only when triggered.
- Manage conditionally loads interruption/recovery, review convergence, and lifecycle closeout. Ordinary delegation remains in the entry Skill because it is short: one bounded task, one Discipline-owned result, host facts when available, and Manager validation.
- Review fixes scope and authority, classifies only the reviewed artifacts, then conditionally loads the Code pipeline, Document pipeline, or both; authority-only inputs trigger neither pipeline.
- One outer `ControlOutcome` projects `solo | delegated | coordinated` and `running | waiting | completed`. Strategy, lane result, acceptance, and closeout remain nested details or gates.
- Strategy names describe Manager reasoning but create no portable runtime entities. A compatible worker may be resumed when the host supports it, while changed authority, scope, strategy, acceptance, or evidence receives a complete fresh task.
- Focus Capsules are sparse Manager-owned recovery pointers. They contain no worker identities, handles, runtime state, raw results, chronology, topology, authority, acceptance, logs, diffs, or duplicated Tasks.
- Shared composition never recursively loads unrelated Skill bodies. Private notation, hidden controller state, registries, runtime protocols, and implicit Git or publication authority remain outside the suite contract.
- Normative Skill prose stays in English for cross-agent stability. Material behavior changes require fresh deterministic evidence and a new candidate identity when used in evaluation.

## Boundaries
- In scope: Skill selection, bounded Discipline behavior, artifact return paths, managed qualification, delegation semantics, result validation, convergence, authority separation, and closeout gates.
- Out of scope: host scheduling, worker/session/invocation models, cancellation protocols, leases, event histories, structured worker transports, evaluator receipts, provider scoring, persisted controllers, remote Git/publication authority, and project-specific product decisions.

## Constraints
- Keep safety, authority, readiness, verification, and completion criteria checkable without requiring agents to understand host runtime internals.
- Prefer one semantic owner and the smallest sufficient context over duplicated schemas or protocol prose.
- Internal evaluation formats must remain lightweight implementation details and must not become published Skill or durable Spec dependencies.
