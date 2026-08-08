---
kind: "refactor"
---

# Change: structural-simplification/verification-structure

## Proposal
- Outcome: Strengthen semantic documentation checks and split integration-test ownership
- Why:
  - Evergreen README and getting-started pages identify RSP 3.1 while the current package and release are 3.2.
  - `docs:check` validates page pairing and links but cannot detect stale release or engine semantics.
  - One 4,000-line integration test file owns unrelated command domains through shared setup.
- Scope:
  - Remove unnecessary version duplication from evergreen setup prose and add bounded semantic documentation assertions.
  - Split integration scenarios into stable domain modules while preserving one controlled CLI harness.
- Non-goals:
  - Rewrite public documentation, change release history, change Vitest execution semantics, or duplicate fixtures across test files.

## Spec
### MODIFIED
- Requirement: Repository verification detects drift at the same semantic surface users consume.
  - Evergreen setup documentation derives compatibility claims from current package requirements without stale release identity.
  - Documentation checks cover paired pages, links, and a small set of authoritative semantic invariants.
  - CLI integration scenarios are organized by command/domain owner while retaining shared end-to-end setup.

### Acceptance
#### Scenario: Evergreen setup drift fails documentation checks
- GIVEN current package engine and stable invocation requirements
- WHEN README or getting-started prose contradicts those facts
- THEN `docs:check` fails with the conflicting surface

#### Scenario: Integration behavior remains unchanged after modularization
- GIVEN the existing integration scenario corpus
- WHEN tests are registered from domain-owned modules through the shared harness
- THEN the same command behaviors execute without duplicated global setup or lost assertions

## Design
- Approach:
  - Keep release-specific prose in release records and make evergreen setup wording release-neutral.
  - Extend `docs-check.mjs` with explicit checks for the small authoritative setup contract.
  - Move integration `describe` groups into non-test registration modules imported by one entry and shared harness.
- Boundaries:
  - Preserve the current single build/setup lifecycle for CLI integration tests.
  - Do not generate translations or require sentence-level equality.
- Affected areas:
  - README.md, README.zh-CN.md, docs/site/*/getting-started.md, and scripts/docs-check.mjs
  - test/integration.test.ts and test/integration/ domain modules
- Constraints:
  - Semantic assertions use authoritative package/config data and remain language-tolerant.
  - Test movement does not alter product code or weaken assertions.

## Tasks
- [x] Make evergreen setup prose release-neutral and add focused semantic documentation checks.
- [x] Extract a shared integration harness and split scenario registration by stable command domain.
- [x] Preserve the complete existing integration scenario count and behavior.
- [x] Update the owning CLI/distribution Specs for the new verification boundary.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run docs:check` — passed on 2026-08-07; bilingual structure, links, and setup semantics pass.
  - [x] `mise exec -- pnpm exec vitest run test/integration.test.ts test/clean-install-check.test.ts test/release-metadata-check.test.ts` — passed 3 files / 194 tests on 2026-08-07; integration behavior and package-facing checks pass.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — passed on 2026-08-07.
### Optional
- Manual or environment:
  - [ ] Build the VitePress site and inspect setup headings and commands.
- Coverage:
  - Full repository tests and docs build remain the Group integration gate.

## Blockers
- None.
