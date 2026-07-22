---
kind: "feature"
---

# Change: rsp-native-design-and-artifacts/strengthen-artifact-continuation

## Proposal
- Summary: Make durable artifact writing, bounded continuation, and safe Git-conflict fallback explicit RSP-native behavior.
- Why:
  - RSP owns durable routing but execution Skills can currently finish without an equally explicit writeback/continuation contract, encouraging dependence on external document and handoff Skills.
- Scope:
  - Define one artifact-routing matrix for planned design, current facts, lasting rationale, stable scoped instructions/context, and temporary continuation.
  - Require execution Skills to return the same compact recoverable continuation fields when work remains.
  - Add a compact model fallback for conflicts encountered during authorized RSP implementation.
- Non-goals:
  - Claiming ownership of project `AGENTS.md`/`CONTEXT.md`, automatically generating Decision Records, or persisting hidden handoff/controller state.
  - Publishing a general documentation or merge-conflict Skill, continuing Git operations, committing, pushing, or resolving unrelated conflicts.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: every completed or interrupted RSP execution makes artifact routing and continuation explicit.
  - Planned future design remains in the selected Change; implemented stable facts route to the smallest correct Spec or project-owned context/instruction only under authority; lasting rationale routes independently to the authoritative Decision Record path.
  - Temporary state returns as a compact artifact-scoped continuation containing WorkRef, authority pointers, current state, changed artifacts, fresh verification, blockers, and smallest next action; it is not durable truth and is written to a file only when explicitly authorized.
  - When an active Git conflict intersects authorized implementation, the fallback inspects operation state and base/ours/theirs semantics, preserves unrelated work, resolves only evidenced in-scope conflicts, reruns affected checks, and stops before Git continuation or commit without separate authority.

### Acceptance
#### Scenario: completed implementation changes durable architecture
- GIVEN a selected Change is implemented and verified and its resulting module boundary is now a stable current fact
- WHEN Core performs the pre-archive durable decision
- THEN the current fact is written once to the smallest authoritative target under explicit authority
- AND any lasting rationale decision is judged independently rather than duplicated into the same document

#### Scenario: interrupted execution resumes safely
- GIVEN an execution Skill stops with accepted mutations and remaining work
- WHEN it returns a continuation and another session resumes it
- THEN the continuation points to existing owners, requires fresh drift/verification inspection, and does not become a second state store

#### Scenario: conflict exceeds the WorkRef
- GIVEN an active merge or rebase conflict includes unrelated user work or an unresolved product decision
- WHEN authorized implementation encounters it
- THEN the compact fallback stops with the exact conflict and required owner input
- AND does not choose a side, continue the Git operation, or infer commit authority

## Design
- Approach:
  - Put canonical routing and compact fallback semantics in `rsp` Core/fallback rules, then have execution Skills return the shared semantic fields without duplicating long prose.
  - Preserve capability-local detail only where mutation and recovery behavior differs.
- Affected areas:
  - `skills/rsp/`, `rules/rsp-rules.md`
  - `skills/rsp-implement/`, `skills/rsp-diagnose/`, `skills/rsp-tdd/`, `skills/rsp-address-review/`
  - behavior/restraint fixtures and documentation
- Constraints:
  - Keep `CONTEXT.md` and `AGENTS.md` project-owned, retain two-axis durable judgment, and never write planned state into current-truth owners.
  - Reimplement compact handoff and conflict mechanics independently; do not add Matt or Superpowers runtime dependencies.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Implement canonical artifact routing and compact continuation/fallback contracts
- [x] Add focused behavior and restraint coverage
- [x] Run focused validation and record fresh evidence

## Verify
- Automated:
  - [x] `mise exec -- pnpm run lint` and focused Skill contract tests
    - Observed 2026-07-22: lint and all focused artifact-continuation/Core/execution Skill contracts passed; the package intentionally has no separate `validate:skills` script.
  - [x] `mise exec -- pnpm exec vitest run test/artifact-continuation-contract.test.ts test/rsp-core-routing-contract.test.ts test/rsp-implement-skill-contract.test.ts test/rsp-diagnose-skill-contract.test.ts test/rsp-tdd-skill-contract.test.ts test/rsp-address-review-contract.test.ts` (19 tests passed)
- Manual:
  - [x] Inspect completed, interrupted, and conflict-blocked contracts for single-owner routing and absence of inferred Git authority.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`: the artifact-routing and continuation contract is a stable RSP product fact for the group-level durable review; no project-owned instruction update is needed
  - [x] Stable artifact ownership and continuation facts were written to `.rsp/specs/design.md`, README documentation, and the reconciled Skill System model.

## Blockers
- none
