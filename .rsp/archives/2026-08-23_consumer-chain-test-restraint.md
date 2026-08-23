---
kind: "fix"
---

# Change: consumer-chain-test-restraint

## Proposal
- Outcome: Make `rsp-implement` reject consumer tests that merely re-prove an already-owned forwarding hop instead of reaching the requested observable consequence.
- Why:
  - A 2026-08-23 provider run added the page action but kept the existing preload message assertion, so task, compliance, and boundary checks passed while the requested production-chain behavior remained untested.
- Scope:
  - Clarify permanent-test admission and retention in `rsp-implement`, update the frozen product composition identity, and add deterministic Skill contract coverage.
- Non-goals:
  - Mandating end-to-end tests for every change, duplicating downstream owner tests, or prescribing one assertion syntax.

## Spec
### ADDED
- Requirement: When downstream adapters or forwarding hops are already owned and covered, a consumer behavior test must exercise through them to the requested observable consequence.
  - A nearest-spy, message, constant, or forwarding assertion that only re-proves the existing hop is insufficient even when placed in an existing test file.

### Acceptance
#### Scenario: Page action uses an already-covered bridge
- GIVEN channel, preload, and main forwarding already have owners and coverage
- WHEN a page-owned action is added
- THEN its retained test exercises the action through the existing chain to the observable close outcome without adding or re-proving forwarding-hop tests

## Design
- Approach:
  - Add one concise consumer-chain rule beside the existing permanent-test admission and retention rules.
- Boundaries:
  - Keep tests proportionate; require chain-through evidence only when the requested consequence and existing downstream ownership are known.
- Affected areas:
  - Authored `rsp-implement` Skill, frozen beta product identity, and deterministic contract tests.
- Constraints:
  - Edit `skills/rsp-implement/`, not the `.agents/` projection; update the Skill content version for the behavioral revision.

## Tasks
- [x] Revise the consumer-chain test admission and retention contract.
- [x] Add deterministic contract coverage and run Skill/package verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/rsp-implement-skill-contract.test.ts` — passed 1 file / 5 tests; proves nearest-hop reassertion is rejected and observable consequence coverage is required.
  - [x] Focused Skill, beta, and provider-comparison contracts — passed 3 files / 62 tests; prove the updated composition identity and comparison owners remain coherent.
  - [x] `mise exec -- pnpm run skills:security-check` — passed 38 files with 0 findings; proves the published Skill delta adds no security finding.
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` — passed lint, build, 88 test files, and 872 tests; prove package compatibility.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors and 0 warnings; prove structural convergence.
### Optional
- Manual or environment:
  - [ ] Fresh short provider behavior campaign under the updated Skill composition.
- Coverage:
  - The shared-channel scenario is the decisive pressure case; remaining short scenarios confirm no regressions.

## Blockers
- none

## Durable Decisions
- Current facts: No Spec update is needed; the versioned published `rsp-implement` Skill is the durable behavior owner, and the beta plan pins its exact composition.
- Lasting rationale: No Decision Record is needed; this tightens an existing permanent-test admission boundary without changing workflow ownership.
