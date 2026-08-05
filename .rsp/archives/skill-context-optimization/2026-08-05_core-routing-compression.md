---
kind: "refactor"
---

# Change: skill-context-optimization/core-routing-compression

## Proposal
- Outcome: Core retains a smaller eager route/safety/output kernel while preserving every route, owner, stop, and fallback boundary.
- Why:
  - The high-frequency `Derive one next action` section carries overlapping definitions, routing steps, fallback detail, and output narration.
- Scope:
  - Consolidate route definitions and precedence into compact ordinary Markdown structure.
  - Remove repeated semantic ownership already guaranteed by conditionally loaded owners.
  - Evaluate existing and candidate symbol use against measured loaded-path cost.
- Non-goals:
  - Changing route enum membership, qualification policy, Discipline behavior, lifecycle authority, or introducing notation that requires a glossary.

## Spec
### MODIFIED
- Requirement: Core remains a complete independently usable routing kernel.
  - It keeps selection, ownership, safety, fallback existence, output, and dormant-closeout semantics eager.
  - Detailed branch procedures remain with their single owner.
  - Symbols are accepted only for closed locally understandable flows with measured benefit.

### Acceptance
#### Scenario: Common direct implementation route
- GIVEN one ready owner satisfying the complete small-work exclusion
- WHEN Core derives the next action
- THEN it selects `direct`, names the implementation owner and decisive check, and does not load managed execution detail

## Design
- Approach:
  - Use a compact route table or ordered mapping plus short invariant paragraphs.
  - Preserve canonical names and full negative authority constraints.
- Boundaries:
  - Do not move detailed WorkRef inference from Shape or selected execution from Manage back into Core.
- Affected areas:
  - `skills/rsp/SKILL.md`
  - Core routing and runtime-context contracts
  - `.rsp/specs/skill-system.md` only if the stable eager-kernel description changes
- Constraints:
  - A glossary, abbreviations such as `CO/RD/FD`, and mathematical permission notation are forbidden.

## Tasks
- [x] Compress route definitions and remove duplicated branch prose.
- [x] Measure Core and common Core-plus-Discipline paths.
- [x] Retain or remove each symbol based on local clarity and measured benefit.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts test/artifact-continuation-contract.test.ts test/managed-controller-contract.test.ts --reporter=dot --no-file-parallelism` — 4 files and 94 tests passed; proves routing, language, continuation, managed boundaries, and loaded-context contracts.
  - [x] `mise exec -- pnpm exec eslint test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts test/artifact-continuation-contract.test.ts test/managed-controller-contract.test.ts` — scoped lint passed.
  - [x] `mise exec -- pnpm run build` — package build passed.
  - [x] `mise exec -- pnpm run lint` — full repository lint passed.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — 55 files and 673 tests passed.
  - [x] `git diff --check` — tracked diff has no whitespace errors.
- Manual or environment:
  - [x] Compare final route prose and symbol inventory with the starting baseline — final Core is 2212 words versus 2298 initially (86 fewer, 3.7%); no new notation was introduced, and arrows remain limited to the closed Implement routing flow and Manage frontier precedence.
- Coverage:
  - Full build, lint, and serial tests passed; fixed-scope Group review remains.

## Blockers
- requires `skill-context-optimization/review-progressive-disclosure`: compress Core only after branch ownership and tests are stable.
