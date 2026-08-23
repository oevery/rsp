---
kind: "refactor"
---

# Change: skill-context-optimization-followup/semantic-contracts

## Proposal
- Outcome: Skill contract tests protect semantic protocol and observable behavior without coupling acceptance to replaceable wording.
- Why:
  - Wording-only edits and progressive-disclosure moves currently create low-value test churn.
- Scope:
  - Convert high-amplification prose assertions into structural checks for headings, links, canonical values, ownership, and forbidden authority.
- Non-goals:
  - Changing Skill behavior, routing policy, public inventory, or provider fixtures.

## Spec
### MODIFIED
- Requirement: Equivalent wording or a correctly owned conditional reference must not fail tests, while removal of a route, owner, stop, authority denial, or portability contract must fail.

### Acceptance
#### Scenario: Semantic-preserving wording change
- GIVEN canonical values, ownership, negative authority, and behavior fixtures remain unchanged
- WHEN explanatory prose is rewritten or moved to an explicitly triggered owned reference
- THEN focused contracts remain valid and representative negative mutations still fail

## Design
- Approach:
  - Add small Markdown extraction helpers and retain exact assertions only for stable protocol tokens and critical negative constraints.
- Boundaries:
  - Do not weaken behavior tests, independent-installation checks, or provider acceptance.
- Affected areas:
  - `test/skills/rsp-core-routing-contract.test.ts` and `test/skills/skill-runtime-context-contract.test.ts`
  - `test/evaluation/managed-controller-contract.test.ts`
- Constraints:
  - Keep probes focused and avoid duplicating implementation-detail tests.

## Tasks
- [x] Measure wording-coupled assertions and identify the smallest conversion set.
- [x] Implement structural assertions and representative negative mutations.
- [x] Run focused contracts, lint, build, and serial repository tests.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/rsp-core-routing-contract.test.ts test/skills/skill-runtime-context-contract.test.ts test/evaluation/managed-controller-contract.test.ts --reporter=dot --no-file-parallelism` — passed 3 files / 31 tests; semantic units, canonical values, owners, negative authority, stops, portability, evaluator transport, and representative weakened-contract mutations behave as required.
  - [x] `mise exec -- pnpm run build` — passed.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run test -- --no-file-parallelism` — passed 88 files / 873 tests; proves serial repository compatibility without `dist` competition.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — passed the integrated post-review suite, 89 files / 880 tests.
  - [x] `git diff --check` — passed after final durable writeback.
### Optional
- Manual or environment:
  - [x] Compared direct `.toContain(...)` / `findSemanticUnit(...)` inventory in the three target tests: 66 before, 14 after; remaining exact checks protect stable paths, machine fields, canonical tokens, or forbidden protocol entities rather than replaceable Skill sentences.
- Coverage:
  - No product Skill prose changes in this child.

## Blockers
- none
