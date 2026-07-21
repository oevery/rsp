---
kind: "feature"
---

# Change: engineering-disciplines/add-rsp-tdd

## Proposal
- Summary: Publish a concise host-neutral `rsp-tdd` Skill that produces observed red-green-refactor evidence for one selected Change.
- Why:
  - The current suite can route test-first work but has only a minimal fallback and no demonstrated standalone TDD capability.
- Scope:
  - Define the smallest portable TDD sequence, evidence gates, stop conditions, return contract, tests, and forward evaluation needed for predictable execution.
- Non-goals:
  - Teaching generic testing theory, owning diagnosis, review, Git delivery, controller retries, or framework-specific test patterns.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: `rsp-tdd` turns one clear testable behavior into observed red, minimal green, safe refactor, and fresh Change verification evidence.
  - Red must fail for the expected behavioral reason rather than syntax, environment, or unrelated baseline failure.
  - Unclear behavior, unexplained failures, missing authority, or unavailable execution must stop with one returned owner and next action.

### Acceptance
#### Scenario: one behavior is implemented test-first
- GIVEN one selected ready Change with clear testable behavior and mutation authority
- WHEN `rsp-tdd` executes the smallest focused cycle
- THEN it records observed red, minimal green, any safe refactor, fresh required checks, and returns the result to the same Change without review or delivery claims

## Design
- Approach:
  - Use a compact main Skill with strong RED, GREEN, and REFACTOR leading words; add a reference only if a measured conditional branch needs it.
- Affected areas:
  - `skills/rsp-tdd/`
  - focused contract and behavior fixtures under `test/`
  - package documentation and stable design facts after promotion
- Constraints:
  - Keep the canonical body concise and host-neutral; rely on model knowledge for generic testing guidance and encode only behavior-changing RSP discipline.

## Tasks
- [x] Create and validate the concise canonical `rsp-tdd` Skill.
- [x] Add contract and forward behavior evidence for red, green, refactor, stops, restraint, and return ownership.
- [x] Verify the result; defer shared durable model/spec promotion to the terminal composition slice.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-tdd-skill-contract.test.ts test/rsp-tdd-behavior.test.ts` — 2 files and 4 tests passed.
  - [x] `mise exec -- pnpm exec eslint skills/rsp-tdd/SKILL.md test/rsp-tdd-skill-contract.test.ts test/rsp-tdd-behavior.test.ts` — passed.
  - [x] `node dist/cli.mjs check --focused` — all three focused engineering-discipline Changes valid.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed after shared routing integration; 18 test files and 287 tests passed.
- Manual:
  - [x] Fresh isolated `gpt-5.6-terra`/low run observed test-only RED before the minimum production mutation, reached GREEN, skipped unjustified REFACTOR, returned to the same Change, and performed no delivery action; retained report: `research/evaluations/rsp-tdd/2026-07-21/report.md`.
- Durable updates:
  - [x] No slice-local durable update: the terminal composition Change owns the shared suite model/spec promotion after both disciplines pass.

## Blockers
- none
