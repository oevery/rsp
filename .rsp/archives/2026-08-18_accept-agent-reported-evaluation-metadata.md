---
kind: "fix"
---

# Change: accept-agent-reported-evaluation-metadata

## Proposal
- Outcome: Let `skill-candidate-evaluation managed-runs` consume current `agent_reported` producer metadata while retaining exact compatibility with legacy top-level receipt metadata.
- Why:
  - `managed-controller-eval` now separates producer claims under `agent_reported`, but the comparison adapter still requires legacy top-level `evaluation_receipt` and `receipt_observations`.
  - Fresh managed evaluations therefore require an ad hoc projection before the repository evaluator can compare them.
- Scope:
  - Normalize either supported metadata shape into the existing validated receipt and observability contract.
  - Reproject observability from current run facts and producer observations when the new shape is used.
  - Preserve legacy retained evidence and the existing candidate manifest and comparison schemas.
- Non-goals:
  - No new receipt schema, metadata state, producer claim, evaluation dimension, or promotion authority.
  - No rewrite of historical retained evidence and no provider/model evaluation.

## Spec
### MODIFIED
- Requirement: managed-run comparison accepts both repository-owned metadata generations.
  - New metadata uses `agent_reported.evaluation_receipt` and `agent_reported.observations`; legacy metadata continues to use the top-level fields.
  - Both paths validate the same receipt hash, composition, case, contract, observability binding, and exact candidate comparison contract.
  - Conflicting mixed metadata fails closed rather than selecting one silently.

### Acceptance
#### Scenario: compare current producer output
- GIVEN current and candidate metadata from `managed-controller-eval` with structured claims under `agent_reported`
- WHEN `skill-candidate-evaluation managed-runs` compares them
- THEN it validates and projects both runs without a temporary adapter and returns the unchanged candidate result schema

#### Scenario: retain legacy evidence compatibility
- GIVEN retained metadata with populated top-level receipt fields
- WHEN the same adapter loads it
- THEN existing validation and comparison behavior remains unchanged

#### Scenario: reject ambiguous metadata
- GIVEN both metadata generations are populated with conflicting receipt evidence
- WHEN the adapter loads the run
- THEN it fails closed with a precise metadata conflict

## Design
- Approach:
  - Add one internal metadata normalization seam before `boundObservationFromManagedRun`.
  - For `agent_reported`, validate the producer receipt and project the existing observability dimensions from run result, output, paths, usage, and receipt observations; preserve host observations when present.
  - Keep the existing legacy path byte-compatible in semantics.
- Boundaries:
  - `managed-controller-eval` remains the producer owner; `skill-candidate-evaluation` owns comparison input normalization and validation.
  - Producer claims remain distinct from host observations, and normalization grants no acceptance or publication authority.
- Affected areas:
  - `scripts/skill-candidate-evaluation.mjs` and its declaration.
  - `test/skill-candidate-evaluation.test.ts`.
- Constraints:
  - Reuse `projectSkillEvaluationObservability`, `validateSkillEvaluationReceipt`, and `hashSkillEvaluationValue`.
  - Do not add a compatibility flag or persist normalized metadata.

## Tasks
- [x] Add fail-closed normalization for current and legacy managed-run metadata.
- [x] Add focused tests for new-shape success, legacy compatibility, and conflicting mixed metadata.
- [x] Run focused checks and record final evidence.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/global-setup.test.ts test/skill-candidate-evaluation.test.ts test/skill-evaluation-observability.test.ts test/managed-controller-beta-contract.test.ts --reporter=dot` — passed 4 files / 34 tests; proves both metadata generations share the existing validated comparison contract and legacy beta evidence remains readable.
  - [x] Direct `managed-runs` replay of the completed `combo/gpt-5.6-sol` current `2318b39b79d392384d4a0ed501363dbcffbef801a48bcbeb014961ab0dd71676` and candidate `47ba02bd327bd9bc7614ce79fda7111f3002246cf68fc383a7168715f217e1a9` metadata — returned `candidate-eligible` without temporary projection; all four dimensions passed with no regression, candidate failure, or missing evidence.
  - [x] Final `mise exec -- pnpm run skills:security-check` plus `mise exec -- pnpm run release:check` — security scanned 40 files with zero findings; metadata, docs, build, typecheck, lint, 75 test files / 832 tests, and clean-install package validation passed with SHA-256 `915bfb9e73c7c36634e4812642dcedcef09d0817988a935560a4f714decf49dc`.
### Optional
- Manual or environment:
  - [x] None required; this is deterministic metadata normalization.
- Coverage:
  - Preserve exact failure behavior for missing, malformed, hash-mismatched, and observability-mismatched evidence.

## Blockers
- none

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: none; producer and adapter code remain the executable owners
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none; this restores composition between existing repository contracts
- Archive ready: yes
