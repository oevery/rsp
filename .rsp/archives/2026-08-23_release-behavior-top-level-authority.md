---
kind: "fix"
---

# Change: release-behavior-top-level-authority

## Proposal
- Outcome: Make managed-controller provider prompts expose the same top-level mutation authority that the evaluator enforces.
- Why:
  - The 2026-08-23 candidate run completed and committed the requested behavior but failed because it updated `.rsp/specs/design.md`, while `allowed_changes` was enforced only after execution and never appeared in the prompt.
- Scope:
  - Project top-level `allowed_changes` and `required_changes` into the generated prompt and cover the prompt contract deterministically.
- Non-goals:
  - Relaxing path gates, changing worker-assignment authority, or changing RSP Skill behavior to accommodate hidden evaluator state.

## Spec
### ADDED
- Requirement: Every execute-mode managed-controller run receives an explicit top-level mutation policy derived from its scored manifest.
  - The prompt names allowed paths and required changed paths; the evaluator continues to enforce the manifest independently.

### Acceptance
#### Scenario: Durable writeback is outside the allowed boundary
- GIVEN a fixture that permits only the Change, product source, and product test paths
- WHEN the generated prompt instructs the model to complete the task
- THEN it explicitly limits mutation to those paths and does not leave the Spec exclusion as hidden evaluator state

## Design
- Approach:
  - Add one concise machine-derived top-level mutation policy beside the request in `prepareManagedControllerRun`.
- Boundaries:
  - Keep manifest scoring authoritative; prompt projection is disclosure, not a second policy source.
- Affected areas:
  - Managed-controller prompt preparation and release behavior acceptance tests.
- Constraints:
  - The harness identity changes, so exact-identity provider evidence must be re-evaluated rather than edited or silently reused.

## Tasks
- [x] Expose top-level mutation authority in generated provider prompts.
- [x] Add focused regression coverage and run repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts` — passed 1 file / 14 tests; proves the prompt contains exact allowed and required paths while scoring remains unchanged.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed build, lint, 88 test files, and 872 tests; proves compatibility.
  - [x] `mise exec -- pnpm run docs:check` — passed 7 bilingual page pairs and 30 Markdown files; proves the durable distribution update is structurally valid.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors and 0 warnings; prove structural convergence.
### Optional
- Manual or environment:
  - [ ] Targeted `commit-release-surface-leakage` provider rerun.
- Coverage:
  - The provider rerun proves one real model follows the disclosed boundary; deterministic tests own prompt projection.

## Blockers
- none

## Durable Decisions
- Current facts: Update `.rsp/specs/distribution.md` to require prompt-visible top-level mutation authority for provider-backed behavior acceptance.
- Lasting rationale: No Decision Record is needed; prompt disclosure and host scoring remain two projections of the same fixture manifest.
