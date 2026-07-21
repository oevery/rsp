---
kind: "fix"
---

# Change: fix-rsp-review-production-chain

## Proposal
- Summary: Require `rsp-review` to verify that a changed production consumer actually reaches a defective or recommended seam.
- Why:
  - In the real-derived stateful-media holdout, the reviewer correctly diagnosed provider-abort normalization in an adapter but twice failed to notice that the production workflow bypassed that adapter, so its suggested fix would not repair live behavior.
- Scope:
  - Add one general production-chain rule to `skills/rsp-review/SKILL.md`, lock it with a static contract test, and re-evaluate the affected holdout plus the frozen review suite.
- Non-goals:
  - Adding domain checklists, changing review output wording, broadening authority discovery, or weakening bounded inspection and context-cost gates.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: A review finding or suggested correction that depends on an adapter, wrapper, validator, normalizer, or similar seam verifies the direct production consumer and whether the changed live path reaches that seam.
  - The reviewer reports a bypass when an otherwise-correct seam fix would not affect production behavior.
  - Inspection remains bounded to the smallest direct behavior chain needed to settle the concrete finding.

### Acceptance
#### Scenario: adapter correction is disconnected from production
- GIVEN a reviewed adapter violates an explicit cancellation contract and a changed production workflow calls the provider directly
- WHEN the reviewer diagnoses the adapter defect or recommends correcting that seam
- THEN it inspects the direct production consumer and reports that the live path bypasses the adapter
- AND it does not claim an adapter-only correction repairs production cancellation behavior

## Design
- Approach:
  - Treat the retained `real-stateful-media-round-2` miss as the minimal reproduction: authority and files were available, but the current stop rule did not require live-path reachability after finding an adapter defect.
  - Add one generalized sentence to the existing bounded Code review procedure rather than a domain-specific checklist or another reference file.
- Affected areas:
  - `skills/rsp-review/SKILL.md`
  - `test/skill-contract.test.ts`
  - `test/skill-behavior/fixtures/real-stateful-media-round-2/`
  - `research/evaluations/rsp-review/`
- Constraints:
  - Preserve read-only authority, separate Code/Document verdicts, existing fixture recall, zero mutation, fixed source identities, and the established `30%` aggregate / `50%` per-case median input-cost limits.

## Tasks
- [x] Finalize the proposal, spec, design, root-cause ranking, and minimal reproduction.
- [x] Add the production-seam reachability contract and static regression.
- [x] Re-run the affected holdout, a full real-derived matrix, and risk-selected regression cases; strengthen only repeated classification/restraint failures.
- [x] Run three fresh paired matrices and record behavior, mutation, identity, and cost results without relabeling the failed per-case cost gate.
- [x] Complete project/package validation, durable review, staged-snapshot verification, and archive; scoped commit is the terminal operation.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/skill-behavior.test.ts` passed (2 files, 17 tests).
  - [x] Build, typecheck, lint, and the isolated staged-snapshot full suite passed (11 files, 265 tests).
  - [x] Agent Skills schema, focused and all-open RSP checks, doctor, package dry-run, and `git diff --check` passed.
- Manual:
  - [x] The final candidate reports the production adapter bypass in `real-stateful-media-round-2`, keeps authority-only documents skipped, preserves simple-fix restraint, and does not mutate the worktree.
- Durable updates:
  - [x] Updated the canonical review behavior in `.rsp/specs/design.md`; no Decision Record is needed for this bounded correction.

## Blockers
- none
