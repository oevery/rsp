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
- [ ] Create and validate the concise canonical `rsp-tdd` Skill.
- [ ] Add contract and forward behavior evidence for red, green, refactor, stops, restraint, and return ownership.
- [ ] Verify the result and update only required durable models/specs.

## Verify
- Automated:
  - [ ] Run focused portable contract and behavior tests selected by this slice.
  - [ ] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test`
- Manual:
  - [ ] Inspect a fresh-context run and confirm red fails for the expected reason before production mutation and no delivery action occurs.
- Durable updates:
  - [ ] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [ ] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
- none
