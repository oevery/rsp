---
kind: "fix"
---

# Change: reuse-provider-evidence-in-candidate-check

## Proposal
- Outcome: Reuse still-applicable provider comparison evidence during exact candidate checks without invoking an AI provider.
- Why:
  - Exact candidates should rerun deterministic acceptance, but release-only version and prose changes must not repeat an unchanged provider-backed comparison.
- Scope:
  - Add a deterministic provider-evidence gate to `release:candidate-check`.
  - Bind reuse to the prior release Skill composition plus the current contract, fixture, harness, and candidate Skill-composition hashes.
  - Document the invalidation and no-provider-execution boundary.
- Non-goals:
  - Reducing or skipping deterministic release acceptance.
  - Automatically running provider comparison, selecting a model, or granting release/publication authority.

## Spec
### MODIFIED
- Requirement: Exact candidate validation reuses provider evidence only while provider-relevant identities remain unchanged.
  - If the compared Skill composition is unchanged from the prior release, provider evidence is not required.
  - If it changed, a passed report with matching baseline and candidate composition, contract, fixture, harness, and complete paired correctness evidence is required.
  - Candidate commit/fingerprint drift caused only by final release surfaces does not invalidate otherwise matching provider evidence.
  - Missing or stale evidence fails closed with an explicit manual provider-comparison handoff; the candidate command never invokes a provider.

### Acceptance
#### Scenario: Reuse matching provider evidence
- GIVEN compared Skill behavior changed since the prior release and a passed three-pair provider report matches all provider-relevant identities
- WHEN the exact candidate check runs after release-only finalization
- THEN it reuses that report, runs deterministic acceptance, and performs no provider call

#### Scenario: Reject stale or missing provider evidence
- GIVEN compared Skill behavior changed and no passed report matches the current provider-relevant identities
- WHEN the exact candidate check runs
- THEN it fails before deterministic acceptance and instructs the maintainer to run provider comparison explicitly

#### Scenario: No provider evidence required
- GIVEN the compared Skill composition is unchanged from the prior release
- WHEN the exact candidate check runs
- THEN it proceeds without requiring a provider report or invoking a provider

## Design
- Approach:
  - Add a provider-evidence checker between `release-candidate-check.mjs` and `release:acceptance` in the package lifecycle command.
  - Derive the prior release tag by excluding the target version tag from merged semantic-version tags.
  - Reuse the existing provider plan builder for deterministic identity calculation and scan non-overwriting local reports for one exact relevant match.
- Boundaries:
  - Report source commit/fingerprint remains provenance; reuse validity is owned by baseline/candidate composition and contract/fixture/harness identities.
  - Provider execution remains available only through the explicit `release:provider-compare` command.
- Affected areas:
  - Release scripts and package lifecycle wiring.
  - Release tests, distribution Spec, and maintainer Skill guidance.
- Constraints:
  - Fail closed on malformed reports, incomplete pairs, correctness failure, identity drift, or unavailable evidence.
  - Preserve the full deterministic `release:acceptance` rerun.

## Tasks
- [x] Add focused RED coverage for lifecycle ordering and provider evidence reuse/invalidation.
- [x] Implement the deterministic provider evidence checker without provider execution.
- [x] Update the distribution contract and release-acceptance Skill projection.
- [x] Run focused release tests and the repository-required verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-evidence-check.test.ts test/release/release-candidate-check.test.ts test/release/release-acceptance.test.ts` — 3 files / 23 tests passed; proves: evidence reuse, invalidation, and lifecycle ordering.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, `mise exec -- pnpm run test`, and `node dist/cli.mjs check reuse-provider-evidence-in-candidate-check --json` — passed; the full suite covered 87 files / 867 tests and the focused RSP check reported no errors or warnings.
### Optional
- Manual or environment:
  - [x] Built the current `v3.2.0` provider plan without execution and assessed the retained 2026-08-20 report — reused 3/3 evidence with candidate composition `93943f2db64c7c45082298d5a348faeb182e9c0fdaf8310eec5daeedd98be504`; no provider was invoked.
- Coverage:
  - Provider execution is intentionally not exercised by candidate validation.

## Blockers
- none
