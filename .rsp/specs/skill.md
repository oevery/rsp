# Skill

## Purpose

Define Skill capability ownership, composition, routing, delegation, control boundaries, and progressive disclosure.

## Capability ownership

- The default suite contains `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-verify`, `rsp-review`, `rsp-resolve-findings`, `rsp-commit`, `rsp-release-docs`, and `rsp-manage`.
- `rsp-structural-audit` is an optional report-only Discovery Skill. Installation does not grant mutation, lifecycle, Git, publication, approval, or human-acceptance authority.
- `rsp` owns project entry, current-action routing, durable-artifact routing, and the outer response contract.
- `rsp-shape` owns clarification and ready-owner planning. `rsp-design` owns one bounded report-only design question.
- Discipline Skills own their bounded action and result. They do not become routers, controllers, host runtimes, or acceptance owners.
- Tracked `rsp-design` returns a design result to one Change WorkRef; a Group Brief supplies context and does not become the design result.
- `rsp-verify` owns one declared read-only evidence boundary. A Change uses its WorkRef and declared `Verify` boundary; a Group uses its Group reference and a named `Integration:` condition from the Group Brief's `Completion Conditions`, while child evidence remains attached to each child WorkRef. An explicit request may supply a temporary boundary for an in-progress pass, but it must be written back before Group closeout.
- `rsp-review` owns a fixed-scope report for the selected WorkOwner. A Group review includes its Brief and direct child Changes.
- `rsp-manage` coordinates a selected Change or Group when genuine coordination, recovery, independent acceptance, lifecycle, review convergence, or multi-phase obligations exist.
- `rsp-commit` owns exact local commit creation. Remote delivery, publication, deployment, approval, and cross-branch integration remain separately authorized.

## Composition

- One Skill owns one bounded capability. Core may route to one Discipline or optional Manage. Manage may delegate bounded tasks while retaining the selected goal and acceptance.
- Published Skills are standalone and never require another installed Skill, a runtime glossary, repository Specs, generated indexes, research data, or hidden runtime state.
- Detailed low-frequency procedures are conditionally loaded from the owning Skill. Shared composition loads only the context required by the current phase.
- Skills exchange only the smallest phase-relevant identity, authority, result, and evidence. Phase-specific fields remain with the owning Skill.
- Execution-environment selection, preparation, isolation, landing, and cleanup belong to the Host or Git boundary.
- Commit delivery receives a WorkOwner reference when a durable owner exists and separately receives included child WorkRefs. Direct, integration, and release delivery kinds may have no durable WorkOwner.

## Control boundaries

- Core selects the current WorkOwner and routes to Shape, one Discipline, Manage, or a stop. It derives this route; it does not persist it.
- Manage is optional. It is selected for real coordination obligations, not for every Change or every multiple-file edit.
- Manage retains selected-goal coordination and acceptance. A worker receives one bounded assignment and never becomes the owner of the managed goal.
- Dispatch is independent from Manage selection. A selected goal may use a local Discipline, a preferred worker, or a required worker boundary. Manage derives a transient execution strategy from dependencies, mutation boundaries, verification resources, and host capability. Independent Group children and independent tasks within one Change may run concurrently; shared writers, generated artifacts, and conflicting verification resources remain sequential unless the host proves safe isolation.
- A ready single Change may use one delegated worker for implementation and ordinary verification when host context isolation, compatible continuation, or multiple execution phases is a real coordination obligation. One-worker delegation is one optional strategy and does not restrict the Change from using `parallel-wave` with multiple workers for independent tasks. Same-worker evidence can establish `evidence-complete`; independent Verify requires distinct worker evidence.
- A delegated Discipline owns its result. Each Discipline returns its own result and decisive evidence. Manage validates paths, diff, verification, omissions, scope, and authority before accepting the result.
- Stops identify the missing owner, input, evidence, or resume condition. A stop prevents further mutation, delivery, lifecycle closeout, publication, approval, or acceptance claims until the condition is satisfied.
- Acceptance and closeout are derived gates. Host completion, transport validity, worker claims, or absence of an error do not prove acceptance.
- Hosts own worker execution, identity, continuation, cancellation, isolation, concurrency, lifecycle capabilities, and lifecycle observations. Evaluators and adapters own machine schemas and provider scoring.
- Internal evaluation formats are implementation details and never become published Skill or durable Spec dependencies.
- Core may summarize the current WorkOwner and phase in an optional response-only summary. It is not durable workflow state or a universal inter-Skill protocol.

## Boundaries

- Control transfer is a Core-to-Discipline or Core-to-Manage decision. Delegation is a Manage-to-worker assignment.
- Worker identity, session, invocation, topology, event history, and resource release are host observations, not RSP durable state.
- Required independent verification needs evidence of distinct workers from the available host boundary; a worker claim alone is insufficient.

## Constraints

- Keep route, dispatch, strategy, lane result, acceptance, and closeout phase-local.
- Execution strategy and worker participation remain transient; RSP records no schedule or concurrency state.
- Do not turn a Skill into a second workflow state store or a universal protocol owner.
- Do not persist a controller, run, receipt, lease, worker registry, event ledger, or runtime transport. Manage defines no universal worker receipt schema.
