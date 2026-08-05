---
kind: "refactor"
---

# Change: skill-context-optimization/semantic-contract-tests

## Proposal
- Outcome: Skill contract tests protect semantic ownership and observable behavior without requiring broad natural-language sentence preservation.
- Why:
  - Current Core and Manage contract tests contain many prose-presence assertions that amplify wording-only changes and progressive-disclosure moves.
- Scope:
  - Introduce focused helpers or structural assertions for canonical enums, required fields, reference ownership, and forbidden behavior.
  - Retain exact text assertions only for portable protocol tokens, critical negative constraints, and intentionally stable output contracts.
- Non-goals:
  - Changing any Skill behavior, routing policy, public inventory, or evaluation evidence.

## Spec
### MODIFIED
- Requirement: Contract tests distinguish semantic protocol from replaceable explanatory prose.
  - Ownership, enum membership, required schema fields, conditional references, and forbidden authority must remain directly testable.
  - Behavior fixtures and retained evaluations remain the evidence for routing and execution outcomes.

### Acceptance
#### Scenario: Equivalent Skill wording
- GIVEN a Skill preserves the same owner boundaries, canonical values, and behavioral fixtures
- WHEN explanatory prose is rewritten or moved to an owned conditional reference
- THEN focused contract tests can remain unchanged unless the actual protocol changes

## Design
- Approach:
  - Add small test helpers that extract headings, inline canonical values, links, and bounded sections.
  - Replace groups of sentence assertions with structural comparisons while retaining decisive negative assertions.
- Boundaries:
  - Do not weaken behavior fixtures, mutation refusal tests, package portability checks, or immutable evaluation hashes.
- Affected areas:
  - `test/managed-controller-contract.test.ts`
  - `test/rsp-core-routing-contract.test.ts`
  - `test/skill-runtime-context-contract.test.ts`
- Constraints:
  - A passing contract must still fail on removed enum members, reassigned owners, missing stop behavior, or widened authority.

## Tasks
- [x] Establish a measured assertion baseline and identify replaceable prose assertions.
- [x] Add structural helpers and convert the highest-amplification assertion groups.
- [x] Prove representative negative mutations still fail.

- [x] Resolve reopened concern: split semantic units at Markdown list-item boundaries and add a Fix-to-Verify owner-reassignment negative mutation.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-runtime-context-contract.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts --reporter=dot --no-file-parallelism` — 3 files and 87 tests passed; proves semantic routing and controller contracts remain enforced, including representative enum removal, owner reassignment, and stop-authority widening mutations.
  - [x] `mise exec -- pnpm exec eslint test/helpers/markdown-contract.ts test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts` — scoped lint passed.
  - [x] `git diff --check` — tracked diff has no whitespace errors.
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts --reporter=dot --no-file-parallelism` — fresh reopened correction run passed 3 files and 87 tests; the lane-owner reassignment mutation now fails the semantic contract.
- Manual or environment:
  - [x] Compare the remaining direct prose assertions with the starting baseline — direct `toContain` assertions across the three focused files decreased from 429 to 314 (115 fewer, 26.8%) while critical negative and stable protocol assertions remain.
- Coverage:
  - Contract structure only; no Skill prose changes in this child.

- [x] Verify reopened concern: list-item-local semantic matching no longer combines Fix and Verify ownership terms.

## Blockers
- none
