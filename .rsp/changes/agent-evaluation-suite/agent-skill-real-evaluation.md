---
kind: "feature"
---

# Change: agent-evaluation-suite/agent-skill-real-evaluation

## Proposal
- Outcome: Evaluate every published RSP Skill's selected behavior with task-shaped local journeys and host-observed behavioral contracts.
- Why:
  - Registry presence alone does not prove that each Skill triggers correctly, obeys its boundary, produces required artifacts, or reports omissions honestly.
- Scope:
  - Build a per-Skill scenario matrix covering trigger, selected-Skill compliance, required actions, forbidden actions, evidence, artifact surfaces, handoff, and recovery where applicable. Core WorkOwner selection and host worker dispatch are scored by sibling Changes.
  - Run the matrix through fake/local hosts first and emit foundation-compatible reports with per-Skill coverage and gaps.
- Non-goals:
  - Do not redefine foundation evidence, sanitization, scoring, or campaign semantics.
  - Do not own Core routing, worker lifecycle, real-project acceptance, or provider release gates.
  - Do not run a real provider under this Change.

## Spec
### ADDED
- Requirement: Every published Skill contract MUST have a contract-derived scenario matrix. For every applicable dimension, the matrix MUST include a positive trigger, a negative or near-miss trigger, required/forbidden boundary behavior, artifact and handoff behavior, and stop/recovery behavior; applicability MUST be recorded explicitly.
- Requirement: Each scenario MUST capture host trajectory and agent self-report separately and MUST classify planned, executed, skipped, unavailable, or unverified coverage.
- Requirement: Skill reports MUST identify missing required events, forbidden actions, route mismatches, artifact omissions, and handoff omissions without allowing AI analysis to override deterministic findings.

### Acceptance
#### Scenario: Published Skill inventory is exercised
- GIVEN the registry's published Skill inventory
- WHEN the Skill scenario campaign runs in local/fake mode
- THEN every Skill has its required matrix cases planned and the report identifies which cases were verified, skipped, unavailable, or unverified

#### Scenario: Skill behavior respects its contract
- GIVEN a Skill task with expected trigger, required evidence, forbidden actions, and artifact surfaces
- WHEN the host trajectory and AI analysis are projected
- THEN deterministic boundary failures remain hard failures and semantic findings cite known evidence IDs

#### Scenario: Skill omission and recovery are visible
- GIVEN a task that stops, loses an observation, or omits a required handoff
- WHEN the campaign report is generated or resumed
- THEN the report preserves the stop/omission and does not fabricate success or execution

## Design
- Approach:
  - Derive cases from each published Skill's trigger, authority, stop, return, and conditional-loading contract; keep cases small enough to isolate one behavior.
  - Reuse the foundation runner and aggregate one report without duplicating its scorer.
- Boundaries:
  - This Change owns Skill-specific case content and interpretation of Skill contracts; the host owns trajectory facts.
  - Real provider and real project acceptance remain outside this Change.
- Affected areas:
  - verification/evaluations/skill-behavior/; Skill scenario manifests; and verification/tests/evaluation/skill-real-evaluation.test.ts.
  - Foundation-compatible report and fixture adapters.
- Constraints:
  - Preserve existing Skill behavior and unrelated dirty changes.

## Tasks
- [x] Derive a contract-derived scenario matrix for every published Skill, including explicit applicability decisions.
- [x] Implement local host fixtures for trigger, boundary, artifact, handoff, and recovery cases.
- [x] Add per-Skill campaign execution, report projection, and exact resume coverage.
- [x] Add deterministic and AI-analysis contract tests for representative Skill failures and omissions.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/skill-real-evaluation.test.ts --no-file-parallelism — 2 tests passed; proves 13 published Skills × 5 required local cases (65 scenarios), including positive, negative, boundary, artifact/handoff, and recovery coverage with foundation-compatible findings.
  - [x] mise exec -- pnpm run typecheck — passed; scenario and report types remain consistent.
  - [x] git diff --check — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Review one report per Skill family — integrated local projection reviewed; trigger, boundary, omissions, and handoff remain separate.
- Coverage:
  - Real provider behavior and cross-provider comparisons remain unverified.

## Blockers
- none
