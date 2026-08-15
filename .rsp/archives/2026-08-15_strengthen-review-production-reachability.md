---
kind: "fix"
---

# Change: strengthen-review-production-reachability

## Proposal
- Outcome: Make production reachability a hard gate before `rsp-review` returns `clean` for a changed seam whose behavior depends on shipped assembly or registration.
- Why:
  - The current contract requires reachability evidence before completing a seam-dependent Finding, but it does not apply the same gate when no Finding has yet been identified.
  - An isolated seam test can pass while a loader, bin, worker, subprocess, generated wire-up, or plugin registry still bypasses the changed implementation.
- Scope:
  - Strengthen the authored `rsp-review` code-review contract.
  - Add a real-world-derived behavior fixture and deterministic contract coverage for the missing-entry-path case.
- Non-goals:
  - Do not change review authority, report shape, severity, Git behavior, provider routing, or other RSP Skills.
  - Do not require broad end-to-end tests when static inspection or focused evidence proves the shipped entry path.

## Spec
### MODIFIED
- Requirement: Production reachability gates both seam-dependent Findings and a `clean` Code verdict.
  - For changed behavior that depends on registration, loading, generated wiring, a bin, worker, subprocess, plugin assembly, or another shipped entry path, review the smallest real production entry chain.
  - Direct or isolated seam tests are insufficient when they bypass that entry chain. Missing evidence or a bypass is actionable and prevents `clean`.
  - The reviewer must record the checked entry path or the missing evidence in Coverage or Finding evidence.

### Acceptance
#### Scenario: Isolated seam coverage hides broken production assembly
- GIVEN a changed adapter or implementation and a focused test that calls it directly
- AND the shipped loader, registry, worker, bin, subprocess, generated wiring, or plugin assembly does not reach the changed seam
- WHEN `rsp-review` reviews the fixed Code scope
- THEN the Code verdict is `issues_found`, not `clean`
- AND the report identifies the production bypass or missing reachability evidence.

#### Scenario: Shipped entry path is evidenced
- GIVEN a changed seam whose real production entry path is statically or dynamically verified to reach it
- WHEN no other actionable issue exists
- THEN production reachability does not by itself prevent a `clean` Code verdict.

## Design
- Approach:
  - Extend the existing Production reachability item in `code-review.md` instead of adding a new owner or generic integration-test mandate.
  - Add one behavior fixture where the implementation and direct test are correct but the shipped loader remains wired to the legacy implementation.
- Boundaries:
  - Evidence may be static call-chain inspection or focused runtime verification; the contract does not prescribe a test framework.
  - Keep Findings anchored to the changed seam and its smallest shipped entry chain.
- Affected areas:
  - `skills/rsp-review/references/code-review.md`
  - `test/skill-behavior/fixtures/` and `test/skill-behavior.test.ts`
- Constraints:
  - Preserve the current report schema and read-only authority.
  - Edit authored Skill sources only; `.agents/skills/` remains generated projection.

## Tasks
- [x] Strengthen the production-reachability contract before `clean`.
- [x] Add and validate the broken-production-assembly behavior fixture.
- [x] Run focused and repository-required verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-behavior.test.ts test/skill-contract.test.ts` — passed: 2 files / 23 tests; proves the new fixture and authored Skill contract are structurally covered.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed: build and lint succeeded, and the full suite passed 74 files / 800 tests; proves package, style, and repository regression compatibility.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with zero errors and zero warnings; proves Change structure and edited artifacts remain valid.
### Optional
- Manual or environment:
  - [ ] Run a provider-backed current/candidate evaluation for the new fixture before a release candidate.
- Coverage:
  - Covers the published review contract, a deterministic real-world-derived fixture where direct tests bypass the shipped loader, fixture preparation, package build, lint, and repository regression. Provider-backed reviewer behavior remains optional release-candidate evidence.

## Blockers
- none
