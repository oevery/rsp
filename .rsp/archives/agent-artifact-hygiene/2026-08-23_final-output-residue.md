---
kind: "feature"
---

# Change: agent-artifact-hygiene/final-output-residue

## Proposal
- Outcome: Prevent installed RSP workflows from persisting session-only rejected alternatives and correction history in final user-facing artifacts while retaining facts required for correctness, migration, safety, compatibility, audit, and truthful delivery.
- Why:
  - Current commit and release owners suppress chronology, but no shared evaluated contract covers comments, test names, commit prose, release prose, and final handoffs after long or corrected sessions.
- Scope:
  - Select one completed upstream recommendation, identify the smallest existing Skill owners, add deterministic contracts and unseen contrastive cases, and revise only the owners whose current behavior demonstrably misses the fixed acceptance contract.
- Non-goals:
  - A universal cleanup Skill, keyword bans, automatic history rewriting, hiding real removals or failures, changing product behavior, or installing upstream scripts.

## Spec
### ADDED
- Requirement: Finalization derives every protected surface from the accepted result and its authoritative baseline rather than from session chronology.
  - Session-only alternatives, assistant drafts, corrections, and reverted-in-session attempts are omitted unless the target audience needs them for a material factual reason.
- Requirement: Finalization preserves truthful negative facts when omission would misstate safety, compatibility, migration, audit, external actions, unresolved risk, or actual baseline change.
  - The behavior applies independently to artifact body, title or identifier, comments and test names, commit or release prose, and the final handoff.
- Requirement: Candidate behavior is evaluated for both residue suppression and task preservation.
  - A clean surface that loses a required fact fails acceptance.

### Acceptance
#### Scenario: Corrected implementation is finalized without session residue
- GIVEN an accepted implementation after a rejected session-only alternative and a neutral request to finish or deliver
- WHEN an installed RSP owner produces final artifacts and handoff prose
- THEN no protected surface identifies the result by the rejected alternative or correction history, while actual changes, verification, omissions, and material risks remain truthful

#### Scenario: Material negative facts survive hygiene
- GIVEN a real API removal, security exclusion, failed external action, migration requirement, or explicitly requested comparison
- WHEN the same finalization behavior runs
- THEN the necessary negative fact remains visible and accurate rather than being removed as residue

## Design
- Approach:
  - Use `research/upstreams/no-negative-echo/08dfa4ddde5e4ae2baa9ac9620b729dfb995fa6b.md` recommendations R1-R3 through `independent-reimplementation` for final-surface admission and contrastive evaluation, and `model-only` for existing readback reuse without a shipped scanner. Define three to five RSP-native behaviors, then compare current and candidate compositions on positive, collision, and pressure cases before promotion.
- Boundaries:
  - Keep implementation finalization, Git message derivation, release projection, and response handoff in their existing owners; add no parallel state or scanner dependency.
- Affected areas:
  - `skills/rsp-implement/`, `skills/rsp-commit/`, `skills/rsp-release-docs/`, or Core handoff guidance only where evaluation identifies the gap
  - Existing Skill contract and candidate-evaluation fixtures
- Constraints:
  - Cite the selected source report, recommendation, and `model-only` or `independent-reimplementation` adoption mode before product mutation.

## Tasks
- [x] Freeze an acceptance contract covering residue suppression and required-fact preservation.
- [x] Add deterministic contracts and current-versus-candidate cases before selecting the published Skill delta.
- [x] Revise only the existing implementation, commit, and release finalization owners demonstrated to own protected surfaces.
- [x] Run focused package, Skill, behavior, and full repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/rsp-implement-skill-contract.test.ts test/skills/rsp-commit-skill-contract.test.ts test/skills/rsp-release-docs-skill-contract.test.ts test/evaluation/skill-restraint-eval.test.ts` — passed 4 files / 27 tests; proves the protected finalization surfaces and downstream test-value taxonomy remain machine-checkable.
  - [x] `node scripts/skill-candidate-evaluation.mjs research/evaluations/rsp-skill-restraint/2026-08-23-final-output-residue/manifest.json` — returned `candidate-eligible` for two independently designed holdouts created after candidate freeze: a three-round in-flight coalescing correction and a breaking shell-execution safety boundary; no candidate failure, regression, or missing evidence.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed build, lint, 87 test files, and 858 tests after updating the managed-controller product-composition pin.
  - [x] `git diff --check` — passed; proves changed artifacts are syntactically clean.
### Optional
- Manual or environment:
  - [x] Fresh HEAD and frozen-candidate workers executed both unseen holdouts; each run used an isolated baseline-committed repository and exact Skill identity.
- Coverage:
  - Synthetic cases establish bounded behavior only; they do not prove universal host activation or semantic non-interference.

## Blockers
- none

## Durable Decisions
- Derive final handoffs from the accepted Change, actual changed paths, final verification, material omissions or risks, executed external actions, and required attribution of pre-existing user work. A rejected session-only alternative is not an omission or boundary and must not be converted into an unrequested compliance claim.
- Keep real removals, breaking changes, compatibility boundaries, migrations, failed external actions, unresolved risks, and requested comparisons visible when the audience needs them.
- Reuse existing owner readback and contract tests; do not add a runtime scanner, universal cleanup Skill, or keyword filter.

## Review Resolution
- Finding 1 `[P1] Candidate evaluation labeled tuning cases as unseen` — `accepted`. The exploratory corrected-queue and API-removal cases remain described only as candidate-shaping evidence. The promotion manifest now contains only two independently designed cases disclosed after candidate freeze, and all current and candidate runs are represented.
