---
kind: "fix"
---

# Change: decouple-retained-evidence-release-identity

## Proposal
- Outcome: Retained native-composition evidence remains reusable across release-only version changes while continuing to fail closed on evaluated behavior drift.
- Why:
  - The current artifact comparison treats `package.json.version` as evaluated behavior, so finalizing a release identity invalidates an otherwise identical real-host run and encourages duplicate retained evidence.
- Scope:
  - Separate current behavioral-artifact compatibility from the recorded package release identity in the native composition evaluator.
  - Keep exact package identity recorded and integrity-checked as provenance of the original run.
  - Add focused regression coverage for version-only drift and behavioral drift.
- Non-goals:
  - Do not weaken retained evidence integrity, input identity, exact-command, Skill inventory, Skill hash, or package behavior-file gates.
  - Do not select, publish, tag, or otherwise finalize a release version.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Retained behavioral evidence compatibility excludes mutable release identity.
  - A change only to the current package version does not invalidate retained native-composition evidence.
  - The original evaluated package name, version, and tarball hash remain recorded and integrity-protected in retained metadata.
- Requirement: Behavioral evidence continues to fail closed.
  - A changed evaluated Skill file, Skill tree, published Skill inventory, or package behavior file invalidates the retained evidence for the current artifact.

### Acceptance
#### Scenario: Finalize a version after behavioral validation
- GIVEN a passing retained run whose Skill and package behavior hashes match the current checkout
- WHEN only `package.json.version` differs from the recorded run
- THEN the current behavioral-artifact gate remains passing without creating another real-host run

#### Scenario: Evaluated behavior changes
- GIVEN a passing retained run
- WHEN an evaluated Skill or package behavior-file hash differs
- THEN the current behavioral-artifact gate fails closed

## Design
- Approach:
  - Define current compatibility from package name plus the complete evaluated behavior fingerprint; omit version from that comparison.
  - Preserve exact-package validation inside the retained run score and provenance gates so the historical execution remains attributable to one immutable package.
- Boundaries:
  - `validateCurrentNativeDesignArtifact` owns current-checkout compatibility; retained metadata and score own historical run integrity and package provenance.
- Affected areas:
  - `scripts/native-design-composition-eval.mjs`
  - `test/native-design-composition.test.ts`
- Constraints:
  - Version-only reuse must not permit name, inventory, Skill hash/tree, behavior-file, evidence payload, or input drift.
  - Existing retained evidence stays immutable; no real-host rerun is required for this code-only fix.

## Tasks
- [x] Remove release version from current behavioral-artifact compatibility.
- [x] Cover version-only compatibility and retained behavioral drift.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/native-design-composition.test.ts` (isolated `c232f07` worktree plus this Change diff; 14 tests passed) — proves: retained evidence accepts version-only drift and rejects evaluated behavior or integrity drift.
- Manual or environment:
  - [x] Inspected `validateCurrentNativeDesignArtifact` separately from retained `exact_package`, score, and integrity gates; no external environment is required.
- Coverage:
  - A new real-host run is intentionally omitted because the behavioral Skill suite is unchanged by this Change.

## Blockers
- none
