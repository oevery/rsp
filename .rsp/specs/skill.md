# Skill

## Purpose

Define Skill capability ownership, composition, routing, delegation, control boundaries, and progressive disclosure.

## Capability ownership

- The default suite contains `rsp`, `rsp-shape`, `rsp-implement`, `rsp-doc`, `rsp-verify`, `rsp-review`, `rsp-commit`, and `rsp-release-docs`.
- `rsp-structural-audit` is an optional report-only Discovery Skill. Installation does not grant mutation, lifecycle, Git, publication, approval, or human-acceptance authority.
- `rsp-doc` owns authorized repository-document and Skill writing through conditional artifact methods. It accepts bounded direct requests or preserves a tracked WorkRef under project instructions. Read-only review, product decisions and release notes retain their owners; tiny edits need no Doc phase. Default installation is not unconditional invocation.
- `rsp` owns project entry, current-action routing, durable-artifact routing, ordinary authorized continuity, and conditional coordination. Routine work need not invent a tracked Change. Entrypoint branch selection precedes loading detailed guidance; same-owner/scope/authority method switches and repairable failures remain with the responsible capability without another user continuation request. Return to Core only on completed responsibility, changed goal/owner/scope/authority, necessary cross-capability independent acceptance, or an evidenced blocker that cannot be resolved in scope.
- `rsp-shape` owns clarification and ready-owner planning, plus a bounded read-only design question without requiring a WorkRef. Design-only advice neither mutates product nor automatically creates or changes a plan. Separately authorized planned design updates only the selected Change; a Group Brief supplies context, not the design result.
- `rsp-implement` owns bounded implementation and ordinary fresh checks. Diagnosis-only investigates read-only and returns evidence; an authorized fix proceeds from confirmed cause within the same scope and authority. Test-first RED requires explicit instruction or concrete risk. Fixed findings receive individual accepted/rejected/needs-clarification dispositions, bounded correction, fresh checks, and separate read-only re-review. Implement never certifies itself review-clean.
- `rsp-verify` owns one declared read-only evidence boundary, not every ordinary implementation check. A Change uses its WorkRef and declared `Verify` boundary; a Group uses its Group reference and a named `Integration:` condition from the Group Brief's `Completion Conditions`, while child evidence remains attached to each child WorkRef. A request-only boundary is temporary and must be written back before Group closeout. Required independent acceptance needs host-observed distinct-worker evidence.
- `rsp-review` owns a fixed-scope report for the selected WorkOwner. A Group review includes its Brief and direct child Changes.
- Core uses an internal conditional coordination branch for a selected Change or Group when genuine coupled slices, recovery, independent acceptance, shared resources, delivery coordination, or lifecycle obligations exist under effective `manage.activation`. This is not another control owner. Selection does not imply worker delegation; a Skill boundary is not a worker boundary. Missing required independent-worker capability leaves acceptance incomplete.
- `rsp-commit` owns exact local commit creation. Remote delivery, publication, deployment, approval, and cross-branch integration remain separately authorized.

## Composition

- One Skill owns one bounded capability. Core continues ordinary authorized work through proportionate checks and necessary writeback without automatic archive or commit. A separately qualified coordination branch may delegate bounded tasks while retaining the selected goal and acceptance.
- Published Skills are standalone and never require another installed Skill, a runtime glossary, repository Specs, generated indexes, research data, or hidden runtime state.
- Doc and Review carry standalone projections of the [writing-quality contract](writing-quality.md). Their shared cases check writer/reviewer agreement without a runtime cross-package dependency.
- Core detects legacy context during ordinary entry and loads a separate context-migration reference only for a detected map or explicit migration request. Detection permits inspection, not mutation. The branch owns source/target reconciliation and retirement gates; Doc supplies authorized writing, and unrelated work need not wait for migration. No new Skill or persisted migration state is required.
- Entrypoints keep authority and preservation rules always available and select branches before loading low-frequency procedures; shared composition loads only the context required by the current action.
- Skills exchange only the smallest phase-relevant identity, authority, result, and evidence. Phase-specific fields remain with the owning Skill.
- Execution-environment selection, preparation, isolation, landing, and cleanup belong to the Host or Git boundary.
- Commit delivery receives a WorkOwner reference when a durable owner exists and separately receives included child WorkRefs. Direct, integration, and release delivery kinds may have no durable WorkOwner.

## Writing quality

[Writing quality](writing-quality.md) owns factual, language, expression, artifact-role and review requirements. Skill creation/revision uses Doc’s conditional Skill method; executable Skills remain Code review artifacts.

## Control boundaries

- Core selects the current WorkOwner when durable ownership is required and routes to Shape, a Discipline, its own conditional coordination branch, or a stop. It derives this route; it does not persist it.
- Coordination is selected for real obligations, not for every Change, multiple-file edit, or ordinary continuous implementation. Existing `manage.activation` and `manage.closeout` keys, values, defaults, and compatibility semantics remain unchanged. Only a genuinely qualified and selected coordination branch considers its closeout ceiling, subject to fresh lifecycle/Git authority and gates; ordinary flow gains no closeout permission from configuration.
- Core retains selected-goal coordination and acceptance in its coordination branch. A worker receives one bounded assignment and never becomes owner of the coordinated goal.
- Coordination selection and host worker dispatch are separate decisions. Core may execute locally or request a preferred or required real worker; it derives a transient strategy from dependencies, mutation boundaries, verification resources, and host capability. Independent Group children and independent tasks within one Change may run concurrently; shared writers, generated artifacts, and conflicting verification resources remain sequential unless the host proves safe isolation.
- A ready single Change may use a delegated worker when host context isolation or compatible continuation is a real coordination obligation. Delegation is optional; parallel workers require independent boundaries and host-proven safe parallelism. Same-worker checks can establish ordinary evidence, never required independent Verify.
- A delegated Discipline owns its result and decisive evidence. Coordination validates paths, diff, verification, omissions, scope, and authority before accepting the result.
- Stops identify the missing owner, input, evidence, or resume condition. A stop prevents further mutation, delivery, lifecycle closeout, publication, approval, or acceptance claims until the condition is satisfied.
- Acceptance and closeout are derived gates. Host completion, transport validity, worker claims, or absence of an error do not prove acceptance.
- Hosts own worker execution, identity, continuation, cancellation, isolation, concurrency, lifecycle capabilities, and lifecycle observations. Evaluators and adapters own machine schemas and provider scoring.
- Internal evaluation formats are implementation details and never become published Skill or durable Spec dependencies.
- Core may summarize the current WorkOwner and phase in an optional response-only summary. It is not durable workflow state or a universal inter-Skill protocol.

## Boundaries

- Core-to-Discipline routing passes one bounded responsibility. Entering Core's coordination branch is internal selection, not control transfer to another controller; worker delegation crosses a real host boundary. Ordinary same-owner method changes require neither Core return nor another worker.
- Worker identity, session, invocation, topology, event history, and resource release are host observations, not RSP durable state.
- Required independent verification needs evidence of distinct workers from the available host boundary; a worker claim alone is insufficient.

## Constraints

- Keep route, dispatch, strategy, lane result, acceptance, and closeout phase-local.
- Execution strategy and worker participation remain transient; RSP records no schedule or concurrency state.
- Do not turn a Skill into a second workflow state store or a universal protocol owner.
- Do not persist a controller, run, receipt, lease, worker registry, event ledger, or runtime transport. Core's conditional coordination defines no universal worker receipt schema.
