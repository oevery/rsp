---
kind: "fix"
---

# Change: simplify-release-operation-tracking

## Proposal
- Outcome: Make a confirmed mechanical release a direct, transiently coordinated operation instead of requiring a redundant RSP Change, while retaining optional durable tracking for materially complex releases.
- Why:
  - Version manifests, changelog, release commit, tag, hosted release, and registry record already provide durable release history; a mandatory Release Change duplicates the same identity, checks, and prose in the archive.
  - The beta.1 workflow demonstrated that requiring a Release Change adds artifact noise without improving authority or recoverability for a single clean publication.
- Scope:
  - Let explicit user or authoritative repository release identity and range enter draft/finalize/reconcile without a selected Release Change.
  - Keep the release ledger and publication handoff transient by default while preserving the independent release commit and exact-candidate checks.
  - Define when an optional Release Change is justified by durable decisions, coordination, recovery, blockers, or acceptance ownership.
  - Align Core, `rsp-release-docs`, `rsp-manage`, fallback rules, stable spec, and contract tests.
- Non-goals:
  - Do not remove Change tracking for complex releases, weaken identity confirmation, infer Git/publication authority, or rewrite the published beta.1 archive, tag, release, or package.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: mechanical release operations do not require an RSP Change
  - An explicit release request with an owner-confirmed identity and range may draft, finalize, publish under separate authority, and reconcile without creating or selecting a Release Change.
  - Its evidence ledger, command progress, authentication state, and readiness handoff remain transient; package manifests, changelog, release commit, tag, hosted release, and registry record are the durable release surfaces.
- Requirement: Release Changes are optional and justified by durable coordination needs
  - Use one only when unresolved material version/range, migration, rollback, security, compatibility, cross-repository/team, multi-stage handoff, recovery, blocker, or acceptance decisions need a persistent owner.
  - Ordinary implementation Changes still complete and, when authorized, commit independently before a separate release commit finalizes versioned surfaces.

### Acceptance
#### Scenario: publish a confirmed mechanical release
- GIVEN a clean committed range and an explicitly confirmed version
- WHEN the user requests release finalization and publication
- THEN Core routes directly to `rsp-release-docs`, keeps the ledger transient, creates no RSP Change, and binds readiness to the exact release commit

#### Scenario: release needs durable coordination
- GIVEN unresolved cross-stage decisions or external acceptance that must survive interruption
- WHEN release work is shaped
- THEN an optional Release Change may own those decisions and blockers without becoming mandatory for ordinary releases

## Design
- Approach:
  - Replace mandatory Release Change ownership with an explicit release-operation authority object: confirmed identity/range, allowed surfaces/actions, exact candidate, and observed external state.
  - Keep optional Change ownership as an escalation path only for durable coordination.
- Boundaries:
  - Core owns routing, `rsp-release-docs` owns transient ledger and release surfaces, Git/tag/registry/forge remain external owners, and optional Release Changes own only material durable coordination.
- Affected areas:
  - `skills/rsp/`, `skills/rsp-release-docs/`, `skills/rsp-manage/`
  - `rules/rsp-rules.md`, `.rsp/rsp-rules.md`, `.rsp/specs/design.md`, and focused contract tests
- Constraints:
  - Preserve late identity confirmation, publication-invariant shipped prose, credential safety, exact-ref validation, and separate external-action authority.
  - Do not alter beta.1 release identity surfaces as part of this workflow fix.

## Tasks
- [x] Make Change-less mechanical release routing the default in Core and release-docs.
- [x] Define the optional Release Change eligibility boundary and managed handoff behavior.
- [x] Synchronize fallback/spec and add focused contract coverage.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-release-docs-skill-contract.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts test/helpers.test.ts` passed 4 files / 86 tests — proves: mechanical releases need no Change while complex release tracking, authority, and commit boundaries remain explicit.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` passed all composition, phase, isolation, package, and retained-integrity gates for `device-discovery-boundary-simplify-release-operation-tracking`.
  - [x] `mise exec -- pnpm run release:check` passed metadata, build, typecheck, lint, 44 test files / 485 tests, and clean-install SHA-256 `e1a153b9400d84a20d5117939f385a3ba0004efd2a764d482c133efb905a8364`.
- Manual or environment:
  - [x] Fixed-scope review confirms beta.1 versioned release surfaces are unchanged and the prior archive remains historical.
- Coverage:
  - Native composition evidence must be refreshed because published Skill and fallback behavior changes; no external release action is in scope.

## Blockers
- none
