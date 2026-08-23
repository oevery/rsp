---
kind: "fix"
---

# Change: release-behavior-production-chain-contract

## Proposal
- Outcome: Make the shared-channel restraint holdout accept an observable end-to-end production-chain assertion instead of one internal message-array implementation.
- Why:
  - A 2026-08-23 candidate used the real page, preload, and main chain and asserted the final close result, but failed only because the fixture demanded a specific intermediate messages array.
- Scope:
  - Replace the narrow test-source fragment with page-action invocation and final-result assertions, retaining forbidden duplicate test paths.
- Non-goals:
  - Relaxing production behavior, permitting channel duplication, or changing the shared behavior harness.

## Spec
### ADDED
- Requirement: The holdout accepts tests that exercise the existing production chain and assert its observable close outcome.
  - It must still reject new tests that merely restate channel constants or forwarding hops.

### Acceptance
#### Scenario: Page action closes through the existing chain
- GIVEN existing preload and main forwarding owners
- WHEN `test.mjs` invokes `closeSidebar(bridge)` through those owners
- THEN it asserts one observable close without requiring an internal messages-array representation

## Design
- Approach:
  - Require the page action call plus final close-count assertion in the existing test.
- Boundaries:
  - Preserve source action and forbidden-path gates.
- Affected areas:
  - Shared-channel restraint holdout and focused release behavior tests.
- Constraints:
  - Only this scenario contract identity changes; other scenario evidence remains reusable.

## Tasks
- [x] Correct the production-chain test contract.
- [x] Add deterministic coverage and run repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts` — passed 1 file / 14 tests; proves the contract requires observable production behavior, not one intermediate representation.
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` — passed lint, build, 88 test files, and 872 tests; prove compatibility.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors and 0 warnings; prove structural convergence.
### Optional
- Manual or environment:
  - [ ] Targeted `shared-channel-test-restraint` provider rerun.
- Coverage:
  - The rerun proves one real model avoids duplicate low-value tests while covering the production chain.

## Blockers
- none

## Durable Decisions
- Current facts: No Spec update is needed; the fixture-local contract now matches its existing observable-production-chain requirement.
- Lasting rationale: No Decision Record is needed; this removes an implementation-detail test constraint while preserving behavior and restraint gates.
