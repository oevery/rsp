---
kind: "refactor"
---

# Change: skill-context-optimization/review-progressive-disclosure

## Proposal
- Outcome: Code-only and document-only Review load only their applicable detailed pipeline while mixed Review retains both.
- Why:
  - The current Review Skill classifies scope but eagerly carries both detailed pipelines.
- Scope:
  - Keep fixed scope, authority, classification, shared Finding gates, report schema, verdict semantics, and mutation refusal eager.
  - Move Code and Document inspection procedures into package-local conditional references.
- Non-goals:
  - Changing severity, verdict values, fixed comparison semantics, or Review/Resolve Findings separation.

## Spec
### MODIFIED
- Requirement: Review loads detailed pipelines after applicability is derived from the fixed reviewed artifacts.
  - Code-only loads Code guidance, document-only loads Document guidance, and mixed loads both.
  - Authority-only artifacts do not make a pipeline applicable.

### Acceptance
#### Scenario: Code-only fixed review
- GIVEN a fixed reviewed set containing Code artifacts and only authority-only documents
- WHEN Review classifies applicability
- THEN it reads the Code pipeline, keeps Document `skipped`, and does not load the detailed Document procedure

## Design
- Approach:
  - Add explicit conditional links immediately after applicability classification.
  - Keep shared production-chain and Finding evidence requirements in the smallest single owner.
- Boundaries:
  - Resolve Findings and Structural Audit remain separate Skills.
- Affected areas:
  - `skills/rsp-review/SKILL.md`
  - `skills/rsp-review/references/`
  - Review contract and behavior fixtures
- Constraints:
  - The independently installed Review package must contain every referenced file.

## Tasks
- [x] Extract Code and Document procedures with exact load guards.
- [x] Update portability and Review contracts.
- [x] Measure code-only, document-only, and mixed loaded paths.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/skill-behavior.test.ts test/daily-workflow-depth.test.ts test/artifact-continuation-contract.test.ts --reporter=dot --no-file-parallelism` — 4 files and 36 tests passed; proves Review portability, behavior fixtures, fixed-scope routing, and response-language boundaries.
  - [x] `mise exec -- pnpm exec eslint test/skill-contract.test.ts` — scoped lint passed.
  - [x] `git diff --check` — tracked diff has no whitespace errors.
- Manual or environment:
  - [x] Inspect conditional links and loaded-path measurements — eager Review fell from 1192 to 749 words (443 fewer, 37.2%); Code-only loads 1062 words, Document-only 949, and mixed 1262.
- Coverage:
  - Deterministic behavior fixtures remained decisive; provider execution remains optional evidence.

## Blockers
- requires `skill-context-optimization/manage-progressive-disclosure`: apply the same proven conditional-loading pattern after Manage.
