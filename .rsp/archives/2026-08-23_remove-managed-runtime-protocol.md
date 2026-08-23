---
kind: "refactor"
---

# Change: remove-managed-runtime-protocol

## Proposal
- Outcome: Keep managed delegation semantic while moving runtime and evaluator protocols out of RSP
- Why:
  - The current managed contract models host sessions, invocations, admission, settlement, release, correlation, and structured transport inside published Skill and durable Spec vocabulary.
  - Workers are required to report host- and Manager-owned facts, increasing prompt weight and role confusion without strengthening acceptance.
- Scope:
  - Reduce `rsp-manage` delegation to bounded assignments, Discipline-owned results, Manager validation, and fail-closed required-worker acceptance.
  - Remove host runtime entities and machine transport schemas from published Skills, fallback rules, and durable RSP control vocabulary.
  - Keep provider/evaluation structure as a lightweight evaluator-owned protocol that observes host facts separately from worker results.
  - Update deterministic semantic fixtures and tests to protect the simplified ownership boundary.
- Non-goals:
  - Changing direct-versus-managed qualification, user-visible `solo | delegated | coordinated` modes, internal topology selection, review convergence, closeout authority, or publication behavior.
  - Defining a cross-host worker runtime API, persisted scheduler, session store, event ledger, or public compatibility protocol.
  - Re-running the full provider release matrix as part of implementation verification.

## Spec
### MODIFIED
- Requirement: Managed delegation remains semantic and host-neutral.
  - Each delegated lane receives a compact objective, WorkRef, authority, read/write/verify boundaries, prohibited actions, stop conditions, and applicable replay caution.
  - The delegated Discipline owns its result; Manage adds no second universal worker receipt schema.
  - A required worker result must be worker-authored, within authority, and validated against actual paths, diff, and verification before acceptance.
- Requirement: Runtime and machine transport remain outside RSP product semantics.
  - Worker identity, sessions, invocations, admission, waiting, cancellation, settlement, release, isolation, and concurrency are host observations when available, not RSP domain objects or worker claims.
  - JSON prefixes, schema versions, correlation identities, field typing, parsing, and provider scoring are evaluator or adapter implementation details.
  - Missing required delegation or a missing valid worker-authored result fails closed; host completion or Manager reconstruction never substitutes for it.

### Acceptance
#### Scenario: Ordinary managed delegation stays compact
- GIVEN Manage delegates a Fix or Verify lane
- WHEN it composes the worker task and consumes the result
- THEN the worker receives only the bounded task contract, returns the Discipline-owned result, and is not asked to report runtime identity, release, independence, evidence validity, or acceptance

#### Scenario: Required delegation still fails closed
- GIVEN a managed acceptance boundary requires a worker or independent verifier
- WHEN no attributable worker-authored result or required host evidence is available
- THEN Manage keeps acceptance incomplete and does not substitute its own work or reconstructed receipt

#### Scenario: Evaluation protocol remains internal
- GIVEN the provider evaluator needs machine-readable worker evidence
- WHEN it extracts and scores a run
- THEN its minimal schema and correlation stay owned by the evaluator and are not copied into published RSP Skill instructions

## Design
- Approach:
  - Replace formal `Assignment`, `WorkerReceipt`, and accepted-evidence object models with plain bounded delegation and Discipline-owned results.
  - Express host dependencies as conditional observable facts required for a decision, without naming a portable host lifecycle state machine.
  - Keep the evaluator payload explicitly evaluator-owned and minimal, retain only result evidence supplied by the worker, and derive dispatch/lifecycle facts from host events.
- Boundaries:
  - Preserve user-visible execution modes and safe sequential/parallel selection, but treat topology as Manager reasoning rather than a host protocol.
  - Preserve cancellation caution and conflicting-resource safety as behavioral rules without leases, invocation identities, or release state transitions.
  - Preserve the prohibition on Manager-authored replacement results.
- Affected areas:
  - `.rsp/specs/skill-control-model.md`, `.rsp/specs/skill-system.md`, and `rules/rsp-rules.md`.
  - `skills/rsp`, `skills/rsp-manage`, managed Discipline integration text, and package tests.
  - The managed-controller evaluator, fixtures, and deterministic contract tests.
- Constraints:
  - Edit authored Skill sources rather than `.agents/skills/` projections.
  - Preserve unrelated dirty provider-comparison and readiness-separation work.
  - Do not accept pending upstream research, publish, archive, stage, or commit.

## Tasks
- [x] Remove runtime protocol entities and duplicated receipt ownership from durable Specs and published Skills.
- [x] Replace managed exchange and lifecycle procedures with compact delegation, validation, and host-fact boundaries.
- [x] Simplify evaluator-owned machine results and update semantic fixtures/tests.
- [x] Rebuild the CLI, refresh the self-hosted fallback, and run focused plus repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/skills/rsp-core-routing-contract.test.ts test/architecture/documentation-contract.test.ts` — passed; proves simplified Skill ownership and evaluator separation.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed; full suite: 87 files, 841 tests.
  - [x] `git diff --check`, deterministic managed-controller evaluation, and focused RSP validation — passed; 8/8 deterministic cases passed.
### Optional
- Manual or environment:
  - [ ] A fresh three-pair provider comparison may be run later under the release candidate; it is not required to complete this refactor.
- Coverage:
  - Deterministic tests own vocabulary, prompt composition, fail-closed acceptance, host-observation separation, evaluator result parsing, fixture containment, transport classification, and delivery-command detection.

## Durable Decisions
- Updated the existing control-model, Skill-system, design, core-model, and execution-environment decisions; no new Decision Record is needed.
- RSP durable semantics now stop at bounded delegation, Discipline-owned results, and Manager validation. Host execution/lifecycle and evaluator transport remain implementation-owned and transient.
- Historical evaluator vocabulary remains readable for retained evidence, but it is not a published RSP contract.

## Blockers
- none
