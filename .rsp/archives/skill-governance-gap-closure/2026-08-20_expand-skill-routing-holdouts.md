---
kind: "refactor"
---

# Change: skill-governance-gap-closure/expand-skill-routing-holdouts

## Proposal
- Outcome: Improve deterministic Skill routing confidence for the highest-conflict owner clusters using realistic positive, hard-negative, and pairwise holdouts.
- Why:
  - All published descriptions participate in collision checks, but focused holdout cases currently concentrate on four implementation/review owners and underrepresent adjacent Core, Manage, Shape, Design, Release Docs, and Commit boundaries.
- Scope:
  - Add cases for `rsp | rsp-manage | rsp-shape`, `rsp-design | rsp-implement`, and `rsp-release-docs | rsp-commit` conflict clusters.
  - Preserve the existing evaluator and minimum-cases-per-owner contract unless a focused test exposes a real harness gap.
  - Track the evaluator declaration required by TypeScript consumers so clean checkouts retain the tested interface.
- Non-goals:
  - No uniform case quota across all published Skills, frontmatter description rewrite, provider-trigger claim, or keyword-only examples.

## Spec
### MODIFIED
- Requirement: Selected high-conflict owners shall meet the existing minimum case count with realistic requests that exercise positive ownership, adjacent-owner rejection, and pairwise ambiguity.
- Requirement: Added prompts shall describe observable user intent without embedding Skill names or evaluator keywords solely to force a match.

### Acceptance
#### Scenario: Adjacent workflow owners remain distinct
- GIVEN a request could superficially resemble two adjacent RSP capabilities
- WHEN deterministic routing evaluates the holdout
- THEN the intended owner wins and the neighboring owner is rejected for the stated boundary

## Design
- Approach:
  - Extend `evaluation/skill-routing/cases.yaml` by owner cluster, using repository-native near misses derived from actual authority boundaries.
  - Prefer case-only changes; modify evaluator logic only if the current schema cannot express a required distinct holdout.
- Boundaries:
  - The routing evaluator remains lexical and deterministic; provider/host activation remains a separate evidence class.
- Affected areas:
  - `evaluation/skill-routing/cases.yaml`
  - `scripts/skill-routing-evaluation.d.mts`
  - `test/evaluation/skill-routing-evaluation.test.ts` only if aggregate assertions require adjustment
- Constraints:
  - Preserve `MINIMUM_CASES_PER_OWNER`, avoid obvious Skill-name leakage, and do not claim complete coverage of all 13 published Skills.

## Tasks
- [x] Audit current owner counts, terms, and failure diagnostics.
- [x] Add positive, hard-negative, and pairwise cases for the three selected conflict clusters.
- [x] Retain the evaluator's TypeScript declaration as a tracked production-test seam.
- [x] Run deterministic routing and focused contract tests; inspect failures for lexical gaming or true description ambiguity.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/skill-routing-evaluation.test.ts --no-file-parallelism` — 3 tests passed; 78 declared holdouts pass across 10 selected owners, including direct Shape/Manage pairwise cases; all 13 published descriptions remain collision-free and no description edit was required.
  - [x] `mise exec -- pnpm run typecheck` — passed with the tracked evaluator declaration, proving the clean-checkout TypeScript consumer seam is retained.
  - [x] `mise exec -- pnpm run release:acceptance` — passed on 2026-08-20: 9/9 stages, 86/86 test files, 860/860 tests, and packed installed-package workflows. Report: `.cache/release-acceptance/20260820T003524262Z-a8fc9ba4ff-36544/report.md`.
  - [x] Fixed-scope Code and Document review — clean; owner-cluster coverage, prompt realism, lexical limitations, and aggregate assertions were checked with no findings.
### Optional
- Manual or environment:
  - [x] Inspected added prompts for realistic owner intent and absence of Skill identifier leakage; repository-native terms such as RSP Change and .rsp remain only where they are part of the user-visible domain.
- Coverage:
  - Deterministic lexical holdouts do not prove host- or provider-specific trigger behavior.

## Blockers
- none
