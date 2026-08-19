---
kind: "feature"
---

# Change: skill-routing-evaluation

## Proposal
- Outcome: Add deterministic cross-Skill routing evaluation
- Why:
  - The published catalog has deterministic structure and behavior contracts, but no shared regression gate for realistic positive selection, hard near-miss rejection, pairwise owner precedence, or description collisions.
  - The user explicitly selected the previously deferred `addy-agent-skills` R1 recommendation after reviewing current open-source Skill evaluation practice.
- Scope:
  - Add one reusable evaluation dataset and deterministic evaluator for published Skill descriptions.
  - Establish the first focused corpus for the overlapping `rsp-review`, `rsp-resolve-findings`, `rsp-implement`, and `rsp-tdd` owners while checking description collisions across the complete published catalog.
  - Refine only the `rsp-review` discovery description when the retained natural-language case proves that its read-only owner boundary is lexically ambiguous.
  - Integrate the deterministic contract into the existing Vitest evaluation boundary and document the resulting maintainer contract.
- Non-goals:
  - Treat lexical ranking as proof of model behavior or replace provider-backed holdouts.
  - Run a provider, optimize Skill descriptions automatically, or add a second evaluation framework.
  - Change Skill procedure bodies, package scripts, Git state, release authority, or publication policy.

## Spec
### ADDED
- Requirement: The repository shall retain one deterministic routing manifest for selected published Skill owners.
  - Positive cases identify the expected owner and require it to rank first.
  - Hard negatives identify a near-miss owner that must not rank first and may name the expected competing owner.
  - Pairwise cases identify the expected owner and one competing owner whose score it must exceed.
- Requirement: The evaluator shall derive the published catalog from canonical `skills/*/SKILL.md` frontmatter rather than duplicating descriptions in the manifest.
- Requirement: Description-collision checks shall cover every published Skill and fail only at an explicit, versioned threshold.
- Requirement: Evaluation results shall expose case-level scores and failure reasons while making no semantic or provider-general claim.
- Requirement: The `rsp-review` description shall distinguish read-only review requests phrased as not modifying files from resolution work that starts from an existing fixed report.

### Acceptance
#### Scenario: Focused routing corpus passes
- GIVEN canonical published Skill descriptions and the registered positive, hard-negative, and pairwise cases
- WHEN the deterministic routing evaluator runs
- THEN every positive owner ranks first, every hard-negative exclusion holds, every pairwise owner beats its competitor, and no catalog description pair crosses the collision threshold

#### Scenario: Routing drift is diagnosed
- GIVEN a copied catalog or manifest with an intentionally weakened description or invalid expectation
- WHEN the evaluator runs
- THEN it returns a failed result naming the affected case, expected owner, observed ranking, and bounded score evidence

## Design
- Approach:
  - Store reusable cases under `evaluation/skill-routing/` and implement a host-neutral lexical scorer in `scripts/skill-routing-evaluation.mjs`.
  - Tokenize Skill names, descriptions, and prompts consistently; rank prompts with inverse-document-frequency-weighted query coverage plus bounded cosine similarity; use an explicit threshold only for description collisions.
  - Keep the evaluator importable for Vitest and executable directly for maintainer diagnostics without adding another package-script workflow.
- Boundaries:
  - Lexical evidence is a cheap regression detector that precedes, but never substitutes for, real host/provider selection evidence.
  - The manifest owns only selection expectations; compliance, authority boundaries, task results, costs, and workspace mutations remain owned by existing evaluators.
- Affected areas:
  - `evaluation/skill-routing/`
  - `scripts/skill-routing-evaluation.mjs`
  - `test/evaluation/skill-routing-evaluation.test.ts`
  - `skills/rsp-review/SKILL.md`
  - `.rsp/specs/distribution.md` and `research/models/skill-quality-and-governance.md`
- Constraints:
  - Use no provider, network call, generated run ledger, runtime dependency, or copied upstream implementation.
  - Preserve canonical Skill descriptions as the only catalog source and keep fixture assertions behavioral rather than source-string snapshots.

## Tasks
- [x] Add and validate the focused routing manifest.
- [x] Implement deterministic catalog loading, scoring, collision checks, and structured diagnostics.
- [x] Add focused tests for passing coverage and intentional routing drift.
- [x] Correct the evidenced `rsp-review` description ambiguity without changing its procedure body.
- [x] Reconcile the durable evaluation contract and recommendation status.

- [x] Resolve reopened concern: independent review found one P1 description-collision defect; the accepted fix passed clean re-review

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/skill-routing-evaluation.test.ts` — passed 3/3; proves: 32 focused routing cases, catalog-wide collision coverage, and intentional drift diagnostics are deterministic
  - [x] `mise exec -- pnpm run lint` — passed; proves: repository static quality remains valid
  - [x] `mise exec -- pnpm run test` — passed 854/854 across 86 files after a successful build; proves: the complete deterministic suite remains green
  - [x] Fixed-scope `rsp-review` against `d46deeaca0811d102707a18f439923d0a29a1ed2` — clean after correcting description-only collision scoring; proves: Code and Document pipelines have no remaining findings
### Optional
- Manual or environment:
  - [-] Provider-backed repeated trigger trials — omitted because this Change owns only the deterministic pre-provider gate
- Coverage:
  - Initial realistic prompt coverage for the two review owners and two implementation-discipline owners; catalog-wide description collision coverage for all published Skills.

## Blockers
- none
